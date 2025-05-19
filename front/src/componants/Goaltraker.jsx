import React, { useState, useEffect, useRef } from "react";
import { FaTrash, FaEdit, FaPlus } from "react-icons/fa";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import goalService from "../services/GoalService";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function GoalTracker() {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({ 
    title: "", 
    description: "", 
    category: "task", // This will be mapped to goalType when sending to API
    aim: "" // This will be mapped to targetValue when sending to API
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add a ref for the title input
  const titleInputRef = useRef(null);
  
  // Focus the title input when the modal opens
  useEffect(() => {
    if (showForm && titleInputRef.current) {
      // Use a small timeout to ensure the DOM is ready
      setTimeout(() => {
        titleInputRef.current.focus();
      }, 50);
    }
  }, [showForm]);

  // Fetch goals on component mount
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const fetchedGoals = await goalService.getAllGoals();
      // Ensure goals is always an array
      setGoals(Array.isArray(fetchedGoals) ? fetchedGoals : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError("Failed to load goals. Please try again.");
      setGoals([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.description.trim()) newErrors.description = "Description is required";
    if (!form.aim.trim() || isNaN(Number(form.aim))) newErrors.aim = "Enter a valid numeric aim";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addOrUpdateGoal = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Create a copy of the form data to modify
      const goalData = { ...form };
      
      // Convert hours to seconds for time and meditation categories
      if (goalData.category === "time" || goalData.category === "meditation") {
        // Convert hours to seconds (1 hour = 3600 seconds)
        const hoursValue = parseFloat(goalData.aim);
        const secondsValue = Math.round(hoursValue * 3600);
        
        // Map form fields to API fields
        goalData.targetValue = secondsValue;
        goalData.goalType = goalData.category;
      } else {
        // For task type, just use the aim value directly
        goalData.targetValue = parseInt(goalData.aim, 10);
        goalData.goalType = goalData.category;
      }
      
      if (editingId) {
        // Update existing goal
        await goalService.updateGoal(editingId, goalData);
        setEditingId(null);
      } else {
        // Create new goal
        await goalService.createGoal(goalData);
      }
      
      // Reset form and fetch updated goals
      setForm({ title: "", description: "", category: "task", aim: "" });
      setShowForm(false);
      setErrors({});
      await fetchGoals();
    } catch (err) {
      console.error("Error saving goal:", err);
      setError("Failed to save goal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteGoal = async (id) => {
    try {
      setLoading(true);
      await goalService.deleteGoal(id);
      await fetchGoals();
    } catch (err) {
      console.error("Error deleting goal:", err);
      setError("Failed to delete goal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const editGoal = (goal) => {
    // Convert seconds back to hours for time and meditation goals
    let aimValue = goal.targetValue?.toString() || "";
    
    if (goal.goalType === "time" || goal.goalType === "meditation") {
      // Convert seconds to hours
      aimValue = (goal.targetValue / 3600).toFixed(1);
    }
    
    setForm({
      title: goal.title,
      description: goal.description || "",
      category: goal.goalType || "task", // Map from goalType to category
      aim: aimValue,
    });
    setEditingId(goal._id);
    setShowForm(true);
  };

  // Helper function to format target value based on goal type
  const formatTargetValue = (goal) => {
    if (goal.goalType === "time" || goal.goalType === "meditation") {
      // Convert seconds to hours
      const hours = (goal.targetValue / 3600).toFixed(1);
      return `${hours} hours`;
    }
    return goal.targetValue;
  };

  // Helper function to format progress value based on goal type
  const formatProgressValue = (goal) => {
    if (goal.goalType === "time" || goal.goalType === "meditation") {
      // Convert seconds to hours
      const hours = (goal.progressValue / 3600).toFixed(1);
      return `${hours} hours`;
    }
    return goal.progressValue;
  };

  const completedGoals = (goals || []).filter((g) => g.status === 'completed').length;
  const pendingGoals = (goals || []).filter((g) => g.status !== 'completed').length;
  const totalGoals = (goals || []).length;

  const barData = {
    labels: ["Total", "Achieved", "Pending"],
    datasets: [
      {
        label: "Goals",
        data: [totalGoals, completedGoals, pendingGoals],
        backgroundColor: ["#e5e7eb", "#14b8a6", "#0f766e"],
        borderRadius: 5,
      },
    ],
  };

  const pieData = {
    labels: ["Achieved", "Pending"],
    datasets: [
      {
        data: [completedGoals, pendingGoals],
        backgroundColor: ["#14b8a6", "#0f766e"],
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { 
        beginAtZero: true, 
        ticks: { stepSize: 1 } 
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11
          }
        }
      }
    }
  };

  const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-xl font-bold hover:text-gray-300"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );

  return (
    <div className="bg-[#121212] min-h-screen text-white p-4 sm:p-6 max-w-4xl mx-auto overflow-x-hidden">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded mb-4">
          {error}
          <button 
            className="ml-2 text-red-300 hover:text-red-100"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl sm:text-4xl font-semibold text-white">Goal Tracker</h1>
        <button
  onClick={() => {
    setShowForm(true);
    setEditingId(null);
    setForm({ title: "", description: "", category: "task", aim: "" });
    setErrors({});
  }}
  className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-md flex items-center gap-2 text-sm sm:text-base font-medium transition-all"
  disabled={loading}
>
  {loading ? (
    "Loading..."
  ) : (
    <>
      <FaPlus className="text-xs sm:text-sm" /> <span className="text-xs sm:text-sm">Add Goal</span>
    </>
  )}
</button>

      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Update Goal" : "Add Goal"}
          </h2>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                name="title"
                placeholder="Title"
                defaultValue={form.title}
                onBlur={(e) => {
                  setForm(prev => ({ ...prev, title: e.target.value }));
                  // Clear error if exists
                  if (errors.title) {
                    setErrors(prev => ({ ...prev, title: null }));
                  }
                }}
                className="w-full p-2 bg-[#1e1e1e] text-white rounded border border-gray-700 focus:border-teal-500 focus:outline-none"
                ref={titleInputRef}
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>
            <div>
              <textarea
                name="description"
                placeholder="Description"
                defaultValue={form.description}
                onBlur={(e) => {
                  setForm(prev => ({ ...prev, description: e.target.value }));
                  // Clear error if exists
                  if (errors.description) {
                    setErrors(prev => ({ ...prev, description: null }));
                  }
                }}
                className="w-full p-2 bg-[#1e1e1e] text-white rounded border border-gray-700 focus:border-teal-500 focus:outline-none"
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {["task", "time", "meditation"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setForm(prevForm => ({ ...prevForm, category: cat }));
                  }}
                  className={`px-3 py-1 rounded border ${form.category === cat ? "bg-teal-600" : "bg-[#1e1e1e]"}`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
            <div>
              <input
                type="number"
                name="aim"
                placeholder={
                  form.category === "task"
                    ? "Number of tasks"
                    : form.category === "time"
                    ? "Hours of work"
                    : "Hours of meditation"
                }
                defaultValue={form.aim}
                onBlur={(e) => {
                  setForm(prev => ({ ...prev, aim: e.target.value }));
                  // Clear error if exists
                  if (errors.aim) {
                    setErrors(prev => ({ ...prev, aim: null }));
                  }
                }}
                className="w-full p-2 bg-[#1e1e1e] text-white rounded border border-gray-700"
                step="0.1" // Allow decimal values for hours
              />
              {errors.aim && <p className="text-red-400 text-sm mt-1">{errors.aim}</p>}
            </div>
            <button
              onClick={addOrUpdateGoal}
              className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded w-full"
              disabled={loading}
            >
              {loading ? "Saving..." : (editingId ? "Update Goal" : "Add Goal")}
            </button>
          </div>
        </Modal>
      )}

      <div className="flex flex-col lg:flex-row gap-6 mb-10 items-center">
        <div className="w-full lg:w-2/3">
          <Bar data={barData} options={barOptions} height={200} />
        </div>
        <div className="w-full mx-auto" style={{ maxWidth: "300px", aspectRatio: "1 / 1" }}>
  <Pie data={pieData} options={pieOptions} />
</div>


      </div>

      {loading && !showForm ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="bg-[#1e1e1e] p-6 rounded-lg text-center">
              <p className="text-gray-400">No goals found. Create your first goal!</p>
            </div>
          ) : (
            goals.map((goal) => (
              <div key={goal._id} className="bg-[#1e1e1e] p-4 sm:p-6 rounded-lg space-y-3 relative">
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                  <span className="bg-teal-700 text-xs px-2 py-1 rounded-full capitalize">
                    {goal.goalType || "task"}
                  </span>
                </div>

                <div className="flex justify-between items-center pr-16 sm:pr-20">
                  <h3 className={`text-lg sm:text-xl font-bold ${goal.status === 'completed' ? "line-through text-gray-500" : ""}`}>
                    {goal.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-gray-400">{goal.description}</p>
                <p className="text-xs text-gray-500">
                  {goal.status === 'completed' ? "Completed on" : "Created on"} {new Date(goal.createdAt).toLocaleDateString()}
                </p>

                <span className="bg-gray-700 text-xs px-2 py-1 rounded-full inline-block mb-3">
                  Target: {formatTargetValue(goal)}
                </span>

                <div className="h-2 rounded bg-gray-700">
                  <div
                    className={`h-full ${goal.status === 'completed' ? "bg-green-500" : "bg-teal-500"} rounded`}
                    style={{ width: `${(goal.progressValue / goal.targetValue) * 100}%` }}
                  />
                </div>
                <div className="text-xs sm:text-sm text-right text-gray-400">
                  {formatProgressValue(goal)} / {formatTargetValue(goal)} ({Math.round((goal.progressValue / goal.targetValue) * 100) || 0}%)
                </div>

                <hr className="border-gray-700 my-3" />

                <div className="flex justify-end gap-3 sm:gap-4 text-xs sm:text-sm">
                  <button 
                    className="flex items-center gap-1 text-gray-300 hover:text-white py-1 px-2 rounded hover:bg-gray-800" 
                    onClick={() => editGoal(goal)}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button 
                    className="flex items-center gap-1 text-red-400 hover:text-red-600 py-1 px-2 rounded hover:bg-gray-800" 
                    onClick={() => deleteGoal(goal._id)}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
