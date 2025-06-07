import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { getApiEndpoint } from '../../utils/apiConfig';
import { handleApiError } from '../../utils/apiErrorHandler';
import { getDecrypted } from '../../utils/secureStorage';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const MAX_TOTAL_CHARS = 100000;

const truncate = (text, len = 50) => {
  if (!text) return '';
  return text.length > len ? text.slice(0, len) + '...' : text;
};

const LibraryModal = ({
  isOpen,
  advisorName,
  existingDescription = '',
  items = [],
  onClose,
  onUpdate,
  onGenerate
}) => {
  const [libraryItems, setLibraryItems] = useState(items);
  const [addingText, setAddingText] = useState(false);
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [preview, setPreview] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setLibraryItems(items);
  }, [items]);

  if (!isOpen) return null;

  const totalChars = libraryItems.reduce((sum, i) => sum + i.content.length, 0);
  const totalWords = Math.round(totalChars / 5);

  const handleAddText = () => {
    const content = textContent.trim();
    const title = textTitle.trim() || 'Untitled';
    if (!content) return;
    if (totalChars + content.length > MAX_TOTAL_CHARS) {
      alert('Library limit exceeded (100,000 characters).');
      return;
    }
    const item = {
      id: Date.now().toString(),
      type: 'text',
      title,
      content,
      addedAt: new Date().toISOString()
    };
    setLibraryItems([...libraryItems, item]);
    setAddingText(false);
    setTextTitle('');
    setTextContent('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large (max 5MB)');
      return;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'pdf', 'md'].includes(ext)) {
      alert('Unsupported file type');
      return;
    }
    let content = '';
    if (ext === 'pdf') {
      try {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          content += pageText + '\n';
        }
      } catch (err) {
        console.error('PDF parse failed', err);
        alert('Failed to parse PDF');
        return;
      }
    } else {
      content = await file.text();
    }
    if (totalChars + content.length > MAX_TOTAL_CHARS) {
      alert('Library limit exceeded (100,000 characters).');
      return;
    }
    const item = {
      id: Date.now().toString(),
      type: 'file',
      title: file.name,
      content,
      addedAt: new Date().toISOString()
    };
    setLibraryItems([...libraryItems, item]);
  };

  const handleDelete = (id) => {
    setLibraryItems(libraryItems.filter(i => i.id !== id));
  };

  const handleGenerate = async () => {
    if (!libraryItems.length) return;
    const libraryText = libraryItems.map(i => i.content).join('\n\n');
    try {
      setGenerating(true);
      const anthropicKey = await getDecrypted('space_anthropic_key');
      if (!anthropicKey) {
        throw new Error('Anthropic API key not found');
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
          model: 'claude-3-7-sonnet-20250219',
          messages: [{
            role: 'user',
            content: `Here are source materials for an advisor named ${advisorName}. Generate an enhanced 150-300 word description that incorporates key concepts, quotes, and speaking style from these materials. Current description: ${existingDescription}\n\n${libraryText}`
          }],
          max_tokens: 600,
          stream: true
        })
      });
      if (!response.ok) {
        await handleApiError(response);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.delta?.text || '';
              text += content;
              setPreview(text);
            } catch (e) {
              console.error('Error parsing stream:', e);
            }
          }
        }
      }
      setShowPreview(true);
    } catch (err) {
      console.error('Description generation failed', err);
      alert('Failed to generate description');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseDescription = () => {
    if (onGenerate) onGenerate(preview);
    setShowPreview(false);
  };

  const handleClose = () => {
    onUpdate && onUpdate(libraryItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-gray-900 border border-green-400 rounded-lg p-4 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-green-400 text-lg font-semibold">{advisorName}'s Library</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-green-400">✕</button>
        </div>
        {libraryItems.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No items in library yet.</div>
        ) : (
          <div className="mb-4 text-gray-300">
            <p className="mb-2">Library Items ({libraryItems.length}) - Total ~{totalWords.toLocaleString()} words</p>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {libraryItems.map(item => (
                <li key={item.id} className="flex justify-between items-center bg-black border border-gray-700 px-2 py-1">
                  <span className="truncate mr-2">📄 {item.title} - {truncate(item.content)}</span>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300">×</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {addingText ? (
          <div className="mb-4 border border-gray-700 p-2">
            <input
              type="text"
              value={textTitle}
              onChange={e => setTextTitle(e.target.value)}
              placeholder="Title"
              className="w-full mb-2 bg-black text-green-400 border border-green-400 p-1 focus:outline-none"
            />
            <textarea
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
              placeholder="Text content"
              className="w-full h-32 bg-black text-green-400 border border-green-400 p-1 focus:outline-none resize-none"
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button onClick={() => {setAddingText(false); setTextTitle(''); setTextContent('');}} className="text-gray-400">Cancel</button>
              <button onClick={handleAddText} className="text-green-400">Add to Library</button>
            </div>
          </div>
        ) : (
          <div className="flex space-x-2 mb-4">
            <button onClick={() => setAddingText(true)} className="px-3 py-1 border border-green-400 text-green-400 rounded hover:bg-green-400 hover:text-black">+ Add Text</button>
            <label className="px-3 py-1 border border-green-400 text-green-400 rounded hover:bg-green-400 hover:text-black cursor-pointer">
              + Upload File
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}
        <div className="flex justify-between">
          <button onClick={handleClose} className="px-4 py-2 border border-green-400 text-green-400 rounded hover:bg-green-400 hover:text-black">Close</button>
          <button onClick={handleGenerate} disabled={generating || !libraryItems.length} className="px-4 py-2 border border-yellow-400 text-yellow-400 rounded hover:bg-yellow-400 hover:text-black disabled:opacity-50">Generate Description</button>
        </div>
        {showPreview && (
          <div className="mt-4 border border-gray-700 p-2">
            <h3 className="text-green-400 mb-2">Generated Description Preview</h3>
            <p className="text-gray-300 whitespace-pre-wrap mb-2" style={{maxHeight:'200px',overflowY:'auto'}}>{preview}</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => {setPreview(''); setShowPreview(false); handleGenerate();}} className="text-yellow-400">Try Again</button>
              <button onClick={handleUseDescription} className="text-green-400">Use This Description</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryModal;
