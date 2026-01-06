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
    <div className="fixed inset-0 bg-white/70 dark:bg-black/50 flex items-center justify-center z-50" onClick={handleCancel}>
      <div
        className="bg-gray-100 border border-orange-700 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto overflow-x-hidden dark:bg-stone-900 dark:border-orange-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-orange-400 text-xl font-semibold">Add New Prompt</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-orange-400 transition-colors"
            title="Cancel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-orange-400 font-medium block mb-2">
              Prompt Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter prompt name..."
              className="w-full bg-white text-gray-800 font-sans border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-600 placeholder:text-amber-600 dark:placeholder:text-orange-300 dark:bg-stone-900 dark:text-white dark:border-orange-700"
              autoFocus
              autoComplete="off"
              spellCheck="true"
              data-role="prompt-name"
            />
          </div>

          <div>
            <label className="text-orange-400 font-medium block mb-2">
              Prompt Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your prompt text..."
              className="w-full h-40 bg-white text-gray-800 font-sans border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-600 resize-none placeholder:text-amber-600 dark:placeholder:text-orange-300 dark:bg-stone-900 dark:text-white dark:border-orange-700"
              autoComplete="off"
              spellCheck="true"
              data-role="prompt-text"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-white border border-gray-400 rounded text-gray-600 hover:bg-gray-200 transition-colors dark:bg-black dark:text-gray-400 dark:hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !text.trim()}
              className="px-4 py-2 bg-white border border-orange-700 rounded text-orange-600 hover:bg-orange-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-black dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-500 dark:hover:text-black"
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
