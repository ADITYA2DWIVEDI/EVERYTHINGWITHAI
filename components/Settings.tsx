import React from 'react';
import type { User } from '../types';

interface SettingsProps {
  user: User | null;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {

  const handleClearHistory = () => {
    // In a real app, you would clear history from a database.
    // Here we can just alert the user.
    alert('Chat history clearing is not implemented in this demo.');
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-100">
      <div className="p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Settings</h2>
        <p className="text-gray-600">Manage your account and app preferences.</p>
      </div>
      
      <div className="flex-1 p-4 sm:p-6 space-y-8">
        {/* Profile Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-800 font-mono p-2 bg-gray-100 rounded-md mt-1">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Account Type</label>
              <p className="text-gray-800 p-2 bg-gray-100 rounded-md mt-1">{user?.isGuest ? 'Guest' : 'Registered User'}</p>
            </div>
            <button className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Appearance</h3>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Theme</label>
            <div className="flex gap-4">
              <button className="flex-1 p-3 border-2 border-blue-500 rounded-lg text-left">
                <span className="font-semibold text-gray-800">Light</span>
                <p className="text-xs text-gray-500">Current theme</p>
              </button>
               <button className="flex-1 p-3 border border-gray-300 rounded-lg text-left bg-gray-100 cursor-not-allowed opacity-50">
                <span className="font-semibold text-gray-800">Dark</span>
                <p className="text-xs text-gray-500">Coming soon</p>
              </button>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Clear Chat History</p>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
            <button 
              onClick={handleClearHistory}
              className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors">
              Clear Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
