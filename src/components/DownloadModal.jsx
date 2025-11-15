import React, { useState, useRef } from 'react';

function DownloadModal({ isOpen, onConfirm, onCancel, isProcessing }) {
  const [fileName, setFileName] = useState('processed_data');
  const [destinationPath, setDestinationPath] = useState('');
  const fileInputRef = useRef(null);

  const handleConfirm = () => {
    if (!fileName.trim()) {
      alert('Please enter a filename');
      return;
    }
    
    // Remove .csv extension if user added it
    const cleanFileName = fileName.trim().endsWith('.csv') 
      ? fileName.trim() 
      : `${fileName.trim()}.csv`;
    
    onConfirm(cleanFileName, destinationPath);
    setFileName('processed_data');
    setDestinationPath('');
  };

  const handleFolderSelect = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      setDestinationPath(dirHandle);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error selecting folder:', err);
        alert('Error selecting folder. Using default Downloads folder.');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Download CSV</h2>
        
        <p className="text-sm text-gray-600 mb-4">
          Enter the filename and choose the destination folder for your CSV file.
        </p>

        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filename
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="processed_data"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 mt-1">
              .csv extension will be added automatically
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination Folder
            </label>
            <button
              onClick={handleFolderSelect}
              disabled={isProcessing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 text-left transition"
            >
              {destinationPath 
                ? <span className="text-green-600 font-medium">✓ Folder Selected</span>
                : <span className="text-gray-500">Choose Destination Folder...</span>
              }
            </button>
            <p className="text-xs text-gray-500 mt-1">
              {destinationPath 
                ? '✓ Custom folder selected' 
                : 'Optional: Choose a custom location (default is Downloads)'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {isProcessing ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DownloadModal;
