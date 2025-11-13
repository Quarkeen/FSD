import React, { useState, useEffect, useRef } from 'react';
// ⬇️ Importing the separated components
import DynamicControlPanel from './components/DynamicControlPanel';
import DataTable from './components/DataTable';
import LoadingIndicator from './components/LoadingIndicator';
import Error from './components/Error';

// --- Worker Logic ---
// Removed: The inline 'workerLogic' string is gone.

// --- Helper Components ---
// Removed: LoadingIndicator, Error, DataTable, DynamicControlPanel, and FilterRow
// are all being moved to their own files.

// --- Main App Component ---

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataSummary, setDataSummary] = useState(null);
  const [displayData, setDisplayData] = useState(null);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);

  useEffect(() => {
    //  reverted to original worker instantiation
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
        setError(null);
      } 
      else if (type === 'SUCCESS_UPDATE') {
        setDisplayData(payload.previewData);
        console.log(`✅ Data updated — rows shown: ${payload?.rowCount ?? payload.previewData.length}`);
      } 
      else if (type === 'SUCCESS_DOWNLOAD') {
        console.log('✅ CSV download triggered from worker');
        console.log('Row count:', payload?.rowCount ?? 'unknown');

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
        console.log('💾 CSV downloaded successfully.');
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
      // Removed: URL.revokeObjectURL(workerUrl) - no longer needed
    };
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('Sending file to worker...');
    setIsProcessing(true);
    setDataSummary(null);
    setDisplayData(null);
    setError(null);

    workerRef.current.postMessage({
      type: 'PARSE_FILE',
      payload: { file },
    });
  };

  const handleProcessRequest = (type, payload) => {
    setIsProcessing(true);
    setError(null);
    workerRef.current.postMessage({
      type,
      payload,
    });
  };

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
    content = (
      <DataTable
        headers={dataSummary.headers}
        data={displayData}
        totalRows={dataSummary.totalRows}
      />
    );
  } else if (dataSummary) {
    // Case where filters result in 0 rows
    content = (
      <DataTable
        headers={dataSummary.headers}
        data={[]}
        totalRows={0}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 font-inter">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-indigo-700">
          Dynamic CSV Processor
        </h1>

        <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-gray-200">
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

          {/* Dynamic Control Panel */}
          {dataSummary && (
            <DynamicControlPanel
              summary={dataSummary}
              isProcessing={isProcessing}
              onProcess={handleProcessRequest}
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