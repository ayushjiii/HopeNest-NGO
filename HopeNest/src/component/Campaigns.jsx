import React, { useState, useEffect } from 'react';
import { fetchCampaigns } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('live');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [impactStats, setImpactStats] = useState({
    totalCampaigns: 0,
    totalRaised: 0,
    completedCampaigns: 0
  });
  const [likedCampaigns, setLikedCampaigns] = useState(new Set());
  const { user } = useAuth();
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [volunteerForm, setVolunteerForm] = useState({
    name: '',
    email: '',
    phone: '',
    availability: 'any',
    skills: '',
    message: ''
  });
  const [volunteerSubmitting, setVolunteerSubmitting] = useState(false);
  const [volunteerSubmitted, setVolunteerSubmitted] = useState(false);
  const [volunteerError, setVolunteerError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Auto-open volunteer modal when navigated with a query flag from elsewhere (e.g., Gallery)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpen =
      params.get('join') === 'volunteer' ||
      params.get('openVolunteer') === '1' ||
      params.get('volunteer') === '1' ||
      params.get('open') === 'volunteer';

    if (shouldOpen) {
      // Open appropriate modal based on auth state
      if (!user) {
        setShowAuthModal(true);
      } else {
        setShowVolunteerModal(true);
      }
    }
  }, [location.search, user]);

  const getCampaignStatus = (campaign) => {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    
    if (campaign.currentAmount >= campaign.targetAmount) {
      return 'completed';
    }
    
    if (now < start) return 'future';
    if (now > start && now < end) return 'live';
    return 'completed';
  };

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await fetchCampaigns();
        // Only show real campaigns on this page (exclude crowdfunding)
        const onlyCampaigns = (data || []).filter(c => (c.type || 'campaign') === 'campaign');
        setCampaigns(onlyCampaigns);
        
        const totalCampaigns = onlyCampaigns.length;
        const totalRaised = onlyCampaigns.reduce((sum, campaign) => sum + campaign.currentAmount, 0);
        const completedCampaigns = onlyCampaigns.filter(campaign => {
          const status = getCampaignStatus(campaign);
          return status === 'completed';
        }).length;
        
        setImpactStats({
          totalCampaigns,
          totalRaised,
          completedCampaigns
        });
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadCampaigns();
  }, []);

  const toggleLike = (campaignId) => {
    const newLikedCampaigns = new Set(likedCampaigns);
    if (newLikedCampaigns.has(campaignId)) {
      newLikedCampaigns.delete(campaignId);
    } else {
      newLikedCampaigns.add(campaignId);
    }
    setLikedCampaigns(newLikedCampaigns);
  };

  const daysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = Math.max(0, end - now);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilStart = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.max(0, start - now);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `₹${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
    return `₹${Number(num).toLocaleString('en-IN')}`;
  };

  const categories = Array.from(new Set(campaigns.map((c) => c.category || 'General'))).sort();
  const searchLower = search.trim().toLowerCase();

  const filteredCampaigns = campaigns
    .filter((campaign) => {
      const status = getCampaignStatus(campaign);
      if (activeTab === 'live') return status === 'live';
      if (activeTab === 'future') return status === 'future';
      return status === 'completed';
    })
    .filter((c) => (categoryFilter === 'all' ? true : (c.category || 'General').toLowerCase() === categoryFilter.toLowerCase()))
    .filter((c) => {
      if (!searchLower) return true;
      const hay = `${c.title || ''} ${c.description || ''} ${c.organizer?.name || ''}`.toLowerCase();
      return hay.includes(searchLower);
    });

  const calculateProgress = (current, target) => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  const handleDonateClick = (campaignId) => {
    navigate(`/donate?campaign=${campaignId}`);
  };

  const handleJoinUsClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowVolunteerModal(true);
    }
  };

  const handleVolunteerSubmitClick = async () => {
    try {
      setVolunteerError(null);
      setVolunteerSubmitting(true);
      if (!volunteerForm.phone) {
        setVolunteerError('Please enter phone');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setShowAuthModal(true);
        return;
      }

      const payload = {
        name: user?.name || volunteerForm.name,
        email: user?.email || volunteerForm.email,
        phone: volunteerForm.phone,
        campaignId: null,
        availability: volunteerForm.availability,
        skills: volunteerForm.skills
          ? volunteerForm.skills.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        message: volunteerForm.message
      };

      const res = await fetch('http://localhost:5000/api/volunteers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit');
      }
      setVolunteerSubmitted(true);
      setTimeout(() => setShowVolunteerModal(false), 800);
    } catch (err) {
      setVolunteerError(err.message || 'Failed to submit');
    } finally {
      setVolunteerSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#e9f3ef]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#05496c] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-lg text-[#0b3e5e]">Loading campaigns...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#e9f3ef]">
      <div className="text-center bg-[#dfe5e3] p-8 rounded-xl max-w-md mx-auto">
        <div className="text-[#ffcf00] text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-[#0b3e5e] mb-2">Error Loading Campaigns</h2>
        <p className="text-[#0b3e5e]">{error}</p>
        <button 
          className="mt-4 bg-[#05496c] text-white px-6 py-2 rounded-lg hover:bg-[#0b3e5e] transition"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e9f3ef] to-[#ffffff]">
      {/* Hero Section */}
      <div className="py-16 md:py-24 px-4 md:px-8 bg-gradient-to-r from-[#05496c] to-[#0b3e5e] text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Make a Difference Today</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90 mb-8">
            Support our initiatives to create positive change in communities around the world
          </p>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Our Impact</h2>
            <div className="flex flex-wrap justify-center gap-8 mt-6">
              <div className="text-center">
                <div className="text-4xl font-bold">{impactStats.totalCampaigns}</div>
                <div className="text-sm opacity-80">Campaigns</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">{formatNumber(impactStats.totalRaised)}</div>
                <div className="text-sm opacity-80">Raised</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">{impactStats.completedCampaigns}</div>
                <div className="text-sm opacity-80">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Navigation */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-10">
          <button 
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'live' 
                ? 'bg-[#05496c] text-white shadow-lg' 
                : 'bg-white text-[#0b3e5e] hover:bg-[#dfe5e3] border border-[#dfe5e3]'
            }`}
            onClick={() => setActiveTab('live')}
          >
            Live Campaigns
          </button>
          <button 
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'future' 
                ? 'bg-[#05496c] text-white shadow-lg' 
                : 'bg-white text-[#0b3e5e] hover:bg-[#dfe5e3] border border-[#dfe5e3]'
            }`}
            onClick={() => setActiveTab('future')}
          >
            Future Campaigns
          </button>
          <button 
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'completed' 
                ? 'bg-[#05496c] text-white shadow-lg' 
                : 'bg-white text-[#0b3e5e] hover:bg-[#dfe5e3] border border-[#dfe5e3]'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[{ key: 'all', label: 'All' }, ...categories.map((cat) => ({ key: cat, label: cat }))].map((s) => (
              <button
                key={s.key}
                onClick={() => setCategoryFilter(s.key)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  categoryFilter === s.key
                    ? 'bg-[#05496c] text-white border-[#05496c]'
                    : 'bg-white text-[#0b3e5e] hover:bg-[#dfe5e3] border-[#dfe5e3]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description, or organizer name..."
            className="w-full sm:max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#05496c] focus:border-transparent"
          />
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-[#dfe5e3]">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-[#0b3e5e] mb-2">No campaigns found</h3>
            <p className="text-[#0b3e5e] max-w-md mx-auto">
              {search || categoryFilter !== 'all'
                ? "No campaigns match your search or category."
                : activeTab === 'live' 
                ? "We currently don't have any active campaigns. Check back soon!"
                : activeTab === 'future'
                ? "We're planning new campaigns. Stay tuned for updates!"
                : "We'll share completed campaigns here once they're finished."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCampaigns.map(campaign => {
              const status = getCampaignStatus(campaign);
              const progress = calculateProgress(campaign.currentAmount, campaign.targetAmount);
              const isGoalMet = campaign.currentAmount >= campaign.targetAmount;
              const isLiked = likedCampaigns.has(campaign._id);
              
              return (
                <div 
                  key={campaign._id} 
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-[#dfe5e3]"
                >
                  <div className="relative">
                    <img 
                      src={campaign.imageUrl || '/default-campaign.jpg'} 
                      alt={campaign.title}
                      className="w-full h-56 object-cover"
                    />
                    {isGoalMet && (
                      <div className="absolute top-0 left-0 w-full bg-[#05496c] text-white text-center py-2 font-bold">
                        Goal Achieved!
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-medium shadow border border-[#dfe5e3]">
                      {status === 'live' ? (
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-[#05496c] rounded-full mr-2"></span>
                          Live
                        </div>
                      ) : status === 'future' ? (
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-[#ffcf00] rounded-full mr-2"></span>
                          Coming Soon
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="w-2 h-2 bg-[#0b3e5e] rounded-full mr-2"></span>
                          Completed
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-[#0b3e5e]">{campaign.title}</h3>
                      <span className="bg-[#e9f3ef] text-[#05496c] text-xs font-semibold px-2.5 py-0.5 rounded">
                        {campaign.category}
                      </span>
                    </div>
                    
                    {status === 'live' && (
                      <div className="mb-6">
                        <div className="flex justify-between text-sm font-medium mb-2">
                          <span className="text-[#05496c]">Raised: ₹{campaign.currentAmount.toLocaleString('en-IN')}</span>
                          <span className="text-[#05496c]">Goal: ₹{campaign.targetAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full bg-[#dfe5e3] rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-[#05496c] to-[#0b3e5e] h-2.5 rounded-full" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-[#0b3e5e]">
                          <span>{progress}% funded</span>
                          <span>{daysRemaining(campaign.endDate)} days left</span>
                        </div>
                      </div>
                    )}

                    {status === 'future' && (
                      <div className="bg-[#e9f3ef] p-4 rounded-lg mb-6 border border-[#dfe5e3]">
                        <div className="flex justify-between">
                          <div>
                            <div className="text-sm text-[#0b3e5e]">Starts in</div>
                            <div className="text-xl font-bold text-[#05496c]">
                              {daysUntilStart(campaign.startDate)} days
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-[#0b3e5e]">Target</div>
                            <div className="text-xl font-bold text-[#05496c]">
                              ₹{campaign.targetAmount.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {status === 'completed' && (
                      <div className="bg-[#e9f3ef] p-4 rounded-lg mb-6 border border-[#dfe5e3]">
                        <div className="flex justify-between">
                          <div>
                            <div className="text-sm text-[#0b3e5e]">Results</div>
                            <div className="text-xl font-bold text-[#05496c]">
                              ₹{campaign.currentAmount.toLocaleString('en-IN')} raised
                            </div>
                            <div className="text-sm">
                              {isGoalMet ? (
                                <span className="text-[#05496c]">Goal achieved!</span>
                              ) : (
                                <span className="text-[#0b3e5e]">
                                  {progress}% of ₹{campaign.targetAmount.toLocaleString('en-IN')} goal
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-[#0b3e5e]">Completed</div>
                            <div className="text-xl font-bold text-[#05496c]">
                              {new Date(campaign.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDonateClick(campaign._id)}
                        className="flex-1 bg-[#05496c] hover:bg-[#0b3e5e] text-white font-medium py-2.5 px-4 rounded-lg transition text-center"
                      >
                        {status === 'live' ? 'Donate Now' : status === 'future' ? 'Learn More' : 'View Results'}
                      </button>
                      <button 
                        onClick={() => toggleLike(campaign._id)}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg transition ${
                          isLiked ? 'bg-[#ffcf00] hover:bg-[#ffd83d]' : 'bg-[#dfe5e3] hover:bg-[#e9f3ef]'
                        }`}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 ${isLiked ? 'text-white fill-current' : 'text-[#05496c]'}`} 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="py-16 px-4 md:px-8 bg-gradient-to-r from-[#05496c] to-[#0b3e5e] text-white">
        <div className="max-w-7xl mx-auto text-center">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to make an impact?</h2>
            <p className="text-xl max-w-2xl mx-auto mb-8 opacity-90">
              Join our community of changemakers and be part of something bigger
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleJoinUsClick}
                className="bg-white text-[#05496c] font-bold py-3 px-8 rounded-full hover:bg-[#dfe5e3] transition shadow-lg text-center"
              >
                - Join Us -
              </button>
            </div>
          </div>
        </div>
      </div>

      {showVolunteerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={() => setShowVolunteerModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-[#0b3e5e]">Join as Volunteer</h3>
                <p className="text-sm text-[#0b3e5e] opacity-80">We'll contact you with next steps</p>
              </div>
              <button className="text-[#0b3e5e] hover:text-black" onClick={() => setShowVolunteerModal(false)}>✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#0b3e5e] mb-1">Full Name</label>
                <input disabled value={user?.name || volunteerForm.name} className="w-full p-2.5 border border-[#dfe5e3] rounded-lg bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#0b3e5e] mb-1">Phone</label>
                <input name="phone" value={volunteerForm.phone} onChange={(e)=>setVolunteerForm({...volunteerForm, phone: e.target.value})} className="w-full p-2.5 border border-[#dfe5e3] rounded-lg focus:ring-2 focus:ring-[#05496c] hover:border-[#0b3e5e] transition" placeholder="9876543210" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#0b3e5e] mb-1">Email</label>
                <input disabled value={user?.email || volunteerForm.email} className="w-full p-2.5 border border-[#dfe5e3] rounded-lg bg-gray-50" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0b3e5e] mb-1">Availability</label>
                <select name="availability" value={volunteerForm.availability} onChange={(e)=>setVolunteerForm({...volunteerForm, availability: e.target.value})} className="w-full p-3 border border-[#dfe5e3] rounded-lg focus:ring-2 focus:ring-[#05496c] hover:border-[#0b3e5e] transition">
                  <option value="any">Any</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0b3e5e] mb-1">Skills (comma separated)</label>
                <input type="text" name="skills" value={volunteerForm.skills} onChange={(e)=>setVolunteerForm({...volunteerForm, skills: e.target.value})} placeholder="E.g. First Aid, Distribution, Teaching" className="w-full p-3 border border-[#dfe5e3] rounded-lg focus:ring-2 focus:ring-[#05496c] hover:border-[#0b3e5e] transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0b3e5e] mb-1">Message (optional)</label>
                <textarea name="message" rows={3} value={volunteerForm.message} onChange={(e)=>setVolunteerForm({...volunteerForm, message: e.target.value})} placeholder="Tell us why you want to volunteer" className="w-full p-3 border border-[#dfe5e3] rounded-lg focus:ring-2 focus:ring-[#05496c] hover:border-[#0b3e5e] transition" />
              </div>
              {volunteerError && (<p className="text-red-600 text-sm">{volunteerError}</p>)}
              {volunteerSubmitted && (<p className="text-green-700 text-sm">Thanks! You have been registered as a volunteer.</p>)}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowVolunteerModal(false)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
                <button type="button" onClick={handleVolunteerSubmitClick} disabled={volunteerSubmitting} className={`px-5 py-2 rounded-lg text-white ${volunteerSubmitting ? 'bg-[#0b3e5e] opacity-70' : 'bg-[#0b3e5e] hover:bg-[#05496c]'}`}>{volunteerSubmitting ? 'Submitting...' : 'Submit'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Required Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-7">
            <div className="mb-4">
              <h3 className="text-xl md:text-2xl font-bold text-[#0b3e5e]">Login required</h3>
              <p className="text-sm text-[#0b3e5e] opacity-80 mt-1">
                You need to login first to take part as a volunteer.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => {
                  const redirect = encodeURIComponent(location.pathname + location.search);
                  navigate(`/login?redirect=${redirect}`);
                }}
                className="px-5 py-2 rounded-lg text-white bg-[#0b3e5e] hover:bg-[#05496c]"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;