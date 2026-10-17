import React, { useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import Bust from './Bust.jsx';
import { hueFor, money } from './advisorStyle.js';

export default function Conversation({ convo, advisors }) {
  const end = useRef(null);
  const byId = Object.fromEntries(advisors.map((a) => [a.id, a]));
  const lastRound = convo.rounds[convo.rounds.length - 1];
  const streamedChars = lastRound?.responses.reduce((n, r) => n + (r.text?.length || 0), 0);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [convo.rounds.length, streamedChars]);

  return (
    <section className="conversation">
      {convo.rounds.map((round, i) => (
        <article className="round" key={i}>
          <div className="you">
            <Markdown>{round.user}</Markdown>
          </div>
          <div className="voices" style={{ '--cols': Math.min(round.responses.length, 4) }}>
            {round.responses.map((r) => {
              // Fall back to a name-only stand-in when the advisor's folder has since been removed.
              const advisor = byId[r.advisorId] || { id: r.advisorId, name: r.name, portrait: null };
              return (
                <div
                  key={r.advisorId}
                  className={`voice ${r.pending ? 'pending' : ''} ${r.error ? 'errored' : ''}`}
                  style={{ '--hue': hueFor(r.advisorId) }}
                >
                  <header>
                    <Bust advisor={advisor} size="tiny" />
                    <span className="voice-name">{r.name}</span>
                    {r.cost != null && <span className="voice-cost">{money(r.cost)}</span>}
                  </header>
                  <div className="voice-text">
                    {r.text ? <Markdown>{r.text}</Markdown> : r.pending ? <span className="breath" /> : null}
                    {r.error && <p className="error">{r.error}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      ))}
      <div ref={end} />
    </section>
  );
}
