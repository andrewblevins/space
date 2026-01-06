import { useState, useEffect } from "react";

/**
 * Displays a list of recent chat sessions with a "Show more..." button.
 * @param {object} props
 * @param {number} [props.maxItems=5] - Maximum number of items to show
 * @param {string} [props.currentSessionId] - The current session ID to highlight
 * @param {function} props.onLoadSession - Callback when a session is clicked
 * @param {function} props.onShowMore - Callback when "Show more..." is clicked
 * @param {boolean} [props.useDatabaseStorage=false] - Whether to use database storage
 * @param {object} [props.storage=null] - Storage service for database access
 * @param {'subtle' | 'terminal' | 'hybrid'} [props.variant='subtle'] - Style variant
 */
export function RecentChats({
  maxItems = 5,
  currentSessionId,
  onLoadSession,
  onShowMore,
  useDatabaseStorage = false,
  storage = null,
  variant = 'subtle',
}) {
  const [recentSessions, setRecentSessions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // Load sessions from localStorage
  const loadLocalStorageSessions = () => {
    const sessionList = [];
    const seenIds = new Set();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("space_session_")) {
        try {
          const sessionData = localStorage.getItem(key);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session && session.id && !seenIds.has(session.id)) {
              seenIds.add(session.id);
              sessionList.push(session);
            }
          }
        } catch (error) {
          console.warn(`Failed to parse session data: ${key}`, error);
        }
      }
    }

    return sessionList
      .filter((session) => {
        const nonSystemMessages = session.messages?.filter(
          (m) => m.type !== "system"
        );
        return nonSystemMessages && nonSystemMessages.length > 0;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .map((session) => ({
        ...session,
        messageCount: session.messages?.filter((m) => m.type !== "system")
          .length || 0,
      }));
  };

  // Load all sessions
  const loadAllSessions = async () => {
    const localStorageSessions = loadLocalStorageSessions();
    let allSessions = [...localStorageSessions];

    // If using database storage, fetch and merge database conversations
    if (useDatabaseStorage && storage) {
      try {
        const conversations = await storage.listConversations();
        if (conversations && conversations.length > 0) {
          const dbSessions = conversations.map((conv) => ({
            id: conv.id,
            title: conv.title || `Session ${conv.id.substring(0, 8)}`,
            timestamp: conv.updated_at || conv.created_at,
            messageCount: 0,
            isDatabase: true,
          }));

          allSessions = [...allSessions, ...dbSessions].sort((a, b) => {
            const timeA = new Date(a.timestamp);
            const timeB = new Date(b.timestamp);
            return timeB - timeA;
          });
        }
      } catch (error) {
        console.error("Failed to load database conversations:", error);
      }
    }

    setTotalCount(allSessions.length);
    setRecentSessions(allSessions.slice(0, maxItems));
  };

  useEffect(() => {
    loadAllSessions();
    
    // Set up an interval to refresh the list periodically
    const interval = setInterval(loadAllSessions, 5000);
    return () => clearInterval(interval);
  }, [maxItems, useDatabaseStorage, storage, currentSessionId]);

  // Convert title to sentence case (first letter caps, rest lowercase)
  const toSentenceCase = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Style configurations based on variant
  const emptyStyles = {
    subtle: "text-gray-500 dark:text-gray-500",
    terminal: "text-green-500/60",
    hybrid: "text-gray-500 dark:text-green-500/60",
  };

  const buttonStyles = {
    subtle: {
      current: "bg-green-600/20 dark:bg-green-500/20 text-green-700 dark:text-green-300 font-medium",
      normal: "hover:bg-gray-200/60 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300",
    },
    terminal: {
      current: "bg-green-500/20 text-green-300 font-medium border-l-2 border-green-400",
      normal: "hover:bg-green-500/10 text-green-400/80 hover:text-green-300",
    },
    hybrid: {
      current: "bg-green-600/20 dark:bg-green-500/20 text-green-700 dark:text-green-300 font-medium",
      normal: "hover:bg-gray-200/60 dark:hover:bg-green-500/10 text-gray-700 dark:text-green-400/80",
    },
  };

  const showMoreStyles = {
    subtle: "text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-gray-100 dark:hover:bg-gray-700/50",
    terminal: "text-green-400 hover:text-green-300 hover:bg-green-500/10",
    hybrid: "text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-gray-100 dark:hover:bg-green-500/10",
  };

  if (recentSessions.length === 0) {
    return (
      <div className={`text-sm py-2 ${emptyStyles[variant] || emptyStyles.subtle}`}>
        No previous chats yet
      </div>
    );
  }

  const currentVariant = buttonStyles[variant] || buttonStyles.subtle;

  return (
    <div className="space-y-0.5">
      {recentSessions.map((session) => {
        const sessionIdStr = String(session.id);
        const currentSessionIdStr = currentSessionId
          ? String(currentSessionId)
          : null;
        const isCurrentSession = sessionIdStr === currentSessionIdStr;

        const rawTitle = session.title || `Session ${session.id}`;
        const sessionTitle = toSentenceCase(rawTitle);
        
        return (
          <button
            key={session.id}
            onClick={() => !isCurrentSession && onLoadSession(session.id)}
            className={`w-full text-left px-2.5 py-1.5 rounded transition-all truncate text-sm ${
              isCurrentSession ? currentVariant.current : currentVariant.normal
            }`}
            title={sessionTitle}
          >
            {sessionTitle}
          </button>
        );
      })}

      {/* Show more button */}
      {totalCount > maxItems && (
        <button
          onClick={onShowMore}
          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${showMoreStyles[variant] || showMoreStyles.subtle}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          Show more... ({totalCount - maxItems} more)
        </button>
      )}
    </div>
  );
}

export default RecentChats;

