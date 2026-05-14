// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CrowdfundingAdminPanel from './CrowdfundingAdminPanel';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState(null);
  
  // Responsive state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Form states
  const [showUserForm, setShowUserForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  // Users table actions dropdown state
  const [openUserActionsId, setOpenUserActionsId] = useState(null);
  // Campaigns card actions dropdown state
  const [openCampaignActionsId, setOpenCampaignActionsId] = useState(null);
  
  // User form state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  
  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    targetAmount: '',
    startDate: '',
    endDate: '',
    category: 'Education',
    imageUrl: ''
  });

  // Donation filter state
  const [filterDates, setFilterDates] = useState({
    fromDate: '',
    toDate: ''
  });

  // Check admin authorization on component mount
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/404');
          return;
        }
        
        const res = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.role === 'admin') {
          setAuthorized(true);
          fetchAllData();
        } else {
          navigate('/404');
        }
      } catch (err) {
        console.error('Admin check failed:', err);
        navigate('/404');
      }
    };

    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    // Initialize filtered donations with all donations
    setFilteredDonations(donations);
  }, [donations]);

  // Close action dropdowns when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest('[data-actions-menu]')) {
        setOpenUserActionsId(null);
        setOpenCampaignActionsId(null);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Close action dropdowns on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenUserActionsId(null);
        setOpenCampaignActionsId(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersRes, campaignsRes, donationsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users').catch(err => {
          console.error('Error fetching users:', err);
          return { data: [] };
        }),
        axios.get('http://localhost:5000/api/campaigns').catch(err => {
          console.error('Error fetching campaigns:', err);
          return { data: [] };
        }),
        axios.get('http://localhost:5000/api/donations').catch(err => {
          console.error('Error fetching donations:', err);
          return { data: [] };
        })
      ]);
      
      setUsers(usersRes.data || []);
      // Exclude crowdfunding from Campaigns tab list
      const onlyCampaigns = (campaignsRes.data || []).filter(c => (c.type || 'campaign') === 'campaign');
      setCampaigns(onlyCampaigns);
      setDonations(donationsRes.data || []);
      
    } catch (err) {
      console.error('Error in fetchAllData:', err);
      setError('Failed to fetch data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when switching tabs on mobile
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // User Management Functions
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      if (editingItem) {
        await axios.put(`http://localhost:5000/api/users/${editingItem._id}`, userForm);
      } else {
        await axios.post('http://localhost:5000/api/users', userForm);
      }
      setShowUserForm(false);
      setEditingItem(null);
      setUserForm({ name: '', email: '', password: '', role: 'user' });
      fetchAllData();
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Failed to save user: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUserDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setError(null);
        await axios.delete(`http://localhost:5000/api/users/${userId}`);
        fetchAllData();
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleUserEdit = (user) => {
    setEditingItem(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role || 'user'
    });
    setShowUserForm(true);
  };

  const handleUserToggleBlock = async (u) => {
    const action = u.isBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      setError(null);
      await axios.put(`http://localhost:5000/api/users/${u._id}`, { isBlocked: !u.isBlocked });
      fetchAllData();
    } catch (err) {
      console.error(`Error trying to ${action} user:`, err);
      setError(`Failed to ${action} user: ` + (err.response?.data?.message || err.message));
    }
  };

  // Campaign Management Functions
  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      const campaignData = {
        ...campaignForm,
        targetAmount: Number(campaignForm.targetAmount),
        currentAmount: editingItem ? editingItem.currentAmount : 0
      };
      
      if (editingItem) {
        await axios.put(`http://localhost:5000/api/campaigns/${editingItem._id}`, campaignData);
      } else {
        await axios.post('http://localhost:5000/api/campaigns', campaignData);
      }
      setShowCampaignForm(false);
      setEditingItem(null);
      setCampaignForm({
        title: '',
        description: '',
        targetAmount: '',
        startDate: '',
        endDate: '',
        category: 'Education',
        imageUrl: ''
      });
      fetchAllData();
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError('Failed to save campaign: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCampaignDelete = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        setError(null);
        await axios.delete(`http://localhost:5000/api/campaigns/${campaignId}`);
        fetchAllData();
      } catch (err) {
        console.error('Error deleting campaign:', err);
        setError('Failed to delete campaign: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleCampaignEdit = (campaign) => {
    setEditingItem(campaign);
    setCampaignForm({
      title: campaign.title,
      description: campaign.description,
      targetAmount: campaign.targetAmount.toString(),
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
      category: campaign.category || 'Education',
      imageUrl: campaign.imageUrl || ''
    });
    setShowCampaignForm(true);
  };

  // Donation Filter Functions
  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterDates(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyDateFilter = () => {
    if (!filterDates.fromDate && !filterDates.toDate) {
      setFilteredDonations(donations);
      return;
    }

    const filtered = donations.filter(donation => {
      const donationDate = new Date(donation.date);
      const fromDate = filterDates.fromDate ? new Date(filterDates.fromDate) : null;
      const toDate = filterDates.toDate ? new Date(filterDates.toDate) : null;
      
      // Reset time part for comparison
      if (fromDate) fromDate.setHours(0, 0, 0, 0);
      if (toDate) toDate.setHours(23, 59, 59, 999); // Include entire day
      if (donationDate) donationDate.setHours(0, 0, 0, 0);
      
      if (fromDate && donationDate < fromDate) return false;
      if (toDate && donationDate > toDate) return false;
      
      return true;
    });

    setFilteredDonations(filtered);
  };

  const resetDateFilter = () => {
    setFilterDates({
      fromDate: '',
      toDate: ''
    });
    setFilteredDonations(donations);
  };

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    totalCampaigns: campaigns.length,
    totalDonations: donations.length,
    totalAmount: donations.reduce((sum, d) => sum + (d.amount || 0), 0),
    activeCampaigns: campaigns.filter(c => {
      if (!c.endDate) return false;
      return new Date(c.endDate) > new Date();
    }).length
  };

  if (!authorized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 right-4 z-30 p-2 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 focus:ring-offset-gray-50 shadow-sm"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>

      {/* Sidebar Navigation - Responsive (fixed on desktop) */}
      <div 
        className={`fixed md:fixed top-0 left-0 md:top-0 md:left-0 z-20 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } md:translate-x-0 h-screen border-r border-gray-800`}
      >
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm">Welcome back, {user?.name || 'Admin'}!</p>
        </div>
        
        <nav className="flex-1 py-4">
          <ul className="space-y-1" role="tablist" aria-orientation="vertical">
            {[ 
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'users', name: 'Users', icon: '👥' },
              { id: 'campaigns', name: 'Campaigns', icon: '🎯' },
              { id: 'crowdfunding', name: 'Crowdfunding', icon: '🤝' },
              { id: 'donations', name: 'Donations', icon: '💰' },
              { id: 'volunteers', name: 'Volunteers', icon: '🙋' }
            ].map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => handleTabChange(tab.id)}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  className={`w-full text-left px-6 py-3 flex items-center text-sm font-medium ${
                    activeTab === tab.id
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  } rounded-r-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-700`}
                >
                  <span className="mr-3 text-lg">{tab.icon}</span>
                  {tab.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-6 border-t border-gray-800 mt-auto">
          <div className="flex items-center">
            <div className="bg-gray-800 px-3 py-1 rounded-full text-xs font-medium">
              Admin
            </div>
            <button 
              onClick={logout}
              className="ml-auto text-gray-400 hover:text-white flex items-center"
            >
              <span className="mr-2">🔒</span>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-10 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-white md:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top Bar with mobile menu toggle */}
          <div className="mb-8 flex items-center justify-between">
            <div className="md:hidden">
              <h1 className="text-xl font-bold text-gray-900">
                {activeTab === 'overview' && 'Dashboard'}
                {activeTab === 'users' && 'Users'}
                {activeTab === 'campaigns' && 'Campaigns'}
                {activeTab === 'donations' && 'Donations'}
                {activeTab === 'crowdfunding' && 'Crowdfunding'}
              </h1>
            </div>
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'campaigns' && 'Campaign Management'}
                {activeTab === 'donations' && 'Donation History'}
                {activeTab === 'volunteers' && 'Volunteers'}
                {activeTab === 'crowdfunding' && 'Crowdfunding'}
              </h1>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <button 
                    onClick={() => setError(null)}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" className="space-y-6">
              {/* Statistics Cards - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Card 1: Total Users */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 hover:shadow-md">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-700 text-xl">👥</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                          <dd className="text-lg font-semibold text-gray-900">{stats.totalUsers}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Total Campaigns */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 hover:shadow-md">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-700 text-xl">🎯</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Campaigns</dt>
                          <dd className="text-lg font-semibold text-gray-900">{stats.totalCampaigns}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3: Active Campaigns */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 hover:shadow-md">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-700 text-xl">🔥</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Active Campaigns</dt>
                          <dd className="text-lg font-semibold text-gray-900">{stats.activeCampaigns}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 4: Total Amount */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 hover:shadow-md">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-700 text-xl">💰</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                          <dd className="text-lg font-semibold text-gray-900">₹{stats.totalAmount.toLocaleString()}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {donations.slice(0, 5).map((donation, index) => (
                      <div key={index} className="flex items-center space-x-3 sm:space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-700 text-sm sm:text-base">💰</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                            {donation.name} donated ₹{donation.amount}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {new Date(donation.date).toLocaleDateString()} • {donation.type}
                          </p>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                          {new Date(donation.date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    {donations.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No recent donations</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div role="tabpanel" id="panel-users" aria-labelledby="tab-users" className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Users</h2>
                <button
                  onClick={() => {
                    setShowUserForm(true);
                    setEditingItem(null);
                    setUserForm({ name: '', email: '', password: '', role: 'user' });
                  }}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 w-full sm:w-auto shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
                >
                  Add User
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-700 font-medium text-sm sm:text-base">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span>{user.role}</span>
                              {user.isBlocked && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Blocked</span>
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right w-28">
                              <div className="relative inline-block text-left" data-actions-menu>
                                <button
                                  type="button"
                                  onClick={() => setOpenUserActionsId(openUserActionsId === user._id ? null : user._id)}
                                  aria-haspopup="menu"
                                  aria-expanded={openUserActionsId === user._id}
                                  aria-label={`Actions for ${user.name}`}
                                  aria-controls={`user-menu-${user._id}`}
                                  id={`user-actions-${user._id}`}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      setOpenUserActionsId(openUserActionsId === user._id ? null : user._id);
                                    }
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-2 py-1 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                                >
                                  Actions
                                  <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                  </svg>
                                </button>

                                {openUserActionsId === user._id && (
                                  <div
                                    className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                                    role="menu"
                                    id={`user-menu-${user._id}`}
                                    aria-labelledby={`user-actions-${user._id}`}
                                    aria-orientation="vertical"
                                  >
                                    <div className="py-1" role="none">
                                      <button
                                        onClick={() => { handleUserEdit(user); setOpenUserActionsId(null); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                                        role="menuitem"
                                        autoFocus
                                      >
                                        Edit
                                      </button>
                                      <div className="my-1 border-t border-gray-200"></div>
                                      <button
                                        onClick={() => { handleUserToggleBlock(user); setOpenUserActionsId(null); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                                        role="menuitem"
                                      >
                                        {user.isBlocked ? 'Unblock' : 'Block'}
                                      </button>
                                      <div className="my-1 border-t border-gray-200"></div>
                                      <button
                                        onClick={() => { handleUserDelete(user._id); setOpenUserActionsId(null); }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none transition-colors"
                                        role="menuitem"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div role="tabpanel" id="panel-campaigns" aria-labelledby="tab-campaigns" className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Campaigns</h2>
                <button
                  onClick={() => {
                    setShowCampaignForm(true);
                    setEditingItem(null);
                    setCampaignForm({ title: '', description: '', targetAmount: 0, startDate: '', endDate: '', category: '' });
                  }}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 w-full sm:w-auto shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
                >
                  Add Campaign
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500">No campaigns found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {campaigns.map((campaign) => (
                    <div key={campaign._id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{campaign.title}</h3>
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">
                            {campaign.category}
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">{campaign.description}</p>
                        <div className="space-y-2 mb-3 sm:mb-4">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-gray-500">Target:</span>
                            <span className="font-medium">₹{campaign.targetAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-gray-500">Raised:</span>
                            <span className="font-medium">₹{(campaign.currentAmount || 0).toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div
                              className="bg-gray-800 h-1.5 sm:h-2 rounded-full"
                              style={{ width: `${Math.min(100, ((campaign.currentAmount || 0) / campaign.targetAmount) * 100)}%` }}
                            ></div>
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            {Math.min(100, ((campaign.currentAmount || 0) / campaign.targetAmount) * 100).toFixed(0)}% funded
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            {campaign.startDate && new Date(campaign.startDate).toLocaleDateString()} - {campaign.endDate && new Date(campaign.endDate).toLocaleDateString()}
                          </div>
                          <div className="relative inline-block text-left" data-actions-menu>
                            <button
                              type="button"
                              onClick={() => setOpenCampaignActionsId(openCampaignActionsId === campaign._id ? null : campaign._id)}
                              aria-haspopup="menu"
                              aria-expanded={openCampaignActionsId === campaign._id}
                              aria-label={`Actions for ${campaign.title}`}
                              className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1 text-xs sm:text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                              Actions
                              <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                              </svg>
                            </button>

                            {openCampaignActionsId === campaign._id && (
                              <div
                                className="origin-bottom-right absolute right-0 bottom-full mb-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                                role="menu"
                                aria-orientation="vertical"
                              >
                                <div className="py-1" role="none">
                                  <button
                                    onClick={() => { handleCampaignEdit(campaign); setOpenCampaignActionsId(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                                    role="menuitem"
                                  >
                                    Edit
                                  </button>
                                  <div className="my-1 border-t border-gray-200"></div>
                                  <button
                                    onClick={() => { handleCampaignDelete(campaign._id); setOpenCampaignActionsId(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none transition-colors"
                                    role="menuitem"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Crowdfunding Tab */}
          {activeTab === 'crowdfunding' && (
            <div role="tabpanel" id="panel-crowdfunding" aria-labelledby="tab-crowdfunding">
              <CrowdfundingAdminPanel />
            </div>
          )}

          {/* Donations Tab with Date Filter */}
          {activeTab === 'donations' && (
            <div role="tabpanel" id="panel-donations" aria-labelledby="tab-donations" className="space-y-6">
              <div className="flex flex-col justify-between items-start gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Donation History</h2>
                
                <div className="w-full flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                    <label className="text-sm text-gray-700 min-w-[60px]">From:</label>
                    <input
                      type="date"
                      name="fromDate"
                      value={filterDates.fromDate}
                      onChange={handleDateFilterChange}
                      className="border border-gray-300 rounded-lg px-3 py-1 sm:py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 w-full"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                    <label className="text-sm text-gray-700 min-w-[60px]">To:</label>
                    <input
                      type="date"
                      name="toDate"
                      value={filterDates.toDate}
                      onChange={handleDateFilterChange}
                      className="border border-gray-300 rounded-lg px-3 py-1 sm:py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 w-full"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={applyDateFilter}
                      className="bg-gray-800 text-white px-3 py-1 sm:py-2 rounded-lg text-sm hover:bg-gray-700 w-full sm:w-auto"
                    >
                      Apply Filter
                    </button>
                    
                    <button
                      onClick={resetDateFilter}
                      className="bg-gray-200 text-gray-800 px-3 py-1 sm:py-2 rounded-lg text-sm hover:bg-gray-300 w-full sm:w-auto"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
              
              {filteredDonations.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  {donations.length === 0 ? (
                    <p className="text-gray-500">No donations found</p>
                  ) : (
                    <div>
                      <p className="text-gray-500">No donations match the selected date range</p>
                      <button
                        onClick={resetDateFilter}
                        className="mt-2 text-gray-700 underline hover:text-gray-900"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDonations.map((donation) => (
                          <tr key={donation._id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-700 text-sm sm:text-base">💰</span>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-xs">{donation.name}</div>
                                  <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[100px] sm:max-w-xs">{donation.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{donation.amount}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {donation.type}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {new Date(donation.date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Volunteers Tab */}
          {activeTab === 'volunteers' && (
            <div role="tabpanel" id="panel-volunteers" aria-labelledby="tab-volunteers">
              <VolunteersPanel />
            </div>
          )}
        </div>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Edit User' : 'Add New User'}
              </h3>
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required={!editingItem}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUserForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Form Modal */}
      {showCampaignForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Edit Campaign' : 'Add New Campaign'}
              </h3>
              <form onSubmit={handleCampaignSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm({...campaignForm, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={campaignForm.description}
                    onChange={(e) => setCampaignForm({...campaignForm, description: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    value={campaignForm.targetAmount}
                    onChange={(e) => setCampaignForm({...campaignForm, targetAmount: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={campaignForm.startDate}
                      onChange={(e) => setCampaignForm({...campaignForm, startDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={campaignForm.endDate}
                      onChange={(e) => setCampaignForm({...campaignForm, endDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={campaignForm.category}
                    onChange={(e) => setCampaignForm({...campaignForm, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="Education">Education</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Community Development">Community Development</option>
                    <option value="Emergency Relief">Emergency Relief</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={campaignForm.imageUrl}
                    onChange={(e) => setCampaignForm({...campaignForm, imageUrl: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCampaignForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Volunteers Panel Component
function VolunteersPanel() {
  const [volunteers, setVolunteers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/volunteers');
      if (!res.ok) throw new Error('Failed to fetch volunteers');
      const data = await res.json();
      setVolunteers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchVolunteers(); }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/volunteers/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update');
      await fetchVolunteers();
    } catch (err) {
      alert(err.message);
    }
  };

  const removeVolunteer = async (id) => {
    if (!window.confirm('Delete this volunteer?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/volunteers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchVolunteers();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-10 h-10 border-4 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-gray-600">Loading volunteers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Volunteers</h2>
        <button onClick={fetchVolunteers} className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm">Refresh</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {volunteers.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No volunteers yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {volunteers.map(v => (
                  <tr key={v._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{v.email}</div>
                      <div className="text-xs text-gray-500">{v.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{v.campaignId?.title || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{v.availability}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{(v.skills || []).join(', ')}</td>
                    <td className="px-4 py-3">
                      <select
                        value={v.status}
                        onChange={(e) => updateStatus(v._id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="active">active</option>
                        <option value="archived">archived</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeVolunteer(v._id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;