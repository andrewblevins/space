import React, { useState } from 'react';

const AccordionMenu = ({ 
  onSettingsClick,
  onPromptLibraryClick,
  onSessionManagerClick,
  onNewSessionClick,
  onExportClick,
  onDossierClick,
  onImportExportAdvisorsClick,
  onHelpClick,
  onFullscreenClick,
  isFullscreen
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    {
      id: 'new-session',
      label: 'New Session',
      onClick: onNewSessionClick,
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      )
    },
    {
      id: 'sessions',
      label: 'Session Manager',
      onClick: onSessionManagerClick,
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
          className="h-4 w-4" 
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
      id: 'dossier',
      label: 'Knowledge',
      onClick: onDossierClick,
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      )
    },
    {
      id: 'export',
      label: 'Export Conversation',
      onClick: onExportClick,
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4" 
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
    {
      id: 'import-export-advisors',
      label: 'Import/Export Advisors',
      onClick: onImportExportAdvisorsClick,
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8"
          />
        </svg>
      )
    },
    {
      id: 'help',
      label: 'Help',
      onClick: onHelpClick,
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      )
    },
    {
      id: 'fullscreen',
      label: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
      onClick: onFullscreenClick,
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d={isFullscreen ? "M6 18L18 6M6 6l12 12" : "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"}
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
          className="h-4 w-4" 
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
    }
  ];

  const handleItemClick = (item) => {
    item.onClick();
    setIsExpanded(false); // Close menu after selecting an item
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Expanded Menu Items */}
      {isExpanded && (
        <div className="absolute bottom-full mb-2 bg-black border border-green-400 rounded-lg shadow-lg">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="flex items-center w-full px-4 py-3 text-green-400 hover:bg-green-400 hover:text-black transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-green-400 last:border-b-0"
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
        className={`flex items-center justify-center w-8 h-8 rounded-full border border-green-400 transition-colors ${
          isExpanded 
            ? 'bg-green-400 text-black' 
            : 'bg-black text-green-400 hover:bg-green-400 hover:text-black'
        }`}
        title={isExpanded ? 'Close Menu' : 'Open Menu'}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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