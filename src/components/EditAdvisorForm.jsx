import React, { useState } from 'react';
import { ADVISOR_COLORS } from '../lib/advisorColors';

const EditAdvisorForm = ({ advisor, onSubmit, onCancel, existingAdvisors = [] }) => {
  const [name, setName] = useState(advisor.name);
  const [description, setDescription] = useState(advisor.description);
  const [selectedColor, setSelectedColor] = useState(advisor.color || ADVISOR_COLORS[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter an advisor name');
      return;
    }
    
    // Check for duplicate names (but allow keeping the same name)
    const isDuplicate = existingAdvisors.some(existingAdvisor => 
      existingAdvisor.name.toLowerCase() === name.trim().toLowerCase() && 
      existingAdvisor.name !== advisor.name
    );
    if (isDuplicate) {
      setError('An advisor with this name already exists. Please choose a different name.');
      return;
    }
    
    setError('');
    onSubmit({ name, description, color: selectedColor });
  };

  return (
    <div className="fixed inset-0 bg-white/70 dark:bg-black/50 flex items-center justify-center">
      <div className="bg-gray-100 p-6 rounded-lg border border-green-600 w-96 max-h-[80vh] overflow-y-auto overflow-x-hidden dark:bg-gray-900 dark:border-green-400">
        <h2 className="text-green-400 text-xl mb-4">Edit Advisor</h2>
        {error && (
          <div className="text-red-400 mb-4">{error}</div>
        )}
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
          
          {/* Color Selection */}
          <div className="mb-4">
            <div className="space-y-2">
              {/* First row - 11 colors */}
              <div className="flex justify-between">
                {ADVISOR_COLORS.slice(0, 11).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full ${color} border-2 ${
                      selectedColor === color 
                        ? 'border-green-400 ring-2 ring-green-400 ring-opacity-50' 
                        : 'border-gray-300 dark:border-gray-600'
                    } hover:border-green-400 transition-all duration-200 hover:scale-110`}
                  />
                ))}
              </div>
              {/* Second row - 11 colors with same justify-between spacing */}
              <div className="flex justify-between">
                {ADVISOR_COLORS.slice(11, 22).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full ${color} border-2 ${
                      selectedColor === color 
                        ? 'border-green-400 ring-2 ring-green-400 ring-opacity-50' 
                        : 'border-gray-300 dark:border-gray-600'
                    } hover:border-green-400 transition-all duration-200 hover:scale-110`}
                  />
                ))}
              </div>
            </div>
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