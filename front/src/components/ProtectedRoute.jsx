import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';
import { Brain } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const userId = localStorage.getItem('userId');
      const authStatus = localStorage.getItem('isAuthenticated');
      
      if (userId && authStatus === 'true') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    // Add a small delay to simulate checking auth
    const timer = setTimeout(() => {
      checkAuth();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          backgroundColor: '#121212',
          color: 'white'
        }}
      >
        <Brain size={60} className="text-teal-500 mb-4 animate-pulse" />
        <CircularProgress size={30} sx={{ color: '#00a0a0', mb: 2 }} />
        <Typography variant="body1" sx={{ color: '#aaaaaa' }}>
          Verifying your session...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to home page with the return url
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;

