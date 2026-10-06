import React from 'react';

export default function StatusBadge({ status }) {
  if (status === 'Resolved') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
        ✅ Resolved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
      ⏳ Pending
    </span>
  );
}