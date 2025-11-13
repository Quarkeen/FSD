import React, { useState, useEffect } from 'react';

function AddRowForm({ allHeaders, onProcess, setActiveTool }) {
  const [addRowState, setAddRowState] = useState({});

  useEffect(() => {
    const initialState = allHeaders.reduce((acc, h) => {
      acc[h.name] = '';
      return acc;
    }, {});
    setAddRowState(initialState);
  }, [allHeaders]);

  const handleAddRowChange = (header, value) => {
    setAddRowState(prev => ({
      ...prev,
      [header]: value
    }));
  };

  const handleAddRowSubmit = (e) => {
    e.preventDefault();
    onProcess('ADD_ROW', { rowData: addRowState });
    setActiveTool(null);
  };

  return (
    <form onSubmit={handleAddRowSubmit} className="mt-4 p-4 bg-gray-50 rounded border max-h-96 overflow-y-auto">
      <h4 className="text-md font-semibold mb-3 sticky top-0 bg-gray-50 py-2">Add New Row</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
        {allHeaders.map(h => (
          <div key={h.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{h.name}</label>
            <input
              type={h.type === 'number' ? 'number' : 'text'}
              value={addRowState[h.name] || ''}
              onChange={(e) => handleAddRowChange(h.name, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        ))}
      </div>
      <button type="submit" className="mt-4 bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700">
        Add Row
      </button>
    </form>
  );
}

export default AddRowForm;
