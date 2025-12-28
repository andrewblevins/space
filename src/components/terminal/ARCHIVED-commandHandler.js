/**
 * ARCHIVED: Slash Command Handler
 * 
 * This file contains the slash command handler that was removed from Terminal.jsx
 * on 2025-12-28. These slash commands were replaced by GUI equivalents.
 * 
 * Commands that were available:
 * - /sessions - List sessions (replaced by SessionPanel)
 * - /help - Show help (replaced by HelpModal)
 * - /new - New session (replaced by SessionPanel)
 * - /load - Load session (replaced by SessionPanel)
 * - /reset - Reset sessions (replaced by SessionPanel)
 * - /advisor - Advisor management (replaced by AdvisorForm / GUI sidebar)
 * - /debug - Toggle debug mode (replaced by SettingsMenu)
 * - /reasoning, /think - Toggle reasoning mode (replaced by SettingsMenu)
 * - /prompt - Prompt management (replaced by deprecated PromptLibrary)
 * - /worksheet - Worksheet management
 * - /dossier - Knowledge dossier (deprecated)
 * - /memory - Memory system commands
 * - /context - Context limit settings (replaced by SettingsMenu)
 * - /capture - Capture text selection
 * - /group - Advisor group management
 * - /response - Response length settings (replaced by SettingsMenu)
 * - /keys, /key - API key management (replaced by ApiKeySetup)
 * - /council - High Council mode (deprecated, replaced by parallel advisors)
 * 
 * TO RESTORE: Copy the handleCommand function back into Terminal.jsx and add
 * the command handling code back to handleSubmit:
 * 
 *   // Handle commands first
 *   if (input.startsWith('/')) {
 *     const commandHandled = handleCommand(input);
 *     if (commandHandled) {
 *       setInput('');
 *       return;
 *     }
 *   }
 * 
 * DEPENDENCIES: This function requires access to many state setters and functions
 * from Terminal.jsx including:
 * - loadSessions, setMessages, setShowHelpModal, currentSessionId, setCurrentSessionId
 * - getNextSessionId, generateSummaryForPreviousSession, setMetaphors, trackSession
 * - setAdvisorSuggestions, advisors, setAdvisors, setShowAdvisorForm, setSuggestedAdvisorName
 * - setEditingAdvisor, debugMode, setDebugMode, reasoningMode, setReasoningMode
 * - savedPrompts, setSavedPrompts, callClaude, setIsLoading, focusInput, setInput
 * - setEditingPrompt, setEditText, setWorksheetMode, setWorksheetStep, setCurrentSection
 * - setCurrentQuestion, setCurrentWorksheetId, setWorksheetAnswers, memory
 * - maxTokens, setMaxTokens, contextLimit, setContextLimit, formatCaptureAsMarkdown
 * - advisorGroups, setAdvisorGroups, useAuthSystem, removeEncrypted, setApiKeysSet
 * - setEncrypted, getApiEndpoint, handleApiError, setOpenaiClient
 */

