import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import UploadSection from './UploadSection';
import DynamicControlPanel from './DynamicControlPanel';

function MainDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [fileData, setFileData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [worker, setWorker] = useState(null);
  const [activeTool, setActiveTool] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleFileUpload = (data, fileSummary, workerInstance) => {
    setFileData(data);
    setSummary(fileSummary);
    setWorker(workerInstance);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <TopNavbar 
        toggleSidebar={toggleSidebar}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      <div className="flex">
        {/* Left Sidebar (Collapsible Tools) */}
        <Sidebar 
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          hasData={!!fileData}
        />

        {/* Main Content Area */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
          <div className="p-6">
            {/* Render different views based on currentView */}
            {currentView === 'home' && (
              <div className="space-y-6">
                {/* Upload Section */}
                {!fileData && (
                  <UploadSection onFileUpload={handleFileUpload} />
                )}

                {/* Show Data Processing Tools when file is uploaded */}
                {fileData && summary && (
                  <DynamicControlPanel
                    summary={summary}
                    data={fileData}
                    worker={worker}
                    isProcessing={false}
                    onProcess={() => {}}
                    hiddenColumns={[]}
                  />
                )}
              </div>
            )}

            {currentView === 'about' && (
              <AboutSection />
            )}

            {currentView === 'profile' && (
              <ProfileSection />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// About Section Component
function AboutSection() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">About CSV Processor</h1>
      <p className="text-gray-600 mb-4">
        A powerful tool for processing and analyzing CSV files with advanced features.
      </p>
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="font-semibold text-lg mb-2">Features</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Sort and filter data</li>
            <li>Column management</li>
            <li>Data cleaning tools</li>
            <li>Advanced analytics</li>
            <li>Statistical analysis</li>
          </ul>
        </div>
        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="font-semibold text-lg mb-2">Capabilities</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Handle large datasets</li>
            <li>Real-time processing</li>
            <li>Export processed data</li>
            <li>Pivot tables & grouping</li>
            <li>Data visualization</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Profile Section Component
function ProfileSection() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Profile</h1>
      <div className="flex items-center space-x-6 mb-8">
        <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
          S
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Sainath</h2>
          <p className="text-gray-600">IIIT Dharwad</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="border-b pb-4">
          <label className="font-semibold text-gray-700">Email</label>
          <p className="text-gray-600">sainath@example.com</p>
        </div>
        <div className="border-b pb-4">
          <label className="font-semibold text-gray-700">Location</label>
          <p className="text-gray-600">Bidar, Karnataka, India</p>
        </div>
        <div className="border-b pb-4">
          <label className="font-semibold text-gray-700">Member Since</label>
          <p className="text-gray-600">November 2025</p>
        </div>
      </div>
    </div>
  );
}

export default MainDashboard;
