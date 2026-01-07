import { useState, useEffect } from "react";

// Shared color theme configurations
const colorThemes = {
  green: { text: 'text-term-400', textDim: 'text-term-500/50', textMid: 'text-term-400/80', hoverBg: 'hover:bg-term-500/10', activeBg: 'bg-term-500/20', border: 'border-term-500' },
  mahogany: { text: 'text-rose-300', textDim: 'text-rose-400/50', textMid: 'text-rose-300/80', hoverBg: 'hover:bg-rose-900/30', activeBg: 'bg-rose-900/30', border: 'border-rose-400' },
  burgundy: { text: 'text-red-300', textDim: 'text-red-400/50', textMid: 'text-red-300/80', hoverBg: 'hover:bg-red-900/30', activeBg: 'bg-red-900/30', border: 'border-red-400' },
  amber: { text: 'text-amber-400', textDim: 'text-amber-500/50', textMid: 'text-amber-400/80', hoverBg: 'hover:bg-amber-500/20', activeBg: 'bg-amber-500/20', border: 'border-amber-400' },
  cyan: { text: 'text-cyan-400', textDim: 'text-cyan-500/50', textMid: 'text-cyan-400/80', hoverBg: 'hover:bg-cyan-500/20', activeBg: 'bg-cyan-500/20', border: 'border-cyan-400' },
  violet: { text: 'text-violet-400', textDim: 'text-violet-500/50', textMid: 'text-violet-400/80', hoverBg: 'hover:bg-violet-500/20', activeBg: 'bg-violet-500/20', border: 'border-violet-400' },
  copper: { text: 'text-term-300', textDim: 'text-term-400/50', textMid: 'text-term-300/80', hoverBg: 'hover:bg-term-700/20', activeBg: 'bg-term-700/20', border: 'border-term-400' },
  slate: { text: 'text-slate-300', textDim: 'text-slate-400/50', textMid: 'text-slate-300/80', hoverBg: 'hover:bg-slate-500/20', activeBg: 'bg-slate-500/20', border: 'border-slate-400' },
};

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
 * @param {string} [props.colorTheme='green'] - Color theme
 */
export function RecentChats({
  maxItems = 5,
  currentSessionId,
  onLoadSession,
  onShowMore,
  useDatabaseStorage = false,
  storage = null,
  variant = 'subtle',
  colorTheme = 'copper',
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

  const ct = colorThemes[colorTheme] || colorThemes.green;

  // Style configurations based on variant
  const emptyStyles = {
    subtle: "text-gray-500 dark:text-gray-500",
    terminal: ct.textDim,
    hybrid: `text-gray-500 dark:${ct.textDim}`,
  };

  const buttonStyles = {
    subtle: {
      current: "bg-term-700/20 dark:bg-term-500/20 text-term-700 dark:text-term-300 font-medium",
      normal: "hover:bg-gray-200/60 dark:hover:bg-gray-700/50 text-gray-700 dark:text-term-200",
    },
    terminal: {
      current: `${ct.activeBg} ${ct.text} font-medium border-l-2 ${ct.border}`,
      normal: `${ct.hoverBg} ${ct.textMid} hover:${ct.text}`,
    },
    hybrid: {
      current: `bg-term-700/20 dark:${ct.activeBg} text-term-700 dark:${ct.text} font-medium`,
      normal: `hover:bg-gray-200/60 dark:${ct.hoverBg} text-gray-700 dark:${ct.textMid}`,
    },
  };

  const showMoreStyles = {
    subtle: "text-term-600 dark:text-term-400 hover:text-term-700 dark:hover:text-term-300 hover:bg-gray-100 dark:hover:bg-gray-700/50",
    terminal: `${ct.text} hover:${ct.text} ${ct.hoverBg}`,
    hybrid: `text-term-600 dark:${ct.text} hover:text-term-700 hover:bg-gray-100 dark:${ct.hoverBg}`,
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

