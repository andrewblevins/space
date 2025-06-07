
/**
 * Collapsible list for displaying suggestions with an add button per item.
 * @param {object} props
 * @param {string} props.title
 * @param {Array<string>} [props.items]
 * @param {boolean} props.expanded
 * @param {() => void} props.onToggle
 * @param {(item: string) => void} [props.onItemClick]
 */
export function CollapsibleSuggestionsModule({ title, items = [], expanded, onToggle, onItemClick }) {
  return (
    <div 
      className="border border-stone-300 dark:border-gray-700 rounded-md p-4"
      style={{ backgroundColor: '#f0e6d2' }}
    >
      <div className="flex justify-between items-center cursor-pointer hover:text-green-600 dark:hover:text-green-300 mb-2" onClick={onToggle}>
        <h2 style={{ color: '#1f2937 !important' }}>{title}</h2>
        <span className="text-green-700 dark:text-green-400">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <ul className="space-y-4">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between text-gray-900 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 transition-colors">
              <span className="whitespace-pre-wrap">{item}</span>
              <button onClick={() => onItemClick && onItemClick(item)} className="ml-2 text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CollapsibleSuggestionsModule;
