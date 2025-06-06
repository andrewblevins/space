import React, { useState } from 'react';

const AccordionMenu = ({ 
  onSettingsClick,
  onPromptLibraryClick,
  onSessionManagerClick,
  onExportClick,
  onAboutClick,
  isInline = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    {
      id: 'sessions',
      label: 'Session Manager',
      onClick: onSessionManagerClick,
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 md:h-4 md:w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 11H5m14-7H3a2 2 0 01-2 2v10a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM9 7h6M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      onClick: onSettingsClick,
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 md:h-4 md:w-4" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" 
            clipRule="evenodd" 
          />
        </svg>
      )
    },
    {
      id: 'prompts',
      label: 'Prompt Library',
      onClick: onPromptLibraryClick,
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 md:h-4 md:w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 11H5m14-7H3a2 2 0 01-2 2v10a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM9 7h6"
          />
        </svg>
      )
    },
    {
      id: 'export',
      label: 'Export',
      onClick: onExportClick,
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 md:h-4 md:w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      )
    },
    ...(onAboutClick ? [{
      id: 'about',
      label: 'About',
      onClick: onAboutClick,
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 md:h-4 md:w-4" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
            clipRule="evenodd" 
          />
        </svg>
      )
    }] : [])
  ];

  const handleItemClick = (item) => {
    item.onClick();
    setIsExpanded(false); // Close menu after selecting an item
  };

  return (
    <div className={isInline ? "relative z-50" : "fixed bottom-4 left-4 z-50"}>
      {/* Expanded Menu Items */}
      {isExpanded && (
        <div className={`absolute ${isInline ? 'bottom-full right-0 mb-2 min-w-[160px]' : 'bottom-full mb-2'} bg-black border border-green-400 rounded-lg shadow-lg`}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="flex items-center w-full px-4 py-4 md:py-3 text-green-400 hover:bg-green-400 hover:text-black transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-green-400 last:border-b-0 text-base md:text-sm"
              title={item.label}
            >
              {item.icon}
              <span className="ml-3 whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-center ${isInline ? 'w-12 h-12' : 'w-12 h-12 md:w-8 md:h-8'} rounded-full border border-green-400 transition-colors ${
          isExpanded 
            ? 'bg-green-400 text-black' 
            : 'bg-black text-green-400 hover:bg-green-400 hover:text-black'
        }`}
        title={isExpanded ? 'Close Menu' : 'Open Menu'}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`${isInline ? 'h-5 w-5' : 'h-5 w-5'} transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M5 15l7-7 7 7" 
          />
        </svg>
      </button>
    </div>
  );
};

export default AccordionMenu; 