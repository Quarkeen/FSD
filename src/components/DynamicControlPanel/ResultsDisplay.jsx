import React from 'react';

function ResultsDisplay({ groupedData, pivotData, chartData }) {
  return (
    <>
      {groupedData && (
        <div className="pb-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-600 mb-2">Grouping Results</h3>
          <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-xs max-h-96">
            {JSON.stringify(groupedData, null, 2)}
          </pre>
        </div>
      )}
      {pivotData && (
        <div className="pb-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-600 mb-2">Pivot Table Results</h3>
          <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-xs max-h-96">
            {JSON.stringify(pivotData, null, 2)}
          </pre>
        </div>
      )}
      {chartData && (
        <div className="pb-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-600 mb-2">Chart Data</h3>
          <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-xs max-h-96">
            {JSON.stringify(chartData, null, 2)}
          </pre>
        </div>
      )}
    </>
  );
}

export default ResultsDisplay;
