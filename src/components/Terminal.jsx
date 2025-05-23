import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { MemorySystem } from '../lib/memory';
import { OpenAI } from 'openai';
import AdvisorForm from './AdvisorForm';
import EditAdvisorForm from './EditAdvisorForm';
import EditPromptForm from './EditPromptForm';
import '@fontsource/vollkorn';
import TagAnalyzer from '../lib/tagAnalyzer';
import ApiKeySetup from './ApiKeySetup';
import { getApiEndpoint } from '../utils/apiConfig';
import { defaultPrompts } from '../lib/defaultPrompts';
import { handleApiError } from '../utils/apiErrorHandler';
import { getDecrypted, setEncrypted, removeEncrypted, setModalController } from '../utils/secureStorage';
import { useModal } from '../contexts/ModalContext';

const Module = ({ title, items = [], onItemClick, activeItems = [] }) => (
  <div className="bg-gray-900 p-4">
    <h2 className="text-white mb-2">{title}</h2>
    <ul className="space-y-4">
      {items.map((item, idx) => (
        <li 
          key={idx} 
          className={`
            text-gray-300 
            whitespace-pre-wrap 
            ${onItemClick ? 'cursor-pointer hover:text-green-400 transition-colors' : ''}
            ${activeItems.includes(item) ? 'text-green-400' : ''}
          `}
          onClick={() => onItemClick && onItemClick(item)}
        >
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const GroupableModule = ({ 
  title, 
  groups = [], 
  items = [], 
  onItemClick, 
  onGroupClick,
  activeItems = [],
  activeGroups = [],
  onAddClick,  // New prop for handling add button click
  setEditingAdvisor,
  setAdvisors,
  setMessages
}) => {
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => {
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
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        )}
      </div>
      <ul className="space-y-4">
        {groups.map((group, idx) => (
          <li key={`group-${idx}`} className="mb-2">
            <div 
              className={`
                flex items-center justify-between
                text-gray-300 cursor-pointer 
                hover:text-green-400 transition-colors
                ${activeGroups.includes(group.name) ? 'text-green-400' : ''}
              `}
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
                {group.advisors.map(advisorName => {
                  const advisor = items.find(item => item.name === advisorName);
                  if (!advisor) return null;
                  return (
                    <li 
                      key={advisorName}
                      className={`
                        text-gray-300 
                        cursor-pointer
                        hover:text-green-400 
                        transition-colors
                        ${activeItems.includes(advisor) ? 'text-green-400' : ''}
                      `}
                      onClick={() => onItemClick && onItemClick(advisor)}
                      onContextMenu={(e) => {
                        console.log('Context menu triggered for advisor:', advisor.name);
                        e.preventDefault();
                        
                        try {
                          const menu = document.createElement('div');
                          console.log('Creating menu element');
                          menu.className = `
                            absolute 
                            bg-gray-900 
                            border border-green-400 
                            rounded-md 
                            shadow-lg 
                            py-1
                            z-50
                          `;
                          menu.style.left = `${e.pageX}px`;
                          menu.style.top = `${e.pageY}px`;

                          console.log('Creating menu buttons');
                          const editButton = document.createElement('button');
                          editButton.className = 'w-full px-4 py-2 text-left text-green-400 hover:bg-gray-800';
                          editButton.textContent = 'Edit Advisor';
                          editButton.onclick = () => {
                            console.log('Edit button clicked for advisor:', advisor.name);
                            setEditingAdvisor && setEditingAdvisor(advisor);
                            document.body.removeChild(menu);
                          };

                          const deleteButton = document.createElement('button');
                          deleteButton.className = 'w-full px-4 py-2 text-left text-green-400 hover:bg-gray-800';
                          deleteButton.textContent = 'Delete Advisor';
                          deleteButton.onclick = () => {
                            console.log('Delete button clicked for advisor:', advisor.name);
                            setAdvisors && setAdvisors(prev => prev.filter(a => a.name !== advisor.name));
                            setMessages && setMessages(prev => [...prev, {
                              type: 'system',
                              content: `Deleted advisor: ${advisor.name}`
                            }]);
                            document.body.removeChild(menu);
                          };

                          menu.appendChild(editButton);
                          menu.appendChild(deleteButton);
                          console.log('Appending menu to document body');
                          document.body.appendChild(menu);

                          // Remove menu when clicking outside
                          const removeMenu = (e) => {
                            if (!menu.contains(e.target)) {
                              console.log('Removing menu due to outside click');
                              if (menu.parentNode) {  // Check if menu still exists in the DOM
                                document.body.removeChild(menu);
                              }
                              document.removeEventListener('click', removeMenu);
                            }
                          };
                          document.addEventListener('click', removeMenu);
                          
                          console.log('Context menu setup complete');
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
        {/* Ungrouped items */}
        {items
          .filter(item => !groups.some(g => g.advisors.includes(item.name)))
          .map((item, idx) => (
            <li 
              key={`item-${idx}`}
              className={`
                text-gray-300 
                cursor-pointer
                hover:text-green-400 
                transition-colors
                ${activeItems.includes(item) ? 'text-green-400' : ''}
              `}
              onClick={() => onItemClick && onItemClick(item)}
              onContextMenu={(e) => {
                console.log('Context menu triggered for advisor:', item.name);
                e.preventDefault();
                
                try {
                  const menu = document.createElement('div');
                  console.log('Creating menu element');
                  menu.className = `
                    absolute 
                    bg-gray-900 
                    border border-green-400 
                    rounded-md 
                    shadow-lg 
                    py-1
                    z-50
                  `;
                  menu.style.left = `${e.pageX}px`;
                  menu.style.top = `${e.pageY}px`;

                  console.log('Creating menu buttons');
                  const editButton = document.createElement('button');
                  editButton.className = 'w-full px-4 py-2 text-left text-green-400 hover:bg-gray-800';
                  editButton.textContent = 'Edit Advisor';
                  editButton.onclick = () => {
                    console.log('Edit button clicked for advisor:', item.name);
                    setEditingAdvisor && setEditingAdvisor(item);
                    document.body.removeChild(menu);
                  };

                  const deleteButton = document.createElement('button');
                  deleteButton.className = 'w-full px-4 py-2 text-left text-green-400 hover:bg-gray-800';
                  deleteButton.textContent = 'Delete Advisor';
                  deleteButton.onclick = () => {
                    console.log('Delete button clicked for advisor:', item.name);
                    setAdvisors && setAdvisors(prev => prev.filter(a => a.name !== item.name));
                    setMessages && setMessages(prev => [...prev, {
                      type: 'system',
                      content: `Deleted advisor: ${item.name}`
                    }]);
                    document.body.removeChild(menu);
                  };

                  menu.appendChild(editButton);
                  menu.appendChild(deleteButton);
                  console.log('Appending menu to document body');
                  document.body.appendChild(menu);

                  // Remove menu when clicking outside
                  const removeMenu = (e) => {
                    if (!menu.contains(e.target)) {
                      console.log('Removing menu due to outside click');
                      if (menu.parentNode) {  // Check if menu still exists in the DOM
                        document.body.removeChild(menu);
                      }
                      document.removeEventListener('click', removeMenu);
                    }
                  };
                  document.addEventListener('click', removeMenu);
                  
                  console.log('Context menu setup complete');
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
};

const MemoizedMarkdownMessage = React.memo(({ content }) => (
  <ReactMarkdown
    className="text-left font-serif w-full"
    components={{
      h1: ({children}) => <h1 className="text-blue-400 font-bold font-serif">{children}</h1>,
      h2: ({children}) => <h2 className="text-green-400 font-bold font-serif">{children}</h2>,
      code: ({node, inline, className, children, ...props}) => {
        const match = /language-(\w+)/.exec(className || '');
        return !inline ? (
          <pre className="bg-gray-900 p-4 rounded-md my-2 overflow-x-auto whitespace-pre-wrap break-all w-full">
            <code
              className={`${match ? `language-${match[1]}` : ''} text-white font-mono block`}
              {...props}
            >
              {children}
            </code>
          </pre>
        ) : (
          <code className="text-green-400 font-mono bg-gray-900 px-1 rounded" {...props}>
            {children}
          </code>
        );
      },
      p: ({children}) => <p className="text-white whitespace-pre-wrap font-serif mb-2 w-full">{children}</p>,
      ul: ({children}) => <ul className="text-white list-disc pl-4 space-y-1 mb-2 w-full">{children}</ul>,
      li: ({children}) => <li className="text-white">{children}</li>,
    }}
  >
    {content}
  </ReactMarkdown>
));

const ExpandingInput = ({ value, onChange, onSubmit, isLoading }) => {
  const [height, setHeight] = useState('100px');
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="flex-1">
      <div className="w-full h-1 cursor-ns-resize bg-green-400/10 hover:bg-green-400/20 transition-colors" 
           onMouseDown={(e) => {
             const startY = e.clientY;
             const startHeight = parseInt(height);
             
             const handleMouseMove = (moveEvent) => {
               const deltaY = startY - moveEvent.clientY;
               const newHeight = Math.min(400, Math.max(100, startHeight + deltaY));
               setHeight(`${newHeight}px`);
             };
             
             const handleMouseUp = () => {
               document.removeEventListener('mousemove', handleMouseMove);
               document.removeEventListener('mouseup', handleMouseUp);
             };
             
             document.addEventListener('mousemove', handleMouseMove);
             document.addEventListener('mouseup', handleMouseUp);
           }}
      />
      <textarea
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        style={{ height }}
        className={`
          w-full
          min-h-[100px]
          max-h-[400px]
          bg-black 
          text-green-400 
          font-serif 
          p-4
          border
          border-green-400
          focus:outline-none
          rounded-md
          resize-none
          ${isLoading ? 'opacity-50' : ''}
        `}
        placeholder={isLoading ? "Waiting for response..." : "Type your message..."}
        disabled={isLoading}
      />
    </div>
  );
};

const CollapsibleModule = ({ title, items = [], expanded, onToggle }) => (
  <div className="bg-gray-900 p-4">
    <div 
      className="flex justify-between items-center cursor-pointer hover:text-green-300 mb-2"
      onClick={onToggle}
    >
      <h2 className="text-white">{title}</h2>
      <span className="text-green-400">{expanded ? '▼' : '▶'}</span>
    </div>
    {expanded && (
      <ul className="space-y-4">
        {items.map((item, idx) => (
          <li key={idx} className="text-gray-300 whitespace-pre-wrap">
            {item}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const Terminal = () => {
  const modalController = useModal();
  
  // Initialize the modal controller for secureStorage
  useEffect(() => {
    if (modalController) {
      setModalController(modalController);
      
      // Only check for API keys after modal controller is initialized
      const checkKeys = async () => {
        try {
          const anthropicKey = await getDecrypted('space_anthropic_key');
          const openaiKey = await getDecrypted('space_openai_key');
          
          if (anthropicKey && openaiKey) {
            setApiKeysSet(true);
            
            // Initialize OpenAI client if keys are available
            const client = new OpenAI({
              apiKey: openaiKey,
              dangerouslyAllowBrowser: true
            });
            setOpenaiClient(client);
          }
        } catch (error) {
          console.error('Error checking API keys:', error);
        }
      };
      
      checkKeys();
    }
  }, [modalController]);

  const getNextSessionId = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('space_session_'));
    if (keys.length === 0) return 1;
    
    const ids = keys.map(key => parseInt(key.replace('space_session_', '')));
    return Math.max(...ids) + 1;
  };

  const [messages, setMessages] = useState([
    { type: 'system', content: 'SPACE Terminal - v0.1' },
    { type: 'system', content: 'Type /help for a list of commands.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [metaphors, setMetaphors] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(getNextSessionId());
  const [advisors, setAdvisors] = useState(() => {
    const saved = localStorage.getItem('space_advisors');
    return saved ? JSON.parse(saved) : [];
  });
  const [advisorGroups, setAdvisorGroups] = useState(() => {
    const saved = localStorage.getItem('space_advisor_groups');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeGroups, setActiveGroups] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  const inputRef = useRef(null);
  const [savedPrompts, setSavedPrompts] = useState(() => {
    const saved = localStorage.getItem('space_prompts');
    const userPrompts = saved ? JSON.parse(saved) : [];
    // Merge user prompts with defaults, giving precedence to user prompts
    const userPromptNames = new Set(userPrompts.map(p => p.name));
    const mergedPrompts = [
      ...userPrompts,
      ...defaultPrompts.filter(p => !userPromptNames.has(p.name))
    ];
    return mergedPrompts;
  });
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editText, setEditText] = useState('');
  const [editingAdvisor, setEditingAdvisor] = useState(null);
  const [editAdvisorText, setEditAdvisorText] = useState('');
  const [worksheetMode, setWorksheetMode] = useState(false);
  const [worksheetStep, setWorksheetStep] = useState(0);
  const [worksheetAnswers, setWorksheetAnswers] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentWorksheetId, setCurrentWorksheetId] = useState(null);
  const memory = new MemorySystem();
  const messagesContainerRef = useRef(null);
  const [showAdvisorForm, setShowAdvisorForm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const terminalRef = useRef(null);
  const [maxTokens, setMaxTokens] = useState(() => {
    const saved = localStorage.getItem('space_max_tokens');
    return saved ? parseInt(saved) : 4096;
  });
  const [metaphorsExpanded, setMetaphorsExpanded] = useState(false);
  const [questionsExpanded, setQuestionsExpanded] = useState(false);
  const [contextLimit, setContextLimit] = useState(150000);
  const [apiKeysSet, setApiKeysSet] = useState(false);
  const [openaiClient, setOpenaiClient] = useState(null);

  const worksheetQuestions = [
    {
      id: 'life_areas',
      question: "Name up to three areas of your life and how you would like to work on them. (Example: Career - I want to start an interior design practice; Physical Health - I'd like to do a handstand; Personal - I'd like to create a warm and inviting home environment)."
    },
    {
      id: 'inspiring_people',
      question: "Name up to three real people, living or dead, who you find inspiring. What do you admire about each of them?"
    },
    {
      id: 'fictional_characters',
      question: "Name up to three fictional characters you resonate with, and say what feels notable about each of them."
    },
    {
      id: 'viewquake_books',
      question: "Name up to three \"viewquake books\" that have helped shape your worldview."
    },
    {
      id: 'wisdom_traditions',
      question: "Name any philosophical or wisdom traditions that you practice or are interested in."
    },
    {
      id: 'aspirational_words',
      question: "Say three words about the type of person that you are interested in becoming or find inspiring."
    }
  ];

  const loadSessions = () => {
    const sessions = [];
    const seenIds = new Set();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('space_session_')) {
        const session = JSON.parse(localStorage.getItem(key));
        if (!seenIds.has(session.id)) {
          seenIds.add(session.id);
          sessions.push(session);
        }
      }
    }
    
    return sessions
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))  // Changed from b - a to a - b
      .map(session => ({
        ...session,
        messageCount: session.messages.filter(m => m.type !== 'system').length,
      }));
  };

  const handleCommand = (text) => {
    console.log('handleCommand called with:', text);
    if (text.startsWith('/')) {
      console.log('Command detected');
      // Split the command but preserve case for args
      const parts = text.split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);
      
      console.log('Parsed command:', command, 'args:', args);
      
      switch (command) {
        case '/sessions':
          console.log('Processing /sessions command');
          const sessions = loadSessions();
          console.log('Found sessions:', sessions);
          setMessages(prev => [...prev, {
            type: 'system',
            content: sessions.length ? 
              'Available sessions:\n' + sessions.map(s => {
                // Collect unique tags from all messages
                const tags = new Set();
                s.messages.forEach(msg => {
                  if (msg.tags) {
                    msg.tags.forEach(tag => tags.add(tag));
                  }
                });
                const tagList = Array.from(tags);
                
                return `Session #: ${s.id}\n` +
                  `  Created: ${new Date(s.timestamp).toLocaleString([], { 
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}\n` +
                  `  Messages: ${s.messageCount}\n` +
                  `  Tags: ${tagList.length ? tagList.join(', ') : 'none'}\n`;
              }).join('\n') :
              'No saved sessions found'
          }]);
          return true;

        case '/clear':
          setMessages([{ type: 'system', content: 'Terminal cleared' }]);
          setMetaphors([]);
          setQuestions([]);
          return true;

        case '/help':
          setMessages(prev => [...prev, {
            type: 'system',
            content: `# Available commands

## Session Management
/new              - Start a new session
/sessions         - List all sessions and their numbers
/load <id>        - Load a specific session (id = session number)
/load previous    - Load the most recent session

## Advisor Management
/advisor          - Show available advisor commands
/advisor add      - Add a new advisor
/advisor edit     - Edit an advisor
/advisor remove   - Remove an advisor
/advisor list     - List all advisors

## Group Management
/group create <group_name>         - Create a new advisor group (e.g. "/group create Psychologists")
/group add <group_name> <advisor>  - Add an advisor to a group (e.g. "/group add Psychologists Carl Jung")
/group remove <group_name> <advisor> - Remove an advisor from a group
/group list                        - List all advisor groups and their members

## Save and Use Prompts

/prompt add "name" <text> - Save a new prompt
/prompt list  - Show all saved prompts
/prompt use "name"  - Use a saved prompt
/prompt edit "name" - Edit an existing prompt
/prompt delete "name" - Delete a saved prompt

## API Keys
/key set [anthropic/openai] <api-key> - Update API key
/keys status - Check API key status
/keys clear - Clear stored API keys

## Settings

/context limit <number> - Set token limit for context management (default: 150,000)
/response length <number> - Set maximum length for Claude responses (default: 4,096, max: 8,192)`
          }]);
          return true;

        case '/new':
          setCurrentSessionId(getNextSessionId());
          setMessages([{ type: 'system', content: 'Started new session' }]);
          setMetaphors([]);
          setQuestions([]);
          return true;

        case '/load':
          if (args[0] === 'previous') {
            const sessions = loadSessions();
            if (sessions.length > 1) {  // Changed to check for at least 2 sessions
              const penultimate = sessions[sessions.length - 2];  // Changed to get second-to-last session
              setCurrentSessionId(penultimate.id);
              setMessages(penultimate.messages);
              setMetaphors(penultimate.metaphors || []);
              setQuestions(penultimate.questions || []);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Loaded previous session ${penultimate.id} from ${new Date(penultimate.timestamp).toLocaleString()}`
              }]);
            } else {
              setMessages(prev => [...prev, {
                type: 'system',
                content: sessions.length === 1 ? 'Only one session exists' : 'No previous sessions found'
              }]);
            }
            return true;
          }
          const sessionId = args[0];
          if (!sessionId) {
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'Usage: /load <session_id>'
            }]);
            return true;
          }
          
          const sessionData = localStorage.getItem(`space_session_${sessionId}`);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            setCurrentSessionId(session.id);
            setMessages(session.messages);
            setMetaphors(session.metaphors || []);
            setQuestions(session.questions || []);
          } else {
            setMessages(prev => [...prev, {
              type: 'system',
              content: `Session ${sessionId} not found`
            }]);
          }
          return true;

        case '/reset':
          setMessages(prev => [...prev, {
            type: 'system',
            content: 'Are you sure you want to delete all saved sessions? This cannot be undone.\n\nType "/reset confirm" to proceed, otherwise do anything else to cancel.'
          }]);
          return true;

        case '/reset confirm':
          // Clear all sessions from localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('space_session_')) {
              localStorage.removeItem(key);
            }
          });
          // Reset current session
          setCurrentSessionId(1);
          setMessages([{ type: 'system', content: 'All sessions cleared. Starting fresh with Session 1' }]);
          setMetaphors([]);
          setQuestions([]);
          return true;

        case '/advisor':
          if (!args[0]) {  // If no subcommand is provided
            setMessages(prev => [...prev, {
              type: 'system',
              content: `Available advisor commands:
/advisor add      - Add a new advisor
/advisor edit     - Edit an advisor
/advisor remove   - Remove an advisor
/advisor list     - List all advisors
/advisor generate - Generate advisor suggestions from worksheet
/advisor finalize - Get detailed profiles for chosen advisors`
            }]);
            return true;  // Add this to prevent fall-through to debug command
          }

          switch(args[0]) {
            case 'generate':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Usage: /advisor generate <worksheet_id>

This starts a guided process to generate your advisor panel:
1. First, Claude will analyze your worksheet and suggest 10 potential advisors
2. You can discuss and refine these suggestions with Claude
3. Once you've identified your preferred three, use "/advisor finalize" to get detailed profiles
4. Finally, you can add each advisor using the regular "/advisor add" command`
                }]);
                return true;
              }

              const worksheetData = localStorage.getItem(`space_worksheet_${args[1]}`);
              if (!worksheetData) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Worksheet ${args[1]} not found`
                }]);
                return true;
              }

              const worksheet = JSON.parse(worksheetData);
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'Starting advisor generation process...'
              }]);

              (async () => {
                try {
                  const response = await callClaude(`You are an intelligence gifted in reading a person's patterns and values and identifying what will benefit their growth and understanding. 

Attached is a worksheet filled out with information about myself. Read the worksheet, think carefully about what it reveals, and assemble a list of 10 potential advisors you think I would benefit from having an extended conversation with. 

There are no formal limits on advisor suggestions. 
* They can be real people or inspired by real people
* They can be fictional characters 
* They can be archetypal
* Or something stranger 

Please generate a mix of the above types. 

We will work together to evaluate these options and narrow them down until we have a panel of three advisors. The overall point is for me to leave this conversation with a set of three advisors I can instantiate as perspectival voices in a separate conversation with you. 

Ideally the set should be well-balanced and afford multiple ways of knowing and being.

For each advisor you suggest, give a brief explanation of why you think they might be a good match. Before naming the advisors, you may write out any patterns you observe in the worksheet that might be helpful for us in this process.

WORKSHEET DATA:
${JSON.stringify(worksheet.answers, null, 2)}`);

                  setMessages(prev => [...prev, {
                    type: 'assistant',
                    content: response
                  }, {
                    type: 'system',
                    content: 'Discuss these suggestions with me to narrow down to your preferred three advisors. Then use "/advisor finalize" to get detailed profiles.'
                  }]);
                } catch (error) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Error generating advisors: ' + error.message
                  }]);
                }
              })();
              return true;

            case 'finalize':
              (async () => {
                try {
                  const recentMessages = messages
                    .filter(msg => msg.type === 'user' || msg.type === 'assistant')
                    .slice(-10)
                    .map(msg => `${msg.type}: ${msg.content}`)
                    .join('\n\n');

                  const response = await callClaude(`Based on our previous discussion about potential advisors:

${recentMessages}

Now, I'd like to generate the final output. Please include the following aspects for each of our chosen advisors:

* Name
* Title 
* Specific intellectual, philosophical or wisdom traditions or concepts they embody 
* Their unique voice and speaking style 
* The precise types of situations they are most skilled at addressing`);

                  setMessages(prev => [...prev, {
                    type: 'assistant',
                    content: response
                  }, {
                    type: 'system',
                    content: 'You can now add these advisors using:\n/advisor add <name> "<description>"'
                  }]);
                } catch (error) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Error finalizing advisors: ' + error.message
                  }]);
                }
              })();
              return true;

            case 'add':
              setShowAdvisorForm(true);
              return true;

            case 'activate':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /advisor activate "name"'
                }]);
                return true;
              }
              
              const fullTextActivate = args.join(' ');
              const firstQuoteActivate = fullTextActivate.indexOf('"');
              const lastQuoteActivate = fullTextActivate.indexOf('"', firstQuoteActivate + 1);
              
              if (firstQuoteActivate === -1 || lastQuoteActivate === -1) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Advisor name must be enclosed in quotes'
                }]);
                return true;
              }

              const nameToActivate = fullTextActivate.slice(firstQuoteActivate + 1, lastQuoteActivate);
              const advisorToActivate = advisors.find(a => 
                a.name.toLowerCase() === nameToActivate.toLowerCase()
              );
              
              if (!advisorToActivate) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Advisor "${nameToActivate}" not found`
                }]);
                return true;
              }

              setAdvisors(prev => prev.map(a => 
                a.name.toLowerCase() === nameToActivate.toLowerCase() ? { ...a, active: true } : a
              ));
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Activated advisor: ${advisorToActivate.name}`
              }]);
              return true;

            case 'deactivate':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /advisor deactivate "name"'
                }]);
                return true;
              }
              
              const fullTextDeactivate = args.join(' ');
              const firstQuoteDeactivate = fullTextDeactivate.indexOf('"');
              const lastQuoteDeactivate = fullTextDeactivate.indexOf('"', firstQuoteDeactivate + 1);
              
              if (firstQuoteDeactivate === -1 || lastQuoteDeactivate === -1) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Advisor name must be enclosed in quotes'
                }]);
                return true;
              }

              const nameToDeactivate = fullTextDeactivate.slice(firstQuoteDeactivate + 1, lastQuoteDeactivate);
              const advisorToDeactivate = advisors.find(a => 
                a.name.toLowerCase() === nameToDeactivate.toLowerCase()
              );
              
              if (!advisorToDeactivate) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Advisor "${nameToDeactivate}" not found`
                }]);
                return true;
              }

              if (!advisorToDeactivate.active) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Advisor "${advisorToDeactivate.name}" is not currently active`
                }]);
                return true;
              }

              setAdvisors(prev => prev.map(a => 
                a.name.toLowerCase() === nameToDeactivate.toLowerCase() ? { ...a, active: false } : a
              ));
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Deactivated advisor: ${advisorToDeactivate.name}`
              }]);
              return true;

            case 'list':
              setMessages(prev => [...prev, {
                type: 'system',
                content: advisors.length ? 
                  '# Advisors\n\n' + advisors.map(a => 
                    `## ${a.name}${a.active ? ' (active)' : ''}\n${a.description}`
                  ).join('\n\n') :
                  'No advisors configured'
              }]);
              return true;

            case 'edit':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /advisor edit "name"'
                }]);
                return true;
              }
              
              const fullTextEdit = args.join(' ');
              const firstQuoteEdit = fullTextEdit.indexOf('"');
              const lastQuoteEdit = fullTextEdit.indexOf('"', firstQuoteEdit + 1);
              
              if (firstQuoteEdit === -1 || lastQuoteEdit === -1) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Advisor name must be enclosed in quotes'
                }]);
                return true;
              }

              const nameToEdit = fullTextEdit.slice(firstQuoteEdit + 1, lastQuoteEdit);
              const advisorToEdit = advisors.find(a => 
                a.name.toLowerCase() === nameToEdit.toLowerCase()
              );
              
              if (!advisorToEdit) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Advisor "${nameToEdit}" not found`
                }]);
                return true;
              }

              setEditingAdvisor(advisorToEdit);
              return true;

            case 'delete':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /advisor delete "name"'
                }]);
                return true;
              }
              
              const fullTextDelete = args.join(' ');
              const firstQuoteDelete = fullTextDelete.indexOf('"');
              const lastQuoteDelete = fullTextDelete.indexOf('"', firstQuoteDelete + 1);
              
              if (firstQuoteDelete === -1 || lastQuoteDelete === -1) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Advisor name must be enclosed in quotes'
                }]);
                return true;
              }

              const nameToDelete = fullTextDelete.slice(firstQuoteDelete + 1, lastQuoteDelete);
              const advisorToDelete = advisors.find(a => 
                a.name.toLowerCase() === nameToDelete.toLowerCase()
              );
              
              if (!advisorToDelete) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Advisor "${nameToDelete}" not found`
                }]);
                return true;
              }

              setAdvisors(prev => prev.filter(a => 
                a.name.toLowerCase() !== nameToDelete.toLowerCase()
              ));
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Deleted advisor: ${advisorToDelete.name}`
              }]);
              return true;
          }

        case '/debug':
          console.log('Debug command received');
          const newDebugMode = !debugMode;
          setDebugMode(newDebugMode);
          
          setMessages(prev => [...prev, {
            type: 'system',
            content: newDebugMode ? 
              'Debug mode enabled. You will now see detailed information about Claude API calls.' :
              'Debug mode disabled'
          }]);
          return true;

          case '/prompt':
            if (args[0] === 'use') {
              const promptName = args[1];
              const prompt = savedPrompts.find(p => p.name === promptName);
              if (prompt) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Using prompt: ${promptName}`
                }]);
                // Wrap the async operation in an IIFE
                (async () => {
                  try {
                    await callClaude(prompt.content || prompt.text);
                  } catch (error) {
                    setMessages(prev => [...prev, {
                      type: 'system',
                      content: `Error: ${error.message}`
                    }]);
                  }
                })();
              } else {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Prompt "${promptName}" not found`
                }]);
              }
              return true;
            }
          switch(args[0]) {
            case 'add':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /prompt add "name" <prompt_text>'
                }]);
                return true;
              }
              
              const fullTextAdd = args.join(' ');
              const firstQuoteAdd = fullTextAdd.indexOf('"');
              const lastQuoteAdd = fullTextAdd.indexOf('"', firstQuoteAdd + 1);
              
              if (firstQuoteAdd === -1 || lastQuoteAdd === -1) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Prompt name must be enclosed in quotes'
                }]);
                return true;
              }

              const nameToAdd = fullTextAdd.slice(firstQuoteAdd + 1, lastQuoteAdd);
              const promptText = fullTextAdd.slice(lastQuoteAdd + 1).trim();
              
              if (!promptText) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Prompt text is required'
                }]);
                return true;
              }

              setSavedPrompts(prev => [...prev, { name: nameToAdd, text: promptText }]);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Saved prompt: ${nameToAdd}`
              }]);
              return true;

            case 'delete':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /prompt delete "name"'
                }]);
                return true;
              }
              
              const fullTextDelete = args.join(' ');
              const firstQuoteDelete = fullTextDelete.indexOf('"');
              const lastQuoteDelete = fullTextDelete.indexOf('"', firstQuoteDelete + 1);
              
              if (firstQuoteDelete === -1 || lastQuoteDelete === -1) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Prompt name must be enclosed in quotes'
                }]);
                return true;
              }

              const nameToDelete = fullTextDelete.slice(firstQuoteDelete + 1, lastQuoteDelete);
              const promptToDelete = savedPrompts.find(p => 
                p.name.toLowerCase() === nameToDelete.toLowerCase()
              );
              
              if (!promptToDelete) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Prompt "${nameToDelete}" not found`
                }]);
                return true;
              }

              setSavedPrompts(prev => prev.filter(p => 
                p.name.toLowerCase() !== nameToDelete.toLowerCase()
              ));
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Deleted prompt: ${nameToDelete}`
              }]);
              return true;

            case 'use':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /prompt use "name"'
                }]);
                return true;
              }
              
              const fullTextUse = args.join(' ');
              const firstQuoteUse = fullTextUse.indexOf('"');
              const lastQuoteUse = fullTextUse.indexOf('"', firstQuoteUse + 1);
              
              if (firstQuoteUse === -1 || lastQuoteUse === -1) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Prompt name must be enclosed in quotes'
                }]);
                return true;
              }

              const nameToUse = fullTextUse.slice(firstQuoteUse + 1, lastQuoteUse);
              const promptToUse = savedPrompts.find(p => 
                p.name.toLowerCase() === nameToUse.toLowerCase()
              );
              
              if (!promptToUse) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Prompt "${nameToUse}" not found`
                }]);
                return true;
              }

              (async () => {
                setMessages(prev => [...prev, { type: 'user', content: promptToUse.text }]);
                setIsLoading(true);
                try {
                  const response = await callClaude(promptToUse.text);
                  setMessages(prev => [...prev, { type: 'assistant', content: response }]);
                } catch (error) {
                  setMessages(prev => [...prev, { 
                    type: 'system', 
                    content: 'Error: Failed to get response from Claude' 
                  }]);
                } finally {
                  setIsLoading(false);
                  setInput('');
                  focusInput();
                }
              })();
              return true;

            case 'edit':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /prompt edit "name"'
                }]);
                return true;
              }
              
              const fullTextEdit = args.join(' ');
              const firstQuoteEdit = fullTextEdit.indexOf('"');
              const lastQuoteEdit = fullTextEdit.indexOf('"', firstQuoteEdit + 1);
              
              if (firstQuoteEdit === -1 || lastQuoteEdit === -1) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Error: Prompt name must be enclosed in quotes'
                }]);
                return true;
              }

              const nameToEdit = fullTextEdit.slice(firstQuoteEdit + 1, lastQuoteEdit);
              const promptToEdit = savedPrompts.find(p => 
                p.name.toLowerCase() === nameToEdit.toLowerCase()
              );
              
              if (!promptToEdit) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Prompt "${nameToEdit}" not found`
                }]);
                return true;
              }

              setEditingPrompt(promptToEdit);
              setEditText(promptToEdit.text);
              return true;

            case 'list':
              setMessages(prev => [...prev, {
                type: 'system',
                content: savedPrompts.length ? 
                  '# Available Prompts\n\n' + savedPrompts.map(p => 
                    `## ${p.name}\n${p.content || p.text || 'No content available'}\n`
                  ).join('\n') :
                  'No saved prompts'
              }]);
              return true;

            default:
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'Available prompt commands:\n' +
                  '/prompt add "name" <text> - Save a new prompt\n' +
                  '/prompt list - Show all saved prompts\n' +
                  '/prompt use "name" - Use a saved prompt\n' +
                  '/prompt edit "name" - Edit an existing prompt\n' +
                  '/prompt delete "name" - Delete a saved prompt'
              }]);
              return true;
          }

        case '/export':
          try {
            const markdown = formatSessionAsMarkdown(messages);
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `space-session-${currentSessionId}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'Session exported successfully'
            }]);
          } catch (error) {
            setMessages(prev => [...prev, {
              type: 'system',
              content: `Error exporting session: ${error.message}`
            }]);
          }
          return true;

        case '/worksheet':
          if (!args[0]) {
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'Available worksheet commands:\n' +
                '/worksheet list - Show available worksheets\n' +
                '/worksheet view <id> - View a completed worksheet\n' +
                '/worksheet start <id> - Start filling out a specific worksheet'
            }]);
            return true;
          }

          switch(args[0]) {
            case 'list':
              // Show available worksheet templates
              const templateList = Object.entries(WORKSHEET_TEMPLATES)
                .map(([id, t]) => `${id}: ${t.name}\n   ${t.description}`).join('\n\n');
              
              // Show completed worksheets from localStorage
              const completedWorksheets = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('space_worksheet_')) {
                  const worksheet = JSON.parse(localStorage.getItem(key));
                  completedWorksheets.push({
                    id: key.replace('space_worksheet_', ''),
                    timestamp: worksheet.timestamp
                  });
                }
              }
              
              setMessages(prev => [...prev, {
                type: 'system',
                content: '📝 Available worksheet templates:\n' + 
                  templateList +
                  '\n\n✅ Completed worksheets:\n' + 
                  (completedWorksheets.length ? 
                    completedWorksheets.map(w => 
                      `${w.id} (completed ${new Date(w.timestamp).toLocaleString()})`
                    ).join('\n') :
                    'None')
              }]);
              return true;

            case 'view':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /worksheet view <id>'
                }]);
                return true;
              }

              const worksheetData = localStorage.getItem(`space_worksheet_${args[1]}`);
              if (!worksheetData) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Worksheet ${args[1]} not found`
                }]);
                return true;
              }

              try {
                const worksheet = JSON.parse(worksheetData);
                const template = WORKSHEET_TEMPLATES[worksheet.templateId];
                
                if (!template) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: `Error: Template ${worksheet.templateId} not found`
                  }]);
                  return true;
                }

                let content = `📝 Worksheet ${args[1]}\n`;
                content += `Completed: ${new Date(worksheet.timestamp).toLocaleString()}\n\n`;

                if (template.type === 'basic') {
                  // Handle basic worksheet format
                  template.questions.forEach(q => {
                    content += `Q: ${q.question}\n`;
                    content += `A: ${worksheet.answers[q.id] || 'No answer provided'}\n\n`;
                  });
                } else {
                  // Handle sectioned worksheet format
                  template.sections.forEach(section => {
                    content += `## ${section.name}\n\n`;
                    section.questions.forEach(q => {
                      content += `Q: ${q.question}\n`;
                      content += `A: ${worksheet.answers[q.id] || 'No answer provided'}\n\n`;
                    });
                  });
                }

                setMessages(prev => [...prev, {
                  type: 'system',
                  content: content
                }]);
                return true;
              } catch (error) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Error viewing worksheet: ${error.message}`
                }]);
                return true;
              }

            case 'start':
              const startId = args[1];
              if (!startId) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /worksheet start <id>'
                }]);
                return true;
              }

              const template = WORKSHEET_TEMPLATES[startId];
              if (template) {
                try {
                  setWorksheetMode(true);
                  setWorksheetStep(0);
                  setCurrentSection(0);  // Initialize section
                  setCurrentQuestion(0); // Initialize question
                  setCurrentWorksheetId(startId);
                  setWorksheetAnswers({});

                  // Different message format based on worksheet type
                  let startMessage;
                  if (template.sections) {
                    startMessage = `Starting ${template.name}\n\nSection: ${template.sections[0].name}\n\n${template.sections[0].questions[0].question}`;
                  } else {
                    startMessage = `Starting ${template.name}\n\n${template.questions[0].question}`;
                  }

                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: `${startMessage}\n\nType your answer or /cancel to exit.`
                  }]);
                } catch (error) {
                  console.error('Worksheet start error:', error);
                  setWorksheetMode(false);
                  setCurrentWorksheetId(null);
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: `Error starting worksheet: ${error.message}`
                  }]);
                }
              } else {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Worksheet template "${startId}" not found`
                }]);
              }
              return true;

            default:
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Unknown command: ${command}`
              }]);
              return true;
          }

        case '/memory':
          switch(args[0]) {
            case 'status':
              const sessions = memory.getAllSessions();
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Memory Status:
Sessions: ${sessions.length}
Total Messages: ${sessions.reduce((acc, s) => acc + s.messages.length, 0)}
Latest Session: ${sessions[0]?.timestamp || 'none'}`
              }]);
              return true;

            case 'search':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /memory search <query>'
                }]);
                return true;
              }
              const query = args.slice(1).join(' ');
              const relevant = memory.retrieveRelevantContext(query);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Found ${relevant.length} relevant messages:
