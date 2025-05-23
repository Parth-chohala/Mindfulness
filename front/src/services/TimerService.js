import goalService from "./GoalService";

class TimerService {
  constructor() {

    this.intervalId = null;
    this.autoSaveIntervalId = null;
    this.autoSaveCheckId = null;
    this.isRunning = false;
    this.isOnBreak = false;
    this.seconds = 0;
    this.workDuration = 0;
    this.breakDuration = 0;
    this.listeners = [];
    this.workLogs = [];
    this.breakLogs = [];
    this.userId = null;
    this.timerId = null;
    this.sessionStart = null;
    this.breakStart = null;
    this.workDurationSetting = 25;
    this.breakDurationSetting = 5;
    this.autoSaveInterval = 7000;
    this.hasChangedSinceLastSave = false;
    this.resourceErrorCount = 0;
    this.lastFetchTime = null;
    this.lastServerSave = null;
    this.lastAutoSaveCheck = Date.now();
    this.logs = [];
    this.lastActiveTime = Date.now();
    this.backgroundStartTime = null;
    this.wasRunningBeforeBackground = false; // Track if timer was running before background
    this.wasOnBreakBeforeBackground = false; // Track if timer was on break before background
    this.useRequestAnimationFrame = false; // Disable RAF for more reliable timing
    this.animationFrameId = null;

    // Initialize with a delay to prevent race conditions
    setTimeout(() => this.initialize(), 100);

  }

  startAutoSave() {
    // Clear any existing auto-save interval
    if (this.autoSaveIntervalId) {
      clearInterval(this.autoSaveIntervalId);
      this.autoSaveIntervalId = null;
    }

    // Set up new auto-save interval
    this.autoSaveIntervalId = setInterval(() => {
      // console.log("Auto-save interval triggered");
      if (this.userId) {
        // Always update when timer is active
        if (this.isRunning || this.isOnBreak || this.hasChangedSinceLastSave) {
          // console.log("Performing auto-save to DB");
          this.updateInDB().catch((err) => {
            console.error("Error updating timer in DB:", err);
          });
          this.hasChangedSinceLastSave = false;
        }
      }
    }, this.autoSaveInterval);

    // Add a periodic check to ensure auto-save is still running
    this.autoSaveCheckId = setInterval(() => {
      this.checkAutoSaveStatus();
    }, 60000); // Check every minute
  }

  // Stop auto-save functionality
  stopAutoSave() {
    // console.log("Stopping auto-save");
    if (this.autoSaveIntervalId) {
      clearInterval(this.autoSaveIntervalId);
      this.autoSaveIntervalId = null;
    }
    if (this.autoSaveCheckId) {
      clearInterval(this.autoSaveCheckId);
      this.autoSaveCheckId = null;
    }
  }

  async fetchTimerData() {
    this.updateUserId();
    if (!this.userId) {
      return null;
    }

    const now = Date.now();
    if (this.lastFetchTime && now - this.lastFetchTime < 5000) {
      return null;
    }
    try {
      // Use AbortController to set a timeout
      const controller = new AbortController();

      const res = await fetch(
        `http://localhost:5000/api/focusTimers/${this.userId}`,
        { signal: controller.signal }
      );
      // Clear the timeout
      if (!res.ok) {
        console.error("Server returned error:", res.status, res.statusText);
        return null;
      }
      // Use a separate request for break data to reduce payload size
      const breakController = new AbortController();
      const breakTimeoutId = setTimeout(() => breakController.abort(), 10000);
      const breakdata = await fetch(
        `http://localhost:5000/api/breaks/${this.userId}`,
        { signal: breakController.signal }
      );
      clearTimeout(breakTimeoutId);
      if (!breakdata.ok) {
        console.error(
          "Error fetching break data:",
          breakdata.status,
          breakdata.statusText
        );
      }

      // Parse responses
      const timer = await res.json();
      const breakinfo = await breakdata.json();
      // Store the timer ID for future updates
      this.timerId = timer._id;
      // Reset state before applying server data
      this.workLogs = [];
      this.breakLogs = [];
      this.workDuration = 0;
      this.breakDuration = 0;
      // Update local state with server data
      if (timer.worklogs && Array.isArray(timer.worklogs)) {
        this.workLogs = timer.worklogs.map((log) => ({
          type: "session",
          start: log.start || log.startsession,
          end: log.end || log.endsession,
          duration: log.duration,
          durationSeconds: log.durationSeconds || 0,
        }));
      }

      if (timer.breaklogs && Array.isArray(timer.breaklogs)) {
        this.breakLogs = timer.breaklogs.map((log) => ({
          type: "break",
          start: log.start || log.startsession,
          end: log.end || log.endsession,
          duration: log.duration,
          durationSeconds: log.durationSeconds || 0,
        }));
      }
      // Ensure we have valid durations
      const { manualWorkDuration, manualBreakDuration } = this.analyzeLogs();
      // Use server values if available, otherwise use calculated values
      this.workDuration = timer.workDuration || manualWorkDuration || 0;
      this.breakDuration = timer.breakDuration || manualBreakDuration || 0;

      // Set seconds to workDuration for the timer display
      this.seconds = this.workDuration;

      // Set timer state
      this.isRunning = timer.isRunning || false;
      this.isOnBreak = timer.isOnBreak || false;

      // Combine logs and filter for today only
      const allLogs = [...this.workLogs, ...this.breakLogs];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysLogs = allLogs.filter((log) => {
        if (!log || !log.start) return false;

        try {
          const logDate = new Date(log.start);
          return !isNaN(logDate.getTime()) && logDate >= today;
        } catch (e) {
          return false;
        }
      });

      // Save today's logs to localStorage
      this.logs = todaysLogs;
      localStorage.setItem("timerLogs", JSON.stringify(todaysLogs));

      if (this.userId) {
        const userLogsKey = `timerLogs_${this.userId}`;
        localStorage.setItem(userLogsKey, JSON.stringify(todaysLogs));
      }

      // If timer was running, restart the interval
      if (this.isRunning) {
        // Stop any existing intervals first
        this.stopAllTimers();

        if (this.isOnBreak) {
          this.startBreakInterval();
        } else {
          this.startInterval();
        }
      }

      if (timer.startedAt) {
        this.sessionStart = timer.startedAt;
      }

      // Settings
      if (breakinfo && breakinfo[0]) {
        if (breakinfo[0].intervalInMinutes) {
          this.workDurationSetting = breakinfo[0].intervalInMinutes;
        }
        if (breakinfo[0].breaktime) {
          this.breakDurationSetting = breakinfo[0].breaktime;
        }
      }

      // Notify listeners of the updated state
      this.notifyListeners();

      // Update last fetch time
      this.lastFetchTime = now;

      return timer;
    } catch (error) {
      console.error("Error fetching timer data:", error);
      return null;
    }
  }

