import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, Sun, Moon, UserPen } from 'lucide-react';
import { useCurrentUser, getUserInitials, getUserDisplayName } from '../../auth/useCurrentUser';
import { useAuth } from '../../auth/AuthContext';
import { useNavigation } from '../../hooks/useNavigation';
import { useUserProfile } from '../../hooks/useApi';
import { AccountSettingsModal } from '../modals/AccountSettingsModal';

const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout, saving, user: authUser } = useAuth();
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const { selectedWorkspaceId } = useNavigation();

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 flex items-center justify-center bg-green-400 hover:bg-green-500 text-green-800 hover:text-green-900 rounded-full transition-colors duration-200 relative"
        title={`${userProfile?.display_name || (userProfile?.first_name && userProfile?.last_name ? `${userProfile.first_name} ${userProfile.last_name}` : 'User')} - User Menu`}
      >
        {userProfile?.avatar ? (
          <img
            src={userProfile.avatar}
            alt={userProfile?.display_name || (userProfile?.first_name && userProfile?.last_name ? `${userProfile.first_name} ${userProfile.last_name}` : 'User')}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium">
            {userProfile?.first_name && userProfile?.last_name
              ? `${userProfile.first_name.charAt(0)}${userProfile.last_name.charAt(0)}`.toUpperCase()
              : userProfile?.display_name
                ? userProfile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                : userProfile?.email
                  ? userProfile.email.charAt(0).toUpperCase()
                  : 'U'}
          </span>
        )}
        {/* Status indicator for verified users */}
        {userProfile?.email_verified && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-sidebar border border-gray-200 rounded-lg shadow-lg z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-[var(--color-border-disabled_subtle)]">
            <div className="flex items-center gap-3">
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {isLoadingProfile ? (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                  </div>
                ) : userProfile?.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt={userProfile?.display_name || (userProfile?.first_name && userProfile?.last_name ? `${userProfile.first_name} ${userProfile.last_name}` : 'User')}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {userProfile?.first_name && userProfile?.last_name
                      ? `${userProfile.first_name.charAt(0)}${userProfile.last_name.charAt(0)}`.toUpperCase()
                      : userProfile?.display_name
                        ? userProfile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                        : userProfile?.email
                          ? userProfile.email.charAt(0).toUpperCase()
                          : 'U'}
                  </div>
                )}
              </div>

              {/* User Details */}
              <div className="flex-1 min-w-0">
                {isLoadingProfile ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {userProfile?.display_name ||
                          (userProfile?.first_name && userProfile?.last_name
                            ? `${userProfile.first_name} ${userProfile.last_name}`
                            : userProfile?.email || 'User')}
                      </p>
                      {userProfile?.email_verified && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Verified user"></div>
                      )}
                    </div>
                    <p className="text-xs text-tertiary truncate">
                      {userProfile?.email || 'user@example.com'}
                    </p>
                    {userProfile?.status === 'inactive' && (
                      <p className="text-xs text-red-500">Account inactive</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>


          {/* Account Settings */}
          <button
            onClick={() => {
              setIsAccountModalOpen(true);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-gray-100)] transition-colors duration-200"
          >
            <UserPen className="w-5 h-5 text-tertiary" />
            <span className="text-tertiary">Profile</span>
          </button>

          <div className="border-t border-[var(--color-border-disabled_subtle)]"></div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            disabled={isAnimating}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-gray-100)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isAnimating ? 'theme-toggle-animation' : ''
              }`}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDark}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-tertiary transition-transform duration-200" />
            ) : (
              <Moon className="w-5 h-5 text-tertiary transition-transform duration-200" />
            )}
            <span className="text-tertiary">
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          <div className="border-t border-[var(--color-border-disabled_subtle)]"></div>

          {/* Language */}
          {/* <button className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">Language</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">AI Generated Translations</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </button> */}

          {/* Experimental Features */}
          {/* <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
            <Lightbulb className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-gray-900 dark:text-gray-100">Experimental Features</span>
          </button> */}

          {/* Log Out - First item */}
          <button
            onClick={handleLogout}
            disabled={saving}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-gray-100)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-5 h-5 text-tertiary" />
            <span className="text-tertiary">Log Out</span>
          </button>
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
