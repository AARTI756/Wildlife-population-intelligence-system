import React, { createContext, useState, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await api.get('/api/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Session validation failed:', error);
          // Interceptor handles logout, but clean up state just in case
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Login handler
  const login = async (username, password) => {
    const loginUrl = `${api.defaults.baseURL || ''}/api/auth/login`;
    console.log('==================== AUTHENTICATION REQUEST ====================');
    console.log('API URL:', loginUrl);
    console.log('Request Payload:', { username, password: '[REDACTED]' });
    
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const response = await api.post('/api/auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('Response Status:', response.status);
      console.log('Response Body:', response.data);
      console.log('================================================================');

      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return userData;
    } catch (error) {
      const status = error.response?.status || 'Network Error';
      const detail = error.response?.data || error.message;
      console.error('Response Status:', status);
      console.error('Response Error Body:', detail);
      console.error('Error Message:', error.message);
      console.log('================================================================');
      throw error;
    }
  };

  // Google Login handler
  const googleLogin = async (googleToken, role = null) => {
    const response = await api.post('/api/auth/google-login', {
      token: googleToken,
      role: role
    });

    if (response.data.registration_incomplete) {
      return response.data;
    }

    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  // Register handler
  const register = async (username, email, password, roles = ['Wildlife Researcher']) => {
    const response = await api.post('/api/auth/register', {
      username,
      email,
      password,
      roles,
    });
    return response.data;
  };

  // Logout handler
  const logout = () => {
    try {
      googleLogout();
    } catch (e) {
      console.warn("Failed to clear Google session:", e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Check if user has any of the required roles
  const hasRole = (requiredRoles) => {
    if (!user || !user.roles) return false;
    const userRoles = user.roles.map((r) => r.name);
    return requiredRoles.some((role) => userRoles.includes(role));
  };

  // Update local user state
  const updateUser = (updatedData) => {
    localStorage.setItem('user', JSON.stringify(updatedData));
    setUser(updatedData);
  };

  const value = {
    user,
    token,
    loading,
    login,
    googleLogin,
    register,
    logout,
    hasRole,
    updateUser,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
