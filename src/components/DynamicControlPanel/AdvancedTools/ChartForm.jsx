import React, { useState } from 'react';

function ChartForm({ allHeaders, numericHeaders, onProcess }) {
  const [chartState, setChartState] = useState({
    labelColumn: allHeaders[0]?.name || '',
    dataColumns: [],
    chartType: 'bar',
  });

  const handleChartSubmit = (e) => {
    e.preventDefault();
    if (!chartState.labelColumn || chartState.dataColumns.length === 0) {
      alert('Please select a label column and at least one data column.');
      return;
    }
    onProcess('GET_CHART_DATA', chartState);
  };

  const handleChartDataColChange = (e) => {
    const options = e.target.options;
    const value = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    setChartState({ ...chartState, dataColumns: value });
  };

  return (
    <form onSubmit={handleChartSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
      <h4 className="text-md font-semibold mb-2">Generate Chart</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label (X-Axis)</label>
          <select
            value={chartState.labelColumn}
            onChange={(e) => setChartState({ ...chartState, labelColumn: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            {allHeaders.map(h => (
              <option key={h.name} value={h.name}>{h.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data (Y-Axis) - Hold Ctrl/Cmd for multiple
          </label>
          <select
            multiple
            value={chartState.dataColumns}
            onChange={handleChartDataColChange}
            className="w-full p-2 border border-gray-300 rounded-md text-sm h-24"
          >
            {numericHeaders.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
          <select
            value={chartState.chartType}
            onChange={(e) => setChartState({ ...chartState, chartType: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="pie">Pie</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Generate Chart Data
      </button>
    </form>
  );
}

export default ChartForm;
