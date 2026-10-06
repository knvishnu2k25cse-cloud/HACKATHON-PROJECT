import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Demo Collector IDs for hackathon
const VALID_COLLECTOR_IDS = ['COL-001', 'COL-002', 'COL-003'];

export default function CollectorLogin() {
  const [collectorId, setCollectorId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    const trimmedId = collectorId.trim().toUpperCase();
    
    if (!trimmedId) {
      setError('Please enter a Collector ID.');
      return;
    }
    
    setLoading(true);
    
    // Simulate slight delay for realistic UX
    setTimeout(() => {
      if (VALID_COLLECTOR_IDS.includes(trimmedId)) {
        // Valid ID - redirect to dashboard
        navigate('/collector-dashboard', { state: { collectorId: trimmedId } });
      } else {
        setError('Invalid Collector ID. Please try: ' + VALID_COLLECTOR_IDS.join(', '));
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">👨💼</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">District Collector Login</h1>
        <p className="text-gray-600">Enter your Collector ID to access the dashboard</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collector ID *
            </label>
            <input
              type="text"
              placeholder="Enter Collector ID (e.g., COL-001)"
              value={collectorId}
              onChange={(e) => setCollectorId(e.target.value.toUpperCase())}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg tracking-wider disabled:bg-gray-100"
            />
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors text-lg shadow-lg shadow-purple-200"
          >
            {loading ? '🔄 Verifying...' : '🔐 Login to Dashboard'}
          </button>
        </form>

        {/* Demo Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">🎯 Demo Mode - Valid Collector IDs:</p>
          <div className="flex flex-wrap gap-2">
            {VALID_COLLECTOR_IDS.map(id => (
              <button
                key={id}
                onClick={() => setCollectorId(id)}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors"
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📊 Collector Dashboard Features:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• View all complaints across departments</li>
          <li>• Monitor high-priority issues</li>
          <li>• Track pending and resolved cases</li>
          <li>• Click any issue for detailed information</li>
          <li>• Real-time statistics and analytics</li>
        </ul>
      </div>
    </div>
  );
}