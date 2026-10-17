// App settings live in Electron's userData folder, not the vault, so the vault
// can be shared or synced without leaking keys. Keys are encrypted with the OS
// keychain via safeStorage when it's available.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, safeStorage } from 'electron';

const file = () => path.join(app.getPath('userData'), 'settings.json');

function read() {
  try {
    return JSON.parse(fs.readFileSync(file(), 'utf8'));
  } catch {
    return {};
  }
}

function write(data) {
  fs.mkdirSync(path.dirname(file()), { recursive: true });
  fs.writeFileSync(file(), JSON.stringify(data, null, 2));
}

const seal = (v) =>
  safeStorage.isEncryptionAvailable()
    ? { enc: safeStorage.encryptString(v).toString('base64') }
    : { plain: v };

const unseal = (v) => {
  if (!v) return '';
  if (v.enc) return safeStorage.decryptString(Buffer.from(v.enc, 'base64'));
  return v.plain || '';
};

// When running from a checkout (not a packaged build), fall back to the
// OPENROUTER_API_KEY in the repo's root .env, the one the web app already uses.
function repoEnvKey() {
  if (app.isPackaged) return '';
  try {
    const env = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env');
    const line = fs.readFileSync(env, 'utf8').match(/^(?:VITE_)?OPENROUTER_API_KEY\s*=\s*"?([^"\s]+)"?/m);
    return line ? line[1] : '';
  } catch {
    return '';
  }
}

export function getVaultPath() {
  return process.env.SPACE_VAULT || read().vaultPath || path.join(os.homedir(), 'space-vault');
}

export function getKey() {
  return process.env.OPENROUTER_API_KEY || unseal(read().openrouterKey) || repoEnvKey();
}

export function publicSettings() {
  const env = process.env.OPENROUTER_API_KEY;
  const saved = unseal(read().openrouterKey);
  return {
    vaultPath: getVaultPath(),
    hasKey: Boolean(getKey()),
    keySource: env ? 'environment' : saved ? 'saved' : repoEnvKey() ? 'repo .env' : null,
  };
}

export function updateSettings({ openrouterKey, vaultPath }) {
  const s = read();
  if (openrouterKey !== undefined) s.openrouterKey = openrouterKey ? seal(openrouterKey.trim()) : undefined;
  if (vaultPath) s.vaultPath = vaultPath;
  write(s);
}
