import React from 'react';

/**
 * MobileHeader component provides the header section for mobile layout
 * Features: App branding, tab indicator, and info button
 */
const MobileHeader = ({ activeTab, setActiveTab, setShowInfoModal }) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'chat':
        return 'Chat';
      case 'advisors':
        return 'Advisors';
      case 'insights':
        return 'Insights';
      case 'tools':
        return 'Tools';
      default:
        return 'SPACE';
    }
  };

  return (
    <header className="flex items-center justify-between p-4 bg-amber-50 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
      {/* Left side - App branding */}
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-400 rounded flex items-center justify-center text-black font-bold">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-gray-800 dark:text-green-400">
              SPACE
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {getTabTitle()}
            </span>
          </div>
        </div>
      </div>

      {/* Right side - Info button */}
      <button
        onClick={() => setShowInfoModal(true)}
        className="flex items-center justify-center w-10 h-10 rounded-full border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors"
        title="About SPACE Terminal"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>
    </header>
  );
};

export default MobileHeader; 