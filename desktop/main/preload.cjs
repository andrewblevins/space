const { contextBridge, ipcRenderer } = require('electron');

const on = (channel) => (fn) => {
  const listener = (_e, payload) => fn(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld('space', {
  snapshot: () => ipcRenderer.invoke('vault:snapshot'),
  loadConversation: (id) => ipcRenderer.invoke('vault:loadConversation', id),
  saveConversation: (convo) => ipcRenderer.invoke('vault:saveConversation', convo),
  newConversationId: (text) => ipcRenderer.invoke('vault:newConversationId', text),
  createAdvisor: (name) => ipcRenderer.invoke('vault:createAdvisor', name),
  setModel: (slug, model) => ipcRenderer.invoke('vault:setModel', slug, model),
  open: (rel) => ipcRenderer.invoke('vault:open', rel),
  reveal: (rel) => ipcRenderer.invoke('vault:reveal', rel),
  updateSettings: (patch) => ipcRenderer.invoke('settings:update', patch),
  chooseVault: () => ipcRenderer.invoke('settings:chooseVault'),
  send: (args) => ipcRenderer.invoke('chat:send', args),
  keyUsage: () => ipcRenderer.invoke('usage:key'),
  stop: (requestId) => ipcRenderer.invoke('chat:stop', requestId),
  onVaultChanged: on('vault:changed'),
  onStart: on('chat:start'),
  onDelta: on('chat:delta'),
  onDone: on('chat:done'),
});
