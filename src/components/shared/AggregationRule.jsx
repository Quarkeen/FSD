import React from 'react';

function AggregationRule({ headers, rule, onChange, onRemove }) {
  const numericHeaders = headers.filter(h => h.type === 'number').map(h => h.name);

  return (
    <div className="flex gap-2 mb-2">
      <select
        value={rule.column}
        onChange={(e) => onChange('column', e.target.value)}
        className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
      >
        <option value="">Select column...</option>
        {numericHeaders.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <select
        value={rule.fn}
        onChange={(e) => onChange('fn', e.target.value)}
        className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
      >
        <option value="sum">Sum</option>
        <option value="mean">Mean</option>
        <option value="count">Count</option>
        <option value="min">Min</option>
        <option value="max">Max</option>
        <option value="median">Median</option>
      </select>
      <button
        type="button"
        onClick={onRemove}
        className="text-red-500 hover:text-red-700 text-xl font-bold px-2"
      >
        &times;
      </button>
    </div>
  );
}

export default AggregationRule;
