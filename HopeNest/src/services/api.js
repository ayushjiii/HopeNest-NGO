const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';

export const fetchCampaigns = async () => {
  const response = await fetch(`${API_URL}/campaigns`);
  if (!response.ok) throw new Error('Failed to fetch campaigns');
  return response.json();
};

export const fetchCampaignById = async (id) => {
  const response = await fetch(`${API_URL}/campaigns/${id}`);
  if (!response.ok) throw new Error('Failed to fetch campaign details');
  return response.json();
};

export const fetchMyDonations = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`${API_URL}/donations/my`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error('Failed to fetch your donations');
  const data = await response.json();
  return data.donations || [];
};

export const fetchMyVolunteers = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`${API_URL}/volunteers/my`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error('Failed to fetch your volunteer registrations');
  const data = await response.json();
  return data.volunteers || [];
};

export const createVolunteer = async (payload) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`${API_URL}/volunteers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    let errMsg = 'Failed to register as volunteer';
    try {
      const data = await response.json();
      errMsg = data?.message || errMsg;
    } catch (_) {
      try {
        const msg = await response.text();
        if (msg) errMsg = msg;
      } catch {}
    }
    throw new Error(errMsg);
  }
  return response.json();
};

// Crowdfunding APIs
export const fetchCrowdfundings = async () => {
  const response = await fetch(`${API_URL}/crowdfunding`);
  if (!response.ok) throw new Error('Failed to fetch crowdfunding campaigns');
  return response.json();
};

export const fetchCrowdfundingById = async (id) => {
  const response = await fetch(`${API_URL}/crowdfunding/${id}`);
  if (!response.ok) throw new Error('Failed to fetch crowdfunding campaign');
  return response.json();
};

export const createCrowdfunding = async (payload) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`${API_URL}/crowdfunding`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to create crowdfunding campaign');
  return response.json();
};

export const updateCrowdfunding = async (id, payload) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`${API_URL}/crowdfunding/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to update crowdfunding campaign');
  return response.json();
};

export const deleteCrowdfunding = async (id) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`${API_URL}/crowdfunding/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to delete crowdfunding campaign');
  return response.json();
};

// Admin: list all crowdfunding (any status)
export const fetchAdminCrowdfundings = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`${API_URL}/crowdfunding/all`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch crowdfunding (admin)');
  return response.json();
};

// User: apply for crowdfunding (multipart/form-data)
export const applyCrowdfunding = async (formData) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`${API_URL}/crowdfunding/apply`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (!response.ok) {
    let errMsg = 'Failed to submit application';
    try {
      const data = await response.json();
      errMsg = data?.message || errMsg;
    } catch (_) {
      try {
        const msg = await response.text();
        if (msg) errMsg = msg;
      } catch {}
    }
    throw new Error(errMsg);
  }
  return response.json();
};

// User: my crowdfunding applications
export const fetchMyCrowdfundingApplications = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`${API_URL}/crowdfunding/my`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch your crowdfunding applications');
  return response.json();
};

// Admin: approve crowdfunding
export const approveCrowdfunding = async (id) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`${API_URL}/crowdfunding/${id}/approve`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to approve crowdfunding campaign');
  return response.json();
};

// Admin: reject crowdfunding
export const rejectCrowdfunding = async (id, reason) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`${API_URL}/crowdfunding/${id}/reject`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason })
  });
  if (!response.ok) throw new Error('Failed to reject crowdfunding campaign');
  return response.json();
};

// User: resend verification email for an application
export const resendCrowdfundingVerification = async (id) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`${API_URL}/crowdfunding/${id}/resend-verification`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    let errMsg = 'Failed to resend verification link';
    try {
      const data = await response.json();
      errMsg = data?.message || errMsg;
    } catch (_) {
      try {
        const msg = await response.text();
        if (msg) errMsg = msg;
      } catch {}
    }
    throw new Error(errMsg);
  }
  return response.json();
};