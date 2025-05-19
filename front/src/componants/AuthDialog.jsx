import React, { useState } from "react";
import axios from "axios";
import { X, Brain, Mail, Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { showSuccessToast, showErrorToast } from '../utils/toastStyles';

// Simple validators
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function AuthDialog({ open, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Form data with mindfulness-appropriate field names
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });

  // Close dialog
  const handleClose = () => {
    if (onClose) onClose();
  };

  // Reset all input fields
  const resetFormData = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
    });
    setErrors({});
  };

  // Toggle between Login and Register
  const handleToggle = () => {
    setIsLogin(!isLogin);
    resetFormData();
  };

  // Update form data and reset any existing errors
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrors((prev) => ({
      ...prev,
      [e.target.name]: "",
    }));
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    let newErrors = {};

    if (isLogin) {
      // Validate login fields
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!isValidEmail(formData.email)) {
        newErrors.email = "Invalid email format";
      }

      // Check password
      if (!formData.password) {
        newErrors.password = "Password is required";
      }

      // If we found errors, show them and STOP
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // If valid, proceed with login request
      setLoading(true);
      try {
        const payload = {
          email: formData.email,
          pass: formData.password,
        };

        // API call for login
        const response = await axios.post("http://localhost:5000/api/user/login", payload);
        
        if (response.status === 200) {
          showSuccessToast("Welcome back to Mindfulness!");
          localStorage.setItem("userId", response.data.userId);
          localStorage.setItem("isAuthenticated", "true");
          
          setTimeout(() => {
            window.location.reload();
            handleClose();
          }, 2000);
        }
      } catch (err) {
        console.error("Login Error:", err);
        if (err.response && err.response.status === 401) {
          showErrorToast("Invalid credentials. Please try again.");
        } else if (err.response && err.response.status === 404) {
          showErrorToast("User not found. Please check your email.");
        } else {
          showErrorToast("Login failed. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // --- REGISTRATION FLOW ---
      // Basic validations
      if (!formData.name) {
        newErrors.name = "Name is required";
      }
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!isValidEmail(formData.email)) {
        newErrors.email = "Invalid email format";
      }
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      // If any errors, show them
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // If valid, proceed with register request
      setLoading(true);
      try {
        const payload = {
          name: formData.name,
          email: formData.email,
          pass: formData.password,
        };

        const response = await axios.post("http://localhost:5000/api/user", payload);
        
        if (response.status === 201) {
          showSuccessToast("Welcome to Mindfulness! Your journey begins now.");
          localStorage.setItem("userId", response.data.insertedId);
          localStorage.setItem("isAuthenticated", "true");
          
          setTimeout(() => {
            window.location.reload();
            handleClose();
          }, 2000);
        }
      } catch (err) {
        console.error("Registration Error:", err);
        if (err.response && err.response.status === 409) {
          showErrorToast("Email already registered. Please use a different email or login.");
        } else {
          showErrorToast("Registration failed. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-lg shadow-xl max-w-md w-full mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Brain size={24} className="text-teal-500" />
            {isLogin ? "Welcome Back" : "Join Mindfulness"}
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field - only for registration */}
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.name ? 'border border-red-500' : 'border border-gray-700'
                    }`}
                    placeholder="Your name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
            )}
            
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.email ? 'border border-red-500' : 'border border-gray-700'
                  }`}
                  placeholder="your.email@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`bg-[#2a2a2a] text-white pl-10 pr-10 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.password ? 'border border-red-500' : 'border border-gray-700'
                  }`}
                  placeholder="Your password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-white focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>
            
            {/* Confirm Password - only for registration */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.confirmPassword ? 'border border-red-500' : 'border border-gray-700'
                    }`}
                    placeholder="Confirm your password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            )}
            
            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-primary text-white py-2 rounded-md hover:bg-teal-600 transition-colors ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                isLogin ? "Login" : "Create Account"
              )}
            </button>
          </form>
          
          {/* Toggle between login and register */}
          <div className="mt-4 text-center">
            <button
              onClick={handleToggle}
              className="text-teal-500 hover:text-teal-400 text-sm"
            >
              {isLogin
                ? "New to Mindfulness? Create an account"
                : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
