import React, { useState, useEffect } from 'react';
import { User, Edit, Save, X, LogOut, Clock, Coffee, Target, Calendar, BarChart2, Award } from 'lucide-react';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import timerService from '../services/TimerService';
import goalService from '../services/GoalService';
import { showSuccessToast, showErrorToast } from '../utils/toastStyles';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [timerStats, setTimerStats] = useState({
    totalWorkTime: 0,
    totalBreakTime: 0,
    sessionsPerDay: [],
    breaksPerDay: [],
  });
  const [goalStats, setGoalStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    byCategory: {},
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [chartsLoading, setChartsLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const navigate = useNavigate();

  // Get user ID from localStorage
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchUserData();
    fetchTimerStats();
    fetchGoalStats();
    fetchAchievements();
  }, [userId]); // Add userId as a dependency

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Check if user is logged in
      if (!userId) {
        showErrorToast("Please login to view your profile");
        setLoading(false);
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/user/${userId}`);
      if (response.data) {
        setUser(response.data);
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
        });
        
        // Set user achievements if available
        if (response.data.achievements && Array.isArray(response.data.achievements)) {
          setUserAchievements(response.data.achievements);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      showErrorToast("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimerStats = async () => {
    try {
      setChartsLoading(true);
      // Check if user is logged in
      if (!userId) {
        console.warn("No user ID available for fetching timer stats");
        return;
      }

      console.log("Fetching timer stats for user:", userId);
      
      // Fetch timer data from API instead of localStorage
      const response = await axios.get(`http://localhost:5000/api/focusTimers/${userId}`);
      console.log("API response:", response.data);
      
      if (!response.data) {
        console.warn("No timer data returned from API");
        return;
      }
      
      // Extract work logs and break logs from API response
      const workLogs = response.data.worklogs || [];
      const breakLogs = response.data.breaklogs || [];
      
      console.log("Retrieved work logs:", workLogs.length, "break logs:", breakLogs.length);
      
      // Calculate total work and break time
      const totalWorkTime = response.data.workDuration || 
        workLogs.reduce((total, log) => {
          return total + (log.durationSeconds || 0);
        }, 0);
      
      const totalBreakTime = response.data.breakDuration || 
        breakLogs.reduce((total, log) => {
          return total + (log.durationSeconds || 0);
        }, 0);
      
      console.log("Total work time:", totalWorkTime, "Total break time:", totalBreakTime);
      
      // Group sessions by day
      const sessionsPerDay = groupLogsByDay(workLogs);
      const breaksPerDay = groupLogsByDay(breakLogs);
      
      setTimerStats({
        totalWorkTime,
        totalBreakTime,
        sessionsPerDay,
        breaksPerDay,
      });
    } catch (error) {
      console.error("Error fetching timer stats:", error);
    } finally {
      setChartsLoading(false);
    }
  };

  const fetchGoalStats = async () => {
    try {
      setChartsLoading(true);
      // Check if user is logged in
      if (!userId) {
        console.warn("No user ID available for fetching goal stats");
        return;
      }

      console.log("Fetching goal stats for user:", userId);
      
      // Import the goal service if not already imported
      const goalService = require('../services/GoalService').default;
      
      // Get all goals for the user
      const goals = await goalService.getAllGoals();
      console.log("Retrieved goals:", goals.length);
      
      if (!goals || goals.length === 0) {
        console.log("No goals found for user");
        return;
      }
      
      const completed = goals.filter(goal => goal.status === 'completed').length;
      const pending = goals.filter(goal => goal.status !== 'completed').length;
      
      // Group goals by category
      const byCategory = goals.reduce((acc, goal) => {
        const category = goal.goalType || 'other';
        if (!acc[category]) {
          acc[category] = { total: 0, completed: 0 };
        }
        acc[category].total++;
        if (goal.status === 'completed') {
          acc[category].completed++;
        }
        return acc;
      }, {});
      
      console.log("Goal stats:", { total: goals.length, completed, pending, byCategory });
      
      setGoalStats({
        total: goals.length,
        completed,
        pending,
        byCategory,
      });
    } catch (error) {
      console.error("Error fetching goal stats:", error);
    } finally {
      setChartsLoading(false);
    }
  };

  // Fetch all achievements
  const fetchAchievements = async () => {
    try {
      setChartsLoading(true);
      const response = await axios.get('http://localhost:5000/api/achievements');
      if (response.data) {
        setAchievements(response.data);
      }
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setChartsLoading(false);
    }
  };

  // Helper function to group logs by day
  const groupLogsByDay = (logs) => {
    const grouped = logs.reduce((acc, log) => {
      if (!log.start) return acc;
      
      const date = new Date(log.start).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { count: 0, duration: 0 };
      }
      acc[date].count++;
      acc[date].duration += (log.durationSeconds || 0);
      return acc;
    }, {});
    
    // Convert to array format for charts
    const last7Days = getLast7Days();
    return last7Days.map(date => ({
      date,
      count: grouped[date]?.count || 0,
      duration: grouped[date]?.duration || 0,
    }));
  };

  // Get last 7 days as array of date strings
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString());
    }
    return dates;
  };

  // Format seconds to hours and minutes
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Add console logs to debug chart data
  useEffect(() => {
    console.log("Timer stats updated:", timerStats);
    console.log("Sessions chart data:", sessionsChartData);
    console.log("Breaks chart data:", breaksChartData);
    console.log("Focus time chart data:", focusTimeChartData);
  }, [timerStats]);

  useEffect(() => {
    console.log("Goal stats updated:", goalStats);
    console.log("Goal status chart data:", goalStatusChartData);
    console.log("Goal category chart data:", goalCategoryChartData);
  }, [goalStats]);

  // Chart data for sessions per day
  const sessionsChartData = {
    labels: timerStats.sessionsPerDay.map(day => day.date),
    datasets: [
      {
        label: 'Focus Sessions',
        data: timerStats.sessionsPerDay.map(day => day.count),
        backgroundColor: '#14b8a6',
        borderRadius: 4,
      },
    ],
  };

  // Chart data for breaks per day
  const breaksChartData = {
    labels: timerStats.breaksPerDay.map(day => day.date),
    datasets: [
      {
        label: 'Breaks Taken',
        data: timerStats.breaksPerDay.map(day => day.count),
        backgroundColor: '#0d9488',
        borderRadius: 4,
      },
    ],
  };

  // Chart data for focus time per day
  const focusTimeChartData = {
    labels: timerStats.sessionsPerDay.map(day => day.date),
    datasets: [
      {
        label: 'Focus Time (minutes)',
        data: timerStats.sessionsPerDay.map(day => Math.round(day.duration / 60)),
        backgroundColor: '#0f766e',
        borderRadius: 4,
      },
    ],
  };

  // Chart data for goals by status
  const goalStatusChartData = {
    labels: ['Completed', 'Pending'],
    datasets: [
      {
        data: [goalStats.completed, goalStats.pending],
        backgroundColor: ['#14b8a6', '#0f766e'],
        borderWidth: 0,
      },
    ],
  };

  // Chart data for goals by category
  const goalCategoryChartData = {
    labels: Object.keys(goalStats.byCategory).length > 0 
      ? Object.keys(goalStats.byCategory) 
      : ['No Categories'],
    datasets: [
      {
        label: 'Total',
        data: Object.keys(goalStats.byCategory).length > 0
          ? Object.values(goalStats.byCategory).map(cat => cat.total)
          : [0],
        backgroundColor: '#0f766e',
        borderRadius: 4,
      },
      {
        label: 'Completed',
        data: Object.keys(goalStats.byCategory).length > 0
          ? Object.values(goalStats.byCategory).map(cat => cat.completed)
          : [0],
        backgroundColor: '#14b8a6',
        borderRadius: 4,
      },
    ],
  };

  // First, make sure Chart.js is properly registered
  useEffect(() => {
    // Register Chart.js components
    ChartJS.register(
      ArcElement,
      CategoryScale,
      LinearScale,
      BarElement,
      PointElement,
      LineElement,
      Title,
      Tooltip,
      Legend
    );
    
    console.log("Chart.js components registered");
  }, []);

  // Define chart options with explicit dimensions and responsive settings
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e5e7eb',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#e5e7eb',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: '#374151',
          borderColor: '#374151',
          display: false
        },
        ticks: {
          color: '#9ca3af'
        }
      },
      y: {
        grid: {
          color: '#374151',
          borderColor: '#374151',
          display: false
        },
        ticks: {
          color: '#9ca3af'
        }
      }
    }
  };

  // Define pie chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#e5e7eb',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#e5e7eb',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(`http://localhost:5000/api/user/${userId}`, formData);

      if (response.status === 200) {
        showSuccessToast("Profile updated successfully");
        setUser({
          ...user,
          ...formData,
        });
        setEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showErrorToast("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    const userId = localStorage.getItem('userId');
    //(`Logging out user: ${userId}`);

    // Clear the ENTIRE localStorage
    localStorage.clear();
    
    // Show success message
    showSuccessToast("Logged out successfully");

    // Redirect to home page after a short delay
    setTimeout(() => {
      navigate('/');
      window.location.reload(); // Force reload to update navbar state
    }, 1500);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        setLoading(true);
        await axios.delete(`http://localhost:5000/api/user/${userId}`);
        showSuccessToast("Account deleted successfully");

        // Clear entire localStorage
        localStorage.clear();
        
        setTimeout(() => {
          navigate('/');
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Error deleting account:", error);
        showErrorToast("Failed to delete account");
        setLoading(false);
      }
    }
  };

  // Render the achievements tab
  const renderAchievementsTab = () => {
    const imgurl = 'http://localhost:5000/content/';
    
    // Find full achievement objects for user's achievements
    const earnedAchievements = achievements.filter(achievement => 
      userAchievements.includes(achievement._id)
    );
    
    // Get achievements not yet earned
    const unearnedAchievements = achievements.filter(achievement => 
      !userAchievements.includes(achievement._id)
    );
    
    return (
      <div className="space-y-4 max-w-3xl mx-auto px-4">
        {/* Earned Achievements */}
        <div className="bg-[#1e1e1e] p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-white flex items-center">
            <Award className="mr-2 text-teal-500" size={18} />
            Your Achievements
          </h3>
          
          {earnedAchievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {earnedAchievements.map(achievement => (
                <div key={achievement._id} className="bg-[#2d3748] rounded-lg p-3 border border-teal-800 transition-all duration-200 hover:-translate-y-1">
                  <div className="flex items-center">
                    <div className="bg-teal-900/30 p-1.5 rounded-full mr-2 flex-shrink-0">
                      {achievement.image ? (
                        <img
                          src={imgurl + achievement.image}
                          alt={achievement.title}
                          className="h-8 w-8 object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/32?text=🏆';
                          }}
                        />
                      ) : (
                        <Award className="h-5 w-5 text-teal-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white truncate-text">{achievement.title}</h3>
                      {achievement.description && (
                        <p className="text-gray-400 text-xs truncate-text">{achievement.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#2d3748] p-3 rounded-lg text-center">
              <Award className="mx-auto h-8 w-8 text-gray-600 mb-2" />
              <p className="text-gray-400 text-sm">No achievements earned yet</p>
            </div>
          )}
        </div>
        
        {/* Available Achievements */}
        <div className="bg-[#1e1e1e] p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-white flex items-center">
            <Award className="mr-2 text-gray-500" size={18} />
            Available Achievements
          </h3>
          
          {unearnedAchievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {unearnedAchievements.map(achievement => (
                <div key={achievement._id} className="bg-[#2d3748] rounded-lg p-3 border border-gray-700 opacity-80 transition-all duration-200 hover:opacity-100">
                  <div className="flex items-center">
                    <div className="bg-gray-800 p-1.5 rounded-full mr-2 flex-shrink-0">
                      {achievement.image ? (
                        <img
                          src={imgurl + achievement.image}
                          alt={achievement.title}
                          className="h-8 w-8 object-contain grayscale"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/32?text=🏆';
                          }}
                        />
                      ) : (
                        <Award className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 truncate-text">{achievement.title}</h3>
                      {achievement.description && (
                        <p className="text-gray-500 text-xs truncate-text">{achievement.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#2d3748] p-3 rounded-lg text-center">
              <Award className="mx-auto h-8 w-8 text-gray-600 mb-2" />
              <p className="text-gray-400 text-sm">No more achievements available</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-6">
        <div className="max-w-2xl mx-auto bg-[#1e1e1e] rounded-lg p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Profile</h1>
          <p className="text-gray-300 mb-4">Please login to view your profile</p>
          <button
            onClick={() => navigate('/')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 sm:p-6 overflow-x-hidden">
      <ToastContainer position="top-right" theme="dark" />

      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-r from-teal-900 to-teal-700 rounded-t-lg h-40 sm:h-56 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 to-teal-700/80"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          
          <div className="absolute -bottom-16 left-6 sm:left-8">
            <div className="bg-[#1e1e1e] rounded-full p-1 w-32 h-32 flex items-center justify-center">
              <div className="bg-gradient-to-br from-teal-700 to-teal-900 rounded-full w-full h-full flex items-center justify-center">
                <User size={64} className="text-white" />
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="absolute top-4 right-4">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md flex items-center gap-1 transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-[#1e1e1e] rounded-b-lg shadow-lg">
          <div className="pt-20 px-6 pb-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-bold">{user?.name || 'User Profile'}</h1>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                >
                  <Edit size={16} /> Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => setEditing(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                >
                  <X size={16} /> Cancel
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-700 mb-6">
              <nav className="-mb-px flex space-x-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-teal-500 text-teal-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'stats'
                      ? 'border-teal-500 text-teal-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                  }`}
                >
                  Statistics
                </button>
                <button
                  onClick={() => setActiveTab('achievements')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'achievements'
                      ? 'border-teal-500 text-teal-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                  }`}
                >
                  Achievements
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <>
                {editing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full bg-[#2d3748] border ${errors.name ? 'border-red-500' : 'border-gray-600'} rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500`}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full bg-[#2d3748] border ${errors.email ? 'border-red-500' : 'border-gray-600'} rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500`}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-[#2d3748] border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full bg-[#2d3748] border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                        disabled={loading}
                      >
                        Delete Account
                      </button>

                      <button
                        type="submit"
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center gap-1"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : (
                          <>
                            <Save size={16} /> Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-[#2d3748] p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Personal Information</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-white">{user?.email || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-white">{user?.phone || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Address</p>
                            <p className="text-white">{user?.address || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#2d3748] p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Account Statistics</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#1e1e1e] p-3 rounded">
                            <p className="text-xs text-gray-400">Member Since</p>
                            <p className="text-lg font-semibold">
                              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>

                          <div className="bg-[#1e1e1e] p-3 rounded">
                            <p className="text-xs text-gray-400">Goals</p>
                            <p className="text-lg font-semibold">{goalStats.total}</p>
                          </div>

                          <div className="bg-[#1e1e1e] p-3 rounded">
                            <p className="text-xs text-gray-400">Focus Time</p>
                            <p className="text-lg font-semibold">{formatTime(timerStats.totalWorkTime)}</p>
                          </div>

                          <div className="bg-[#1e1e1e] p-3 rounded">
                            <p className="text-xs text-gray-400">Break Time</p>
                            <p className="text-lg font-semibold">{formatTime(timerStats.totalBreakTime)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#2d3748] p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-400 mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-2 bg-[#1e1e1e] rounded">
                          <div className="bg-teal-900 p-2 rounded">
                            <Clock size={16} className="text-teal-400" />
                          </div>
                          <div>
                            <p className="text-sm">Focus Sessions</p>
                            <p className="text-xs text-gray-400">
                              {timerStats.sessionsPerDay.reduce((total, day) => total + day.count, 0)} sessions in the last 7 days
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-2 bg-[#1e1e1e] rounded">
                          <div className="bg-teal-900 p-2 rounded">
                            <Coffee size={16} className="text-teal-400" />
                          </div>
                          <div>
                            <p className="text-sm">Breaks Taken</p>
                            <p className="text-xs text-gray-400">
                              {timerStats.breaksPerDay.reduce((total, day) => total + day.count, 0)} breaks in the last 7 days
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-2 bg-[#1e1e1e] rounded">
                          <div className="bg-teal-900 p-2 rounded">
                            <Target size={16} className="text-teal-400" />
                          </div>
                          <div>
                            <p className="text-sm">Goals Progress</p>
                            <p className="text-xs text-gray-400">
                              {goalStats.completed} of {goalStats.total} goals completed
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                {chartsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-[#2d3748] p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-gray-300">Focus Sessions Per Day</h3>
                          <div className="bg-teal-900/50 p-1 rounded">
                            <BarChart2 size={16} className="text-teal-400" />
                          </div>
                        </div>
                        <div className="h-64 w-full">
                          {timerStats.sessionsPerDay && timerStats.sessionsPerDay.length > 0 ? (
                            <Bar 
                              data={sessionsChartData} 
                              options={chartOptions} 
                              width={100}
                              height={50}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-gray-400">No session data available</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-[#2d3748] p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-gray-300">Breaks Per Day</h3>
                          <div className="bg-teal-900/50 p-1 rounded">
                            <Coffee size={16} className="text-teal-400" />
                          </div>
                        </div>
                        <div className="h-64 w-full">
                          {timerStats.breaksPerDay && timerStats.breaksPerDay.length > 0 ? (
                            <Bar 
                              data={breaksChartData} 
                              options={chartOptions}
                              width={100}
                              height={50}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-gray-400">No break data available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#2d3748] p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-300">Focus Time Per Day (minutes)</h3>
                        <div className="bg-teal-900/50 p-1 rounded">
                          <Clock size={16} className="text-teal-400" />
                        </div>
                      </div>
                      <div className="h-64 w-full">
                        {timerStats.sessionsPerDay && timerStats.sessionsPerDay.length > 0 ? (
                          <Bar 
                            data={focusTimeChartData} 
                            options={chartOptions}
                            width={100}
                            height={50}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-400">No focus time data available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-[#2d3748] p-4 rounded-lg col-span-1">
                        <h3 className="text-sm font-medium text-gray-300 mb-4">Focus vs Break Time</h3>
                        <div className="flex items-center justify-center h-48">
                          {timerStats.totalWorkTime > 0 || timerStats.totalBreakTime > 0 ? (
                            <Pie 
                              data={{
                                labels: ['Focus Time', 'Break Time'],
                                datasets: [{
                                  data: [timerStats.totalWorkTime, timerStats.totalBreakTime],
                                  backgroundColor: ['#14b8a6', '#0f766e'],
                                  borderWidth: 0
                                }]
                              }}
                              options={pieOptions}
                              width={100}
                              height={100}
                            />
                          ) : (
                            <p className="text-gray-400">No time data available</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-[#2d3748] p-4 rounded-lg col-span-2">
                        <h3 className="text-sm font-medium text-gray-300 mb-4">Goals by Status</h3>
                        <div className="h-48 flex items-center justify-center">
                          {goalStats.total > 0 ? (
                            <Pie 
                              data={goalStatusChartData}
                              options={pieOptions}
                              width={100}
                              height={100}
                            />
                          ) : (
                            <p className="text-gray-400">No goal data available</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#2d3748] p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-300 mb-4">Goals by Category</h3>
                      <div className="h-64">
                        <Bar 
                          data={goalCategoryChartData}
                          options={chartOptions}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'achievements' && (
              renderAchievementsTab()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;








