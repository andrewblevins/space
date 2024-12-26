import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { MemorySystem } from '../lib/memory';
import { OpenAI } from 'openai';

const Module = ({ title, items = [] }) => (
  <div className="bg-gray-900 p-4">
    <h2 className="text-purple-400 mb-2">{title}</h2>
    <ul className="space-y-4">
      {items.map((item, idx) => (
        <li key={idx} className="text-gray-300 whitespace-pre-wrap">{item}</li>
      ))}
    </ul>
  </div>
);

const MarkdownMessage = ({ content }) => (
  <ReactMarkdown
    className="text-left font-mono whitespace-pre"
    components={{
      h1: ({children}) => <h1 className="text-blue-400 font-bold">{children}</h1>,
      h2: ({children}) => <h2 className="text-green-400 font-bold">{children}</h2>,
      code: ({children}) => <code className="text-green-400">{children}</code>,
      p: ({children}) => <p className="text-white whitespace-pre-wrap">{children}</p>,
    }}
  >
    {content}
  </ReactMarkdown>
);

const Terminal = () => {
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const getNextSessionId = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('space_session_'));
    if (keys.length === 0) return 1;
    
    const ids = keys.map(key => parseInt(key.replace('space_session_', '')));
    return Math.max(...ids) + 1;
  };

  const [messages, setMessages] = useState([
    { type: 'system', content: 'SPACE Terminal v0.1 - Connected to Claude' }
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
  const [activeAdvisor, setActiveAdvisor] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const inputRef = useRef(null);
  const [savedPrompts, setSavedPrompts] = useState(() => {
    const saved = localStorage.getItem('space_prompts');
    return saved ? JSON.parse(saved) : [];
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
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .map(session => ({
        ...session,
        messageCount: session.messages.filter(m => m.type !== 'system').length,
      }));
  };

  const handleCommand = (text) => {
    console.log('handleCommand called with:', text);
    if (text.startsWith('/')) {
      console.log('Command detected');
      const [command, ...args] = text.toLowerCase().split(' ');
      console.log('Parsed command:', command, 'args:', args);
      
      switch (command) {
        case '/sessions':
          console.log('Processing /sessions command');
          const sessions = loadSessions();
          console.log('Found sessions:', sessions);
          setMessages(prev => [...prev, {
            type: 'system',
            content: sessions.length ? 
              'Available sessions:\n' + sessions.map(s => 
                `Session ${s.id}\n` +
                `  Created: ${new Date(s.timestamp).toLocaleString()}\n` +
                `  Messages: ${s.messageCount}\n`
              ).join('\n') :
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
            content: `# SPACE Terminal v0.1 - Command Reference

## Session Management
\`/clear\`              - Clear terminal
\`/new\`                - Start a new session
\`/sessions\`           - List saved sessions
\`/load <session_id>\`  - Load a previous session
\`/reset\`              - Clear all saved sessions
\`/export\`             - Export current session to markdown

## Advisor Commands
\`/advisor generate <worksheet_id>\` - Start advisor generation process
\`/advisor finalize\`               - Generate final advisor profiles
\`/advisor add <name> <description>\`  - Add new advisor
\`/advisor edit <name>\`               - Edit advisor description
\`/advisor select <name>\`             - Select active advisor
\`/advisor list\`                      - Show all advisors

## Prompt Management
\`/prompt add <name> <text>\`   - Save a new prompt
\`/prompt edit <name>\`         - Edit an existing prompt
\`/prompt list\`               - Show saved prompts
\`/prompt use <name>\`         - Use a saved prompt

## Other Commands
\`/debug\`     - Toggle debug mode
\`/help\`      - Show this message

## Worksheet
\`/worksheet\`           - Show available worksheet commands
\`/worksheet list\`      - List available worksheet templates and completed worksheets
\`/worksheet start <id>\` - Start a specific worksheet
\`/worksheet view <id>\`  - View a completed worksheet`
          }]);
          return true;

        case '/new':
          setCurrentSessionId(getNextSessionId());
          setMessages([{ type: 'system', content: 'Started new session' }]);
          setMetaphors([]);
          setQuestions([]);
          return true;

        case '/load':
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
              if (!args[1] || !args[2]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /advisor add <name> <description>'
                }]);
                return true;
              }
              const newAdvisor = {
                name: args[1],
                description: args.slice(2).join(' ')
              };
              setAdvisors(prev => [...prev, newAdvisor]);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Added advisor: ${newAdvisor.name}`
              }]);
              return true;

            case 'list':
              setMessages(prev => [...prev, {
                type: 'system',
                content: advisors.length ? 
                  'Available advisors:\n' + advisors.map(a => 
                    `**${a.name}**: ${a.description}`
                  ).join('\n') :
                  'No advisors configured'
              }]);
              return true;

            case 'select':
              const advisor = advisors.find(a => a.name === args[1]);
              setActiveAdvisor(advisor);
              return true;

            case 'edit':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /advisor edit <name>'
                }]);
                return true;
              }
              
              const advisorToEdit = advisors.find(a => a.name === args[1]);
              if (!advisorToEdit) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Advisor "${args[1]}" not found`
                }]);
                return true;
              }

              setEditingAdvisor(advisorToEdit.name);
              setEditAdvisorText(advisorToEdit.description);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Editing advisor "${advisorToEdit.name}"\nCtrl+Enter to save • Escape to cancel`
              }]);
              return true;
          }

        case '/debug':
          console.log('Debug command received');
          console.log('Current debugMode:', debugMode);
          setDebugMode(prev => {
            const newValue = !prev;
            console.log('Setting debugMode to:', newValue);
            return newValue;
          });
          console.log('After setDebugMode call');
          setMessages(prev => [...prev, {
            type: 'system',
            content: `Debug mode ${!debugMode ? 'enabled' : 'disabled'}`
          }]);
          return true;

        case '/prompt':
          switch(args[0]) {
            case 'add':
              if (args.length < 3) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /prompt add <name> <prompt_text>'
                }]);
                return true;
              }
              const promptName = args[1];
              const promptText = args.slice(2).join(' ');
              setSavedPrompts(prev => [...prev, { name: promptName, text: promptText }]);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Saved prompt: ${promptName}`
              }]);
              return true;

            case 'list':
              setMessages(prev => [...prev, {
                type: 'system',
                content: savedPrompts.length ?
                  'Saved prompts:\n' + savedPrompts.map(p => 
                    `${p.name}: ${p.text}`
                  ).join('\n') :
                  'No saved prompts'
              }]);
              return true;

            case 'use':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /prompt use <name>'
                }]);
                return true;
              }
              const prompt = savedPrompts.find(p => p.name === args[1]);
              if (prompt) {
                (async () => {
                  setMessages(prev => [...prev, { type: 'user', content: prompt.text }]);
                  setIsLoading(true);
                  try {
                    const response = await callClaude(prompt.text);
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
              } else {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Prompt "${args[1]}" not found`
                }]);
              }
              return true;

            case 'edit':
              if (!args[1]) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /prompt edit <name>'
                }]);
                return true;
              }
              
              const promptToEdit = savedPrompts.find(p => p.name === args[1]);
              if (!promptToEdit) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Prompt "${args[1]}" not found`
                }]);
                return true;
              }

              setEditingPrompt(promptToEdit.name);
              setEditText(promptToEdit.text);
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Editing prompt "${promptToEdit.name}"\nCtrl+Enter to save • Escape to cancel`
              }]);
              return true;

            default:
              setMessages(prev => [...prev, {
                type: 'system',
                content: 'Available prompt commands:\n' +
                  '/prompt add <name> <text> - Save a new prompt\n' +
                  '/prompt list - Show all saved prompts\n' +
                  '/prompt use <name> - Use a saved prompt\n' +
                  '/prompt edit <name> <text> - Edit an existing prompt'
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
              const viewId = args[1];
              if (!viewId) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Usage: /worksheet view <id>'
                }]);
                return true;
              }
              
              const viewData = localStorage.getItem(`space_worksheet_${viewId}`);
              console.log('Viewing worksheet data:', {
                viewId,
                rawData: viewData,
                parsedData: viewData ? JSON.parse(viewData) : null
              });

              if (viewData) {
                const worksheetData = JSON.parse(viewData);
                
                // Just use the formatted markdown that was saved
                if (worksheetData.formatted) {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: worksheetData.formatted
                  }]);
                } else {
                  setMessages(prev => [...prev, {
                    type: 'system',
                    content: 'Error: Worksheet format not found'
                  }]);
                }
              } else {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `Worksheet ${viewId} not found`
                }]);
              }
              return true;

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
    try {
      const contextMessages = buildConversationContext(userMessage, messages, memory);
      
      console.log('Messages being sent to Claude:', JSON.stringify(contextMessages, null, 2));

      const systemPromptText = advisors.length
        ? `You are a set of advisors embodying multiple perspectives:

