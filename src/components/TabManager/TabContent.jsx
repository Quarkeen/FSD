import React, { useState, useEffect, useRef, useCallback } from "react";
import DynamicControlPanel from "../DynamicControlPanel/DynamicControlPanel";
import DataTable from "../DataTable";
import LoadingIndicator from "../LoadingIndicator";
import EditableTable from '../Table/EditableTable';
import Error from "../Error";
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { useCsvHistory } from '../../hooks/useCsvHistory';


function TabContent({ 
  tabId, 
  isActive,
  onFileLoaded,
  onDataModified,
  activeTool,
  onClearTool,
  toolName,
  toolIcon,
  toolDescription,
  onDataSummaryChange,
  onEditModeChange,
  onHistoryChange,
  onDisplayDataChange,
  onHiddenColumnsChange,
  onToggleEditModeRegister
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataSummary, setDataSummary] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formattingMap, setFormattingMap] = useState({});
  const [groupedData, setGroupedData] = useState(null);
  const [pivotData, setPivotData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [uploadAnimation, setUploadAnimation] = useState(false);
  
  const { saveCsvToHistory } = useCsvHistory();
  const workerRef = useRef(null);


  const {
    state: displayData,
    setState: setDisplayData,
    undo,
    redo,
    reset: resetHistory,
    canUndo,
    canRedo,
    historySize,
  } = useUndoRedo(null, 50);


  // Send data to App.jsx
  useEffect(() => {
    if (onDataSummaryChange) {
      onDataSummaryChange(dataSummary);
    }
  }, [dataSummary, onDataSummaryChange]);


  useEffect(() => {
    if (onEditModeChange) {
      onEditModeChange(isEditMode);
    }
  }, [isEditMode, onEditModeChange]);


  useEffect(() => {
    if (onHistoryChange) {
      onHistoryChange({ canUndo, canRedo, historySize });
    }
  }, [canUndo, canRedo, historySize, onHistoryChange]);


  useEffect(() => {
    if (onDisplayDataChange) {
      onDisplayDataChange(displayData);
    }
  }, [displayData, onDisplayDataChange]);


  useEffect(() => {
    if (onHiddenColumnsChange) {
      onHiddenColumnsChange(hiddenColumns);
    }
  }, [hiddenColumns, onHiddenColumnsChange]);


  const toggleEditMode = useCallback(() => {
    if (!displayData || displayData.length === 0) {
      setError({
        title: "No Data",
        message: "Please load data before enabling edit mode.",
      });
      return;
    }
    setIsEditMode(!isEditMode);
  }, [displayData, isEditMode]);


  useEffect(() => {
    if (onToggleEditModeRegister && isActive) {
      onToggleEditModeRegister(toggleEditMode);
    }
  }, [toggleEditMode, onToggleEditModeRegister, isActive]);


  useEffect(() => {
    console.log(`Initializing worker for tab ${tabId}`);
    workerRef.current = new Worker(
      new URL("../../worker/processor.js", import.meta.url),
      { type: "module" }
    );


    workerRef.current.onmessage = async (event) => {
      const { type, payload } = event.data;
      console.log(`[Tab ${tabId}] Worker message:`, type);


      if (type === "SUCCESS_ANALYSIS") {
        setDataSummary(payload.summary);
        setDisplayData(payload.previewData);
        resetHistory(payload.previewData);
        setHiddenColumns(payload.hiddenColumns || []);
        setFormattingMap(payload.formattingMap || {});
        setGroupedData(null);
        setPivotData(null);
        setChartData(null);
        setError(null);
        setSuccessMessage("File loaded successfully!");
        setShowSuccessAnimation(true);
        setTimeout(() => {
          setSuccessMessage(null);
          setShowSuccessAnimation(false);
        }, 3000);
      } else if (type === "SUCCESS_UPDATE") {
        setDisplayData(payload.previewData);
        if (payload.summary) setDataSummary(payload.summary);
        if (payload.hiddenColumns) setHiddenColumns(payload.hiddenColumns);
        if (payload.formattingMap) setFormattingMap(payload.formattingMap);
        setGroupedData(null);
        setPivotData(null);
        setChartData(null);
        if (payload.message) {
          setSuccessMessage(payload.message);
          setTimeout(() => setSuccessMessage(null), 3000);
        }
        onDataModified?.();
      } else if (type === "SUCCESS_DOWNLOAD") {
        if (!payload?.csvString || payload.csvString.trim() === "") {
          setError({
            title: "Download Error",
            message: "CSV file is empty.",
          });
          setIsProcessing(false);
          return;
        }


        const blob = new Blob([payload.csvString], {
          type: "text/csv;charset=utf-8;",
        });
        
        const fileName = payload.customFileName || `processed_${Date.now()}.csv`;
        const destinationPath = payload.destinationPath;


        if (destinationPath) {
          try {
            const fileHandle = await destinationPath.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            
            setSuccessMessage("CSV downloaded to your chosen folder!");
            setTimeout(() => setSuccessMessage(null), 3000);
          } catch (err) {
            console.error("Error writing to custom folder:", err);
            setError({
              title: "Download Error",
              message: "Failed to save to selected folder. Using default download.",
            });
            performBrowserDownload(blob, fileName);
          }
        } else {
          performBrowserDownload(blob, fileName);
        }
        
        saveCsvToHistory(fileName, blob.size).catch(err => {
          console.error("Failed to save CSV to history:", err);
        });
      } else if (type === "SUCCESS_GROUPING") {
        setGroupedData(payload.groupedData);
        setDisplayData(null);
        setPivotData(null);
        setChartData(null);
        setSuccessMessage(payload.message);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (type === "SUCCESS_PIVOT") {
        setPivotData(payload.pivotData);
        setDisplayData(null);
        setGroupedData(null);
        setChartData(null);
        setSuccessMessage(payload.message);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (type === "SUCCESS_CHART_DATA") {
        setChartData(payload.chartData);
        setDisplayData(null);
        setGroupedData(null);
        setPivotData(null);
      } else if (type === "ERROR") {
        setError({ title: "Processing Error", message: payload.message });
      }


      setIsProcessing(false);
      setUploadAnimation(false);
    };


    workerRef.current.onerror = (err) => {
      console.error(`[Tab ${tabId}] Worker error:`, err);
      setError({ title: "Worker Failed", message: err.message });
      setIsProcessing(false);
      setUploadAnimation(false);
    };


    return () => {
      console.log(`Terminating worker for tab ${tabId}`);
      workerRef.current?.terminate();
    };
  }, [tabId]);


  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;


    console.log(`[Tab ${tabId}] Loading file:`, file.name);
    setIsProcessing(true);
    setUploadAnimation(true);
    setDataSummary(null);
    setDisplayData(null);
    resetHistory(null);
    setHiddenColumns([]);
    setError(null);
    setSuccessMessage(null);
    setFormattingMap({});
    setGroupedData(null);
    setPivotData(null);
    setChartData(null);
    setIsEditMode(false);


    workerRef.current?.postMessage({
      type: "PARSE_FILE",
      payload: { file },
    });


    onFileLoaded?.(file.name);
  }, [tabId, onFileLoaded, resetHistory, setDisplayData]);


  const performBrowserDownload = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSuccessMessage("CSV downloaded!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };


  const handleProcessRequest = useCallback((type, payload = {}) => {
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);


    if (!["GROUP_AND_AGGREGATE", "GENERATE_PIVOT_TABLE", "GET_CHART_DATA"].includes(type)) {
      setGroupedData(null);
      setPivotData(null);
      setChartData(null);
    }


    workerRef.current?.postMessage({ type, payload });
  }, []);


  handleProcessRequest.worker = workerRef.current;


  const handleDataChange = useCallback((updatedData) => {
    if (JSON.stringify(updatedData) !== JSON.stringify(displayData)) {
      setDisplayData(updatedData);
      workerRef.current?.postMessage({
        type: "UPDATE_DATA_FROM_EDIT",
        payload: { data: updatedData },
      });
      setSuccessMessage("✓ Cell updated!");
      setTimeout(() => setSuccessMessage(null), 1500);
      onDataModified?.();
    }
  }, [displayData, setDisplayData, onDataModified]);


  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const previousState = undo();
    if (previousState) {
      workerRef.current?.postMessage({
        type: "UPDATE_DATA_FROM_EDIT",
        payload: { data: previousState },
      });
      setSuccessMessage("✓ Undo successful!");
      setTimeout(() => setSuccessMessage(null), 2000);
      onDataModified?.();
    }
  }, [canUndo, undo, onDataModified]);


  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const nextState = redo();
    if (nextState) {
      workerRef.current?.postMessage({
        type: "UPDATE_DATA_FROM_EDIT",
        payload: { data: nextState },
      });
      setSuccessMessage("✓ Redo successful!");
      setTimeout(() => setSuccessMessage(null), 2000);
      onDataModified?.();
    }
  }, [canRedo, redo, onDataModified]);


  useEffect(() => {
    if (!isActive) return;


    const handleKeyDown = (e) => {
      if (!displayData || isProcessing) return;


      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };


    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleUndo, handleRedo, displayData, isProcessing]);


  let content = (
    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
      <p className="text-gray-500 text-center">
        Please upload a CSV file to begin.
      </p>
    </div>
  );


  if (isProcessing) {
    content = <LoadingIndicator text="Processing... please wait." />;
  } else if (error) {
    content = (
      <Error
        title={error.title}
        message={error.message}
        onClose={() => setError(null)}
      />
    );
  } else if (displayData) {
    content = isEditMode ? (
      <EditableTable
        data={displayData}
        summary={dataSummary}
        hiddenColumns={hiddenColumns}
        onDataChange={handleDataChange}
      />
    ) : (
      <DataTable
        headers={dataSummary.headers.filter((h) => !hiddenColumns.includes(h))}
        data={displayData}
        totalRows={dataSummary.totalRows}
        formattingMap={formattingMap}
      />
    );
  } else if (dataSummary && !groupedData && !pivotData && !chartData) {
    content = (
      <DataTable
        headers={dataSummary.headers.filter((h) => !hiddenColumns.includes(h))}
        data={[]}
        totalRows={0}
        formattingMap={formattingMap}
      />
    );
  } else if (dataSummary) {
    content = (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-center">
          {groupedData ? "Grouping results shown below." : ""}
          {pivotData ? "Pivot table results shown below." : ""}
          {chartData ? "Chart data shown below." : ""}
        </p>
      </div>
    );
  }


  return (
    <div className={`tab-content relative ${!isActive ? 'hidden' : ''}`}>
      {/* Subtle Background Particles - Professional */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
      </div>


      <style jsx>{`
        /* Subtle floating particles */
        .particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0));
          animation: float-particle 25s infinite ease-in-out;
        }
        
        .particle-1 {
          width: 120px;
          height: 120px;
          top: 15%;
          left: 15%;
          animation-delay: 0s;
        }
        
        .particle-2 {
          width: 90px;
          height: 90px;
          top: 65%;
          right: 20%;
          animation-delay: 8s;
        }
        
        .particle-3 {
          width: 100px;
          height: 100px;
          bottom: 20%;
          left: 45%;
          animation-delay: 16s;
        }
        
        @keyframes float-particle {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.3;
          }
          50% {
            transform: translate(20px, -30px);
            opacity: 0.5;
          }
        }


        /* Professional upload progress indicator */
        .upload-progress-overlay {
          position: fixed;
          inset: 0;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-out;
        }


        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }


        .upload-spinner {
          width: 60px;
          height: 60px;
          border: 3px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }


        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }


        .upload-progress-content {
          text-align: center;
        }


        .upload-dots {
          display: inline-flex;
          gap: 6px;
          margin-left: 4px;
        }


        .upload-dot {
          width: 6px;
          height: 6px;
          background: #3b82f6;
          border-radius: 50%;
          animation: dotPulse 1.4s infinite ease-in-out;
        }


        .upload-dot:nth-child(2) {
          animation-delay: 0.2s;
        }


        .upload-dot:nth-child(3) {
          animation-delay: 0.4s;
        }


        @keyframes dotPulse {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1.1);
          }
        }


        /* Success checkmark animation */
        .success-overlay {
          position: fixed;
          inset: 0;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }


        .success-checkmark {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #10b981;
          position: relative;
          animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }


        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }


        .checkmark-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 3;
          stroke: white;
          fill: none;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
          animation-delay: 0.2s;
        }


        .checkmark-check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          stroke: white;
          stroke-width: 3;
          fill: none;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.4s forwards;
        }


        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }


        /* Subtle shimmer on upload box */
        .upload-active {
          position: relative;
          overflow: hidden;
        }


        .upload-active::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(59, 130, 246, 0.1),
            transparent
          );
          animation: shimmer 2s infinite;
        }


        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 200%;
          }
        }
      `}</style>


      {/* Professional Upload Progress Animation */}
      {uploadAnimation && (
        <div className="upload-progress-overlay">
          <div className="upload-progress-content">
            <div className="upload-spinner mb-6"></div>
            <div className="text-gray-700 text-lg font-medium">
              Processing your file
              <div className="upload-dots">
                <div className="upload-dot"></div>
                <div className="upload-dot"></div>
                <div className="upload-dot"></div>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
          </div>
        </div>
      )}


      {/* Success Animation - Elegant Checkmark */}
      {showSuccessAnimation && (
        <div className="success-overlay">
          <div className="success-checkmark">
            <svg viewBox="0 0 52 52" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <circle className="checkmark-circle" cx="26" cy="26" r="25" />
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
        </div>
      )}


      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800 transition-colors">✕</button>
        </div>
      )}


      {/* Upload Section */}
      <section className="file-upload-section mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-800">Upload Your Data</h2>
        </div>
        
        <label className={`group relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
          isProcessing 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-md'
        } ${uploadAnimation ? 'upload-active' : ''}`}>
          
          <div className="relative z-10 flex flex-col items-center justify-center text-gray-600 group-hover:text-blue-600 transition-colors">
            <div className="mb-5">
              <svg className={`w-16 h-16 transform transition-all duration-300 ${isProcessing ? 'text-gray-400' : 'text-blue-500 group-hover:scale-110'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <p className="text-lg font-semibold mb-2 transition-colors">
              {uploadAnimation ? 'Processing your file...' : 'Drop your CSV file here'}
            </p>
            <p className="text-sm text-gray-500">
              {uploadAnimation ? 'Analyzing data structure...' : 'or click to browse from your computer'}
            </p>
            
            {!uploadAnimation && (
              <div className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium group-hover:bg-blue-700 group-hover:shadow-lg transform group-hover:scale-105 transition-all duration-300">
                Browse Files
              </div>
            )}
          </div>
          
          <input type="file" accept=".csv" onChange={handleFileChange} disabled={isProcessing} className="hidden" />
        </label>
        
        <div className="mt-5 grid grid-cols-3 gap-4">
          <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-800">Fast</p>
              <p className="text-xs text-gray-500">Instant</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-800">Secure</p>
              <p className="text-xs text-gray-500">Private</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-800">Powerful</p>
              <p className="text-xs text-gray-500">12+ tools</p>
            </div>
          </div>
        </div>
      </section>


      {dataSummary && activeTool && (
        <div className="mb-6">
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-blue-200">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{toolIcon}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{toolName}</h2>
                  <p className="text-sm text-gray-600">{toolDescription}</p>
                </div>
              </div>
              <button onClick={onClearTool} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors">
                Close Tool
              </button>
            </div>
            <DynamicControlPanel
              summary={dataSummary}
              isProcessing={isProcessing}
              onProcess={handleProcessRequest}
              hiddenColumns={hiddenColumns}
              worker={handleProcessRequest.worker}
              data={displayData}
              activeTool={activeTool}
            />
          </div>
        </div>
      )}


      {dataSummary && !activeTool && (
        <div className="mb-6">
          <div className="bg-blue-50 rounded-2xl p-8 border-2 border-dashed border-blue-300">
            <div className="text-center">
              <span className="text-5xl mb-4 block">🛠️</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Tool to Get Started</h3>
              <p className="text-gray-600">Click on any tool from the sidebar to begin processing your CSV data</p>
            </div>
          </div>
        </div>
      )}


      {dataSummary && displayData && !groupedData && !pivotData && !chartData && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Your Data' : 'View Your Data'}</h2>
          </div>
          
          <div className="border-2 border-blue-200 rounded-2xl overflow-hidden bg-white shadow-lg">
            {content}
          </div>


          {displayData && displayData.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-4">
              <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-800">Rows</p>
                  <p className="text-xs text-gray-500">{displayData.length} / {dataSummary?.totalRows || 0}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-800">Columns</p>
                  <p className="text-xs text-gray-500">{dataSummary?.headers.length || 0} total</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-800">Mode</p>
                  <p className="text-xs text-gray-500">{isEditMode ? 'Editing' : 'Viewing'}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}


export default TabContent;  
