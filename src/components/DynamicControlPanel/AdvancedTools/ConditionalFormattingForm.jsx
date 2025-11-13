import React, { useState } from 'react';

function ConditionalFormattingForm({ allHeaders, onProcess }) {
  const [condFormat, setCondFormat] = useState({
    column: allHeaders[0]?.name || '',
    operator: '>',
    value: '',
    styleClass: 'highlight-red',
  });

  const handleCondFormatSubmit = (e) => {
    e.preventDefault();
    onProcess('ADD_CONDITIONAL_FORMAT', { rule: condFormat });
  };

  const handleClearCondFormats = () => {
    onProcess('CLEAR_CONDITIONAL_FORMATS', {});
  };

  return (
    <form onSubmit={handleCondFormatSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
      <h4 className="text-md font-semibold mb-2">Add Conditional Formatting</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          value={condFormat.column}
          onChange={(e) => setCondFormat({ ...condFormat, column: e.target.value })}
          className="p-2 border border-gray-300 rounded-md text-sm"
        >
          {allHeaders.map(h => (
            <option key={h.name} value={h.name}>{h.name}</option>
          ))}
        </select>
        <select
          value={condFormat.operator}
          onChange={(e) => setCondFormat({ ...condFormat, operator: e.target.value })}
          className="p-2 border border-gray-300 rounded-md text-sm"
        >
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value="==">==</option>
          <option value="!=">!=</option>
          <option value="contains">Contains</option>
          <option value="not_contains">Not Contains</option>
          <option value="is_empty">Is Empty</option>
          <option value="is_not_empty">Is Not Empty</option>
        </select>
        <input
          type="text"
          placeholder="Value"
          value={condFormat.value}
          onChange={(e) => setCondFormat({ ...condFormat, value: e.target.value })}
          className="p-2 border border-gray-300 rounded-md text-sm"
        />
        <select
          value={condFormat.styleClass}
          onChange={(e) => setCondFormat({ ...condFormat, styleClass: e.target.value })}
          className="p-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="highlight-red">Highlight Red</option>
          <option value="highlight-green">Highlight Green</option>
          <option value="highlight-yellow">Highlight Yellow</option>
        </select>
      </div>
      <div className="mt-3 space-x-2">
        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700">
          Add Rule
        </button>
        <button
          type="button"
          onClick={handleClearCondFormats}
          className="bg-gray-300 text-gray-700 py-2 px-4 rounded text-sm hover:bg-gray-400"
        >
          Clear All Rules
        </button>
      </div>
    </form>
  );
}

export default ConditionalFormattingForm;
