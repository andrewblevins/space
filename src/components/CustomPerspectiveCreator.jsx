import { useState } from 'react';

/**
 * Inline component for creating custom perspectives within the suggestions modal
 * @param {Object} props
 * @param {Function} props.onAdd - Callback when custom perspective is added (receives perspective object)
 * @param {Function} props.onGenerateDescription - Callback to generate description from name
 * @param {boolean} props.isGenerating - Whether description is being generated
 */
export function CustomPerspectiveCreator({ onAdd, onGenerateDescription, isGenerating }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleGenerateDescription = async () => {
    if (!name.trim()) return;

    const generatedDescription = await onGenerateDescription(name.trim());
    if (generatedDescription) {
      setDescription(generatedDescription);
      setShowDescription(true);
      setIsEditing(false);
    }
  };

  const handleAdd = () => {
    if (!name.trim()) return;

    // Create perspective object matching the format used by suggestions
    const customPerspective = {
      name: name.trim(),
      description: description || `You are ${name.trim()}.`,
      isCustom: true // Flag to identify custom perspectives
    };

    onAdd(customPerspective);

    // Reset form
    setName('');
    setDescription('');
    setShowDescription(false);
    setIsExpanded(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setShowDescription(false);
    setIsExpanded(false);
    setIsEditing(false);
  };

  if (!isExpanded) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium">Create Your Own Perspective</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Create Your Own Perspective</h4>

      {/* Name Input */}
      <div className="mb-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter perspective name (e.g., Marcus Aurelius)"
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-green-400"
          disabled={isGenerating}
        />
      </div>

      {/* Generate Description Button */}
      {!showDescription && (
        <button
          onClick={handleGenerateDescription}
          disabled={!name.trim() || isGenerating}
          className="w-full px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? 'Generating Description...' : 'Generate Description'}
        </button>
      )}

      {/* Description Preview/Edit */}
      {showDescription && (
        <div className="mb-3">
          {isEditing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-400 min-h-[120px]"
              placeholder="Describe the perspective..."
            />
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <span className="font-medium text-gray-800 dark:text-gray-200">✓ {name}</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Edit
                </button>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>

        {showDescription && (
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Selection
          </button>
        )}
      </div>
    </div>
  );
}

export default CustomPerspectiveCreator;
