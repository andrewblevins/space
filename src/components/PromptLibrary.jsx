import React, { useState } from 'react';

const PromptLibrary = ({ 
  isOpen, 
  onClose, 
  savedPrompts,
  onUsePrompt,
  onEditPrompt,
  onDeletePrompt,
  onAddNewPrompt
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(null);

  if (!isOpen) return null;

  const filteredPrompts = savedPrompts.filter(prompt =>
    prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUsePrompt = (prompt) => {
    onUsePrompt(prompt);
    onClose(); // Close the library after using a prompt
  };

  const handleDeleteClick = (prompt) => {
    setShowDeleteConfirmation(prompt);
  };

  const handleConfirmDelete = () => {
    if (showDeleteConfirmation) {
      onDeletePrompt(showDeleteConfirmation);
      setShowDeleteConfirmation(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-green-400 rounded-lg w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto overflow-x-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-green-400 text-xl font-semibold">Prompt Library</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-green-400 transition-colors"
            title="Close Prompt Library"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Add New */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompts..."
                className="w-full bg-white text-gray-800 border border-gray-300 rounded px-3 py-2 pl-10 focus:outline-none focus:ring-1 focus:ring-green-600 dark:bg-black dark:text-green-400 dark:border-green-400"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={onAddNewPrompt}
              className="px-4 py-2 bg-white border border-green-600 rounded text-green-600 hover:bg-green-600 hover:text-white transition-colors dark:bg-black dark:border-green-400 dark:text-green-400 dark:hover:bg-green-400 dark:hover:text-black"
            >
              Add New Prompt
            </button>
          </div>
        </div>

        {/* Prompts List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">
                {searchQuery ? 'No prompts match your search.' : 'No saved prompts yet.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={onAddNewPrompt}
                  className="px-4 py-2 bg-white border border-green-600 rounded text-green-600 hover:bg-green-600 hover:text-white transition-colors dark:bg-black dark:border-green-400 dark:text-green-400 dark:hover:bg-green-400 dark:hover:text-black"
                >
                  Create Your First Prompt
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrompts.map((prompt) => (
                <div key={prompt.name} className="bg-white border border-gray-300 rounded-lg p-4 dark:bg-black dark:border-gray-600">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-green-400 font-semibold text-lg">{prompt.name}</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUsePrompt(prompt)}
                        className="px-3 py-1 bg-green-400 text-black rounded text-sm hover:bg-green-300 transition-colors"
                        title="Use this prompt"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => onEditPrompt(prompt)}
                        className="px-3 py-1 bg-white border border-blue-600 text-blue-600 rounded text-sm hover:bg-blue-600 hover:text-white transition-colors dark:bg-black dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-400 dark:hover:text-black"
                        title="Edit this prompt"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(prompt)}
                        className="px-3 py-1 bg-white border border-red-600 text-red-600 rounded text-sm hover:bg-red-600 hover:text-white transition-colors dark:bg-black dark:border-red-400 dark:text-red-400 dark:hover:bg-red-400 dark:hover:text-black"
                        title="Delete this prompt"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                    {prompt.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmation && (
        <div 
          className="fixed inset-0 bg-white/70 dark:bg-black/75 flex items-center justify-center z-60"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-gray-100 border border-red-600 rounded-lg p-6 w-full max-w-sm mx-4 dark:bg-gray-900 dark:border-red-400"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-red-400 text-lg font-semibold mb-2">Delete Prompt?</h3>
              <p className="text-gray-300 text-sm mb-2">
                Are you sure you want to delete "<span className="text-green-400 font-medium">{showDeleteConfirmation.name}</span>"?
              </p>
              <p className="text-gray-400 text-xs">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 bg-white border border-gray-400 rounded text-gray-600 hover:bg-gray-200 transition-colors dark:bg-black dark:text-gray-400 dark:hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-white border border-red-600 rounded text-red-600 hover:bg-red-600 hover:text-white transition-colors dark:bg-black dark:border-red-400 dark:text-red-400 dark:hover:bg-red-400 dark:hover:text-black"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptLibrary; 