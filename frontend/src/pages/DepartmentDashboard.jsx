import React, { useState, useEffect } from 'react';
import api from '../api';
import Spinner from '../components/Spinner';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';

export default function DepartmentDashboard() {
  const [step, setStep] = useState(1); // 1 = location entry, 2 = department selection, 3 = dashboard
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState('');

  const departments = [
    'Water Supply',
    'Roads & Infrastructure',
    'Electricity',
    'Sanitation',
    'Health',
    'Education',
    'Revenue/Land Records',
    'General Administration'
  ];

  const handleLocationSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!city.trim()) {
      setError('City is required.');
      return;
    }

    if (!pinCode.trim() || !/^\d{6}$/.test(pinCode)) {
      setError('Valid 6-digit PIN code is required.');
      return;
    }

    setStep(2);
  };

  const handleDepartmentSelect = async (dept) => {
    setSelectedDepartment(dept);
    setStep(3);
    setLoading(true);
    
    try {
      const res = await api.get(`/api/dashboard/department/${encodeURIComponent(dept)}`);
      setIssues(res.data.issues || []);
    } catch (err) {
      setError('Failed to load complaints. Please try again.');
    }
    setLoading(false);
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setIssues([]);
    } else if (step === 2) {
      setStep(1);
    }
  };

  // Step 1: Location Entry
  if (step === 1) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Department Dashboard</h1>
          <p className="text-gray-600">Enter your city and PIN code to access complaints</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleLocationSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  placeholder="Enter city name (e.g., Salem)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN code"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg tracking-wider"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">❌ {error}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors text-lg shadow-lg shadow-green-200"
              >
                Continue →
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 2: Department Selection
  if (step === 2) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleBack}
          className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Department</h1>
          <p className="text-gray-600">City: {city} | PIN: {pinCode}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => handleDepartmentSelect(dept)}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-500 hover:shadow-lg transition-all text-left"
            >
              <h3 className="font-bold text-gray-900 mb-2">{dept}</h3>
              <p className="text-sm text-gray-500">View complaints →</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 3: Department Complaints (Read-Only)
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={handleBack}
            className="mb-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Departments
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{selectedDepartment}</h1>
          <p className="text-gray-600">City: {city} | PIN: {pinCode} | Read-Only View</p>
        </div>
      </div>

      {loading ? (
        <Spinner text="Loading complaints..." />
      ) : (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              📋 <strong>Read-Only Access:</strong> You can view complaints but cannot edit or delete them.
            </p>
          </div>

          {issues.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500">No complaints found for this department.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`bg-white rounded-xl shadow-sm border p-5 ${
                    issue.priority === 'High' && issue.status === 'Pending'
                      ? 'border-red-300 bg-red-50/30'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    <PriorityBadge priority={issue.priority} />
                    <StatusBadge status={issue.status} />
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      📌 {issue.complaint_id}
                    </span>
                    {issue.source === 'collector_order' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        📋 Collector Order
                      </span>
                    )}
                  </div>

                  <p className="text-gray-800 text-sm leading-relaxed mb-3">{issue.issue_text}</p>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    {issue.citizen_name && <span>👤 {issue.citizen_name}</span>}
                    {issue.citizen_location && <span>📍 {issue.citizen_location}</span>}
                    {issue.deadline && <span>⏰ Deadline: {issue.deadline}</span>}
                    {issue.complaint_date && (
                      <span>📅 {new Date(issue.complaint_date).toLocaleDateString()}</span>
                    )}
                  </div>

                  {issue.status === 'Resolved' && issue.resolution_note && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-green-600">
                        ✅ <strong>Resolved:</strong> {issue.resolution_note}
                      </p>
                      {issue.resolved_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(issue.resolved_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}