import React from 'react';

export default function Spinner({ text = 'Processing...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
      <p className="text-gray-600 text-sm animate-pulse">{text}</p>
    </div>
  );
}