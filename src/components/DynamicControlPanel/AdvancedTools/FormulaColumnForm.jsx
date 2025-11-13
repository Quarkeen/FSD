import React, { useState } from 'react';

function FormulaColumnForm({ onProcess, setActiveTool }) {
  const [formulaState, setFormulaState] = useState({
    newColumnName: '',
    formulaString: '[col1] + [col2]'
  });

  const handleFormulaSubmit = (e) => {
    e.preventDefault();
    if (!formulaState.newColumnName || !formulaState.formulaString) {
      alert('Please provide a new column name and a formula.');
      return;
    }
    onProcess('ADD_FORMULA_COLUMN', formulaState);
    setActiveTool(null);
  };

  return (
    <form onSubmit={handleFormulaSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
      <h4 className="text-md font-semibold mb-2">Add Formula Column</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="New Column Name"
          value={formulaState.newColumnName}
          onChange={(e) => setFormulaState({ ...formulaState, newColumnName: e.target.value })}
          className="p-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          type="text"
          placeholder="e.g., [Price] * [Quantity]"
          value={formulaState.formulaString}
          onChange={(e) => setFormulaState({ ...formulaState, formulaString: e.target.value })}
          className="p-2 border border-gray-300 rounded-md text-sm"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Use [Column Name] to reference values. Math functions (e.g., `abs()`, `round()`) are available.
      </p>
      <button type="submit" className="mt-3 bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700">
        Apply Formula
      </button>
    </form>
  );
}

export default FormulaColumnForm;
