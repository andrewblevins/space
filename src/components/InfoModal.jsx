import React, { useState } from 'react';

const InfoModal = ({ isOpen, onClose }) => {
  const [showChangelog, setShowChangelog] = useState(false);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-100/70 dark:bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-stone-50 border border-green-600 rounded-lg w-full max-w-4xl mx-4 dark:bg-gray-900 dark:border-green-400 max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-4">
            {showChangelog && (
              <button
                onClick={() => setShowChangelog(false)}
                className="text-gray-400 hover:text-green-400 transition-colors"
                title="Back to About"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-green-400 text-xl font-semibold">
              {showChangelog ? 'Changelog v0.2.4' : 'About SPACE Terminal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-green-400 transition-colors"
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
              <h3 className="text-green-400 text-lg font-semibold mb-2">SPACE Terminal v0.2.4</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                An experimental interface for conversations with AI advisors
              </p>
            </div>

            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
              <h4 className="text-green-400 font-medium mb-2">About</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                SPACE stands for Simple Perspective-Augmenting Conversation Environment. 
                Create AI advisors with different perspectives and have collaborative conversations 
                that build knowledge over time.
              </p>
              
              <h4 className="text-green-400 font-medium mb-3">Features</h4>
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  <strong>Generate advisors frictionlessly.</strong> Create a constellation of advisors—each with distinct expertise and perspective.
                </p>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  <strong>Reference previous conversations.</strong> Context carries across sessions, building understanding over time.
                </p>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  <strong>Smart advisor suggestions.</strong> Get intelligent suggestions based on your conversation context.
                </p>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  <strong>Automatic knowledge tags.</strong> Track and search conversations by topic with intelligent categorization.
                </p>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  <strong>Metaphor pattern tracking.</strong> Make the structure of thought visible through connection mapping.
                </p>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  <strong>Cloud sync across devices.</strong> Access your conversations anywhere with Google sign-in.
                </p>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  <strong>Advisor evaluation system.</strong> Test responses with assertions and automated evaluation.
                </p>
              </div>
              
              <div className="mt-3">
                <button
                  onClick={onShowChangelog}
                  className="text-green-600 dark:text-green-400 hover:underline text-sm flex items-center gap-1"
                >
                  📋 View v0.2.4 Changelog
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
              <h4 className="text-green-400 font-medium mb-2">Creator</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Created by{' '}
                <a 
                  href="https://www.andrewshadeblevins.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  Andrew Blevins
                </a>
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
                For feedback or bug reports, email{' '}
                <a 
                  href="mailto:andrew.s.blevins@gmail.com"
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  andrew.s.blevins@gmail.com
                </a>
              </p>
            </div>

            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
              <p className="text-center text-xs text-gray-500">
                All data stored locally in your browser • Privacy-focused design
              </p>
            </div>
    </div>
    );
};

const ChangelogContent = () => {
  return (
    <div className="space-y-6 text-gray-800 dark:text-gray-200">
      <div className="text-center border-b border-gray-300 dark:border-gray-600 pb-4">
        <h3 className="text-green-400 text-lg font-semibold mb-2">SPACE Terminal v0.2.4</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Version 0.2.4 focuses on evaluation capabilities and streaming experience improvements.
        </p>
        
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded border-l-4 border-green-400">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Total Changes:</strong> 4 major features • 8 technical enhancements • 6 bug fixes • 4 UI improvements
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h4 className="text-green-400 font-medium mb-3 text-lg">✨ Major Features</h4>
          
          <div className="space-y-4 ml-4">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🎯 Advisor Evaluation System</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li><strong>Assert buttons</strong> on advisor response cards for creating test assertions</li>
                <li><strong>Assertions modal</strong> with natural language assertion creation</li>
                <li><strong>Evaluations modal</strong> with automated scoring against assertions</li>
                <li><strong>Optimization loop</strong> (MVP) for iterative prompt improvement using Gemini + Claude + evaluation cycle</li>
                <li><strong>Evaluation history</strong> stored in localStorage with session context</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">⚡ Streaming Improvements</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li><strong>Progressive advisor card rendering</strong> during response streaming</li>
                <li><strong>Early JSON detection</strong> switches to advisor format immediately</li>
                <li><strong>Real-time paragraph formatting</strong> with proper \n\n → paragraph break conversion</li>
                <li><strong>Streaming indicators</strong> show preparation and streaming status</li>
                <li><strong>Custom StreamingMarkdownRenderer</strong> for better real-time formatting</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-green-400 font-medium mb-3 text-lg">🔧 Technical Enhancements</h4>
          
          <div className="space-y-4 ml-4">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🔗 Backend Integration</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li><strong>Evaluation API endpoints</strong> for automated scoring</li>
                <li><strong>Session loading fixes</strong> restore advisor response formatting and Assert buttons</li>
                <li><strong>Progressive JSON parsing</strong> extracts advisor data during streaming</li>
                <li><strong>Escape sequence handling</strong> properly unescapes \n, \t, \", \\ in streaming content</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-green-400 font-medium mb-3 text-lg">🐛 Bug Fixes</h4>
          
          <div className="space-y-2 ml-4">
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
              <li><strong>Infinite loop prevention</strong> in conversation storage with message validation</li>
              <li><strong>Chrome error resolution</strong> by reducing debug logging</li>
              <li><strong>Paragraph formatting</strong> works correctly during streaming phase</li>
              <li><strong>Assert button availability</strong> in loaded sessions</li>
            </ul>
          </div>
        </section>

        <section>
          <h4 className="text-green-400 font-medium mb-3 text-lg">🎨 UI/UX Improvements</h4>
          
          <div className="space-y-2 ml-4">
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
              <li><strong>Streaming visual feedback</strong> with "⚡ Preparing advisor responses..." indicators</li>
              <li><strong>Progressive content updates</strong> show real advisor content instead of static placeholders</li>
              <li><strong>Improved markdown rendering</strong> for streaming responses</li>
              <li><strong>Better error handling</strong> for incomplete streaming data</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InfoModal;