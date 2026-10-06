import React, { useState } from 'react';
import api from '../api';
import Spinner from '../components/Spinner';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';

export default function StatusTracker() {
  const [complaintId, setComplaintId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!complaintId.trim()) {
      setError('Please enter a Complaint ID.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/api/status/${encodeURIComponent(complaintId.trim().toUpperCase())}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to find complaint. Please check the ID.');
    }
    setLoading(false);
  };

  const allResolved = result?.issues?.every(i => i.status === 'Resolved');
  const pendingCount = result?.issues?.filter(i => i.status === 'Pending').length || 0;
  const resolvedCount = result?.issues?.filter(i => i.status === 'Resolved').length || 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 Track Your Complaint</h1>
      <p className="text-gray-600 mb-8">Enter your Complaint ID to check the current status of your grievance.</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Complaint ID (e.g., GRV-2025-001)"
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {loading ? '...' : '🔍 Search'}
          </button>
        </form>
        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg p-3">❌ {error}</p>
        )}

        {/* Quick links to sample complaints */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Try these sample IDs:</p>
          <div className="flex flex-wrap gap-2">
            {['GRV-2025-001', 'GRV-2025-002', 'GRV-2025-003', 'GRV-2025-008'].map(id => (
              <button
                key={id}
                onClick={() => { setComplaintId(id); }}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <Spinner text="Searching for your complaint..." />}

      {result && (
        <div>
          {/* Overall Status */}
          <div className={`rounded-2xl p-6 mb-6 text-center ${
            allResolved ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="text-4xl mb-3">{allResolved ? '✅' : '⏳'}</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Complaint {result.complaint_id}
            </h2>
            <p className={`font-medium ${allResolved ? 'text-green-700' : 'text-blue-700'}`}>
              {allResolved ? 'All issues have been resolved!' : `${pendingCount} issue(s) pending, ${resolvedCount} resolved`}
            </p>
          </div>

          {/* Complaint Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📄 Complaint Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-500">Source:</span>
                <span className="ml-2 font-medium">{result.source === 'collector_order' ? '📋 Collector Order' : '👤 Citizen Complaint'}</span>
              </div>
              {result.citizen_name && (
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 font-medium">{result.citizen_name}</span>
                </div>
              )}
              {result.location && (
                <div>
                  <span className="text-gray-500">Location:</span>
                  <span className="ml-2 font-medium">{result.location}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Submitted:</span>
                <span className="ml-2 font-medium">{new Date(result.submitted_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Original complaint text:</p>
              <p className="text-sm text-gray-700">{result.original_text}</p>
            </div>
          </div>

          {/* Issues Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📋 Issue Status ({result.issues.length} issue{result.issues.length > 1 ? 's' : ''})
            </h3>
            <div className="space-y-4">
              {result.issues.map((issue, idx) => (
                <div
                  key={issue.id}
                  className={`rounded-xl border p-4 ${
                    issue.status === 'Resolved' ? 'border-green-200 bg-green-50/50' : 
                    issue.priority === 'High' ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">Issue #{idx + 1}</span>
                    <div className="flex gap-2">
                      <PriorityBadge priority={issue.priority} />
                      <StatusBadge status={issue.status} />
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      🏢 Handled by: {issue.department}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{issue.issue_text}</p>
                  {issue.deadline && (
                    <p className="text-xs text-gray-500">⏰ Deadline: {issue.deadline}</p>
                  )}
                  {issue.resolution_note && issue.status === 'Resolved' && (
                    <div className="mt-3 bg-green-100 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        <strong>✅ Resolution:</strong> {issue.resolution_note}
                      </p>
                      {issue.resolved_at && (
                        <p className="text-xs text-green-600 mt-1">Resolved on: {new Date(issue.resolved_at).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}