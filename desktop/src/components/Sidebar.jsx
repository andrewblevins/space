import React from 'react';

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

export default function Sidebar({ open, onToggle, conversations, currentId, busy, onNew, onOpen, onReveal, onSettings }) {
  return (
    <aside className={`sidebar ${open ? '' : 'closed'}`}>
      <button className="sidebar-toggle" onClick={onToggle} title={open ? 'Hide' : 'Show conversations'}>
        {open ? '‹' : '›'}
      </button>
      {open && (
        <>
          <div className="wordmark">SPACE</div>
          <button className="new-convo" onClick={onNew} disabled={busy}>
            New conversation
          </button>
          <nav className="convo-list">
            {conversations.map((c) => (
              <button
                key={c.id}
                className={`convo ${c.id === currentId ? 'current' : ''}`}
                onClick={() => onOpen(c.id)}
                disabled={busy}
              >
                <span className="convo-title">{c.title}</span>
                <span className="convo-date">{fmt(c.created)}</span>
              </button>
            ))}
          </nav>
          <footer className="sidebar-foot">
            <button className="link" onClick={onReveal}>
              Show in Finder
            </button>
            <button className="link" onClick={onSettings}>
              Settings
            </button>
          </footer>
        </>
      )}
    </aside>
  );
}
