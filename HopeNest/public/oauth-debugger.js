// OAuth Debug Utility - Add this to browser console to debug OAuth flow
// Copy and paste this entire script in browser console on localhost:5173

const OAuthDebugger = {
  checkLocalStorage() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    
    console.log('=== LOCAL STORAGE CHECK ===');
    console.log('Token:', token ? token.substring(0, 50) + '...' : 'MISSING');
    console.log('UserName:', userName || 'MISSING');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token Payload:', payload);
        console.log('Token Expiry:', new Date(payload.exp * 1000));
        console.log('Is Expired:', payload.exp < Date.now() / 1000);
      } catch (e) {
        console.error('Token parsing failed:', e);
      }
    }
    
    return { token, userName };
  },

  async testAPI() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token to test');
      return;
    }

    console.log('=== API TEST ===');
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);
      
      const data = await response.json();
      console.log('Response Data:', data);
      
      return data;
    } catch (error) {
      console.error('API Test Failed:', error);
    }
  },

  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    console.log('Auth cleared from localStorage');
  },

  simulateOAuth(mockToken = 'mock.token.here', mockName = 'Test User') {
    console.log('=== SIMULATING OAUTH ===');
    localStorage.setItem('token', mockToken);
    localStorage.setItem('userName', mockName);
    console.log('Mock OAuth data stored');
    window.location.href = '/dashboard';
  },

  getAuthContext() {
    // This will only work if AuthContext is available globally
    console.log('=== AUTH CONTEXT CHECK ===');
    console.log('Check React DevTools for AuthContext state');
    console.log('Current pathname:', window.location.pathname);
  },

  fullDiagnostic() {
    console.log('🔍 === FULL OAUTH DIAGNOSTIC ===');
    this.checkLocalStorage();
    this.testAPI();
    this.getAuthContext();
    
    console.log('Current URL:', window.location.href);
    console.log('URL Params:', Object.fromEntries(new URLSearchParams(window.location.search)));
    
    // Check if we're on login page with OAuth params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('token')) {
      console.log('🎉 OAuth callback detected!');
      console.log('Token param:', urlParams.get('token')?.substring(0, 20) + '...');
      console.log('Name param:', urlParams.get('name'));
    }
  }
};

// Auto-run diagnostic
OAuthDebugger.fullDiagnostic();

// Make available globally
window.OAuthDebugger = OAuthDebugger;

console.log('🛠️ OAuth Debugger loaded! Available commands:');
console.log('- OAuthDebugger.checkLocalStorage()');
console.log('- OAuthDebugger.testAPI()'); 
console.log('- OAuthDebugger.clearAuth()');
console.log('- OAuthDebugger.fullDiagnostic()');