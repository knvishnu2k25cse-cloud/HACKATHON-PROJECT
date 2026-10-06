import React, { useState } from 'react';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import api from '../api';

export default function IssueCard({ issue, showResolve = false, onResolved }) {
  const [resolving, setResolving] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');

  const handleResolve = async () => {
    setResolving(true);
    try {
      await api.post(`/api/issues/${issue.id}/resolve`, { resolution_note: note || 'Resolved' });
      if (onResolved) onResolved(issue.id);
    } catch (err) {
      alert('Failed to resolve issue: ' + (err.response?.data?.error || err.message));
    }
    setResolving(false);
    setShowNoteInput(false);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 transition-all hover:shadow-md ${
      issue.priority === 'High' && issue.status === 'Pending' ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
    }`}>
      <div className="flex flex-wrap gap-2 mb-3">
        <PriorityBadge priority={issue.priority} />
        <StatusBadge status={issue.status} />
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          🏢 {issue.department}
        </span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          issue.source === 'collector_order' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {issue.source === 'collector_order' ? '📋 Collector Order' : '👤 Citizen'}
        </span>
      </div>
      
      <p className="text-gray-800 text-sm leading-relaxed mb-3">{issue.issue_text}</p>
      
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
        <span>📌 ID: {issue.complaint_id}</span>
        {issue.deadline && <span>⏰ Deadline: {issue.deadline}</span>}
        {issue.citizen_name && <span>👤 {issue.citizen_name}</span>}
        {issue.citizen_location && <span>📍 {issue.citizen_location}</span>}
      </div>

      {issue.resolution_note && issue.status === 'Resolved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 mb-3">
          <strong>Resolution:</strong> {issue.resolution_note}
          {issue.resolved_at && <span className="text-xs text-green-600 ml-2">({new Date(issue.resolved_at).toLocaleString()})</span>}
        </div>
      )}

      {showResolve && issue.status === 'Pending' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {!showNoteInput ? (
            <button
              onClick={() => setShowNoteInput(true)}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              ✅ Mark as Resolved
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Resolution note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {resolving ? 'Saving...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowNoteInput(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}