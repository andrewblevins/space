import React, { useState } from 'react';

const AddPromptForm = ({ isOpen, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && text.trim()) {
      onSubmit({ name: name.trim(), text: text.trim() });
      setName('');
      setText('');
    }
  };

  const handleCancel = () => {
    setName('');
    setText('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancel}>
      <div
        className="bg-gray-900 border border-green-400 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-green-400 text-xl font-semibold">Add New Prompt</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-green-400 transition-colors"
            title="Cancel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-green-400 font-medium block mb-2">
              Prompt Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter prompt name..."
              className="w-full bg-black text-green-400 border border-green-400 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600"
              autoFocus
              autoComplete="off"
              spellCheck="true"
              data-role="prompt-name"
            />
          </div>

          <div>
            <label className="text-green-400 font-medium block mb-2">
              Prompt Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your prompt text..."
              className="w-full h-40 bg-black text-green-400 border border-green-400 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-600 resize-none"
              autoComplete="off"
              spellCheck="true"
              data-role="prompt-text"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-black border border-gray-400 rounded text-gray-400 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !text.trim()}
              className="px-4 py-2 bg-black border border-green-400 rounded text-green-400 hover:bg-green-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Prompt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPromptForm; 
