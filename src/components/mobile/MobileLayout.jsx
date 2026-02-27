import React, { useState } from 'react';
import MobileHeader from './MobileHeader';
import MobileTabBar from './MobileTabBar';
import { MemoizedMarkdownMessage } from '../terminal/MemoizedMarkdownMessage';
import { AdvisorResponseCard } from '../terminal/AdvisorResponseCard';
import ThinkingBlock from '../ThinkingBlock';
import TouchInput from './TouchInput';
import FullScreenPerspectiveModal from '../terminal/FullScreenPerspectiveModal';
import MobileDisclaimerModal from './MobileDisclaimerModal';

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
  advisorSuggestions,
  handleAdvisorSuggestionClick,
  setShowAdvisorForm,
  setShowSettingsMenu,
  // DEPRECATED: Prompt Library - Feature no longer maintained
  // setShowPromptLibrary,
  setShowSessionPanel,
  setShowHelpModal,
  setShowInfoModal,
  processCouncilDebates,
  paragraphSpacing,
  setSelectedAdvisorForAssertions,
  setShowAssertionsModal,
  getSystemPrompt,
  onLogoClick
}) => {
  const [activeTab, setActiveTab] = useState('chat');
  // State for fullscreen perspective modal
  const [fullscreenModal, setFullscreenModal] = useState({
    isOpen: false,
    advisors: [],
    selectedIndex: 0
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="flex-1 flex flex-col h-full">
            {/* Chat messages */}
            <div className="flex-1 overflow-auto break-words px-4 scrollable-area min-h-0">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  id={`msg-${idx}`}
                  className={`mb-4 break-words text-lg ${
                    msg.type === 'user' ? 'text-gray-900 dark:text-gray-100 whitespace-pre-wrap border-l-4 border-gray-300 dark:border-stone-600 pl-4 font-sans' :
                    msg.type === 'assistant' ? 'text-gray-800 dark:text-term-100' :
                    msg.type === 'system' ? 'text-gray-800 dark:text-term-100' :
                    msg.type === 'debug' ? 'text-amber-600 dark:text-amber-400 whitespace-pre-wrap' : 'text-term-600 dark:text-term-400 whitespace-pre-wrap'
                  }`}
                >
                  {msg.type === 'system' ? (
                    <MemoizedMarkdownMessage content={msg.content} advisors={advisors} paragraphSpacing={paragraphSpacing} />
                  ) : msg.type === 'advisor_json' ? (
                    <div>
                      {msg.thinking && <ThinkingBlock content={msg.thinking} />}
                      {msg.isStreaming && (
                        <div className="mb-2 text-sm text-term-600 dark:text-term-400 italic">
                          ⚡ Streaming advisor responses...
                        </div>
                      )}
                      {msg.parsedAdvisors.advisors.map((advisor, advisorIdx) => (
                        <AdvisorResponseCard
                          key={`${advisor.id || advisor.name}-${advisorIdx}`}
                          advisor={advisor}
                          allAdvisors={advisors}
                          onAssertionsClick={(advisorData) => {
                            console.log('🎯 Assertions clicked for:', advisorData);
                            setSelectedAdvisorForAssertions({
                              ...advisorData,
                              conversationContext: {
                                messages: [...messages],
                                advisors: [...advisors],
                                systemPrompt: getSystemPrompt(),
                                timestamp: new Date().toISOString()
                              }
                            });
                            setShowAssertionsModal(true);
                          }}
                          totalAdvisorCount={msg.parsedAdvisors.advisors.length}
                          allAdvisorsInMessage={msg.parsedAdvisors.advisors}
                          onCardClick={(index) => setFullscreenModal({
                            isOpen: true,
                            advisors: msg.parsedAdvisors.advisors,
                            selectedIndex: index
                          })}
                          cardIndex={advisorIdx}
                        />
                      ))}
                      
                      {/* Show synthesis if it exists (for council mode or other cases) */}
                      {msg.parsedAdvisors.synthesis && (
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-stone-800 rounded-lg">
                          <h4 className="font-semibold text-gray-800 dark:text-term-100 mb-2">Synthesis</h4>
                          <MemoizedMarkdownMessage content={msg.parsedAdvisors.synthesis} advisors={advisors} paragraphSpacing={paragraphSpacing} />
                        </div>
                      )}
                    </div>
                  ) : msg.type === 'parallel_advisor_response' ? (
                    <div>
                      {!msg.allCompleted && (
                        <div className="mb-2 text-sm text-term-600 dark:text-term-400 italic">
                          ⚡ Parallel streaming in progress...
                        </div>
                      )}
                      {(() => {
                        // Convert advisorResponses to array format for fullscreen modal (once per message)
                        const advisorsArray = Object.entries(msg.advisorResponses).map(([id, data]) => ({
                          id,
                          name: data.name,
                          response: data.content,
                          content: data.content,
                          timestamp: msg.timestamp
                        }));

                        return Object.entries(msg.advisorResponses).map(([advisorId, advisorData], index) => {
                        // Generate unique response ID by combining message timestamp with advisor ID
                        // This ensures uniqueness across multiple responses from the same advisor
                        const uniqueResponseId = msg.timestamp 
                          ? `resp-${advisorId}-${msg.timestamp.replace(/[:.]/g, '-')}`
                          : `resp-${advisorId}-${Date.now()}`;
                        
                        const advisorForCard = {
                          id: uniqueResponseId,
                          name: advisorData.name,
                          response: advisorData.content,
                          timestamp: msg.timestamp
                        };

                        return (
                          <div key={advisorId}>
                            {advisorData.thinking && <ThinkingBlock content={advisorData.thinking} />}
                            <AdvisorResponseCard
                              advisor={advisorForCard}
                              allAdvisors={advisors}
                              onAssertionsClick={(advisorData) => {
                                console.log('🎯 Assertions clicked for:', advisorData);
                                setSelectedAdvisorForAssertions({
                                  ...advisorData,
                                  conversationContext: {
                                    messages: [...messages],
                                    advisors: [...advisors],
                                    systemPrompt: getSystemPrompt(),
                                    timestamp: new Date().toISOString()
                                  }
                                });
                                setShowAssertionsModal(true);
                              }}
                              totalAdvisorCount={Object.keys(msg.advisorResponses).length}
                                allAdvisorsInMessage={advisorsArray}
                                onCardClick={(cardIndex) => setFullscreenModal({
                                  isOpen: true,
                                  advisors: advisorsArray,
                                  selectedIndex: cardIndex
                                })}
                                cardIndex={index}
                            />
                            {advisorData.error && (
                              <div className="mb-2 text-sm text-red-600 dark:text-red-400 italic">
                                ⚠ Error with this advisor
                              </div>
                            )}
                          </div>
                        );
                        });
                      })()}
                    </div>
                  ) : msg.type === 'assistant' ? (
                    <div>
                      {msg.thinking && <ThinkingBlock content={msg.thinking} />}
                      {msg.isJsonStreaming && (
                        <div className="mb-2 text-sm text-blue-600 dark:text-blue-400 italic">
                          ⚡ Streaming advisor responses...
                        </div>
                      )}
                      <MemoizedMarkdownMessage
                        content={msg.content}
                        advisors={advisors}
                        paragraphSpacing={paragraphSpacing}
                      />
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              ))}
              {isLoading && <div className="text-amber-600 dark:text-amber-400">Loading...</div>}
            </div>
            
            {/* Input area */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-stone-700 bg-amber-50 dark:bg-stone-900">
              <form onSubmit={handleSubmit}>
                <div className="flex items-end gap-3">
                  <span className="text-term-400 text-lg mb-3">&gt;</span>
                  <div className="flex-1">
                    <TouchInput
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onSubmit={handleSubmit}
                      isLoading={isLoading}
                      placeholder={isLoading ? 'Waiting for response...' : 'Type your message...'}
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      
      case 'advisors':
        return (
          <div className="flex-1 p-4 overflow-y-auto scrollable-area">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sage-400 text-xl font-semibold">Advisors</h2>
              <button
                onClick={() => setShowAdvisorForm(true)}
                className="w-8 h-8 rounded-full bg-term-500 text-black flex items-center justify-center hover:bg-term-400 transition-colors"
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
                      ? 'border-term-500 bg-term-50 dark:bg-term-950/20' 
                      : 'border-gray-300 dark:border-stone-600 bg-gray-50 dark:bg-stone-800/30 opacity-60'
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
                        className={`w-3 h-3 rounded-full flex-shrink-0 mr-2 ${advisor.color} ${!advisor.active ? 'opacity-50' : ''}`}
                      />
                      <span className={`font-medium ${advisor.active ? 'text-gray-800 dark:text-term-100' : 'text-gray-500 dark:text-gray-500'}`}>
                        {advisor.name}
                      </span>
                    </div>
                    {advisor.active && (
                      <span className="text-term-400 text-sm">Active</span>
                    )}
                  </div>
                  {advisor.description && (
                    <p className={`text-sm mt-1 line-clamp-2 ${advisor.active ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {advisor.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            {/* Suggested perspectives */}
            {advisorSuggestions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-term-400 text-lg font-medium mb-3">Suggested Perspectives</h3>
                <div className="space-y-2">
                  {advisorSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAdvisorSuggestionClick(suggestion)}
                      className="w-full text-left p-3 rounded-lg border border-gray-300 dark:border-stone-600 hover:border-term-500 transition-colors"
                    >
                      <span className="text-gray-800 dark:text-term-100">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'insights':
        return (
          <div className="flex-1 p-4 overflow-y-auto scrollable-area">
            <h2 className="text-sage-400 text-xl font-semibold mb-4">Insights</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Insights features coming soon. Check the Tools tab for session management.
            </p>
          </div>
        );
      
      case 'tools':
        return (
          <div className="flex-1 p-4 overflow-y-auto scrollable-area">
            <h2 className="text-sage-400 text-xl font-semibold mb-4">Tools</h2>
            
            {/* Tool buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setShowSessionPanel(true)}
                className="w-full p-3 text-left rounded-lg border border-gray-300 dark:border-stone-600 hover:border-term-500 transition-colors"
              >
                <span className="text-gray-800 dark:text-term-100">Previous Chats</span>
              </button>
              
              {/* DEPRECATED: Prompt Library - Feature no longer maintained */}
              {/* <button
                onClick={() => setShowPromptLibrary(true)}
                className="w-full p-3 text-left rounded-lg border border-gray-300 dark:border-stone-600 hover:border-term-500 transition-colors"
              >
                <span className="text-gray-800 dark:text-term-100">Prompt Library</span>
              </button> */}
              
              <button
                onClick={() => setShowSettingsMenu(true)}
                className="w-full p-3 text-left rounded-lg border border-gray-300 dark:border-stone-600 hover:border-term-500 transition-colors"
              >
                <span className="text-gray-800 dark:text-term-100">Settings</span>
              </button>
              
              <button
                onClick={() => setShowHelpModal(true)}
                className="w-full p-3 text-left rounded-lg border border-gray-300 dark:border-stone-600 hover:border-term-500 transition-colors"
              >
                <span className="text-gray-800 dark:text-term-100">Help</span>
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
    <MobileDisclaimerModal />
    <div className="flex flex-col h-full">
      <MobileHeader 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setShowInfoModal={setShowInfoModal}
        onLogoClick={onLogoClick}
      />
      
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
      
      <MobileTabBar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>

      {/* Fullscreen perspective modal */}
      {fullscreenModal.isOpen && (
        <FullScreenPerspectiveModal
          isOpen={fullscreenModal.isOpen}
          advisors={fullscreenModal.advisors}
          selectedIndex={fullscreenModal.selectedIndex}
          onClose={() => setFullscreenModal({ isOpen: false, advisors: [], selectedIndex: 0 })}
          onAssertionsClick={(advisorData) => {
            setFullscreenModal({ isOpen: false, advisors: [], selectedIndex: 0 });
            setSelectedAdvisorForAssertions({
              ...advisorData,
              conversationContext: {
                messages: [...messages],
                advisors: [...advisors],
                systemPrompt: getSystemPrompt(),
                timestamp: new Date().toISOString()
              }
            });
            setShowAssertionsModal(true);
          }}
          allAdvisors={advisors}
        />
      )}
    </>
  );
};

export default MobileLayout; 