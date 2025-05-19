import { toast } from 'react-toastify';

// Theme colors from tailwind.config.js
const themeColors = {
  primary: '#00bfae',       // Teal color
  error: '#ef4444',         // Red color
  info: '#3b82f6',          // Blue color
  warning: '#f59e0b',       // Amber color
  background: '#1e1e1e',    // Dark background
  text: '#ffffff'           // White text
};

// Custom toast styles to match theme
export const toastStyles = {
  success: {
    style: {
      background: themeColors.background,
      color: themeColors.text,
      borderLeft: `4px solid ${themeColors.primary}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    progressStyle: {
      background: themeColors.primary,
      height: '4px'
    },
    icon: '🎉'
  },
  error: {
    style: {
      background: themeColors.background,
      color: themeColors.text,
      borderLeft: `4px solid ${themeColors.error}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    progressStyle: {
      background: themeColors.error,
      height: '4px'
    },
    icon: '❌'
  },
  info: {
    style: {
      background: themeColors.background,
      color: themeColors.text,
      borderLeft: `4px solid ${themeColors.info}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    progressStyle: {
      background: themeColors.info,
      height: '4px'
    },
    icon: 'ℹ️'
  },
  warning: {
    style: {
      background: themeColors.background,
      color: themeColors.text,
      borderLeft: `4px solid ${themeColors.warning}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    progressStyle: {
      background: themeColors.warning,
      height: '4px'
    },
    icon: '⚠️'
  }
};

// Custom toast configuration with consistent styling
const toastConfig = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "dark"
};

// Custom toast functions with consistent configuration
export const showSuccessToast = (message) => {
  toast.success(message, {
    ...toastConfig,
    style: toastStyles.success.style,
    progressStyle: toastStyles.success.progressStyle,
    icon: toastStyles.success.icon
  });
};

export const showErrorToast = (message) => {
  toast.error(message, {
    ...toastConfig,
    style: toastStyles.error.style,
    progressStyle: toastStyles.error.progressStyle,
    icon: toastStyles.error.icon
  });
};

export const showInfoToast = (message) => {
  toast.info(message, {
    ...toastConfig,
    style: toastStyles.info.style,
    progressStyle: toastStyles.info.progressStyle,
    icon: toastStyles.info.icon
  });
};

export const showWarningToast = (message) => {
  toast.warning(message, {
    ...toastConfig,
    style: toastStyles.warning.style,
    progressStyle: toastStyles.warning.progressStyle,
    icon: toastStyles.warning.icon
  });
};

// Configure ToastContainer with default styling
export const toastContainerConfig = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  newestOnTop: true,
  closeOnClick: true,
  rtl: false,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: true,
  theme: "dark"
};

export default {
  toastStyles,
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
  toastContainerConfig
};
