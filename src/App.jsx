import React, { useState, useCallback } from "react";
import TabManager from "./components/TabManager/TabManager";
import TabContent from "./components/TabManager/TabContent";
import Profile from "./components/Profile";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [currentView, setCurrentView] = useState('home');

  const [tabs, setTabs] = useState([
    { id: 1, fileName: null, modified: false }
  ]);
  const [activeTab, setActiveTab] = useState(1);
  const [nextTabId, setNextTabId] = useState(2);

  const hasLoadedFiles = tabs.some(tab => tab.fileName !== null);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleTabAdd = useCallback(() => {
    const newTab = {
      id: nextTabId,
      fileName: null,
      modified: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(nextTabId);
    setNextTabId(prev => prev + 1);
  }, [nextTabId]);

  const handleTabClose = useCallback((tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.modified) {
      if (!window.confirm(`Tab "${tab.fileName || `Tab ${tabId}`}" has unsaved changes. Close anyway?`)) {
        return;
      }
    }

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (newTabs.length === 0) {
        return [{ id: nextTabId, fileName: null, modified: false }];
      }
      return newTabs;
    });

    if (activeTab === tabId) {
      const remainingTabs = tabs.filter(t => t.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTab(remainingTabs[0].id);
      }
    }
  }, [tabs, activeTab, nextTabId]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const handleFileLoaded = useCallback((tabId, fileName) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId
        ? { ...tab, fileName, modified: false }
        : tab
    ));
  }, []);

  const handleDataModified = useCallback((tabId) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId
        ? { ...tab, modified: true }
        : tab
    ));
  }, []);

  const handleToolSelect = useCallback((toolId) => {
    if (!hasLoadedFiles) {
      alert('⚠️ Please upload a CSV file first to use the tools.');
      return;
    }
    setActiveTool(toolId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [hasLoadedFiles]);

  const tools = [
    { id: 'sort', name: 'Sort Data', icon: '⇅', description: 'Sort columns ascending/descending' },
    { id: 'filter', name: 'Filter Data', icon: '🔍', description: 'Filter rows by keyword' },
    { id: 'columns', name: 'Manage Columns', icon: '▦', description: 'Show/hide/rename columns' },
    { id: 'cleaning', name: 'Data Cleaning', icon: '🧹', description: 'Remove duplicates & empty rows' },
    { id: 'statistics', name: 'Statistics', icon: '📊', description: 'Calculate sum, avg, min, max' },
    { id: 'advanced', name: 'Advanced Tools', icon: '⚙️', description: 'Advanced operations' },
    { id: 'grouping', name: 'Group Data', icon: '📁', description: 'Group by column values' },
    { id: 'pivot', name: 'Pivot Table', icon: '📋', description: 'Create pivot tables' },
    { id: 'merge', name: 'Merge Files', icon: '🔗', description: 'Combine multiple datasets' },
    { id: 'formula', name: 'Formula Column', icon: '🔢', description: 'Add calculated columns' },
    { id: 'chart', name: 'Visualize', icon: '📈', description: 'Create charts & graphs' },
    { id: 'download', name: 'Download', icon: '⬇️', description: 'Export processed data' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Bar - Enhanced */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-xl z-50 border-b border-gray-200 backdrop-blur-sm bg-opacity-95">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Hamburger Menu & Title */}
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleSidebar}
                className="p-2.5 rounded-xl hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 group relative overflow-hidden"
                aria-label="Toggle Tools Sidebar"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <svg
                  className="w-6 h-6 text-gray-700 group-hover:text-indigo-600 transition-all duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Dynamic CSV Processor
              </h1>
            </div>

            {/* Center: Navigation Links - Enhanced */}
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center space-x-1 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-1.5 shadow-inner border border-gray-200">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 transform ${
                  currentView === 'home'
                    ? 'bg-white text-indigo-600 shadow-lg scale-105 ring-2 ring-indigo-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                 Home
              </button>
              <button
                onClick={() => setCurrentView('about')}
                className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 transform ${
                  currentView === 'about'
                    ? 'bg-white text-indigo-600 shadow-lg scale-105 ring-2 ring-indigo-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                 About
              </button>
            </div>

            {/* Right: Profile */}
            <div className="flex items-center">
              <Profile />
            </div>
          </div>
        </div>
      </nav>

      {/* Left Sidebar (Tools) - Enhanced */}
      <>
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity"
            onClick={toggleSidebar}
          />
        )}

        <aside
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gradient-to-br from-white via-gray-50 to-white shadow-2xl transition-all duration-500 ease-in-out z-40 overflow-y-auto border-r border-gray-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } w-80`}
          style={{
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 pb-5 border-b-2 border-gray-200">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center">
                <span className="mr-3 text-2xl drop-shadow-sm">🛠️</span>
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  CSV Tools
                </span>
              </h2>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-red-50 lg:hidden transition-all duration-200 hover:scale-110"
              >
                <svg
                  className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors"
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

            {!hasLoadedFiles && (
              <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200 rounded-full opacity-20 -mr-10 -mt-10"></div>
                <p className="font-bold mb-2 text-amber-900 flex items-center relative z-10">
                  <span className="mr-2 text-xl animate-pulse">⚠️</span>
                  No File Loaded
                </p>
                <p className="text-xs text-amber-800 leading-relaxed relative z-10">
                  Upload a CSV file to activate the tools
                </p>
              </div>
            )}

            <nav className="space-y-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  className={`w-full flex items-start space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 transform relative overflow-hidden group ${
                    activeTool === tool.id && hasLoadedFiles
                      ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-xl scale-[1.02] ring-2 ring-indigo-300'
                      : 'text-gray-700 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 hover:shadow-lg hover:scale-[1.01] hover:ring-1 hover:ring-indigo-200'
                  }`}
                  title={tool.description}
                >
                  {/* Animated background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  
                  <span className={`text-2xl flex-shrink-0 transform transition-all duration-300 ${
                    activeTool === tool.id && hasLoadedFiles ? 'scale-110 drop-shadow-lg' : 'group-hover:scale-110'
                  }`}>
                    {tool.icon}
                  </span>
                  <div className="text-left flex-1 relative z-10">
                    <p className="font-bold text-sm">{tool.name}</p>
                    <p className={`text-xs mt-1 transition-colors duration-300 ${
                      activeTool === tool.id && hasLoadedFiles ? 'text-indigo-100' : 'text-gray-500 group-hover:text-gray-700'
                    }`}>
                      {tool.description}
                    </p>
                  </div>
                  {activeTool === tool.id && hasLoadedFiles && (
                    <span className="text-white text-xl animate-bounce">✓</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </>

      {/* Main Content Area */}
      <main className={`transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-80' : 'ml-0'
      } pt-16`}>
        {currentView === 'home' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <TabManager
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onTabClose={handleTabClose}
              onTabAdd={handleTabAdd}
            />

            <div className="mt-6">
              <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 border-2 border-gray-200">
                {tabs.map(tab => (
                  <TabContent
                    key={tab.id}
                    tabId={tab.id}
                    isActive={activeTab === tab.id}
                    onFileLoaded={(fileName) => handleFileLoaded(tab.id, fileName)}
                    onDataModified={() => handleDataModified(tab.id)}
                    activeTool={activeTool}
                    onClearTool={() => setActiveTool(null)}
                    toolName={tools.find(t => t.id === activeTool)?.name}
                    toolIcon={tools.find(t => t.id === activeTool)?.icon}
                    toolDescription={tools.find(t => t.id === activeTool)?.description}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-200">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                About CSV Processor
              </h1>
              <p className="text-gray-600 mb-6 text-lg">
                A powerful, multi-tab CSV processing application built with React.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="border-l-4 border-indigo-500 pl-6 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-r-lg shadow-sm">
                  <h3 className="font-bold text-xl mb-3 text-gray-800">✨ Features</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Multi-tab file processing</li>
                    <li>• Sort and filter data</li>
                    <li>• Column management</li>
                    <li>• Data cleaning tools</li>
                    <li>• Advanced analytics</li>
                    <li>• Statistical analysis</li>
                  </ul>
                </div>
                <div className="border-l-4 border-purple-500 pl-6 bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-r-lg shadow-sm">
                  <h3 className="font-bold text-xl mb-3 text-gray-800">🚀 Capabilities</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Multiple files simultaneously</li>
                    <li>• Real-time processing</li>
                    <li>• Export processed data</li>
                    <li>• Pivot tables & grouping</li>
                    <li>• Data visualization</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
