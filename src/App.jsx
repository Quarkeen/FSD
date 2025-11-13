import React, { useState, useEffect, useRef } from 'react';
// ⬇️ Importing the separated components
import DynamicControlPanel from './components/DynamicControlPanel';
import DataTable from './components/DataTable';
import LoadingIndicator from './components/LoadingIndicator';
import Error from './components/Error';

// --- Main App Component ---

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataSummary, setDataSummary] = useState(null);
  const [displayData, setDisplayData] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const workerRef = useRef(null);

  // --- NEW State for advanced features ---
  const [formattingMap, setFormattingMap] = useState({});
  const [groupedData, setGroupedData] = useState(null);
  const [pivotData, setPivotData] = useState(null);
  const [chartData, setChartData] = useState(null);


  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./worker/processor.js', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      console.log('Message from worker:', type);

      if (type === 'SUCCESS_ANALYSIS') {
        setDataSummary(payload.summary);
        setDisplayData(payload.previewData);
        setHiddenColumns(payload.hiddenColumns || []);
        setFormattingMap(payload.formattingMap || {});
        // Clear all special views
        setGroupedData(null);
        setPivotData(null);
        setChartData(null);
        setError(null);
        setSuccessMessage('File loaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } 
      else if (type === 'SUCCESS_UPDATE') {
        setDisplayData(payload.previewData);
        
        // Update summary if provided (e.g., rename, add column)
        if (payload.summary) {
          setDataSummary(payload.summary);
        }
        
        // Update hidden columns if provided
        if (payload.hiddenColumns) {
          setHiddenColumns(payload.hiddenColumns);
        }
        
        // Update formatting if provided
        if (payload.formattingMap) {
          setFormattingMap(payload.formattingMap);
        }

        // Data was updated, so clear specialized views
        setGroupedData(null);
        setPivotData(null);
        setChartData(null);
        
        // Show success message if provided
        if (payload.message) {
          setSuccessMessage(payload.message);
          setTimeout(() => setSuccessMessage(null), 3000);
        }
        
        console.log(`✅ Data updated — rows shown: ${payload?.rowCount ?? payload.previewData.length}`);
      } 
      else if (type === 'SUCCESS_AGGREGATIONS') {
        // This is now handled by the listener in DynamicControlPanel
        // This log is just for confirmation
        console.log('✅ Aggregations computed:', payload.aggregations);
      }
      else if (type === 'SUCCESS_DOWNLOAD') {
        console.log('✅ CSV download triggered from worker');

        if (!payload?.csvString || payload.csvString.trim() === '') {
          setError({
            title: 'Download Error',
            message: 'CSV file is empty or could not be generated. Please reapply filters or try again.',
          });
          setIsProcessing(false);
          return;
        }

        const blob = new Blob([payload.csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `processed_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setSuccessMessage('CSV downloaded successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
        console.log('💾 CSV downloaded successfully.');
      }
      // --- NEW Handlers for specialized views ---
      else if (type === 'SUCCESS_GROUPING') {
        setGroupedData(payload.groupedData);
        setDisplayData(null); // Hide the main data table
        setPivotData(null);
        setChartData(null);
        setSuccessMessage(payload.message);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      else if (type === 'SUCCESS_PIVOT') {
        setPivotData(payload.pivotData);
        setDisplayData(null); // Hide the main data table
        setGroupedData(null);
        setChartData(null);
        setSuccessMessage(payload.message);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      else if (type === 'SUCCESS_CHART_DATA') {
        setChartData(payload.chartData);
        setDisplayData(null); // Hide the main data table
        setGroupedData(null);
        setPivotData(null);
        // No message, just show data
      }
      else if (type === 'SUCCESS_PARSE_FILE_2') {
        // The panel handles the state, but we can show the message
        setSuccessMessage(payload.message);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      else if (type === 'ERROR') {
        setError({ title: 'Processing Error', message: payload.message });
      }

      setIsProcessing(false);
    };

    workerRef.current.onerror = (err) => {
      console.error('Worker error:', err);
      setError({ title: 'Worker Failed', message: err.message });
      setIsProcessing(false);
    };

    return () => {
      workerRef.current.terminate();
    };
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('Sending file to worker...');
    setIsProcessing(true);
    setDataSummary(null);
    setDisplayData(null);
    setHiddenColumns([]);
    setError(null);
    setSuccessMessage(null);
    
    // Reset all new state
    setFormattingMap({});
    setGroupedData(null);
    setPivotData(null);
    setChartData(null);

    workerRef.current.postMessage({
      type: 'PARSE_FILE',
      payload: { file },
    });
  };

  const handleProcessRequest = (type, payload) => {
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    
    // When a new process starts, clear specialized views
    // unless it's one of *these* specific requests.
    // The worker listener will handle setting the new view.
    if (!['GROUP_AND_AGGREGATE', 'GENERATE_PIVOT_TABLE', 'GET_CHART_DATA'].includes(type)) {
       setGroupedData(null);
       setPivotData(null);
       setChartData(null);
    }
    
    workerRef.current.postMessage({
      type,
      payload,
    });
  };

  // Add worker reference to the process handler
  handleProcessRequest.worker = workerRef.current;

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
    // Only show the main data table if displayData is present
    content = (
      <DataTable
        headers={dataSummary.headers.filter(h => !hiddenColumns.includes(h))}
        data={displayData}
        totalRows={dataSummary.totalRows}
        formattingMap={formattingMap} // Pass formatting map
      />
    );
  } else if (dataSummary && !groupedData && !pivotData && !chartData) {
    // Case where filters result in 0 rows, but no special view is active
    content = (
      <DataTable
        headers={dataSummary.headers.filter(h => !hiddenColumns.includes(h))}
        data={[]}
        totalRows={0}
        formattingMap={formattingMap}
      />
    );
  } else if (dataSummary) {
    // A special view (group, pivot, chart) is active.
    // `displayData` is null, so the DataTable is hidden.
    // The `DynamicControlPanel` is responsible for rendering the special view.
    // We show a placeholder message here.
    content = (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-center">
          {groupedData ? 'Grouping results shown below.' : ''}
          {pivotData ? 'Pivot table results shown below.' : ''}
          {chartData ? 'Chart data shown below.' : ''}
        </p>
      </div>
    );
  }


  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 font-inter">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-indigo-700">
          Dynamic CSV Processor
        </h1>

        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-gray-200">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-700 hover:text-green-900"
              >
                ✕
              </button>
            </div>
          )}

          {/* Upload Section */}
          <section className="file-upload-section mb-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              1. Upload Your Data
            </h2>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-indigo-300 rounded-xl cursor-pointer hover:bg-indigo-50 transition bg-white">
              <div className="flex flex-col items-center justify-center text-gray-500">
                <svg className="w-12 h-12 mb-3 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm font-medium">Click or drag & drop your CSV file</p>
                <p className="text-xs text-gray-400">Processing happens in your browser</p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="hidden"
              />
            </label>
          </section>

          {/* Data Summary Stats */}
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
                  <span className="ml-2 font-semibold text-gray-900">
                    {dataSummary.headers.length - hiddenColumns.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Hidden:</span>
                  <span className="ml-2 font-semibold text-gray-900">{hiddenColumns.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Control Panel */}
          {dataSummary && (
            <DynamicControlPanel
              summary={dataSummary}
              isProcessing={isProcessing}
              onProcess={handleProcessRequest}
              hiddenColumns={hiddenColumns}
              worker={handleProcessRequest.worker} // Pass worker reference
            />
          )}

          {/* Data Display Section */}
          <section id="data-content" className="mt-8">
            {content}
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;