import apiClient from './client';

export const register = (userData) => {
  return apiClient.post('/auth/register', userData);
};

export const login = (credentials) => {
  return apiClient.post('/auth/login', credentials);
};

export const logout = () => {
  return apiClient.get('/auth/logout');
};

export const getCurrentUser = () => {
  return apiClient.get('/auth/me');
};

export const linkOAuthAccount = (providerData) => {
  return apiClient.post('/auth/link', providerData);
};

export const unlinkOAuthAccount = (provider) => {
  return apiClient.delete(`/auth/unlink/${provider}`);
};

