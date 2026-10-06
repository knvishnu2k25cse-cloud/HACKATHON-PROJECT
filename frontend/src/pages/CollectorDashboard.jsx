import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import Spinner from '../components/Spinner';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';

export default function CollectorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'resolved', 'high'
  const [selectedIssue, setSelectedIssue] = useState(null); // For detail view modal
  const [resolving, setResolving] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/api/dashboard/collector');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch collector dashboard:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleIssueClick = (issue) => {
    setSelectedIssue(issue);
    setShowResolveForm(false);
    setResolutionNote('');
  };

  const handleResolve = async () => {
    if (!selectedIssue) return;
    
    setResolving(true);
    try {
      await api.post(`/api/issues/${selectedIssue.id}/resolve`, { 
        resolution_note: resolutionNote || 'Resolved' 
      });
      setSelectedIssue({...selectedIssue, status: 'Resolved'});
      fetchData(); // Refresh dashboard data
      setShowResolveForm(false);
      setResolutionNote('');
    } catch (err) {
      alert('Failed to resolve issue: ' + (err.response?.data?.error || err.message));
    }
    setResolving(false);
  };

  if (loading) return <Spinner text="Loading collector dashboard..." />;
  if (!data) return <div className="text-center py-12 text-red-500">Failed to load dashboard data.</div>;

  const { stats, departmentBreakdown, issues } = data;
  
  const highPriorityIssues = issues.filter(i => i.priority === 'High' && i.status === 'Pending');
  
  let filteredIssues = issues;
  if (filter === 'pending') filteredIssues = issues.filter(i => i.status === 'Pending');
  else if (filter === 'resolved') filteredIssues = issues.filter(i => i.status === 'Resolved');
  else if (filter === 'high') filteredIssues = highPriorityIssues;

  // Clickable Issue Card Component
  const ClickableIssueCard = ({ issue }) => (
    <div 
      onClick={() => handleIssueClick(issue)}
      className={`bg-white rounded-xl shadow-sm border p-5 transition-all hover:shadow-md hover:cursor-pointer ${
        issue.priority === 'High' && issue.status === 'Pending' ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
      }`}
    >
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
      
      <p className="text-gray-800 text-sm leading-relaxed mb-3 line-clamp-2">{issue.issue_text}</p>
      
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span>📌 ID: {issue.complaint_id}</span>
        {issue.deadline && <span>⏰ Deadline: {issue.deadline}</span>}
        {issue.citizen_name && <span>👤 {issue.citizen_name}</span>}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Collector Dashboard</h1>
          <p className="text-gray-600">Complete overview of all grievances across departments</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm">
          🔄 Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">{stats.totalComplaints}</p>
          <p className="text-xs text-gray-500 mt-1">Total Complaints</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.totalIssues}</p>
          <p className="text-xs text-gray-500 mt-1">Total Issues</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-4 text-center bg-yellow-50">
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-yellow-600 mt-1">Pending</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-4 text-center bg-green-50">
          <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
          <p className="text-xs text-green-600 mt-1">Resolved</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 text-center bg-red-50">
          <p className="text-3xl font-bold text-red-600">{stats.highPriority}</p>
          <p className="text-xs text-red-600 mt-1">🔴 High Priority</p>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📈 Department Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(departmentBreakdown).map(([dept, deptStats]) => (
            <div key={dept} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="font-medium text-gray-800 text-sm mb-2 truncate">{dept}</h3>
              <div className="flex gap-3 text-xs">
                <span className="text-blue-600">{deptStats.total} total</span>
                <span className="text-yellow-600">{deptStats.pending} pending</span>
                <span className="text-green-600">{deptStats.resolved} resolved</span>
              </div>
              {deptStats.high > 0 && (
                <span className="text-xs text-red-600 font-bold">🔴 {deptStats.high} high priority</span>
              )}
              {/* Progress bar */}
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 rounded-full h-2 transition-all"
                  style={{ width: `${deptStats.total > 0 ? (deptStats.resolved / deptStats.total * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* High Priority Alert Section */}
      {highPriorityIssues.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-red-800 mb-4">
            🚨 High Priority Issues ({highPriorityIssues.length} pending)
          </h2>
          <div className="space-y-4">
            {highPriorityIssues.slice(0, 5).map(issue => (
              <ClickableIssueCard key={issue.id} issue={issue} />
            ))}
            {highPriorityIssues.length > 5 && (
              <button
                onClick={() => setFilter('high')}
                className="text-red-600 font-medium text-sm hover:underline"
              >
                View all {highPriorityIssues.length} high priority issues →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter & All Issues */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All Issues', count: issues.length },
          { key: 'pending', label: 'Pending', count: stats.pending },
          { key: 'resolved', label: 'Resolved', count: stats.resolved },
          { key: 'high', label: 'High Priority', count: highPriorityIssues.length },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500">No issues match this filter.</p>
          </div>
        ) : (
          filteredIssues.map(issue => (
            <ClickableIssueCard key={issue.id} issue={issue} />
          ))
        )}
      </div>

      {/* Detail View Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedIssue(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Issue Details</h2>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Issue Details */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <PriorityBadge priority={selectedIssue.priority} />
                  <StatusBadge status={selectedIssue.status} />
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    🏢 {selectedIssue.department}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedIssue.source === 'collector_order' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedIssue.source === 'collector_order' ? '📋 Collector Order' : '👤 Citizen Complaint'}
                  </span>
                </div>

                {/* Detailed Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Complaint ID</h3>
                      <p className="text-lg font-mono">{selectedIssue.complaint_id}</p>
                    </div>
                    {selectedIssue.citizen_name && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Citizen Name</h3>
                        <p className="text-lg">{selectedIssue.citizen_name}</p>
                      </div>
                    )}
                    {selectedIssue.citizen_location && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Location / Address</h3>
                        <p className="text-lg">{selectedIssue.citizen_location}</p>
                      </div>
                    )}
                    {selectedIssue.complaint_date && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Submitted Date</h3>
                        <p className="text-lg">{new Date(selectedIssue.complaint_date).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Deadline</h3>
                      <p className={`text-lg font-medium ${selectedIssue.priority === 'High' ? 'text-red-600' : 'text-indigo-600'}`}>
                        {selectedIssue.deadline || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Current Status</h3>
                      <StatusBadge status={selectedIssue.status} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Priority Level</h3>
                      <PriorityBadge priority={selectedIssue.priority} />
                    </div>
                    {selectedIssue.resolution_note && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Resolution Note</h3>
                        <p className="text-lg text-green-600">{selectedIssue.resolution_note}</p>
                        {selectedIssue.resolved_at && (
                          <p className="text-sm text-gray-500 mt-1">
                            Resolved on: {new Date(selectedIssue.resolved_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Full Description */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Full Complaint Description</h3>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedIssue.issue_text}</p>
                  </div>
                </div>

                {/* Resolve Action for Pending Issues */}
                {selectedIssue.status === 'Pending' && (
                  <div className="pt-4 border-t border-gray-200">
                    {!showResolveForm ? (
                      <button
                        onClick={() => setShowResolveForm(true)}
                        className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
                      >
                        ✅ Mark as Resolved
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Resolution Note (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="Brief note about the resolution"
                            value={resolutionNote}
                            onChange={(e) => setResolutionNote(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleResolve}
                            disabled={resolving}
                            className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {resolving ? 'Saving...' : 'Confirm Resolution'}
                          </button>
                          <button
                            onClick={() => setShowResolveForm(false)}
                            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}