import React from 'react';

const MobileWarning = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-yellow-600 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-yellow-400 text-xl mb-4">
          Mobile Device Detected
        </h2>
        
        <div className="text-green-400 space-y-3 mb-6">
          <p>
            SPACE Terminal is optimized for desktop computers.
          </p>
          <p>
            For the best experience with multiple advisors, analysis panels, and extended conversations, please visit on a larger screen.
          </p>
          <p className="text-yellow-400 text-sm">
            You can continue on mobile, but the interface may be cramped and difficult to use.
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-green-400 border border-green-400 rounded hover:bg-green-400 hover:text-black transition-colors"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileWarning;