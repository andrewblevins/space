import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } from 'electron';
import * as vault from './vault.js';
import * as settings from './settings.js';
import { buildMessages, buildSystemPrompt, streamAdvisor } from './providers.js';
import { DEFAULT_MODEL, MODEL_OPTIONS } from './models.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.join(here, '..', 'seed');

// Serves files from inside the vault (portraits) to the renderer.
protocol.registerSchemesAsPrivileged([
  { scheme: 'vault', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

let win;
let watcher;
const inflight = new Map();

function vaultPath() {
  return settings.getVaultPath();
}

function snapshot() {
  const v = vaultPath();
  return {
    ...settings.publicSettings(),
    defaultModel: DEFAULT_MODEL,
    modelOptions: MODEL_OPTIONS,
    advisors: vault.listAdvisors(v),
    conversations: vault.listConversations(v),
  };
}

// Users edit advisor files in their own editor; the panel follows along.
function watchVault() {
  watcher?.close();
  let timer;
  try {
    watcher = fs.watch(vaultPath(), { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => win?.webContents.send('vault:changed', snapshot()), 150);
    });
  } catch (err) {
    console.error('vault watch failed', err);
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0e0d0c',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(here, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
    },
  });
  // External links open in the browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  if (process.env.SPACE_DEV_URL) win.loadURL(process.env.SPACE_DEV_URL);
  else win.loadFile(path.join(here, '..', 'dist', 'index.html'));
  if (process.env.SPACE_CAPTURE) captureAndQuit(process.env.SPACE_CAPTURE, process.env.SPACE_CAPTURE_JS);
}

// For visual checks: SPACE_CAPTURE=out.png [SPACE_CAPTURE_JS="...click something..."] npm start
function captureAndQuit(out, js) {
  win.webContents.once('did-finish-load', async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    await wait(800);
    if (js) await win.webContents.executeJavaScript(js);
    await wait(800);
    fs.writeFileSync(out, (await win.webContents.capturePage()).toPNG());
    app.quit();
  });
}

app.whenReady().then(() => {
  vault.ensureVault(vaultPath(), SEED_DIR);

  protocol.handle('vault', (req) => {
    const url = new URL(req.url);
    const rel = decodeURIComponent(url.host + url.pathname);
    return net.fetch(pathToFileURL(vault.resolveInVault(vaultPath(), rel)).toString());
  });

  ipcMain.handle('vault:snapshot', () => snapshot());
  ipcMain.handle('vault:loadConversation', (_e, id) => vault.loadConversation(vaultPath(), id));
  ipcMain.handle('vault:saveConversation', (_e, convo) => vault.saveConversation(vaultPath(), convo));
  ipcMain.handle('vault:newConversationId', (_e, text) => vault.newConversationId(text));
  ipcMain.handle('vault:createAdvisor', (_e, name) => {
    const rel = vault.createAdvisor(vaultPath(), name);
    shell.openPath(vault.resolveInVault(vaultPath(), rel));
    return rel;
  });
  ipcMain.handle('vault:setModel', (_e, slug, model) => vault.setAdvisorModel(vaultPath(), slug, model));
  ipcMain.handle('vault:open', (_e, rel) => shell.openPath(vault.resolveInVault(vaultPath(), rel)));
  ipcMain.handle('vault:reveal', (_e, rel) => shell.showItemInFolder(vault.resolveInVault(vaultPath(), rel || '.')));

  ipcMain.handle('settings:update', (_e, patch) => {
    settings.updateSettings(patch);
    vault.ensureVault(vaultPath(), SEED_DIR);
    watchVault();
    return snapshot();
  });
  ipcMain.handle('settings:chooseVault', async () => {
    const res = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] });
    return res.canceled ? null : res.filePaths[0];
  });

  // Fan a message out to every active advisor in parallel. Deltas stream back
  // tagged with the advisor id; the renderer owns the conversation state and saves it.
  ipcMain.handle('chat:send', async (e, { requestId, rounds, userText, advisorIds }) => {
    const key = settings.getKey();
    const controller = new AbortController();
    inflight.set(requestId, controller);
    const send = (channel, payload) => !e.sender.isDestroyed() && e.sender.send(channel, { requestId, ...payload });

    await Promise.all(
      advisorIds.map(async (id) => {
        try {
          const advisor = vault.readAdvisor(vaultPath(), id);
          if (!advisor) throw new Error(`Advisor "${id}" no longer exists on disk.`);
          const model = advisor.model || DEFAULT_MODEL;
          send('chat:start', { advisorId: id, model, name: advisor.name });
          await streamAdvisor({
            key,
            model,
            system: buildSystemPrompt(advisor, vault.readAdvisorSources(vaultPath(), advisor)),
            messages: buildMessages(rounds, id, userText),
            signal: controller.signal,
            onDelta: (text) => send('chat:delta', { advisorId: id, text }),
          });
          send('chat:done', { advisorId: id });
        } catch (err) {
          const aborted = controller.signal.aborted;
          send('chat:done', { advisorId: id, error: aborted ? 'Stopped.' : err.message || String(err) });
        }
      }),
    );
    inflight.delete(requestId);
  });
  ipcMain.handle('chat:stop', (_e, requestId) => inflight.get(requestId)?.abort());

  createWindow();
  watchVault();
});

app.on('window-all-closed', () => app.quit());
