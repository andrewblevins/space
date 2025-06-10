
/**
 * Display a collapsible list without click handlers.
 * @param {object} props
 * @param {string} props.title
 * @param {Array<string>} [props.items]
 * @param {boolean} props.expanded
 * @param {boolean} [props.loading]
 * @param {string} [props.emptyMessage]
 * @param {() => void} props.onToggle
 */
export function CollapsibleModule({ title, items = [], expanded, loading = false, emptyMessage, onToggle }) {
  return (
    <div 
      className="border border-stone-300 dark:border-gray-700 rounded-md p-4 mb-4 bg-amber-100 dark:bg-gray-800"
    >
      <div className="flex justify-between items-center cursor-pointer hover:text-green-600 dark:hover:text-green-300 mb-2" onClick={onToggle}>
        <h2 className="text-gray-800 dark:text-gray-200">{title}</h2>
        <span className="text-green-700 dark:text-green-400">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <div>
          {loading ? (
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 dark:border-green-400"></div>
              <span>Analyzing...</span>
            </div>
          ) : items.length > 0 ? (
            <ul className="space-y-4">
              {items.map((item, idx) => (
                <li key={idx} className="text-gray-900 dark:text-gray-300 whitespace-pre-wrap">
                  {item}
                </li>
              ))}
            </ul>
          ) : emptyMessage ? (
            <div className="text-gray-600 dark:text-gray-400 italic">
              {emptyMessage}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default CollapsibleModule;
