import React from 'react';

function DataCleaning({ isProcessing, onProcess }) {
  const handleRemoveDuplicates = () => {
    if (window.confirm('This will permanently remove duplicate rows. Continue?')) {
      onProcess('REMOVE_DUPLICATES', { columns: null });
    }
  };

  const handleMissingData = (strategy, fillValue = null) => {
    if (window.confirm(`Apply "${strategy}" strategy to handle missing data?`)) {
      onProcess('HANDLE_MISSING', { strategy, columns: null, fillValue });
    }
  };

  return (
    <div className="pb-6 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-600 mb-2">Data Cleaning</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={handleRemoveDuplicates}
          disabled={isProcessing}
          className="bg-orange-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-orange-700 disabled:bg-gray-400 text-sm"
        >
          Remove Duplicates
        </button>
        <button
          type="button"
          onClick={() => handleMissingData('drop')}
          disabled={isProcessing}
          className="bg-red-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-red-700 disabled:bg-gray-400 text-sm"
        >
          Drop Missing Rows
        </button>
        <button
          type="button"
          onClick={() => handleMissingData('fill', 0)}
          disabled={isProcessing}
          className="bg-purple-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-purple-700 disabled:bg-gray-400 text-sm"
        >
          Fill Missing (0)
        </button>
      </div>
    </div>
  );
}

export default DataCleaning;
