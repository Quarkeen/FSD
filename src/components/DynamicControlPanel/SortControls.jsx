import React from 'react';

function SortControls({ sortColumn, setSortColumn, sortDirection, setSortDirection, allHeaders, isProcessing, onProcess }) {
  const handleSortSubmit = (event) => {
    event.preventDefault();
    onProcess('SORT_DATA', { key: sortColumn, direction: sortDirection });
  };

  return (
    <form onSubmit={handleSortSubmit} className="pb-6 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-600 mb-2">Sort Data</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="sort-column" className="block text-sm font-medium text-gray-700 mb-1">
            Sort by Column
          </label>
          <select
            id="sort-column"
            value={sortColumn}
            onChange={(e) => setSortColumn(e.target.value)}
            disabled={isProcessing}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
          >
            {allHeaders.map((header) => (
              <option key={header.name} value={header.name}>
                {header.name} ({header.type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort-direction" className="block text-sm font-medium text-gray-700 mb-1">
            Direction
          </label>
          <select
            id="sort-direction"
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value)}
            disabled={isProcessing}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="asc">Ascending (A-Z, 1-9)</option>
            <option value="desc">Descending (Z-A, 9-1)</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full md:mt-6 bg-blue-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isProcessing ? 'Sorting...' : 'Run Sort'}
        </button>
      </div>
    </form>
  );
}

export default SortControls;
