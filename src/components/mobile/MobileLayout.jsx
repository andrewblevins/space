import React, { useState } from 'react';
import MobileHeader from './MobileHeader';
import MobileTabBar from './MobileTabBar';

/**
 * MobileLayout component provides the main layout structure for mobile devices
 * Features: Tab-based navigation, header, and content area
 */
const MobileLayout = ({ 
  advisors, 
  setAdvisors,
  messages, 
  setMessages, 
  input, 
  setInput, 
  isLoading, 
  handleSubmit,
  metaphors,
  advisorSuggestions,
  handleAdvisorSuggestionClick,
  setShowAdvisorForm,
  setShowSettingsMenu,
  setShowPromptLibrary,
  setShowSessionPanel,
  setShowHelpModal,
  setShowInfoModal,
  children
}) => {
  const [activeTab, setActiveTab] = useState('chat');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="flex-1 flex flex-col p-4">
            {/* Chat messages */}
            <div className="flex-1 overflow-auto mb-4 break-words">
              {messages.map((msg, idx) => (
                <div key={idx} className="mb-4 break-words">
                  {/* Message rendering will be handled by parent component */}
                  {children?.chatContent?.(msg, idx)}
                </div>
              ))}
            </div>
            
            {/* Input area */}
            <div className="mt-auto">
              <form onSubmit={handleSubmit}>
                <div className="flex items-center">
                  <span className="mr-2 text-green-400">&gt;</span>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    className="flex-1 min-h-[44px] max-h-[120px] font-serif p-3 border border-green-600 focus:outline-none rounded-md resize-none bg-amber-50 text-gray-800 dark:bg-black dark:text-green-400"
                    placeholder={isLoading ? 'Waiting for response...' : 'Type your message...'}
                    disabled={isLoading}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="true"
                  />
                </div>
              </form>
            </div>
          </div>
        );
      
      case 'advisors':
        return (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-green-400 text-xl font-semibold">Advisors</h2>
              <button
                onClick={() => setShowAdvisorForm(true)}
                className="w-8 h-8 rounded-full bg-green-400 text-black flex items-center justify-center hover:bg-green-300 transition-colors"
                title="Add Advisor"
              >
                +
              </button>
            </div>
            
            {/* Advisor list */}
            <div className="space-y-3">
              {advisors.map((advisor, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    advisor.active 
                      ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  onClick={() => {
                    setAdvisors(prev => prev.map(a => 
                      a.name === advisor.name ? { ...a, active: !a.active } : a
                    ));
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-2 ${advisor.color}`}
                      />
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {advisor.name}
                      </span>
                    </div>
                    {advisor.active && (
                      <span className="text-green-400 text-sm">Active</span>
                    )}
                  </div>
                  {advisor.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {advisor.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            {/* Suggested advisors */}
            {advisorSuggestions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-green-400 text-lg font-medium mb-3">Suggested Advisors</h3>
                <div className="space-y-2">
                  {advisorSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAdvisorSuggestionClick(suggestion)}
                      className="w-full text-left p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-green-400 transition-colors"
                    >
                      <span className="text-gray-800 dark:text-gray-200">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'insights':
        return (
          <div className="flex-1 p-4 overflow-y-auto">
            <h2 className="text-green-400 text-xl font-semibold mb-4">Insights</h2>
            
            {/* Metaphors */}
            <div className="mb-6">
              <h3 className="text-green-400 text-lg font-medium mb-3">Metaphors</h3>
              {metaphors.length > 0 ? (
                <div className="space-y-2">
                  {metaphors.map((metaphor, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-800 dark:text-gray-200">{metaphor}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No metaphors generated yet.</p>
              )}
            </div>
          </div>
        );
      
      case 'tools':
        return (
          <div className="flex-1 p-4 overflow-y-auto">
            <h2 className="text-green-400 text-xl font-semibold mb-4">Tools</h2>
            
            {/* Tool buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setShowSessionPanel(true)}
                className="w-full p-3 text-left rounded-lg border border-gray-300 dark:border-gray-600 hover:border-green-400 transition-colors"
              >
                <span className="text-gray-800 dark:text-gray-200">Session Manager</span>
              </button>
              
              <button
                onClick={() => setShowPromptLibrary(true)}
                className="w-full p-3 text-left rounded-lg border border-gray-300 dark:border-gray-600 hover:border-green-400 transition-colors"
              >
                <span className="text-gray-800 dark:text-gray-200">Prompt Library</span>
              </button>
              
              <button
                onClick={() => setShowSettingsMenu(true)}
                className="w-full p-3 text-left rounded-lg border border-gray-300 dark:border-gray-600 hover:border-green-400 transition-colors"
              >
                <span className="text-gray-800 dark:text-gray-200">Settings</span>
              </button>
              
              <button
                onClick={() => setShowHelpModal(true)}
                className="w-full p-3 text-left rounded-lg border border-gray-300 dark:border-gray-600 hover:border-green-400 transition-colors"
              >
                <span className="text-gray-800 dark:text-gray-200">Help</span>
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <MobileHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setShowInfoModal={setShowInfoModal}
      />
      
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
      
      <MobileTabBar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

export default MobileLayout; 