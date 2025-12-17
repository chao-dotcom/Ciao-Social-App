import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authAPI from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const checkAuth = useCallback(async () => {
    // Don't check auth if we already know we're not authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      // If auth check fails, clear the invalid token
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    setUser(response.data.user);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response;
  };
  
  const register = async (userData) => {
    const response = await authAPI.register(userData);
    setUser(response.data.user);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response;
  };
  
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    localStorage.removeItem('authToken');
  };
  
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    refreshUser: checkAuth
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

