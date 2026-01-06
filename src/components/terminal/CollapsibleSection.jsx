import { useState } from "react";

/**
 * A collapsible accordion section with a triangle toggle.
 * @param {object} props
 * @param {string} props.title - The section title
 * @param {React.ReactNode} props.children - The content to show when expanded
 * @param {boolean} [props.defaultExpanded=true] - Whether to start expanded
 * @param {React.ReactNode} [props.headerRight] - Optional content to show on the right side of the header
 * @param {'subtle' | 'terminal' | 'hybrid'} [props.variant='subtle'] - Style variant
 */
export function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
  headerRight,
  variant = 'subtle',
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Style configurations based on variant
  const containerStyles = {
    subtle: "border border-stone-300 dark:border-gray-700 rounded-md bg-amber-100 dark:bg-gray-800",
    terminal: "border border-green-500/30 rounded-md bg-black/40",
    hybrid: "border border-stone-300 dark:border-green-500/20 rounded-md bg-amber-100/80 dark:bg-black/40",
  };

  const headerStyles = {
    subtle: "hover:bg-amber-200/50 dark:hover:bg-gray-700/50",
    terminal: "hover:bg-green-500/10",
    hybrid: "hover:bg-amber-200/50 dark:hover:bg-green-500/10",
  };

  const iconStyles = {
    subtle: "text-gray-600 dark:text-gray-300",
    terminal: "text-green-400",
    hybrid: "text-gray-600 dark:text-green-400",
  };

  const titleStyles = {
    subtle: "text-gray-800 dark:text-gray-200",
    terminal: "text-green-400",
    hybrid: "text-gray-800 dark:text-green-400",
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

