
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
      className="border border-stone-300 dark:border-stone-700 rounded-md p-4 mb-4 bg-amber-100 dark:bg-stone-800"
    >
      <div className="flex justify-between items-center cursor-pointer hover:text-term-600 dark:hover:text-term-300 mb-2" onClick={onToggle}>
        <h2 className="text-gray-800 dark:text-term-100">{title}</h2>
        <span className="text-term-700 dark:text-term-400">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <ul className="space-y-4">
          {items.map((item, idx) => (
            <li key={idx} className="text-gray-900 dark:text-term-200 whitespace-pre-wrap">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CollapsibleModule;