// eslint-disable-next-line no-unused-vars
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
                  msg.tags.forEach(tag => tags.add(tag.value));
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


      case '/help':
        setShowHelpModal(true);
        return true;

      case '/new':
        const prevSessionId = currentSessionId;
        const newSessionId = getNextSessionId();
        
        // Auto-generate summary for the session we're leaving
        generateSummaryForPreviousSession(prevSessionId);
        
        setCurrentSessionId(newSessionId);
        setMessages([]);
        setMetaphors([]);
        // DEPRECATED: Questions feature temporarily disabled
        // setQuestions([]);
        
        // Track new session
        trackSession();
        
        return true;

      case '/load':
        if (args[0] === 'previous') {
          const sessions = loadSessions();
          if (sessions.length > 1) {  // Changed to check for at least 2 sessions
            const penultimate = sessions[sessions.length - 2];  // Changed to get second-to-last session
            setCurrentSessionId(penultimate.id);
            setMessages(penultimate.messages);
            setMetaphors(penultimate.metaphors || []);
            // DEPRECATED: Questions feature temporarily disabled
            // setQuestions(penultimate.questions || []);
            setAdvisorSuggestions(penultimate.advisorSuggestions || []);
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
          
          // Process messages to restore advisor_json format if needed
          const processedMessages = session.messages.map((msg, idx) => {
            const baseTimestamp = msg.timestamp || new Date(Date.now() - (session.messages.length - idx) * 1000).toISOString();
            
            // If it's already an advisor_json message, restore parsedAdvisors if missing
            if (msg.type === 'advisor_json' && msg.content && !msg.parsedAdvisors) {
              let jsonContent = msg.content.trim();
              
              // Handle markdown code block format
              if (jsonContent.startsWith('```json') && jsonContent.endsWith('```')) {
                jsonContent = jsonContent.slice(7, -3).trim();
              }
              
              try {
                const parsed = JSON.parse(jsonContent);
                if (parsed.type === 'advisor_response' && parsed.advisors && Array.isArray(parsed.advisors)) {
                  return {
                    ...msg,
                    type: 'advisor_json',
                    content: jsonContent,
                    parsedAdvisors: parsed,
                    timestamp: baseTimestamp
                  };
                }
              } catch (e) {
                console.warn('Failed to parse advisor_json content:', e.message);
              }
            }
            
            // If it's an assistant message that looks like JSON advisor format, restore it
            if (msg.type === 'assistant' && msg.content) {
              let jsonContent = msg.content.trim();
              
              // Handle markdown code block format
              if (jsonContent.startsWith('```json') && jsonContent.endsWith('```')) {
                jsonContent = jsonContent.slice(7, -3).trim();
              }
              
              // Check if it's valid advisor JSON
              if (jsonContent.startsWith('{') && jsonContent.endsWith('}')) {
                try {
                  const parsed = JSON.parse(jsonContent);
                  if (parsed.type === 'advisor_response' && parsed.advisors && Array.isArray(parsed.advisors)) {
                    // Restore as advisor_json type with parsedAdvisors
                    return {
                      ...msg,
                      type: 'advisor_json',
                      content: jsonContent,
                      parsedAdvisors: parsed,
                      timestamp: baseTimestamp
                    };
                  }
                } catch (e) {
                  // Not valid JSON, keep as-is
                }
              }
            }
            
            return { ...msg, timestamp: baseTimestamp };
          });
          
          setMessages(processedMessages);
          setMetaphors(session.metaphors || []);
          // DEPRECATED: Questions feature temporarily disabled
          // setQuestions(session.questions || []);
          setAdvisorSuggestions(session.advisorSuggestions || []);
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
        // DEPRECATED: Questions feature temporarily disabled
        // setQuestions([]);
        return true;

      case '/advisor':
        if (!args[0]) {  // If no subcommand is provided
          setMessages(prev => [...prev, {
            type: 'system',
            content: `Available advisor commands:
/advisor add      - Add a new advisor
/advisor edit     - Edit an advisor
/advisor delete   - Delete an advisor
/advisor list     - List all advisors
/advisor generate - Generate perspective suggestions from worksheet
/advisor finalize - Get detailed profiles for chosen advisors

Note: Advisor sharing is now available through the GUI menu (bottom-left → Import/Export Advisors)`
          }]);
          return true;  // Add this to prevent fall-through to debug command
        }

        switch(args[0]) {
          case 'generate':
            if (!args[1]) {
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

There are no formal limits on perspective suggestions. 
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
            setSuggestedAdvisorName('');
            setShowAdvisorForm(true);
            return true;

          case 'activate':
            if (!args[1]) {
              return true;
            }
            
            const fullTextActivate = args.join(' ');
            const firstQuoteActivate = fullTextActivate.indexOf('"');
            const lastQuoteActivate = fullTextActivate.indexOf('"', firstQuoteActivate + 1);
            
            if (firstQuoteActivate === -1 || lastQuoteActivate === -1) {
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
            return true;

          case 'deactivate':
            if (!args[1]) {
              return true;
            }
            
            const fullTextDeactivate = args.join(' ');
            const firstQuoteDeactivate = fullTextDeactivate.indexOf('"');
            const lastQuoteDeactivate = fullTextDeactivate.indexOf('"', firstQuoteDeactivate + 1);
            
            if (firstQuoteDeactivate === -1 || lastQuoteDeactivate === -1) {
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
            return true;

          case 'list':
            // Advisor list now available in GUI sidebar
            return true;

          case 'edit':
            if (!args[1]) {
              return true;
            }
            
            const fullTextEdit = args.join(' ');
            const firstQuoteEdit = fullTextEdit.indexOf('"');
            const lastQuoteEdit = fullTextEdit.indexOf('"', firstQuoteEdit + 1);
            
            if (firstQuoteEdit === -1 || lastQuoteEdit === -1) {
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
              return true;
            }
            
            const fullTextDelete = args.join(' ');
            const firstQuoteDelete = fullTextDelete.indexOf('"');
            const lastQuoteDelete = fullTextDelete.indexOf('"', firstQuoteDelete + 1);
            
            if (firstQuoteDelete === -1 || lastQuoteDelete === -1) {
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
        return true;

      }


      case '/debug':
        console.log('Debug command received');
        const newDebugMode = !debugMode;
        setDebugMode(newDebugMode);
        setMessages(prev => [...prev, {
          type: 'system',
          content: `Debug mode ${newDebugMode ? 'enabled' : 'disabled'}`
        }]);
        return true;

      case '/reasoning':
      case '/think':
        const newReasoningMode = !reasoningMode;
        setReasoningMode(newReasoningMode);
        localStorage.setItem('space_reasoning_mode', newReasoningMode.toString());
        setMessages(prev => [...prev, {
          type: 'system',
          content: `Reasoning mode ${newReasoningMode ? 'enabled' : 'disabled'}`
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
            // Prompt list now available in Prompt Library
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
            // Worksheet list data available through worksheet commands
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

      case '/dossier':
        if (!args[0]) {
          setMessages(prev => [...prev, {
            type: 'system',
            content: 'Usage: /dossier <subject>'
          }]);
          return true;
        }
        const subject = args.join(' ');
        const dossierMsgs = memory.compileDossier(subject);
        setMessages(prev => [...prev, {
          type: 'system',
          content: `Dossier for "${subject}" contains ${dossierMsgs.length} messages.`
        }]);
        return true;

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
/group add <group_name> <advisor>  - Add a perspective to a group
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
            // Advisor groups now managed through GUI
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
        if (useAuthSystem) {
          setMessages(prev => [...prev, {
            type: 'system',
            content: 'API key management disabled. Using authentication system.'
          }]);
          return true;
        }
        
        switch(args[0]) {
          case 'clear':
            removeEncrypted('space_anthropic_key');
            removeEncrypted('space_openai_key');
            removeEncrypted('space_gemini_key');
            setApiKeysSet(false);
            setMessages(prev => [...prev, {
              type: 'system',
              content: 'API keys cleared. Please restart the terminal.'
            }]);
            return true;

          case 'status':
            (async () => {
              try {
                // API key access not available in auth mode
                const anthropicKey = null;
                const openaiKey = null;
                const geminiKey = null;
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: `API Keys Status:
Anthropic: ${anthropicKey ? '✓ Set' : '✗ Not Set'}
OpenAI: ${openaiKey ? '✓ Set' : '✗ Not Set'}
Gemini: ${geminiKey ? '✓ Set' : '✗ Not Set'}`
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
                  content: 'Usage: /key set [anthropic/openai/gemini] <api-key>'
                }]);
                return true;
              }

              const service = args[1].toLowerCase();
              const newKey = args[2];

              if (service !== 'anthropic' && service !== 'openai' && service !== 'gemini') {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Invalid service. Use "anthropic", "openai", or "gemini"'
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

              if (service === 'gemini' && !newKey.startsWith('AIza')) {
                setMessages(prev => [...prev, {
                  type: 'system',
                  content: 'Invalid Gemini API key format'
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
                      model: 'claude-sonnet-4.5',
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
                console.log('✅ OpenAI client re-initialized after key update');
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
                '/key set [anthropic/openai/gemini] <api-key> - Update API key\n' +
                '/keys status - Check API key status\n' +
                '/keys clear - Clear stored API keys'
            }]);
            return true;
        }

      case '/council':
        // Let council mode detection handle this in normal message processing
        return false;

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

export default handleCommand;

