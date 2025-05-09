import React, { useState } from 'react';

const EditAdvisorForm = ({ advisor, onSubmit, onCancel }) => {
  const [name, setName] = useState(advisor.name);
  const [description, setDescription] = useState(advisor.description);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, description });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-lg border border-green-400 w-96">
        <h2 className="text-green-400 text-xl mb-4">Edit Advisor</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-green-400 mb-2">Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black text-green-400 border border-green-400 p-2 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="block text-green-400 mb-2">Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black text-green-400 border border-green-400 p-2 h-32 focus:outline-none resize-none"
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