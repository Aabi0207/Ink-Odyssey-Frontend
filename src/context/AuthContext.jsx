import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (token && refreshToken) {
      setAccessToken(token);
      setIsAuthenticated(true);
      // Attempt to fetch user; if unauthorized try refreshing token
      (async () => {
        const ok = await fetchUserDataWithAutoRefresh(token, refreshToken);
        if (!ok) {
          clearAuth();
        }
      })();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      const response = await fetch('https://aabidon.pythonanywhere.com/api/auth/user/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      } else if (response.status === 401) {
        return false;
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessToken = async (refreshToken) => {
    try {
      const resp = await fetch('https://aabidon.pythonanywhere.com/api/auth/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data.access) {
        localStorage.setItem('accessToken', data.access);
        setAccessToken(data.access);
        setIsAuthenticated(true);
        return data.access;
      }
      return null;
    } catch (e) {
      console.error('Failed to refresh access token', e);
      return null;
    }
  };

  const fetchUserDataWithAutoRefresh = async (token, refreshToken) => {
    const ok = await fetchUserData(token);
    if (ok === false && refreshToken) {
      const newAccess = await refreshAccessToken(refreshToken);
      if (newAccess) {
        return await fetchUserData(newAccess);
      }
    }
    return ok;
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('https://aabidon.pythonanywhere.com/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // API returns { user, tokens: { access, refresh } }
        const access = data?.tokens?.access;
        const refresh = data?.tokens?.refresh;
        if (!access || !refresh) {
          return { success: false, error: 'Invalid token response from server' };
        }
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
        setAccessToken(access);
        setIsAuthenticated(true);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        // Call backend logout endpoint
        await fetch('https://aabidon.pythonanywhere.com/api/auth/logout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          // Backend expects 'refresh_token' key for blacklisting
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    accessToken,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
