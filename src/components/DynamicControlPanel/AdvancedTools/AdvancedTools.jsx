import React, { useState } from 'react';
import DataChat from '../../DataChat/DataChat';
import AddRowForm from './AddRowForm';
import AddColumnForm from './AddColumnForm';
import FormulaColumnForm from './FormulaColumnForm';
import ConditionalFormattingForm from './ConditionalFormattingForm';
import GroupingForm from './GroupingForm';
import PivotTableForm from './PivotTableForm';
import ChartForm from './ChartForm';
import MergeForm from './MergeForm';

function AdvancedTools({ 
  summary, 
  data, 
  allHeaders, 
  numericHeaders, 
  onProcess,
  worker  // ADD: Accept worker prop
}) {
  const [activeTool, setActiveTool] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const toggleTool = (tool) => {
    setActiveTool(activeTool === tool ? null : tool);
  };

  const handleToggleChat = () => {
    setShowChat((current) => !current);
  };

  return (
    <div className="pb-6 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-600 mb-4">Advanced Tools</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={handleToggleChat}
          className="p-2 rounded text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          {showChat ? '✕ Close AI Chat' : '🤖 Ask AI'}
        </button>
        <button
          onClick={() => toggleTool('add_row')}
          className={`p-2 rounded text-sm font-medium ${
            activeTool === 'add_row' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          Add Row
        </button>
        <button
          onClick={() => toggleTool('add_column')}
          className={`p-2 rounded text-sm font-medium ${
            activeTool === 'add_column' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          Add Column
        </button>
        <button
          onClick={() => toggleTool('formula')}
          className={`p-2 rounded text-sm font-medium ${
            activeTool === 'formula' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          Formula Column
        </button>
        <button
          onClick={() => toggleTool('format')}
          className={`p-2 rounded text-sm font-medium ${
            activeTool === 'format' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          Cond. Formatting
        </button>
        <button
          onClick={() => toggleTool('group')}
          className={`p-2 rounded text-sm font-medium ${
            activeTool === 'group' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          Group & Aggregate
        </button>
        <button
          onClick={() => toggleTool('pivot')}
          className={`p-2 rounded text-sm font-medium ${
            activeTool === 'pivot' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          Pivot Table
        </button>
        <button
          onClick={() => toggleTool('chart')}
          className={`p-2 rounded text-sm font-medium ${
            activeTool === 'chart' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          Generate Chart
        </button>
        <button
          onClick={() => toggleTool('merge')}
          className={`p-2 rounded text-sm font-medium ${
            activeTool === 'merge' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          Merge Files
        </button>
      </div>

      {showChat && (
        <DataChat 
          summary={summary} 
          data={data ? data.slice(0, 20) : []} 
          onClose={handleToggleChat} 
        />
      )}

      {activeTool === 'add_row' && (
        <AddRowForm 
          allHeaders={allHeaders} 
          onProcess={onProcess} 
          setActiveTool={setActiveTool} 
        />
      )}
      {activeTool === 'add_column' && (
        <AddColumnForm 
          onProcess={onProcess} 
          setActiveTool={setActiveTool} 
        />
      )}
      {activeTool === 'formula' && (
        <FormulaColumnForm 
          onProcess={onProcess} 
          setActiveTool={setActiveTool} 
        />
      )}
      {activeTool === 'format' && (
        <ConditionalFormattingForm 
          allHeaders={allHeaders} 
          onProcess={onProcess} 
        />
      )}
      {activeTool === 'group' && (
        <GroupingForm 
          allHeaders={allHeaders} 
          numericHeaders={numericHeaders} 
          onProcess={onProcess} 
        />
      )}
      {activeTool === 'pivot' && (
        <PivotTableForm 
          allHeaders={allHeaders} 
          numericHeaders={numericHeaders} 
          onProcess={onProcess} 
        />
      )}
      {activeTool === 'chart' && (
        <ChartForm 
          allHeaders={allHeaders} 
          numericHeaders={numericHeaders} 
          onProcess={onProcess} 
        />
      )}
      {activeTool === 'merge' && (
        <MergeForm 
          allHeaders={allHeaders} 
          onProcess={onProcess} 
          setActiveTool={setActiveTool}
          worker={worker}  // UPDATED: Pass worker prop to MergeForm
        />
      )}
    </div>
  );
}

export default AdvancedTools;
