import React, { useState, useCallback } from "react";
import TabManager from "./components/TabManager/TabManager";
import TabContent from "./components/TabManager/TabContent";

function App() {
  const [tabs, setTabs] = useState([
    { id: 1, fileName: null, modified: false }
  ]);
  const [activeTab, setActiveTab] = useState(1);
  const [nextTabId, setNextTabId] = useState(2);

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
        // Always keep at least one tab
        return [{ id: nextTabId, fileName: null, modified: false }];
      }
      return newTabs;
    });

    // Switch to another tab if closing active tab
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

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <h1 className="text-3xl font-bold text-indigo-700">
            Multi-Tab CSV Processor
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Work on multiple CSV files simultaneously
          </p>
        </div>

        {/* Tab Manager */}
        <TabManager
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onTabClose={handleTabClose}
          onTabAdd={handleTabAdd}
        />

        {/* Tab Contents */}
        <div className="p-6">
          <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-gray-200">
            {tabs.map(tab => (
              <TabContent
                key={tab.id}
                tabId={tab.id}
                isActive={activeTab === tab.id}
                onFileLoaded={(fileName) => handleFileLoaded(tab.id, fileName)}
                onDataModified={() => handleDataModified(tab.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
