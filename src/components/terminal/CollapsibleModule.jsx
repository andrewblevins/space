
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
    <div className="bg-gray-900 p-4">
      <div className="flex justify-between items-center cursor-pointer hover:text-green-300 mb-2" onClick={onToggle}>
        <h2 className="text-white">{title}</h2>
        <span className="text-green-400">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <ul className="space-y-4">
          {items.map((item, idx) => (
            <li key={idx} className="text-gray-300 whitespace-pre-wrap">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CollapsibleModule;
