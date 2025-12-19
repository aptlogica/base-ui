import React from 'react';
import { useAuth } from '../../auth/AuthContext';

export const PreferencesSection: React.FC = () => {
  const { user: authUser } = useAuth();
  
  // Use real data from login response
  const userLocale = authUser?.locale || 'en';
  const userTimezone = authUser?.timezone || 'UTC';
  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <div className="bg-card rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-medium text-primary mb-6">Notification Preferences</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600">
              <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600">
              <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Weekly Summary</h3>
              <p className="text-sm text-gray-500">Get a weekly summary of your workspace activity</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-2 bg-gray-200">
              <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Product Updates</h3>
              <p className="text-sm text-gray-500">Stay informed about new features and improvements</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600">
              <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Display Preferences */}
      <div className="bg-card rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Display Preferences</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <option>System Default</option>
              <option>Light</option>
              <option>Dark</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select 
              defaultValue={userLocale}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Format
            </label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Format
            </label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <option>12 Hour (AM/PM)</option>
              <option>24 Hour</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy Preferences */}
      <div className="bg-card rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Profile Visibility</h3>
              <p className="text-sm text-gray-500">Allow others in your workspace to see your profile</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600">
              <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Activity Status</h3>
              <p className="text-sm text-gray-500">Show when you're online and active</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600">
              <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Usage Analytics</h3>
              <p className="text-sm text-gray-500">Help improve the product by sharing usage data</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-2 bg-gray-200">
              <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Save Changes */}
      <div className="flex justify-end space-x-3">
        <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 font-medium">
          Reset to Defaults
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
          Save Preferences
        </button>
      </div>
    </div>
  );
};