  // Update user ID from localStorage with better isolation
  updateUserId() {
    try {
      const previousUserId = this.userId;
      const newUserId = localStorage.getItem("userId");

      if (newUserId) {
        // If user ID changed, clear all data for the previous user
        if (previousUserId && previousUserId !== newUserId) {
          //(`User ID changed from ${previousUserId} to ${newUserId}, clearing previous data`);
          this.clearAllData();
        }

        this.userId = newUserId;
      } else {
        if (this.userId) {
          //("User ID removed, clearing all data");
          this.clearAllData();
        }
        this.userId = null;
      }
    } catch (error) {
      console.error("Error getting userId from localStorage:", error);
      this.userId = null;
    }
  }

  // Add a listener function to be called when timer state changes
  subscribe(listener) {
    if (!this.listeners) {
      this.listeners = [];
    }

    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Notify all listeners of state change
  notifyListeners() {
    // Ensure listeners array exists before using forEach
    if (!this.listeners) {
      this.listeners = [];
    }

    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));

    // Save state to localStorage
    this.saveState();
  }
  async savebreaksettings() {
    this.updateUserId();
    if (!this.userId) {
      console.error("No user ID available, cannot save break settings");
      throw new Error("User ID not available");
    }


    try {
      // Use AbortController to set a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `http://localhost:5000/api/breaks/${this.userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            intervalInMinutes: this.workDurationSetting,
            breaktime: this.breakDurationSetting,
          }),
          signal: controller.signal,
        }
      );

      // Clear the timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Error updating break settings: ${response.status} ${response.statusText}`,
          errorText
        );
        throw new Error(
          `Error updating break settings: ${response.statusText}`
        );
      }

      //("Break settings saved successfully");
      const result = await response.json();
      return result;
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("Request timed out after 10 seconds");
        throw new Error("Request timed out. Please try again.");
      } else if (
        error.message &&
        error.message.includes("ERR_INSUFFICIENT_RESOURCES")
      ) {
        console.error("Browser resource limit reached.");
        throw new Error(
          "Browser resource limit reached. Please try again later."
        );
      } else {
        console.error("Error saving break settings:", error);
        throw error;
      }
    }
  }
  // Get current timer state - CRITICAL METHOD
  getState() {
    // Ensure seconds is a valid number
    if (typeof this.seconds !== "number" || isNaN(this.seconds)) {
      this.seconds = 0;
    }

    return {
      seconds: this.seconds,
      isRunning: this.isRunning,
      isOnBreak: this.isOnBreak,
      sessionStart: this.sessionStart,
      breakStart: this.breakStart,
      workLogs: this.workLogs || [],
      breakLogs: this.breakLogs || [],
      workDuration: this.workDuration || 0,
      breakDuration: this.breakDuration || 0,
      timerId: this.timerId,
      workDurationSetting: this.workDurationSetting || 25,
      breakDurationSetting: this.breakDurationSetting || 5,
      autoSaveInterval: this.autoSaveInterval
        ? this.autoSaveInterval / 1000
        : 30, // Convert to seconds for UI
    };
  }

  // Add setter methods for settings
  setWorkDurationSetting(minutes) {
    this.workDurationSetting = minutes;
    this.notifyListeners();
  }

  setBreakDurationSetting(minutes) {
    this.breakDurationSetting = minutes;
    this.notifyListeners();
  }

  // Fetch timer data from the server

  // New function to update timer data in the database by user ID and date
  async updateInDB() {
    this.updateUserId();
    if (!this.userId) {
      return false;
    }
    const now = Date.now();
    const updateTime = new Date().toISOString();
    const timerData = {
      worklogs: this.workLogs.map((log) => ({
        start: log.start,
        end: log.end,
        duration: log.duration,
        durationSeconds: log.durationSeconds,
      })),
      breaklogs: this.breakLogs.map((log) => ({
        start: log.start,
        end: log.end,
        duration: log.duration,
        durationSeconds: log.durationSeconds,
      })),
      workDuration: this.workDuration,
      breakDuration: this.breakDuration,
      isOnBreak: this.isOnBreak,
      isRunning: this.isRunning,
      startedAt: this.sessionStart,
      lastUpdated: updateTime,
    };

    try {
      const response = await fetch(
        `http://localhost:5000/api/focusTimers/${this.userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(timerData),
        }
      );

      if (!response.ok) {
        console.error(
          "Server returned error:",
          response.status,
          response.statusText
        );
        return false;
      }
      // console.log("Timer data updated successfully");
      const data = await response.json();
      //(`[${updateTime}] Server response:`, data);

      if (data && data._id && !this.timerId) {
        this.timerId = data._id;
      }

      this.lastServerSave = now;
      return true;
    } catch (error) {
      // Handle specific error types
      if (error.name === "AbortError") {
        console.error("Request timed out after 10 seconds");
      } else if (
        error.message &&
        error.message.includes("ERR_INSUFFICIENT_RESOURCES")
      ) {
        console.error(
          "Browser resource limit reached. Reducing update frequency."
        );
        // Increase the throttle time for future requests
        this.lastServerSave = now + 30000; // Add 30 seconds to throttle more aggressively
      } else {
        console.error("Error updating timer in DB:", error);
      }

      // Always save to localStorage as backup
      this.saveState();
      return false;
    }
  }

  // Fix the visibility change handler to preserve break state
  handleVisibilityChange() {
    console.log("Visibility changed:", document.visibilityState);

    if (document.visibilityState === 'hidden') {
      // Page is hidden (minimized or background tab)

      // Store the exact time when going to background
      this.backgroundStartTime = Date.now();

      // Store current state before going to background
      this.wasRunningBeforeBackground = this.isRunning;
      this.wasOnBreakBeforeBackground = this.isOnBreak;

      // Stop the timer interval completely
      this.stopAllTimers();

      // Save current state
      if (this.isRunning) {
        this.saveState();
        this.updateInDB().catch(err => {
          console.error('Error saving before background:', err);
        });
      }
    } else {

      // Only process if we were in background AND timer was running before background
      if (this.backgroundStartTime && this.wasRunningBeforeBackground) {
        const now = Date.now();
        const backgroundTime = this.backgroundStartTime;

        // Calculate exact elapsed time in seconds
        const elapsedMs = now - backgroundTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);


        // Restore break state
        this.isOnBreak = this.wasOnBreakBeforeBackground;

        // Update the appropriate timer based on break state
        if (!this.isOnBreak) {
          this.seconds += elapsedSeconds;
          this.workDuration += elapsedSeconds;
          console.log(`Updated work duration: ${this.workDuration}s`);
        } else {
          this.breakDuration += elapsedSeconds;
          console.log(`Updated break duration: ${this.breakDuration}s`);
        }

        // Mark as changed
        this.hasChangedSinceLastSave = true;

        // Update UI
        this.notifyListeners();

        // Save state
        this.saveState();
        this.updateInDB().catch(err => {
          console.error('Error updating after background:', err);
        });
      }

      // Reset background start time
      this.backgroundStartTime = null;

      // Restart the timer interval ONLY if it was running before going to background
      if (this.wasRunningBeforeBackground) {
        setTimeout(() => {
          // Ensure break state is preserved
          this.isOnBreak = this.wasOnBreakBeforeBackground;

          if (this.isOnBreak) {
            this.startBreakInterval();
          } else {
            this.startInterval();
          }
        }, 100);
      }
    }
  }

  // Start interval for timer updates
  startInterval() {
    this.stopAllTimers();

    this.isRunning = true;
    this.isOnBreak = false;

    this.intervalId = setInterval(() => {
      if (!this.isRunning || this.isOnBreak) return;
      if (document.visibilityState !== "visible") return;

      this.seconds += 1;
      this.workDuration += 1;

      this.hasChangedSinceLastSave = true;
      this.notifyListeners();

      if (this.seconds % 5 === 0) {
        console.log(`Timer: ${this.seconds}s, Work duration: ${this.workDuration}s`);
      }
    }, 1000);

    console.log("Work interval started with ID:", this.intervalId);
  }



  // Helper function to get formatted date and time
  getFormattedDateTime() {
    return new Date().toISOString(); // Always parseable

    // const now = new Date();
    // return now.toLocaleString('en-US', {
    //   hour: '2-digit',
    //   minute: '2-digit',
    //   second: '2-digit',
    //   hour12: true,
    //   day: '2-digit',
    //   month: '2-digit',
    //   year: 'numeric',
    // });
  }

  calculateDuration(startTime, endTime) {
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
  }
  // Start timer
  async startTimer() {
    // If we're already on a break, end it first
    if (this.isOnBreak) {
      await this.stopBreak();
    }

    // If we're already running a work session, end it first

    // Now start a new work session
    this.isRunning = true;
    this.isOnBreak = false;

    // Set session start time as formatted string
    this.sessionStart = this.getFormattedDateTime();

    // Start interval to update seconds
    this.startInterval();

    const openlog =
      this.workLogs.filter((log) => log.start && !log.end) || null;
    //  console.log("Opened log :",openlog);
    if (!openlog) {
      return;
    }
    // Add to work logs with explicit session type
    this.workLogs.push({
      type: "session",
      start: this.sessionStart,
      end: null,
      duration: null,
      durationSeconds: null,
    });

    // Add to combined logs array
    if (Array.isArray(this.logs)) {
      this.logs.push({
        type: "session",
        start: this.sessionStart,
        end: null,
        duration: null,
        durationSeconds: null,
      });
    }

    // Notify listeners
    this.notifyListeners();

    // Save directly to server instead of localStorage
    try {
      await this.updateInDB();
      // console.log("Timer started and saved to database");
    } catch (err) {
      console.error("Error saving timer start to database:", err);
      // Still save to localStorage as fallback
      this.saveState();
    }
  }

  // Pause timer
  async pauseTimer() {
    if (!this.isRunning) return;

    this.isRunning = false;

    // Clear the interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Update work logs if we were in a work session
    if (!this.isOnBreak && this.sessionStart) {
      const endTime = this.getFormattedDateTime();

      // Find the last work log without an end time
      const lastWorkLog = this.workLogs.find((log) => !log.end);
      if (lastWorkLog) {
        lastWorkLog.end = endTime;

        // Calculate session duration and add to workDuration
        const startTime = new Date(lastWorkLog.start);
        const endTimeDate = new Date(endTime);
        const sessionDurationSeconds = Math.floor(
          (endTimeDate - startTime) / 1000
        );

        // Add duration in seconds to the log
        lastWorkLog.durationSeconds = sessionDurationSeconds;
        lastWorkLog.duration = this.calculateDuration(
          lastWorkLog.start,
          endTime
        );
        await this.updateTimeGoals(sessionDurationSeconds);

        // Also update the corresponding log in the combined logs array
        if (Array.isArray(this.logs)) {
          const matchingLog = this.logs.find(
            (log) =>
              log.type === "session" &&
              log.start === lastWorkLog.start &&
              !log.end
          );
          if (matchingLog) {
            matchingLog.end = endTime;
            matchingLog.durationSeconds = sessionDurationSeconds;
            matchingLog.duration = lastWorkLog.duration;
          }
        }
      }

      this.sessionStart = null;
    }

    // Update break logs if we were on a break
    if (this.isOnBreak && this.breakStart) {
      const endTime = this.getFormattedDateTime();

      // Find the last break log without an end time
      const lastBreakLog = this.breakLogs.find((log) => !log.end);
      if (lastBreakLog) {
        lastBreakLog.end = endTime;

        // Calculate break duration
        const startTime = new Date(lastBreakLog.start);
        const endTimeDate = new Date(endTime);
        const breakDurationSeconds = Math.floor(
          (endTimeDate - startTime) / 1000
        );

        // Add duration in seconds to the log
        lastBreakLog.durationSeconds = breakDurationSeconds;
        lastBreakLog.duration = this.calculateDuration(
          lastBreakLog.start,
          endTime
        );

        // Ensure breakDuration is accurate
        // this.breakDuration += breakDurationSeconds;

        // Also update the corresponding log in the combined logs array
        if (Array.isArray(this.logs)) {
          const matchingLog = this.logs.find(
            (log) =>
              log.type === "break" &&
              log.start === lastBreakLog.start &&
              !log.end
          );
          if (matchingLog) {
            matchingLog.end = endTime;
            matchingLog.durationSeconds = breakDurationSeconds;
            matchingLog.duration = lastBreakLog.duration;
          }
        }
      }

      this.breakStart = null;
      this.isOnBreak = false;
    }

    // Notify listeners
    this.notifyListeners();

    // Update directly in DB instead of localStorage
    try {
      await this.updateInDB();
      // console.log("Timer paused and saved to database");
    } catch (err) {
      console.error("Error saving timer pause to database:", err);
      // Still save to localStorage as fallback
      this.saveState();
    }
  }

  // Start break
  async startBreak() {
    // If timer was running, pause it first
    if (this.isRunning && !this.isOnBreak) {
      // End the current work session
      const endTime = this.getFormattedDateTime();

      // Find the last work log without an end time
      const lastWorkLog = this.workLogs.find((log) => !log.end);
      if (lastWorkLog) {
        lastWorkLog.end = endTime;

        // Calculate work duration and add to workDuration
        const startTime = new Date(lastWorkLog.start);
        const endTimeDate = new Date(endTime);
        const sessionDurationSeconds = Math.floor(
          (endTimeDate - startTime) / 1000
        );

        // Add duration in seconds to the log
        lastWorkLog.durationSeconds = sessionDurationSeconds;
        lastWorkLog.duration = this.calculateDuration(
          lastWorkLog.start,
          endTime
        );

        // Ensure workDuration is accurate by adding this session's duration
        // this.workDuration += sessionDurationSeconds;

        // Update time goals with the duration - always update on pause
        await this.updateTimeGoals(sessionDurationSeconds);

        // Also update the corresponding log in the combined logs array
        if (Array.isArray(this.logs)) {
          const matchingLog = this.logs.find(
            (log) =>
              log.type === "session" &&
              log.start === lastWorkLog.start &&
              !log.end
          );
          if (matchingLog) {
            matchingLog.end = endTime;
            matchingLog.durationSeconds = sessionDurationSeconds;
            matchingLog.duration = lastWorkLog.duration;
          }
        }
      }

      this.sessionStart = null;

      // Clear the interval
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }

    // If we're already on a break, end it first
    if (this.isRunning && this.isOnBreak) {
      await this.stopBreak();
    }

    // Now start the break
    this.isRunning = true;
    this.isOnBreak = true;

    // Set break start time as formatted string
    this.breakStart = this.getFormattedDateTime();

    // Start interval to update break duration only
    this.startBreakInterval();

    // Add to break logs with explicit break type
    this.breakLogs.push({
      type: "break",
      start: this.breakStart,
      end: null,
      duration: null,
      durationSeconds: null,
    });

    // Add to combined logs array
    if (Array.isArray(this.logs)) {
      this.logs.push({
        type: "break",
        start: this.breakStart,
        end: null,
        duration: null,
        durationSeconds: null,
      });
    }

    // Notify listeners
    this.notifyListeners();

    // Update directly in DB instead of localStorage
    try {
      await this.updateInDB();
      // console.log("Break started and saved to database");
    } catch (err) {
      console.error("Error saving break start to database:", err);
      // Still save to localStorage as fallback
      this.saveState();
    }
  }

  // Start interval specifically for break tracking
  startBreakInterval() {
    // console.log("Starting new break interval");

    // First, stop ALL existing timers to prevent duplicates
    this.stopAllTimers();

    // Set timer state
    this.isRunning = true;
    this.isOnBreak = true;
    this.backgroundStartTime = null;

    // Use a timestamp-based approach
    let lastTick = Date.now();

    // Create a new interval with safeguards
    this.intervalId = setInterval(() => {
      // Only proceed if the timer is running and on break
      if (!this.isRunning || !this.isOnBreak) {
        return;
      }

      // Only increment if page is visible
      if (document.visibilityState !== "visible") {
        return;
      }

      // Calculate time since last tick
      const now = Date.now();
      const elapsed = now - lastTick;

      // Only increment if at least 950ms have passed
      if (elapsed >= 950) {
        // Increment by exactly 1 second
        this.breakDuration += 1;

        // Update last tick time
        lastTick = now;

        // Mark as changed and notify listeners
        this.hasChangedSinceLastSave = true;
        this.notifyListeners();

        // Log every 5 seconds for debugging
        if (this.breakDuration % 5 === 0) {
          // console.log(`Break duration: ${this.breakDuration}s`);
        }
      }
    }, 1000);

    // console.log("Break interval started with ID:", this.intervalId);
  }

  // Fix the stopBreak method to add more checks
  async stopBreak() {

    // Only proceed if we're actually on a break
    if (!this.isOnBreak) {
      console.log("Not on break, ignoring stopBreak call");
      return;
    }

    // End the current break
    const endTime = this.getFormattedDateTime();

    // Find the last break log without an end time
    const lastBreakLog = this.breakLogs.find((log) => !log.end);
    if (lastBreakLog) {
      lastBreakLog.end = endTime;

      // Calculate break duration and add to breakDuration
      const startTime = new Date(lastBreakLog.start);
      const endTimeDate = new Date(endTime);
      const breakDurationSeconds = Math.floor((endTimeDate - startTime) / 1000);

      // Add duration in seconds to the log
      lastBreakLog.durationSeconds = breakDurationSeconds;
      lastBreakLog.duration = this.calculateDuration(
        lastBreakLog.start,
        endTime
      );

      // Also update the corresponding log in the combined logs array
      if (Array.isArray(this.logs)) {
        const matchingLog = this.logs.find(
          (log) =>
            log.type === "break" && log.start === lastBreakLog.start && !log.end
        );
        if (matchingLog) {
          matchingLog.end = endTime;
          matchingLog.durationSeconds = breakDurationSeconds;
          matchingLog.duration = lastBreakLog.duration;
        }
      }
    }

    this.breakStart = null;
    this.isOnBreak = false;

    // Clear the interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Automatically start the work timer again
    this.isRunning = true;

    // Set new session start time
    this.sessionStart = this.getFormattedDateTime();

    // Add new work log entry
    this.workLogs.push({
      type: "session",
      start: this.sessionStart,
      end: null,
      duration: null,
      durationSeconds: null,
    });

    // Add to combined logs array
    if (Array.isArray(this.logs)) {
      this.logs.push({
        type: "session",
        start: this.sessionStart,
        end: null,
        duration: null,
        durationSeconds: null,
      });
    }

    // Start the interval for work tracking
    this.startInterval();

    // Notify listeners
    this.notifyListeners();

    // Update directly in DB instead of localStorage
    try {
      await this.updateInDB();
    } catch (err) {
      console.error("Error saving break stop to database:", err);
      // Still save to localStorage as fallback
      this.saveState();
    }
  }



  // Save state with user-specific keys
  saveState() {
    if (!this.userId) {
      //("No user ID, skipping saveState");
      return;
    }

    // Validate data before saving
    const validatedWorkLogs = Array.isArray(this.workLogs) ? this.workLogs : [];
    const validatedBreakLogs = Array.isArray(this.breakLogs)
      ? this.breakLogs
      : [];

    const state = {
      userId: this.userId, // Include userId in the state for verification
      seconds: typeof this.seconds === "number" ? this.seconds : 0,
      isRunning: !!this.isRunning,
      isOnBreak: !!this.isOnBreak,
      sessionStart: this.sessionStart,
      breakStart: this.breakStart,
      workLogs: validatedWorkLogs,
      breakLogs: validatedBreakLogs,
      workDuration:
        typeof this.workDuration === "number" ? this.workDuration : 0,
      breakDuration:
        typeof this.breakDuration === "number" ? this.breakDuration : 0,
      lastSaved: new Date().toISOString(),
    };

    try {
      // Save with user-specific key
      const key = `timerState_${this.userId}`;
      localStorage.setItem(key, JSON.stringify(state));

      // Also save to the generic key for backward compatibility
      localStorage.setItem("timerState", JSON.stringify(state));

      // Save today's logs
      const allLogs = [...validatedWorkLogs, ...validatedBreakLogs];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysLogs = allLogs.filter((log) => {
        if (!log || !log.start) return false;

        try {
          const logDate = new Date(log.start);
          return !isNaN(logDate.getTime()) && logDate >= today;
        } catch (e) {
          return false;
        }
      });

      const userLogsKey = `timerLogs_${this.userId}`;
      localStorage.setItem(userLogsKey, JSON.stringify(todaysLogs));
      localStorage.setItem("timerLogs", JSON.stringify(todaysLogs));

      // console.log(`[TimerService] Timer state and ${todaysLogs.length} logs saved for user ${this.userId}`);
    } catch (error) {
      console.error("Error saving timer state to localStorage:", error);
    }
  }
  // Load state with user-specific keys
  loadState() {
    try {
      if (!this.userId) {
        //("No user ID, skipping loadState");
        return;
      }
      // Try to load from user-specific key first
      const userKey = `timerState_${this.userId}`;
      let savedState = localStorage.getItem(userKey);
      // If not found, try the generic key as fallback
      if (!savedState) {
        savedState = localStorage.getItem("timerState");
      }

      if (savedState) {
        const state = JSON.parse(savedState);
        // Verify the state belongs to the current user
        if (state.userId && state.userId !== this.userId) {
          //(`State belongs to user ${state.userId}, not current user ${this.userId}. Ignoring.`);
          return;
        }

        // Ensure arrays are properly initialized
        this.workLogs = Array.isArray(state.workLogs) ? state.workLogs : [];
        this.breakLogs = Array.isArray(state.breakLogs) ? state.breakLogs : [];

        // Set other properties with fallbacks
        this.seconds = typeof state.seconds === "number" ? state.seconds : 0;
        this.isRunning = !!state.isRunning;
        this.isOnBreak = !!state.isOnBreak;
        this.sessionStart = state.sessionStart || null;
        this.breakStart = state.breakStart || null;
        this.workDuration =
          typeof state.workDuration === "number" ? state.workDuration : 0;
        this.breakDuration =
          typeof state.breakDuration === "number" ? state.breakDuration : 0;

        //(`Loaded state from localStorage for user ${this.userId}`);
      } else {
        //(`No saved state found in localStorage for user ${this.userId}`);
      }
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
      // Reset to defaults if there's an error
      this.seconds = 0;
      this.isRunning = false;
      this.isOnBreak = false;
      this.sessionStart = null;
      this.breakStart = null;
      this.workLogs = [];
      this.breakLogs = [];
      this.workDuration = 0;
      this.breakDuration = 0;
    }
  }

  // Completely reset timer state and localStorage with user-specific keys
  clearAllData() {
    //("Clearing all timer data");

    // Stop all timers first
    this.stopAllTimers();

    // Reset all timer state
    this.intervalId = null;
    this.autoSaveIntervalId = null;
    this.isRunning = false;
    this.isOnBreak = false;
    this.seconds = 0;
    this.workDuration = 0;
    this.breakDuration = 0;
    this.workLogs = [];
    this.breakLogs = [];
    this.timerId = null;
    this.sessionStart = null;
    this.breakStart = null;
    this.hasChangedSinceLastSave = false;
    this.resourceErrorCount = 0;
    this.lastFetchTime = null;
    this.lastServerSave = null;

    // Clear localStorage items for ALL users to prevent any data leakage
    localStorage.removeItem("timerState");
    localStorage.removeItem("timerLogs");

    // Also clear user-specific keys if they exist
    if (this.userId) {
      localStorage.removeItem(`timerState_${this.userId}`);
      localStorage.removeItem(`timerLogs_${this.userId}`);
    }

    // Notify listeners of the reset
    this.notifyListeners();

    //("Timer data cleared successfully");
  }
  // Debug function to check log integrity


  // Debug function to analyze logs and durations
  analyzeLogs() {

    let manualWorkDuration = 0;
    this.workLogs.forEach((log, index) => {
      if (log.start && log.end) {
        try {
          const start = new Date(log.start);
          const end = new Date(log.end);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const duration = Math.floor((end - start) / 1000);
            if (duration > 0) {
              manualWorkDuration += duration;
              //(`Work log #${index}: ${duration}s`);

              // Update the log with the calculated duration
              log.durationSeconds = duration;
              log.duration = this.calculateDuration(log.start, log.end);
            } else {
              //(`Work log #${index}: Invalid duration (${duration}s)`);
            }
          } else {
            //(`Work log #${index}: Invalid date format`);
          }
        } catch (error) {
          console.error(`Error processing work log #${index}:`, error);
        }
      }
    });

    let manualBreakDuration = 0;
    this.breakLogs.forEach((log, index) => {
      if (log.start && log.end) {
        try {
          const start = new Date(log.start);
          const end = new Date(log.end);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const duration = Math.floor((end - start) / 1000);
            if (duration > 0) {
              manualBreakDuration += duration;
              log.durationSeconds = duration;
              log.duration = this.calculateDuration(log.start, log.end);
            } else {
              //(`Break log #${index}: Invalid duration (${duration}s)`);
            }
          } else {
            //(`Break log #${index}: Invalid date format`);
          }
        } catch (error) {
          console.error(`Error processing break log #${index}:`, error);
        }
      }
    });
    return {
      manualWorkDuration,
      manualBreakDuration,
    };
  }

  // Add a method to update time goals
  async updateTimeGoals(durationInSeconds) {
    try {
      //(`Updating time goals with ${durationInSeconds} seconds`);
      await goalService.updateGoalProgressForTime(durationInSeconds);
      // console.log("Time goals updated successfully....");
    } catch (error) {
      console.error("Error updating time goals:", error);
    }
  }
  initialize() {
    console.log("Initializing timer service");
    // Clean up any existing timers first
    this.stopAllTimers();
    // Update user ID
    this.updateUserId();

    // Bind methods that need 'this' context
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.startInterval = this.startInterval.bind(this);
    this.startBreakInterval = this.startBreakInterval.bind(this);
    this.stopAllTimers = this.stopAllTimers.bind(this);
    this.stopBreak = this.stopBreak.bind(this);

    // Remove any existing visibility change listeners to prevent duplicates
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    // Add visibility change listener
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Fetch timer data from server or localStorage
    this.fetchTimerData()
      .then((result) => {
        // Check for corrupted timer state
        if (result && (
            typeof this.seconds !== 'number' ||
            isNaN(this.seconds) ||
            this.seconds > 24 * 60 * 60 || // More than 24 hours
            this.workDuration > 24 * 60 * 60
          )) {
          console.error("Corrupted timer state detected, resetting");
          return this.resetTimerState();
        }


        // If timer should be running, start it
        if (this.isRunning) {
          console.log("Timer was running in database, restarting timer...");

          // Ensure we don't have any running timers before starting new ones
          this.stopAllTimers();

          // Start the appropriate timer with a slight delay
          setTimeout(() => {
            if (this.isOnBreak) {
              console.log("Restarting break timer");
              this.startBreakInterval();
            } else {
              console.log("Restarting work timer");
              this.startInterval();
            }
          }, 100);
        } else {
          console.log("Timer was not running in database, keeping it paused");
        }

        return result;
      })
      .catch((err) => {
        console.error("Error fetching timer data:", err);
        // Load from localStorage as fallback
        this.loadState();
      });

    // Start auto-save with a slight delay to prevent race conditions
    setTimeout(() => this.startAutoSave(), 500);
  }
  // Completely stop all timers and intervals
  stopAllTimers() {
    // console.log("Stopping all timers");

    // Clear the main interval
    if (this.intervalId) {
      // console.log("Clearing interval ID:", this.intervalId);
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Clear auto-save interval
    if (this.autoSaveIntervalId) {
      clearInterval(this.autoSaveIntervalId);
      this.autoSaveIntervalId = null;
    }

    // Clear auto-save check
    if (this.autoSaveCheckId) {
      clearInterval(this.autoSaveCheckId);
      this.autoSaveCheckId = null;
    }

    // Clear animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Add or update this method to get all timer logs
  getAllLogs() {
    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.updateUserId();
    // Get user-specific logs if available
    if (this.userId) {
      const userLogsKey = `timerLogs_${this.userId}`;
      const storedLogs = localStorage.getItem(userLogsKey);
      if (storedLogs) {
        try {
          const logs = JSON.parse(storedLogs);
          if (Array.isArray(logs)) {
            // Filter for today's logs and ensure each log has a valid type
            const todaysLogs = logs.filter((log) => {
              if (!log || !log.start) return false;

              // Ensure each log has a valid type
              if (!log.type) {
                // If no type, infer from which array it came from
                if (this.workLogs.some((wl) => wl.start === log.start)) {
                  log.type = "session";
                } else if (
                  this.breakLogs.some((bl) => bl.start === log.start)
                ) {
                  log.type = "break";
                } else {
                  // Default to session if we can't determine
                  log.type = "session";
                }
              }

              try {
                const logDate = new Date(log.start);
                return !isNaN(logDate.getTime()) && logDate >= today;
              } catch (e) {
                return false;
              }
            });

            // console.log(`[TimerService] Retrieved ${todaysLogs.length} logs for today (user ${this.userId})`);

            // Sort logs by start time (newest first)
            return todaysLogs.sort((a, b) => {
              try {
                return new Date(b.start) - new Date(a.start);
              } catch (e) {
                return 0;
              }
            });
          }
        } catch (error) {
          console.error("Error parsing timer logs:", error);
          return [];
        }
      }
    }

    // Fallback to general logs if no user-specific logs
    const storedLogs = localStorage.getItem("timerLogs");
    if (storedLogs) {
      try {
        const logs = JSON.parse(storedLogs);
        if (Array.isArray(logs)) {
          // Filter for today's logs and ensure each log has a valid type
          const todaysLogs = logs.filter((log) => {
            if (!log || !log.start) return false;

            // Ensure each log has a valid type
            if (!log.type) {
              // If no type, infer from which array it came from
              if (this.workLogs.some((wl) => wl.start === log.start)) {
                log.type = "session";
              } else if (this.breakLogs.some((bl) => bl.start === log.start)) {
                log.type = "break";
              } else {
                // Default to session if we can't determine
                log.type = "session";
              }
            }

            try {
              const logDate = new Date(log.start);
              return !isNaN(logDate.getTime()) && logDate >= today;
            } catch (e) {
              return false;
            }
          });
          // Sort logs by start time (newest first)
          return todaysLogs.sort((a, b) => {
            try {
              return new Date(b.start) - new Date(a.start);
            } catch (e) {
              return 0;
            }
          });
        }
      } catch (error) {
        console.error("Error parsing general timer logs:", error);
        return [];
      }
    }

    // console.log("[TimerService] No timer logs found");
    return [];
  }

  // Add a method to check if auto-save is still running
  checkAutoSaveStatus() {
    // console.log("Checking auto-save status");
    if (this.isRunning && !this.autoSaveIntervalId) {
      // console.log("Timer running but auto-save stopped, restarting auto-save");
      this.startAutoSave();
    }
  }


}

// Create a single instance
const timerServiceInstance = new TimerService();
// Export the instance
export default timerServiceInstance;