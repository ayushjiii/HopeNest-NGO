import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Add a flag to prevent multiple simultaneous auth checks
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  useEffect(() => {
    if (!isCheckingAuth) {
      checkAuthStatus();
    }
  }, []); // Remove isCheckingAuth from dependencies to prevent infinite loop

  const checkAuthStatus = async () => {
    // Prevent multiple simultaneous auth checks
    if (isCheckingAuth) {
      return;
    }
    
    setIsCheckingAuth(true);
    try {
      const token = localStorage.getItem('token');
      const userName = localStorage.getItem('userName');
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('Checking auth status with token:', token.substring(0, 20) + '...');

      // For OAuth users, try to get user info from token first (faster)
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('Token payload:', payload);
          
          // Check if token is expired
          if (payload.exp && payload.exp < Date.now() / 1000) {
            console.log('Token expired, clearing storage');
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
            setUser(null);
            setLoading(false);
            return;
          }
          
          setUser({ 
            userId: payload.userId,
            name: payload.name || userName,
            email: payload.email,
            role: payload.role || 'user'
          });
          setLoading(false);
          return;
        } catch (e) {
          console.log('Could not parse JWT, trying API call:', e.message);
        }
      }

      // Fallback to API call (for non-OAuth users or token validation)
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser({ 
            userId: data.userId,
            name: data.name,
            email: data.email,
            role: data.role || 'user'
          });
        } else {
          // If API fails but we have valid token structure, use token data
          if (token && userName) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              setUser({ 
                userId: payload.userId,
                name: payload.name || userName,
                email: payload.email,
                role: 'user'
              });
            } catch (e) {
              console.error('Failed to parse token as fallback:', e);
              localStorage.removeItem('token');
              localStorage.removeItem('userName');
              setUser(null);
            }
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
            setUser(null);
          }
        }
      } catch (networkError) {
        console.log('Network error, using token fallback:', networkError.message);
        // If network fails, try to use token data as fallback
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({ 
              userId: payload.userId,
              name: payload.name || userName,
              email: payload.email,
              role: 'user'
            });
          } catch (e) {
            console.error('Token fallback failed:', e);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser({ 
          userId: data.userId, 
          name: data.name,
          email: data.email 
        });
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Login failed' };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser({ 
          userId: data.userId, 
          name: data.name,
          email: data.email 
        });
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Signup failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setUser(null);
  };

  const updateUser = (newData) => {
    if (newData) {
      setUser(prev => {
        const updatedUser = prev ? { ...prev, ...newData } : { ...newData };
        return updatedUser;
      });
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        signup, 
        logout, 
        updateUser,
        checkAuthStatus  // Expose this function for manual auth checks
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}