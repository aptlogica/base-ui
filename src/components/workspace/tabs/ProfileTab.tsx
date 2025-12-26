import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useCurrentUser, getUserInitials, getUserDisplayName } from '../../../auth/useCurrentUser';
import { useUserProfile } from '../../../hooks/useApi';

interface ProfileTabProps {
  workspaceId: string;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ workspaceId }) => {
  const { user: authUser } = useAuth();
  const currentUser = useCurrentUser();
  
  // Get user profile data for avatar
  const { data: profileResponse } = useUserProfile(authUser?.id || '');
  const userProfile = profileResponse?.data;

  const userName = getUserDisplayName(currentUser);
  const userEmail = currentUser?.email || 'user@example.com';
  const userAvatar = userProfile?.avatar || currentUser?.avatar || '';
  const isVerified = currentUser?.is_verified || false;
  const isActive = currentUser?.is_active || false;
  const createdAt = currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A';

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <div className="bg-card rounded-xl border border p-6">
        <h2 className="text-xl font-medium text-primary mb-4">Profile Information</h2>
        
        <div className="flex items-start space-x-4">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center">
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <span className="text-primary font-semibold text-xl">
                  {getUserInitials(currentUser)}
                </span>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="px-3 py-2 bg-[var(--color-muted-bg)] border border rounded-md text-gray-900">
                  {userName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <div className="px-3 py-2 bg-[var(--color-muted-bg)] border border rounded-md text-gray-900 font-mono text-sm">
                  {authUser?.id || 'Not available'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="px-3 py-2 bg-[var(--color-muted-bg)] border border rounded-md text-gray-900">
                {userEmail}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Initials
              </label>
              <div className="px-3 py-2 bg-[var(--color-muted-bg)] border border rounded-md text-gray-900 font-mono text-sm">
                {getUserInitials(currentUser)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-card rounded-xl border border p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">Receive email notifications for workspace updates</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2 bg-blue-600">
              <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2 bg-gray-200">
              <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Account Status</h3>
              <p className="text-sm text-gray-500">
                {isVerified ? 'Verified' : 'Not verified'} • 
                {isActive ? ' Active' : ' Inactive'}
              </p>
            </div>
            <span className="text-xs text-gray-500">
              Member since {createdAt}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
