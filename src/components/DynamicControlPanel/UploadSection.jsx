import React, { useState } from 'react';

function UploadSection({ onFileUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      processFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setIsProcessing(true);
    
    // Create a worker for file processing
    const worker = new Worker(new URL('../worker/csvWorker.js', import.meta.url));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      
      // Parse CSV (simple implementation)
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',');
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index]?.trim() || '';
          });
          data.push(row);
        }
      }

      // Create summary
      const dataTypes = {};
      headers.forEach(header => {
        const sampleValue = data[0]?.[header];
        dataTypes[header] = !isNaN(sampleValue) ? 'number' : 'string';
      });

      const summary = {
        headers,
        dataTypes,
        rowCount: data.length
      };

      setIsProcessing(false);
      onFileUpload(data, summary, worker);
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">CSV Data Processor</h1>
      <p className="text-gray-600 mb-6">Upload your CSV file to start processing</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-600">Processing file...</p>
          </div>
        ) : (
          <>
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag and drop your CSV file here
            </p>
            <p className="text-gray-500 mb-4">or</p>
            <label className="inline-block">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors inline-block">
                Browse Files
              </span>
            </label>
          </>
        )}
      </div>
    </div>
  );
}

export default UploadSection;
