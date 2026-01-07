import { useState } from "react";

// Shared color theme configurations
const colorThemes = {
  green: { text: 'text-term-400', textDim: 'text-term-500/50', textMid: 'text-term-400/70', hoverBg: 'hover:bg-term-500/10', hoverText: 'hover:text-term-300' },
  mahogany: { text: 'text-rose-300', textDim: 'text-rose-400/50', textMid: 'text-rose-300/70', hoverBg: 'hover:bg-rose-900/30', hoverText: 'hover:text-rose-200' },
  burgundy: { text: 'text-red-300', textDim: 'text-red-400/50', textMid: 'text-red-300/70', hoverBg: 'hover:bg-red-900/30', hoverText: 'hover:text-red-200' },
  amber: { text: 'text-amber-400', textDim: 'text-amber-500/50', textMid: 'text-amber-400/70', hoverBg: 'hover:bg-amber-500/20', hoverText: 'hover:text-amber-300' },
  cyan: { text: 'text-cyan-400', textDim: 'text-cyan-500/50', textMid: 'text-cyan-400/70', hoverBg: 'hover:bg-cyan-500/20', hoverText: 'hover:text-cyan-300' },
  violet: { text: 'text-violet-400', textDim: 'text-violet-500/50', textMid: 'text-violet-400/70', hoverBg: 'hover:bg-violet-500/20', hoverText: 'hover:text-violet-300' },
  copper: { text: 'text-term-300', textDim: 'text-term-400/50', textMid: 'text-term-300/70', hoverBg: 'hover:bg-term-700/20', hoverText: 'hover:text-term-200' },
  slate: { text: 'text-slate-300', textDim: 'text-slate-400/50', textMid: 'text-slate-300/70', hoverBg: 'hover:bg-slate-500/20', hoverText: 'hover:text-slate-200' },
};

/**
 * Module that supports grouping of advisors.
 * @param {object} props
 * @param {string} [props.title]
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
 * @param {boolean} [props.noContainer] - If true, renders only the list without the container
 * @param {string} [props.colorTheme='green'] - Color theme
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
  noContainer = false,
  colorTheme = 'copper',
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

  const ct = colorThemes[colorTheme] || colorThemes.green;

  const listContent = (
    <ul className="space-y-1">
        {groups.map((group, idx) => (
          <li key={`group-${idx}`} className="mb-2">
            <div
              className={`flex items-center justify-between ${ct.textMid} cursor-pointer ${ct.hoverText} transition-colors ${activeGroups.includes(group.name) ? ct.text : ''}`}
              onClick={() => onGroupClick && onGroupClick(group)}
            >
              <span>{group.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup(group.name);
                }}
                className={`ml-2 ${ct.textDim} ${ct.hoverText}`}
              >
                {expandedGroups.has(group.name) ? '▼' : '▶'}
              </button>
            </div>
            {expandedGroups.has(group.name) && (
              <ul className="ml-4 mt-2 space-y-1">
                {group.advisors.map((advisorName) => {
                  const advisor = items.find((item) => item.name === advisorName);
                  if (!advisor) return null;
                  const isActive = activeItems.includes(advisor);
                  return (
                    <li
                      key={advisorName}
                      className={`group flex items-center justify-between rounded-md px-2 py-1.5 -mx-2 transition-all ${
                        isActive
                          ? 'bg-sage-500/20 border border-sage-500 text-sage-400 shadow-sm'
                          : `${ct.textDim} ${ct.hoverBg} hover:text-term-300`
                      }`}
                    >
                      <div
                        onClick={() => onItemClick && onItemClick(advisor)}
                        className="flex items-center space-x-2 flex-1 cursor-pointer"
                      >
                        {advisor.color && (
                          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${advisor.color} ${!isActive ? 'opacity-50' : 'ring-1 ring-white/30'}`}></span>
                        )}
                        <span className="font-medium">{advisor.name}</span>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAdvisor && setEditingAdvisor(advisor);
                          }}
                          className={`p-1 ${isActive ? 'text-sage-300 hover:text-sage-200' : `${ct.textDim} ${ct.hoverText}`}`}
                          title="Edit advisor"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete "${advisor.name}"? This cannot be undone.`)) {
                              setAdvisors && setAdvisors((prev) => prev.filter((a) => a.name !== advisor.name));
                            }
                          }}
                          className={`p-1 ${isActive ? 'text-white/70 hover:text-red-300' : 'text-term-500/50 hover:text-red-400'}`}
                          title="Delete perspective"
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
          .map((item, idx) => {
            const isActive = activeItems.includes(item);
            return (
            <li
              key={`item-${idx}`}
              className={`group flex items-center justify-between rounded-md px-2 py-1.5 -mx-2 transition-all ${
                isActive
                  ? 'bg-sage-500/20 border border-sage-500 text-sage-400 shadow-sm'
                  : `${ct.textDim} ${ct.hoverBg} hover:text-term-300`
              }`}
            >
              <div
                onClick={() => onItemClick && onItemClick(item)}
                className="flex items-center space-x-2 flex-1 cursor-pointer"
              >
                {item.color && (
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${item.color} ${!isActive ? 'opacity-50' : 'ring-1 ring-white/30'}`}></span>
                )}
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAdvisor && setEditingAdvisor(item);
                  }}
                  className={`p-1 ${isActive ? 'text-sage-300 hover:text-sage-200' : `${ct.textDim} ${ct.hoverText}`}`}
                  title="Edit advisor"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${item.name}"? This cannot be undone.`)) {
                      setAdvisors && setAdvisors((prev) => prev.filter((a) => a.name !== item.name));
                    }
                  }}
                  className={`p-1 ${isActive ? 'text-white/70 hover:text-red-300' : 'text-term-500/50 hover:text-red-400'}`}
                  title="Delete perspective"
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
  );

  // If noContainer is true, return just the list
  if (noContainer) {
    return listContent;
  }

  // Otherwise, render with the container and header
  return (
    <div
      className="border border-stone-300 dark:border-stone-700 rounded-md p-4 bg-amber-100 dark:bg-stone-800"
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-gray-800 dark:text-term-100">{title}</h2>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="text-term-700 dark:text-term-400 hover:text-term-800 dark:hover:text-term-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      {listContent}
    </div>
  );
}

export default GroupableModule;
