import { useState } from "react";

/**
 * A collapsible accordion section with a triangle toggle.
 * @param {object} props
 * @param {string} props.title - The section title
 * @param {React.ReactNode} props.children - The content to show when expanded
 * @param {boolean} [props.defaultExpanded=true] - Whether to start expanded
 * @param {React.ReactNode} [props.headerRight] - Optional content to show on the right side of the header
 */
export function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
  headerRight,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-stone-300 dark:border-gray-700 rounded-md bg-amber-100 dark:bg-gray-800">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-200/50 dark:hover:bg-gray-700/50 transition-colors rounded-t-md"
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3 w-3 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <h2 className="text-gray-800 dark:text-gray-200 font-medium">{title}</h2>
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

