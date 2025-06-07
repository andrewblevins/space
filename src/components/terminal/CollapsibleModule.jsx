
/**
 * Display a collapsible list without click handlers.
 * @param {object} props
 * @param {string} props.title
 * @param {Array<string>} [props.items]
 * @param {boolean} props.expanded
 * @param {() => void} props.onToggle
 */
export function CollapsibleModule({ title, items = [], expanded, onToggle }) {
  return (
    <div 
      className="border border-stone-300 dark:border-gray-700 rounded-md p-4 mb-4"
      style={{ backgroundColor: '#f0e6d2' }}
    >
      <div className="flex justify-between items-center cursor-pointer hover:text-green-600 dark:hover:text-green-300 mb-2" onClick={onToggle}>
        <h2 style={{ color: '#1f2937 !important' }}>{title}</h2>
        <span className="text-green-700 dark:text-green-400">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <ul className="space-y-4">
          {items.map((item, idx) => (
            <li key={idx} className="text-gray-900 dark:text-gray-300 whitespace-pre-wrap">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CollapsibleModule;
