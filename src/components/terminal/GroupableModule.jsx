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
    <div className="bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-white">{title}</h2>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="text-green-400 hover:text-green-300 transition-colors"
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
              className={`flex items-center justify-between text-gray-300 cursor-pointer hover:text-green-400 transition-colors ${activeGroups.includes(group.name) ? 'text-green-400' : ''}`}
              onClick={() => onGroupClick && onGroupClick(group)}
            >
              <span>{group.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroup(group.name);
                }}
                className="ml-2 text-gray-400 hover:text-green-400"
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
                      className={`text-gray-300 cursor-pointer hover:text-green-400 transition-colors ${activeItems.includes(advisor) ? 'text-green-400' : ''}`}
                      onClick={() => onItemClick && onItemClick(advisor)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        try {
                          const menu = document.createElement('div');
                          menu.className = `absolute bg-gray-900 border border-green-400 rounded-md shadow-lg py-1 z-50`;
                          menu.style.left = `${e.pageX}px`;
                          menu.style.top = `${e.pageY}px`;

                          const editButton = document.createElement('button');
                          editButton.className = 'w-full px-4 py-2 text-left text-green-400 hover:bg-gray-800';
                          editButton.textContent = 'Edit Advisor';
                          editButton.onclick = () => {
                            setEditingAdvisor && setEditingAdvisor(advisor);
                            document.body.removeChild(menu);
                          };

                          const deleteButton = document.createElement('button');
                          deleteButton.className = 'w-full px-4 py-2 text-left text-green-400 hover:bg-gray-800';
                          deleteButton.textContent = 'Delete Advisor';
                          deleteButton.onclick = () => {
                            setAdvisors && setAdvisors((prev) => prev.filter((a) => a.name !== advisor.name));
                            setMessages &&
                              setMessages((prev) => [
                                ...prev,
                                { type: 'system', content: `Deleted advisor: ${advisor.name}` },
                              ]);
                            document.body.removeChild(menu);
                          };

                          menu.appendChild(editButton);
                          menu.appendChild(deleteButton);
                          document.body.appendChild(menu);

                          const removeMenu = (ev) => {
                            if (!menu.contains(ev.target)) {
                              if (menu.parentNode) {
                                document.body.removeChild(menu);
                              }
                              document.removeEventListener('click', removeMenu);
                            }
                          };
                          document.addEventListener('click', removeMenu);
                        } catch (error) {
                          console.error('Error creating context menu:', error);
                        }
                      }}
                    >
                      {advisor.name}
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
              className={`text-gray-300 cursor-pointer hover:text-green-400 transition-colors ${activeItems.includes(item) ? 'text-green-400' : ''}`}
              onClick={() => onItemClick && onItemClick(item)}
              onContextMenu={(e) => {
                e.preventDefault();
                try {
                  const menu = document.createElement('div');
                  menu.className = `absolute bg-gray-900 border border-green-400 rounded-md shadow-lg py-1 z-50`;
                  menu.style.left = `${e.pageX}px`;
                  menu.style.top = `${e.pageY}px`;

                  const editButton = document.createElement('button');
                  editButton.className = 'w-full px-4 py-2 text-left text-green-400 hover:bg-gray-800';
                  editButton.textContent = 'Edit Advisor';
                  editButton.onclick = () => {
                    setEditingAdvisor && setEditingAdvisor(item);
                    document.body.removeChild(menu);
                  };

                  const deleteButton = document.createElement('button');
                  deleteButton.className = 'w-full px-4 py-2 text-left text-green-400 hover:bg-gray-800';
                  deleteButton.textContent = 'Delete Advisor';
                  deleteButton.onclick = () => {
                    setAdvisors && setAdvisors((prev) => prev.filter((a) => a.name !== item.name));
                    setMessages &&
                      setMessages((prev) => [
                        ...prev,
                        { type: 'system', content: `Deleted advisor: ${item.name}` },
                      ]);
                    document.body.removeChild(menu);
                  };

                  menu.appendChild(editButton);
                  menu.appendChild(deleteButton);
                  document.body.appendChild(menu);

                  const removeMenu = (ev) => {
                    if (!menu.contains(ev.target)) {
                      if (menu.parentNode) {
                        document.body.removeChild(menu);
                      }
                      document.removeEventListener('click', removeMenu);
                    }
                  };
                  document.addEventListener('click', removeMenu);
                } catch (error) {
                  console.error('Error creating context menu:', error);
                }
              }}
            >
              {item.name}
            </li>
          ))}
      </ul>
    </div>
  );
}

export default GroupableModule;
