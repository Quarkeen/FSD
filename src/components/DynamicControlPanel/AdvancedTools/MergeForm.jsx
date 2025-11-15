import React, { useState, useEffect } from 'react';

function MergeForm({ allHeaders, onProcess, setActiveTool, worker }) {
  const [mergeState, setMergeState] = useState({
    file: null,
    file2Headers: [],
    key1: allHeaders[0]?.name || '',
    key2: '',
    joinType: 'left',
  });

  // Listen for worker messages to get file2 headers
  useEffect(() => {
    if (!worker) return;

    const handleWorkerMessage = (event) => {
      const { type, payload } = event.data;
      
      if (type === 'SUCCESS_PARSE_FILE_2') {
        console.log('File 2 headers received:', payload.headers);
        setMergeState(prevState => ({
          ...prevState,
          file2Headers: payload.headers || [],
          key2: payload.headers?.[0] || ''
        }));
      }
    };

    worker.addEventListener('message', handleWorkerMessage);
    return () => worker.removeEventListener('message', handleWorkerMessage);
  }, [worker]);

  const handleMergeFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Uploading file 2:', file.name);
      setMergeState(prevState => ({ 
        ...prevState, 
        file,
        file2Headers: [],
        key2: ''
      }));
      onProcess('PARSE_FILE_2_FOR_MERGE', { file });
    }
  };

  const handleMergeSubmit = (e) => {
    e.preventDefault();
    if (!mergeState.key1 || !mergeState.key2) {
      alert('Please select join keys for both files.');
      return;
    }
    if (!mergeState.file) {
      alert('Please upload File 2 first.');
      return;
    }
    
    onProcess('PERFORM_MERGE', {
      key1: mergeState.key1,
      key2: mergeState.key2,
      joinType: mergeState.joinType,
    });
    setActiveTool(null);
  };

  // Join type descriptions
  const joinDescriptions = {
    left: 'Keep all rows from File 1, add matching data from File 2',
    right: 'Keep all rows from File 2, add matching data from File 1',
    inner: 'Keep only rows that match in both files',
    outer: 'Keep all rows from both files (full outer join)',
    cross: 'Create all possible combinations (Cartesian product)'
  };

  return (
    <form onSubmit={handleMergeSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
      <h4 className="text-md font-semibold mb-2">Merge (Join) Files</h4>
      
      {/* File Upload Section */}
      <div className="mb-4 p-3 bg-white rounded border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📁 Upload File 2 (to join)
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleMergeFileChange}
          className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {mergeState.file && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-xs text-green-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <strong>{mergeState.file.name}</strong> uploaded
              {mergeState.file2Headers.length > 0 && (
                <span className="text-green-600">
                  • {mergeState.file2Headers.length} columns detected
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Join Keys Selection */}
      <div className="mb-4 p-3 bg-white rounded border border-gray-200">
        <h5 className="text-sm font-semibold text-gray-700 mb-3">🔑 Select Join Keys</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File 1 Key (Current File)
            </label>
            <select
              value={mergeState.key1}
              onChange={(e) => setMergeState({ ...mergeState, key1: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {allHeaders.map(h => (
                <option key={h.name} value={h.name}>
                  {h.name} ({h.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File 2 Key (Uploaded File)
            </label>
            <select
              value={mergeState.key2}
              onChange={(e) => setMergeState({ ...mergeState, key2: e.target.value })}
              disabled={mergeState.file2Headers.length === 0}
              className="w-full p-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">
                {mergeState.file2Headers.length === 0 
                  ? '⚠️ Upload File 2 first...' 
                  : 'Select key column...'}
              </option>
              {mergeState.file2Headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Join Type Selection with Visual Diagrams */}
      <div className="mb-4 p-3 bg-white rounded border border-gray-200">
        <h5 className="text-sm font-semibold text-gray-700 mb-3">🔗 Choose Join Type</h5>
        <div className="space-y-2">
          {/* Left Join */}
          <label className="flex items-start p-3 border rounded cursor-pointer hover:bg-blue-50 transition-colors">
            <input
              type="radio"
              name="joinType"
              value="left"
              checked={mergeState.joinType === 'left'}
              onChange={(e) => setMergeState({ ...mergeState, joinType: e.target.value })}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800">Left Join</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Recommended</span>
              </div>
              <p className="text-xs text-gray-600">{joinDescriptions.left}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>File 1</span>
                </div>
                <span>+</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded opacity-50"></div>
                  <span>File 2 (matching)</span>
                </div>
              </div>
            </div>
          </label>

          {/* Right Join */}
          <label className="flex items-start p-3 border rounded cursor-pointer hover:bg-blue-50 transition-colors">
            <input
              type="radio"
              name="joinType"
              value="right"
              checked={mergeState.joinType === 'right'}
              onChange={(e) => setMergeState({ ...mergeState, joinType: e.target.value })}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800">Right Join</span>
              </div>
              <p className="text-xs text-gray-600">{joinDescriptions.right}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500 rounded opacity-50"></div>
                  <span>File 1 (matching)</span>
                </div>
                <span>+</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>File 2</span>
                </div>
              </div>
            </div>
          </label>

          {/* Inner Join */}
          <label className="flex items-start p-3 border rounded cursor-pointer hover:bg-blue-50 transition-colors">
            <input
              type="radio"
              name="joinType"
              value="inner"
              checked={mergeState.joinType === 'inner'}
              onChange={(e) => setMergeState({ ...mergeState, joinType: e.target.value })}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800">Inner Join</span>
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">Strict</span>
              </div>
              <p className="text-xs text-gray-600">{joinDescriptions.inner}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>Matching rows only</span>
                </div>
              </div>
            </div>
          </label>

          {/* Outer Join */}
          <label className="flex items-start p-3 border rounded cursor-pointer hover:bg-blue-50 transition-colors">
            <input
              type="radio"
              name="joinType"
              value="outer"
              checked={mergeState.joinType === 'outer'}
              onChange={(e) => setMergeState({ ...mergeState, joinType: e.target.value })}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800">Full Outer Join</span>
                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">All Data</span>
              </div>
              <p className="text-xs text-gray-600">{joinDescriptions.outer}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>File 1</span>
                </div>
                <span>+</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>File 2</span>
                </div>
              </div>
            </div>
          </label>

          {/* Cross Join */}
          <label className="flex items-start p-3 border rounded cursor-pointer hover:bg-blue-50 transition-colors">
            <input
              type="radio"
              name="joinType"
              value="cross"
              checked={mergeState.joinType === 'cross'}
              onChange={(e) => setMergeState({ ...mergeState, joinType: e.target.value })}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800">Cross Join</span>
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">⚠️ Large Output</span>
              </div>
              <p className="text-xs text-gray-600">{joinDescriptions.cross}</p>
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Warning: Creates File1.rows × File2.rows combinations
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!mergeState.file || mergeState.file2Headers.length === 0 || !mergeState.key2}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {!mergeState.file ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload File 2 to Continue
          </>
        ) : mergeState.file2Headers.length === 0 ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing File 2...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Perform {mergeState.joinType.charAt(0).toUpperCase() + mergeState.joinType.slice(1)} Join
          </>
        )}
      </button>
    </form>
  );
}

export default MergeForm;
