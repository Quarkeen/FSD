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

  // State for the right sidebar and undo/redo controls
  const [currentDataSummary, setCurrentDataSummary] = useState(null);
  const [currentEditMode, setCurrentEditMode] = useState(false);
  const [currentHistory, setCurrentHistory] = useState({ canUndo: false, canRedo: false, historySize: 0 });
  const [currentDisplayData, setCurrentDisplayData] = useState(null);
  const [currentHiddenColumns, setCurrentHiddenColumns] = useState([]);
  const [editModeToggler, setEditModeToggler] = useState(null);
  const [undoHandler, setUndoHandler] = useState(null);
  const [redoHandler, setRedoHandler] = useState(null);

  const hasLoadedFiles = tabs.some(tab => tab.fileName !== null);

  // Tab and sidebar logic
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
      tab.id === tabId ? { ...tab, fileName, modified: false } : tab
    ));
  }, []);

  const handleDataModified = useCallback((tabId) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, modified: true } : tab
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

  // Define available tools for the left sidebar
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
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        {/* Gradient and particles background */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-blue-200 animate-gradient"
          style={{
            backgroundSize: '400% 400%',
            animation: 'gradient-shift 15s ease infinite'
          }}
        />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 bg-blue-300 rounded-full w-96 h-96 mix-blend-overlay filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 bg-blue-400 rounded-full w-96 h-96 mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 bg-white rounded-full w-96 h-96 mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-xl z-50 border-b border-gray-200 backdrop-blur-sm bg-opacity-95">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleSidebar}
                className="p-2.5 rounded-xl hover:bg-blue-50 transition-all duration-300 group relative overflow-hidden"
                aria-label="Toggle Tools Sidebar"
              >
                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <svg className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Centered navigation for Home/About */}
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center space-x-1 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-1.5 shadow-inner border border-gray-200">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 transform ${
                  currentView === 'home'
                    ? 'bg-white text-blue-600 shadow-lg scale-105 ring-2 ring-blue-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setCurrentView('about')}
                className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 transform ${
                  currentView === 'about'
                    ? 'bg-white text-blue-600 shadow-lg scale-105 ring-2 ring-blue-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                About
              </button>
            </div>

            <div className="flex items-center">
              <Profile />
            </div>
          </div>
        </div>
        <div className="absolute top-4 left-20">
          <h1 className="text-2xl font-extrabold tracking-tight text-blue-600 drop-shadow-sm">DCP</h1>
        </div>
      </nav>

      <>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity" onClick={toggleSidebar} />
        )}

        {/* Left (tool) sidebar */}
        <aside
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white/95 backdrop-blur-sm shadow-2xl transition-all duration-500 ease-in-out z-40 overflow-y-auto border-r border-gray-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } w-80`}
          style={{ boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}
        >
          {/* ... same code as before ... */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 pb-5 border-b-2 border-gray-200">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center">
                <span className="mr-3 text-2xl drop-shadow-sm">🛠️</span>
                <span className="text-blue-600">CSV Tools</span>
              </h2>
              <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-red-50 lg:hidden transition-all duration-200 hover:scale-110">
                <svg className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                <p className="text-xs text-amber-800 leading-relaxed relative z-10">Upload a CSV file to activate the tools</p>
              </div>
            )}
            <nav className="space-y-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  className={`w-full flex items-start space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 transform relative overflow-hidden group ${
                    activeTool === tool.id && hasLoadedFiles
                      ? 'bg-blue-600 text-white shadow-xl scale-[1.02] ring-2 ring-blue-300'
                      : 'text-gray-700 hover:bg-blue-50 hover:shadow-lg hover:scale-[1.01] hover:ring-1 hover:ring-blue-200'
                  }`}
                  title={tool.description}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <span className={`text-2xl flex-shrink-0 transform transition-all duration-300 ${
                    activeTool === tool.id && hasLoadedFiles ? 'scale-110 drop-shadow-lg' : 'group-hover:scale-110'
                  }`}>{tool.icon}</span>
                  <div className="text-left flex-1 relative z-10">
                    <p className="font-bold text-sm">{tool.name}</p>
                    <p className={`text-xs mt-1 transition-colors duration-300 ${
                      activeTool === tool.id && hasLoadedFiles ? 'text-blue-100' : 'text-gray-500 group-hover:text-gray-700'
                    }`}>{tool.description}</p>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </>

      {/* Responsive right panel with Undo/Redo */}
      <aside className="hidden xl:block fixed right-0 top-16 w-80 h-[calc(100vh-4rem)] bg-white/95 backdrop-blur-sm shadow-2xl z-30 overflow-y-auto border-l border-gray-200 p-4 space-y-4">
        {/* OVERVIEW and Edit Mode (unchanged) */}
        {currentDataSummary ? (
          <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200 shadow-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dataset Overview
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2 rounded-lg">
                <span className="text-gray-600 block">Total Rows</span>
                <span className="font-bold text-gray-900 text-lg">{currentDataSummary.totalRows}</span>
              </div>
              <div className="bg-white p-2 rounded-lg">
                <span className="text-gray-600 block">Columns</span>
                <span className="font-bold text-gray-900 text-lg">{currentDataSummary.headers.length}</span>
              </div>
              <div className="bg-white p-2 rounded-lg">
                <span className="text-gray-600 block">Visible</span>
                <span className="font-bold text-gray-900 text-lg">{currentDataSummary.headers.length - currentHiddenColumns.length}</span>
              </div>
              <div className="bg-white p-2 rounded-lg">
                <span className="text-gray-600 block">Hidden</span>
                <span className="font-bold text-gray-900 text-lg">{currentHiddenColumns.length}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 shadow-lg">
            <div className="text-center py-4">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">Dataset info will appear here</p>
            </div>
          </div>
        )}
        {/* UNDO/REDO logic, edit status and keyboard tips - functional! */}
        {currentDataSummary && currentDisplayData ? (
          <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-200 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${currentEditMode ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <h3 className="text-sm font-bold text-gray-800">{currentEditMode ? '✏️ Editing' : '👁️ Viewing'}</h3>
            </div>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              {currentEditMode ? 'Double-click any cell to edit values.' : 'Enable editing mode to modify your data.'}
            </p>
            <button 
              onClick={() => { if (editModeToggler) editModeToggler(); }}
              className={`w-full px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-md text-sm ${
                currentEditMode ? 'bg-gray-600 text-white hover:bg-gray-700 ring-2 ring-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-300'
              }`}
            >
              {currentEditMode ? '🔒 Lock Table' : '🔓 Enable Editing'}
            </button>
          </div>
        ) : (
          <div className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 shadow-lg">
            <div className="text-center py-4">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">Upload a CSV file to enable editing</p>
            </div>
          </div>
        )}

        {/* Undo/Redo history panel with working buttons */}
        {currentDataSummary && currentDisplayData ? (
          <div className="p-5 bg-white rounded-2xl border-2 border-blue-200 shadow-lg">
            <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History Controls
            </h4>
            <div className="space-y-3">
              <button
                onClick={() => { if (undoHandler) { undoHandler(); } }}
                disabled={!currentHistory.canUndo}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl shadow-md text-sm font-medium transition-all ${
                  currentHistory.canUndo ? 'bg-gray-600 text-white hover:bg-gray-700 cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Undo {currentHistory.canUndo ? '✓' : '✗'}
              </button>
              <button
                onClick={() => { if (redoHandler) { redoHandler(); } }}
                disabled={!currentHistory.canRedo}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl shadow-md text-sm font-medium transition-all ${
                  currentHistory.canRedo ? 'bg-gray-600 text-white hover:bg-gray-700 cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
                Redo {currentHistory.canRedo ? '✓' : '✗'}
              </button>
              <div className="mt-4 px-4 py-3 bg-gradient-to-r from-blue-50 to-gray-50 rounded-xl text-center border border-blue-200">
                <div className="text-2xl font-bold text-gray-800">{currentHistory.historySize}</div>
                <div className="text-xs text-gray-600 mt-1">{currentHistory.historySize === 1 ? 'change saved' : 'changes saved'}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-white rounded-2xl border-2 border-gray-200 shadow-lg">
            <div className="text-center py-4">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">Edit history will appear here</p>
            </div>
          </div>
        )}

        <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 shadow-sm">
          <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Keyboard Shortcuts
          </h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between items-center">
              <span>Undo</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono shadow-sm">Ctrl+Z</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Redo</span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono shadow-sm">Ctrl+Y</kbd>
            </div>
          </div>
        </div>
      </aside>

      {/* Responsive main (adds padding for right panel only on xl+) */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : 'ml-0'} xl:pr-80 pt-16`}>
        {currentView === 'home' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <TabManager tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} onTabClose={handleTabClose} onTabAdd={handleTabAdd} />
            <div className="mt-6">
              <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-6 sm:p-8 border-2 border-gray-200">
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
                    onDataSummaryChange={(summary) => activeTab === tab.id && setCurrentDataSummary(summary)}
                    onEditModeChange={(mode) => activeTab === tab.id && setCurrentEditMode(mode)}
                    onHistoryChange={(history) => activeTab === tab.id && setCurrentHistory(history)}
                    onDisplayDataChange={(data) => activeTab === tab.id && setCurrentDisplayData(data)}
                    onHiddenColumnsChange={(cols) => activeTab === tab.id && setCurrentHiddenColumns(cols)}
                    onToggleEditModeRegister={(toggleFn) => activeTab === tab.id && setEditModeToggler(() => toggleFn)}
                    onUndoRegister={(undoFn) => activeTab === tab.id && setUndoHandler(() => undoFn)}
                    onRedoRegister={(redoFn) => activeTab === tab.id && setRedoHandler(() => redoFn)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border-2 border-gray-200">
              <h1 className="text-4xl font-bold mb-4 text-blue-600">About CSV Processor</h1>
              <p className="text-gray-600 mb-6 text-lg">A powerful, multi-tab CSV processing application built with React.</p>
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="border-l-4 border-blue-600 pl-6 bg-blue-50 p-4 rounded-r-lg shadow-sm">
                  <h3 className="font-bold text-xl mb-3 text-gray-800">Features</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Multi-tab file processing</li>
                    <li>• Sort and filter data</li>
                    <li>• Column management</li>
                    <li>• Data cleaning tools</li>
                    <li>• Advanced analytics</li>
                    <li>• Statistical analysis</li>
                  </ul>
                </div>
                <div className="border-l-4 border-blue-600 pl-6 bg-blue-50 p-4 rounded-r-lg shadow-sm">
                  <h3 className="font-bold text-xl mb-3 text-gray-800">Capabilities</h3>
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
