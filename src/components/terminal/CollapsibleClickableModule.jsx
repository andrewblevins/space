
/**
 * Collapsible list where each item is clickable.
 * @param {object} props
 * @param {string} props.title
 * @param {Array<string>} [props.items]
 * @param {boolean} props.expanded
 * @param {() => void} props.onToggle
 * @param {(item: string) => void} [props.onItemClick]
 */
export function CollapsibleClickableModule({ title, items = [], expanded, onToggle, onItemClick }) {
  return (
    <div className="bg-gray-900 p-4">
      <div className="flex justify-between items-center cursor-pointer hover:text-term-300 mb-2" onClick={onToggle}>
        <h2 className="text-white">{title}</h2>
        <span className="text-term-400">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <ul className="space-y-4">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="text-gray-300 cursor-pointer hover:text-term-400 transition-colors whitespace-pre-wrap"
              onClick={() => onItemClick && onItemClick(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CollapsibleClickableModule;
