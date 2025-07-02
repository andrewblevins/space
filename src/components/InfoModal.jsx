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
        <h3 className="text-green-400 text-lg font-semibold mb-2">SPACE Terminal v0.2.3</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Version 0.2.2 adds new features and fixes.
        </p>
        
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded border-l-4 border-green-400">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Total Changes:</strong> 9 major new features • 20+ UI/UX improvements • 15+ technical enhancements • 13+ critical bug fixes
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h4 className="text-green-400 font-medium mb-3 text-lg">✨ New Features</h4>
          
          <div className="space-y-4 ml-4">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🎨 Light/Dark Theme Toggle</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>Theme switching in Settings menu</li>
                <li>Theming across all components and modals</li>
                <li>Contrast handling for both modes</li>
                <li>Moved from top-right to Settings menu</li>
                <li>Cream background (#f5f0e8, #f0e6d2) in light mode</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🏷️ Tagging System with Knowledge Dossier</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>Structured tagging with 7 categories: person, place, organization, topic, activity, state, other</li>
                <li>Cross-session memory compilation</li>
                <li>Knowledge Dossier GUI with three tabs:</li>
                <li className="ml-4">• Browse: Tag cloud with frequency-based coloring</li>
                <li className="ml-4">• Search: Full-text search across tagged messages</li>
                <li className="ml-4">• Recent: Timeline view of recent tagged messages</li>
                <li>Session context integration</li>
                <li>Click-to-navigate functionality</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">📄 Session Summaries with @ References</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>@ Reference Syntax: Use `@&lt;session_id&gt;` to reference previous sessions</li>
                <li>OpenAI-powered summaries with 3-5 bullet point format</li>
                <li>Integration into conversation flow</li>
                <li>Automatic replacement of @ references with session summaries</li>
                <li>Testing with 100% pass rate on API tests</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🔍 Session Autocomplete System</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>Autocomplete dropdown when typing `@` symbol</li>
                <li>Session title search with real-time filtering</li>
                <li>Multiple session references in single message (`@"Session A" @"Session B"`)</li>
                <li>Background context injection like Cursor's @Past Chats feature</li>
                <li>Session summaries as hidden system context</li>
                <li>Dropdown positioning that avoids screen clipping</li>
                <li>Keyboard navigation with arrow keys, Enter to select, Esc to close</li>
                <li>Session metadata display showing message count and timestamps</li>
                <li>Progressive summary caching for instant references</li>
                <li>Backward compatibility with legacy @1, @2 format</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">⚡ Summary Caching System</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>Caching strategy generating summaries at natural breakpoints</li>
                <li>Auto-generation when starting new sessions</li>
                <li>Long conversation summaries generated every 20 messages</li>
                <li>Instant lookup from cached summaries (no API delays)</li>
                <li>80% relevance threshold for cached summary usage</li>
                <li>Background processing that doesn't block UI</li>
                <li>Fallback generation for older sessions without cached summaries</li>
                <li>Summary metadata tracking (timestamp, message count covered)</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">📚 Advisor Library Feature</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>File attachment support for advisors (PDF, TXT, MD)</li>
                <li>Browser-compatible PDF parsing using PDF.js (replaced pdf-parse)</li>
                <li>Description generation from attached materials</li>
                <li>Library management GUI integrated into advisor creation flow</li>
                <li>100,000 character limit for library content per advisor</li>
                <li>File preview and management capabilities</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🎨 Welcome Screen Redesign</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>"See Past" tagline replacing "Think Deeper"</li>
                <li>Removed auto-updating carousel for static 2x2 feature grid</li>
                <li>Messaging focused on perspectival value proposition</li>
                <li>Design with subtle background pattern</li>
                <li>Features emphasizing cognitive expansion and mental space exploration</li>
                <li>"Begin Exploration" CTA replacing "Get Started"</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🔐 Remember Me Authentication</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>7-day remember me option for password authentication</li>
                <li>Encrypted session tokens stored locally using user's password as encryption key</li>
                <li>Automatic session validation on return visits to skip password re-entry</li>
                <li>Session management with automatic expiration and cleanup</li>
                <li>Password manager compatibility with autocomplete attributes</li>
                <li>Password creation messaging simplified</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🔄 Advisor Sharing System</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>File-based import/export replacing legacy slash commands</li>
                <li>Selective export with checkbox selection</li>
                <li>Drag-and-drop import with validation and preview</li>
                <li>Duplicate handling with conflict resolution</li>
                <li>Structured export format with metadata and versioning</li>
                <li>Import modes: Add (merge) or Replace (overwrite)</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">💰 Usage Tracking System</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>Real-time API cost tracking with 2025 pricing (Claude: $3/$15, GPT: $0.15/$0.60 per million tokens)</li>
                <li>Local storage - no usage data sent to servers</li>
                <li>Tracking across all SPACE features</li>
                <li>Usage analytics dashboard in Settings → API Keys</li>
                <li>Cost estimates on API setup page (~3-4¢ per message)</li>
                <li>Session tracking for usage pattern analysis</li>
                <li>Reset functionality with confirmation</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🎨 Advisor Color System</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>23-color palette organized following ROYGBIV spectrum</li>
                <li>Color selection UI with two-row layout (11 colors per row)</li>
                <li>Color dots displayed next to advisor names in sidebar</li>
                <li>Auto-assignment system for existing advisors ensuring unique colors</li>
                <li>Automatic color migration for pre-existing advisors</li>
                <li>Color coordination throughout advisor interface components</li>
                <li>Visual distinction between different advisors in conversations</li>
                <li>Color application across all advisor-related UI elements</li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🔧 Interface Organization Improvements</h5>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>Metaphors panel moved from left sidebar to right sidebar above Suggested Advisors</li>
                <li>Fullscreen button moved from top-right corner to accordion menu</li>
                <li>Accordion menu with New Session button</li>
                <li>Knowledge Dossier labeled as Beta</li>
                <li>Interface layout removing visual clutter</li>
                <li>Advisor response formatting with consistent spacing and structure</li>
                <li>Removed Clear Terminal functionality</li>
                <li>Panel organization for visual hierarchy</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-green-400 font-medium mb-3 text-lg">🐛 Bug Fixes</h4>
          
          <div className="ml-4">
            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🔧 Critical Fixes</h5>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
              <li>Fixed React Hooks violations causing infinite loops</li>
              <li>Resolved theme switching consistency issues</li>
              <li>Fixed PDF parsing browser compatibility</li>
              <li>Corrected state management in complex components</li>
              <li>Fixed color assignment logic ensuring unique colors for each advisor</li>
              <li>Resolved HTML tag rendering issues in system messages</li>
              <li>Fixed color row display inconsistencies in advisor forms</li>
            </ul>
          </div>
        </section>

        <section>
          <h4 className="text-green-400 font-medium mb-3 text-lg">🛠️ Technical Improvements</h4>
          
          <div className="ml-4">
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
              <li>API Testing Framework with real API integration tests</li>
              <li>React performance optimizations</li>
              <li>Browser compatibility fixes</li>
              <li>Code architecture improvements</li>
              <li>100% test coverage for new features</li>
              <li>Error handling throughout application</li>
              <li>Development tooling and automation</li>
            </ul>
          </div>
        </section>

        <section>
          <h4 className="text-green-400 font-medium mb-3 text-lg">🗑️ Deprecated Features</h4>
          
          <div className="ml-4">
            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">❓ Questions Feature (Deprecated)</h5>
            <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
              <li>Temporarily disabled questions analysis panel</li>
              <li>Preserved all code with deprecation comments for easy reactivation</li>
              <li>Cleaned up UI to focus on advisor suggestions</li>
              <li>Rationale: Advisors naturally handle questioning in conversations</li>
            </ul>
          </div>
        </section>

        <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
          <h4 className="text-green-400 font-medium mb-2">🏆 Summary</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Version 0.2.2 evolves SPACE Terminal from a terminal-focused interface to a GUI-driven conversation platform. 
            The integration of memory management, file handling, theme support, and user experience features positions 
            SPACE Terminal as a tool for AI-assisted thinking and collaboration.
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
            The testing framework ensures reliability, while the modular architecture supports future development and feature expansion.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;