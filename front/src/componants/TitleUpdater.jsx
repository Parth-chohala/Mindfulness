import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TitleUpdater = () => {
  const location = useLocation();
  
  useEffect(() => {
    const pageTitles = {
      '/': 'Home',
      '/planner': 'Daily Planner',
      '/goaltracker': 'Goal Tracker',
      '/meditation': 'Meditation',
      '/breaks': 'Break Tracker',
      '/productivity': 'Productivity Tracker',
      '/profile': 'User Profile'
    };
    
    const currentPage = pageTitles[location.pathname] || 'Not Found';
    document.title = `Mindfulness | ${currentPage}`;
    
    //(`Title updated to: Mindfulness | ${currentPage}`);
  }, [location]);
  
  return null; // This component doesn't render anything
};

export default TitleUpdater;