${advisors.map(a => `${a.name}: ${a.description}`).join('\n\n')}

Respond as each of these perspectives as appropriate, adopting their unique voices directly.`
        : 'You are Claude, an AI assistant. You are direct, honest, and aim to be helpful.';

      if (debugMode) {
        const estimateTokens = (text) => Math.ceil(text.length / 4);
        const systemTokens = estimateTokens(systemPromptText);
        const contextTokens = contextMessages.reduce((sum, msg) => 
          sum + estimateTokens(msg.content), 0
        );
        const totalTokens = systemTokens + contextTokens;
        
        const inputCost = ((totalTokens / 1000) * 0.003).toFixed(4);
        
        setMessages(prev => [...prev, {
          type: 'system',
          content: `🔍 Claude API Call:
Estimated tokens: ${totalTokens} (System: ${systemTokens}, Context: ${contextTokens})
Estimated cost: $${inputCost}

System Prompt:
${systemPromptText}

Context Messages:
${contextMessages.map((msg, i) => 
  `[${i + 1}] ${msg.role}: ${msg.content}`
).join('\n')}`
        }]);
      }

      const response = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          messages: contextMessages,
          system: systemPromptText,
          max_tokens: 1024,
          temperature: 0.7,
          stream: true
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`API Error: ${errorText}`);
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

      while (true) {
        const { done, value } = await reader.read();
        console.log('Stream read:', { done, hasValue: !!value });
        
        if (done) {
          console.log('Stream complete');
          break;
        }

        // Add new chunk to buffer and split into complete events
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer

        console.log(`Processing ${events.length} events`);

        for (const event of events) {
          console.log('Processing event:', event);
          
          // Extract the data portion of the event
          const dataMatch = event.match(/^data: (.+)$/m);
          if (!dataMatch) {
            console.log('No data found in event');
            continue;
          }
          
          try {
            const data = JSON.parse(dataMatch[1]);
            console.log('Parsed event data:', data);
            
            if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
              console.log('Found text delta:', data.delta.text);
              currentMessageContent += data.delta.text;
              console.log('Current message content:', currentMessageContent);
              
              // Update the last message with new content
              setMessages(prev => {
                console.log('Updating messages, previous state:', prev);
                const newMessages = [...prev];
                if (newMessages.length > 0) {
                  newMessages[newMessages.length - 1] = {
                    type: 'assistant',
                    content: currentMessageContent
                  };
                  console.log('New messages state:', newMessages);
                }
                return newMessages;
              });
            } else {
              console.log('Event type not handled:', data.type);
            }
          } catch (e) {
            console.error('Error parsing event:', e);
            console.log('Problem event:', event);
          }
        }
      }

      console.log('Final message content:', currentMessageContent);
      return currentMessageContent;
    } catch (error) {
      console.error('Claude API Error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit called');
    
    if (!input.trim() || isLoading) {
      return;
    }

    // Handle commands first
    if (input.startsWith('/')) {
      const commandHandled = handleCommand(input);
      if (commandHandled) {
        setInput('');
        return;
      }
    }

    console.log('Sending message to Claude, debugMode:', debugMode);
    setMessages(prev => [...prev, { type: 'user', content: input }]);
    setIsLoading(true);

    try {
      const response = await callClaude(input);
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
        p.name === editingPrompt ? { ...p, text: editText } : p
      ));
      setMessages(prev => [...prev, {
        type: 'system',
        content: `Updated prompt "${editingPrompt}"`
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

  const buildConversationContext = (userMessage, messages, memory) => {
    // Filter out system messages, empty messages, and the current message
    const conversationMessages = messages
      .filter(msg => 
        // Only keep user messages and assistant responses
        (msg.type === 'user' || msg.type === 'assistant') &&
        // Exclude system notifications
        !msg.content.includes('Terminal v0.1') &&
        !msg.content.includes('Debug mode') &&
        !msg.content.includes('Claude API Call') &&
        // Exclude empty messages
        msg.content.trim() !== '' &&
        // Exclude the current message
        msg.content !== userMessage
      )
      // Convert to Claude's message format
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    // Add the current message at the end
    conversationMessages.push({
      role: 'user',
      content: userMessage
    });

    if (debugMode) {
      console.log('Conversation history:', conversationMessages);
    }

    return conversationMessages;
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="w-full h-screen bg-black text-green-400 font-mono flex">
      {/* Left Column */}
      <div className="w-1/4 p-4 border-r border-gray-800 overflow-y-auto">
        <Module title="Active Metaphors" items={metaphors} />
        <div className="mt-4">
          <Module 
            title="Active Advisors"
            items={advisors.length > 0 ? 
              advisors.map(a => `${a.name}: ${a.description}`) :
              []
            } 
          />
        </div>
      </div>

      {/* Middle Column */}
      <div className="w-2/4 p-4 flex flex-col">
        <div ref={messagesContainerRef} className="flex-1 overflow-auto mb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={
              msg.type === 'user' ? 'text-green-400 mb-4' : 
              msg.type === 'assistant' ? 'text-white mb-4' : 
              'mb-4'
            }>
              {msg.type === 'user' ? '> ' : ''}
              {msg.type === 'system' || msg.type === 'assistant' ? (
                <MarkdownMessage content={msg.content} />
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
                    className="w-full h-40 bg-black text-green-400 font-mono p-2 border border-green-400 focus:outline-none resize-none"
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
                          a.name === editingAdvisor ? { ...a, description: editAdvisorText } : a
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
                    className="w-full h-40 bg-black text-green-400 font-mono p-2 border border-green-400 focus:outline-none resize-none"
                    placeholder="Edit advisor description..."
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <span className="mr-2">&gt;</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent focus:outline-none"
                    placeholder={isLoading ? "Waiting for response..." : "Type here..."}
                    disabled={isLoading}
                    autoFocus
                  />
                </>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-1/4 p-4 border-l border-gray-800 overflow-y-auto">
        <Module title="Questions to Explore" items={questions} />
      </div>
    </div>
  );
};

export default Terminal;