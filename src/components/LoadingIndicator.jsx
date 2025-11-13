import React from 'react';

function LoadingIndicator({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-4">
      {/* Spinner */}
      <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>

      {/* Loading Text */}
      <p className="text-gray-700 text-lg font-medium">{text}</p>
    </div>
  );
}

export default LoadingIndicator;
