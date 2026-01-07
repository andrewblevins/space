import { useState } from "react";

// Shared color theme configurations
const colorThemes = {
  green: { border: 'border-term-600/30', text: 'text-term-400', hoverBg: 'hover:bg-term-500/10' },
  mahogany: { border: 'border-rose-900/50', text: 'text-rose-300', hoverBg: 'hover:bg-rose-900/30' },
  burgundy: { border: 'border-red-900/40', text: 'text-red-300', hoverBg: 'hover:bg-red-900/30' },
  amber: { border: 'border-amber-500/30', text: 'text-amber-400', hoverBg: 'hover:bg-amber-500/20' },
  cyan: { border: 'border-cyan-500/30', text: 'text-cyan-400', hoverBg: 'hover:bg-cyan-500/20' },
  violet: { border: 'border-violet-500/30', text: 'text-violet-400', hoverBg: 'hover:bg-violet-500/20' },
  copper: { border: 'border-term-700/40', text: 'text-term-300', hoverBg: 'hover:bg-term-700/20' },
  slate: { border: 'border-slate-500/30', text: 'text-slate-300', hoverBg: 'hover:bg-slate-500/20' },
};

/**
 * A collapsible accordion section with a triangle toggle.
 * @param {object} props
 * @param {string} props.title - The section title
 * @param {React.ReactNode} props.children - The content to show when expanded
 * @param {boolean} [props.defaultExpanded=true] - Whether to start expanded
 * @param {React.ReactNode} [props.headerRight] - Optional content to show on the right side of the header
 * @param {'subtle' | 'terminal' | 'hybrid'} [props.variant='subtle'] - Style variant
 * @param {string} [props.colorTheme='green'] - Color theme
 */
export function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
  headerRight,
  variant = 'subtle',
  colorTheme = 'copper',
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const ct = colorThemes[colorTheme] || colorThemes.green;

  // Style configurations based on variant
  const containerStyles = {
    subtle: "border border-stone-300 dark:border-stone-700 rounded-md bg-amber-100 dark:bg-stone-800",
    terminal: `border ${ct.border} rounded-md bg-black/40`,
    hybrid: `border border-stone-300 dark:${ct.border} rounded-md bg-amber-100/80 dark:bg-black/40`,
  };

  const headerStyles = {
    subtle: "hover:bg-amber-200/50 dark:hover:bg-gray-700/50",
    terminal: ct.hoverBg,
    hybrid: `hover:bg-amber-200/50 dark:${ct.hoverBg}`,
  };

  const iconStyles = {
    subtle: "text-gray-600 dark:text-term-200",
    terminal: ct.text,
    hybrid: `text-gray-600 dark:${ct.text}`,
  };

  const titleStyles = {
    subtle: "text-gray-800 dark:text-term-100",
    terminal: ct.text,
    hybrid: `text-gray-800 dark:${ct.text}`,
  };

  return (
    <div className={containerStyles[variant] || containerStyles.subtle}>
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 text-left transition-colors rounded-t-md ${headerStyles[variant] || headerStyles.subtle}`}
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            } ${iconStyles[variant] || iconStyles.subtle}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M6 4l8 6-8 6V4z" />
          </svg>
          <h2 className={`font-medium ${titleStyles[variant] || titleStyles.subtle}`}>{title}</h2>
        </div>
        {headerRight && (
          <div onClick={(e) => e.stopPropagation()}>
            {headerRight}
          </div>
        )}
      </button>

      {/* Collapsible content */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export default CollapsibleSection;

