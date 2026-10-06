import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Spinner from '../components/Spinner';
import PriorityBadge from '../components/PriorityBadge';

export default function CollectorOrder() {
  const [mode, setMode] = useState('text'); // 'text' or 'upload'
  const [orderText, setOrderText] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [ocrProgress, setOcrProgress] = useState('');

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!orderText.trim()) {
      setError('Order text cannot be empty.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/api/collector/submit-text', { text: orderText.trim() });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process order.');
    }
    setSubmitting(false);
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setSubmitting(true);
    setOcrProgress('Uploading file and running OCR...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/collector/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000 // 2 min for OCR
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process uploaded file.');
    }
    setSubmitting(false);
    setOcrProgress('');
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-8 text-center mb-6">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-purple-800 mb-2">Order Processed Successfully!</h2>
          <p className="text-purple-700 mb-4">The order has been analyzed and routed to the appropriate department(s).</p>
          <div className="bg-white rounded-xl p-4 inline-block">
            <p className="text-sm text-gray-500">Order Reference ID</p>
            <p className="text-3xl font-bold text-indigo-600">{result.complaint_id}</p>
          </div>
        </div>

        {result.extracted_text && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">📄 Extracted Text (OCR)</h3>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{result.extracted_text}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📋 AI Analysis — Routed Issues</h3>
          <div className="space-y-4">
            {result.issues.map((issue, idx) => (
              <div key={idx} className={`rounded-xl border p-4 ${issue.priority === 'High' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex flex-wrap gap-2 mb-2">
                  <PriorityBadge priority={issue.priority} />
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    🏢 {issue.department}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{issue.issue_text}</p>
                {issue.deadline && <p className="text-xs text-gray-500 mt-2">⏰ Deadline: {issue.deadline}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Link to="/collector-dashboard" className="px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors">
            📊 View Dashboard
          </Link>
          <button
            onClick={() => { setResult(null); setOrderText(''); setFile(null); }}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
          >
            📋 Submit Another Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 District Collector Order Input</h1>
      <p className="text-gray-600 mb-8">
        Enter a collector's order via text or upload a scanned document. 
        AI will analyze, split into department-specific directives, and route automatically.
      </p>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('text')}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            mode === 'text' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ✏️ Paste Text
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            mode === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📤 Upload Image/PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {submitting ? (
          <Spinner text={ocrProgress || "🤖 AI is analyzing the order, identifying departments, and routing..."} />
        ) : mode === 'text' ? (
          <form onSubmit={handleTextSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order Text *</label>
            <textarea
              rows={8}
              placeholder={`Paste the collector's order here...\n\nExample:\n"Order No. DC/2025/147: Water Supply dept to clean all storm drains. Roads dept to fill potholes. Health dept to begin anti-dengue fogging. Deadline: 15 days."`}
              value={orderText}
              onChange={(e) => setOrderText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg p-3">❌ {error}</p>}
            <button
              type="submit"
              className="w-full mt-4 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors text-lg shadow-lg shadow-purple-200"
            >
              🚀 Analyze & Route
            </button>
          </form>
        ) : (
          <form onSubmit={handleFileSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Scanned Order (Image or PDF)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/tiff,application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="fileUpload"
              />
              <label htmlFor="fileUpload" className="cursor-pointer">
                <div className="text-4xl mb-3">📄</div>
                <p className="text-gray-600 font-medium">
                  {file ? file.name : 'Click to select a file'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPEG, TIFF, PDF — max 10MB</p>
              </label>
            </div>
            {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg p-3">❌ {error}</p>}
            <button
              type="submit"
              className="w-full mt-4 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors text-lg shadow-lg shadow-purple-200"
            >
              📤 Upload & Analyze
            </button>
          </form>
        )}
      </div>
    </div>
  );
}