import React, { useState } from 'react';

const ImportExportModal = ({ isOpen, onClose, advisors, onImport }) => {
  const [selectedAdvisors, setSelectedAdvisors] = useState(new Set());
  const [importMode, setImportMode] = useState('add'); // 'add' or 'replace'
  const [dragOver, setDragOver] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  const handleSelectAll = () => {
    setSelectedAdvisors(new Set(advisors.map((_, index) => index)));
  };

  const handleSelectNone = () => {
    setSelectedAdvisors(new Set());
  };

  const handleAdvisorToggle = (index) => {
    const newSelected = new Set(selectedAdvisors);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedAdvisors(newSelected);
  };

  const handleExport = () => {
    const selectedAdvisorData = advisors.filter((_, index) => selectedAdvisors.has(index));
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      appVersion: "0.2.6",
      source: "SPACE Terminal",
      advisors: selectedAdvisorData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `space-advisors-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
      setImportError('Please select a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate file structure
        if (!data.advisors || !Array.isArray(data.advisors)) {
          throw new Error('Invalid file format: missing advisors array');
        }

        // Validate advisor structure
        for (const advisor of data.advisors) {
          if (!advisor.name || !advisor.description) {
            throw new Error('Invalid advisor format: missing name or description');
          }
        }

        setPreviewData(data);
        setImportError('');
      } catch (error) {
        setImportError(`Error reading file: ${error.message}`);
        setPreviewData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
    e.target.value = ''; // Reset input
  };

  const handleImport = () => {
    if (!previewData) return;
    
    onImport(previewData.advisors, importMode);
    setPreviewData(null);
    setImportError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-green-400 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-green-400 text-xl font-semibold">Import/Export Advisors</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-green-400 text-xl">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Section */}
          <div className="border border-gray-700 rounded p-4">
            <h3 className="text-green-400 text-lg mb-3">Export Advisors</h3>
            
            {advisors.length === 0 ? (
              <p className="text-gray-400">No advisors to export</p>
            ) : (
              <>
                <div className="mb-3">
                  <div className="flex gap-2 mb-2">
                    <button 
                      onClick={handleSelectAll}
                      className="text-sm text-green-400 hover:text-green-300"
                    >
                      Select All
                    </button>
                    <span className="text-gray-500">|</span>
                    <button 
                      onClick={handleSelectNone}
                      className="text-sm text-green-400 hover:text-green-300"
                    >
                      Select None
                    </button>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {selectedAdvisors.size} of {advisors.length} advisors selected
                  </p>
                </div>

                <div className="max-h-40 overflow-y-auto mb-4 border border-gray-600 rounded p-2">
                  {advisors.map((advisor, index) => (
                    <label key={index} className="flex items-center gap-2 p-1 hover:bg-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAdvisors.has(index)}
                        onChange={() => handleAdvisorToggle(index)}
                        className="text-green-400"
                      />
                      <span className="text-gray-300 truncate">
                        {advisor.name}
                        {advisor.hasLibrary && <span className="text-yellow-400"> 📚</span>}
                      </span>
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleExport}
                  disabled={selectedAdvisors.size === 0}
                  className="w-full px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export Selected Advisors
                </button>
              </>
            )}
          </div>

          {/* Import Section */}
          <div className="border border-gray-700 rounded p-4">
            <h3 className="text-green-400 text-lg mb-3">Import Advisors</h3>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver ? 'border-green-400 bg-green-900 bg-opacity-20' : 'border-gray-600'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
            >
              <p className="text-gray-300 mb-2">Drop advisor file here or</p>
              <label className="cursor-pointer">
                <span className="text-green-400 hover:text-green-300 underline">
                  browse files
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
              <p className="text-gray-500 text-sm mt-2">JSON files only</p>
            </div>

            {importError && (
              <div className="mt-3 p-2 bg-red-900 bg-opacity-30 border border-red-600 rounded">
                <p className="text-red-400 text-sm">{importError}</p>
              </div>
            )}

            {previewData && (
              <div className="mt-4">
                <h4 className="text-green-400 mb-2">Preview:</h4>
                <div className="bg-black border border-gray-600 rounded p-2 max-h-32 overflow-y-auto">
                  <p className="text-gray-300 text-sm mb-1">
                    Found {previewData.advisors.length} advisors:
                  </p>
                  {previewData.advisors.map((advisor, index) => (
                    <p key={index} className="text-gray-400 text-sm truncate">
                      • {advisor.name}
                      {advisor.hasLibrary && <span className="text-yellow-400"> 📚</span>}
                    </p>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name="importMode"
                      value="add"
                      checked={importMode === 'add'}
                      onChange={(e) => setImportMode(e.target.value)}
                      className="text-green-400"
                    />
                    <span className="text-gray-300 text-sm">Add to existing advisors</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={(e) => setImportMode(e.target.value)}
                      className="text-green-400"
                    />
                    <span className="text-gray-300 text-sm">Replace all advisors</span>
                  </label>
                </div>

                <button
                  onClick={handleImport}
                  className="w-full mt-3 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600"
                >
                  Import {previewData.advisors.length} Advisors
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-green-400 text-green-400 rounded hover:bg-green-400 hover:text-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;