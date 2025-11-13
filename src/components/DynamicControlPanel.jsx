import React, { useState } from 'react';

function DynamicControlPanel({ summary, isProcessing, onProcess }) {
  const [sortColumn, setSortColumn] = useState(summary.headers[0]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [downloading, setDownloading] = useState(false); // 🆕 new

  const handleSortSubmit = (event) => {
    event.preventDefault();
    onProcess('SORT_DATA', { key: sortColumn, direction: sortDirection });
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    onProcess('FILTER_DATA', { keyword: filterKeyword });
  };

  const handleDownloadClick = () => {
    // 🧠 Set temporary state to prevent re-clicks
    setDownloading(true);
    onProcess('DOWNLOAD_FILE');
    
    // Reset button after small delay (worker will handle actual completion)
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <section className="dynamic-control-panel bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">2. Process Your Data</h2>

      {/* --- Sort Controls --- */}
      <form onSubmit={handleSortSubmit} className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-600 mb-2">Sort Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="sort-column" className="block text-sm font-medium text-gray-700 mb-1">Sort by Column</label>
            <select
              id="sort-column"
              value={sortColumn}
              onChange={(e) => setSortColumn(e.target.value)}
              disabled={isProcessing}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              {summary.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sort-direction" className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
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

      {/* --- Filter/Search --- */}
      <form onSubmit={handleFilterSubmit} className="mb-6 pb-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-600 mb-2">Global Filter / Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="filter-keyword" className="block text-sm font-medium text-gray-700 mb-1">Search Keyword</label>
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

      {/* --- Download --- */}
      <div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Download Data</h3>
        <p className="text-sm text-gray-500 mb-2">Download the currently filtered and sorted data as a new .csv file.</p>
        <button 
          type="button" 
          onClick={handleDownloadClick}
          disabled={isProcessing || downloading}
          className="w-full md:w-auto bg-green-600 text-white py-2 px-6 rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400"
        >
          {downloading || isProcessing ? 'Preparing...' : 'Download Processed CSV'}
        </button>
      </div>
    </section>
  );
}

export default DynamicControlPanel;
