import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, ListChecks, Target, Brain, User, Menu, LogOut, X, Sun, Moon, HelpCircle ,Headphones} from 'lucide-react';
import AuthDialog from './AuthDialog';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // Close mobile menu when route changes
    setMobileMenuOpen(false);
  }, [location]);

  // Function to handle auth dialog
  const handleAuthClick = () => {
    setShowAuthDialog(true);
  };

  // Function to close auth dialog
  const handleCloseAuthDialog = () => {
    setShowAuthDialog(false);
  };

  // Function to handle logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      // Clear the entire localStorage
      localStorage.clear();

      // Redirect to home page
      navigate('/');
      window.location.reload();
    }
  };

  const handleProfileClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      handleAuthClick();
    }
  };

  const handleNavLinkClick = (e, requiresAuth) => {
    if (requiresAuth && !isAuthenticated) {
      e.preventDefault();
      handleAuthClick();
    }
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#121212] shadow-lg backdrop-blur-sm border-b border-gray-800 py-1'
          : 'bg-[#121212] bg-opacity-80 backdrop-blur-sm py-3'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between ${isScrolled ? 'h-14' : 'h-16'} transition-all duration-300`}>
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                to="/"
                className="flex items-center gap-2 transition-all duration-300 hover:opacity-80 group"
              >
                <Brain
                  size={isScrolled ? 24 : 28}
                  className="text-teal-500 transition-all duration-300 group-hover:text-teal-400"
                />
                <span className="text-white font-semibold text-xl">Mindfulness</span>
              </Link>
            </div>

            {/* Desktop Navigation (lg screens and up) */}
            <div className="hidden lg:flex items-center space-x-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white px-3 py-2 rounded-md hover:bg-teal-600 flex items-center gap-2"
                    : "text-gray-300 px-3 py-2 rounded-md hover:bg-teal-600 hover:text-white flex items-center gap-2"
                }
              >
                <Home size={16} />
                <span>Home</span>
              </NavLink>

              <NavLink
                to="/planner"
                onClick={(e) => handleNavLinkClick(e, true)}
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white px-3 py-2 rounded-md hover:bg-teal-600 flex items-center gap-2"
                    : "text-gray-300 px-3 py-2 rounded-md hover:bg-teal-600 hover:text-white flex items-center gap-2"
                }
              >
                <ListChecks size={16} />
                <span>Planner</span>
              </NavLink>

              <NavLink
                to="/meditation"
                onClick={(e) => handleNavLinkClick(e, true)}
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white px-3 py-2 rounded-md hover:bg-teal-600 flex items-center gap-2"
                    : "text-gray-300 px-3 py-2 rounded-md hover:bg-teal-600 hover:text-white flex items-center gap-2"
                }
              >
                <Brain size={16} />
                <span>Meditation</span>
              </NavLink>

              <NavLink
                to="/goaltracker"
                onClick={(e) => handleNavLinkClick(e, true)}
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white px-3 py-2 rounded-md hover:bg-teal-600 flex items-center gap-2"
                    : "text-gray-300 px-3 py-2 rounded-md hover:bg-teal-600 hover:text-white flex items-center gap-2"
                }
              >
                <Target size={16} />
                <span>Goals</span>
              </NavLink>

              <NavLink
                to="/profile"
                onClick={handleProfileClick}
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white px-3 py-2 rounded-md hover:bg-teal-600 flex items-center gap-2"
                    : "text-gray-300 px-3 py-2 rounded-md hover:bg-teal-600 hover:text-white flex items-center gap-2"
                }
              >
                <User size={16} />
                <span>Profile</span>
              </NavLink>

              <NavLink
                to="/support"
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white px-3 py-2 rounded-md hover:bg-teal-600 flex items-center gap-2"
                    : "text-gray-300 px-3 py-2 rounded-md hover:bg-teal-600 hover:text-white flex items-center gap-2"
                }
              >
                <Headphones size={16} />
                <span>Support</span>
              </NavLink>

              {/* Removed logout button */}

              {!isAuthenticated && (
                <button
                  onClick={handleAuthClick}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-teal-600 transition-colors"
                >
                  Login
                </button>
              )}
            </div>

            {/* Tablet Navigation (md screens) */}
            <div className="hidden md:flex lg:hidden items-center space-x-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white p-2 rounded-md hover:bg-teal-600 flex items-center justify-center"
                    : "text-gray-300 p-2 rounded-md hover:bg-teal-600 hover:text-white flex items-center justify-center"
                }
                title="Home"
              >
                <Home size={20} />
              </NavLink>

              <NavLink
                to="/planner"
                onClick={(e) => handleNavLinkClick(e, true)}
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white p-2 rounded-md hover:bg-teal-600 flex items-center justify-center"
                    : "text-gray-300 p-2 rounded-md hover:bg-teal-600 hover:text-white flex items-center justify-center"
                }
                title="Planner"
              >
                <ListChecks size={20} />
              </NavLink>

              <NavLink
                to="/meditation"
                onClick={(e) => handleNavLinkClick(e, true)}
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white p-2 rounded-md hover:bg-teal-600 flex items-center justify-center"
                    : "text-gray-300 p-2 rounded-md hover:bg-teal-600 hover:text-white flex items-center justify-center"
                }
                title="Meditation"
              >
                <Brain size={20} />
              </NavLink>

              <NavLink
                to="/goaltracker"
                onClick={(e) => handleNavLinkClick(e, true)}
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white p-2 rounded-md hover:bg-teal-600 flex items-center justify-center"
                    : "text-gray-300 p-2 rounded-md hover:bg-teal-600 hover:text-white flex items-center justify-center"
                }
                title="Goals"
              >
                <Target size={20} />
              </NavLink>

              <NavLink
                to="/profile"
                onClick={handleProfileClick}
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white p-2 rounded-md hover:bg-teal-600 flex items-center justify-center"
                    : "text-gray-300 p-2 rounded-md hover:bg-teal-600 hover:text-white flex items-center justify-center"
                }
                title="Profile"
              >
                <User size={20} />
              </NavLink>

              <NavLink
                to="/support"
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white p-2 rounded-md hover:bg-teal-600 flex items-center justify-center"
                    : "text-gray-300 p-2 rounded-md hover:bg-teal-600 hover:text-white flex items-center justify-center"
                }
                title="Support"
              >
                <Headphones size={20} />
              </NavLink>

              {!isAuthenticated && (
                <button
                  onClick={handleAuthClick}
                  className="bg-primary text-white p-2 rounded-md hover:bg-teal-600 transition-colors"
                  title="Login"
                >
                  <User size={20} />
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-300 hover:text-white p-2"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed top-[60px] left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 py-2 max-h-[calc(100vh-60px)] overflow-y-auto z-50">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white block px-3 py-2 rounded-md text-base font-medium"
                    : "text-gray-300 hover:bg-teal-600 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                }
              >
                <div className="flex items-center gap-3">
                  <Home size={18} />
                  <span>Home</span>
                </div>
              </NavLink>

              <NavLink
                to="/planner"
                onClick={(e) => handleNavLinkClick(e, true)}
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white block px-3 py-2 rounded-md text-base font-medium"
                    : "text-gray-300 hover:bg-teal-600 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                }
              >
                <div className="flex items-center gap-3">
                  <ListChecks size={18} />
                  <span>Planner</span>
                </div>
              </NavLink>

              <NavLink
                to="/meditation"
                onClick={(e) => handleNavLinkClick(e, true)}
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white block px-3 py-2 rounded-md text-base font-medium"
                    : "text-gray-300 hover:bg-teal-600 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                }
              >
                <div className="flex items-center gap-3">
                  <Brain size={18} />
                  <span>Meditation</span>
                </div>
              </NavLink>

              <NavLink
                to="/goaltracker"
                onClick={(e) => handleNavLinkClick(e, true)}
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white block px-3 py-2 rounded-md text-base font-medium"
                    : "text-gray-300 hover:bg-teal-600 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                }
              >
                <div className="flex items-center gap-3">
                  <Target size={18} />
                  <span>Goals</span>
                </div>
              </NavLink>

              <NavLink
                to="/profile"
                onClick={handleProfileClick}
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white block px-3 py-2 rounded-md text-base font-medium"
                    : "text-gray-300 hover:bg-teal-600 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                }
              >
                <div className="flex items-center gap-3">
                  <User size={18} />
                  <span>Profile</span>
                </div>
              </NavLink>

              <NavLink
                to="/support"
                className={({ isActive }) =>
                  isActive
                    ? "bg-teal-600 text-white block px-3 py-2 rounded-md text-base font-medium"
                    : "text-gray-300 hover:bg-teal-600 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                }
              >
                <div className="flex items-center gap-3">
                  <Headphones size={18} />
                  <span>Support</span>
                </div>
              </NavLink>

              {/* Removed logout button */}

              {!isAuthenticated && (
                <button
                  onClick={handleAuthClick}
                  className="bg-primary text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Add padding to the page content to prevent it from being hidden under the navbar */}
      <div className={`${mobileMenuOpen ? 'pt-[60px]' : ''}`}></div>

      {/* Auth Dialog */}
      {showAuthDialog && (
        <AuthDialog
          open={showAuthDialog}
          onClose={handleCloseAuthDialog}
        />
      )}
    </>
  );
};

export default Navbar;
