import React, { useState } from 'react';

const EditPromptForm = ({ prompt, onSubmit, onCancel }) => {
  const [name, setName] = useState(prompt.name);
  const [text, setText] = useState(prompt.text);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, text });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-lg border border-term-500 w-96 max-h-[80vh] overflow-y-auto overflow-x-hidden">
        <h2 className="text-term-400 text-xl mb-4">Edit Prompt</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-term-400 mb-2">Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-900 text-white font-sans border border-term-700 p-2 focus:outline-none placeholder:text-term-300"
              autoFocus
              autoComplete="off"
              spellCheck="true"
              data-role="prompt-name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-term-400 mb-2">Text:</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-stone-900 text-white font-sans border border-term-700 p-2 h-32 focus:outline-none resize-none placeholder:text-term-300"
              autoComplete="off"
              spellCheck="true"
              data-role="prompt-text"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="text-term-400 hover:text-term-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-term-400 hover:text-term-300"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPromptForm; 