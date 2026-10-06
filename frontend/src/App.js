import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import CitizenComplaint from './pages/CitizenComplaint';
import CollectorLogin from './pages/CollectorLogin';
import CollectorDashboard from './pages/CollectorDashboard';
import StatusTracker from './pages/StatusTracker';
import DepartmentDashboard from './pages/DepartmentDashboard';

function NavBar() {
  const location = useLocation();
  
  const links = [
    { to: '/', label: 'Home', icon: '🏠' },
    { to: '/status', label: 'Track Status', icon: '🔍' },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🏛️</span>
            <span className="font-bold text-lg text-gray-800 hidden sm:block">GrievanceAI</span>
          </Link>
          <div className="flex space-x-1 overflow-x-auto">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  location.pathname === link.to 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-1">{link.icon}</span>
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/citizen" element={<CitizenComplaint />} />
            <Route path="/collector" element={<CollectorLogin />} />
            <Route path="/collector-dashboard" element={<CollectorDashboard />} />
            <Route path="/department" element={<DepartmentDashboard />} />
            <Route path="/status" element={<StatusTracker />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-gray-200 py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
            🏛️ Citizen Grievance & Government Order Auto-Routing System — Smart Cities Hackathon Demo
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;