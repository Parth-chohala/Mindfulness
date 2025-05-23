import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import timerService from '../services/TimerService';
import GoalTracker from './Goaltraker';
import AuthDialog from './AuthDialog';
import WelcomeDialog from './WelcomeDialog';

export default function FocusTimer() {
  const [timerState, setTimerState] = useState(() => {
    try {
      return timerService.getState();
    } catch (error) {
      console.error("Error getting timer state:", error);
      return {
        seconds: 0,
        isRunning: false,
        isOnBreak: false,
        workDuration: 0,
        breakDuration: 0
      };
    }
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [workDuration, setWorkDuration] = useState(() => {
    const saved = localStorage.getItem('workDuration');
    return saved ? parseInt(saved, 10) : 25;
  });
  const [breakDuration, setBreakDuration] = useState(() => {
    const saved = localStorage.getItem('breakDuration');
    return saved ? parseInt(saved, 10) : 5;
  });
  
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    // Initial state
    try {
      // Make sure we have the latest user ID
      timerService.updateUserId();
      
      // Get initial state
      setTimerState(timerService.getState());
      
      // Subscribe to updates
      const unsubscribe = timerService.subscribe(newState => {
        //("FocusTimer received new state:", newState);
        setTimerState(newState);
      });
      
      // Fetch timer data to ensure we have the latest
      timerService.fetchTimerData().then((result) => {
        // Update state after fetch
        setTimerState(timerService.getState());
        
        // If timer should be running but isn't, restart it
        const currentState = timerService.getState();
        if (currentState.isRunning) {
          //("Timer should be running, ensuring it's active");
          if (currentState.isOnBreak) {
            //("Ensuring break timer is running");
          } else {
            //("Ensuring work timer is running");
          }
        }
      }).catch(err => {
        console.error("Error fetching timer data:", err);
      });
      
      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error("Error in FocusTimer useEffect:", error);
    }
  }, []);

  const formatTime = (seconds) => {
    // Ensure seconds is a valid number
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      seconds = 0;
    }
    
    // Cap at reasonable maximum (24 hours)
    const maxSeconds = 24 * 60 * 60;
    if (seconds > maxSeconds) {
      console.warn(`Timer value too large: ${seconds}s, capping at ${maxSeconds}s`);
      seconds = maxSeconds;
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!isAuthenticated) {
      setShowWelcomeDialog(true);
      return;
    }
    timerService.startTimer();
  };

  const handlePause = () => {
    timerService.pauseTimer();
  };

  const handleSettings = () => {
    if (!isAuthenticated) {
      setShowWelcomeDialog(true);
      return;
    }
    setShowSettings(true);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('workDuration', workDuration);
    localStorage.setItem('breakDuration', breakDuration);
    setShowSettings(false);
  };
  
  const handleCloseAuthDialog = () => {
    setShowAuthDialog(false);
  };
  
  const handleCloseWelcomeDialog = () => {
    setShowWelcomeDialog(false);
  };
  
  const handleLoginRegisterClick = () => {
    setShowWelcomeDialog(false);
    setShowAuthDialog(true);
  };

  // Add a reset handler
  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the timer? This will clear all current progress.")) {
      timerService.resetTimerState();
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
        <GoalTracker />
      <div className="w-full max-w-md bg-[#1e1e1e] rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Focus Timer</h1>
        
        <div className="text-center mb-8">
          <div className="text-6xl font-mono">{formatTime(timerState.seconds)}</div>
          {timerState.isOnBreak && (
            <div className="text-red-500 mt-2 animate-pulse">Break Time</div>
          )}
        </div>
        
        <div className="flex justify-center space-x-2 mt-4">
          {!timerState.isRunning ? (
            <button
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded text-sm transition-colors"
              onClick={handleStart}
            >
              Start
            </button>
          ) : (
            <button
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors"
              onClick={handlePause}
              disabled={!isAuthenticated}
            >
              Pause
            </button>
          )}
          
          <button
            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
            onClick={handleSettings}
          >
            Settings
          </button>
          
          <button
            className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm transition-colors"
            onClick={handleReset}
            title="Reset timer"
          >
            Reset
          </button>
        </div>
        
        <div className="flex justify-between text-sm text-gray-400">
          <div>Work: {workDuration} min</div>
          <div>Break: {breakDuration} min</div>
        </div>
        
        {!isAuthenticated && (
          <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-800 rounded-md">
            <p className="text-yellow-200 text-sm">
              Please <button 
                onClick={() => setShowAuthDialog(true)}
                className="text-teal-400 hover:underline"
              >
                login or register
              </button> to use the timer and save your progress.
            </p>
          </div>
        )}
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center p-4 z-50">
          <div className="bg-[#2a2a2a] rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Timer Settings</h2>
            
            <div className="mb-4">
              <label className="block mb-2">Work Duration (minutes)</label>
              <input 
                type="number" 
                value={workDuration}
                onChange={(e) => setWorkDuration(parseInt(e.target.value))}
                className="w-full p-2 bg-[#333] border border-[#444] rounded text-white"
              />
            </div>
            
            <div className="mb-6">
              <label className="block mb-2">Break Duration (minutes)</label>
              <input 
                type="number" 
                value={breakDuration}
                onChange={(e) => setBreakDuration(parseInt(e.target.value))}
                className="w-full p-2 bg-[#333] border border-[#444] rounded text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-600 text-white rounded"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleSaveSettings}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Auth Dialog */}
      {showAuthDialog && (
        <AuthDialog 
          open={showAuthDialog} 
          onClose={handleCloseAuthDialog} 
        />
      )}
      
      {/* Welcome Dialog */}
      {showWelcomeDialog && (
        <WelcomeDialog
          open={showWelcomeDialog}
          onClose={handleCloseWelcomeDialog}
        />
      )}
    </div>
  );
}
