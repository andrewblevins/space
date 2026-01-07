import React, { useState } from 'react';

const InfoModal = ({ isOpen, onClose }) => {
  const [showChangelog, setShowChangelog] = useState(false);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-100/70 dark:bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-stone-50 border border-term-700 rounded-lg w-full max-w-4xl mx-4 dark:bg-stone-900 dark:border-term-500 max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-4">
            {showChangelog && (
              <button
                onClick={() => setShowChangelog(false)}
                className="text-gray-400 hover:text-term-400 transition-colors"
                title="Back to About"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-term-400 text-xl font-semibold">
              {showChangelog ? 'Changelog v0.2.6' : 'About SPACE Terminal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-term-400 transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {showChangelog ? (
            <ChangelogContent />
          ) : (
            <AboutContent onShowChangelog={() => setShowChangelog(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

const AboutContent = ({ onShowChangelog }) => {
  return (
    <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-term-400 text-lg font-semibold mb-2">SPACE Terminal v0.2.6</h3>
              <p className="text-gray-600 dark:text-term-200 text-sm">
                An experimental tool for thinking with multiple AI perspectives
              </p>
            </div>

            <div className="border-t border-gray-300 dark:border-stone-600 pt-4">
              <h4 className="text-term-400 font-medium mb-2">About</h4>
              <p className="text-gray-600 dark:text-term-200 text-sm mb-3">
                SPACE stands for Simple Perspective-Augmenting Conversation Environment. 
                Generate AI perspectives with distinct viewpoints and think through things together.
              </p>
              
              <h4 className="text-term-400 font-medium mb-3">Features</h4>
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-term-200 text-sm">
                  <strong>Create perspectives on the fly.</strong> Describe what you need and get a new viewpoint instantly.
                </p>
                
                <p className="text-gray-600 dark:text-term-200 text-sm">
                  <strong>Save and revisit conversations.</strong> Your conversations are stored so you can pick up where you left off.
                </p>
                
                <p className="text-gray-600 dark:text-term-200 text-sm">
                  <strong>Smart perspective suggestions.</strong> Get intelligent suggestions based on your conversation.
                </p>
                
                <p className="text-gray-600 dark:text-term-200 text-sm">
                  <strong>Automatic knowledge tags.</strong> Track and search conversations by topic with intelligent categorization.
                </p>
                
                <p className="text-gray-600 dark:text-term-200 text-sm">
                  <strong>Metaphor pattern tracking.</strong> Make the structure of thought visible through connection mapping.
                </p>
                
                <p className="text-gray-600 dark:text-term-200 text-sm">
                  <strong>Cloud sync across devices.</strong> Access your conversations anywhere with Google sign-in.
                </p>
                
                <p className="text-gray-600 dark:text-term-200 text-sm">
                  <strong>Perspective evaluation.</strong> Test responses with assertions and automated evaluation.
                </p>
              </div>
              
              <div className="mt-3">
                <button
                  onClick={onShowChangelog}
                  className="text-term-600 dark:text-term-400 hover:underline text-sm flex items-center gap-1"
                >
                  📋 View v0.2.6 Changelog
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-300 dark:border-stone-600 pt-4">
              <h4 className="text-term-400 font-medium mb-2">Creator</h4>
              <p className="text-gray-600 dark:text-term-200 text-sm">
                Created by{' '}
                <a 
                  href="https://www.andrewshadeblevins.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-term-600 dark:text-term-400 hover:underline"
                >
                  Andrew Blevins
                </a>
              </p>
              <p className="text-gray-600 dark:text-term-200 text-sm mt-2">
                For feedback or bug reports, email{' '}
                <a 
                  href="mailto:andrew.s.blevins@gmail.com"
                  className="text-term-600 dark:text-term-400 hover:underline"
                >
                  andrew.s.blevins@gmail.com
                </a>
              </p>
            </div>

            <div className="border-t border-gray-300 dark:border-stone-600 pt-4">
              <p className="text-center text-xs text-gray-500">
                All data stored locally in your browser • Privacy-focused design
              </p>
            </div>
    </div>
    );
};

const ChangelogContent = () => {
  return (
    <div className="space-y-6 text-gray-800 dark:text-term-100">
      <div className="text-center border-b border-gray-300 dark:border-stone-600 pb-4">
        <h3 className="text-term-400 text-lg font-semibold mb-2">SPACE Terminal v0.2.6</h3>
        <p className="text-gray-600 dark:text-term-200 text-sm">
          Version 0.2.6 introduces comprehensive mobile responsive design and enhanced OpenRouter integration, providing users with access to 200+ AI models while maintaining optimal performance and user experience across all devices.
        </p>
        
        <div className="mt-4 p-3 bg-gray-100 dark:bg-stone-800 rounded border-l-4 border-term-500">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Total Changes:</strong> 3 major features • 12 technical enhancements • 4 bug fixes • 8 UI improvements
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h4 className="text-term-400 font-medium mb-3 text-lg">✨ Major Features</h4>
          
          <div className="space-y-4 ml-4">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">📱 Mobile Responsive Design</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-term-200 list-disc list-inside">
                <li><strong>Complete mobile layout system</strong> with MobileHeader, MobileLayout, MobileTabBar components</li>
                <li><strong>Touch-optimized input</strong> with TouchInput component for virtual keyboard handling</li>
                <li><strong>Responsive container</strong> that switches between mobile and desktop layouts at 1024px breakpoint</li>
                <li><strong>Touch scrolling isolation</strong> - chat messages scroll independently of viewport</li>
                <li><strong>Mobile-first CSS</strong> with touch-action properties and webkit-overflow-scrolling</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🔗 Enhanced OpenRouter Integration</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-term-200 list-disc list-inside">
                <li><strong>Dynamic model fetching</strong> from OpenRouter API with 200+ AI models</li>
                <li><strong>Multi-provider support</strong> from Anthropic, OpenAI, Google, Meta, Mistral, Cohere, and more</li>
                <li><strong>Environment-based behavior</strong> - full model selection in dev, hardcoded Claude Sonnet 4 in production</li>
                <li><strong>Simplified UI</strong> - single model dropdown in General tab (removed AI Provider tab)</li>
                <li><strong>Live model updates</strong> with refresh functionality and loading states</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">⚙️ Production Optimization</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-term-200 list-disc list-inside">
                <li><strong>Hardcoded Claude Sonnet 4</strong> for production consistency and performance</li>
                <li><strong>Cost control</strong> - production users get optimized model selection</li>
                <li><strong>Simplified UX</strong> - no confusing provider choices for end users</li>
                <li><strong>Developer flexibility</strong> - full model access during development</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-term-400 font-medium mb-3 text-lg">🔧 Technical Enhancements</h4>
          
          <div className="space-y-4 ml-4">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">📱 Mobile Architecture</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-term-200 list-disc list-inside">
                <li><strong>Responsive breakpoint system</strong> using window.innerWidth detection</li>
                <li><strong>Touch event handling</strong> with proper touch-action CSS properties</li>
                <li><strong>Height constraint fixes</strong> using min-h-0 and flex-shrink-0 for proper scrolling</li>
                <li><strong>Safe area support</strong> for devices with notches using env(safe-area-inset-*)</li>
                <li><strong>Mobile-friendly focus styles</strong> and input sizing to prevent zoom</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🔗 OpenRouter Backend</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-term-200 list-disc list-inside">
                <li><strong>New backend function</strong> functions/api/chat/openrouter.js for authenticated requests</li>
                <li><strong>Enhanced useOpenRouter hook</strong> with full streaming support and error handling</li>
                <li><strong>API configuration updates</strong> supporting multiple providers</li>
                <li><strong>Usage tracking enhancements</strong> for OpenRouter cost monitoring</li>
                <li><strong>Fallback handling</strong> with graceful degradation if API fails</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">💾 State Management</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-term-200 list-disc list-inside">
                <li><strong>Environment-aware defaults</strong> - different behavior for dev vs production</li>
                <li><strong>Model persistence</strong> in localStorage with production overrides</li>
                <li><strong>Loading states</strong> for better UX during API calls</li>
                <li><strong>Error boundaries</strong> with informative fallback content</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-term-400 font-medium mb-3 text-lg">🐛 Bug Fixes</h4>
          
          <div className="space-y-2 ml-4">
            <ul className="space-y-1 text-sm text-gray-700 dark:text-term-200 list-disc list-inside">
              <li><strong>Touch scrolling isolation</strong> - prevents whole page scrolling on mobile</li>
              <li><strong>Input area positioning</strong> - stays fixed at bottom on mobile</li>
              <li><strong>Model selection persistence</strong> - properly saves and loads selected models</li>
              <li><strong>API key validation</strong> - improved error messages and handling</li>
            </ul>
          </div>
        </section>

        <section>
          <h4 className="text-term-400 font-medium mb-3 text-lg">🎨 UI/UX Improvements</h4>
          
          <div className="space-y-2 ml-4">
            <ul className="space-y-1 text-sm text-gray-700 dark:text-term-200 list-disc list-inside">
              <li><strong>Cleaner Settings interface</strong> - removed confusing AI Provider tab</li>
              <li><strong>Mobile-optimized layouts</strong> - proper spacing and touch targets</li>
              <li><strong>Loading indicators</strong> - shows "Loading models..." during API calls</li>
              <li><strong>Refresh functionality</strong> - manual model list refresh button</li>
              <li><strong>Production info display</strong> - clear indication of active model in production</li>
              <li><strong>Touch-friendly scrollbars</strong> - optimized for mobile interaction</li>
              <li><strong>Responsive typography</strong> - proper scaling across device sizes</li>
              <li><strong>Dark mode support</strong> - consistent theming across mobile and desktop</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InfoModal;