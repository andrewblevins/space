import React, { useEffect, useState } from 'react';
import Bust from './Bust.jsx';
import { hueFor, modelLabel } from './advisorStyle.js';

export default function Panel({ advisors, inactive, compact, modelOptions, defaultModel, onToggle, onEdit, onCreate, onSetModel }) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [picking, setPicking] = useState(null); // advisor id whose model menu is open

  useEffect(() => {
    if (!picking) return;
    const close = () => setPicking(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [picking]);

  const submit = (e) => {
    e.preventDefault();
    if (name.trim()) onCreate(name.trim());
    setName('');
    setNaming(false);
  };

  return (
    <section className={`panel ${compact ? 'compact' : ''}`}>
      {advisors.map((a) => {
        const asleep = inactive.has(a.id);
        return (
          <div
            key={a.id}
            className={`niche ${asleep ? 'asleep' : ''}`}
            style={{ '--hue': hueFor(a.id) }}
          >
            <button
              className="niche-body"
              onClick={() => onToggle(a.id)}
              title={asleep ? `Wake ${a.name}` : `Let ${a.name} rest`}
            >
              <Bust advisor={a} size={compact ? 'small' : 'large'} />
              <span className="niche-name">{a.name}</span>
              {!compact && a.epithet && <span className="niche-epithet">{a.epithet}</span>}
            </button>
            <div className={`niche-meta ${picking === a.id ? 'pinned' : ''}`}>
              <div className="model-picker">
                <button
                  className="model-tag"
                  title={a.model || defaultModel}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPicking(picking === a.id ? null : a.id);
                  }}
                >
                  {modelLabel(a.model || defaultModel)} ▾
                </button>
                {picking === a.id && (
                  <div className="model-menu" onClick={(e) => e.stopPropagation()}>
                    {modelOptions.map((m) => (
                      <button
                        key={m.id}
                        className={(a.model || defaultModel) === m.id ? 'current' : ''}
                        onClick={() => {
                          onSetModel(a, m.id);
                          setPicking(null);
                        }}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {a.sources.length > 0 && (
                <span className="model-tag" title={a.sources.join('\n')}>
                  {a.sources.length} {a.sources.length === 1 ? 'text' : 'texts'}
                </span>
              )}
              <button className="link" onClick={() => onEdit(a)}>
                edit
              </button>
            </div>
          </div>
        );
      })}
      <div className="niche add">
        {naming ? (
          <form onSubmit={submit} className="add-form">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => !name && setNaming(false)}
              placeholder="Name"
            />
          </form>
        ) : (
          <button className="niche-body" onClick={() => setNaming(true)} title="New advisor">
            <div className={`bust bust-${compact ? 'small' : 'large'} empty`}>
              <span className="monogram">+</span>
            </div>
            {!compact && <span className="niche-name">New advisor</span>}
          </button>
        )}
      </div>
    </section>
  );
}
