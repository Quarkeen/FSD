import React, { useState } from 'react';
import DownloadModal from '../DownloadModal';

function DownloadSection({ isProcessing, downloading, setDownloading, onProcess }) {
  const [showModal, setShowModal] = useState(false);

  const handleDownloadClick = () => {
    setShowModal(true);
  };

  const handleConfirmDownload = (fileName, destinationPath) => {
    setDownloading(true);
    setShowModal(false);
    onProcess('DOWNLOAD_FILE', { customFileName: fileName, destinationPath });
    setTimeout(() => setDownloading(false), 2000);
  };

  const handleCancelDownload = () => {
    setShowModal(false);
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
      
      <DownloadModal
        isOpen={showModal}
        onConfirm={handleConfirmDownload}
        onCancel={handleCancelDownload}
        isProcessing={isProcessing || downloading}
      />
    </div>
  );
}

export default DownloadSection;
