import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Settings, Coffee, Plus, Trash, RefreshCw, X } from 'lucide-react';
// import './css/home.css';
import timerService from '../services/TimerService';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toastStyles';
import AuthDialog from './AuthDialog';
import WelcomeDialog from './WelcomeDialog';

// Enhanced sticky note component with Tailwind CSS
const StickyNote = ({ note, onUpdate, onDelete, onColorChange, isAuthenticated, onAuthRequired }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Updated colors for sticky notes with darker backgrounds
  const colors = [
    { bg: 'bg-[#2d3748]', border: 'border-teal-400' }, // Default teal
    { bg: 'bg-[#322659]', border: 'border-purple-400' }, // Purple
    { bg: 'bg-[#1a365d]', border: 'border-blue-400' }, // Blue
    { bg: 'bg-[#744210]', border: 'border-yellow-400' }, // Yellow
    { bg: 'bg-[#702459]', border: 'border-pink-400' }, // Pink
  ];

  // Get current color classes or default
  const currentBg = note.color?.bg || 'bg-[#2d3748]';
  const currentBorder = note.color?.border || 'border-teal-400';

  // Handle textarea change with auth check
  const handleTextareaChange = (e) => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    onUpdate(note.id, e.target.value);
  };

  // Handle delete with auth check
  const handleDelete = () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    onDelete(note.id);
  };

  return (
    <div
      className={`w-full ${isExpanded ? 'h-48 sm:h-56' : 'h-32 sm:h-40'} 
        ${currentBg} text-white rounded-lg shadow-lg 
        overflow-hidden flex flex-col relative border-2 
        ${currentBorder} transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`}
    >
      <textarea
        className="flex-grow p-2 resize-none bg-[#2d3748] text-white focus:outline-none text-xs sm:text-sm"
        value={note.content}
        onChange={handleTextareaChange}
        placeholder="Write a note..."
      />
      <div className="p-1 flex justify-end">
        <button
          className="p-1 text-white hover:text-red-400 transition-colors"
          onClick={handleDelete}
          aria-label="Delete note"
        >
          <Trash size={14} />
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  // State variables for timer, work/break durations, and logs
  const [timerState, setTimerState] = useState(() => {
    try {
      // Get initial state from timer service
      const initialState = timerService.getState();
      //('Initializing timer state with:', initialState);
      return initialState || {
        seconds: 0,
        isRunning: false,
        isOnBreak: false,
        sessionStart: null,
        breakStart: null,
        workLogs: [],
        breakLogs: [],
        workDuration: 0,
        breakDuration: 0,
        timerId: null
      };
    } catch (error) {
      console.error("Error getting initial timer state:", error);
      // Return default state if there's an error
      return {
        seconds: 0,
        isRunning: false,
        isOnBreak: false,
        sessionStart: null,
        breakStart: null,
        workLogs: [],
        breakLogs: [],
        workDuration: 0,
        breakDuration: 0,
        timerId: null
      };
    }
  });
  const [workDuration, setWorkDuration] = useState(timerService.workDurationSetting || 0); // Default work duration (in minutes)
  const [breakDuration, setBreakDuration] = useState(timerService.breakDurationSetting || 0); // Default break duration (in minutes)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Dialog box visibility
  const [logs, setLogs] = useState(() => {
    try {
      const savedLogs = localStorage.getItem("timerLogs");
      return savedLogs ? JSON.parse(savedLogs) : [];
    } catch (e) {
      console.error("Error loading logs:", e);
      return [];
    }
  }); // Logs for start/stop actions
  const [stickyNotes, setStickyNotes] = useState([]); // State for sticky notes
  const [notifiedForWork, setNotifiedForWork] = useState(false); // Track if we've notified for current work session
  const [notifiedForBreak, setNotifiedForBreak] = useState(false); // Track if we've notified for current break session
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [showSettings, setShowSettings] = useState(false);
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem('notes');
    return savedNotes ? JSON.parse(savedNotes) : [];
  });
  const [workdurationofuser, setWorkdurationofuser] = useState(timerService.getTotalWorkDuration());
  const [breakdurationofuser, setbreakurationofuser] = useState(timerService.getTotalBreakDuration());
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  // Add state for save status
  const [saveStatus, setSaveStatus] = useState({ saving: false, lastSaved: null });

  // Add state for auto-save interval

  const logsRef = useRef(null); // Ref to the logs container to scroll automatically

  // Subscribe to timer service updates with better error handling
  useEffect(() => {
    //("Home component mounted");

    // Check if user just logged in
    const justLoggedIn = localStorage.getItem('justLoggedIn');
    if (justLoggedIn === 'true') {
      //("User just logged in, clearing logs in Home component");
      setLogs([]);
      localStorage.removeItem('timerLogs');
    }

    // Load sticky notes
    loadStickyNotes();

    // Update user ID in timer service
    timerService.updateUserId();

    // Get initial timer state
    const initialState = timerService.getState();
    //("Initial timer state in Home:", initialState);
    setTimerState(initialState);

    // Initialize logs from timer service
    if (initialState.workLogs || initialState.breakLogs) {
      const combinedLogs = [
        ...(initialState.workLogs || []).map(log => ({
          type: 'session',
          start: log.start,
          end: log.end,
          duration: log.duration,
          durationSeconds: log.durationSeconds
        })),
        ...(initialState.breakLogs || []).map(log => ({
          type: 'break',
          start: log.start,
          end: log.end,
          duration: log.duration,
          durationSeconds: log.durationSeconds
        }))
      ].sort((a, b) => new Date(b.start) - new Date(a.start));

      //("Setting logs from timer service:", combinedLogs);
      setLogs(combinedLogs);
    }

    // Subscribe to timer service updates
    const unsubscribe = timerService.subscribe(newState => {
      //("Timer update received in Home:", newState);
      setTimerState(prevState => {
        // Only update if the new state is different
        if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
          return newState;
        }
        return prevState;
      });
    });

    // Clean up on unmount
    return () => {
      //("Home component unmounting");
      unsubscribe();
    };
  }, []);
  // Home component maintains its own logs state
  useEffect(() => {
    //("Logs updated in Home:", logs);
    localStorage.setItem('timerLogs', JSON.stringify(logs));

    // Only update timer service logs if we have logs and they're different
    if (logs && logs.length > 0) {
      const workLogs = logs.filter(val => val.type === "session");
      const breakLogs = logs.filter(val => val.type === "break");

      // Check if logs are different from timer service logs
      const timerWorkLogs = timerService.workLogs || [];
      const timerBreakLogs = timerService.breakLogs || [];

      const workLogsDifferent = JSON.stringify(workLogs) !== JSON.stringify(timerWorkLogs);
      const breakLogsDifferent = JSON.stringify(breakLogs) !== JSON.stringify(timerBreakLogs);

      if (workLogsDifferent || breakLogsDifferent) {
        //("Updating timer service logs from Home component");
        timerService.workLogs = workLogs;
        timerService.breakLogs = breakLogs;
        timerService.saveState();
        timerService.hasChangedSinceLastSave = true;
      }
    }
  }, [logs]);

  // Add function to get user-specific localStorage key
  const getUserSpecificKey = (baseKey) => {
    const userId = localStorage.getItem('userId');
    return userId ? `${baseKey}_${userId}` : baseKey;
  };

  // Save sticky notes to localStorage
  const saveStickyNotes = (notes) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        //("No user ID, skipping sticky notes save");
        return;
      }

      const key = getUserSpecificKey('stickyNotes');
      localStorage.setItem(key, JSON.stringify(notes));
      //(`Saved ${notes.length} sticky notes for user ${userId}`);
    } catch (e) {
      console.error("Error saving sticky notes:", e);
    }
  };

  // Load sticky notes from localStorage
  const loadStickyNotes = () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        //("No user ID, skipping sticky notes load");
        return;
      }

      const key = getUserSpecificKey('stickyNotes');
      const savedNotes = localStorage.getItem(key);
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        setStickyNotes(Array.isArray(parsedNotes) ? parsedNotes : []);
        //(`Loaded ${parsedNotes.length} sticky notes for user ${userId}`);
      }
    } catch (e) {
      console.error("Error loading sticky notes:", e);
      setStickyNotes([]);
    }
  };

  // Add sticky note
  const addStickyNote = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    const defaultColor = { bg: 'bg-gray-800', border: 'border-teal-400' };
    const newNote = {
      id: Date.now(),
      content: '',
      color: defaultColor,
      lastEdited: new Date().toISOString()
    };
    setStickyNotes((prevNotes) => {
      const updatedNotes = [...prevNotes, newNote];
      saveStickyNotes(updatedNotes);
      return updatedNotes;
    });
  };

  // Update sticky note
  const updateStickyNote = (id, content) => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    setStickyNotes((prevNotes) => {
      // Ensure prevNotes is an array
      const notesArray = Array.isArray(prevNotes) ? prevNotes : [];

      const updatedNotes = notesArray.map((note) =>
        note.id === id ? { ...note, content, lastEdited: new Date().toISOString() } : note
      );
      saveStickyNotes(updatedNotes);
      return updatedNotes;
    });
  };

  // Delete sticky note
  const deleteStickyNote = (id) => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    setStickyNotes((prevNotes) => {
      const updatedNotes = prevNotes.filter((note) => note.id !== id);
      saveStickyNotes(updatedNotes);
      return updatedNotes;
    });
  };

  // Change sticky note color
  const changeStickyNoteColor = (id, color) => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    setStickyNotes((prevNotes) => {
      const updatedNotes = prevNotes.map((note) =>
        note.id === id ? { ...note, color } : note
      );
      saveStickyNotes(updatedNotes);
      return updatedNotes;
    });
  };

  // Debug the timer display issue
  useEffect(() => {
    //('Current timer state:', timerState);
    // Check what properties are available in timerState
    //('Available properties:', Object.keys(timerState));
    // Check the seconds value specifically
    //('Seconds value:', timerState.seconds);
  }, [timerState]);

  // Format time for display
  const formatTime = (seconds) => {
    // Check if seconds is a valid number
    if (seconds === undefined || seconds === null || isNaN(seconds)) {
      //('Invalid seconds value:', seconds);
      return "00:00:00"; // Return default display with hours
    }

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to calculate duration between two timestamps
  const calculateDuration = (startTime, endTime) => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Invalid duration";
      }

      const durationInMs = end - start;
      const durationInSeconds = Math.floor(durationInMs / 1000);
      const durationInMinutes = Math.floor(durationInSeconds / 60);
      const durationInHours = Math.floor(durationInMinutes / 60);

      if (durationInHours >= 1) {
        const minutesRemaining = Math.floor((durationInMs % 3600000) / 60000);
        return `${durationInHours} hr ${minutesRemaining} minutes`;
      } else if (durationInMinutes >= 1) {
        return `${durationInMinutes} minutes`;
      } else {
        return `${durationInSeconds} seconds`;
      }
    } catch (error) {
      return "Error calculating duration";
    }
  };

  // Helper function to get formatted current time
  const getFormattedCurrentTime = () => {
    return new Date().toISOString();
  };

  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  // Start timer function
  const startTimer = () => {
    if (!isAuthenticated) {
      setShowWelcomeDialog(true);
      return;
    }

    timerService.startTimer();
    setNotifiedForWork(false); // Reset notification flag for new work session
    // Log start of work session (start time only)
    setLogs((prevLogs) => [
      { type: 'session', start: getFormattedCurrentTime(), end: null, duration: null },
      ...prevLogs, // New logs come at the top
    ]);
  };
  const pauseTimer = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    timerService.pauseTimer();

    // Log end of work session (with start and end time in same line)
    setLogs((prevLogs) => {
      const updatedLogs = [...prevLogs];
      const lastSession = updatedLogs.find((log) => log.type === 'session' && log.start && !log.end);

      if (lastSession) {
        const endTime = getFormattedCurrentTime();
        const startDate = new Date(lastSession.start);
        const endDate = new Date(endTime);
        const durationSeconds = Math.floor((endDate - startDate) / 1000);

        lastSession.end = endTime; // Set the end time for the last session
        lastSession.duration = calculateDuration(lastSession.start, endTime); // Calculate the human-readable duration
        lastSession.durationSeconds = durationSeconds; // Store the raw duration in seconds
      }

      return updatedLogs;
    });
  };

  const stopBreak = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    timerService.stopBreak();

    // Log end of break
    setLogs((prevLogs) => {
      const updatedLogs = [...prevLogs];
      const lastBreak = updatedLogs.find((log) => log.type === 'break' && log.start && !log.end);

      if (lastBreak) {
        const endTime = getFormattedCurrentTime();
        const startDate = new Date(lastBreak.start);
        const endDate = new Date(endTime);
        const durationSeconds = Math.floor((endDate - startDate) / 1000);

        lastBreak.end = endTime; // Set the end time for the last break
        lastBreak.duration = calculateDuration(lastBreak.start, endTime); // Calculate the human-readable duration
        lastBreak.durationSeconds = durationSeconds; // Store the raw duration in seconds
      }

      return updatedLogs;
    });

    // Reset notification flag for new work session
    setNotifiedForWork(false);

    // Add new work session log
    setLogs((prevLogs) => [
      { type: 'session', start: getFormattedCurrentTime(), end: null, duration: null, durationSeconds: null },
      ...prevLogs, // New logs come at the top
    ]);
  };

  // Start break function
  const startBreak = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    //('Starting break...');
    timerService.startBreak();
    setNotifiedForBreak(false); // Reset notification flag for new break session

    // Log start of break
    setLogs((prevLogs) => [
      { type: 'break', start: getFormattedCurrentTime(), end: null, duration: null },
      ...prevLogs, // New logs come at the top
    ]);
  };

  // Handle break function (called when break button is clicked)
  const handleBreak = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    // First, end the current work session if running
    if (timerState.isRunning && !timerState.isOnBreak) {
      // Log end of work session
      setLogs((prevLogs) => {
        const updatedLogs = [...prevLogs];
        const lastSession = updatedLogs.find((log) => log.type === 'session' && log.start && !log.end);

        if (lastSession) {
          const endTime = getFormattedCurrentTime();
          const startDate = new Date(lastSession.start);
          const endDate = new Date(endTime);
          const durationSeconds = Math.floor((endDate - startDate) / 1000);

          lastSession.end = endTime; // Set the end time for the last session
          lastSession.duration = calculateDuration(lastSession.start, endTime); // Calculate the human-readable duration
          lastSession.durationSeconds = durationSeconds; // Store the raw duration in seconds

          //("Work session ended in Home component with duration:", lastSession.duration);
        }

        return updatedLogs;
      });
    }

    // Then start the break
    startBreak();
  };

  // Add state for error handling
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add temporary state variables for settings form
  const [tempWorkDuration, setTempWorkDuration] = useState(timerService.workDurationSetting || 25);
  const [tempBreakDuration, setTempBreakDuration] = useState(timerService.breakDurationSetting || 5);

  // Improved saveTimerSettings function with better error handling
  const saveTimerSettings = async (newWorkDuration, newBreakDuration) => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      setShowSettings(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      //("Saving timer settings:", { workDuration: newWorkDuration, breakDuration: newBreakDuration });

      // Validate inputs
      if (!newWorkDuration || newWorkDuration < 1 || !newBreakDuration || newBreakDuration < 1) {
        throw new Error("Work and break durations must be at least 1 minute");
      }

      // Update the timer service settings ONLY when Save is clicked
      timerService.setWorkDurationSetting(parseInt(newWorkDuration));
      timerService.setBreakDurationSetting(parseInt(newBreakDuration));
      
      // Update the component state to match
      setWorkDuration(parseInt(newWorkDuration));
      setBreakDuration(parseInt(newBreakDuration));

      // Save to database
      await timerService.savebreaksettings();

      //("Timer settings saved successfully");
      setShowSettings(false); // Close the settings modal
    } catch (error) {
      console.error("Error saving timer settings:", error);
      setError(error.message || "Failed to save timer settings");
    } finally {
      setIsLoading(false);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.error("This browser does not support desktop notification");
      return;
    }

    // Check if we've already requested permission in this session
    const hasRequestedPermission = localStorage.getItem('notificationPermissionRequested');

    if (Notification.permission === "granted") {
      //("Notification permission already granted");
      setNotificationPermission("granted");
      return;
    }

    if (Notification.permission !== "granted" && !hasRequestedPermission) {
      //("Requesting notification permission...");
      try {
        const permission = await Notification.requestPermission();
        //("Permission:", permission);
        setNotificationPermission(permission);

        // Mark that we've requested permission in this session
        localStorage.setItem('notificationPermissionRequested', 'true');

        // Show feedback to user based on permission result
        if (permission === "granted") {
          sendNotification(
            "Notifications Enabled",
            "You will now receive notifications for work and break timers."
          );
        } else {
          //("Notification permission denied or dismissed");
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    }
  };

  // Function to send notification with improved error handling
  const sendNotification = (title, body) => {
    //("Attempting to send notification:", title, body);

    try {
      // Check if the browser supports notifications
      if (!("Notification" in window)) {
        console.error("This browser does not support desktop notification");
        return;
      }

      // Check if permission is granted
      if (Notification.permission !== "granted") {
        console.error("Notification permission not granted:", Notification.permission);
        requestNotificationPermission(); // Try requesting permission again
        return;
      }

      // Create and show notification
      const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        requireInteraction: true // Keep notification visible until user interacts with it
      });

      // Also show a toast notification with matching style
      if (title.includes('Break')) {
        showInfoToast(title + ': ' + body);
      } else {
        showSuccessToast(title + ': ' + body);
      }

      // Log when notification is shown
      // notification.onshow = () => //("Notification shown:", title);

      // Log any errors
      notification.onerror = (err) => console.error("Notification error:", err);

      // Handle notification click
      notification.onclick = () => {
        //("Notification clicked:", title);
        window.focus(); // Focus the window when notification is clicked
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
      // Fallback to toast notification
      showInfoToast(title + ': ' + body);
    }
  };

  // Check if it's time for a break or to end a break and send notifications
  useEffect(() => {
    // Only proceed if notification permission is granted
    if (notificationPermission !== "granted") return;

    // Get current timer state
    const currentState = timerState;
    const now = new Date();

    // 1. Notify when work time is over (only once per session)
    if (!currentState.isOnBreak && currentState.isRunning && currentState.sessionStart) {
      const sessionStartTime = new Date(currentState.sessionStart);
      const elapsedSeconds = Math.floor((now - sessionStartTime) / 1000);
      const workDurationInSeconds = workDuration * 60;

      // Check if work duration has been reached and we haven't notified yet
      if (elapsedSeconds >= workDurationInSeconds && !notifiedForWork) {
        sendNotification(
          'Time for a break!',
          `You've been working for ${workDuration} minutes. Take a break.`
        );
        setNotifiedForWork(true); // Set flag to prevent repeated notifications
        //(`Work notification sent after ${elapsedSeconds} seconds`);
      }
    }

    // 2. Notify when break time is over (only once per break)
    if (currentState.isOnBreak && currentState.breakStart) {
      const breakStartTime = new Date(currentState.breakStart);
      const breakElapsed = Math.floor((now - breakStartTime) / 1000);
      const breakDurationInSeconds = breakDuration * 60;

      // Check if break duration has been reached and we haven't notified yet
      if (breakElapsed >= breakDurationInSeconds && !notifiedForBreak) {
        sendNotification(
          'Break is over!',
          `Your ${breakDuration} minute break is done. Time to get back to work.`
        );
        setNotifiedForBreak(true); // Set flag to prevent repeated notifications
        //(`Break notification sent after ${breakElapsed} seconds`);
      }
    }
  }, [timerState, workDuration, breakDuration, notificationPermission, notifiedForWork, notifiedForBreak]);

  // Separate useEffect to reset notification flags when session/break state changes
  useEffect(() => {
    if (!timerState.isOnBreak) {
      setNotifiedForBreak(false); // Reset break notification flag when not on break
    }
    if (!timerState.isRunning || timerState.isOnBreak) {
      setNotifiedForWork(false); // Reset work notification flag when not working
    }
  }, [timerState.isOnBreak, timerState.isRunning]);

  // Request notification permission when component mounts
  useEffect(() => {
    // Only request permission if we haven't already done so
    if (Notification.permission !== "granted" && !localStorage.getItem('notificationPermissionRequested')) {
      requestNotificationPermission();
    } else {
      // Just update the state with current permission
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleStart = () => {
    startTimer();
  };

  const handlePause = () => {
    pauseTimer();
  };

  // const handleBreak = () => {
  //   startBreak();
  // };

  const handleStopBreak = () => {
    stopBreak();
  };

  const handleSettings = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    // Initialize temp values with current settings when opening the modal
    setTempWorkDuration(timerService.workDurationSetting || 25);
    setTempBreakDuration(timerService.breakDurationSetting || 5);
    setShowSettings(true);
  };

  const handleAddNote = () => {
    const newNotes = [...notes, { text: '' }];
    setNotes(newNotes);
    localStorage.setItem('notes', JSON.stringify(newNotes));
  };

  const handleNoteChange = (index, text) => {
    const newNotes = [...notes];
    newNotes[index].text = text;
    setNotes(newNotes);
    localStorage.setItem('notes', JSON.stringify(newNotes));
  };

  const handleDeleteNote = (index) => {
    const newNotes = notes.filter((_, i) => i !== index);
    setNotes(newNotes);
    localStorage.setItem('notes', JSON.stringify(newNotes));
  };

  // Add function to handle manual save
  const handleManualSave = async () => {
    setSaveStatus({ saving: true, lastSaved: saveStatus.lastSaved });
    const success = await timerService.saveTimerData();
    if (success) {
      setSaveStatus({ saving: false, lastSaved: new Date() });
    } else {
      setSaveStatus({ saving: false, lastSaved: saveStatus.lastSaved });
    }
  };

  // Add save status indicator to the timer UI
  const saveStatusIndicator = () => {
    if (saveStatus.saving) {
      return (
        <div className="text-xs text-gray-400 mt-2 flex items-center justify-center">
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 1 1 0 16 8 8 0 0 1 0-16z"></path>
            </svg>
            Saving...
          </span>
        </div>
      );
    } else if (saveStatus.lastSaved) {
      return (
        <div className="text-xs text-gray-400 mt-2">
          Last saved: {saveStatus.lastSaved.toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </div>
      );
    } else {
      return null;
    }
  };

  // Add a useEffect to update the timer display every second
  useEffect(() => {
    // Only create an interval if we don't have one from the timer service
    if (timerState.isRunning) {
      // This is just for UI updates, the actual counting happens in the service
      const displayInterval = setInterval(() => {
        // Force a re-render to update the timer display
        setTimerState(prevState => ({ ...prevState }));
      }, 1000);

      return () => {
        //("Clearing display interval");
        clearInterval(displayInterval);
      };
    }
  }, [timerState.isRunning]);

  const handleCloseAuthDialog = () => {
    setShowAuthDialog(false);
  };

  const handleCloseWelcomeDialog = () => {
    setShowWelcomeDialog(false);
  };

  const handleRequestAuth = () => {
    setShowAuthDialog(true);
  };

  return (
    <div className="flex flex-col items-center justify-start pt-10 min-h-screen bg-[#1e1e1e] text-white overflow-x-hidden">
      {/* Timer Display with Tailwind CSS */}
      <div className="w-full max-w-md mx-auto mb-6 px-4">
        <div className="bg-black rounded-lg p-4 sm:p-6 shadow-lg border border-gray-700">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Focus Timer</h2>
            <div className={`text-5xl font-mono font-bold mb-4 ${timerState.isOnBreak ? 'text-red-500 animate-pulse' : 'text-teal-400'}`}>
              {formatTime(timerState.seconds)}
            </div>
            {/* <div className="text-sm text-gray-400 mb-2">
              {timerState.isRunning ? 
                (timerState.isOnBreak ? 'Break in progress' : 'Session in progress') : 
                'Timer paused'}
            </div> */}

            {/* Status indicator */}
            <div className="mb-4">
              {timerState.isOnBreak ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                  <span className="w-2 h-2 mr-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  Break Time
                </span>
              ) : timerState.isRunning ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                  <span className="w-2 h-2 mr-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Focus Session
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-400">
                  <span className="w-2 h-2 mr-1.5 rounded-full bg-gray-500"></span>
                  Ready
                </span>
              )}
            </div>

            {/* Duration stats */}
            <div className="flex justify-between items-center mb-4 p-2 bg-[#16213e] rounded-lg">
              <div className="text-center">
                <span className="text-xs text-gray-400 block">Work</span>
                <span className="text-sm font-medium text-green-400">{workdurationofuser}</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-400 block">Break</span>
                <span className="text-sm font-medium text-blue-400">{breakdurationofuser}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              {/* Play/Pause Button - Full width */}
              <button
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all w-full
                  ${timerState.isRunning
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-teal-500 hover:bg-teal-600'} 
                  ${timerState.isOnBreak ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                onClick={timerState.isRunning ? handlePause : handleStart}
                disabled={timerState.isOnBreak}
              >
                {timerState.isRunning ? (
                  <><Pause size={16} /> Pause</>
                ) : (
                  <><Play size={16} /> Start</>
                )}
              </button>

              {/* Settings and Break buttons in a row */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm font-medium transition-all"
                  onClick={handleSettings}
                >
                  <Settings size={16} /> Settings
                </button>
                
                <button
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all
                    ${timerState.isOnBreak
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-blue-500 hover:bg-blue-600'}`}
                  onClick={timerState.isOnBreak ? handleStopBreak : handleBreak}
                >
                  {timerState.isOnBreak ? (
                    <><Pause size={16} /> End Break</>
                  ) : (
                    <><Coffee size={16} /> Break</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Notes Section - Improved responsiveness */}
      <div className="w-full max-w-4xl mx-auto mb-8 px-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Sticky Notes</h3>
          <button
            className="flex items-center gap-1 py-1 px-2 bg-teal-500 hover:bg-teal-600 text-white rounded-md text-sm transition-all"
            onClick={addStickyNote}
          >
            <Plus size={16} /> Add Note
          </button>
        </div>

        <div className="bg-black rounded-lg p-4 sm:p-6 border border-gray-700">
          {stickyNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-400 animate-[bounce_3s_ease-in-out_infinite]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No notes yet. Click the "Add Note" button to create one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {stickyNotes.map((note) => (
                <StickyNote
                  key={note.id}
                  note={note}
                  onUpdate={updateStickyNote}
                  onDelete={deleteStickyNote}
                  onColorChange={changeStickyNoteColor}
                  isAuthenticated={isAuthenticated}
                  onAuthRequired={() => setShowAuthDialog(true)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logs Section with black background */}
      <div className="w-full max-w-4xl mx-auto px-4 mb-8" ref={logsRef}>
        <h3 className="text-xl font-semibold mb-4">Activity Logs:</h3>
        <div className="bg-black rounded-lg p-4 max-h-60 overflow-y-auto">
          <ul className="space-y-2">
            {logs && Array.isArray(logs) && logs.map((log, index) => (
              <li key={index} className="text-sm text-gray-300 border-b border-gray-700 pb-2">
                {log.type === 'session' ? (
                  <span className="text-[#00a0a0]">Session</span>
                ) : (
                  <span className="text-blue-400">Break</span>
                )}
                {` started at ${log.start} ended at ${log.end || '---'} - Duration: ${log.duration || '---'}`}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Settings Modal with auto-save interval option */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm shadow-xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-semibold">Timer Settings</h3>
              <button
                className="text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowSettings(false)}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-100 border border-red-300 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block mb-2 text-sm text-gray-300">Work Duration (minutes):</label>
              <input
                type="number"
                className="w-full p-2 rounded bg-[#16213e] text-white border border-gray-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none text-sm"
                value={tempWorkDuration}
                onChange={(e) => {
                  const val = Math.min(120, Math.max(1, parseInt(e.target.value) || 1));
                  setTempWorkDuration(val);
                }}
                min="1"
                max="120"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm text-gray-300">Break Duration (minutes):</label>
              <input
                type="number"
                className="w-full p-2 rounded bg-[#16213e] text-white border border-gray-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none text-sm"
                value={tempBreakDuration}
                onChange={(e) => {
                  const val = Math.min(60, Math.max(1, parseInt(e.target.value) || 1));
                  setTempBreakDuration(val);
                }}
                min="1"
                max="60"
              />
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 ${isLoading ? 'bg-gray-400' : 'bg-teal-500 hover:bg-teal-600'} text-white rounded`}
                onClick={() => saveTimerSettings(tempWorkDuration, tempBreakDuration)}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthDialog && (
        <AuthDialog
          open={showAuthDialog}
          onClose={handleCloseAuthDialog}
        />
      )}

      {showWelcomeDialog && (
        <WelcomeDialog
          open={showWelcomeDialog}
          onClose={handleCloseWelcomeDialog}
          onRequestAuth={handleRequestAuth}
        />
      )}

      {!isAuthenticated && (
        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-800 rounded-md">
          <p className="text-yellow-200 text-sm">
            Please <button
              onClick={() => setShowAuthDialog(true)}
              className="text-teal-400 hover:underline"
            >
              login or register
            </button> to save your timer progress.
          </p>
        </div>
      )}
    </div>
  );
}
