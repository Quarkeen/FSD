import React from 'react';

function FilterControls({ filterKeyword, setFilterKeyword, isProcessing, onProcess }) {
  const handleFilterSubmit = (event) => {
    event.preventDefault();
    onProcess('FILTER_DATA', { keyword: filterKeyword });
  };

  return (
    <form onSubmit={handleFilterSubmit} className="pb-6 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-600 mb-2">Global Filter / Search</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="filter-keyword" className="block text-sm font-medium text-gray-700 mb-1">
            Search Keyword
          </label>
          <input
            type="search"
            id="filter-keyword"
            placeholder="Search all columns..."
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
            disabled={isProcessing}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full md:mt-6 bg-blue-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isProcessing ? 'Filtering...' : 'Run Filter'}
        </button>
      </div>
    </form>
  );
}

export default FilterControls;
