import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as authAPI from '../api/auth';
import { User, LoginCredentials, RegisterData, APIResponse, AuthResponse } from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<APIResponse<AuthResponse>>;
  register: (userData: RegisterData) => Promise<APIResponse<AuthResponse>>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
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
      setUser(response.data?.user || null);
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
  
  const login = async (credentials: LoginCredentials): Promise<APIResponse<AuthResponse>> => {
    const response = await authAPI.login(credentials);
    if (response.data) {
      setUser(response.data.user);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
    }
    return response;
  };
  
  const register = async (userData: RegisterData): Promise<APIResponse<AuthResponse>> => {
    const response = await authAPI.register(userData);
    if (response.data) {
      setUser(response.data.user);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
    }
    return response;
  };
  
  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    localStorage.removeItem('authToken');
  };
  
  const value: AuthContextType = {
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
