import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Spinner from '../components/Spinner';
import PriorityBadge from '../components/PriorityBadge';

export default function CitizenComplaint() {
  // OTP state
  const [aadhaar, setAadhaar] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [displayOtp, setDisplayOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [verified, setVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [formError, setFormError] = useState('');

  // Analysis state (NEW)
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedIssues, setAnalyzedIssues] = useState(null);

  // Result state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSendOtp = async () => {
    setOtpError('');
    if (!/^\d{12}$/.test(aadhaar)) {
      setOtpError('Aadhaar number must be exactly 12 digits.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await api.post('/api/otp/send', { aadhaar });
      setOtpSent(true);
      setDisplayOtp(String(res.data.demo_otp));
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Failed to send OTP.');
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    const trimmedInput = otpInput.trim();
    
    if (!trimmedInput) {
      setOtpError('Please enter a valid 6-digit OTP.');
      return;
    }
    
    if (trimmedInput.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP.');
      return;
    }
    
    if (!/^\d{6}$/.test(trimmedInput)) {
      setOtpError('Please enter a valid 6-digit OTP.');
      return;
    }

    setOtpLoading(true);
    try {
      await api.post('/api/otp/verify', { aadhaar, otp: trimmedInput });
      setVerified(true);
      setOtpError('');
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Failed to verify OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // NEW: Analyze, Split, and Automatically Submit
  const handleAnalyzeAndSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) { setFormError('Name is required.'); return; }
    if (!location.trim()) { setFormError('Location/Address is required.'); return; }
    if (!description.trim()) { setFormError('Complaint description is required.'); return; }
    if (!deadline.trim()) { setFormError('Expected deadline is required.'); return; }

    setAnalyzing(true);
    try {
      // Step 1: AI Analysis (split problems)
      const analyzeRes = await api.post('/api/complaints/analyze', {
        description: description.trim(),
        deadline: deadline.trim()
      });
      
      const issues = analyzeRes.data.issues;
      
      if (!issues || issues.length === 0) {
        throw new Error('No issues could be identified from your complaint.');
      }
      
      setAnalyzedIssues(issues);
      
      // Step 2: Automatic Submission (save to DB)
      setSubmitting(true);
      
      const submitRes = await api.post('/api/complaints/submit', {
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
        deadline: deadline.trim(),
        aadhaar,
        analyzedIssues: issues // Send pre-analyzed issues
      });
      
      setResult(submitRes.data);
    } catch (err) {
      console.error('Submission error:', err);
      setFormError(err.response?.data?.error || err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
      setSubmitting(false);
    }
  };

  // Success screen
  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center mb-6">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Complaints Submitted Successfully!</h2>
          <p className="text-green-700 mb-4">Your {result.issues?.length || 1} complaint(s) have been routed to the appropriate departments.</p>
          <div className="bg-white rounded-xl p-4 inline-block">
            <p className="text-sm text-gray-500">Your Complaint ID</p>
            <p className="text-3xl font-bold text-indigo-600">{result.complaint_id}</p>
            <p className="text-xs text-gray-400 mt-1">Save this ID to track your complaint status</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Submitted Complaints</h3>
          <div className="space-y-4">
            {result.issues && result.issues.map((issue, idx) => (
              <div key={idx} className={`rounded-xl border p-4 ${issue.priority === 'High' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-700">Problem {idx + 1}</span>
                  <PriorityBadge priority={issue.priority} />
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    🏢 {issue.department}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{issue.issue_text}</p>
                {issue.deadline && (
                  <p className="text-xs text-gray-500 mt-2">⏰ Deadline: {issue.deadline}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Link to="/status" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
            🔍 View Status
          </Link>
          <button
            onClick={() => { 
              setResult(null); 
              setAnalyzedIssues(null);
              setVerified(false); 
              setOtpSent(false); 
              setAadhaar(''); 
              setOtpInput(''); 
              setDisplayOtp('');
              setName(''); 
              setLocation(''); 
              setDescription(''); 
              setDeadline('');
              setOtpError('');
              setFormError('');
            }}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
          >
            📝 File Another Complaint
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 File a Citizen Complaint</h1>
      <p className="text-gray-600 mb-8">Verify your identity and submit your grievance. AI will automatically classify and route it.</p>

      {/* Step 1: Aadhaar Verification */}
      <div className={`bg-white rounded-2xl shadow-sm border p-6 mb-6 ${verified ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${verified ? 'bg-green-500' : 'bg-indigo-600'}`}>
            {verified ? '✓' : '1'}
          </div>
          <h2 className="text-lg font-bold text-gray-900">Identity Verification (Aadhaar OTP)</h2>
        </div>

        {verified ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-100 rounded-lg p-3">
            <span className="text-lg">✅</span>
            <span className="font-medium">Identity verified successfully! Aadhaar: {aadhaar.substring(0, 4)}****{aadhaar.substring(8)}</span>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={12}
                  placeholder="Enter 12-digit Aadhaar number"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                  disabled={otpSent}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg tracking-widest disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendOtp}
                  disabled={otpSent || otpLoading}
                  className="px-5 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {otpLoading ? '...' : 'Send OTP'}
                </button>
              </div>
            </div>

            {otpSent && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800">
                    📱 OTP sent to your registered mobile number.
                    <span className="block font-bold mt-1">🎯 Demo Mode — Your OTP is: <span className="text-xl text-indigo-600">{displayOtp}</span></span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg tracking-widest"
                  />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpLoading}
                    className="px-5 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {otpLoading ? '...' : 'Verify'}
                  </button>
                </div>
              </>
            )}

            {otpError && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg p-3">❌ {otpError}</p>
            )}
          </>
        )}
      </div>

      {/* Step 2: Complaint Form */}
      <div className={`bg-white rounded-2xl shadow-sm border p-6 mb-6 ${!verified ? 'opacity-50 pointer-events-none' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${verified ? 'bg-indigo-600' : 'bg-gray-400'}`}>
            2
          </div>
          <h2 className="text-lg font-bold text-gray-900">Complaint Details</h2>
        </div>

        {analyzing || submitting ? (
          <Spinner text={submitting ? "⏳ Submitting your complaint and routing to departments..." : "🤖 Analyzing your complaint and identifying departments..."} />
        ) : (
          // Show form
          <form onSubmit={handleAnalyzeAndSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address *</label>
                <input
                  type="text"
                  placeholder="Enter your area, locality, city"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Description *</label>
                <textarea
                  rows={5}
                  placeholder="Describe your complaint in detail. Mention all issues — our AI will split and route them automatically."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Example: "streetlight problem in our street, and water problem in our area"
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Deadline for Resolution *</label>
                <input
                  type="text"
                  placeholder="e.g., Within 1 month, 1 week, Urgent, etc."
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">❌ {formError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-lg shadow-lg shadow-indigo-200"
              >
                🔍 Analyze & Submit Complaint
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}