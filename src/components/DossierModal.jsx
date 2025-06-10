import React, { useState, useEffect, useMemo } from 'react';
import { MemorySystem } from '../lib/memory';

const DossierModal = ({ isOpen, onClose, onJumpToSession }) => {
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  const memory = useMemo(() => new MemorySystem(), []);

  useEffect(() => {
    if (isOpen) {
      // Load all sessions when modal opens
      const sessions = memory.getAllSessions();
      setAllSessions(sessions);
    }
  }, [isOpen, memory]);

  // Extract all tagged messages with session context
  const allTaggedMessages = useMemo(() => {
    const messages = [];
    allSessions.forEach(session => {
      session.messages.forEach(message => {
        if (message.tags && message.tags.length > 0 && message.type !== 'system') {
          messages.push({
            ...message,
            sessionId: session.id,
            sessionTimestamp: session.timestamp
          });
        }
      });
    });
    return messages.sort((a, b) => 
      new Date(b.sessionTimestamp).getTime() - new Date(a.sessionTimestamp).getTime()
    );
  }, [allSessions]);

  // Generate tag cloud data
  const tagCloud = useMemo(() => {
    const tagCounts = {};
    allTaggedMessages.forEach(message => {
      message.tags.forEach(tag => {
        const tagValue = typeof tag === 'string' ? tag : tag.value;
        tagCounts[tagValue] = (tagCounts[tagValue] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50 tags
  }, [allTaggedMessages]);

  // Filter messages by selected tag
  const filteredMessages = useMemo(() => {
    if (!selectedTag) return allTaggedMessages.slice(0, 20); // Recent 20
    return allTaggedMessages.filter(message => 
      message.tags.some(tag => {
        const tagValue = typeof tag === 'string' ? tag : tag.value;
        return tagValue === selectedTag;
      })
    );
  }, [allTaggedMessages, selectedTag]);

  // Search functionality
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = allTaggedMessages.filter(message => {
      // Search in content
      const contentMatch = message.content.toLowerCase().includes(query);
      // Search in tags
      const tagMatch = message.tags.some(tag => {
        const tagValue = typeof tag === 'string' ? tag : tag.value;
        return tagValue.toLowerCase().includes(query);
      });
      return contentMatch || tagMatch;
    }).slice(0, 30); // Limit to 30 results

    setSearchResults(results);
  };

  // Get tag color based on frequency
  const getTagColor = (count, maxCount) => {
    const intensity = Math.min(count / maxCount, 1);
    if (intensity > 0.7) return 'text-green-300';
    if (intensity > 0.4) return 'text-green-400';
    if (intensity > 0.2) return 'text-green-500';
    return 'text-green-600';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateContent = (content, length = 100) => {
    return content.length > length ? content.substring(0, length) + '...' : content;
  };

  const maxTagCount = Math.max(...tagCloud.map(t => t.count), 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-green-400 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-green-400 text-xl font-semibold">Knowledge Dossier (Beta)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-green-400 text-xl">✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 mb-4">
          {[
            { id: 'browse', label: 'Browse', icon: '🏷️' },
            { id: 'search', label: 'Search', icon: '🔍' },
            { id: 'recent', label: 'Recent', icon: '⏰' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTag(null);
                setSearchResults([]);
                setSearchQuery('');
              }}
              className={`px-4 py-2 mr-2 border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-green-400 text-green-400' 
                  : 'border-transparent text-gray-400 hover:text-green-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          
          {/* Browse Tab */}
          {activeTab === 'browse' && (
            <div className="h-full flex">
              {/* Tag Cloud */}
              <div className="w-1/3 pr-4 border-r border-gray-700">
                <h3 className="text-green-400 mb-2 font-medium">
                  Knowledge Tags ({tagCloud.length})
                </h3>
                <div className="overflow-y-auto h-full">
                  {tagCloud.length === 0 ? (
                    <p className="text-gray-500 text-sm">No tagged messages yet. Start a conversation to build your dossier!</p>
                  ) : (
                    <div className="space-y-1">
                      {tagCloud.map(({ tag, count }) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(tag)}
                          className={`block w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                            selectedTag === tag 
                              ? 'bg-green-700 text-white' 
                              : `${getTagColor(count, maxTagCount)} hover:bg-gray-800`
                          }`}
                        >
                          {tag} <span className="text-gray-500">({count})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages for Selected Tag */}
              <div className="w-2/3 pl-4">
                {selectedTag ? (
                  <>
                    <h3 className="text-green-400 mb-2 font-medium">
                      Messages tagged "{selectedTag}" ({filteredMessages.length})
                    </h3>
                    <div className="overflow-y-auto h-full space-y-3">
                      {filteredMessages.map((message, index) => (
                        <div key={`${message.sessionId}-${index}`} className="bg-black border border-gray-700 rounded p-3">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-sm font-medium ${
                              message.type === 'user' ? 'text-green-400' : 'text-blue-400'
                            }`}>
                              {message.type === 'user' ? 'You' : 'Assistant'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-xs">
                                Session {message.sessionId} • {formatDate(message.sessionTimestamp)}
                              </span>
                              <button
                                onClick={() => onJumpToSession && onJumpToSession(message.sessionId)}
                                className="text-green-400 hover:text-green-300 text-xs underline"
                              >
                                Jump to session
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{truncateContent(message.content)}</p>
                          <div className="flex flex-wrap gap-1">
                            {message.tags.map((tag, tagIndex) => {
                              const tagValue = typeof tag === 'string' ? tag : tag.value;
                              return (
                                <span 
                                  key={tagIndex}
                                  className={`text-xs px-2 py-1 rounded ${
                                    tagValue === selectedTag ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300'
                                  }`}
                                >
                                  {tagValue}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">Select a tag to view related messages</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="h-full flex flex-col">
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search your dossier by content or tags..."
                    className="flex-1 bg-black border border-green-400 text-green-400 px-3 py-2 rounded focus:outline-none focus:border-green-300"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-gray-400 text-sm mb-3">Found {searchResults.length} results</p>
                    {searchResults.map((message, index) => (
                      <div key={`search-${message.sessionId}-${index}`} className="bg-black border border-gray-700 rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-sm font-medium ${
                            message.type === 'user' ? 'text-green-400' : 'text-blue-400'
                          }`}>
                            {message.type === 'user' ? 'You' : 'Assistant'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs">
                              Session {message.sessionId} • {formatDate(message.sessionTimestamp)}
                            </span>
                            <button
                              onClick={() => onJumpToSession && onJumpToSession(message.sessionId)}
                              className="text-green-400 hover:text-green-300 text-xs underline"
                            >
                              Jump to session
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{truncateContent(message.content, 200)}</p>
                        <div className="flex flex-wrap gap-1">
                          {message.tags.map((tag, tagIndex) => {
                            const tagValue = typeof tag === 'string' ? tag : tag.value;
                            return (
                              <span 
                                key={tagIndex}
                                className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded"
                              >
                                {tagValue}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <p className="text-gray-500 text-center mt-8">No results found for "{searchQuery}"</p>
                ) : (
                  <p className="text-gray-500 text-center mt-8">Enter a search term to explore your knowledge</p>
                )}
              </div>
            </div>
          )}

          {/* Recent Tab */}
          {activeTab === 'recent' && (
            <div className="h-full flex flex-col">
              <h3 className="text-green-400 mb-3 font-medium">
                Recent Tagged Messages ({allTaggedMessages.slice(0, 20).length})
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3">
                {allTaggedMessages.slice(0, 20).map((message, index) => (
                  <div key={`recent-${message.sessionId}-${index}`} className="bg-black border border-gray-700 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-medium ${
                        message.type === 'user' ? 'text-green-400' : 'text-blue-400'
                      }`}>
                        {message.type === 'user' ? 'You' : 'Assistant'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">
                          Session {message.sessionId} • {formatDate(message.sessionTimestamp)}
                        </span>
                        <button
                          onClick={() => onJumpToSession && onJumpToSession(message.sessionId)}
                          className="text-green-400 hover:text-green-300 text-xs underline"
                        >
                          Jump to session
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{truncateContent(message.content)}</p>
                    <div className="flex flex-wrap gap-1">
                      {message.tags.map((tag, tagIndex) => {
                        const tagValue = typeof tag === 'string' ? tag : tag.value;
                        return (
                          <span 
                            key={tagIndex}
                            className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded"
                          >
                            {tagValue}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="mt-4 pt-3 border-t border-gray-700 text-gray-500 text-sm">
          {allTaggedMessages.length > 0 ? (
            <>
              <span>{allTaggedMessages.length} tagged messages</span>
              <span className="mx-2">•</span>
              <span>{tagCloud.length} unique tags</span>
              <span className="mx-2">•</span>
              <span>{allSessions.length} total sessions</span>
            </>
          ) : (
            <span>Start conversations to build your knowledge dossier</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DossierModal;