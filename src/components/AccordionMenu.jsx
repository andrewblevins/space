import React, { useState } from 'react';

const AccordionMenu = ({ 
  onSettingsClick,
  onPromptLibraryClick 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
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