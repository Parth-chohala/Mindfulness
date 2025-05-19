/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#00bfae', // Teal color
        'primary-foreground': '#ffffff', // White text color for the primary background
        accent: '#333333', // Black or dark color for accents
        'accent-foreground': '#ffffff', // White text for accent
        foreground: '#f5f5f5', // Light background for non-active states (for better contrast)
        card: '#1c1c1c', // Dark background for cards
        border: '#444444', // Border color for elements
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

