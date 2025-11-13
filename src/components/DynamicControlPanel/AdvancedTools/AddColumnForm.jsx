import React, { useState } from 'react';

function AddColumnForm({ onProcess, setActiveTool }) {
  const [addColumnState, setAddColumnState] = useState({ name: '', defaultValue: '' });

  const handleAddColumnSubmit = (e) => {
    e.preventDefault();
    if (!addColumnState.name) {
      alert('Please provide a new column name.');
      return;
    }
    onProcess('ADD_COLUMN', {
      columnName: addColumnState.name,
      defaultValue: addColumnState.defaultValue || null
    });
    setAddColumnState({ name: '', defaultValue: '' });
    setActiveTool(null);
  };

  return (
    <form onSubmit={handleAddColumnSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
      <h4 className="text-md font-semibold mb-2">Add Column</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="New Column Name"
          value={addColumnState.name}
          onChange={(e) => setAddColumnState({ ...addColumnState, name: e.target.value })}
          className="p-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          type="text"
          placeholder="Default Value (optional)"
          value={addColumnState.defaultValue}
          onChange={(e) => setAddColumnState({ ...addColumnState, defaultValue: e.target.value })}
          className="p-2 border border-gray-300 rounded-md text-sm"
        />
      </div>
      <button type="submit" className="mt-3 bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700">
        Add Column
      </button>
    </form>
  );
}

export default AddColumnForm;
