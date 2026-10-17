import React, { useCallback, useEffect, useRef, useState } from 'react';
import Panel from './components/Panel.jsx';
import Conversation from './components/Conversation.jsx';
import Composer from './components/Composer.jsx';
import Sidebar from './components/Sidebar.jsx';
import Settings from './components/Settings.jsx';

const ACTIVE_KEY = 'space.inactiveAdvisors';

function loadInactive() {
  try {
    return new Set(JSON.parse(localStorage.getItem(ACTIVE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

// Strip transient fields before writing to disk or sending as history.
const clean = (rounds) =>
  rounds.map((r) => ({
    user: r.user,
    responses: r.responses.map(({ pending, ...rest }) => rest),
  }));

export default function App() {
  const [snap, setSnap] = useState(null);
  const [inactive, setInactive] = useState(loadInactive);
  const [convo, setConvo] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Source of truth for the open conversation; `convo` state mirrors it for rendering.
  const convoRef = useRef(null);
  const showConvo = (c) => {
    convoRef.current = c;
    setConvo(c);
  };

  useEffect(() => {
    window.space.snapshot().then((s) => {
      setSnap(s);
      if (!s.hasKey) setShowSettings(true);
    });
    return window.space.onVaultChanged(setSnap);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify([...inactive]));
    } catch {}
  }, [inactive]);

  // Streaming events from the main process update the last round in place.
  useEffect(() => {
    // Update the ref synchronously so the save after a send sees every event,
    // even ones React hasn't rendered yet.
    const patch = (advisorId, fn) => {
      const c = convoRef.current;
      if (!c) return;
      const rounds = c.rounds.slice();
      const last = { ...rounds[rounds.length - 1] };
      last.responses = last.responses.map((r) => (r.advisorId === advisorId ? fn(r) : r));
      rounds[rounds.length - 1] = last;
      convoRef.current = { ...c, rounds };
      setConvo(convoRef.current);
    };
    const offs = [
      window.space.onStart(({ advisorId, model, name }) => patch(advisorId, (r) => ({ ...r, model, name }))),
      window.space.onDelta(({ advisorId, text }) => patch(advisorId, (r) => ({ ...r, text: r.text + text }))),
      window.space.onDone(({ advisorId, error }) =>
        patch(advisorId, (r) => ({ ...r, pending: false, ...(error ? { error } : {}) })),
      ),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  const advisors = snap?.advisors || [];
  const activeAdvisors = advisors.filter((a) => !inactive.has(a.id));

  const toggleAdvisor = (id) =>
    setInactive((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const send = useCallback(
    async (text) => {
      if (!text.trim() || requestId || !activeAdvisors.length) return;
      let current = convoRef.current;
      if (!current) {
        current = {
          id: await window.space.newConversationId(text),
          title: text.split('\n')[0].slice(0, 80),
          created: new Date().toISOString(),
          rounds: [],
        };
      }
      const history = clean(current.rounds);
      const round = {
        user: text,
        responses: activeAdvisors.map((a) => ({
          advisorId: a.id,
          name: a.name,
          model: a.model,
          text: '',
          pending: true,
        })),
      };
      const next = { ...current, rounds: [...current.rounds, round] };
      showConvo(next);

      const rid = crypto.randomUUID();
      setRequestId(rid);
      try {
        await window.space.send({
          requestId: rid,
          rounds: history,
          userText: text,
          advisorIds: round.responses.map((r) => r.advisorId),
        });
      } finally {
        setRequestId(null);
        const done = convoRef.current;
        await window.space.saveConversation({ ...done, rounds: clean(done.rounds) });
        setSnap(await window.space.snapshot());
      }
    },
    [requestId, activeAdvisors],
  );

  const openConversation = async (id) => {
    if (requestId) return;
    showConvo(await window.space.loadConversation(id));
  };

  if (!snap) return <div className="boot" />;

  return (
    <div className={`app ${sidebarOpen ? '' : 'sidebar-closed'}`}>
      <div className="titlebar" />
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        conversations={snap.conversations}
        currentId={convo?.id}
        busy={Boolean(requestId)}
        onNew={() => !requestId && showConvo(null)}
        onOpen={openConversation}
        onReveal={() => window.space.reveal(convo ? `conversations/${convo.id}/conversation.md` : '')}
        onSettings={() => setShowSettings(true)}
      />
      <main className={`stage ${convo ? 'in-conversation' : 'at-rest'}`}>
        <Panel
          advisors={advisors}
          inactive={inactive}
          compact={Boolean(convo)}
          onToggle={toggleAdvisor}
          onEdit={(a) => window.space.open(a.file)}
          onCreate={(name) => window.space.createAdvisor(name)}
          modelOptions={snap.modelOptions}
          defaultModel={snap.defaultModel}
          onSetModel={(a, model) => window.space.setModel(a.id, model)}
        />
        {convo && <Conversation convo={convo} advisors={advisors} />}
        <Composer
          busy={Boolean(requestId)}
          disabled={!activeAdvisors.length}
          placeholder={
            activeAdvisors.length
              ? convo
                ? 'Reply to the room…'
                : 'What are you turning over?'
              : 'Wake at least one advisor to begin.'
          }
          onSend={send}
          onStop={() => requestId && window.space.stop(requestId)}
        />
      </main>
      {showSettings && (
        <Settings
          snap={snap}
          onClose={() => setShowSettings(false)}
          onSave={async (patch) => setSnap(await window.space.updateSettings(patch))}
        />
      )}
    </div>
  );
}
