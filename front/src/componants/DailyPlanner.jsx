import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaTrash, FaEdit, FaCalendarAlt, FaTimes } from 'react-icons/fa';
// import './css/dailyplanner.css';
import taskService from '../services/TaskService';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toastStyles';

const TaskModal = ({ isOpen, onClose, onSubmit, task = null }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    category: 'Work',
    priority: 'Medium',
    deadline: '',
    completed: false
  });

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Initialize form with task data if editing
  useEffect(() => {
    if (task) {
      // Convert numeric priority to string for display
      const priorityMap = {
        1: 'High',
        2: 'Medium',
        3: 'Low'
      };

      setTaskData({
        title: task.title || '',
        description: task.description || '',
        category: task.category || 'Work',
        priority: priorityMap[task.priority] || 'Medium',
        deadline: task.deadline ? task.deadline.substring(0, 10) : '',
        completed: task.completed || false
      });
    } else {
      // Reset form when adding new task
      setTaskData({
        title: '',
        description: '',
        category: 'Work',
        priority: 'Medium',
        deadline: '',
        completed: false
      });
    }
  }, [task, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaskData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(taskData, task?._id);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
   <dialog
  open={isOpen}
  className="fixed z-50 left-0 top-0 w-full h-full flex items-center justify-center bg-black/90 backdrop-blur-sm"
  onClose={onClose}
  style={{ border: "none", background: "transparent", padding: 0 }}
>
  <div className="modal-content bg-black rounded-lg w-full max-w-md mx-auto shadow-lg text-white">
    <div className="modal-header flex justify-between items-center p-4 border-b border-gray-700">
      <h2 className="modal-title text-xl font-semibold">{task ? 'Edit Task' : 'Add New Task'}</h2>
      <button
        className="modal-close-btn bg-transparent text-gray-400 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <FaTimes />
      </button>
    </div>

    <form onSubmit={handleSubmit} className="task-form p-4">
      {/* Task Name */}
      <div className="form-group mb-4">
        <label className="form-label block text-sm font-medium text-gray-300 mb-1">Task Name</label>
        <input
          type="text"
          name="title"
          value={taskData.title}
          onChange={handleChange}
          placeholder="Enter task name"
          className="w-full p-2 bg-[#1e1e1e] border border-gray-600 rounded-md text-white text-sm focus:border-[#14b8a6] focus:outline-none"
          required
        />
      </div>

      {/* Deadline */}
      <div className="form-group mb-4">
        <label className="form-label block text-sm font-medium text-gray-300 mb-1">Deadline</label>
        <input
          type="date"
          name="deadline"
          value={taskData.deadline}
          onChange={handleChange}
          min={today}
          className="w-full p-2 bg-[#1e1e1e] border border-gray-600 rounded-md text-white text-sm focus:border-[#14b8a6] focus:outline-none"
          required
        />
      </div>

      {/* Priority and Category */}
      <div className="form-row mb-4 flex gap-4">
        <div className="form-group w-1/2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
          <select
            name="priority"
            value={taskData.priority}
            onChange={handleChange}
            className="w-full p-2 bg-[#1e1e1e] border border-gray-600 rounded-md text-white text-sm focus:border-[#14b8a6] focus:outline-none"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div className="form-group w-1/2">
          <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
          <select
            name="category"
            value={taskData.category}
            onChange={handleChange}
            className="w-full p-2 bg-[#1e1e1e] border border-gray-600 rounded-md text-white text-sm focus:border-[#14b8a6] focus:outline-none"
          >
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Completed Checkbox */}
      <div className="form-checkbox-group mb-4">
        <label className="flex items-center text-sm text-gray-300">
          <input
            type="checkbox"
            name="completed"
            checked={taskData.completed}
            onChange={handleChange}
            className="mr-2 accent-[#14b8a6]"
          />
          Mark as completed
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-3 bg-[#14b8a6] hover:bg-[#0ea5a3] text-white rounded-md text-sm font-medium transition-colors"
      >
        {task ? 'Update Task' : 'Add Task'}
      </button>
    </form>
  </div>
</dialog>

  );
};

