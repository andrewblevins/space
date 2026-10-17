import React, { useState } from 'react';

const SOURCE_NOTE = {
  environment: 'from OPENROUTER_API_KEY',
  saved: 'saved',
  'repo .env': "using the web app's key from the repo .env",
};

export default function Settings({ snap, onClose, onSave }) {
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [vaultPath, setVaultPath] = useState(snap.vaultPath);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    const patch = {};
    if (openrouterKey) patch.openrouterKey = openrouterKey;
    if (vaultPath !== snap.vaultPath) patch.vaultPath = vaultPath;
    await onSave(patch);
    setOpenrouterKey('');
    setSaved(true);
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>

        <label>
          <span>Vault folder</span>
          <div className="row">
            <input value={vaultPath} onChange={(e) => setVaultPath(e.target.value)} />
            <button
              onClick={async () => {
                const p = await window.space.chooseVault();
                if (p) setVaultPath(p);
              }}
            >
              Choose…
            </button>
          </div>
          <small>Advisors and conversations are plain markdown here. Point it inside an Obsidian vault if you like.</small>
        </label>

        <label>
          <span>
            OpenRouter API key {snap.keySource && <em>· {SOURCE_NOTE[snap.keySource]}</em>}
          </span>
          <input
            type="password"
            value={openrouterKey}
            placeholder={snap.hasKey ? 'Enter a new key to replace it' : 'sk-or-…'}
            onChange={(e) => setOpenrouterKey(e.target.value)}
          />
          <small>
            One key reaches every model. Each advisor's <code>model:</code> line is an OpenRouter model id, like{' '}
            <code>anthropic/claude-sonnet-5.5</code> or <code>openai/gpt-6.1-sol</code>. Keys stay on this machine,
            encrypted with your system keychain.
          </small>
        </label>

        <div className="modal-actions">
          {saved && <span className="saved">Saved.</span>}
          <button onClick={onClose}>Close</button>
          <button className="primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
