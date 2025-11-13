import React from 'react';

function ColumnManagement({
  allHeaders,
  hiddenColumns,
  showColumnManager,
  setShowColumnManager,
  renameColumn,
  setRenameColumn,
  showRenameDialog,
  setShowRenameDialog,
  onProcess
}) {
  const handleToggleColumn = (column) => {
    onProcess('TOGGLE_COLUMN', { column });
  };

  const handleRenameSubmit = (event) => {
    event.preventDefault();
    if (renameColumn.old && renameColumn.new) {
      onProcess('RENAME_COLUMN', { oldName: renameColumn.old, newName: renameColumn.new });
      setRenameColumn({ old: '', new: '' });
      setShowRenameDialog(false);
    }
  };

  return (
    <div className="pb-6 border-b border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-gray-600">Column Management</h3>
        <button
          type="button"
          onClick={() => setShowColumnManager(!showColumnManager)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showColumnManager ? 'Hide' : 'Show'} Options
        </button>
      </div>
      {showColumnManager && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Show/Hide Columns</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {allHeaders.map((header) => (
                <label key={header.name} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!hiddenColumns.includes(header.name)}
                    onChange={() => handleToggleColumn(header.name)}
                    className="rounded"
                  />
                  <span className={hiddenColumns.includes(header.name) ? 'text-gray-400' : ''}>
                    {header.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Rename Column</h4>
            {!showRenameDialog ? (
              <button
                type="button"
                onClick={() => setShowRenameDialog(true)}
                className="text-sm bg-gray-200 text-gray-700 py-1 px-3 rounded hover:bg-gray-300"
              >
                Rename Column
              </button>
            ) : (
              <form onSubmit={handleRenameSubmit} className="flex gap-2">
                <select
                  value={renameColumn.old}
                  onChange={(e) => setRenameColumn({ ...renameColumn, old: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select column...</option>
                  {allHeaders.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="New name"
                  value={renameColumn.new}
                  onChange={(e) => setRenameColumn({ ...renameColumn, new: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                />
                <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRenameDialog(false);
                    setRenameColumn({ old: '', new: '' });
                  }}
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ColumnManagement;
