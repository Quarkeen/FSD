import React, { useState, useEffect } from 'react';

// Helper component for managing aggregation rules
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
        {numericHeaders.map(h => <option key={h} value={h}>{h}</option>)}
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
      <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700">&times;</button>
    </div>
  );
}

function DynamicControlPanel({ summary, isProcessing, onProcess, hiddenColumns = [], worker }) {
  // --- Existing State ---
  const [sortColumn, setSortColumn] = useState(summary.headers[0]);
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [showAggregations, setShowAggregations] = useState(false);
  const [aggregationResults, setAggregationResults] = useState(null);
  const [renameColumn, setRenameColumn] = useState({ old: '', new: '' });
  const [showRenameDialog, setShowRenameDialog] = useState(false);

  // --- NEW State for Advanced Tools ---
  const [activeTool, setActiveTool] = useState(null); // 'formula', 'format', 'group', 'pivot', 'chart', 'merge', 'add_row', 'add_column'
  
  // Formula
  const [formulaState, setFormulaState] = useState({ newColumnName: '', formulaString: '[col1] + [col2]' });

  // Conditional Formatting
  const [condFormat, setCondFormat] = useState({
    column: summary.headers[0],
    operator: '>',
    value: '',
    styleClass: 'highlight-red',
  });

  // Grouping
  const [groupState, setGroupState] = useState({
    groupKey: summary.headers[0],
    rules: [{ id: 1, column: '', fn: 'sum' }],
  });
  const [groupedData, setGroupedData] = useState(null);

  // Pivot
  const [pivotState, setPivotState] = useState({
    rowKey: summary.headers[0],
    colKey: summary.headers[1],
    aggCol: '',
    aggFn: 'sum',
  });
  const [pivotData, setPivotData] = useState(null);

  // Chart
  const [chartState, setChartState] = useState({
    labelColumn: summary.headers[0],
    dataColumns: [],
    chartType: 'bar',
  });
  const [chartData, setChartData] = useState(null);

  // Merge
  const [mergeState, setMergeState] = useState({
    file: null,
    file2Headers: [],
    key1: summary.headers[0],
    key2: '',
    joinType: 'left',
  });

  // --- NEW State for Add Row/Column ---
  const [addColumnState, setAddColumnState] = useState({ name: '', defaultValue: '' });
  const [addRowState, setAddRowState] = useState({});
  
  const allHeaders = summary.headers.map(h => ({ name: h, type: summary.dataTypes[h] }));
  const numericHeaders = allHeaders.filter(h => h.type === 'number').map(h => h.name);

  // --- Effect to listen to worker responses ---
  useEffect(() => {
    if (!worker) return;

    const handleWorkerMessage = (event) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'SUCCESS_AGGREGATIONS':
          setAggregationResults(payload.aggregations);
          setShowAggregations(true);
          break;
        case 'SUCCESS_GROUPING':
          setGroupedData(payload.groupedData);
          setPivotData(null); // Clear other results
          setChartData(null);
          alert(payload.message);
          break;
        case 'SUCCESS_PIVOT':
          setPivotData(payload.pivotData);
          setGroupedData(null); // Clear other results
          setChartData(null);
          alert(payload.message);
          break;
        case 'SUCCESS_CHART_DATA':
          setChartData(payload.chartData);
          setGroupedData(null); // Clear other results
          setPivotData(null);
          // Don't alert, just show the data
          break;
        case 'SUCCESS_PARSE_FILE_2':
          setMergeState(s => ({ ...s, file2Headers: payload.headers, key2: payload.headers[0] }));
          alert(payload.message);
          break;
      }
    };

    worker.addEventListener('message', handleWorkerMessage);
    return () => worker.removeEventListener('message', handleWorkerMessage);
  }, [worker]);

  // --- NEW Effect to initialize Add Row form ---
  useEffect(() => {
    if (activeTool === 'add_row') {
      // Initialize addRowState with empty strings for each header
      const initialState = summary.headers.reduce((acc, h) => {
        acc[h] = '';
        return acc;
      }, {});
      setAddRowState(initialState);
    }
  }, [activeTool, summary.headers]);


  // --- Event Handlers ---

  const handleSortSubmit = (event) => {
    event.preventDefault();
    onProcess('SORT_DATA', { key: sortColumn, direction: sortDirection });
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    onProcess('FILTER_DATA', { keyword: filterKeyword });
  };

  const handleDownloadClick = () => {
    setDownloading(true);
    onProcess('DOWNLOAD_FILE');
    setTimeout(() => setDownloading(false), 2000);
  };

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

  const handleRemoveDuplicates = (columns = null) => {
    if (window.confirm('This will permanently remove duplicate rows. Continue?')) {
      onProcess('REMOVE_DUPLICATES', { columns });
    }
  };

  const handleMissingData = (strategy, fillValue = null) => {
    if (window.confirm(`Apply "${strategy}" strategy to handle missing data?`)) {
      onProcess('HANDLE_MISSING', { strategy, columns: null, fillValue });
    }
  };

  const handleComputeAggregations = () => {
    if (numericHeaders.length === 0) {
      alert('No numeric columns found for aggregation.');
      return;
    }
    // Response is handled by the useEffect listener
    onProcess('COMPUTE_AGGREGATIONS', { columns: numericHeaders });
  };

  // --- NEW Event Handlers ---

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
  
  const handleAddRowChange = (header, value) => {
    setAddRowState(prev => ({
      ...prev,
      [header]: value
    }));
  };
  
  const handleAddRowSubmit = (e) => {
    e.preventDefault();
    // In a real app, you might want to parse numbers/booleans here
    // For now, the worker's dynamicTyping on load is what sets types.
    // The worker's addRow function handles this logic.
    onProcess('ADD_ROW', { rowData: addRowState });
    setActiveTool(null);
  };

  const handleFormulaSubmit = (e) => {
    e.preventDefault();
    if (!formulaState.newColumnName || !formulaState.formulaString) {
      alert('Please provide a new column name and a formula.');
      return;
    }
    onProcess('ADD_FORMULA_COLUMN', formulaState);
    setActiveTool(null);
  };

  const handleCondFormatSubmit = (e) => {
    e.preventDefault();
    onProcess('ADD_CONDITIONAL_FORMAT', { rule: condFormat });
  };
  
  const handleClearCondFormats = () => {
    onProcess('CLEAR_CONDITIONAL_FORMATS', {});
  };

  const handleGroupSubmit = (e) => {
    e.preventDefault();
    const aggregations = groupState.rules.reduce((acc, rule) => {
      if (rule.column && rule.fn) {
        acc[rule.column] = rule.fn;
      }
      return acc;
    }, {});
    
    if (Object.keys(aggregations).length === 0) {
      alert('Please add at least one valid aggregation rule.');
      return;
    }
    
    onProcess('GROUP_AND_AGGREGATE', {
      groupKey: groupState.groupKey,
      aggregations: aggregations,
    });
  };
  
  const handleUpdateGroupRule = (index, field, value) => {
    const newRules = [...groupState.rules];
    newRules[index][field] = value;
    setGroupState({ ...groupState, rules: newRules });
  };

  const handleAddGroupRule = () => {
    setGroupState({
      ...groupState,
      rules: [...groupState.rules, { id: Date.now(), column: '', fn: 'sum' }],
    });
  };

  const handleRemoveGroupRule = (index) => {
    const newRules = groupState.rules.filter((_, i) => i !== index);
    setGroupState({ ...groupState, rules: newRules });
  };

  const handlePivotSubmit = (e) => {
    e.preventDefault();
    if (!pivotState.rowKey || !pivotState.colKey || !pivotState.aggCol || !pivotState.aggFn) {
      alert('Please fill out all pivot table fields.');
      return;
    }
    onProcess('GENERATE_PIVOT_TABLE', pivotState);
  };

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

  const handleMergeFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMergeState({ ...mergeState, file });
      onProcess('PARSE_FILE_2_FOR_MERGE', { file });
    }
  };

  const handleMergeSubmit = (e) => {
    e.preventDefault();
    if (!mergeState.key1 || !mergeState.key2) {
      alert('Please select join keys for both files.');
      return;
    }
    onProcess('PERFORM_MERGE', {
      key1: mergeState.key1,
      key2: mergeState.key2,
      joinType: mergeState.joinType,
    });
    setActiveTool(null);
  };

  const toggleTool = (tool) => {
    setActiveTool(activeTool === tool ? null : tool);
  };

  // --- Render ---
  return (
    <section className="dynamic-control-panel bg-white shadow-md rounded-lg p-6 space-y-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">2. Process Your Data</h2>

      {/* --- Sort Controls (existing) --- */}
      <form onSubmit={handleSortSubmit} className="pb-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-600 mb-2">Sort Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="sort-column" className="block text-sm font-medium text-gray-700 mb-1">Sort by Column</label>
            <select
              id="sort-column"
              value={sortColumn}
              onChange={(e) => setSortColumn(e.target.value)}
              disabled={isProcessing}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              {allHeaders.map((header) => (
                <option key={header.name} value={header.name}>
                  {header.name} ({header.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort-direction" className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
            <select
              id="sort-direction"
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value)}
              disabled={isProcessing}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="asc">Ascending (A-Z, 1-9)</option>
              <option value="desc">Descending (Z-A, 9-1)</option>
            </select>
          </div>
          <button type="submit" disabled={isProcessing} className="w-full md:mt-6 bg-blue-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400">
            {isProcessing ? 'Sorting...' : 'Run Sort'}
          </button>
        </div>
      </form>

      {/* --- Filter/Search (existing) --- */}
      <form onSubmit={handleFilterSubmit} className="pb-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-600 mb-2">Global Filter / Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="filter-keyword" className="block text-sm font-medium text-gray-700 mb-1">Search Keyword</label>
            <input type="search" id="filter-keyword" placeholder="Search all columns..." value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} disabled={isProcessing} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <button type="submit" disabled={isProcessing} className="w-full md:mt-6 bg-blue-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400">
            {isProcessing ? 'Filtering...' : 'Run Filter'}
          </button>
        </div>
      </form>

      {/* --- Column Management (existing) --- */}
      <div className="pb-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-600">Column Management</h3>
          <button type="button" onClick={() => setShowColumnManager(!showColumnManager)} className="text-sm text-blue-600 hover:text-blue-800">
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
                    <input type="checkbox" checked={!hiddenColumns.includes(header.name)} onChange={() => handleToggleColumn(header.name)} className="rounded" />
                    <span className={hiddenColumns.includes(header.name) ? 'text-gray-400' : ''}>{header.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Rename Column</h4>
              {!showRenameDialog ? (
                <button type="button" onClick={() => setShowRenameDialog(true)} className="text-sm bg-gray-200 text-gray-700 py-1 px-3 rounded hover:bg-gray-300">
                  Rename Column
                </button>
              ) : (
                <form onSubmit={handleRenameSubmit} className="flex gap-2">
                  <select value={renameColumn.old} onChange={(e) => setRenameColumn({ ...renameColumn, old: e.target.value })} className="flex-1 p-2 border border-gray-300 rounded-md text-sm">
                    <option value="">Select column...</option>
                    {allHeaders.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
                  </select>
                  <input type="text" placeholder="New name" value={renameColumn.new} onChange={(e) => setRenameColumn({ ...renameColumn, new: e.target.value })} className="flex-1 p-2 border border-gray-300 rounded-md text-sm" />
                  <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Rename</button>
                  <button type="button" onClick={() => { setShowRenameDialog(false); setRenameColumn({ old: '', new: '' }); }} className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400">Cancel</button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- Data Cleaning (existing) --- */}
      <div className="pb-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-600 mb-2">Data Cleaning</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button type="button" onClick={() => handleRemoveDuplicates()} disabled={isProcessing} className="bg-orange-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-orange-700 disabled:bg-gray-400 text-sm">
            Remove Duplicates
          </button>
          <button type="button" onClick={() => handleMissingData('drop')} disabled={isProcessing} className="bg-red-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-red-700 disabled:bg-gray-400 text-sm">
            Drop Missing Rows
          </button>
          <button type="button" onClick={() => handleMissingData('fill', 0)} disabled={isProcessing} className="bg-purple-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-purple-700 disabled:bg-gray-400 text-sm">
            Fill Missing (0)
          </button>
        </div>
      </div>
      
      {/* --- Advanced Tools (UPDATED) --- */}
      <div className="pb-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-600 mb-4">Advanced Tools</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <button onClick={() => toggleTool('add_row')} className={`p-2 rounded ${activeTool === 'add_row' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>Add Row</button>
          <button onClick={() => toggleTool('add_column')} className={`p-2 rounded ${activeTool === 'add_column' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>Add Column</button>
          <button onClick={() => toggleTool('formula')} className={`p-2 rounded ${activeTool === 'formula' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>Formula Column</button>
          <button onClick={() => toggleTool('format')} className={`p-2 rounded ${activeTool === 'format' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>Cond. Formatting</button>
          <button onClick={() => toggleTool('group')} className={`p-2 rounded ${activeTool === 'group' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>Group & Aggregate</button>
          <button onClick={() => toggleTool('pivot')} className={`p-2 rounded ${activeTool === 'pivot' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>Pivot Table</button>
          <button onClick={() => toggleTool('chart')} className={`p-2 rounded ${activeTool === 'chart' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>Generate Chart</button>
          <button onClick={() => toggleTool('merge')} className={`p-2 rounded ${activeTool === 'merge' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>Merge Files</button>
        </div>
        
        {/* --- Add Row UI (NEW) --- */}
        {activeTool === 'add_row' && (
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
            <button type="submit" className="mt-4 bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700">Add Row</button>
          </form>
        )}
        
        {/* --- Add Column UI (NEW) --- */}
        {activeTool === 'add_column' && (
          <form onSubmit={handleAddColumnSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
            <h4 className="text-md font-semibold mb-2">Add Column</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="New Column Name"
                value={addColumnState.name}
                onChange={(e) => setAddColumnState({...addColumnState, name: e.target.value})}
                className="p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Default Value (optional)"
                value={addColumnState.defaultValue}
                onChange={(e) => setAddColumnState({...addColumnState, defaultValue: e.target.value})}
                className="p-2 border rounded"
              />
            </div>
            <button type="submit" className="mt-3 bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700">Add Column</button>
          </form>
        )}

        {/* --- Formula Column UI --- */}
        {activeTool === 'formula' && (
          <form onSubmit={handleFormulaSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
            <h4 className="text-md font-semibold mb-2">Add Formula Column</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="New Column Name" value={formulaState.newColumnName} onChange={(e) => setFormulaState({...formulaState, newColumnName: e.target.value})} className="p-2 border rounded" />
              <input type="text" placeholder="e.g., [Price] * [Quantity]" value={formulaState.formulaString} onChange={(e) => setFormulaState({...formulaState, formulaString: e.target.value})} className="p-2 border rounded" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Use [Column Name] to reference values. Math functions (e.g., `abs()`, `round()`) are available.</p>
            <button type="submit" className="mt-2 bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700">Apply Formula</button>
          </form>
        )}
        
        {/* --- Conditional Formatting UI --- */}
        {activeTool === 'format' && (
          <form onSubmit={handleCondFormatSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
            <h4 className="text-md font-semibold mb-2">Add Conditional Formatting</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select value={condFormat.column} onChange={e => setCondFormat({...condFormat, column: e.target.value})} className="p-2 border rounded">
                {allHeaders.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
              </select>
              <select value={condFormat.operator} onChange={e => setCondFormat({...condFormat, operator: e.target.value})} className="p-2 border rounded">
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value="==">==</option>
                <option value="!=">!=</option>
                <option value="contains">Contains</option>
                <option value="not_contains">Not Contains</option>
                <option value="is_empty">Is Empty</option>
                <option value="is_not_empty">Is Not Empty</option>
              </select>
              <input type="text" placeholder="Value" value={condFormat.value} onChange={e => setCondFormat({...condFormat, value: e.target.value})} className="p-2 border rounded" />
              <select value={condFormat.styleClass} onChange={e => setCondFormat({...condFormat, styleClass: e.target.value})} className="p-2 border rounded">
                <option value="highlight-red">Highlight Red</option>
                <option value="highlight-green">Highlight Green</option>
                <option value="highlight-yellow">Highlight Yellow</option>
              </select>
            </div>
            <div className="mt-2 space-x-2">
              <button type="submit" className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700">Add Rule</button>
              <button type="button" onClick={handleClearCondFormats} className="bg-gray-300 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-400">Clear All Rules</button>
            </div>
          </form>
        )}
        
        {/* --- Grouping UI --- */}
        {activeTool === 'group' && (
          <form onSubmit={handleGroupSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
            <h4 className="text-md font-semibold mb-2">Group and Aggregate</h4>
            <div className="mb-2">
              <label className="block text-sm font-medium">Group By</label>
              <select value={groupState.groupKey} onChange={e => setGroupState({...groupState, groupKey: e.target.value})} className="w-full p-2 border rounded">
                {allHeaders.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
              </select>
            </div>
            <label className="block text-sm font-medium">Aggregations</label>
            {groupState.rules.map((rule, index) => (
              <AggregationRule
                key={rule.id}
                headers={allHeaders}
                rule={rule}
                onChange={(field, value) => handleUpdateGroupRule(index, field, value)}
                onRemove={() => handleRemoveGroupRule(index)}
              />
            ))}
            <button type="button" onClick={handleAddGroupRule} className="text-sm text-blue-600 hover:text-blue-800">+ Add Aggregation</button>
            <button type="submit" className="mt-2 w-full bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700">Run Grouping</button>
          </form>
        )}
        
        {/* --- Pivot Table UI --- */}
        {activeTool === 'pivot' && (
          <form onSubmit={handlePivotSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
            <h4 className="text-md font-semibold mb-2">Generate Pivot Table</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Rows</label>
                <select value={pivotState.rowKey} onChange={e => setPivotState({...pivotState, rowKey: e.target.value})} className="w-full p-2 border rounded">
                  {allHeaders.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Columns</label>
                <select value={pivotState.colKey} onChange={e => setPivotState({...pivotState, colKey: e.target.value})} className="w-full p-2 border rounded">
                  {allHeaders.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Value Column (Numeric)</label>
                <select value={pivotState.aggCol} onChange={e => setPivotState({...pivotState, aggCol: e.target.value})} className="w-full p-2 border rounded">
                  <option value="">Select value...</option>
                  {numericHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Function</label>
                <select value={pivotState.aggFn} onChange={e => setPivotState({...pivotState, aggFn: e.target.value})} className="w-full p-2 border rounded">
                  <option value="sum">Sum</option>
                  <option value="mean">Mean</option>
                  <option value="count">Count</option>
                </select>
              </div>
            </div>
            <button type="submit" className="mt-3 w-full bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700">Run Pivot</button>
          </form>
        )}
        
        {/* --- Charting UI --- */}
        {activeTool === 'chart' && (
          <form onSubmit={handleChartSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
            <h4 className="text-md font-semibold mb-2">Generate Chart</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium">Label (X-Axis)</label>
                <select value={chartState.labelColumn} onChange={e => setChartState({...chartState, labelColumn: e.target.value})} className="w-full p-2 border rounded">
                  {allHeaders.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Data (Y-Axis)</label>
                <select multiple value={chartState.dataColumns} onChange={handleChartDataColChange} className="w-full p-2 border rounded h-24">
                  {numericHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Chart Type</label>
                <select value={chartState.chartType} onChange={e => setChartState({...chartState, chartType: e.target.value})} className="w-full p-2 border rounded">
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                  <option value="pie">Pie</option>
                </select>
              </div>
            </div>
            <button type="submit" className="mt-3 w-full bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700">Generate Chart Data</button>
          </form>
        )}
        
        {/* --- Merge UI --- */}
        {activeTool === 'merge' && (
          <form onSubmit={handleMergeSubmit} className="mt-4 p-4 bg-gray-50 rounded border">
            <h4 className="text-md font-semibold mb-2">Merge (Join) Files</h4>
            <div className="mb-2">
              <label className="block text-sm font-medium">Upload File 2 (to join)</label>
              <input type="file" accept=".csv" onChange={handleMergeFileChange} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">File 1 Key (Current)</label>
                <select value={mergeState.key1} onChange={e => setMergeState({...mergeState, key1: e.target.value})} className="w-full p-2 border rounded">
                  {allHeaders.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">File 2 Key</label>
                <select value={mergeState.key2} onChange={e => setMergeState({...mergeState, key2: e.target.value})} disabled={mergeState.file2Headers.length === 0} className="w-full p-2 border rounded disabled:bg-gray-100">
                  <option value="">{mergeState.file2Headers.length ? 'Select key...' : 'Upload File 2...'}</option>
                  {mergeState.file2Headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-medium">Join Type</label>
              <select value={mergeState.joinType} onChange={e => setMergeState({...mergeState, joinType: e.target.value})} className="w-full p-2 border rounded">
                <option value="left">Left Join (All from File 1, matching from File 2)</option>
                <option value="inner">Inner Join (Only matching rows)</option>
              </select>
            </div>
            <button type="submit" disabled={!mergeState.file} className="mt-3 w-full bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 disabled:bg-gray-400">Perform Merge</button>
          </form>
        )}
      </div>

      {/* --- Statistics (existing) --- */}
      <div className="pb-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-600 mb-2">Statistics & Aggregations</h3>
        <button type="button" onClick={handleComputeAggregations} disabled={isProcessing} className="bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
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
      
      {/* --- Data Display for Grouping/Pivot/Chart --- */}
      {/* (These are just placeholders; you'd replace with actual tables/charts) */}
      {groupedData && (
        <div className="pb-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-600 mb-2">Grouping Results</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">{JSON.stringify(groupedData, null, 2)}</pre>
        </div>
      )}
      {pivotData && (
        <div className="pb-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-600 mb-2">Pivot Table Results</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">{JSON.stringify(pivotData, null, 2)}</pre>
        </div>
      )}
      {chartData && (
        <div className="pb-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-600 mb-2">Chart Data</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-xs">{JSON.stringify(chartData, null, 2)}</pre>
        </div>
      )}

      {/* --- Download (existing) --- */}
      <div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Download Data</h3>
        <p className="text-sm text-gray-500 mb-2">Download the currently filtered and sorted data as a new .csv file.</p>
        <button type="button" onClick={handleDownloadClick} disabled={isProcessing || downloading} className="w-full md:w-auto bg-green-600 text-white py-2 px-6 rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400">
          {downloading || isProcessing ? 'Preparing...' : 'Download Processed CSV'}
        </button>
      </div>
    </section>
  );
}

export default DynamicControlPanel;