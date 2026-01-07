import React, { useState } from 'react';
import { ADVISOR_COLORS } from '../lib/advisorColors';

const EditAdvisorForm = ({ advisor, onSubmit, onCancel }) => {
  const [name, setName] = useState(advisor.name);
  const [description, setDescription] = useState(advisor.description);
  const [selectedColor, setSelectedColor] = useState(advisor.color || ADVISOR_COLORS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, description, color: selectedColor });
  };

  return (
    <div className="fixed inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center z-[60]">
      <div className="bg-gray-100 p-6 rounded-lg border border-term-700 w-96 max-h-[80vh] overflow-y-auto overflow-x-hidden dark:bg-stone-900 dark:border-term-500 relative">
        <h2 className="text-term-400 text-xl mb-4">Edit Advisor</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-term-400 mb-2">Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white text-gray-800 font-sans border border-gray-300 p-2 focus:outline-none placeholder:text-amber-600 dark:placeholder:text-term-300 dark:bg-stone-900 dark:text-white dark:border-term-700"
              autoFocus
              autoComplete="off"
              spellCheck="true"
              data-role="advisor-name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-term-400 mb-2">Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white text-gray-800 font-sans border border-gray-300 p-2 h-32 focus:outline-none resize-none placeholder:text-amber-600 dark:placeholder:text-term-300 dark:bg-stone-900 dark:text-white dark:border-term-700"
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
                        ? 'border-term-500 ring-2 ring-term-500 ring-opacity-50' 
                        : 'border-gray-300 dark:border-stone-600'
                    } hover:border-term-500 transition-all duration-200 hover:scale-110`}
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
                        ? 'border-term-500 ring-2 ring-term-500 ring-opacity-50' 
                        : 'border-gray-300 dark:border-stone-600'
                    } hover:border-term-500 transition-all duration-200 hover:scale-110`}
                  />
                ))}
              </div>
            </div>
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

export default EditAdvisorForm; 