import React from 'react';

function Statistics({ numericHeaders, isProcessing, showAggregations, aggregationResults, onProcess }) {
  const handleComputeAggregations = () => {
    if (numericHeaders.length === 0) {
      alert('No numeric columns found for aggregation.');
      return;
    }
    onProcess('COMPUTE_AGGREGATIONS', { columns: numericHeaders });
  };

  return (
    <div className="pb-6 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-600 mb-2">Statistics & Aggregations</h3>
      <button
        type="button"
        onClick={handleComputeAggregations}
        disabled={isProcessing}
        className="bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400"
      >
        Compute Statistics
      </button>
      {showAggregations && aggregationResults && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">Column</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Count</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Sum</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Mean</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Min</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Max</th>
                <th className="border border-gray-300 px-3 py-2 text-right">Median</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(aggregationResults).map(([col, stats]) => (
                <tr key={col}>
                  <td className="border border-gray-300 px-3 py-2 font-medium">{col}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{stats.count}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{stats.sum.toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{stats.mean.toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{stats.min.toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{stats.max.toFixed(2)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{stats.median.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Statistics;