${relevant.map((msg, i) => {
  // Split into paragraphs
  const paragraphs = msg.content.split(/\n\n+/);
  // Find paragraph(s) containing the search term
  const matchingParagraphs = paragraphs.filter(p => 
    p.toLowerCase().includes(query.toLowerCase())
  );
  // Calculate score for debugging
  const score = memory.calculateRelevance(msg, query);
  return `[${i + 1}] Score: ${score}\n[${msg.type}] ${matchingParagraphs.join('\n\n')}`
}).join('\n\n---\n\n')}`
              }]);
              return true;

            default:
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'Available memory commands:\n' +
                  '/memory status - Show memory statistics\n' +
                  '/memory search <query> - Test memory retrieval'
              }]);
              return true;
          }

        // case '/tokens':
         //  if (!args[0] || isNaN(args[0]) || args[0] < 1 || args[0] > 8192) {
            // setMessages(prev => [...prev, {
              // type: 'system',
              // content: `Usage: /tokens <1-8192>
              // Current max tokens: ${maxTokens}

              // Note: Higher values allow for longer responses
              // - Default is 4096
              // - Maximum is 8192
              // - Minimum is 1`
            // }]);
            // return true;
          // }
          
          const newMaxTokens = parseInt(args[0]);
          setMaxTokens(newMaxTokens);
          setMessages(prev => [...prev, {
            type: 'system',
            content: `Max tokens set to ${newMaxTokens}`
          }]);
          return true;

        case '/context':
          switch(args[0]) {
            case 'limit':
              if (!args[1] || isNaN(args[1])) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Usage: /context limit <number>
Current context limit: ${contextLimit.toLocaleString()} tokens

This setting controls when SPACE switches to managed context:
- Higher values send more history to Claude
- Lower values use less tokens but may lose context
- Default is 150,000`
                }]);
                return true;
              }
              
              const newLimit = parseInt(args[1].replace(/,/g, ''));
              setContextLimit(newLimit);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Context limit set to ${newLimit.toLocaleString()} tokens`
              }]);
              return true;

            default:
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'Available context commands:\n/context limit <number> - Set token limit for context management'
              }]);
              return true;
          }

        case '/capture':
          const selection = window.getSelection();
          const selectedText = selection?.toString().trim();
          
          if (!selection || !selectedText) {
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'No text selected. Please highlight some text before using /capture'
            }]);
            return true;
          }

          // Find which message contains the selection
          const range = selection.getRangeAt(0);
          let element = range.commonAncestorContainer;
          
          // Walk up the DOM tree until we find an element with an ID starting with 'msg-'
          while (element && (!element.id || !element.id.startsWith('msg-'))) {
            element = element.parentElement;
          }
          
          const messageId = element?.id;
          const messageIndex = messageId ? parseInt(messageId.replace('msg-', '')) : null;

          if (!messageIndex && messageIndex !== 0) {  // Check for both null and undefined
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'Could not determine message position for link'
            }]);
            return true;
          }

          try {
            const timestamp = new Date().toISOString();
            const markdown = formatCaptureAsMarkdown(selectedText, timestamp, messageIndex);
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `space-capture-${timestamp.split('T')[0]}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Check if menu is still in document before trying to remove it
            if (menu.parentNode === document.body) {
              document.body.removeChild(menu);
            }
            
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'Capture saved successfully'
            }]);
          } catch (error) {
            console.error('Error during capture:', error);
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'Error saving capture'
            }]);
          }
          return true;

        case '/group':
          if (!args[0]) {
            setMessages(prev => [...prev, {
              type: 'system',
              content: `Group Management Commands:

/group create <group_name>         - Create a new advisor group
/group add <group_name> <advisor>  - Add an advisor to a group
/group remove <group_name> <advisor> - Remove an advisor from a group
/group list                        - List all advisor groups

Examples:
/group create Psychologists
/group add Psychologists Carl Jung
/group remove Psychologists Carl Jung
/group list`
            }]);
            return true;
          }
          
          switch (args[0]) {
            case 'create':
              const groupName = args.slice(1).join(' ');
              if (!groupName) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Please provide a group name (e.g. "/group create Psychologists")'
                }]);
                return true;
              }
              if (advisorGroups.some(g => g.name === groupName)) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Group "${groupName}" already exists`
                }]);
                return true;
              }
              setAdvisorGroups(prev => [...prev, {
                name: groupName,
                description: '',
                advisors: [],
                active: false
              }]);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Created advisor group: ${groupName}`
              }]);
              return true;

            case 'add':
              if (args.length < 3) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Please provide both group name and advisor name (e.g. "/group add Psychologists Carl Jung")'
                }]);
                return true;
              }
              const [_, targetGroup, ...advisorName] = args;
              const advisor = advisors.find(a => a.name.toLowerCase() === advisorName.join(' ').toLowerCase());
              const group = advisorGroups.find(g => g.name.toLowerCase() === targetGroup.toLowerCase());
              
              if (!advisor) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Advisor "${advisorName.join(' ')}" not found`
                }]);
                return true;
              }
              if (!group) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Group "${targetGroup}" not found`
                }]);
                return true;
              }
              if (group.advisors.includes(advisor.name)) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `${advisor.name} is already in group ${targetGroup}`
                }]);
                return true;
              }
              
              setAdvisorGroups(prev => prev.map(g => 
                g.name === targetGroup
                  ? { ...g, advisors: [...g.advisors, advisor.name] }
                  : g
              ));
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Added ${advisor.name} to group ${targetGroup}`
              }]);
              return true;

            case 'remove':
              if (args.length < 3) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Please provide both group name and advisor name (e.g. "/group remove Psychologists Carl Jung")'
                }]);
                return true;
              }
              const [__, rmGroup, ...rmAdvisorName] = args;
              const rmAdvisor = advisors.find(a => a.name.toLowerCase() === rmAdvisorName.join(' ').toLowerCase());
              const rmTargetGroup = advisorGroups.find(g => g.name.toLowerCase() === rmGroup.toLowerCase());
              
              if (!rmAdvisor || !rmTargetGroup) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Advisor or group not found'
                }]);
                return true;
              }
              
              if (!rmTargetGroup.advisors.includes(rmAdvisor.name)) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `${rmAdvisor.name} is not in group ${rmGroup}`
                }]);
                return true;
              }
              
              setAdvisorGroups(prev => prev.map(g => 
                g.name === rmGroup
                  ? { ...g, advisors: g.advisors.filter(a => a !== rmAdvisor.name) }
                  : g
              ));
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Removed ${rmAdvisor.name} from group ${rmGroup}`
              }]);
              return true;

            case 'list':
              if (advisorGroups.length === 0) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'No advisor groups created yet'
                }]);
                return true;
              }
              const groupList = advisorGroups.map(g => 
                `${g.name}:\n${g.advisors.length ? g.advisors.map(a => `  - ${a}`).join('\n') : '  (empty)'}`
              ).join('\n\n');
              setMessages(prev => [...prev, {
                type: 'system',
                content: groupList
              }]);
              return true;
          }

        case '/response':
          if (args[0] === 'length') {
            if (!args[1] || isNaN(args[1])) {
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Usage: /response length <number>
Current response length: ${maxTokens.toLocaleString()} tokens

This setting controls the maximum length of Claude's responses.
Default is 4,096 tokens.`
              }]);
              return true;
            }
            
            const newLimit = parseInt(args[1].replace(/,/g, ''));
            setMaxTokens(newLimit);
            localStorage.setItem('space_max_tokens', newLimit);
            setMessages(prev => [...prev, {
              type: 'system',
              content: `Response length set to ${newLimit.toLocaleString()} tokens`
            }]);
            return true;
          }
          
          setMessages(prev => [...prev, {
            type: 'system',
            content: 'Available response commands:\n/response length <number> - Set maximum length for Claude responses'
          }]);
          return true;

        case '/keys':
          switch(args[0]) {
            case 'clear':
              removeEncrypted('space_anthropic_key');
              removeEncrypted('space_openai_key');
              setApiKeysSet(false);
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'API keys cleared. Please restart the terminal.'
              }]);
              return true;

            case 'status':
              (async () => {
                try {
                  const anthropicKey = await getDecrypted('space_anthropic_key');
                  const openaiKey = await getDecrypted('space_openai_key');
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: `API Keys Status:
Anthropic: ${anthropicKey ? '✓ Set' : '✗ Not Set'}
OpenAI: ${openaiKey ? '✓ Set' : '✗ Not Set'}`
                  }]);
                } catch (error) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: `Error checking API keys: ${error.message}`
                  }]);
                }
              })();
              return true;

            default:
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'Available key commands:\n' +
                  '/keys status - Check API key status\n' +
                  '/keys clear - Clear stored API keys'
              }]);
              return true;
          }

        case '/key':
          switch(args[0]) {
            case 'set':
              return (async () => {  // Wrap in async IIFE
                if (!args[1] || !args[2]) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Usage: /key set [anthropic/openai] <api-key>'
                  }]);
                  return true;
                }

                const service = args[1].toLowerCase();
                const newKey = args[2];

                if (service !== 'anthropic' && service !== 'openai') {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Invalid service. Use "anthropic" or "openai"'
                  }]);
                  return true;
                }

                // Validate key format
                if (service === 'anthropic' && !newKey.startsWith('sk-ant-')) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Invalid Anthropic API key format'
                  }]);
                  return true;
                }

                if (service === 'openai' && !newKey.startsWith('sk-')) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Invalid OpenAI API key format'
                  }]);
                  return true;
                }

                // For Anthropic key, validate with API call
                if (service === 'anthropic') {
                  try {
                    const response = await fetch(`${getApiEndpoint()}/v1/messages`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': newKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true'
                      },
                      body: JSON.stringify({
                        model: 'claude-3-5-sonnet-20241022',
                        messages: [{ role: 'user', content: 'Hello' }],
                        max_tokens: 10
                      })
                    });

                    if (!response.ok) {
                      await handleApiError(response);
                    }
                  } catch (error) {
                    setMessages(prev => [...prev, {
                      type: 'system',
                      content: `API key validation failed: ${error.message}`
                    }]);
                    return true;
                  }
                }

                // Store the new key securely
                await setEncrypted(`space_${service}_key`, newKey);

                // If OpenAI key, reinitialize the client
                if (service === 'openai') {
                  const client = new OpenAI({
                    apiKey: newKey,
                    dangerouslyAllowBrowser: true
                  });
                  setOpenaiClient(client);
                }

                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `${service} API key updated successfully`
                }]);
                return true;
              })();

            default:
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'Available key commands:\n' +
                  '/key set [anthropic/openai] <api-key> - Update API key\n' +
                  '/keys status - Check API key status\n' +
                  '/keys clear - Clear stored API keys'
              }]);
              return true;
          }

        case '/export-all':
          exportAllSessions();
          return true;

        default:
          setMessages(prev => [...prev, {
            type: 'system',
            content: `Unknown command: ${command}`
          }]);
          return true;
      }
    }
    console.log('Not a command, returning false');
    return false;
  };

  const callClaude = async (userMessage) => {
    const formatTimestamp = (isoString) => {
      const date = new Date(isoString);
      return date.toISOString().slice(0, 16);
    };

    try {
      if (!userMessage?.trim()) {
        throw new Error('Empty message');
      }

      const anthropicKey = await getDecrypted('space_anthropic_key');
      if (!anthropicKey) {
        throw new Error('Anthropic API key not found');
      }

      const estimateTokens = text => Math.ceil(text.length / 4);
      const totalTokens = messages.reduce((sum, msg) => 
        sum + estimateTokens(msg.content), 0
      );

      const contextMessages = [{
        role: 'user',
        content: userMessage
      }];

      if (totalTokens < contextLimit) {
        const historicalMessages = messages
          .filter(msg => 
            (msg.type === 'user' || msg.type === 'assistant') &&
            msg.content?.trim() !== '' &&
            msg.content !== userMessage
          )
          .map(msg => ({
            role: msg.type,
            content: msg.timestamp 
              ? `[${formatTimestamp(msg.timestamp)}] ${msg.content}`
              : msg.content
          }));
        
        contextMessages.unshift(...historicalMessages);
      } else {
        const managedContext = buildConversationContext(userMessage, messages, memory);
        if (managedContext?.length) {
          contextMessages.unshift(...managedContext);
        }
      }

      console.log('Messages being sent to Claude:', JSON.stringify(contextMessages, null, 2));

      const systemPromptText = getSystemPrompt();

      if (debugMode) {
        const currentUserMessage = messages
          .slice()
          .reverse()
          .find(msg => msg.type === 'user' && msg.content === userMessage) || 
          { content: userMessage, tags: [] };
      
        const systemTokens = estimateTokens(systemPromptText);
        const contextTokens = contextMessages.reduce((sum, msg) => 
          sum + estimateTokens(msg.content), 0
        );
        const totalTokens = systemTokens + contextTokens;
        
        const inputCost = ((totalTokens / 1000) * 0.003).toFixed(4);
        
        const debugOutput = `Claude API Call:
Estimated tokens: ${totalTokens} (System: ${systemTokens}, Context: ${contextTokens})
Estimated cost: $${inputCost}

Tags for current message: ${JSON.stringify(currentUserMessage.tags, null, 2)}

System Prompt:
${systemPromptText}

Context Messages:
${JSON.stringify(contextMessages, null, 2)}`;

        setMessages(prev => [...prev, {
          type: 'debug',
          content: debugOutput
        }]);
      }

      const response = await fetch(`${getApiEndpoint()}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          messages: contextMessages,
          system: systemPromptText,
          max_tokens: maxTokens,
          stream: true
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        await handleApiError(response);  // This will handle the 401 and throw an error
      }

      // Set up streaming response handling
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentMessageContent = '';

      console.log('Starting stream handling...');

      // Add a temporary message that we'll update as we stream
      setMessages(prev => {
        console.log('Adding initial empty message');
        return [...prev, { type: 'assistant', content: '' }];
      });

      const STREAM_BASE_DELAY = 0; // Slightly faster base delay
      const STREAM_VARIANCE = 5; // More variance for natural feel
      const PUNCTUATION_PAUSE = 0; // Slightly longer pause for more emphasis

      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Helper to determine if we should pause longer after this character
      const isPunctuation = (char) => {
        return ['.', '!', '?', '\n'].includes(char);
      };

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream complete');
          // Trigger analysis only once after stream is complete
          analyzeMetaphors(messages);
          analyzeForQuestions(messages);
          break;
        }

        // Add new chunk to buffer and split into complete events
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        console.log(`Processing ${events.length} events`);

        for (const event of events) {
          const dataMatch = event.match(/^data: (.+)$/m);
          if (!dataMatch) continue;
          
          try {
            const data = JSON.parse(dataMatch[1]);
            
            if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
              const text = data.delta.text;
              
              // Stream each character with controlled timing
              for (let i = 0; i < text.length; i++) {
                const char = text[i];
                
                // Calculate delay for this character
                const baseDelay = STREAM_BASE_DELAY;
                const variance = Math.random() * STREAM_VARIANCE;
                let delay = baseDelay + variance;
                
                // Add extra pause after punctuation
                if (i > 0 && isPunctuation(text[i-1])) {
                  delay += PUNCTUATION_PAUSE;
                }
                
                await sleep(delay);
                
                currentMessageContent += char;
                setMessages(prev => {
                  const newMessages = [...prev];
                  if (newMessages.length > 0) {
                    newMessages[newMessages.length - 1] = {
                      type: 'assistant',
                      content: currentMessageContent
                    };
                  }
                  return newMessages;
                });
              }
            }
          } catch (e) {
            console.error('Error parsing event:', e);
          }
        }
      }

      console.log('Final message content:', currentMessageContent);
      return currentMessageContent;
    } catch (error) {
      console.error('Claude API Error:', error);
      // Remove the API keys if we got a 401
      if (error.message.includes('invalid x-api-key')) {
        removeEncrypted('space_anthropic_key');
        removeEncrypted('space_openai_key');
        window.location.reload();
      }
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit called with input:', input);
    
    if (!input.trim() || isLoading) {
      console.log('Empty input or loading, returning');
      return;
    }

    // Handle commands first
    if (input.startsWith('/')) {
      console.log('Command detected:', input);
      const commandHandled = handleCommand(input);
      console.log('Command handled:', commandHandled);
      if (commandHandled) {
        setInput('');
        return;
      }
    }

    // Existing message handling
    console.log('No command handled, proceeding to Claude response');
    try {
      setIsLoading(true);
      
      // Analyze tags for user message
      const analyzer = new TagAnalyzer();
      let tags = [];
      try {
        console.log('🏷️ Starting tag analysis for:', input.substring(0, 100) + '...');
        tags = await analyzer.analyzeTags(input);
        console.log('🏷️ Tags generated:', tags);
        if (debugMode) {
          console.log('🏷️ Debug mode active, tags:', tags);
        }
      } catch (error) {
        console.error('🏷️ Tag analysis error:', error);
        if (debugMode) {
          setMessages(prev => [...prev, {
            type: 'system',
            content: `❌ Tag Analysis Error:\n${error.message}`
          }]);
        }
      }
      
      // Create the new message object with timestamp and tags
      const newMessage = { 
        type: 'user', 
        content: input,
        tags,
        timestamp: new Date().toISOString()
      };

      // Add it to messages state
      await setMessages(prev => [...prev, newMessage]);

      // Pass the content to Claude
      await callClaude(newMessage.content);

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setMessages(prev => [...prev, { 
        type: 'system', 
        content: 'Error: Failed to get response from Claude' 
      }]);
    } finally {
      setIsLoading(false);
      setInput('');
      focusInput();
    }
  };

  const focusInput = () => {
    if (editingPrompt || editingAdvisor) {
      const textarea = document.querySelector('textarea');
      if (textarea) textarea.focus();
    } else if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    focusInput();
  }, [messages, isLoading]);

  useEffect(() => {
    if (savedPrompts.length > 0) {
      localStorage.setItem('space_prompts', JSON.stringify(savedPrompts));
    }
  }, [savedPrompts]);

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      // Save changes
      setSavedPrompts(prev => prev.map(p => 
        p.name === editingPrompt.name ? { ...p, text: editText } : p
      ));
      setMessages(prev => [...prev, {
        type: 'system',
        content: `Updated prompt "${editingPrompt.name}"`
      }]);
      setEditingPrompt(null);
      setEditText('');
    } else if (e.key === 'Escape') {
      // Cancel editing
      setEditingPrompt(null);
      setEditText('');
      setMessages(prev => [...prev, {
        type: 'system',
        content: 'Edit cancelled'
      }]);
    }
  };

  // Add this helper function to format messages as markdown
  const formatSessionAsMarkdown = (messages) => {
    // Add timestamp at the beginning
    const timestamp = new Date().toLocaleString();
    let markdown = `# SPACE Terminal Session Export
Exported on: ${timestamp}\n\n`;
    
    messages.forEach((msg) => {
      // Skip help command outputs
      if (msg.content.includes('SPACE Terminal v0.1 - Command Reference')) {
        return;
      }
      
      switch(msg.type) {
        case 'user':
          markdown += `**User:** \`${msg.content}\`\n\n`;
          break;
        case 'assistant':
          markdown += `**Claude:** ${msg.content}\n\n`;
          break;
        case 'system':
          // Only include non-help system messages
          if (!msg.content.includes('/help')) {
            markdown += `> ${msg.content}\n\n`;
          }
          break;
      }
    });
    
    return markdown;
  };

  // Define worksheet templates with sections
  const WORKSHEET_TEMPLATES = {
    'advisor-basic': {  // Changed from advisor-board
      id: 'advisor-basic',
      type: 'basic',
      name: 'AI Advisor Board Worksheet (Basic)',
      description: 'A simple worksheet to help configure your AI advisory board',
      questions: worksheetQuestions  // This references the existing questions array
    },
    'advisor-detailed': {
      id: 'advisor-detailed',
      type: 'detailed',
      name: 'AI Advisor Board Worksheet (Detailed)',
      description: 'An in-depth worksheet to help configure your AI advisory board',
      sections: [
        {
          name: 'Biography',
          questions: [
            {
              id: 'age_gender',
              question: 'What is your current age and gender?'
            },
            {
              id: 'origin',
              question: 'Where are you from?'
            },
            {
              id: 'location',
              question: 'Where do you live now, and how do you feel about it? Where else have you lived?'
            },
            {
              id: 'occupation',
              question: 'What is your current occupation, and how do you feel about it? What else have you done for work?'
            },
            {
              id: 'education',
              question: 'What has your education looked like?'
            }
          ]
        },
        {
          name: 'People',
          questions: [
            {
              id: 'family',
              question: 'Describe the basic shape of your family and how you tend to relate to them.'
            },
            {
              id: 'social_circles',
              question: 'Describe your current social circle(s). Who do you spend most of your time with?'
            },
            {
              id: 'energizing_people',
              question: 'Who are the people who energize you the most? Why?'
            },
            {
              id: 'desired_relationships',
              question: 'Which relationships would you like to develop or strengthen?'
            },
            {
              id: 'mentors',
              question: 'Who are your mentors or role models in your immediate life?'
            },
            {
              id: 'social_contexts',
              question: 'In what social contexts do you feel most alive?'
            }
          ]
        },
        {
          name: 'Values & Preferences',
          questions: [
            {
              id: 'delights',
              question: 'Name an aspect of the world—a thing, a place, an experience—that consistently delights you.'
            },
            {
              id: 'beauty',
              question: 'What do you find beautiful?'
            },
            {
              id: 'philosophies',
              question: 'Are there any traditions or philosophies that really click with how you approach life?'
            },
            {
              id: 'differences',
              question: "What's something other people do, that you never do?"
            }
          ]
        },
        {
          name: 'Inspiration',
          questions: [
            {
              id: 'inspiring_people',
              question: 'Name three real people, living or dead, who you find inspiring. What do you admire about each of them?'
            },
            {
              id: 'fictional_characters',
              question: 'Name three fictional characters you resonate with, and say what feels notable about each of them.'
            },
            {
              id: 'archetypes',
              question: 'What archetypal figures (e.g., The Sage, The Creator, The Explorer) do you most identify with? Why?'
            },
            {
              id: 'influences',
              question: 'What books, articles, talks, or works of art have significantly influenced your worldview?'
            }
          ]
        },
        {
          name: 'Personality',
          questions: [
            {
              id: 'frameworks',
              question: 'What personality frameworks (e.g. Myers-Briggs, Enneagram) have you found helpful in understanding yourself?'
            },
            {
              id: 'types',
              question: 'What type(s) do you identify with in those frameworks and why?'
            },
            {
              id: 'animal',
              question: 'What kind of animal do you most feel like / would you like to be?'
            },
            {
              id: 'descriptions',
              question: 'What descriptions of you from friends and family have struck a chord?'
            }
          ]
        },
        {
          name: 'Direction',
          questions: [
            {
              id: 'future_self',
              question: 'Who do you want to become in the next 5-10 years?'
            },
            {
              id: 'desired_qualities',
              question: 'What skills or qualities would you like to develop?'
            },
            {
              id: 'wildly_good',
              question: 'What would be a wildly good outcome of an advisor conversation for you?'
            }
          ]
        },
        {
          name: 'Reflection Notes',
          questions: [
            {
              id: 'additional_thoughts',
              question: 'Use this space to capture any additional thoughts, patterns, or insights that emerged while completing this worksheet:'
            }
          ]
        }
      ]
    }
  };

  // Add this helper function at the top level
  const generateWorksheetId = (type) => {
    // Get existing worksheets
    const worksheets = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('space_worksheet_')) {
        worksheets.push(key.replace('space_worksheet_', ''));
      }
    }
    
    // Count worksheets of this type
    const typeCount = worksheets.filter(id => id.startsWith(type)).length + 1;
    
    // Generate new ID
    return `${type}-${typeCount}`;
  };

  useEffect(() => {
    if (advisors.length > 0) {
      localStorage.setItem('space_advisors', JSON.stringify(advisors));
    } else {
      localStorage.removeItem('space_advisors');
    }
  }, [advisors]);

  useEffect(() => {
    if (advisorGroups.length > 0) {
      localStorage.setItem('space_advisor_groups', JSON.stringify(advisorGroups));
    }
  }, [advisorGroups]);

  const buildConversationContext = (userMessage, messages, memory) => {
    // Helper function to format timestamp
    const formatTimestamp = (isoString) => {
      const date = new Date(isoString);
      return date.toLocaleString();
    };

    // Get relevant messages from earlier
    const relevantMessages = messages.length > 6 ? 
      memory.retrieveRelevantContext(userMessage, messages.slice(0, -6)) :
      [];

    // Get the most recent messages
    const recentMessages = messages
      .slice(-6)
      .filter(msg => 
        (msg.type === 'user' || msg.type === 'assistant') &&
        !msg.content.includes('Terminal v0.1') &&
        !msg.content.includes('Debug mode') &&
        !msg.content.includes('Claude API Call') &&
        msg.content.trim() !== '' &&
        msg.content !== userMessage
      );

    let contextParts = [];

    // Add relevant messages with timestamps
    if (relevantMessages.length > 0) {
      contextParts.push('=== PREVIOUS RELEVANT USER MESSAGES ===');
      relevantMessages.forEach(msg => {
        if (msg.timestamp) {
          contextParts.push(`[${formatTimestamp(msg.timestamp)}] ${msg.content}`);
        } else {
          contextParts.push(msg.content);
        }
      });
    }

    // Add separator if both sections exist
    if (relevantMessages.length > 0 && recentMessages.length > 0) {
      contextParts.push('=====================================');
    }

    // Add recent conversation
    if (recentMessages.length > 0) {
      contextParts.push('=== MOST RECENT CONVERSATION ===');
      recentMessages.forEach(msg => {
        const lines = msg.content.trim().split('\n');
        const formattedLines = lines.map((line, i) => 
          i === 0 ? `> ${line}` : `  ${line.trim()}`
        );
        contextParts.push(formattedLines.join('\n'));
      });
    }

    // Add current message
    contextParts.push('=== CURRENT MESSAGE ===');
    contextParts.push(`> ${userMessage}`);

    // Join all parts with double newlines for clarity
    return [{
      role: 'user',
      content: contextParts.join('\n\n')
    }];
  };

  const getSystemPrompt = () => {
    const activeAdvisors = advisors.filter(a => a.active);
    
    if (activeAdvisors.length === 0) {
      return ""; // No system prompt needed when no advisors are active
    }

    return `You are currently embodying the following advisors:
${activeAdvisors.map(a => `\n${a.name}: ${a.description}`).join('\n')}

When responding, you will adopt the distinct voice(s) of the active advisor(s) as appropriate to the context and question.`;
  };

  const analyzeMetaphors = async (messages) => {
    if (!metaphorsExpanded || !openaiClient) return; // Skip if collapsed or client not ready
    
    const userMessages = messages
      .filter(msg => msg.type === 'user')
      .map(msg => msg.content)
      .join("\n");

    try {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are a helpful assistant that responds only in valid JSON format. Your response should be an array of strings."
        }, {
          role: "user",
          content: `Analyze the following messages for conceptual metaphors:\n\n${userMessages}\n\nRespond with a JSON array of metaphors.`
        }],
        max_tokens: 150,
        response_format: { type: "json_object" }
      });

      const metaphors = JSON.parse(response.choices[0].message.content);
      setMetaphors(metaphors.metaphors || []);
    } catch (error) {
      console.error('Error analyzing metaphors:', error);
      if (debugMode) {
        setMessages(prev => [...prev, {
          type: 'system',
          content: `❌ Metaphor Analysis Error:\n${error.message}`
        }]);
      }
    }
  };

  const analyzeForQuestions = async (messages) => {
    if (!questionsExpanded || !openaiClient) return; // Skip if collapsed or client not ready
    
    const recentMessages = messages
      .slice(-2)
      .filter(msg => msg.type === 'assistant' || msg.type === 'user')
      .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join("\n\n");

    try {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: "You are a helpful assistant that responds only in valid JSON format. Your response should be an array of strings."
        }, {
          role: "user",
          content: `Based on this recent exchange, suggest 2-3 questions that might help the user deepen their exploration:\n\n${recentMessages}\n\nRespond with a JSON array of questions.`
        }],
        max_tokens: 150,
        response_format: { type: "json_object" }
      });

      const questions = JSON.parse(response.choices[0].message.content);
      setQuestions(questions.questions || []);
    } catch (error) {
      console.error('Error analyzing for questions:', error);
      if (debugMode) {
        setMessages(prev => [...prev, {
          type: 'system',
          content: `❌ Question Analysis Error:\n${error.message}`
        }]);
      }
    }
  };

  useEffect(() => {
    if (messages.length > 1) { // Don't save empty sessions
      const sessionData = {
        id: currentSessionId,
        timestamp: new Date().toISOString(),
        messages: messages.map(msg => ({
          ...msg,
          tags: msg.tags || [] // Ensure tags are preserved
        })),
        metaphors,
        questions
      };
      localStorage.setItem(`space_session_${currentSessionId}`, JSON.stringify(sessionData));
    }
  }, [messages, metaphors, questions, currentSessionId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      terminalRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatCaptureAsMarkdown = (selectedText, timestamp, messageIndex) => {
    const formattedDate = new Date(timestamp).toLocaleString();
    const deepLink = `${window.location.origin}${window.location.pathname}?session=${currentSessionId}&message=${messageIndex}`;
    
    return `# SPACE Terminal Capture
Captured on: ${formattedDate}

${selectedText}

[View in context](${deepLink})`;
  };

  const handleContextMenu = (e) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText) {
      e.preventDefault();
      
      // Find which message contains the selection
      const range = selection.getRangeAt(0);
      let element = range.commonAncestorContainer;
      
      // Walk up the DOM tree until we find an element with an ID starting with 'msg-'
      while (element && (!element.id || !element.id.startsWith('msg-'))) {
        element = element.parentElement;
      }
      
      const messageId = element?.id;
      const messageIndex = messageId ? parseInt(messageId.replace('msg-', '')) : null;

      if (!messageIndex && messageIndex !== 0) {  // Check for both null and undefined
        setMessages(prev => [...prev, {
          type: 'system',
          content: 'Could not determine message position for link'
        }]);
        return;
      }
      
      const menu = document.createElement('div');
      menu.className = `
        absolute bg-gray-900 
        border border-green-400 
        rounded-md shadow-lg 
        py-1
      `;
      menu.style.left = `${e.pageX}px`;
      menu.style.top = `${e.pageY}px`;
      
      const captureButton = document.createElement('button');
      captureButton.className = `
        w-full px-4 py-2 
        text-left text-green-400 
        hover:bg-gray-800
      `;
      captureButton.textContent = 'Capture Selection';
      
      captureButton.onclick = () => {
        try {
          const timestamp = new Date().toISOString();
          const markdown = formatCaptureAsMarkdown(selectedText, timestamp, messageIndex);
          const blob = new Blob([markdown], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `space-capture-${timestamp.split('T')[0]}.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // Check if menu is still in document before trying to remove it
          if (menu.parentNode === document.body) {
            document.body.removeChild(menu);
          }
          
          setMessages(prev => [...prev, {
            type: 'system',
            content: 'Capture saved successfully'
          }]);
        } catch (error) {
          console.error('Error during capture:', error);
          setMessages(prev => [...prev, {
            type: 'system',
            content: 'Error saving capture'
          }]);
        }
      };
      
      menu.appendChild(captureButton);
      document.body.appendChild(menu);
      
      // Remove menu when clicking outside
      const removeMenu = (e) => {
        if (!menu.contains(e.target)) {
          document.body.removeChild(menu);
          document.removeEventListener('click', removeMenu);
        }
      };
      document.addEventListener('click', removeMenu);
    }
  };

  useEffect(() => {
    // Check URL parameters on load
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');
    const messageId = params.get('message');
    
    if (sessionId && messageId) {
      const sessionKey = `space_session_${sessionId}`;
      const sessionData = localStorage.getItem(sessionKey);
      
      if (sessionData) {
        const session = JSON.parse(sessionData);
        setMessages(session.messages);
        setCurrentSessionId(parseInt(sessionId));
        
        // Scroll to the specified message after render
        setTimeout(() => {
          const element = document.getElementById(`msg-${messageId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add highlight effect
            element.classList.add('bg-green-900/20');
            setTimeout(() => element.classList.remove('bg-green-900/20'), 2000);
          }
        }, 100);
      }
    }
  }, []);

  const handleAdvisorClick = (advisor) => {
    setAdvisors(prev => prev.map(a => 
      a.name === advisor.name 
        ? { ...a, active: !a.active }
        : a
    ));
  };

  const handleGroupClick = (group) => {
    const isActive = activeGroups.includes(group.name);
    if (isActive) {
      // Deactivate group and all its advisors
      setActiveGroups(prev => prev.filter(g => g !== group.name));
      setAdvisors(prev => prev.map(advisor => 
        group.advisors.includes(advisor.name) 
          ? { ...advisor, active: false }
          : advisor
      ));
    } else {
      // Activate group and all its advisors
      setActiveGroups(prev => [...prev, group.name]);
      setAdvisors(prev => prev.map(advisor => 
        group.advisors.includes(advisor.name) 
          ? { ...advisor, active: true }
          : advisor
      ));
    }
  };

  const getCurrentQuestionId = () => {
    const template = WORKSHEET_TEMPLATES[currentWorksheetId];
    if (template.type === 'basic') {
      return template.questions[currentQuestion].id;
    }
    return template.sections[currentSection].questions[currentQuestion].id;
  };

  useEffect(() => {
    setMessages([
      { type: 'system', content: 'Welcome to SPACE - v0.1' },
      { type: 'system', content: `Context limit (length up to which full conversation memory is retained) is set to ${contextLimit.toLocaleString()} tokens. (Reduce it to save money.)`},
      { type: 'system', content: `Max length for responses is set to ${maxTokens.toLocaleString()} tokens.`},
      { type: 'system', content: `Type /help for a list of commands. Type /prompt list to see a list of available starting prompts. Press + (to the left of here) to add an advisor to the board.` },
      { type: 'system', content: `Report bugs or suggest features at [https://github.com/andrewblevins/space/issues/new](https://github.com/andrewblevins/space/issues/new).` },
      { type: 'system', content: '/export - Export the current session to a markdown file.' },
      { type: 'system', content: '/export-all - Export all sessions to a JSON file.' },
    ]);
  }, []);

  const exportAllSessions = () => {
    const sessions = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('space_session_')) {
        const session = JSON.parse(localStorage.getItem(key));
        sessions.push(session);
      }
    }

    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-sessions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessages(prev => [...prev, {
      type: 'system',
      content: 'All sessions exported successfully.'
    }]);
  };

  return (
    <>
      {!apiKeysSet ? (
        <ApiKeySetup 
          onComplete={({ anthropicKey, openaiKey }) => {
            const client = new OpenAI({
              apiKey: openaiKey,
              dangerouslyAllowBrowser: true
            });
            setOpenaiClient(client);
            setApiKeysSet(true);
          }} 
        />
      ) : (
        // Regular terminal UI
        <div 
          ref={terminalRef} 
          className="w-full h-screen bg-gradient-to-b from-gray-900 to-black text-green-400 font-serif flex relative"
          onContextMenu={handleContextMenu}
        >
          <button 
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 text-green-400 hover:text-green-300 z-50"
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            )}
          </button>

          {/* Left Column */}
          <div className="w-1/4 p-4 border-r border-gray-800 overflow-y-auto">
            <CollapsibleModule 
              title="Metaphors" 
              items={metaphors}
              expanded={metaphorsExpanded}
              onToggle={() => setMetaphorsExpanded(!metaphorsExpanded)}
            />
            <div className="mt-4">
              <GroupableModule
                title="Advisors"
                groups={advisorGroups}
                items={advisors}
                onItemClick={handleAdvisorClick}
                onGroupClick={handleGroupClick}
                activeItems={advisors.filter(a => a.active)}
                activeGroups={activeGroups}
                onAddClick={() => setShowAdvisorForm(true)}
                setEditingAdvisor={setEditingAdvisor}
                setAdvisors={setAdvisors}
                setMessages={setMessages}
              />
            </div>
          </div>

          {/* Middle Column */}
          <div className="w-2/4 p-4 flex flex-col">
            <div 
              ref={messagesContainerRef} 
              className="
                flex-1 
                overflow-auto 
                mb-4 
                break-words
                px-6         // Even horizontal padding
                py-4         // Vertical padding for balance
                mx-auto      // Center the content
                max-w-[90ch] // Limit line length for optimal readability
                leading-relaxed     // Increased line height for better readability
                tracking-wide       // Slightly increased letter spacing
              "
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  id={`msg-${idx}`}
                  className={(() => {
                    const className = msg.type === 'debug' ? 'text-yellow-400 mb-4 whitespace-pre-wrap break-words' :
                      msg.type === 'user' ? 'text-green-400 mb-4 whitespace-pre-wrap break-words' :
                      msg.type === 'assistant' ? 'text-white mb-4 break-words' : 
                      msg.type === 'system' ? 'text-green-400 mb-4 break-words' :
                      'text-green-400 mb-4 break-words';
                    return className;
                  })()}
                >
                  {(msg.type === 'system' || msg.type === 'assistant') ? (
                    <MemoizedMarkdownMessage content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
              ))}
              {isLoading && <div className="text-yellow-400">Loading...</div>}
            </div>

            <div className="mt-auto">
              <form onSubmit={handleSubmit}>
                <div className="flex items-center">
                  {editingPrompt ? (
                    <div className="flex-1">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        className="w-full h-40 bg-black text-green-400 font-serif p-2 border border-green-400 focus:outline-none resize-none"
                        placeholder="Edit your prompt..."
                        autoFocus
                      />
                    </div>
                  ) : editingAdvisor ? (
                    <div className="flex-1">
                      <textarea
                        value={editAdvisorText}
                        onChange={(e) => setEditAdvisorText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            // Save changes
                            setAdvisors(prev => prev.map(a => 
                              a.name === editingAdvisor.name ? { ...a, description: editAdvisorText } : a
                            ));
                            setMessages(prev => [...prev, {
                              type: 'system',
                              content: `Updated advisor "${editingAdvisor}"`
                            }]);
                            setEditingAdvisor(null);
                            setEditAdvisorText('');
                          } else if (e.key === 'Escape') {
                            // Cancel editing
                            setEditingAdvisor(null);
                            setEditAdvisorText('');
                            setMessages(prev => [...prev, {
                              type: 'system',
                              content: 'Edit cancelled'
                            }]);
                          }
                        }}
                        className="w-full h-40 bg-black text-green-400 font-serif p-2 border border-green-400 focus:outline-none resize-none"
                        placeholder="Edit advisor description..."
                        autoFocus
                      />
                    </div>
                  ) : (
                    <>
                      <span className="mr-2">&gt;</span>
                      <ExpandingInput
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                      />
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-1/4 p-4 border-l border-gray-800 overflow-y-auto">
            <CollapsibleModule 
              title="Questions" 
              items={questions}
              expanded={questionsExpanded}
              onToggle={() => setQuestionsExpanded(!questionsExpanded)}
            />
          </div>

          {showAdvisorForm && (
            <AdvisorForm
              onSubmit={({ name, description }) => {
                const newAdvisor = {
                  name,
                  description,
                  active: true
                };
                setAdvisors(prev => [...prev, newAdvisor]);
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Added advisor: ${newAdvisor.name}`
                }]);
                setShowAdvisorForm(false);
              }}
              onCancel={() => {
                setShowAdvisorForm(false);
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Cancelled adding advisor'
                }]);
              }}
            />
          )}

          {editingAdvisor && (
            <EditAdvisorForm
              advisor={editingAdvisor}
              onSubmit={({ name, description }) => {
                setAdvisors(prev => prev.map(a => 
                  a.name === editingAdvisor.name 
                    ? { ...a, name, description }
                    : a
                ));
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Updated advisor: ${name}`
                }]);
                setEditingAdvisor(null);
              }}
              onCancel={() => {
                setEditingAdvisor(null);
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Edit cancelled'
                }]);
              }}
            />
          )}

          {editingPrompt && (
            <EditPromptForm
              prompt={editingPrompt}
              onSubmit={({ name, text }) => {
                setSavedPrompts(prev => prev.map(p => 
                  p.name === editingPrompt.name 
                    ? { ...p, name, text }
                    : p
                ));
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Updated prompt: ${name}`
                }]);
                setEditingPrompt(null);
                setEditText('');
              }}
              onCancel={() => {
                setEditingPrompt(null);
                setEditText('');
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Edit cancelled'
                }]);
              }}
            />
          )}
        </div>
      )}
      {/* Add this near the top where other buttons are rendered */}
      <div className="fixed bottom-4 right-4 z-50">
        <a
          href="https://github.com/andrewblevins/space"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-black border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors"
          title="About SPACE Terminal"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
              clipRule="evenodd" 
            />
          </svg>
        </a>
      </div>
    </>
  );
}

export default Terminal;