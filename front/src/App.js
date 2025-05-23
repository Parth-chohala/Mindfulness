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
import Support from './componants/Support';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-light-bg dark:bg-dark-bg text-black dark:text-white transition-colors duration-300">
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
            <Route path="/support" element={<Support />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;














