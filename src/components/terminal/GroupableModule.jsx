import { useState } from "react";

/**
 * Module that supports grouping of advisors.
 * @param {object} props
 * @param {string} props.title
 * @param {Array<object>} [props.groups]
 * @param {Array<object>} [props.items]
 * @param {(item: any) => void} [props.onItemClick]
 * @param {(group: any) => void} [props.onGroupClick]
 * @param {Array<any>} [props.activeItems]
 * @param {Array<any>} [props.activeGroups]
 * @param {() => void} [props.onAddClick]
 * @param {function} [props.setEditingAdvisor]
 * @param {function} [props.setAdvisors]
 * @param {function} [props.setMessages]
 */
export function GroupableModule({
  title,
  groups = [],
  items = [],
  onItemClick,
  onGroupClick,
  activeItems = [],
  activeGroups = [],
  onAddClick,
  setEditingAdvisor,
  setAdvisors,
  setMessages,
}) {
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  return (
    <div
      className="border border-stone-300 dark:border-gray-700 rounded-md p-4 bg-amber-100 dark:bg-gray-800"
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-gray-800 dark:text-gray-200">{title}</h2>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      <ul className="space-y-4">
        {groups.map((group, idx) => (
          <li key={`group-${idx}`} className="mb-2">
            <div
              className={`flex items-center justify-between text-gray-600 dark:text-gray-300 cursor-pointer hover:text-green-600 dark:hover:text-green-400 transition-colors ${activeGroups.includes(group.name) ? 'text-green-600 dark:text-green-400' : ''}`}
              onClick={() => onGroupClick && onGroupClick(group)}
            >
              <span>{group.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup(group.name);
                }}
                className="ml-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
              >
                {expandedGroups.has(group.name) ? '▼' : '▶'}
              </button>
            </div>
            {expandedGroups.has(group.name) && (
              <ul className="ml-4 mt-2 space-y-2">
                {group.advisors.map((advisorName) => {
                  const advisor = items.find((item) => item.name === advisorName);
                  if (!advisor) return null;
                  return (
                    <li
                      key={advisorName}
                      className={`group flex items-center justify-between text-gray-600 dark:text-gray-300 ${activeItems.includes(advisor) ? 'text-green-600 dark:text-green-400' : ''}`}
                    >
                      <div
                        onClick={() => onItemClick && onItemClick(advisor)}
                        className="flex items-center space-x-2 flex-1"
                      >
                        {advisor.color && (
                          <span className={`w-3 h-3 rounded-full ${advisor.color}`}></span>
                        )}
                        <span>{advisor.name}</span>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAdvisor && setEditingAdvisor(advisor);
                          }}
                          className="p-1 hover:text-blue-500 dark:hover:text-blue-400"
                          title="Edit advisor"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdvisors && setAdvisors((prev) => prev.filter((a) => a.name !== advisor.name));
                            setMessages &&
                              setMessages((prev) => [
                                ...prev,
                                { type: 'system', content: `Deleted advisor: ${advisor.name}` },
                              ]);
                          }}
                          className="p-1 hover:text-red-500 dark:hover:text-red-400"
                          title="Delete advisor"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
        {items
          .filter((item) => !groups.some((g) => g.advisors.includes(item.name)))
          .map((item, idx) => (
            <li
              key={`item-${idx}`}
              className={`group flex items-center justify-between text-gray-900 dark:text-gray-300 ${activeItems.includes(item) ? 'text-green-700 dark:text-green-400' : ''}`}
            >
              <div
                onClick={() => onItemClick && onItemClick(item)}
                className="flex items-center space-x-2 flex-1"
              >
                {item.color && (
                  <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                )}
                <span>{item.name}</span>
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAdvisor && setEditingAdvisor(item);
                  }}
                  className="p-1 hover:text-blue-500 dark:hover:text-blue-400"
                  title="Edit advisor"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAdvisors && setAdvisors((prev) => prev.filter((a) => a.name !== item.name));
                    setMessages &&
                      setMessages((prev) => [
                        ...prev,
                        { type: 'system', content: `Deleted advisor: ${item.name}` },
                      ]);
                  }}
                  className="p-1 hover:text-red-500 dark:hover:text-red-400"
                  title="Delete advisor"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default GroupableModule;
