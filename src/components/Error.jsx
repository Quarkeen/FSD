import React from 'react';

function Error({ title = 'Error', message = 'Something went wrong.', onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-[90%] text-center">
        {/* Title */}
        <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-3">
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>

        {/* Close Button */}
        {onClose && (
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Error;
