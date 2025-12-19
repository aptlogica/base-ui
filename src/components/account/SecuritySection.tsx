import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useUserProfile, useChangePassword } from '../../hooks/useApi';
import { useToast } from '../common/Toast';
import { Loader2, Shield, CheckCircle, AlertTriangle, Eye, EyeOff, Info, HelpCircle } from 'lucide-react';
import { getUserActivity, type LoginSession } from '../../service/activityService';
import { validatePasswordStrength } from '../../utils/validation';

export const SecuritySection: React.FC = () => {
  const { user: authUser } = useAuth();
  const userId = authUser?.id;
  const toast = useToast();

  const {
    data: profileResponse,
    isLoading,
    error
  } = useUserProfile(userId || '');

  const [loginSessions, setLoginSessions] = React.useState<LoginSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = React.useState(true);

  // Password change states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Password validation states
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // API hooks
  const changePasswordMutation = useChangePassword(userId || '');

  const userProfile = profileResponse?.data;
  const isVerified = userProfile?.email_verified || false;
  const isActive = userProfile?.status === 'active';

  // Get user data for password validation
  const userFirstName = userProfile?.first_name || authUser?.first_name || '';
  const userLastName = userProfile?.last_name || authUser?.last_name || '';
  const userEmail = userProfile?.email || authUser?.email || '';

  // Password handling functions
  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear errors when user starts typing
    if (field === 'currentPassword' && currentPasswordError) setCurrentPasswordError(null);
    if (field === 'newPassword' && newPasswordError) setNewPasswordError(null);
    if (field === 'confirmPassword' && confirmPasswordError) setConfirmPasswordError(null);

    // Real-time validation for new password
    if (field === 'newPassword') {
      const validation = validatePasswordStrength(value, userFirstName, userLastName, userEmail);
      if (value && !validation.isValid) {
        setNewPasswordError(validation.errorMessage || "Password doesn't meet requirements");
      } else {
        setNewPasswordError(null);
      }
    }

    // Real-time validation for confirm password
    if (field === 'confirmPassword') {
      if (value && value !== passwordData.newPassword) {
        setConfirmPasswordError("Passwords do not match");
      } else {
        setConfirmPasswordError(null);
      }
    }
  };

  const handleUpdatePassword = async () => {
    // Reset errors
    setCurrentPasswordError(null);
    setNewPasswordError(null);
    setConfirmPasswordError(null);

    // Validate current password
    if (!passwordData.currentPassword.trim()) {
      setCurrentPasswordError('Current password is required');
      return;
    }

    // Validate new password
    if (!passwordData.newPassword.trim()) {
      setNewPasswordError('New password is required');
      return;
    }

    const passwordValidation = validatePasswordStrength(
      passwordData.newPassword,
      userFirstName,
      userLastName,
      userEmail
    );
    if (!passwordValidation.isValid) {
      setNewPasswordError(passwordValidation.errorMessage || "Password doesn't meet requirements");
      return;
    }

    // Validate confirm password
    if (!passwordData.confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your new password');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changePasswordMutation.mutateAsync({
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });

      toast.success('Password updated successfully', { title: 'Success' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      // Clear all errors
      setCurrentPasswordError(null);
      setNewPasswordError(null);
      setConfirmPasswordError(null);
    } catch (error: any) {
      console.error('Failed to update password:', error);
      toast.error(error?.message || 'Failed to update password. Please try again.', { title: 'Password Update Failed' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Load login sessions from activity_data
  useEffect(() => {
    const loadSessions = async () => {
      if (!userId) return;
      try {
        setSessionsLoading(true);
        const activityData = await getUserActivity(userId);
        if (activityData?.login_sessions) {
          // Sort by login_at descending (newest first)
          const sorted = [...activityData.login_sessions].sort(
            (a, b) => new Date(b.login_at).getTime() - new Date(a.login_at).getTime()
          );
          setLoginSessions(sorted);
        }
      } catch (error) {
        console.error('Failed to load login sessions:', error);
      } finally {
        setSessionsLoading(false);
      }
    };
    if (userId) loadSessions();
  }, [userId]);

  // Get current session (most recent)
  const currentSession = useMemo(() => {
    return loginSessions[0] || null;
  }, [loginSessions]);

  const pastSessions = useMemo(() => {
    return loginSessions.slice(1, 5); // Show last 4 past sessions
  }, [loginSessions]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSetup2FA = () => {
    alert('2FA setup functionality will be implemented soon');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading security settings...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 mb-2">Failed to load security settings</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Change Password Section */}
      <div className="bg-card rounded-xl border p-8">
        <h3 className="text-xl font-semibold text-primary mb-6">Change Password</h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className={`flex items-center justify-between field-component field-component-focus field-component-border ${currentPasswordError ? "border-destructive bg-red-50" : ""}`}>
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                onBlur={() => {
                  if (!passwordData.currentPassword.trim()) {
                    setCurrentPasswordError('Current password is required');
                  } else {
                    setCurrentPasswordError(null);
                  }
                }}
                className="w-full border-none outline-none"
                placeholder="Enter your current password"
                autoComplete="off"
                data-form-type="other"
              />
              <div className="z-50 flex items-center gap-2">
                {currentPasswordError && (
                  <Info className="w-4 h-4 text-red-400" />
                )}
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {currentPasswordError && <div className="mt-1.5 text-red-500 text-sm">{currentPasswordError}</div>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className={`flex items-center justify-between field-component field-component-border focus-within:border focus-within:border-[--color-brand-600] ${newPasswordError ? "border-destructive bg-red-50" : ""}`}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  onBlur={() => {
                    if (!passwordData.newPassword.trim()) {
                      setNewPasswordError('New password is required');
                    } else {
                      const validation = validatePasswordStrength(
                        passwordData.newPassword,
                        userFirstName,
                        userLastName,
                        userEmail
                      );
                      if (!validation.isValid) {
                        setNewPasswordError(validation.errorMessage || "Password doesn't meet requirements");
                      } else {
                        setNewPasswordError(null);
                      }
                    }
                  }}
                  className="bg-transparent w-full border-none outline-none"
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
                <div className=" z-50 flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowNewPassword(prev => !prev)}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <div className="relative group">
                    <HelpCircle className={`w-4 h-4 ${newPasswordError ? "text-red-400" : "text-gray-400"} cursor-help`} />
                    <div className="invisible group-hover:visible group-focus-within:visible absolute left-0 mt-1 w-72 bg-card border rounded-xl shadow-lg p-4 text-sm z-50">
                      <h4 className="font-medium mb-2 text-primary">Password Requirements:</h4>
                      <ul className="space-y-1">
                        {(() => {
                          const validation = validatePasswordStrength(
                            passwordData.newPassword,
                            userFirstName,
                            userLastName,
                            userEmail
                          );
                          const hasPassword = passwordData.newPassword && passwordData.newPassword.trim().length > 0;
                          return (
                            <>
                              <li className={`flex items-center ${validation.hasLength ? 'text-green-600' : 'text-red-500'}`}>
                                • Minimum 8 characters
                              </li>
                              <li className={`flex items-center ${validation.hasUpper ? 'text-green-600' : 'text-red-500'}`}>
                                • At least one uppercase letter
                              </li>
                              <li className={`flex items-center ${validation.hasLower ? 'text-green-600' : 'text-red-500'}`}>
                                • At least one lowercase letter
                              </li>
                              <li className={`flex items-center ${validation.hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                                • At least one number
                              </li>
                              <li className={`flex items-center ${validation.hasSymbol ? 'text-green-600' : 'text-red-500'}`}>
                                • At least one symbol
                              </li>
                              <li className={`flex items-center ${hasPassword && validation.containsNameAndEmail ? 'text-green-600' : 'text-red-500'}`}>
                                • Should not contain your name or email
                              </li>
                              <li className={`flex items-center ${hasPassword && validation.containsCommon ? 'text-green-600' : 'text-red-500'}`}>
                                • Password Should not contain common words
                              </li>
                            </>
                          );
                        })()}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              {passwordData.newPassword && (() => {
                const validation = validatePasswordStrength(
                  passwordData.newPassword,
                  userFirstName,
                  userLastName,
                  userEmail
                );
                return (
                  <div className="mt-2 px-1.5 flex gap-1">
                    <div className={`h-0.5 flex-1 rounded transition-colors duration-200 ${validation.strength >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-0.5 flex-1 rounded transition-colors duration-200 ${validation.strength >= 3 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-0.5 flex-1 rounded transition-colors duration-200 ${validation.strength >= 5 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-0.5 flex-1 rounded transition-colors duration-200 ${validation.strength === 7 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  </div>
                );
              })()}
              {newPasswordError && <div className="mt-1.5 text-red-500 text-sm">{newPasswordError}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className={`flex items-center justify-between field-component field-component-border focus-within:border focus-within:border-[--color-brand-600] ${confirmPasswordError ? "border-destructive bg-red-50" : ""}`}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  onBlur={() => {
                    if (!passwordData.confirmPassword.trim()) {
                      setConfirmPasswordError('Please confirm your new password');
                    } else if (passwordData.confirmPassword !== passwordData.newPassword) {
                      setConfirmPasswordError('Passwords do not match');
                    } else {
                      setConfirmPasswordError(null);
                    }
                  }}
                  className="bg-transparent w-full border-none outline-none"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
                <div className="z-50 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {confirmPasswordError && <div className="mt-1.5 text-red-500 text-sm">{confirmPasswordError}</div>}
            </div>
          </div>

          <button
            onClick={handleUpdatePassword}
            disabled={
              isUpdatingPassword ||
              changePasswordMutation.isPending ||
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              !passwordData.confirmPassword ||
              passwordData.newPassword !== passwordData.confirmPassword ||
              !validatePasswordStrength(passwordData.newPassword, userFirstName, userLastName, userEmail).isValid ||
              currentPasswordError !== null ||
              newPasswordError !== null ||
              confirmPasswordError !== null
            }
            className="flex items-center gap-2 px-6 py-3 btn-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {(isUpdatingPassword || changePasswordMutation.isPending) &&
              <Loader2 className="w-5 h-5 animate-spin" />}
            {(isUpdatingPassword || changePasswordMutation.isPending) ? 'Updating Password...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Account Status */}
      {/* <div className="bg-card rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-primary mb-8">Account Status</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between py-4 px-6 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {isVerified ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
              </div>
          <div>
                <span className="text-lg font-medium text-gray-900">Email Verification</span>
                <p className="text-sm text-gray-500">
                  {isVerified ? 'Your email address is verified' : 'Please verify your email address'}
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              isVerified 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>
          
          <div className="flex items-center justify-between py-4 px-6 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {isActive ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <div>
                <span className="text-lg font-medium text-gray-900">Account Status</span>
                <p className="text-sm text-gray-500">
                  {isActive ? 'Your account is active and ready to use' : 'Your account is currently inactive'}
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {userProfile && (
            <div className="flex items-center justify-between py-4 px-6 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <span className="text-lg font-medium text-gray-900">Auth Provider</span>
                  <p className="text-sm text-gray-500">
                    {userProfile.auth_provider === 'email' ? 'Email and password authentication' : 'Third-party authentication'}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {userProfile.auth_provider}
              </span>
            </div>
          )}
            </div>
          </div> */}

      {/* Two-Factor Authentication */}
      {/* <div className="bg-card rounded-xl border border-gray-200 p-8">
        <h3 className="text-xl font-semibold text-primary mb-6">Two-Factor Authentication</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
              <div>
              <h4 className="text-lg font-medium text-gray-900">Enable 2FA</h4>
                <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
              </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Disabled</span>
              <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-2 bg-gray-200">
                <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">2FA is currently disabled</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Enable two-factor authentication to secure your account with an additional verification step.
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSetup2FA}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
          >
            <Shield className="w-5 h-5" />
            Set Up 2FA
          </button>
        </div>
      </div> */}

      {/* Login Activity */}
      <div className="bg-card rounded-xl border border-gray-200 p-8">
        <h3 className="text-xl font-semibold text-primary mb-6">Recent Login Activity</h3>

        {sessionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current/Most Recent Session */}
            {currentSession ? (
              <div className="flex items-center justify-between py-4 px-6 bg-card border border-green-200 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Current session</p>
                    <p className="text-xs text-gray-600">
                      {currentSession.browser}{currentSession.browser_version ? ` ${currentSession.browser_version}` : ''} on {currentSession.os}
                      {currentSession.device_type && ` • ${currentSession.device_type.charAt(0).toUpperCase() + currentSession.device_type.slice(1)}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-500">
                        {formatDate(currentSession.login_at)}
                      </p>
                      {currentSession.timezone && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-500">{currentSession.timezone}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">Active now</span>
              </div>
            ) : (
              <div className="flex items-center justify-between py-4 px-6 bg-gray-50 border rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Current session</p>
                    <p className="text-xs text-gray-500">
                      {navigator.userAgent.includes('Chrome') ? 'Chrome' :
                        navigator.userAgent.includes('Firefox') ? 'Firefox' :
                          navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser'} on {navigator.platform.includes('Win') ? 'Windows' :
                            navigator.platform.includes('Mac') ? 'macOS' :
                              navigator.platform.includes('Linux') ? 'Linux' : 'Device'}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-600 font-medium">Active now</span>
              </div>
            )}

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
              <>
                {pastSessions.map((session, index) => (
                  <div key={`${session.login_at}-${index}`} className="flex items-center justify-between py-3 px-6 bg-gray-50 border rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {session.browser}{session.browser_version ? ` ${session.browser_version}` : ''} on {session.os}
                          {session.device_type && ` • ${session.device_type.charAt(0).toUpperCase() + session.device_type.slice(1)}`}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-xs text-gray-500">
                            {formatDate(session.login_at)}
                          </p>
                          {session.timezone && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <p className="text-xs text-gray-500">{session.timezone}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {loginSessions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No previous login sessions found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};