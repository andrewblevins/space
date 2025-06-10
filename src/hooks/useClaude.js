import { useCallback } from 'react';
import { getApiEndpoint } from '../utils/apiConfig';
import { handleApiError } from '../utils/apiErrorHandler';
import { getDecrypted } from '../utils/secureStorage';
import { buildConversationContext } from '../utils/terminalHelpers';
import { trackUsage, formatCost } from '../utils/usageTracking';

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Helper function to read text content from file
const fileToText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

/**
 * Hook providing the callClaude function used to stream responses from the API.
 * @param {object} params
 * @param {Array<object>} params.messages - Current conversation messages.
 * @param {(msgs: Array<object>|((prev: Array<object>) => Array<object>)) => void} params.setMessages
 * @param {number} params.maxTokens
 * @param {number} params.contextLimit
 * @param {import('../lib/memory').MemorySystem} params.memory
 * @param {boolean} params.debugMode
 * @param {() => string} params.getSystemPrompt
 * @returns {{ callClaude: (msg: string, customGetSystemPrompt?: () => string) => Promise<string> }}
 */
export function useClaude({ messages, setMessages, maxTokens, contextLimit, memory, debugMode, getSystemPrompt }) {
  const callClaude = useCallback(async (userMessage, customGetSystemPrompt = null, attachedFiles = []) => {
    const formatTimestamp = (iso) => new Date(iso).toISOString().slice(0, 16);
    if (!userMessage?.trim()) throw new Error('Empty message');
    const anthropicKey = await getDecrypted('space_anthropic_key');
    if (!anthropicKey) throw new Error('Anthropic API key not found');

    const estimateTokens = (text) => Math.ceil(text.length / 4);
    const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

    // Construct user message with potential file attachments
    const userContent = [];
    
    // Add text content
    if (userMessage?.trim()) {
      userContent.push({ type: 'text', text: userMessage });
    }
    
    // Add file attachments
    const uploadedFiles = attachedFiles.filter(file => file.status === 'uploaded');
    for (const file of uploadedFiles) {
      if (file.type?.startsWith('image/')) {
        // For images, use base64 encoding
        const base64Data = await fileToBase64(file.file);
        userContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.type,
            data: base64Data.split(',')[1] // Remove data:image/...;base64, prefix
          }
        });
      } else if (file.type === 'application/pdf') {
        // For PDFs, use document block
        const base64Data = await fileToBase64(file.file);
        userContent.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: file.type,
            data: base64Data.split(',')[1] // Remove data:...;base64, prefix
          }
        });
      } else if (file.type?.includes('text/') || file.name?.endsWith('.md') || file.name?.endsWith('.txt')) {
        // For text files, read content and add as text block
        const textContent = await fileToText(file.file);
        userContent.push({
          type: 'text',
          text: `\n\n--- Content of ${file.name} ---\n${textContent}\n--- End of ${file.name} ---\n`
        });
      }
    }
    
    const contextMessages = [{ 
      role: 'user', 
      content: userContent.length === 1 && userContent[0].type === 'text' 
        ? userContent[0].text  // Simple text if no files
        : userContent          // Multi-modal content array
    }];
    if (totalTokens < contextLimit) {
      const historical = messages
        .filter((m) => (m.type === 'user' || m.type === 'assistant') && m.content?.trim() !== '' && m.content !== userMessage)
        .map((m) => ({ role: m.type, content: m.timestamp ? `[${formatTimestamp(m.timestamp)}] ${m.content}` : m.content }));
      contextMessages.unshift(...historical);
    } else {
      const managed = buildConversationContext(userMessage, messages, memory);
      if (managed?.length) contextMessages.unshift(...managed);
    }

    const systemPromptText = customGetSystemPrompt ? customGetSystemPrompt() : getSystemPrompt();
    
    // Debug logging for file uploads
    if (uploadedFiles.length > 0) {
      console.log('📎 Sending files to Claude:', uploadedFiles.map(f => ({ name: f.name, type: f.type, status: f.status })));
      console.log('📎 User content structure:', userContent);
      console.log('📎 Final context messages:', contextMessages);
    }
    
    // Calculate input tokens for tracking
    const systemTokens = estimateTokens(systemPromptText);
    const contextTokens = contextMessages.reduce((s, m) => s + estimateTokens(m.content), 0);
    const inputTokens = systemTokens + contextTokens;
    
    if (debugMode) {
      const currentUserMessage = [...messages].reverse().find((m) => m.type === 'user' && m.content === userMessage) || { content: userMessage, tags: [] };
      const inputCost = inputTokens * (3.00 / 1_000_000); // Current Claude pricing
      const debugOutput = `Claude API Call:\nEstimated input tokens: ${inputTokens} (System: ${systemTokens}, Context: ${contextTokens})\nEstimated input cost: ${formatCost(inputCost)}\n\nTags for current message: ${JSON.stringify(currentUserMessage.tags, null, 2)}\n\nSystem Prompt:\n${systemPromptText}\n\nContext Messages:\n${JSON.stringify(contextMessages, null, 2)}`;
      setMessages((prev) => [...prev, { type: 'debug', content: debugOutput }]);
    }

    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      messages: contextMessages,
      system: systemPromptText,
      max_tokens: maxTokens,
      stream: true,
    };

    // Debug logging for file uploads - show full request
    if (uploadedFiles.length > 0) {
      console.log('📎 Full API request body:', JSON.stringify(requestBody, null, 2));
    }

    const response = await fetch(`${getApiEndpoint()}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Handle auth errors without consuming response body again
      if (response.status === 401) {
        const { removeEncrypted } = await import('../utils/secureStorage');
        removeEncrypted('space_anthropic_key');
        removeEncrypted('space_openai_key');
        sessionStorage.setItem('auth_error', 'Your API key has expired or been deactivated. Please enter new API keys to continue.');
        window.location.reload();
        return;
      }
      // Parse and improve file upload error messages
      let friendlyError = errorText;
      try {
        const errorObj = JSON.parse(errorText);
        if (errorObj.error?.message) {
          const message = errorObj.error.message;
          if (message.includes("maximum of 100 PDF pages")) {
            friendlyError = "PDF file is too large (maximum 100 pages allowed). Please upload a smaller PDF.";
          } else if (message.includes("maximum file size")) {
            friendlyError = "File is too large. Images must be under 3.75MB, documents under 4.5MB.";
          } else if (message.includes("Input should be 'application/pdf'")) {
            friendlyError = "Only PDF files are supported for document uploads. Text files are embedded as text content.";
          } else if (message.includes("unsupported file type")) {
            friendlyError = "Unsupported file type. Please upload images (JPEG, PNG, GIF, WebP) or documents (PDF, TXT).";
          } else {
            friendlyError = message;
          }
        }
      } catch (parseError) {
        // If JSON parsing fails, use original error
      }
      throw new Error(`File Upload Error: ${friendlyError}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentMessageContent = '';

    setMessages((prev) => [...prev, { type: 'assistant', content: '' }]);

    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const isPunctuation = (char) => ['.', '!', '?', '\n'].includes(char);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';
      for (const event of events) {
        const dataMatch = event.match(/^data: (.+)$/m);
        if (!dataMatch) continue;
        try {
          const data = JSON.parse(dataMatch[1]);
          if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
            const text = data.delta.text;
            for (let i = 0; i < text.length; i++) {
              const char = text[i];
              let delay = Math.random() * 5;
              if (i > 0 && isPunctuation(text[i - 1])) delay += 0;
              await sleep(delay);
              currentMessageContent += char;
              setMessages((prev) => {
                const newMessages = [...prev];
                if (newMessages.length > 0) {
                  newMessages[newMessages.length - 1] = { type: 'assistant', content: currentMessageContent };
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
    
    // Track usage after successful completion
    const outputTokens = estimateTokens(currentMessageContent);
    const cost = trackUsage('claude', inputTokens, outputTokens);
    
    console.log('🔍 useClaude - Final response from Claude:', JSON.stringify(currentMessageContent));
    
    if (debugMode) {
      const debugOutput = `Response complete:\nOutput tokens: ${outputTokens}\nTotal cost for this call: ${formatCost(cost)}`;
      setMessages((prev) => [...prev, { type: 'debug', content: debugOutput }]);
    }
    
    return currentMessageContent;
  }, [messages, setMessages, maxTokens, contextLimit, memory, debugMode, getSystemPrompt]);

  return { callClaude };
}

export default useClaude;
