import React, { useState } from 'react';

function PivotTableForm({ allHeaders, numericHeaders, onProcess }) {
  const [pivotState, setPivotState] = useState({
    rowKey: allHeaders[0]?.name || '',
    colKey: allHeaders[1]?.name || '',
    aggCol: '',
    aggFn: 'sum',
  });

  const handlePivotSubmit = (e) => {
    e.preventDefault();
    if (!pivotState.rowKey || !pivotState.colKey || !pivotState.aggCol || !pivotState.aggFn) {
      alert('Please fill out all pivot table fields.');
      return;
    }
    onProcess('GENERATE_PIVOT_TABLE', pivotState);
  };

  return (
    <form onSubmit={handlePivotSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
      <h4 className="text-md font-semibold mb-2">Generate Pivot Table</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rows</label>
          <select
            value={pivotState.rowKey}
            onChange={(e) => setPivotState({ ...pivotState, rowKey: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            {allHeaders.map(h => (
              <option key={h.name} value={h.name}>{h.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
          <select
            value={pivotState.colKey}
            onChange={(e) => setPivotState({ ...pivotState, colKey: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            {allHeaders.map(h => (
              <option key={h.name} value={h.name}>{h.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Value Column (Numeric)</label>
          <select
            value={pivotState.aggCol}
            onChange={(e) => setPivotState({ ...pivotState, aggCol: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Select value...</option>
            {numericHeaders.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Function</label>
          <select
            value={pivotState.aggFn}
            onChange={(e) => setPivotState({ ...pivotState, aggFn: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="sum">Sum</option>
            <option value="mean">Mean</option>
            <option value="count">Count</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Run Pivot
      </button>
    </form>
  );
}

export default PivotTableForm;