const TaskItem = ({ task, onDelete, onToggleComplete, onEdit }) => {
  // Map numeric priority to display text and CSS class
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 1:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-500 text-white whitespace-nowrap">High</span>;
      case 2:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-500 text-white whitespace-nowrap">Medium</span>;
      case 3:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500 text-white whitespace-nowrap">Low</span>;
      default:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-500 text-white whitespace-nowrap">Medium</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();

    if (diffDays > 0) {
      return `Due in ${diffDays} days (${month} ${day})`;
    } else if (diffDays === 0) {
      return `Due today (${month} ${day})`;
    } else {
      return `Overdue by ${Math.abs(diffDays)} days (${month} ${day})`;
    }
  };

  const formatCompletionDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `Completed on ${formattedDate} at ${formattedTime}`;
  };

  return (
    <div className="bg-[#1e1e1e] border border-[#333333] rounded-lg p-4 mb-3 hover:bg-[#252525] transition-colors">
      <div className="flex flex-col sm:flex-row">
        <div className="mr-3 mb-2 sm:mb-0 pt-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleComplete(task._id)}
            className="w-5 h-5 rounded accent-[#00bfae] cursor-pointer"
          />
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h3 className={`text-lg font-medium truncate ${task.completed ? 'line-through opacity-70' : ''}`}>
              {task.title}
            </h3>
            <div className="flex-shrink-0">
              {getPriorityBadge(task.priority)}
            </div>
          </div>
          {task.description && (
            <p className="text-gray-400 text-sm mb-2">{task.description}</p>
          )}
          <div className="flex items-center text-gray-400 text-sm mb-2">
            <FaCalendarAlt className="mr-2 text-xs" />
            {task.completed && task.completedAt
              ? formatCompletionDate(task.completedAt)
              : formatDate(task.deadline)}
          </div>
          <div>
            <span className="inline-block text-xs bg-[#333333] text-gray-300 px-2 py-1 rounded-full">
              {task.category}
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-3 pt-2 border-t border-[#333333]">
        <div className="flex gap-3">
          <button
            onClick={() => onEdit(task)}
            className="flex items-center gap-1 text-gray-400 hover:text-[#00bfae] hover:bg-white hover:bg-opacity-5 px-2 py-1 rounded text-sm transition-colors"
          >
            <FaEdit /> Edit
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="flex items-center gap-1 text-gray-400 hover:text-red-500 hover:bg-white hover:bg-opacity-5 px-2 py-1 rounded text-sm transition-colors"
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const DailyPlanner = () => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  // Fetch tasks when component mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await taskService.getTasks();
      setTasks(fetchedTasks);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again later.');
      // For demo purposes, set some sample tasks if API fails
      setTasks([
        {
          _id: '1',
          title: 'Complete project proposal',
          description: 'Finish the draft and send for review',
          category: 'Work',
          priority: 1, // High
          deadline: '2023-05-23',
          completed: false,
          completedAt: null,
          createdAt: '2023-05-20T10:30:00'
        },
        {
          _id: '2',
          title: 'Grocery shopping',
          description: 'Buy fruits, vegetables, and milk',
          category: 'Personal',
          priority: 2, // Medium
          deadline: '2023-06-10',
          completed: true,
          completedAt: '2023-06-09T14:30:00',
          createdAt: '2023-05-21T08:15:00'
        },
        {
          _id: '3',
          title: 'Gym session',
          description: 'Cardio and strength training',
          category: 'Personal',
          priority: 3, // Low
          deadline: '2023-06-12',
          completed: false,
          completedAt: null,
          createdAt: '2023-05-21T16:45:00'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Group tasks by creation date and sort within each group
  const groupedByDateTasks = useMemo(() => {
    const groups = {};

    tasks.forEach(task => {
      // Extract date part from createdAt
      const creationDate = task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : 'No Date';

      if (!groups[creationDate]) {
        groups[creationDate] = [];
      }

      groups[creationDate].push(task);
    });

    // Sort tasks within each date group:
    // 1. Incomplete tasks first, then completed tasks
    // 2. Within each completion status, sort by priority (high to low)
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => {
        // First sort by completion status
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1; // Incomplete tasks first
        }

        // Then sort by priority (lower number = higher priority)
        return a.priority - b.priority;
      });
    });

    // Sort dates in descending order (newest first)
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .reduce((acc, date) => {
        acc[date] = groups[date];
        return acc;
      }, {});
  }, [tasks]);

  // Filter tasks by completion status and date
  const filteredTasks = useMemo(() => {
    // First filter by completion status
    const statusFiltered = tasks.filter(task => {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'completed') return task.completed;
      if (currentFilter === 'pending') return !task.completed;
      return true;
    });

    // Then filter by selected date if any
    let result = statusFiltered;
    if (selectedDate) {
      result = statusFiltered.filter(task => {
        const taskDate = task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : null;
        return taskDate === selectedDate;
      });
    }

    // Sort the filtered tasks:
    // 1. Incomplete tasks first, then completed tasks
    // 2. Within each completion status, sort by priority (high to low)
    return result.sort((a, b) => {
      // First sort by completion status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1; // Incomplete tasks first
      }

      // Then sort by priority (lower number = higher priority)
      return a.priority - b.priority;
    });
  }, [tasks, currentFilter, selectedDate]);

  // Get available dates from tasks for the date filter dropdown
  const availableDates = useMemo(() => {
    const dates = new Set();

    tasks.forEach(task => {
      if (task.createdAt) {
        const dateStr = new Date(task.createdAt).toISOString().split('T')[0];
        dates.add(dateStr);
      }
    });

    return Array.from(dates).sort((a, b) => new Date(b) - new Date(a));
  }, [tasks]);

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString || dateString === 'No Date') return 'No Date';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle task submission (both add and edit)
  const handleTaskSubmit = async (taskData, taskId = null) => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors

      // Convert priority from string to number
      const priorityMap = {
        'High': 1,
        'Medium': 2,
        'Low': 3
      };

      const numericPriority = priorityMap[taskData.priority] || 2;
      const formattedTaskData = {
        ...taskData,
        priority: numericPriority
      };

      if (taskId) {
        // Edit existing task
        await taskService.updateTask(taskId, formattedTaskData);
      } else {
        // Add new task
        await taskService.createTask(formattedTaskData);
      }

      // Refresh tasks from server
      await fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      setError(`Failed to save task: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    try {
      setLoading(true);
      await taskService.deleteTask(taskId);
      // Refresh tasks or remove from state
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle toggling task completion
  const handleToggleComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t._id === taskId);
      if (!task) return;

      const newCompletionStatus = !task.completed;
      await taskService.toggleTaskCompletion(taskId, newCompletionStatus);

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t => {
          if (t._id === taskId) {
            return {
              ...t,
              completed: newCompletionStatus,
              completedAt: newCompletionStatus ? new Date().toISOString() : null
            };
          }
          return t;
        })
      );
    } catch (error) {
      console.error('Error toggling task completion:', error);
      setError('Failed to update task. Please try again.');
    }
  };

  // Handle opening the edit task modal
  const handleEditTask = (task) => {
    setCurrentTask(task);
    setIsModalOpen(true);
  };

  const handleAddNewTask = () => {
    setCurrentTask(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTask(null);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-6 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Daily Planner</h1>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Status Filter */}
            <div className="flex-1 sm:flex-none">
              <select
                value={currentFilter}
                onChange={(e) => setCurrentFilter(e.target.value)}
                className="w-full bg-[#2d3748] text-white p-2 rounded border border-gray-700 focus:border-teal-500 focus:outline-none"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex-1 sm:flex-none">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#2d3748] text-white p-2 rounded border border-gray-700 focus:border-teal-500 focus:outline-none"
              >
                <option value="">All Dates</option>
                {availableDates.map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setCurrentTask(null);
                setIsModalOpen(true);
              }}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-md flex items-center transition-colors"
            >
              <FaPlus className="mr-2" /> Add Task
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 bg-opacity-20 border-l-4 border-red-500 text-red-400 p-4 mb-4 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : selectedDate ? (
          // Show filtered tasks when a date is selected
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 text-gray-300">
              {formatDateForDisplay(selectedDate)}
            </h2>

            {filteredTasks.length === 0 ? (
              <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6 text-center">
                <p className="text-gray-400">No tasks found for this date.</p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <TaskItem
                  key={task._id}
                  task={task}
                  onDelete={handleDeleteTask}
                  onToggleComplete={handleToggleComplete}
                  onEdit={handleEditTask}
                />
              ))
            )
            }
          </div>
        ) : (
          // Show tasks grouped by date when no date is selected
          Object.entries(groupedByDateTasks).length === 0 ? (
            <div className="bg-[#1e1e1e] border border-[#333] rounded-lg p-6 text-center">
              <p className="text-gray-400">No tasks found. Click "Add Task" to create one.</p>
            </div>
          ) : (
            Object.entries(groupedByDateTasks).map(([date, dateTasks]) => {
              // Filter tasks by completion status
              const filteredDateTasks = dateTasks.filter(task => {
                if (currentFilter === 'all') return true;
                if (currentFilter === 'completed') return task.completed;
                if (currentFilter === 'pending') return !task.completed;
                return true;
              });

              // Skip rendering this date group if no tasks match the filter
              if (filteredDateTasks.length === 0) return null;

              return (
                <div key={date} className="mb-8">
                  <h2 className="text-lg font-semibold mb-3 text-gray-300">
                    {formatDateForDisplay(date)}
                  </h2>

                  {/* Tasks are already sorted by completion status and priority */}
                  {filteredDateTasks.map(task => (
                    <TaskItem
                      key={task._id}
                      task={task}
                      onDelete={handleDeleteTask}
                      onToggleComplete={handleToggleComplete}
                      onEdit={handleEditTask}
                    />
                  ))}
                </div>
              );
            })
          )
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleTaskSubmit}
        task={currentTask}
      />
    </div>
  );
};

export default DailyPlanner;
