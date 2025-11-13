import React, { useState } from 'react';

function MergeForm({ allHeaders, onProcess, setActiveTool }) {
  const [mergeState, setMergeState] = useState({
    file: null,
    file2Headers: [],
    key1: allHeaders[0]?.name || '',
    key2: '',
    joinType: 'left',
  });

  const handleMergeFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMergeState({ ...mergeState, file });
      onProcess('PARSE_FILE_2_FOR_MERGE', { file });
    }
  };

  const handleMergeSubmit = (e) => {
    e.preventDefault();
    if (!mergeState.key1 || !mergeState.key2) {
      alert('Please select join keys for both files.');
      return;
    }
    onProcess('PERFORM_MERGE', {
      key1: mergeState.key1,
      key2: mergeState.key2,
      joinType: mergeState.joinType,
    });
    setActiveTool(null);
  };

  return (
    <form onSubmit={handleMergeSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
      <h4 className="text-md font-semibold mb-2">Merge (Join) Files</h4>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Upload File 2 (to join)
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleMergeFileChange}
          className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File 1 Key (Current)
          </label>
          <select
            value={mergeState.key1}
            onChange={(e) => setMergeState({ ...mergeState, key1: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            {allHeaders.map(h => (
              <option key={h.name} value={h.name}>{h.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File 2 Key</label>
          <select
            value={mergeState.key2}
            onChange={(e) => setMergeState({ ...mergeState, key2: e.target.value })}
            disabled={mergeState.file2Headers.length === 0}
            className="w-full p-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
          >
            <option value="">
              {mergeState.file2Headers.length ? 'Select key...' : 'Upload File 2...'}
            </option>
            {mergeState.file2Headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Join Type</label>
        <select
          value={mergeState.joinType}
          onChange={(e) => setMergeState({ ...mergeState, joinType: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="left">Left Join (All from File 1, matching from File 2)</option>
          <option value="inner">Inner Join (Only matching rows)</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={!mergeState.file}
        className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        Perform Merge
      </button>
    </form>
  );
}

export default MergeForm;
