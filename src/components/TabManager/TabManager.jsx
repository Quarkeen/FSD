import React, { useState, useCallback } from 'react';

function TabManager({ tabs, activeTab, onTabChange, onTabClose, onTabAdd }) {
  const [isAddingTab, setIsAddingTab] = useState(false);

  const handleAddTab = () => {
    onTabAdd();
    setIsAddingTab(false);
  };

  return (
    <div className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-20">
      <div className="flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <div className="flex items-center flex-1 min-w-0">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group relative flex items-center gap-2 px-4 py-3 cursor-pointer border-r border-gray-200 min-w-[200px] max-w-[250px] transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-50 border-b-2 border-indigo-600 text-indigo-700'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              {/* Tab Icon */}
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>

              {/* Tab Name */}
              <span className="truncate flex-1 text-sm font-medium">
                {tab.fileName || `Tab ${tab.id}`}
              </span>

              {/* Modified Indicator */}
              {tab.modified && (
                <div className="w-2 h-2 bg-orange-500 rounded-full shrink-0" title="Unsaved changes" />
              )}

              {/* Close Button */}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  title="Close tab"
                >
                  <svg
                    className="w-3 h-3"
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
              )}
            </div>
          ))}
        </div>

        {/* Add Tab Button */}
        <button
          onClick={handleAddTab}
          className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors border-l border-gray-200 shrink-0"
          title="Add new tab"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="text-sm font-medium hidden sm:inline">New Tab</span>
        </button>
      </div>
    </div>
  );
}

export default TabManager;
