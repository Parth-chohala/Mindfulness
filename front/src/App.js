// Root Component Structure for Mindfulness App
// Note: Uses TailwindCSS for styling and react-router-dom for routing

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toastContainerConfig } from './utils/toastStyles';

// Import components with correct paths
import Navbar from './componants/Navbar';
import TitleUpdater from './componants/TitleUpdater';
import Home from './componants/Home';
import DailyPlanner from './componants/DailyPlanner';
import Meditation from './componants/Meditation';
import Goaltraker from './componants/Goaltraker';
import Profile from './componants/Profile';

// Create a simple ProtectedRoute component if it doesn't exist
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    // If not authenticated, show a message or redirect
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#121212] text-white p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-4">Please login to access this page.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-teal-600"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // If authenticated, render the children
  return children;
};

function App() {
  return (
    <Router>

      <div className="App min-h-screen bg-[#121212] text-white">
        <TitleUpdater />
        <Navbar />
        <ToastContainer {...toastContainerConfig} />
        <div className="pt-20"> {/* Padding to account for fixed navbar */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/planner" element={
              <ProtectedRoute>
                <DailyPlanner />
              </ProtectedRoute>
            } />
            <Route path="/meditation" element={
              <ProtectedRoute>
                <Meditation />
              </ProtectedRoute>
            } />
            <Route path="/goaltracker" element={
              <ProtectedRoute>
                <Goaltraker />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;












