import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div className="text-center py-12 px-4">
        <div className="text-6xl mb-4">🏛️</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Citizen Grievance & Government Order
          <br />
          <span className="text-indigo-600">Auto-Routing System</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          AI-powered grievance management for Smart Cities. Automatically classifies complaints, 
          splits multi-department issues, detects urgency, and routes to the right teams — instantly.
        </p>
      </div>

      {/* Main Three Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
        {/* Citizen Card */}
        <Link
          to="/citizen"
          className="group relative block bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-8 transition-all transform hover:scale-105 hover:shadow-2xl hover:border-indigo-400"
        >
          <div className="text-center">
            <div className="text-7xl mb-4">👥</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Citizen</h2>
            <p className="text-gray-600 mb-6">
              File a complaint about civic issues in your area. Get it routed to the right department automatically.
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl group-hover:bg-indigo-700 transition-colors">
              📝 File Complaint
              <span className="ml-2">→</span>
            </div>
          </div>
        </Link>

        {/* Collector Card */}
        <Link
          to="/collector"
          className="group relative block bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-3xl p-8 transition-all transform hover:scale-105 hover:shadow-2xl hover:border-purple-400"
        >
          <div className="text-center">
            <div className="text-7xl mb-4">👨💼</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Collector</h2>
            <p className="text-gray-600 mb-6">
              District Collector login to view and manage all grievances across departments.
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl group-hover:bg-purple-700 transition-colors">
              🔐 Collector Login
              <span className="ml-2">→</span>
            </div>
          </div>
        </Link>

        {/* Department Card */}
        <Link
          to="/department"
          className="group relative block bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-200 rounded-3xl p-8 transition-all transform hover:scale-105 hover:shadow-2xl hover:border-green-400"
        >
          <div className="text-center">
            <div className="text-7xl mb-4">🏢</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Department</h2>
            <p className="text-gray-600 mb-6">
              View department-specific complaints for your location. Read-only access.
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl group-hover:bg-green-700 transition-colors">
              🏢 View Dashboard
              <span className="ml-2">→</span>
            </div>
        </div>
        </Link>
      </div>
    </div>
  );
}