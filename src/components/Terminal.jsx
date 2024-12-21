import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

const Module = ({ title, items = [] }) => (
  <div className="bg-gray-900 p-4">
    <h2 className="text-purple-400 mb-2">{title}</h2>
    <ul>
      {items.map((item, idx) => (
        <li key={idx} className="text-gray-300 mb-1">{item}</li>
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
      p: ({children}) => <p className="text-blue-400 whitespace-pre-wrap">{children}</p>,
    }}
  >
    {content}
  </ReactMarkdown>
);

const Terminal = () => {
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
  const [advisors, setAdvisors] = useState([]);
  const [activeAdvisor, setActiveAdvisor] = useState(null);
  const [boardMode, setBoardMode] = useState(false);
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
            content: `# SPACE Terminal v0.1 - Commands

## Session Management
\`/clear\`              - Clear terminal
\`/new\`                - Start a new session
\`/sessions\`           - List saved sessions
\`/load <session_id>\`  - Load a previous session
\`/reset\`              - Clear all saved sessions
\`/export\`             - Export current session to markdown

## Advisor Commands
\`/advisor add <name> <description>\`  - Add new advisor
\`/advisor edit <name>\`               - Edit advisor description
\`/advisor select <name>\`             - Select active advisor
\`/advisor list\`                      - Show all advisors
\`/advisor board\`                     - Enable board mode

## Prompt Management
\`/prompt add <name> <text>\`   - Save a new prompt
\`/prompt edit <name>\`         - Edit an existing prompt
\`/prompt list\`               - Show saved prompts
\`/prompt use <name>\`         - Use a saved prompt

## Other Commands
\`/debug\`     - Toggle debug mode
\`/help\`      - Show this message`
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
                    `${a.name}: ${a.description}`
                  ).join('\n') :
                  'No advisors configured'
              }]);
              return true;

            case 'select':
              const advisor = advisors.find(a => a.name === args[1]);
              setActiveAdvisor(advisor);
              return true;

            case 'board':
              setBoardMode(prev => !prev);  // Toggle board mode
              setMessages(prev => [...prev, {
                type: 'system',
                content: `Board mode ${!boardMode ? 'enabled' : 'disabled'}`
              }]);
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
          setDebugMode(prev => !prev);
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
                    const response = boardMode ? 
                      await callClaudeWithBoard(prompt.text) :
                      await callClaude(prompt.text);
                    setMessages(prev => [...prev, { type: 'assistant', content: response }]);
                    analyzeResponse(response);
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
      // Get active advisor's context
      const advisorContext = activeAdvisor ? 
        `You are acting as ${activeAdvisor.name}, ${activeAdvisor.description}. 
         Respond in character while maintaining your expertise and perspective.` : 
        null;

      // Create conversation history
      const conversationHistory = messages
        .filter(msg => msg.type === 'user' || msg.type === 'assistant')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const requestBody = {
        model: 'claude-3-opus-20240229',
        messages: [
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1024
      };

      // Add system message if there's an active advisor
      if (advisorContext) {
        requestBody.system = advisorContext;
      }
      
      // Add debug output for request
      if (debugMode) {
        setMessages(prev => [...prev, {
          type: 'system',
          content: '🔍 Debug: Request to Claude API:\n```json\n' + 
            JSON.stringify(requestBody, null, 2) + 
            '\n```'
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
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      // Add debug output for response
      if (debugMode) {
        setMessages(prev => [...prev, {
          type: 'system',
          content: '🔍 Debug: Response from Claude API:\n```json\n' + 
            JSON.stringify(data, null, 2) + 
            '\n```'
        }]);
      }

      return data.content[0].text;
    } catch (error) {
      console.error('Detailed error:', error);
      return `Error: Could not connect to Claude (${error.message})`;
    }
  };

  const analyzeMetaphors = async (messages) => {
    const userMessages = messages
      .filter(msg => msg.type === 'user')
      .map(msg => msg.content)
      .join("\n");

    try {
      const response = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          messages: [
            {
              role: 'user',
              content: `Analyze how the user is structuring their understanding through conceptual metaphors (in the sense of Lakoff's "Metaphors We Live By").

Look for underlying mental models and conceptual frameworks they're using to make sense of things, such as:
- Understanding as "seeing" or "looking at" things
- Time structured spatially
- Abstract concepts understood through concrete physical experiences
- Container metaphors for states or categories
- Source/path/goal schemas for processes

Their messages:
${userMessages}

Respond with ONLY a JSON array of strings describing the active conceptual metaphors, like this:
["Understanding is seeing", "Progress is forward motion"]

If you find no metaphors, respond with an empty array: []`
            }
          ],
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze metaphors');
      }

      const data = await response.json();
      const responseText = data.content[0].text;
      
      const match = responseText.match(/\[.*\]/s);
      if (!match) {
        console.error('No JSON array found in response:', responseText);
        return;
      }

      const metaphors = JSON.parse(match[0]);
      setMetaphors(metaphors);
    } catch (error) {
      console.error('Error analyzing metaphors:', error);
    }
  };

  const analyzeForQuestions = async (messages) => {
    // Get the most recent exchange
    const recentMessages = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'assistant' || messages[i].type === 'user') {
        recentMessages.unshift(messages[i]);
        if (recentMessages.length >= 2) break;
      }
    }
    
    const conversationText = recentMessages
      .map(msg => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join("\n\n");

    try {
      const response = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          messages: [
            {
              role: 'user',
              content: `Based on this recent exchange, suggest 2-3 questions that might help the user deepen their exploration. Consider both what the user said and how the assistant responded.

Recent exchange:
${conversationText}

Respond with ONLY a JSON array of question strings, like this:
["What would happen if...?", "How might this connect to...?"]

If you can't generate meaningful questions, respond with an empty array: []`
            }
          ],
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze for questions');
      }

      const data = await response.json();
      const responseText = data.content[0].text;
      
      const match = responseText.match(/\[.*\]/s);
      if (!match) {
        console.error('No JSON array found in response:', responseText);
        return;
      }

      const questions = JSON.parse(match[0]);
      setQuestions(questions);
    } catch (error) {
      console.error('Error analyzing for questions:', error);
    }
  };

  const analyzeResponse = (text) => {
    analyzeMetaphors(messages);
    analyzeForQuestions(messages);
  };

  const handleSubmit = async (e) => {
    console.log('handleSubmit called');
    e.preventDefault();
    
    // Prevent submission while editing
    if (editingPrompt || editingAdvisor) {
      return;
    }
    
    if (!input.trim() || isLoading) {
      console.log('Empty input or loading, returning');
      return;
    }

    console.log('Processing input:', input);
    
    // Check if it's a command first
    if (input.startsWith('/')) {
      console.log('Input appears to be a command');
      const commandHandled = handleCommand(input);
      console.log('Command handled?', commandHandled);
      if (commandHandled) {
        setInput('');
        focusInput();
        return;
      }
    }

    // If not a command, proceed with normal message handling
    setMessages(prev => [...prev, { type: 'user', content: input }]);
    setIsLoading(true);

    try {
      const response = boardMode ? 
        await callClaudeWithBoard(input) :
        await callClaude(input);
      setMessages(prev => [...prev, { type: 'assistant', content: response }]);
      analyzeResponse(response);
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

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 1) {  // Don't save empty sessions
      const session = {
        id: currentSessionId,
        timestamp: new Date().toISOString(),
        messages,
        metaphors,
        questions
      };
      localStorage.setItem(`space_session_${currentSessionId}`, JSON.stringify(session));
    }
  }, [messages]);

  const callClaudeWithBoard = async (userMessage) => {
    try {
      // Only proceed if we have advisors
      if (advisors.length === 0) {
        return "No advisors configured. Use /advisor add to create some advisors first.";
      }

      const boardContext = `You are facilitating a conversation between these advisors:
        ${advisors.map(a => `- ${a.name}: ${a.description}`).join('\n')}
        
        Generate responses from 2-3 relevant advisors, formatting each response as:
        [Advisor Name]: Their response...`;

      // Create conversation history
      const conversationHistory = messages
        .filter(msg => msg.type === 'user' || msg.type === 'assistant')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const requestBody = {
        model: 'claude-3-opus-20240229',
        system: boardContext,
        messages: [
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1024
      };

      const response = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Error calling Claude with board:', error);
      return `Error: Could not connect to Claude (${error.message})`;
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

  return (
    <div className="w-full h-screen bg-black text-green-400 font-mono flex">
      {/* Left Column */}
      <div className="w-1/4 p-4 border-r border-gray-800">
        <Module title="Active Metaphors" items={metaphors} />
        <div className="mt-4">
          <Module 
            title={boardMode ? "Active Board" : "Active Advisor"}
            items={
              boardMode ? 
                advisors.map(a => `${a.name}: ${a.description}`) :
                (activeAdvisor ? [`${activeAdvisor.name}: ${activeAdvisor.description}`] : [])
            } 
          />
        </div>
      </div>

      {/* Middle Column */}
      <div className="w-2/4 p-4 flex flex-col">
        <div className="flex-1 overflow-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={
              msg.type === 'user' ? 'text-green-400' : 
              msg.type === 'assistant' ? 'text-white' : ''
            }>
              {msg.type === 'user' ? '> ' : ''}
              {msg.type === 'system' ? (
                <MarkdownMessage content={msg.content} />
              ) : (
                msg.content
              )}
            </div>
          ))}
          {isLoading && <div className="text-yellow-400">Loading...</div>}
        </div>

        <div className="mt-4">
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
      <div className="w-1/4 p-4 border-l border-gray-800">
        <Module title="Questions to Explore" items={questions} />
      </div>
    </div>
  );
};

export default Terminal;