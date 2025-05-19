import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, X, Check } from 'lucide-react';
import meditationService from '../services/MeditationService';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toastStyles';

export default function Meditation() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [meditationSessions, setMeditationSessions] = useState([]);
  const [sessionsByType, setSessionsByType] = useState({});
  const [completedSessionIds, setCompletedSessionIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  // Function to fetch meditation sessions and completed status
  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching meditation sessions...');
      
      // First, ensure we get the latest completed sessions
      await meditationService.getuserneditationsession();
      
      // Then get all meditation sessions
      const sessions = await meditationService.getMeditationSessions();
      console.log('Fetched sessions:', sessions);
      
      const completed = meditationService.completedIds;
      console.log('Completed sessions:', completed);
      
      setMeditationSessions(sessions);
      setCompletedSessionIds(new Set(completed));

      // Categorize sessions by type
      const categorized = sessions.reduce((acc, session) => {
        if (!acc[session.type]) {
          acc[session.type] = [];
        }
        acc[session.type].push(session);
        return acc;
      }, {});

      setSessionsByType(categorized);
    } catch (err) {
      console.error('Error fetching meditation sessions:', err);
      setError('Failed to load meditation sessions. Please try again later.');
      
      // Set empty states to prevent undefined errors
      setMeditationSessions([]);
      setSessionsByType({});
      setCompletedSessionIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const openSessionDialog = (session) => {
    setSelectedSession(session);
    setSessionDialogOpen(true);
    if (isPlaying) {
      audioRef.current.pause();
      clearInterval(timerRef.current);
      setIsPlaying(false);
    }
  };

  const closeSessionDialog = () => {
    setSessionDialogOpen(false);
    setSelectedSession(null);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Add this function to get the duration of the meditation session
  const getSessionDuration = () => {
    // If we have a video reference and it has a valid duration, use that
    if (videoRef.current && !isNaN(videoRef.current.duration)) {
      return Math.round(videoRef.current.duration);
    }
    
    // If we have a selected session with a duration property, use that
    if (selectedSession && selectedSession.duration) {
      return selectedSession.duration;
    }
    
    // Otherwise, use a default duration of 5 minutes (300 seconds)
    return 300;
  };

  // Update the markSessionComplete function to include duration
  const markSessionComplete = async () => {
    try {
      if (selectedSession) {
        // Get the duration of the session in seconds
        const duration = getSessionDuration();
        
        // Mark the session as complete with the duration
        await meditationService.markSessionComplete(selectedSession._id, duration);
        
        // Update the UI
        setCompletedSessionIds(new Set([...completedSessionIds, selectedSession._id]));
        closeSessionDialog();
        showSuccessToast("Meditation session completed!");
      }
    } catch (error) {
      console.error('Error marking session complete:', error);
      showErrorToast("Failed to mark session as complete. Please try again.");
    }
  };

  // Add this function to calculate completion percentage
  const calculateCompletionPercentage = (type) => {
    if (!sessionsByType[type] || sessionsByType[type].length === 0) return 0;
    
    const totalSessions = sessionsByType[type].length;
    const completedSessions = sessionsByType[type].filter(session => 
      completedSessionIds.has(session._id)
    ).length;
    
    return Math.round((completedSessions / totalSessions) * 100);
  };

  // Add this function to calculate overall completion percentage
  const calculateOverallCompletionPercentage = () => {
    if (meditationSessions.length === 0) return 0;
    
    const totalSessions = meditationSessions.length;
    const completedSessions = meditationSessions.filter(session => 
      completedSessionIds.has(session._id)
    ).length;
    
    return Math.round((completedSessions / totalSessions) * 100);
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] text-white flex flex-col items-center p-4 overflow-x-hidden">
      {/* Overall Progress Bar */}
      <div className="w-full max-w-5xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Meditation</h1>
          {loading ? (
            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gray-600 rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
          ) : (
            <div className="flex items-center text-sm text-gray-400">
              <span className="mr-2">
                {meditationSessions.filter(session => completedSessionIds.has(session._id)).length}/{meditationSessions.length} completed
              </span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-teal-500 rounded-full transition-all duration-500 ${
                    calculateOverallCompletionPercentage() === 100 ? 'animate-pulse' : ''
                  }`}
                  style={{ width: `${calculateOverallCompletionPercentage()}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Session Dialog */}
      {sessionDialogOpen && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f3460] rounded-lg shadow-lg p-6 w-full max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{selectedSession.title}</h2>
              <button onClick={closeSessionDialog} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-300 mb-4">{selectedSession.description}</p>

            {selectedSession.type === 'video' ? (
              <div className="aspect-video mb-4">
                <video
                  ref={videoRef}
                  src={`${meditationService.medialurl}${selectedSession.url}`}
                  controls
                  className="w-full h-full rounded"
                  onEnded={closeSessionDialog}
                />
              </div>
            ) : (
              <div className="aspect-video mb-4 bg-[#1e1e1e] rounded flex items-center justify-center">
                <audio
                  ref={videoRef}
                  src={selectedSession.url}
                  controls
                  onEnded={closeSessionDialog}
                  className="w-3/4"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={markSessionComplete}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
              >
                <Check size={18} className="mr-2" />
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl">
        {/* Guided Meditation Sessions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Guided Meditation Sessions</h2>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500 bg-opacity-20 text-red-300 p-4 rounded">
              {error}
            </div>
          ) : (
            <div>
              {Object.entries(sessionsByType).map(([type, sessions]) => (
                <div key={type} className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold capitalize">{type} Meditations</h3>
                    <div className="flex items-center text-sm text-gray-400">
                      <span className="mr-2">
                        {sessions.filter(session => completedSessionIds.has(session._id)).length}/{sessions.length} completed
                      </span>
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-teal-500 rounded-full transition-all duration-300 ${
                            calculateCompletionPercentage(type) === 100 ? 'animate-pulse' : ''
                          }`}
                          style={{ width: `${calculateCompletionPercentage(type)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {sessions.map(session => {
                      const isCompleted = completedSessionIds.has(session._id);
                      return (
                        <div
                          key={session._id}
                          className={`relative bg-[#0f3460]/80 backdrop-blur-sm rounded-lg shadow-lg p-4 cursor-pointer hover:bg-[#0f3460] transition-colors ${isCompleted ? 'border-2 border-green-500' : ''}`}
                          onClick={() => openSessionDialog(session)}
                        >
                          <h4 className="font-bold mb-2">{session.title}</h4>
                          <p className="text-sm text-gray-300 line-clamp-2">{session.description}</p>
                          <div className="mt-3 flex items-center text-blue-300">
                            <Play size={16} className="mr-1" />
                            <span className="text-sm">Play {type}</span>
                          </div>
                          {isCompleted && (
                            <div className="absolute top-2 right-2 text-green-400">
                              <Check size={20} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Self-Guided Meditation Timer */}
       
      </div>
    </div>
  );
}
