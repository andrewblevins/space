import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'space_mobile_disclaimer_dismissed';

const MobileDisclaimerModal = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleDismiss}
    >
      <div
        className="bg-amber-50 dark:bg-stone-900 border border-term-700 dark:border-term-500 rounded-lg p-6 max-w-sm w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-term-400 mb-3">
          Heads up
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
          SPACE is designed for larger screens. You can still use it here, but you'll have a better experience on a desktop or tablet.
        </p>
        <button
          onClick={handleDismiss}
          className="px-6 py-2 bg-term-700 hover:bg-term-600 text-white rounded transition-colors text-sm"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default MobileDisclaimerModal;
