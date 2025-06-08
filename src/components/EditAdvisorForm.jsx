import React, { useState } from 'react';

const EditAdvisorForm = ({ advisor, onSubmit, onCancel }) => {
  const [name, setName] = useState(advisor.name);
  const [description, setDescription] = useState(advisor.description);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, description });
  };

  return (
    <div className="fixed inset-0 bg-white/70 dark:bg-black/50 flex items-center justify-center">
      <div className="bg-gray-100 p-6 rounded-lg border border-green-600 w-96 dark:bg-gray-900 dark:border-green-400">
        <h2 className="text-green-400 text-xl mb-4">Edit Advisor</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-green-400 mb-2">Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white text-gray-800 border border-gray-300 p-2 focus:outline-none dark:bg-black dark:text-green-400 dark:border-green-400"
              autoFocus
              autoComplete="off"
              spellCheck="true"
              data-role="advisor-name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-green-400 mb-2">Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white text-gray-800 border border-gray-300 p-2 h-32 focus:outline-none resize-none dark:bg-black dark:text-green-400 dark:border-green-400"
              autoComplete="off"
              spellCheck="true"
              data-role="advisor-description"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="text-green-400 hover:text-green-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-green-400 hover:text-green-300"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAdvisorForm; 