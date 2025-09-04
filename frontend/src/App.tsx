import React, { useState } from 'react';
import Homepage from './pages/Homepage';
import { Dashboard } from './components/Dashboard';

function App() {
  const [showDashboard, setShowDashboard] = useState(true);

  if (showDashboard) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowDashboard(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
        >
          View Dashboard
        </button>
      </div>
      <Homepage />
    </div>
  );
}

export default App;
