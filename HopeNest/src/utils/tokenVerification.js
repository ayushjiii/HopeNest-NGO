/**
 * Token Verification Utilities
 * This file contains utilities to verify JWT token handling in the frontend
 */

// Utility to decode JWT token without verification (for display purposes only)
export const decodeJWT = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Invalid token format' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid JWT structure' };
    }

    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    return {
      valid: true,
      header,
      payload,
      signature: parts[2]
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Check if token is expired
export const isTokenExpired = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded.valid) {
    return true;
  }

  if (!decoded.payload.exp) {
    return false; // No expiration set
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.payload.exp < currentTime;
};

// Validate token structure and content
export const validateToken = (token) => {
  const decoded = decodeJWT(token);
  
  if (!decoded.valid) {
    return { valid: false, errors: [decoded.error] };
  }

  const errors = [];
  const warnings = [];

  // Check required fields
  if (!decoded.payload.userId) {
    errors.push('Missing userId in token payload');
  }
  
  if (!decoded.payload.email) {
    warnings.push('Missing email in token payload');
  }
  
  if (!decoded.payload.name) {
    warnings.push('Missing name in token payload');
  }

  // Check token expiration
  if (isTokenExpired(token)) {
    errors.push('Token is expired');
  }

  // Check issued at time
  if (decoded.payload.iat) {
    const issuedAt = new Date(decoded.payload.iat * 1000);
    const now = new Date();
    if (issuedAt > now) {
      errors.push('Token issued in the future');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    payload: decoded.payload,
    header: decoded.header
  };
};

// Check localStorage token status
export const checkLocalStorageToken = () => {
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('userName');
  
  if (!token) {
    return {
      status: 'no_token',
      message: 'No token found in localStorage'
    };
  }

  const validation = validateToken(token);
  
  return {
    status: validation.valid ? 'valid' : 'invalid',
    token,
    userName,
    validation,
    decoded: validation.payload
  };
};

// Test API endpoint with current token
export const testAPIEndpoint = async (endpoint = '/api/auth/me') => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return {
      success: false,
      error: 'No token available'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: `Non-JSON response: ${await response.text()}` };
    }

    return {
      success: response.ok,
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout (5 seconds)'
      };
    }
    return {
      success: false,
      error: error.message
    };
  }
};

// Comprehensive token verification report
export const generateTokenReport = async () => {
  const localStorageStatus = checkLocalStorageToken();
  const apiTest = await testAPIEndpoint();
  
  const report = {
    timestamp: new Date().toISOString(),
    localStorage: localStorageStatus,
    apiEndpoint: apiTest,
    recommendations: []
  };

  // Generate recommendations
  if (localStorageStatus.status === 'no_token') {
    report.recommendations.push('User needs to log in to get a token');
  } else if (localStorageStatus.status === 'invalid') {
    report.recommendations.push('Token is invalid, user should re-authenticate');
    if (localStorageStatus.validation.errors.includes('Token is expired')) {
      report.recommendations.push('Token has expired, implement token refresh or re-login');
    }
  }

  if (!apiTest.success) {
    if (apiTest.status === 401 || apiTest.status === 403) {
      report.recommendations.push('Authentication failed - token may be invalid or expired');
    } else if (apiTest.error.includes('timeout')) {
      report.recommendations.push('API request timed out - check network connectivity');
    } else {
      report.recommendations.push('API endpoint is not accepting the token - check backend authentication');
    }
  }

  if (localStorageStatus.validation?.warnings?.length > 0) {
    report.recommendations.push('Consider adding missing fields to token payload');
  }

  return report;
};

// OAuth callback verification
export const verifyOAuthCallback = (searchParams) => {
  const token = searchParams.get('token');
  const name = searchParams.get('name');
  const error = searchParams.get('error');

  if (error) {
    return {
      status: 'error',
      error,
      message: 'OAuth authentication failed'
    };
  }

  if (!token || !name) {
    return {
      status: 'incomplete',
      message: 'Missing token or name in OAuth callback'
    };
  }

  const validation = validateToken(token);
  
  return {
    status: validation.valid ? 'success' : 'invalid_token',
    token,
    name: decodeURIComponent(name),
    validation
  };
};

// Token refresh check
export const shouldRefreshToken = (token) => {
  const decoded = decodeJWT(token);
  
  if (!decoded.valid || !decoded.payload.exp) {
    return false;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = decoded.payload.exp - currentTime;
  
  // Refresh if token expires in less than 5 minutes
  return timeUntilExpiry < 300;
};