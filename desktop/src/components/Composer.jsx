import React, { useEffect, useRef, useState } from 'react';

export default function Composer({ busy, disabled, placeholder, onSend, onStop }) {
  const [text, setText] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 280)}px`;
  }, [text]);

  useEffect(() => {
    if (!busy) ref.current?.focus();
  }, [busy]);

  const submit = () => {
    if (busy || disabled || !text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="composer">
      <textarea
        ref={ref}
        rows={1}
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
      />
      {busy ? (
        <button className="composer-btn" onClick={onStop}>
          Stop
        </button>
      ) : (
        <button className="composer-btn" onClick={submit} disabled={disabled || !text.trim()}>
          Speak
        </button>
      )}
    </div>
  );
}
