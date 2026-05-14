import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCrowdfundings } from '../services/api';

function Crowdfunding() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('live'); // live | upcoming | completed

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCrowdfundings();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusOf = (it) => {
    const now = new Date();
    const start = it.startDate ? new Date(it.startDate) : null;
    const end = it.endDate ? new Date(it.endDate) : null;
    if (start && now < start) return 'upcoming';
    if (end && now > end) return 'completed';
    return 'live';
  };

  const daysRemaining = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = Math.max(0, end - now);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilStart = (startDate) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.max(0, start - now);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const goDonate = (id) => {
    navigate(`/donate?campaign=${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#05496c] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading crowdfunding campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // Derived collections for UI
  const categories = Array.from(new Set(items.map((i) => i.category || 'General'))).sort();
  const searchLower = search.trim().toLowerCase();
  const filtered = items
    .filter((i) => {
      const st = statusOf(i);
      if (activeTab === 'live') return st === 'live';
      if (activeTab === 'upcoming') return st === 'upcoming';
      return st === 'completed';
    })
    .filter((i) => (categoryFilter === 'all' ? true : (i.category || 'General').toLowerCase() === categoryFilter.toLowerCase()))
    .filter((i) => {
      if (!searchLower) return true;
      const hay = `${i.title || ''} ${i.description || ''} ${i.organizer?.name || ''} ${i.organizer?.email || ''}`.toLowerCase();
      return hay.includes(searchLower);
    });

  // Impact stats (derived)
  const totalFundraisers = items.length;
  const totalRaised = items.reduce((sum, i) => sum + (i.currentAmount || 0), 0);
  const completedCount = items.filter((i) => statusOf(i) === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e9f3ef] to-white">
      {/* Hero (relocated to top, styled like Campaigns) */}
      <div className="py-14 md:py-20 px-4 md:px-8 bg-gradient-to-r from-[#05496c] to-[#0b3e5e] text-white">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-6 text-center">
          <div className="flex flex-col justify-center items-center">
            <h2 className="text-3xl md:text-4xl font-bold">Crowdfunding</h2>
            <p className="text-white/90 mt-2 max-w-2xl">
              Support community-led causes. Discover impactful fundraisers and help them reach their goals.
            </p>
          </div>
          <div className="w-full max-w-xl bg-white/15 backdrop-blur-sm rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalFundraisers}</div>
              <div className="text-xs opacity-90">Fundraisers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">₹{totalRaised.toLocaleString('en-IN')}</div>
              <div className="text-xs opacity-90">Raised</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{completedCount}</div>
              <div className="text-xs opacity-90">Completed</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/crowdfunding/apply')}
            className="w-full sm:w-auto px-5 py-3 rounded-lg bg-white text-[#0b3e5e] font-semibold hover:bg-[#dfe5e3] transition shadow"
          >
            Start a Crowdfunding
          </button>
        </div>
      </div>

      {/* Explainer: What is Crowdfunding? */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mb-0 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-2xl bg-white border border-[#dfe5e3] p-5 shadow-sm">
          <h3 className="text-xl font-extrabold text-[#0b3e5e] mb-2 text-center lg:text-left">What is Crowdfunding?</h3>
          <p className="text-[#52707f] text-sm leading-relaxed mb-4 text-center lg:text-left">
            In simple terms, crowdfunding lets individuals raise money for a specific need by sharing their story
            with friends, family, and the community. Each contribution directly helps that particular person or cause.
          </p>
          <div className="aspect-video w-full overflow-hidden rounded-xl ring-1 ring-[#e3e9e7]">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/4uu-mKoFR6w?rel=0&modestbranding=1"
              title="What is Crowdfunding?"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-[#dfe5e3] p-5 shadow-sm flex flex-col ">
          <h3 className="text-xl font-extrabold text-[#0b3e5e] mb-3 text-center lg:text-left">How is it different from Campaigns?</h3>
          <ul className="space-y-3 text-sm text-[#374b57]">
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-block w-2 h-2 rounded-full bg-[#05496c]" />
              <div>
                <span className="font-semibold text-[#0b3e5e]">Crowdfunding</span> is started by individuals or groups for a
                specific need (e.g., medical, education, emergencies). Funds go directly to that case.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-block w-2 h-2 rounded-full bg-[#05496c]" />
              <div>
                <span className="font-semibold text-[#0b3e5e]">Campaigns</span> are NGO-led programs with a broader impact
                (e.g., monthly food drive, school kits). Donations support the overall program, not just one person.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-block w-2 h-2 rounded-full bg-[#05496c]" />
              <div>
                Crowdfunding is often <span className="font-semibold">time-bound and shareable</span> across social media; campaigns can be
                <span className="font-semibold">ongoing</span> and funded throughout the year.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-block w-2 h-2 rounded-full bg-[#05496c]" />
              <div>
                Choose crowdfunding to help a <span className="font-semibold">specific person or story</span>. Choose campaigns to support
                a <span className="font-semibold">long-term program</span> managed by HopeNest.
              </div>
            </li>
          </ul>

          {/* CTAs */}
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/camp')}
              className="flex-1 px-4 py-2 rounded-lg border border-[#dfe5e3] text-[#0b3e5e] hover:bg-[#f5faf8] transition"
            >
              View NGO Campaigns
            </button>
            <button
              onClick={() => navigate('/crowdfunding/apply')}
              className="flex-1 px-4 py-2 rounded-lg bg-[#05496c] text-white hover:bg-[#0b3e5e] transition"
            >
              Start a Crowdfunding
            </button>
          </div>

          {/* Quick FAQ */}
          <div className="mt-4 border-t border-[#e8eeec] pt-3">
            <details className="group">
              <summary className="cursor-pointer text-sm font-semibold text-[#0b3e5e] flex items-center justify-between">
                Common questions
                <span className="ml-2 text-[#7a98a7] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-2 space-y-2 text-sm text-[#374b57]">
                <p><span className="font-semibold">Is my donation tax-deductible?</span> Yes, for NGO campaigns as per local regulations; personal crowdfunding may vary.</p>
                <p><span className="font-semibold">Who receives the funds?</span> Crowdfunding goes to the individual/organizer; campaign funds go to HopeNest for program use.</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Navigation: Status Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-2">
          <button
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'live'
                ? 'bg-[#05496c] text-white shadow-lg'
                : 'bg-white text-[#0b3e5e] hover:bg-[#dfe5e3] border border-[#dfe5e3]'
            }`}
            onClick={() => setActiveTab('live')}
          >
            Live Fundraisers
          </button>
          <button
            className={`px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'upcoming'
                ? 'bg-[#05496c] text-white shadow-lg'
                : 'bg-white text-[#0b3e5e] hover:bg-[#dfe5e3] border border-[#dfe5e3]'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
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
      </div>

      {/* Controls: Category Filter and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[{ key: 'all', label: 'All' }, ...categories.map((c) => ({ key: c, label: c }))].map((s) => (
            <button
              key={s.key}
              onClick={() => setCategoryFilter(s.key)}
              className={`px-3 py-1.5 text-sm rounded-full border transition ${
                categoryFilter.toLowerCase() === s.key.toLowerCase()
                  ? 'bg-[#05496c] text-white border-[#05496c] shadow'
                  : 'bg-white text-[#0b3e5e] border-[#dfe5e3] hover:bg-[#f5faf8]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="w-full sm:max-w-xs relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a98a7]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description, or organizer..."
            className="w-full border border-[#dfe5e3] bg-white rounded-full pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7aa7bd] focus:border-transparent"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-[#dfe5e3]">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-[#0b3e5e] mb-2">No fundraisers found</h3>
            <p className="text-[#0b3e5e] max-w-md mx-auto">
              {search || categoryFilter !== 'all'
                ? 'No fundraisers match your search or category.'
                : activeTab === 'live'
                ? "We currently don't have any active fundraisers. Check back soon!"
                : activeTab === 'upcoming'
                ? 'Upcoming fundraisers will appear here. Stay tuned!'
                : "We'll share completed fundraisers here once they're finished."}
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((it) => {
            const progress = it.targetAmount ? Math.min(100, Math.round(((it.currentAmount || 0) / it.targetAmount) * 100)) : 0;
            const st = statusOf(it);
            const isGoalMet = (it.currentAmount || 0) >= (it.targetAmount || 0);
            return (
              <div 
                key={it._id} 
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-[#dfe5e3] hover:-translate-y-0.5"
              >
                <div className="relative">
                  <img 
                    src={it.imageUrl || '/default-campaign.jpg'} 
                    alt={it.title}
                    className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isGoalMet && (
                    <div className="absolute top-0 left-0 w-full bg-[#05496c] text-white text-center py-2 font-semibold tracking-wide">
                      Goal Achieved!
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold shadow border border-[#dfe5e3]">
                    {st === 'live' ? (
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-[#05496c] rounded-full mr-2"></span>
                        Live
                      </div>
                    ) : st === 'upcoming' ? (
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
                  {st === 'live' && (
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-xs font-medium shadow border border-[#dfe5e3]">
                      {daysRemaining(it.endDate)} days left
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-[#0b3e5e] group-hover:text-[#073149] transition-colors">{it.title}</h3>
                    <span className="bg-[#e9f3ef] text-[#05496c] text-xs font-semibold px-2.5 py-0.5 rounded">
                      {it.category || 'General'}
                    </span>
                  </div>
                  {it.organizer?.name && (
                    <div className="text-xs text-[#52707f] mb-3">by {it.organizer.name}</div>
                  )}

                  {!!(it.description || '').length && (
                    <p className="text-sm text-gray-600 mb-4">
                      {(it.description || '').slice(0, 120)}{(it.description || '').length > 120 ? '…' : ''}
                    </p>
                  )}

                  {st === 'live' && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-[#05496c]">Raised: ₹{(it.currentAmount || 0).toLocaleString('en-IN')}</span>
                        <span className="text-[#05496c]">Goal: ₹{(it.targetAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-[#e7eeec] rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#05496c] to-[#0b3e5e] h-2.5 rounded-full transition-all" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-[#0b3e5e]">
                        <span>{progress}% funded</span>
                        <span>{daysRemaining(it.endDate)} days left</span>
                      </div>
                    </div>
                  )}

                  {st === 'upcoming' && (
                    <div className="bg-[#e9f3ef] p-4 rounded-lg mb-6 border border-[#dfe5e3]">
                      <div className="flex justify-between">
                        <div>
                          <div className="text-sm text-[#0b3e5e]">Starts in</div>
                          <div className="text-xl font-bold text-[#05496c]">
                            {daysUntilStart(it.startDate)} days
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-[#0b3e5e]">Target</div>
                          <div className="text-xl font-bold text-[#05496c]">
                            ₹{(it.targetAmount || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {st === 'completed' && (
                    <div className="bg-[#e9f3ef] p-4 rounded-lg mb-6 border border-[#dfe5e3]">
                      <div className="flex justify-between">
                        <div>
                          <div className="text-sm text-[#0b3e5e]">Results</div>
                          <div className="text-xl font-bold text-[#05496c]">
                            ₹{(it.currentAmount || 0).toLocaleString('en-IN')} raised
                          </div>
                          <div className="text-sm">
                            {isGoalMet ? (
                              <span className="text-[#05496c]">Goal achieved!</span>
                            ) : (
                              <span className="text-[#0b3e5e]">
                                {progress}% of ₹{(it.targetAmount || 0).toLocaleString('en-IN')} goal
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-[#0b3e5e]">Completed</div>
                          <div className="text-xl font-bold text-[#05496c]">
                            {it.endDate ? new Date(it.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => goDonate(it._id)}
                      className="flex-1 bg-[#05496c] hover:bg-[#0b3e5e] text-white font-medium py-2.5 px-4 rounded-lg transition text-center"
                    >
                      {st === 'live' ? 'Donate Now' : st === 'upcoming' ? 'Learn More' : 'View Results'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Crowdfunding;
