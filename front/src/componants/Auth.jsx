import { showSuccessToast, showErrorToast } from '../utils/toastStyles';

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const response = await axios.post('http://localhost:5000/api/user/login', {
      email: loginData.email,
      password: loginData.password
    });
    
    if (response.data.user) {
      // Clear ALL timer data first (for all users)
      localStorage.removeItem('timerState');
      localStorage.removeItem('timerLogs');
      
      // Clear any user-specific data that might exist
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.startsWith('timerState_') || key.startsWith('timerLogs_') || key.startsWith('stickyNotes_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Set authentication data
      localStorage.setItem('userId', response.data.user._id);
      localStorage.setItem('isAuthenticated', 'true');
      
      // Set flag to indicate fresh login
      localStorage.setItem('justLoggedIn', 'true');
      
      //("Login successful, userId set to:", response.data.user._id);
      showSuccessToast('Login successful!');
      onClose();
      
      // Reload the page to ensure all components initialize with the new user
      window.location.reload();
    }
  } catch (error) {
    console.error('Login error:', error);
    showErrorToast(error.response?.data?.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

const handleRegister = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  setLoading(true);
  
  try {
    const response = await axios.post('http://localhost:5000/api/user/register', registerData);
    
    if (response.data.user) {
      showSuccessToast('Registration successful! Please log in.');
      setActiveTab('login');
      setRegisterData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    showErrorToast(error.response?.data?.message || 'Registration failed. Please try again.');
  } finally {
    setLoading(false);
  }
};


