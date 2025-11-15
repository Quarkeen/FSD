import React from 'react';

function Sidebar({ isOpen, toggleSidebar, activeTool, setActiveTool, hasData }) {
  const tools = [
    { id: 'sort', name: 'Sort Data', icon: '⇅', component: 'SortControls' },
    { id: 'filter', name: 'Filter Data', icon: '🔍', component: 'FilterControls' },
    { id: 'columns', name: 'Manage Columns', icon: '▦', component: 'ColumnManagement' },
    { id: 'cleaning', name: 'Data Cleaning', icon: '🧹', component: 'DataCleaning' },
    { id: 'statistics', name: 'Statistics', icon: '📊', component: 'Statistics' },
    { id: 'advanced', name: 'Advanced Tools', icon: '⚙️', component: 'AdvancedTools' },
    { id: 'grouping', name: 'Grouping', icon: '📁', component: 'GroupingForm' },
    { id: 'pivot', name: 'Pivot Table', icon: '📋', component: 'PivotTableForm' },
    { id: 'merge', name: 'Merge Files', icon: '🔗', component: 'MergeForm' },
    { id: 'formula', name: 'Formula Column', icon: '🔢', component: 'FormulaColumnForm' },
    { id: 'formatting', name: 'Formatting', icon: '🎨', component: 'ConditionalFormattingForm' },
    { id: 'download', name: 'Download', icon: '⬇️', component: 'DownloadSection' }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-lg transition-transform duration-300 z-40 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Tools</h2>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {!hasData && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              Upload a CSV file to access tools
            </div>
          )}

          <nav className="space-y-1">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  if (hasData) {
                    setActiveTool(tool.id);
                    toggleSidebar();
                  }
                }}
                disabled={!hasData}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTool === tool.id
                    ? 'bg-blue-500 text-white'
                    : hasData
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="text-xl">{tool.icon}</span>
                <span className="font-medium">{tool.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
