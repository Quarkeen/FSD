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
  toolDescription
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

  // Initialize worker for this tab
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
        setTimeout(() => setSuccessMessage(null), 3000);
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
    };

    workerRef.current.onerror = (err) => {
      console.error(`[Tab ${tabId}] Worker error:`, err);
      setError({ title: "Worker Failed", message: err.message });
      setIsProcessing(false);
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
  }, [tabId, onFileLoaded]);

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
    <div className={`tab-content ${!isActive ? 'hidden' : ''}`}>
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-700 hover:text-green-900">✕</button>
        </div>
      )}

     {/* Upload Section - Simplified Outer, Animated Inner */}
<section className="file-upload-section mb-8">
  <div className="flex items-center justify-between mb-5">
      
    <h2 className="flex  items-center justify-between  text-2xl font-bold text-gray-800">Upload Your Data</h2>

  </div>
  
  <label 
    className={`group relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
      isProcessing 
        ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
        : 'border-indigo-400 bg-gradient-to-br from-white via-indigo-50/30 to-white hover:border-indigo-600 hover:shadow-xl hover:scale-[1.01]'
    }`}
  >
    {/* Keep the animated background gradient */}
    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    
    {/* Keep decorative circles but make them simpler */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200 rounded-full opacity-5 -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200 rounded-full opacity-5 -ml-12 -mb-12 group-hover:scale-125 transition-transform duration-700"></div>
    
    <div className="relative z-10 flex flex-col items-center justify-center text-gray-600 group-hover:text-indigo-700 transition-colors">
      {/* Keep Upload Icon with all animations */}
      <div className="mb-5 relative">
        <div className="absolute inset-0 bg-indigo-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
        <svg 
          className="w-20 h-20 text-indigo-500 relative z-10 transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
          />
        </svg>
        {/* Keep pulsing ring */}
        <div className="absolute inset-0 border-4 border-indigo-400 rounded-full animate-ping opacity-20"></div>
      </div>
      
      {/* Text content */}
      <p className="text-xl font-bold mb-2 group-hover:text-indigo-800 transition-colors">
        Drop your CSV file here
      </p>
      <p className="text-sm text-gray-500 mb-4">
        or click to browse from your computer
      </p>
      
      {/* Keep animated button */}
      <div className="mt-2 px-8 py-3 bg-white border-2 border-indigo-500 text-indigo-600 rounded-xl font-semibold group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg transform group-hover:scale-105 transition-all duration-300">
        Browse Files
      </div>
      
      {/* Keep file info */}
      <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>CSV files • Browser processing • Private & Secure</span>
      </div>
    </div>
    
    <input 
      type="file" 
      accept=".csv" 
      onChange={handleFileChange} 
      disabled={isProcessing} 
      className="hidden" 
    />
  </label>
  
  {/* Simplified info cards - cleaner design */}
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
      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
      <div className="text-left">
        <p className="text-xs font-bold text-gray-800">Powerful</p>
        <p className="text-xs text-gray-500">12+ tools</p>
      </div>
    </div>
  </div>
</section>


      {/* Data Summary */}
      {dataSummary && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Dataset Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Rows:</span>
              <span className="ml-2 font-semibold text-gray-900">{dataSummary.totalRows}</span>
            </div>
            <div>
              <span className="text-gray-600">Columns:</span>
              <span className="ml-2 font-semibold text-gray-900">{dataSummary.headers.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Visible:</span>
              <span className="ml-2 font-semibold text-gray-900">{dataSummary.headers.length - hiddenColumns.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Hidden:</span>
              <span className="ml-2 font-semibold text-gray-900">{hiddenColumns.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* ONLY SHOW SELECTED TOOL */}
      {dataSummary && activeTool && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-indigo-200">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{toolIcon}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{toolName}</h2>
                  <p className="text-sm text-gray-600">{toolDescription}</p>
                </div>
              </div>
              <button
                onClick={onClearTool}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors"
              >
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

      {/* Prompt to Select Tool */}
      {dataSummary && !activeTool && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-dashed border-indigo-300">
            <div className="text-center">
              <span className="text-5xl mb-4 block">🛠️</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Tool to Get Started</h3>
              <p className="text-gray-600">
                Click on any tool from the sidebar to begin processing your CSV data
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Undo/Redo & Edit Mode */}
      {dataSummary && displayData && !groupedData && !pivotData && !chartData && (
        <div className="mt-6 mb-4">
          <div className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 mb-4">
            <div className="flex items-center gap-3">
              <button onClick={handleUndo} disabled={!canUndo} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors" title="Undo (Ctrl+Z)">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Undo
              </button>
              <button onClick={handleRedo} disabled={!canRedo} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors" title="Redo (Ctrl+Shift+Z)">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
                Redo
              </button>
              <div className="ml-4 text-sm text-gray-600">
                <span className="font-medium">{historySize}</span> {historySize === 1 ? 'change' : 'changes'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-linear-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isEditMode ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {isEditMode ? '✏️ Edit Mode Active' : '👁️ View Mode'}
                </h3>
                <p className="text-xs text-gray-600">
                  {isEditMode ? 'Double-click any cell to edit.' : 'Enable edit mode to modify values.'}
                </p>
              </div>
            </div>
            <button onClick={toggleEditMode} className={`px-4 py-2 rounded-lg font-medium transition-all ${isEditMode ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
              {isEditMode ? '🔒 Lock Table' : '🔓 Enable Editing'}
            </button>
          </div>
        </div>
      )}

      {/* Data Display */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? '2. Edit Your Data' : '2. View Your Data'}
          </h2>
          {displayData && displayData.length > 0 && (
            <span className="text-sm text-gray-600">
              Showing {displayData.length} of {dataSummary?.totalRows || 0} rows
            </span>
          )}
        </div>
        {content}
      </section>
    </div>
  );
}

export default TabContent;
