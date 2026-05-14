import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  API_HOST,
  applyCrowdfunding,
  fetchMyCrowdfundingApplications,
  resendCrowdfundingVerification
} from '../services/api';

function CrowdfundingApply() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetAmount: '',
    startDate: '',
    endDate: '',
    category: 'General',
    imageUrl: ''
  });
  const [documents, setDocuments] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [myApps, setMyApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [agree, setAgree] = useState(false);
  const [info, setInfo] = useState(null);
  const [dateError, setDateError] = useState('');
  const [lastAppliedId, setLastAppliedId] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const DRAFT_KEY = 'cf_apply_draft_v1';

  const MAX_FILES = 5;
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingApps(true);
        const data = await fetchMyCrowdfundingApplications();
        setMyApps(Array.isArray(data) ? data : []);
      } catch (err) {
        // non-blocking; ignore
      } finally {
        setLoadingApps(false);
      }
    };
    load();
  }, []);

  const handleResend = async () => {
    setInfo(null);
    if (!lastAppliedId) {
      setInfo('We could not detect your last application. Please use the My Applications section to manage verification.');
      return;
    }
    try {
      setResendLoading(true);
      await resendCrowdfundingVerification(lastAppliedId);
      setInfo('Verification email resent. Please check your inbox and spam folder.');
    } catch (e) {
      setInfo(e.message || 'Unable to resend right now. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  // Load draft from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft && typeof draft === 'object') {
        setForm((prev) => ({
          ...prev,
          ...['title','description','targetAmount','startDate','endDate','category','imageUrl'].reduce((acc, k) => {
            if (draft[k] !== undefined) acc[k] = draft[k];
            return acc;
          }, {})
        }));
        if (typeof draft.agree === 'boolean') setAgree(draft.agree);
      }
    } catch {}
  }, []);

  // Save draft on changes
  useEffect(() => {
    try {
      const payload = JSON.stringify({ ...form, agree });
      localStorage.setItem(DRAFT_KEY, payload);
    } catch {}
  }, [form, agree]);

  // Inline date validation
  useEffect(() => {
    if (form.startDate && form.endDate) {
      const s = new Date(form.startDate).getTime();
      const e = new Date(form.endDate).getTime();
      setDateError(e < s ? 'End date must be on or after the start date.' : '');
    } else {
      setDateError('');
    }
  }, [form.startDate, form.endDate]);

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFiles = (files) => {
    const errs = [];
    const valid = [];
    Array.from(files || []).forEach((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) {
        errs.push(`${f.name}: invalid type`);
        return;
      }
      if (f.size > MAX_SIZE) {
        errs.push(`${f.name}: exceeds 5MB`);
        return;
      }
      valid.push(f);
    });
    return { valid, errs };
  };

  const addFiles = (files) => {
    const { valid, errs } = validateFiles(files);
    let combined = [...documents, ...valid];
    const extraCount = combined.length - MAX_FILES;
    if (extraCount > 0) {
      combined = combined.slice(0, MAX_FILES);
      errs.push(`Only ${MAX_FILES} files allowed. ${extraCount} extra file(s) were ignored.`);
    }
    setFileErrors(errs);
    setDocuments(combined);
  };

  const onFileChange = (e) => {
    addFiles(e.target.files || []);
    if (e.target) e.target.value = '';
  };

  const removeDocument = (idx) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    addFiles(e.dataTransfer?.files || []);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required');
      return;
    }
    const target = Number(form.targetAmount);
    if (!target || target <= 0) {
      setError('Target amount must be a positive number');
      return;
    }

    if (dateError) {
      setError(dateError);
      return;
    }

    if (fileErrors.length) {
      setError('Please fix file selection errors.');
      return;
    }

    if (documents.length === 0) {
      setError('Please upload at least one document (PDF/JPG/PNG).');
      return;
    }

    if (!agree) {
      setError('Please confirm you agree to the terms and provided information is accurate.');
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('targetAmount', String(target));
      if (form.startDate) fd.append('startDate', form.startDate);
      if (form.endDate) fd.append('endDate', form.endDate);
      if (form.category) fd.append('category', form.category);
      if (form.imageUrl) fd.append('imageUrl', form.imageUrl);
      documents.forEach((file) => fd.append('documents', file));

      const resp = await applyCrowdfunding(fd);
      setLastAppliedId(resp?._id || null);
      setSuccess('Your application was submitted and is pending review.');
      setForm({ title: '', description: '', targetAmount: '', startDate: '', endDate: '', category: 'General', imageUrl: '' });
      setDocuments([]);
      localStorage.removeItem(DRAFT_KEY);

      // refresh my applications
      try {
        const data = await fetchMyCrowdfundingApplications();
        setMyApps(Array.isArray(data) ? data : []);
      } catch {}
    } catch (err) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Apply for Crowdfunding</h2>
          <p className="text-gray-600 mt-1">Submit your cause for review. Approved campaigns will be listed publicly.</p>
          <p className="text-xs text-gray-500 mt-1">Tip: Keep your title short and your description clear. Upload at least one supporting document.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          <span>←</span>
          <span>Back</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {info && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-4">
          <p className="text-sm text-blue-800">{info}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 p-4 rounded mb-4">
          <h4 className="text-green-800 font-semibold">Application submitted</h4>
          <p className="text-sm text-green-700 mt-1">We have sent a secure verification link to your registered email. Please open that email and complete verification to proceed.</p>
          <div className="mt-3 bg-white/60 rounded border border-green-100 p-3">
            <div className="text-sm font-medium text-green-900">Next steps to activate your fundraiser</div>
            <ul className="mt-2 list-disc list-inside text-sm text-green-900 space-y-1">
              <li>Open the email from HopeNest and click the verification link.</li>
              <li>Complete identity (KYC) check and <span className="font-semibold">bank account verification</span>.</li>
              <li>Read and accept the fundraiser agreement and consent.</li>
            </ul>
            <div className="mt-2 text-xs text-green-800">
              Note: Admins will not disburse any funds until verification is complete. This prevents fraud or misuse.
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="https://mail.google.com/" target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded bg-green-600 text-white text-xs hover:bg-green-700">Open Gmail</a>
            <a href="https://outlook.live.com/mail/" target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded bg-green-600 text-white text-xs hover:bg-green-700">Open Outlook</a>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className={`px-3 py-1.5 rounded border border-green-300 text-green-800 text-xs ${resendLoading ? 'opacity-70' : 'hover:bg-green-100'}`}
            >
              {resendLoading ? 'Resending…' : 'Resend verification link'}
            </button>
          </div>
          <div className="mt-2 text-xs text-green-800">Didn’t get the email? Check your spam folder or try again later.</div>
        </div>
      )}

      <form onSubmit={onSubmit} encType="multipart/form-data" className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm space-y-6">
        <div className="rounded-lg bg-[#f6faf9] border border-[#e3eeea] p-3 text-sm text-[#0b3e5e]">
          Please fill all required fields carefully. After submitting, you’ll receive an email to <span className="font-semibold">verify your identity and bank details</span> before your fundraiser goes live.
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Help Raj with emergency surgery"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#05496c] focus:border-transparent"
            required
          />
          <p className="mt-1 text-xs text-gray-500">A clear, specific title helps supporters understand the cause.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={6}
            maxLength={1000}
            placeholder="Explain the situation, how funds will be used, and any important timelines."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#05496c] focus:border-transparent"
            required
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Be transparent and concise. Avoid sharing sensitive personal details.</span>
            <span>{form.description.length}/1000</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="number"
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              min={100}
              step={100}
              inputMode="numeric"
              placeholder="e.g., 50000"
              className="w-full border border-gray-300 rounded-lg pl-7 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#05496c] focus:border-transparent"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Set a realistic goal. You can mention a breakdown in the description.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#05496c] focus:border-transparent"
              min={today}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#05496c] focus:border-transparent"
              min={form.startDate || today}
            />
          </div>
        </div>
        {dateError && (
          <p className="text-xs text-red-600 -mt-2">{dateError}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#05496c] focus:border-transparent bg-white"
            >
              <option>General</option>
              <option>Medical</option>
              <option>Education</option>
              <option>Disaster Relief</option>
              <option>Community</option>
              <option>Environment</option>
              <option>Food & Shelter</option>
              <option>Animals</option>
              <option>Other</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Choose the most relevant category for your cause.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#05496c] focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
            {form.imageUrl && (
              <div className="mt-2">
                <img src={form.imageUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-200" onError={(e)=>{e.currentTarget.style.display='none';}} />
                <p className="mt-1 text-xs text-gray-500">Preview generated from the provided URL.</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Documents (PDF/JPG/PNG, max 5, 5MB each)</label>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            role="button"
            tabIndex={0}
            className={`mt-1 rounded-xl border-2 p-6 text-center transition-colors ${isDragging ? 'border-[#0b3e5e] bg-[#f0f7fb]' : 'border-dashed border-gray-300 hover:border-gray-400'}`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="text-2xl">📎</div>
              <div className="text-sm text-gray-800">
                <span className="font-medium text-[#0b3e5e]">Click to upload</span> or drag & drop
              </div>
              <div className="text-xs text-gray-500">PDF, JPG, PNG • up to 5MB each • Max {MAX_FILES} files</div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            id="documents"
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            multiple
            onChange={onFileChange}
            className="hidden"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
            <div>Selected {documents.length}/{MAX_FILES} files</div>
            <div>PDF, JPG, PNG • 5MB each</div>
          </div>
          {documents.length > 0 && (
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {documents.map((f, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-white border border-gray-200 text-[11px] text-gray-600">
                      {f.type === 'application/pdf' ? 'PDF' : 'IMG'}
                    </span>
                    <div className="text-xs min-w-0">
                      <div className="font-medium text-gray-800 truncate max-w-[160px]">{f.name}</div>
                      <div className="text-gray-500">{formatBytes(f.size)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument(idx)}
                    className="text-red-600 hover:text-red-700 text-xs font-medium"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {fileErrors.length > 0 && (
            <div className="mt-2 text-xs text-red-600 space-y-0.5">
              {fileErrors.map((msg, idx) => (
                <div key={idx}>• {msg}</div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="inline-flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
            <span>I confirm the information provided is accurate and I agree to the platform's guidelines.</span>
          </label>
        </div>

        <div className="flex items-center justify-end">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setForm({ title: '', description: '', targetAmount: '', startDate: '', endDate: '', category: 'General', imageUrl: '' });
                setDocuments([]);
                setFileErrors([]);
                setError(null);
                setSuccess(null);
                setAgree(false);
                localStorage.removeItem(DRAFT_KEY);
                setInfo(null);
              }}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 rounded-lg text-white ${submitting ? 'bg-[#0b3e5e] opacity-70' : 'bg-[#0b3e5e] hover:bg-[#05496c]'}`}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-10">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">My Applications</h3>
        {loadingApps ? (
          <div className="text-gray-600 text-sm">Loading...</div>
        ) : myApps.length === 0 ? (
          <div className="text-gray-500 text-sm">You haven't applied yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myApps.map((it) => (
              <div key={it._id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900 line-clamp-1">{it.title}</div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                    it.status === 'approved' ? 'bg-green-100 text-green-700' : it.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {it.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 line-clamp-2">{it.description}</div>
                {it.status === 'pending' && (
                  <div className="mt-1 text-xs text-yellow-700">Verification pending — please check your email for the secure link.</div>
                )}
                {it.rejectionReason && (
                  <div className="mt-1 text-xs text-red-600">Reason: {it.rejectionReason}</div>
                )}
                {Array.isArray(it.documents) && it.documents.length > 0 && (
                  <div className="mt-2 text-xs">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CrowdfundingApply;
