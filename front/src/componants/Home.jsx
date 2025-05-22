import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Settings, Coffee, Plus, Trash, RefreshCw, X } from 'lucide-react';
// import './css/home.css';
import timerService from '../services/TimerService';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toastStyles';
import AuthDialog from './AuthDialog';
import WelcomeDialog from './WelcomeDialog';

// Add debug logging
const logDebug = (message, data) => {
  // console.log(`[Home] ${message}`, data || '');
};


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
    const log = localStorage.getItem('activityLogs_' + timerService.userId);
    return log ? JSON.parse(log) : [];
  });

  const [stickyNotes, setStickyNotes] = useState([]); // State for sticky notes
  const [notifiedForWork, setNotifiedForWork] = useState(false); // Track if we've notified for current work session
  const [notifiedForBreak, setNotifiedForBreak] = useState(false); // Track if we've notified for current break session
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [showSettings, setShowSettings] = useState(false);
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem('notes');
    return savedNotes ? JSON.parse(savedNotes) : [];
  });
  const [workdurationofuser, setWorkdurationofuser] = useState(() => {
    return timerService.workDuration || 0; // Use the property directly as fallback
  });
  const [breakdurationofuser, setbreakurationofuser] = useState(() => {
    return timerService.breakDuration || 0; // Use the property directly as fallback
  });
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  // Add state for save status
  const [saveStatus, setSaveStatus] = useState({ saving: false, lastSaved: null });

  // Add state for auto-save interval

  const logsRef = useRef(null); // Ref to the logs container to scroll automatically

  // useEffect(() => {
  //   setLogs(timerService.allLogs);
  //   console.log("Use effect called ")
  // }, [timerService.workLogs, timerService.breakLogs, timerService.allLogs])

  // Subscribe to timer service updates with better error handling
  useEffect(() => {
    logDebug("Home component mounted");

    // Check if user just logged in
    const justLoggedIn = localStorage.getItem('justLoggedIn');
    if (justLoggedIn === 'true') {
      logDebug("User just logged in, clearing logs in Home component");
      setLogs([]);
      localStorage.removeItem('justLoggedIn');
    }

    // Load sticky notes
    loadStickyNotes();

    // Update user ID in timer service
    timerService.updateUserId();

    // Get initial timer state
    const initialState = timerService.getState();
    logDebug("Initial timer state in Home:", initialState);
    setTimerState(initialState);

    // Load logs from timer service
    const loadLogs = () => {
      try {
        const allLogs = timerService.getAllLogs();

        if (!Array.isArray(allLogs)) {
          logDebug("getAllLogs returned non-array:", allLogs);
          return;
        }

        // Filter logs to keep only today's logs
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysLogs = allLogs.filter(log => {
          if (!log || !log.start) return false;

          try {
            const logDate = new Date(log.start);
            return !isNaN(logDate.getTime()) && logDate >= today;
          } catch (e) {
            return false;
          }
        });

        logDebug(`Loaded ${todaysLogs.length} logs for today from timer service`);

        // Sort logs by start time (newest first)
        const sortedLogs = [...todaysLogs].sort((a, b) => {
          try {
            return new Date(b.start) - new Date(a.start);
          } catch (e) {
            return 0;
          }
        });

        setLogs(sortedLogs);
      } catch (error) {
        console.error("Error loading logs:", error);
      }
    };

    // Load logs initially
    loadLogs();

    // Subscribe to timer service updates
    const unsubscribe = timerService.subscribe(newState => {
      logDebug("Timer update received in Home:", newState);
      setTimerState(prevState => {
        // Only update if the new state is different
        if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
          return newState;
        }
        return prevState;
      });

      // Update work and break durations
      setWorkdurationofuser(timerService.workDuration || 0);
      setbreakurationofuser(timerService.breakDuration || 0);

      // Reload logs when timer state changes
      loadLogs();
    });

    // Clean up on unmount
    return () => {
      logDebug("Home component unmounting");
      unsubscribe();
    };
  }, []);

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

  // Helper function to format date for display
  const formatDateForDisplay = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error("Invalid date string:", dateString);
        return "Invalid date";
      }
      return date.toISOString().replace('T', ' ').substring(0, 19);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Error";
    }
  };

  // Helper function to calculate duration string
  const calculateDuration = (start, end) => {
    try {
      // If we received Date objects, use them directly
      const startDate = start instanceof Date ? start : new Date(start);
      const endDate = end instanceof Date ? end : new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("Invalid date in duration calculation:", { start, end });
        return "0 seconds";
      }

      const durationMs = endDate - startDate;
      if (durationMs < 0) {
        console.error("Negative duration calculated:", { start, end, durationMs });
        return "0 seconds";
      }

      const seconds = Math.floor(durationMs / 1000);

      if (seconds < 60) {
        return `${seconds} seconds`;
      }

      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;

      if (minutes < 60) {
        if (remainingSeconds === 0) {
          return `${minutes} minutes`;
        }
        return `${minutes} minutes ${remainingSeconds} seconds`;
      }

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (remainingMinutes === 0) {
        return `${hours} hours`;
      }
      return `${hours} hours ${remainingMinutes} minutes`;
    } catch (error) {
      console.error("Error calculating duration:", error);
      return "0 seconds";
    }
  };

  // Helper function to find any open log (session or break)
  const findOpenLog = (logs) => {
    if (!Array.isArray(logs)) return null;
    // Look specifically for logs that have a start time but no end time
    return logs.find(log => log && log.start && !log.end);
  };

  // Helper function to close an open log with proper duration calculation
  const closeOpenLog = (logs) => {
    if (!Array.isArray(logs)) return logs;

    const updatedLogs = [...logs];
    const openLogIndex = updatedLogs.findIndex(log => log && log.start && !log.end);

    if (openLogIndex !== -1) {
      const openLog = updatedLogs[openLogIndex];
      const endTime = getFormattedCurrentTime();

      try {
        const startDate = new Date(openLog.start);
        const endDate = new Date(endTime);

        if (isNaN(startDate.getTime())) {
          console.error("Invalid start date in log:", openLog);
          // Fix the start date if it's invalid
          openLog.start = endTime;
        }

        // Calculate duration in seconds
        const durationSeconds = Math.max(0, Math.floor((endDate - startDate) / 1000));

        // Update the log with end time and duration
        updatedLogs[openLogIndex] = {
          ...openLog,
          end: endTime,
          duration: calculateDuration(startDate, endDate),
          durationSeconds: durationSeconds
        };

        console.log(`Closed ${openLog.type} log:`, {
          start: formatDateForDisplay(openLog.start),
          end: formatDateForDisplay(endTime),
          duration: calculateDuration(startDate, endDate),
          durationSeconds: durationSeconds
        });
        saveLogsToLocalStorage(updatedLogs);
        setLogs(updatedLogs);
        // Save updated logs to localStorage
      } catch (error) {
        console.error("Error closing log:", error);
        // Still update the end time even if calculation fails
        updatedLogs[openLogIndex] = {
          ...openLog,
          end: endTime,
          duration: "Error",
          durationSeconds: 0
        };

        // Save updated logs to localStorage even if there was an error
        saveLogsToLocalStorage(updatedLogs);
      }
    } else {
      console.log("No open log found to close");
    }

  };

  // Save logs to localStorage
  const saveLogsToLocalStorage = (logsToSave) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.log("No user ID, skipping logs save to localStorage");
        return;
      }

      // Save logs with user-specific key
      const userLogsKey = `activityLogs_${userId}`;
      localStorage.setItem(userLogsKey, JSON.stringify(logsToSave));

      // Also save to generic key for backward compatibility
      localStorage.setItem("activityLogs", JSON.stringify(logsToSave));

      // console.log(`Saved ${logsToSave.length} logs to localStorage for user ${userId}`);
    } catch (error) {
      console.error("Error saving logs to localStorage:", error);
    }
  };

  // Load logs from localStorage
  const loadLogsFromLocalStorage = () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.log("No user ID, skipping logs load from localStorage");
        return [];
      }

      // Try to load from user-specific key first
      const userLogsKey = `activityLogs_${userId}`;
      let savedLogs = localStorage.getItem(userLogsKey);

      // If not found, try the generic key as fallback
      if (!savedLogs) {
        savedLogs = localStorage.getItem("activityLogs");
      }

      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        console.log(`Loaded ${parsedLogs.length} logs from localStorage for user ${userId}`);
        return Array.isArray(parsedLogs) ? parsedLogs : [];
      }

      return [];
    } catch (error) {
      console.error("Error loading logs from localStorage:", error);
      return [];
    }
  };

  // Helper function to get formatted current time
  const getFormattedCurrentTime = () => {
    return new Date().toISOString();
  };

  const handlePauseTimer = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    try {

      // First check if timer is actually running
      if (!timerState.isRunning) {
        console.log("Timer not running, nothing to pause");
        return;
      }

      // Pause the timer in the service FIRST
      closeLog();


      console.log("Updated logs after pausing timer:", logs);

      // Then update logs to close any open log with proper duration
    } catch (error) {
      console.error("Error pausing timer:", error);
      showErrorToast("Failed to pause timer. Please try again.");
    }
    timerService.pauseTimer();

    console.log("Paused timer --------", logs);
  };

  // Start timer function
  const handleStartTimer = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    if (timerState.isOnBreak) {
      console.log("Currently on break, ending break first");
      handleEndBreak();
      return;
    }
    closeLog();
    addnewLog('session');
    timerService.startTimer();

    console.log("Started timer --------", logs);
    // No open log, start timer directly
  };
  const handleEndBreak = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    closeLog();
    // closeLog();
    addnewLog('session');


    // closeOpenLog(logs);

    console.log("Before : ", logs)
    setNotifiedForWork(false);

    // First, close any open log (should be a break)



    console.log("After : ", logs)
    timerService.stopBreak();
    console.log("ended  break --------", logs);

  };

  // Start break function
  const handleBreak = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    // closeOpenLog(logs);
    setNotifiedForBreak(false);
    closeLog();
    addnewLog('break');
    timerService.startBreak();
    console.log("Break started --------", logs);

  };
  const addnewLog = (type) => {
    const startTime = getFormattedCurrentTime();
    const newLog = {
      type: type,
      start: startTime,
      end: null,
      duration: null,
      durationSeconds: null
    };

    const newLogs = [newLog, ...logs];
    setLogs(newLogs)
    saveLogsToLocalStorage(newLogs);
  }
  const closeLog = async () => {
    const endTime = new Date().toISOString();

    // Find the first open log (session or break)
    const openLogIndex = logs.findIndex((log) => log && log.end === null);
    if (openLogIndex === -1) return;

    const openLog = logs[openLogIndex];
    const start = new Date(openLog.start);
    const end = new Date(endTime);
    const durationSeconds = await timerService.calculateDuration(start, end);

    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = durationSeconds % 60;

    let duration = '';
    if (hours > 0) {
      duration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } else if (minutes > 0) {
      duration = `${minutes}`;
    } else {
      duration = `${seconds}`;
    }

    // Update local logs
    const updatedLog = {
      ...openLog,
      end: endTime,
      duration,
      durationSeconds,
    };
    const updatedLogs = [...logs];
    updatedLogs[openLogIndex] = updatedLog;

    setLogs(updatedLogs);
    saveLogsToLocalStorage(updatedLogs);

    // --- Update timerService logs as well ---
    let serviceLogs = openLog.type === 'break'
      ? timerService.breakLogs
      : timerService.workLogs;

    if (Array.isArray(serviceLogs)) {
      const serviceOpenLogIndex = serviceLogs.findIndex(
        (log) => log && log.start === openLog.start && !log.end
      );
      if (serviceOpenLogIndex !== -1) {
        serviceLogs[serviceOpenLogIndex] = {
          ...serviceLogs[serviceOpenLogIndex],
          end: endTime,
          duration,
          durationSeconds,
        };
      }
    }

    // Also update the combined logs array if it exists
    if (Array.isArray(timerService.logs)) {
      const combinedOpenLogIndex = timerService.logs.findIndex(
        (log) => log && log.start === openLog.start && !log.end
      );
      if (combinedOpenLogIndex !== -1) {
        timerService.logs[combinedOpenLogIndex] = {
          ...timerService.logs[combinedOpenLogIndex],
          end: endTime,
          duration,
          durationSeconds,
        };
      }
    }

    // Save state and update DB
    timerService.saveState();
    await timerService.updateInDB();
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
      let notification;
      if (title == 'Notifications Enabled') {
         notification = new Notification(title, {
          body: body,
          icon: '/logo.png',
        });
      }
      if(title=='Break is over!'){
          notification = new Notification(title, {
          body: body,
          icon: '/work.png',
        });
      }
      if(title=='Time for a break!'){
          notification = new Notification(title, {
          body: body,
          icon: '/break.png',
        });
      }
      // Create and show notification


      // Log when notification is shown
      notification.onshow = () => console.log("Notification shown:", title);

      // Log any errors
      notification.onerror = (err) => console.error("Notification error:", err);

      // Handle notification click
      notification.onclick = () => {
        console.log("Notification clicked:", title);
        window.focus(); // Focus the window when notification is clicked
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
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
        console.log(`Work notification sent after ${elapsedSeconds} seconds`);
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
        console.log(`Break notification sent after ${breakElapsed} seconds`);
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
    handleStartTimer();
  };

  const handlePause = () => {
    handlePauseTimer();
  };

  // const handleBreak = () => {
  //   startBreak();
  // };

  const handleStopBreak = () => {
    handleEndBreak();
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

  // Clean up the synchronization mechanism
  useEffect(() => {
    // Create a synchronization interval to ensure the component stays in sync with the timer service
    const syncInterval = setInterval(() => {
      if (timerState.isRunning) {
        // Get the current state from the timer service
        const currentState = timerService.getState();

        // Check if the seconds have changed
        if (currentState.seconds !== timerState.seconds) {
          setTimerState(currentState);
        }

        // Check if timer service is still running
        if (currentState.isRunning && !timerService.intervalId) {
          if (currentState.isOnBreak) {
            timerService.startBreakInterval();
          } else {
            timerService.startInterval();
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(syncInterval);
    };
  }, [timerState.isRunning, timerState.seconds]);

  // Clean up the visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Force a sync with timer service when tab becomes visible
        const currentState = timerService.getState();
        setTimerState(currentState);
      }
    };

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleCloseAuthDialog = () => {
    setShowAuthDialog(false);
  };

  const handleCloseWelcomeDialog = () => {
    setShowWelcomeDialog(false);
  };

  const handleRequestAuth = () => {
    setShowAuthDialog(true);
  };

  // Fix the log display in Home component
  const renderLogs = () => {
    if (!Array.isArray(logs) || logs.length === 0) {
      return <div className="text-gray-400">No activity logs yet.</div>;
    }

    return logs.map((log, index) => {
      try {
        // Format start time
        let startFormatted = "---";
        try {
          if (log.start) {
            const startDate = new Date(log.start);
            if (!isNaN(startDate.getTime())) {
              startFormatted = formatDateForDisplay(log.start);
            }
          }
        } catch (e) {
          console.error("Error formatting start time:", e);
        }

        // Format end time
        let endFormatted = "---";
        try {
          if (log.end) {
            const endDate = new Date(log.end);
            if (!isNaN(endDate.getTime())) {
              endFormatted = formatDateForDisplay(log.end);
            }
          }
        } catch (e) {
          console.error("Error formatting end time:", e);
        }

        // Format duration
        let durationFormatted = "---";
        try {
          if (log.start && log.end) {
            const startDate = new Date(log.start);
            const endDate = new Date(log.end);
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
              durationFormatted = calculateDuration(startDate, endDate);
            }
          } else if (log.duration) {
            durationFormatted = log.duration;
          } else if (log.durationSeconds) {
            durationFormatted = `${log.durationSeconds} seconds`;
          }
        } catch (e) {
          console.error("Error formatting duration:", e);
        }

        const logTypeColor = log.type === 'session' ? 'text-teal-400' : 'text-blue-400';
        const isOpen = log.start && !log.end;
        const statusIndicator = isOpen ? '🟢 ' : '';

        return (
          <div key={index} className={`border-b border-gray-700 py-2 ${isOpen ? 'bg-gray-800' : ''}`}>
            {statusIndicator}
            <span className={logTypeColor}>
              {log.type === 'session' ? 'Session' : 'Break'}
            </span>
            {' started at '}
            {startFormatted}
            {' ended at '}
            {endFormatted}
            {' - Duration: '}
            {durationFormatted}
          </div>
        );
      } catch (error) {
        console.error("Error rendering log:", error, log);
        return (
          <div key={index} className="border-b border-gray-700 py-2 text-red-400">
            Error displaying log entry
          </div>
        );
      }
    });
  };

  // Add these helper functions for time formatting
  const formatTimeDisplay = (seconds) => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) {
      return "00:00:00";
    }

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDurationHuman = (seconds) => {
    if (seconds < 60) return `${seconds}s`;

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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

            {/* Simplified Duration Stats */}
            <div className="mb-6 p-3 bg-[#16213e] rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                {/* Work Duration */}
                <div>
                  <div className="text-xs text-gray-400 mb-1">Work Time</div>
                  <div className="text-lg font-medium text-green-400">
                    {formatDurationHuman(workdurationofuser)}
                  </div>
                </div>

                {/* Break Duration */}
                <div>
                  <div className="text-xs text-gray-400 mb-1">Break Time</div>
                  <div className="text-lg font-medium text-blue-400">
                    {formatDurationHuman(breakdurationofuser)}
                  </div>
                </div>
              </div>
            </div>

            {/* Session Details - Simplified without elapsed time */}
            {timerState.isRunning && (
              <div className="mb-4 text-sm">
                <div className="flex justify-between text-gray-400">
                  <div>Started:</div>
                  <div>
                    {timerState.isOnBreak
                      ? new Date(timerState.breakStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(timerState.sessionStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  </div>
                </div>
              </div>
            )}

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
      <div className="w-full max-w-4xl mx-auto px-4 mb-8" ref={logsRef} >
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
