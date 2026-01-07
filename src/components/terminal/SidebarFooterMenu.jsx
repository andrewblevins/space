import React from 'react';

// Shared color theme configurations
const colorThemes = {
  green: { text: 'text-term-400', hoverBg: 'hover:bg-term-500', border: 'border-term-600/30', glow: 'via-term-500/50' },
  mahogany: { text: 'text-rose-300', hoverBg: 'hover:bg-rose-400', border: 'border-rose-900/50', glow: 'via-rose-500/50' },
  burgundy: { text: 'text-red-300', hoverBg: 'hover:bg-red-400', border: 'border-red-900/40', glow: 'via-red-500/50' },
  amber: { text: 'text-amber-400', hoverBg: 'hover:bg-amber-400', border: 'border-amber-500/30', glow: 'via-amber-500/50' },
  cyan: { text: 'text-cyan-400', hoverBg: 'hover:bg-cyan-400', border: 'border-cyan-500/30', glow: 'via-cyan-500/50' },
  violet: { text: 'text-violet-400', hoverBg: 'hover:bg-violet-400', border: 'border-violet-500/30', glow: 'via-violet-500/50' },
  copper: { text: 'text-term-300', hoverBg: 'hover:bg-term-400', border: 'border-term-700/40', glow: 'via-term-500/50' },
  slate: { text: 'text-slate-300', hoverBg: 'hover:bg-slate-400', border: 'border-slate-500/30', glow: 'via-slate-500/50' },
};

/**
 * Sidebar footer menu with tool buttons.
 * Supports multiple style variants for design exploration.
 * 
 * @param {object} props
 * @param {'subtle' | 'terminal' | 'hybrid'} [props.variant='terminal'] - Style variant
 * @param {string} [props.colorTheme='green'] - Color theme
 * @param {function} props.onSessionManagerClick - Previous chats handler
 * @param {function} props.onExportClick - Export conversation handler
 * @param {function} props.onHelpClick - Help handler
 * @param {function} props.onSettingsClick - Settings handler
 */
export function SidebarFooterMenu({
  variant = 'terminal',
  colorTheme = 'copper',
  onSessionManagerClick,
  onExportClick,
  onHelpClick,
  onSettingsClick,
}) {
  const ct = colorThemes[colorTheme] || colorThemes.green;
  const menuItems = [
    {
      id: 'sessions',
      label: 'All Chats',
      onClick: onSessionManagerClick,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'export',
      label: 'Export',
      onClick: onExportClick,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )
    },
    {
      id: 'help',
      label: 'Help',
      onClick: onHelpClick,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      onClick: onSettingsClick,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  // Variant A: Subtle Integration - warm tones with soft styling
  if (variant === 'subtle') {
    return (
      <div className="mt-auto border-t border-stone-300 dark:border-stone-700 bg-amber-50/50 dark:bg-gray-850">
        <div className="p-3">
          <div className="flex items-center justify-around">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="flex flex-col items-center gap-1 p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-term-700 dark:hover:text-term-400 hover:bg-amber-200/50 dark:hover:bg-gray-700/50 transition-colors"
                title={item.label}
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Variant B: Terminal Dark - full themed aesthetic
  if (variant === 'terminal') {
    return (
      <div className="mt-auto">
        {/* Glowing separator line */}
        <div className={`h-px bg-gradient-to-r from-transparent ${ct.glow} to-transparent`} />
        
        <div className={`bg-black/95 dark:bg-black border-t ${ct.border} p-3`}>
          {/* Grid of buttons */}
          <div className="grid grid-cols-4 gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded ${ct.text} ${ct.hoverBg} hover:text-black transition-all group`}
                title={item.label}
              >
                <span className="group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="text-[10px] font-medium tracking-wide uppercase opacity-80 group-hover:opacity-100">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Variant C: Hybrid - gradient transition from warm to terminal
  if (variant === 'hybrid') {
    return (
      <div className="mt-auto relative">
        {/* Gradient transition overlay */}
        <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-b from-transparent to-gray-900/90 dark:to-black/90 pointer-events-none" />
        
        <div className="relative bg-gray-900/95 dark:bg-black/95 border-t border-term-600/20 backdrop-blur-sm">
          {/* Top accent line */}
          <div className="h-0.5 bg-gradient-to-r from-amber-400/50 via-term-500 to-amber-400/50" />
          
          <div className="p-3">
            <div className="flex items-center justify-between gap-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md text-term-400/80 hover:text-term-300 hover:bg-term-500/10 border border-transparent hover:border-term-600/30 transition-all"
                  title={item.label}
                >
                  <span className="opacity-90">{item.icon}</span>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback to terminal variant
  return (
    <div className="mt-auto border-t border-term-600/30 bg-black p-3">
      <div className="grid grid-cols-4 gap-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className="flex flex-col items-center gap-1 p-2 rounded text-term-400 hover:bg-term-500 hover:text-black transition-colors"
            title={item.label}
          >
            {item.icon}
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SidebarFooterMenu;

