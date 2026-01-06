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
 */
export function RecentChats({
  maxItems = 5,
  currentSessionId,
  onLoadSession,
  onShowMore,
  useDatabaseStorage = false,
  storage = null,
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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get a preview/snippet from the session
  const getSessionPreview = (session) => {
    if (!session.messages) return "";
    const userMessages = session.messages.filter((m) => m.type === "user");
    if (userMessages.length === 0) return "";
    const firstMessage = userMessages[0].content || "";
    return firstMessage.length > 50
      ? firstMessage.substring(0, 50) + "..."
      : firstMessage;
  };

  if (recentSessions.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-500 text-sm py-2">
        No previous chats yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {recentSessions.map((session) => {
        const sessionIdStr = String(session.id);
        const currentSessionIdStr = currentSessionId
          ? String(currentSessionId)
          : null;
        const isCurrentSession = sessionIdStr === currentSessionIdStr;

        const sessionTitle = session.title || `Session ${session.id}`;
        
        return (
          <button
            key={session.id}
            onClick={() => !isCurrentSession && onLoadSession(session.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all group ${
              isCurrentSession
                ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 cursor-default ring-1 ring-green-300 dark:ring-green-700"
                : "hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-800 dark:text-gray-200"
            }`}
            title={sessionTitle}
          >
            <div className="flex items-start gap-2.5">
              {/* Chat icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                  isCurrentSession
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span 
                    className="text-sm font-medium leading-snug line-clamp-2"
                    style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {sessionTitle}
                  </span>
                  {isCurrentSession && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 rounded font-semibold flex-shrink-0 mt-0.5">
                      NOW
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>{formatTimestamp(session.timestamp)}</span>
                  {session.messageCount > 0 && (
                    <>
                      <span className="opacity-50">•</span>
                      <span>{session.messageCount} msgs</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* Show more button */}
      {totalCount > maxItems && (
        <button
          onClick={onShowMore}
          className="w-full text-left px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors flex items-center gap-2"
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

