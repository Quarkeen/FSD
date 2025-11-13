import React from 'react';

function DownloadSection({ isProcessing, downloading, setDownloading, onProcess }) {
  const handleDownloadClick = () => {
    setDownloading(true);
    onProcess('DOWNLOAD_FILE');
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-600 mb-2">Download Data</h3>
      <p className="text-sm text-gray-500 mb-2">
        Download the currently filtered and sorted data as a new .csv file.
      </p>
      <button
        type="button"
        onClick={handleDownloadClick}
        disabled={isProcessing || downloading}
        className="w-full md:w-auto bg-green-600 text-white py-2 px-6 rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400"
      >
        {downloading || isProcessing ? 'Preparing...' : 'Download Processed CSV'}
      </button>
    </div>
  );
}

export default DownloadSection;
