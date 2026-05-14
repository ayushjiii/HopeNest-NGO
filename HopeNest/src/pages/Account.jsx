// src/pages/Account.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../component/Navbar';
import Footer from '../component/Footer';
import { fetchMyDonations, fetchMyVolunteers } from '../services/api';

export default function Account() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState('');
  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donationsError, setDonationsError] = useState('');
  const [volunteers, setVolunteers] = useState([]);
  const [volunteersLoading, setVolunteersLoading] = useState(false);
  const [volunteersError, setVolunteersError] = useState('');

  // Disable password update until all fields are filled
  const isPasswordUpdateDisabled = !formData.currentPassword || !formData.newPassword || !formData.confirmPassword;

  const handleApiResponse = async (response) => {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Use the user data from AuthContext instead of making another API call
        // This prevents the infinite loop when the API call fails
        if (user) {
          setFormData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || ''
          }));
          setLoading(false);
          return;
        }

        // Only make API call if we don't have user data in context
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await handleApiResponse(response);
        
        // Update both form data and user context with real user data
        const resolvedName = data.name || data.user?.name || '';
        const resolvedEmail = data.email || data.user?.email || '';
        setFormData(prev => ({
          ...prev,
          name: resolvedName,
          email: resolvedEmail
        }));
        updateUser({ name: resolvedName, email: resolvedEmail });
        
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setError(error.message);
        // Only logout if it's clearly an auth issue
        if (error.message.includes('401') || error.message.includes('403')) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    // Always fetch fresh user data on page load
    fetchUserData();
  }, [navigate, logout, user, updateUser]);

  // Sync tab with URL query param (?tab=profile|security|activity|volunteer)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['profile', 'security', 'activity', 'volunteer'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Fetch user's donations when Activity tab is active
  useEffect(() => {
    const loadDonations = async () => {
      try {
        setDonationsError('');
        setDonationsLoading(true);
        const list = await fetchMyDonations();
        setDonations(list);
      } catch (e) {
        setDonationsError(e.message || 'Failed to load donations');
      } finally {
        setDonationsLoading(false);
      }
    };
    if (activeTab === 'activity') {
      loadDonations();
    }
  }, [activeTab]);

  // Fetch user's volunteers when Volunteer tab is active
  useEffect(() => {
    const loadVolunteers = async () => {
      try {
        setVolunteersError('');
        setVolunteersLoading(true);
        const list = await fetchMyVolunteers();
        setVolunteers(list);
      } catch (e) {
        setVolunteersError(e.message || 'Failed to load volunteer registrations');
      } finally {
        setVolunteersLoading(false);
      }
    };
    if (activeTab === 'volunteer') {
      loadVolunteers();
    }
  }, [activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // When updating password (Security tab), require all password fields
    if (activeTab === 'security' && isPasswordUpdateDisabled) {
      setError('Please fill all password fields');
      return;
    }

    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (formData.newPassword && !formData.currentPassword) {
      setError("Current password is required to change password");
      return;
    }

    try {
      const response = await fetch('/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await handleApiResponse(response);
      // If backend provides a refreshed token (e.g., after email change), persist it
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      updateUser({ name: formData.name, email: formData.email });
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message);
      if (error.message.includes('non-JSON') || error.message.includes('401')) {
        logout();
        navigate('/login');
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordStatus('');
    
    if (!forgotPasswordEmail) {
      setForgotPasswordStatus('Please enter your email address');
      return;
    }

    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: forgotPasswordEmail })
      });

      await handleApiResponse(response);
      
      setForgotPasswordStatus('success');
      setForgotPasswordEmail('');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordStatus('');
      }, 3000);
    } catch (error) {
      setForgotPasswordStatus(error.message);
      if (error.message.includes('non-JSON')) {
        logout();
        navigate('/login');
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      await handleApiResponse(response);
      logout();
      navigate('/');
    } catch (error) {
      setError(error.message);
      if (error.message.includes('non-JSON') || error.message.includes('401')) {
        logout();
        navigate('/login');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xl">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-medium">{user?.name || 'User'}</h3>
                    <p className="text-sm text-gray-500">{user?.email || ''}</p>
                  </div>
                </div>
                
                <nav className="space-y-1">
                  <button
                    onClick={() => navigate('?tab=profile')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'profile' ? 'bg-accent/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Profile Information
                  </button>
                  <button
                    onClick={() => navigate('?tab=security')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'security' ? 'bg-accent/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Security
                  </button>
                  <button
                    onClick={() => navigate('?tab=activity')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'activity' ? 'bg-accent/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Donation Activity
                  </button>
                  <button
                    onClick={() => navigate('?tab=volunteer')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'volunteer' ? 'bg-accent/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Volunteer Activity
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </nav>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-grow">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {activeTab === 'profile' 
                      ? 'Profile Information' 
                      : activeTab === 'activity' 
                      ? 'Donation Activity' 
                      : activeTab === 'volunteer' 
                      ? 'Volunteer Activity' 
                      : 'Security Settings'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeTab === 'profile' 
                      ? 'Manage your personal information' 
                      : activeTab === 'activity'
                      ? 'View your recent donations and details'
                      : activeTab === 'volunteer'
                      ? 'View your volunteer registrations and details'
                      : 'Update your password and security settings'}
                  </p>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {success && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">{success}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'profile' ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                            required
                            disabled={!isEditing}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                            required
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={toggleEdit}
                              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focusring"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focusring"
                            >
                              Save Changes
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={toggleEdit}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focusring"
                          >
                            Edit Profile
                          </button>
                        )}
                      </div>
                      </form>
                      ) : activeTab === 'security' ? (
                        <div className="space-y-6">
                          {showForgotPassword ? (
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                              <h3 className="text-lg font-medium mb-4">Reset Password</h3>
                              {forgotPasswordStatus === 'success' ? (
                                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                                  <p className="text-sm text-green-700">
                                    Password reset code sent to your email. Please check your inbox.
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-600 mb-4">
                                    Enter your email address and we'll send you a code to reset your password.
                                  </p>
                                  <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div>
                                      <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                      </label>
                                      <input
                                        type="email"
                                        id="forgotEmail"
                                        value={forgotPasswordEmail}
                                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                                        placeholder="your@email.com"
                                        required
                                      />
                                    </div>
                                    {forgotPasswordStatus && forgotPasswordStatus !== 'success' && (
                                      <p className="text-sm text-red-600">{forgotPasswordStatus}</p>
                                    )}
                                    <div className="flex justify-end space-x-3">
                                      <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focusring"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focusring"
                                      >
                                        Send Reset Link
                                      </button>
                                    </div>
                                  </form>
                                </>
                              )}
                            </div>
                          ) : (
                            <>
                              <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                  <div>
                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                      Current Password
                                    </label>
                                    <input
                                      type="password"
                                      id="currentPassword"
                                      name="currentPassword"
                                      value={formData.currentPassword}
                                      onChange={handleChange}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                                      placeholder="Enter your current password"
                                    />
                                  </div>
                                  
                                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password
                                      </label>
                                      <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                                        placeholder="At least 8 characters"
                                        minLength="8"
                                      />
                                    </div>
                                    
                                    <div>
                                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password
                                      </label>
                                      <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                                        placeholder="Must match new password"
                                        minLength="8"
                                      />
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                                  <div>
                                    <button
                                      type="submit"
                                      disabled={isPasswordUpdateDisabled}
                                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focusring ${isPasswordUpdateDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      Update Password
                                    </button>
                                  </div>
                                  
                                  <div className="space-x-4">
                                    <button
                                      type="button"
                                      onClick={() => setShowForgotPassword(true)}
                                      className="text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
                                    >
                                      Forgot Password?
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleDeleteAccount}
                                      className="text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
                                    >
                                      Delete Account
                                    </button>
                                  </div>
                                </div>
                              </form>
                            </>
                          )}
                        </div>
                      ) : activeTab === 'activity' ? (
                    // Donation Activity Tab
                    <div>
                      {donationsLoading ? (
                        <div className="space-y-4 py-4">
                          <div className="flex items-center justify-between py-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full skeleton"></div>
                              <div>
                                <div className="h-4 w-32 rounded skeleton mb-2"></div>
                                <div className="h-3 w-48 rounded skeleton"></div>
                              </div>
                            </div>
                            <div className="h-6 w-28 rounded skeleton"></div>
                          </div>
                          <div className="flex items-center justify-between py-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full skeleton"></div>
                              <div>
                                <div className="h-4 w-40 rounded skeleton mb-2"></div>
                                <div className="h-3 w-56 rounded skeleton"></div>
                              </div>
                            </div>
                            <div className="h-6 w-24 rounded skeleton"></div>
                          </div>
                          <div className="flex items-center justify-between py-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full skeleton"></div>
                              <div>
                                <div className="h-4 w-28 rounded skeleton mb-2"></div>
                                <div className="h-3 w-40 rounded skeleton"></div>
                              </div>
                            </div>
                            <div className="h-6 w-20 rounded skeleton"></div>
                          </div>
                        </div>
                      ) : donationsError ? (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                          <p className="text-sm text-red-700">{donationsError}</p>
                        </div>
                      ) : donations.length === 0 ? (
                        <div className="text-center py-10">
                          <p className="text-gray-600">No donations yet. Your contributions will appear here.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {donations.map((d) => (
                            <div key={d._id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4">
                              <div className="flex items-start sm:items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-semibold">
                                  ₹
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">
                                    ₹{d.amount} {d.type === 'monthly' ? '/ month' : ''}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {d.campaignId?.title ? ` • ${d.campaignId.title}` : ' • General Donation'}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 sm:mt-0 text-sm text-gray-600">
                                <span className="inline-block px-2 py-1 rounded bg-green-50 text-green-700 mr-2">{d.status || 'completed'}</span>
                                <span className="inline-block px-2 py-1 rounded bg-gray-100">{d.paymentMethod}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Volunteer Activity Tab
                    <div>
                      {volunteersLoading ? (
                        <div className="space-y-4 py-4">
                          <div className="flex items-center justify-between py-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full skeleton"></div>
                              <div>
                                <div className="h-4 w-48 rounded skeleton mb-2"></div>
                                <div className="h-3 w-40 rounded skeleton"></div>
                              </div>
                            </div>
                            <div className="h-6 w-24 rounded skeleton"></div>
                          </div>
                          <div className="flex items-center justify-between py-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full skeleton"></div>
                              <div>
                                <div className="h-4 w-56 rounded skeleton mb-2"></div>
                                <div className="h-3 w-48 rounded skeleton"></div>
                              </div>
                            </div>
                            <div className="h-6 w-20 rounded skeleton"></div>
                          </div>
                          <div className="flex items-center justify-between py-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full skeleton"></div>
                              <div>
                                <div className="h-4 w-40 rounded skeleton mb-2"></div>
                                <div className="h-3 w-32 rounded skeleton"></div>
                              </div>
                            </div>
                            <div className="h-6 w-16 rounded skeleton"></div>
                          </div>
                        </div>
                      ) : volunteersError ? (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                          <p className="text-sm text-red-700">{volunteersError}</p>
                        </div>
                      ) : volunteers.length === 0 ? (
                        <div className="text-center py-10">
                          <p className="text-gray-600">No volunteer registrations yet. Your activity will appear here.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {volunteers.map((v) => (
                            <div key={v._id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4">
                              <div className="flex items-start sm:items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-semibold">
                                  V
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">
                                    {v.campaignId?.title ? v.campaignId.title : 'General Volunteering'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {v.availability ? ` • ${v.availability}` : ''}
                                  </p>
                                  {v.skills && v.skills.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">Skills: {v.skills.join(', ')}</p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 sm:mt-0 text-sm text-gray-600">
                                <span className="inline-block px-2 py-1 rounded bg-gray-100">{v.status || 'active'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}