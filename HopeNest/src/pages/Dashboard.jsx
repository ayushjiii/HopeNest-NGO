import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Use AuthContext instead
import TokenVerification from '../components/TokenVerification';

export default function Dashboard() {
  const { user, loading } = useAuth(); // Use user from AuthContext
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If user is not authenticated, don't render the dashboard
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                HopeNest Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user?.avatar && (
                <img 
                  src={user.avatar} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium text-gray-700">
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Welcome to Your Dashboard!
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* User Info Card */}
                <div className="bg-indigo-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                    Profile Information
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-indigo-700">
                      <span className="font-medium">Name:</span> {user?.name}
                    </p>
                    <p className="text-sm text-indigo-700">
                      <span className="font-medium">Email:</span> {user?.email}
                    </p>
                    <p className="text-sm text-indigo-700">
                      <span className="font-medium">Role:</span> {user?.role || 'User'}
                    </p>
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      View Campaigns
                    </button>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      Make Donation
                    </button>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                      Volunteer
                    </button>
                  </div>
                </div>

                {/* Authentication Status Card */}
                <div className="bg-yellow-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    Authentication Status
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-yellow-700">Logged In</span>
                    </div>
                    <p className="text-xs text-yellow-600">
                      You have successfully authenticated using OAuth!
                    </p>
                    <p className="text-xs text-yellow-600">
                      Your JWT token is stored securely in localStorage.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* OAuth Success Message */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      OAuth Integration Complete!
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        You have successfully logged in using OAuth authentication. 
                        Your session is secured with JWT tokens.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Token Verification Component */}
              <div className="mt-8">
                <TokenVerification />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}