import React, { useEffect, useState } from 'react';
import {
  API_HOST,
  fetchAdminCrowdfundings,
  createCrowdfunding,
  updateCrowdfunding,
  deleteCrowdfunding,
  approveCrowdfunding,
  rejectCrowdfunding,
  resendCrowdfundingVerification
} from '../services/api';

function CrowdfundingAdminPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('requests'); // requests | manage

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetAmount: '',
    startDate: '',
    endDate: '',
    category: 'General',
    imageUrl: ''
  });

  // UI state
  const [filterStatus, setFilterStatus] = useState('all'); // all | pending | approved | rejected
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_desc'); // created_desc | created_asc | target_desc | raised_desc | status
  const [refreshing, setRefreshing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resending, setResending] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminCrowdfundings();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const onEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      targetAmount: (item.targetAmount ?? '').toString(),
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      category: item.category || 'General',
      imageUrl: item.imageUrl || ''
    });
    setShowForm(true);
  };

  const onDelete = async (id) => {
    // Deprecated direct delete; use confirmation modal instead
    setDeleteTarget(items.find((x) => x._id === id) || null);
    setShowDeleteModal(true);
  };

  const onApprove = async (id) => {
    try {
      setError(null);
      await approveCrowdfunding(id);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to approve');
    }
  };

  const startReject = (item) => {
    setRejectTarget(item);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    try {
      setError(null);
      await rejectCrowdfunding(rejectTarget._id, rejectReason || 'Rejected');
      setShowRejectModal(false);
      setRejectTarget(null);
      setRejectReason('');
      await load();
    } catch (err) {
      setError(err.message || 'Failed to reject');
    }
  };

  const onResendVerification = async (id) => {
    try {
      setError(null);
      setResending((prev) => ({ ...prev, [id]: true }));
      await resendCrowdfundingVerification(id);
    } catch (err) {
      setError(err.message || 'Failed to resend verification');
    } finally {
      setResending((prev) => ({ ...prev, [id]: false }));
    }
  };

  const startDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setError(null);
      await deleteCrowdfunding(deleteTarget._id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const payload = {
        ...form,
        targetAmount: Number(form.targetAmount)
      };
      if (editingItem) {
        await updateCrowdfunding(editingItem._id, payload);
      } else {
        await createCrowdfunding(payload);
      }
      setShowForm(false);
      setEditingItem(null);
      setForm({ title: '', description: '', targetAmount: '', startDate: '', endDate: '', category: 'General', imageUrl: '' });
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-36 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-4 sm:p-6 animate-pulse">
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-4" />
              <div className="flex gap-2 mb-4">
                <div className="h-5 w-16 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-200 rounded" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-5/6 bg-gray-200 rounded" />
              </div>
              <div className="h-2 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Derived UI collections
  const isCompleted = (i) => {
    if (!i?.endDate) return false;
    try {
      return new Date(i.endDate) < new Date();
    } catch {
      return false;
    }
  };
  const counts = {
    all: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    approved: items.filter((i) => i.status === 'approved').length,
    rejected: items.filter((i) => i.status === 'rejected').length,
    completed: items.filter((i) => i.status === 'approved' && isCompleted(i)).length,
  };
  const requestsVerified = items.filter((i) => i.status === 'pending' && i.emailVerified);
  const requestsAwaiting = items.filter((i) => i.status === 'pending' && !i.emailVerified);
  const searchLower = search.trim().toLowerCase();
  const filtered = items
    .filter((i) => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'completed') return i.status === 'approved' && isCompleted(i);
      return i.status === filterStatus;
    })
    .filter((i) => {
      if (!searchLower) return true;
      const hay = `${i.title || ''} ${i.organizer?.name || ''} ${i.organizer?.email || ''}`.toLowerCase();
      return hay.includes(searchLower);
    })
    .slice();
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'created_asc':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'target_desc':
        return (b.targetAmount || 0) - (a.targetAmount || 0);
      case 'raised_desc':
        return (b.currentAmount || 0) - (a.currentAmount || 0);
      case 'status':
        return (a.status || '').localeCompare(b.status || '');
      case 'created_desc':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Crowdfunding Admin</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
          <button
              type="button"
              onClick={() => setViewMode('manage')}
              className={`px-3 py-2 text-sm ${viewMode === 'manage' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Manage All
            </button>
            <button
              type="button"
              onClick={() => setViewMode('requests')}
              className={`px-3 py-2 text-sm ${viewMode === 'requests' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Requests
            </button>
          </div>
          {viewMode === 'manage' && (
            <button
              onClick={() => { setShowForm(true); setEditingItem(null); setForm({ title: '', description: '', targetAmount: '', startDate: '', endDate: '', category: 'General', imageUrl: '' }); }}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 w-full sm:w-auto shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
            >
              Add Crowdfunding
            </button>
          )}
        </div>
      </div>

      {/* Requests vs Manage */}
      {viewMode === 'manage' ? (
        <>
          {/* Controls: Filters, Search, Sort, Refresh */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all', label: `All (${counts.all})` },
                { key: 'pending', label: `Pending (${counts.pending})` },
                { key: 'approved', label: `Approved (${counts.approved})` },
                { key: 'completed', label: `Completed (${counts.completed || 0})` },
                { key: 'rejected', label: `Rejected (${counts.rejected})` },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setFilterStatus(s.key)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    filterStatus === s.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or organizer..."
                className="w-full sm:flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="created_desc">Newest first</option>
                  <option value="created_asc">Oldest first</option>
                  <option value="target_desc">Target amount (high → low)</option>
                  <option value="raised_desc">Raised amount (high → low)</option>
                  <option value="status">Status (A → Z)</option>
                </select>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No crowdfunding campaigns found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filtered.map((it) => (
                <div key={it._id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{it.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded">
                          {it.category || 'General'}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                          it.status === 'approved' ? 'bg-green-100 text-green-700' : it.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {it.status || 'pending'}
                        </span>
                      </div>
                    </div>
                    {(it.organizer?.name || it.organizer?.email) && (
                      <div className="text-xs text-gray-500 mb-3">By {it.organizer?.name || 'Unknown'}{it.organizer?.email ? ` • ${it.organizer.email}` : ''}</div>
                    )}
                    <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">{it.description}</p>
                    <div className="space-y-2 mb-3 sm:mb-4">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">Target:</span>
                        <span className="font-medium">₹{(it.targetAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">Raised:</span>
                        <span className="font-medium">₹{(it.currentAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-900"
                          style={{ width: `${Math.min(100, Math.round(((it.currentAmount || 0) / (it.targetAmount || 1)) * 100))}%` }}
                        />
                      </div>
                      <div className="text-right text-[11px] text-gray-500">
                        {Math.min(100, Math.round(((it.currentAmount || 0) / (it.targetAmount || 1)) * 100))}% funded
                      </div>
                      {Array.isArray(it.documents) && it.documents.length > 0 && (
                        <div className="text-xs">
                          <div className="text-gray-500 mb-1">Documents:</div>
                          <ul className="list-disc list-inside space-y-0.5">
                            {it.documents.map((doc, idx) => (
                              <li key={idx}>
                                <a href={`${API_HOST}${doc}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View document {idx + 1}</a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {it.startDate && new Date(it.startDate).toLocaleDateString()} - {it.endDate && new Date(it.endDate).toLocaleDateString()}
                      </div>
                      <div className="relative inline-flex items-center" data-actions-menu>
                        {it.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onApprove(it._id)}
                              disabled={!it.emailVerified}
                              title={it.emailVerified ? 'Approve' : 'Approve enabled after email verification'}
                              className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs sm:text-sm font-medium shadow-sm focus:outline-none focus:ring-2 ${
                                it.emailVerified
                                  ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {it.emailVerified ? 'Approve' : 'Approve (after verification)'}
                            </button>
                            <button
                              type="button"
                              onClick={() => startReject(it)}
                              className="ml-2 inline-flex items-center justify-center rounded-md bg-red-600 text-white px-2 py-1 text-xs sm:text-sm font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(it)}
                          className="ml-2 inline-flex items-center justify-center rounded-md bg-white px-2 py-1 text-xs sm:text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => startDelete(it)}
                          className="ml-2 inline-flex items-center justify-center rounded-md bg-white px-2 py-1 text-xs sm:text-sm font-medium text-red-600 shadow-sm ring-1 ring-gray-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Requests view */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">Pending requests: {counts.pending} • Verified: {requestsVerified.length} • Awaiting verification: {requestsAwaiting.length}</div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified requests (ready for review)</h3>
              {requestsVerified.length === 0 ? (
                <div className="text-center py-6 bg-white rounded-lg border border-gray-200 text-gray-500">No verified requests</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {requestsVerified.map((it) => (
                    <div key={it._id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h4 className="text-base font-semibold text-gray-900 truncate">{it.title}</h4>
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700">Email verified</span>
                        </div>
                        {(it.organizer?.name || it.organizer?.email) && (
                          <div className="text-xs text-gray-500 mb-3">By {it.organizer?.name || 'Unknown'}{it.organizer?.email ? ` • ${it.organizer.email}` : ''}</div>
                        )}
                        <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-3">{it.description}</p>
                        {Array.isArray(it.documents) && it.documents.length > 0 && (
                          <div className="text-xs mb-3">
                            <div className="text-gray-500 mb-1">Documents:</div>
                            <ul className="list-disc list-inside space-y-0.5">
                              {it.documents.map((doc, idx) => (
                                <li key={idx}><a href={`${API_HOST}${doc}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View document {idx + 1}</a></li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => onApprove(it._id)}
                            className="inline-flex items-center justify-center rounded-md bg-green-600 text-white px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => startReject(it)}
                            className="ml-2 inline-flex items-center justify-center rounded-md bg-red-600 text-white px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Awaiting email verification</h3>
              {requestsAwaiting.length === 0 ? (
                <div className="text-center py-6 bg-white rounded-lg border border-gray-200 text-gray-500">No awaiting requests</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {requestsAwaiting.map((it) => (
                    <div key={it._id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h4 className="text-base font-semibold text-gray-900 truncate">{it.title}</h4>
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Email not verified</span>
                        </div>
                        {(it.organizer?.name || it.organizer?.email) && (
                          <div className="text-xs text-gray-500 mb-3">By {it.organizer?.name || 'Unknown'}{it.organizer?.email ? ` • ${it.organizer.email}` : ''}</div>
                        )}
                        <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-3">{it.description}</p>
                        {Array.isArray(it.documents) && it.documents.length > 0 && (
                          <div className="text-xs mb-3">
                            <div className="text-gray-500 mb-1">Documents:</div>
                            <ul className="list-disc list-inside space-y-0.5">
                              {it.documents.map((doc, idx) => (
                                <li key={idx}><a href={`${API_HOST}${doc}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View document {idx + 1}</a></li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center justify-center rounded-md bg-gray-200 text-gray-500 px-3 py-1.5 text-xs sm:text-sm font-medium cursor-not-allowed"
                          >
                            Approve (after email verification)
                          </button>
                          <button
                            type="button"
                            onClick={() => onResendVerification(it._id)}
                            disabled={!!resending[it._id]}
                            title="Resend verification email to the applicant"
                            className="ml-2 inline-flex items-center justify-center rounded-md bg-white text-gray-700 px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-60"
                          >
                            {resending[it._id] ? 'Resending…' : 'Resend verification'}
                          </button>
                          <button
                            type="button"
                            onClick={() => startReject(it)}
                            className="ml-2 inline-flex items-center justify-center rounded-md bg-red-600 text-white px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Edit Crowdfunding' : 'Add New Crowdfunding'}
              </h3>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    value={form.targetAmount}
                    onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="General"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Reject Crowdfunding</h3>
              <p className="text-sm text-gray-600 mb-3">Optionally provide a reason to share with the applicant.</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Reason (optional)"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowRejectModal(false); setRejectTarget(null); setRejectReason(''); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Delete Crowdfunding</h3>
              <p className="text-sm text-gray-600">Are you sure you want to delete “{deleteTarget?.title}”? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrowdfundingAdminPanel;
