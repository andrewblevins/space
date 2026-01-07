
/**
 * Display a list of items in the sidebar.
 * @param {object} props
 * @param {string} props.title - Section title.
 * @param {Array<string>} [props.items]
 * @param {(item: string) => void} [props.onItemClick]
 * @param {Array<string>} [props.activeItems]
 */
export function Module({ title, items = [], onItemClick, activeItems = [] }) {
  return (
    <div className="bg-gray-900 p-4">
      <h2 className="text-white mb-2">{title}</h2>
      <ul className="space-y-4">
        {items.map((item, idx) => (
          <li
            key={idx}
            className={`
              text-gray-300
              whitespace-pre-wrap
              ${onItemClick ? 'cursor-pointer hover:text-term-400 transition-colors' : ''}
              ${activeItems.includes(item) ? 'text-term-400' : ''}
            `}
            onClick={() => onItemClick && onItemClick(item)}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Module;
