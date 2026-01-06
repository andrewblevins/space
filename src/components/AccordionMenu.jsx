import React, { useState, useEffect, useRef } from 'react';

const AccordionMenu = ({ 
  onSettingsClick,
  onPromptLibraryClick,
  onSessionManagerClick,
  onNewSessionClick,
  onExportClick,
  onDossierClick,
  onEvaluationsClick,
  onImportExportAdvisorsClick,
  onVotingClick,
  onHighCouncilClick,
  onHelpClick,
  onFullscreenClick,
  isFullscreen
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const menuItems = [
    // DEPRECATED: New Session - Now available in sidebar
    // {
    //   id: 'new-session',
    //   label: 'New Session',
    //   onClick: onNewSessionClick,
    //   icon: (
    //     <svg 
    //       xmlns="http://www.w3.org/2000/svg" 
    //       className="h-4 w-4" 
    //       fill="none" 
    //       viewBox="0 0 24 24" 
    //       stroke="currentColor"
    //     >
    //       <path 
    //         strokeLinecap="round" 
    //         strokeLinejoin="round" 
    //         strokeWidth={2} 
    //         d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    //       />
    //     </svg>
    //   )
    // },
    {
      id: 'sessions',
      label: 'Previous Chats',
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
    // DEPRECATED: Prompt Library - Feature no longer maintained
    // {
    //   id: 'prompts',
    //   label: 'Prompt Library',
    //   onClick: onPromptLibraryClick,
    //   icon: (
    //     <svg 
    //       xmlns="http://www.w3.org/2000/svg" 
    //       className="h-4 w-4" 
    //       fill="none" 
    //       viewBox="0 0 24 24" 
    //       stroke="currentColor"
    //     >
    //       <path 
    //         strokeLinecap="round" 
    //         strokeLinejoin="round" 
    //         strokeWidth={2} 
    //         d="M19 11H5m14-7H3a2 2 0 01-2 2v10a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zM9 7h6"
    //       />
    //     </svg>
    //   )
    // },
    // DEPRECATED: Knowledge Dossier - Feature no longer maintained
    // {
    //   id: 'dossier',
    //   label: 'Knowledge',
    //   onClick: onDossierClick,
    //   icon: (
    //     <svg 
    //       xmlns="http://www.w3.org/2000/svg" 
    //       className="h-4 w-4" 
    //       fill="none" 
    //       viewBox="0 0 24 24" 
    //       stroke="currentColor"
    //     >
    //       <path 
    //         strokeLinecap="round" 
    //         strokeLinejoin="round" 
    //         strokeWidth={2} 
    //         d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    //       />
    //     </svg>
    //   )
    // },
    // DEPRECATED: Evaluations - Feature temporarily disabled
    // {
    //   id: 'evaluations',
    //   label: 'Evaluations',
    //   onClick: onEvaluationsClick,
    //   icon: (
    //     <svg
    //       xmlns="http://www.w3.org/2000/svg"
    //       className="h-4 w-4"
    //       fill="none"
    //       viewBox="0 0 24 24"
    //       stroke="currentColor"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth={2}
    //         d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    //       />
    //     </svg>
    //   )
    // },
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
    // REMOVED: Import/Export Perspectives - moved to settings or deprecated
    // {
    //   id: 'import-export-advisors',
    //   label: 'Import/Export Perspectives',
    //   onClick: onImportExportAdvisorsClick,
    //   icon: (...)
    // },
    // DEPRECATED: Call a Vote - Feature no longer maintained
    // {
    //   id: 'voting',
    //   label: 'Call a Vote',
    //   onClick: onVotingClick,
    //   icon: (
    //     <svg 
    //       xmlns="http://www.w3.org/2000/svg" 
    //       className="h-4 w-4" 
    //       fill="none" 
    //       viewBox="0 0 24 24" 
    //       stroke="currentColor"
    //     >
    //       <path 
    //         strokeLinecap="round" 
    //         strokeLinejoin="round" 
    //         strokeWidth={2} 
    //         d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4"
    //       />
    //     </svg>
    //   )
    // },
    // DEPRECATED: High Council Mode - Replaced by parallel advisor streaming
    // The new parallel advisor system provides better real-time responses with independent advisors
    // commenting out rather than removing to preserve code for reference
    // {
    //   id: 'high-council',
    //   label: 'Start Debate',
    //   onClick: onHighCouncilClick,
    //   icon: (
    //     <svg
    //       xmlns="http://www.w3.org/2000/svg"
    //       className="h-4 w-4"
    //       fill="none"
    //       viewBox="0 0 24 24"
    //       stroke="currentColor"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth={2}
    //         d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    //       />
    //     </svg>
    //   )
    // },
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
    // REMOVED: Fullscreen - not needed in sidebar-integrated design
    // {
    //   id: 'fullscreen',
    //   label: 'Fullscreen',
    //   onClick: onFullscreenClick,
    //   icon: (...)
    // },
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
    <div ref={menuRef} className="fixed bottom-4 left-4 z-50">
      {/* Expanded Menu Items */}
      {isExpanded && (
        <div className="absolute bottom-full mb-2 bg-black border border-orange-500 rounded-lg shadow-lg">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="flex items-center w-full px-4 py-3 text-orange-400 hover:bg-orange-500 hover:text-black transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-orange-500 last:border-b-0"
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
        className={`flex items-center justify-center w-8 h-8 rounded-full border border-orange-500 transition-colors ${
          isExpanded 
            ? 'bg-orange-500 text-black' 
            : 'bg-black text-orange-400 hover:bg-orange-500 hover:text-black'
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