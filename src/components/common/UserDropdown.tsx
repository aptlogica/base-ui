import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon, UserPen } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useUserProfile } from '../../hooks/useApi';
import { AccountSettingsModal } from '../modals/AccountSettingsModal';

const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout, saving, user: authUser } = useAuth();
  const navigate = useNavigate();

  // Get user profile data from API (single source of truth)
  const { data: profileResponse, isLoading: isLoadingProfile } = useUserProfile(authUser?.id || '');
  const userProfile = profileResponse?.data;

  // Theme initialization - more robust
  useEffect(() => {
    const initializeTheme = () => {
      // Check for saved theme preference first
      const savedTheme = localStorage.getItem('theme');

      if (savedTheme === 'dark' || savedTheme === 'light') {
        // Use saved preference
        const isDarkMode = savedTheme === 'dark';
        setIsDark(isDarkMode);
        applyTheme(isDarkMode);
      } else {
        // No saved preference - check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);
        applyTheme(prefersDark);
        // Save the initial preference
        localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
      }
    };

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };

    initializeTheme();

    // Listen for system theme changes when no explicit preference is set
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      const savedTheme = localStorage.getItem('theme');
      // Only respond to system changes if no explicit preference is saved
      if (!savedTheme) {
        const prefersDark = mediaQuery.matches;
        setIsDark(prefersDark);
        applyTheme(prefersDark);
        localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // AuthContext.logout() now handles everything including API call and cleanup
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('[LOGOUT] Logout failed:', error);
      // Navigate to login even if logout process fails
      navigate('/login');
    }
  };

  const toggleTheme = () => {
    setIsAnimating(true);
    const newTheme = !isDark;
    setIsDark(newTheme);

    // Apply theme changes
    if (newTheme) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }

    // Reset animation state after animation completes
    setTimeout(() => setIsAnimating(false), 200);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const displayName = userProfile?.display_name ||
    (userProfile?.first_name && userProfile?.last_name
      ? `${userProfile.first_name} ${userProfile.last_name}`
      : userProfile?.email || 'User');
  
  const userEmail = userProfile?.email || 'user@example.com';

  // Get user initials for avatar
  const getUserInitials = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name.charAt(0)}${userProfile.last_name.charAt(0)}`.toUpperCase();
    }
    if (userProfile?.display_name) {
      const parts = userProfile.display_name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      }
      return userProfile.display_name.substring(0, 2).toUpperCase();
    }
    if (userProfile?.email) {
      return userProfile.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="relative flex items-center gap-2" ref={dropdownRef}>
      {/* Vertical Separator */}
      <div className="h-6 w-px bg-gray-300 mx-3"></div>
      
      {/* User Info in Header */}
      <div className="flex flex-col items-end">
        {isLoadingProfile ? (
          <div className="space-y-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 leading-tight">
              {userEmail}
            </p>
          </>
        )}
      </div>

      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 flex items-center justify-center bg-green-500 hover:bg-green-600 text-primary rounded-full transition-colors duration-200 relative flex-shrink-0"
        title={`${displayName} - User Menu`}
      >
        {userProfile?.avatar ? (
          <img
            src={userProfile.avatar}
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-bold">
            {getUserInitials()}
          </span>
        )}
        {/* Status indicator - always show green dot */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border space-y-1 py rounded-xl shadow-lg z-50">
          {/* Profile */}
          <div className="p-2">
          <button
            onClick={() => {
              setIsAccountModalOpen(true);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 transition-colors duration-200 rounded-xl"
          >
            <UserPen className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-primary">Profile</span>
          </button>

          {/* Dark Mode */}
          <button
            onClick={toggleTheme}
            disabled={isAnimating}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 transition-colors rounded-xl duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isAnimating ? 'theme-toggle-animation' : ''}`}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDark}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-gray-400 transition-transform duration-200" />
            ) : (
              <Moon className="w-5 h-5 text-gray-400 transition-transform duration-200" />
            )}
            <span className="text-sm text-primary">
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* Separator */}
          <div className="border-t my-1.5"></div>

          {/* Sign Out */}
          <button
            onClick={handleLogout}
            disabled={saving}
            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 transition-colors rounded-xl duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-b-xl"
          >
            <LogOut className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-primary">Sign out</span>
          </button>
        </div>
        </div>
      )}

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </div>
  );
};

export default UserDropdown;
