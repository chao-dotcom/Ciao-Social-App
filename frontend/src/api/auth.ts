import apiClient, { APIResponse } from './client';

export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  headline: string;
  bio: string;
  location?: string;
  following: string[];
  followers: string[];
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface OAuthProviderData {
  provider: string;
  providerId: string;
  email: string;
}

export const register = (userData: RegisterData): Promise<APIResponse<AuthResponse>> => {
  return apiClient.post('/auth/register', userData);
};

export const login = (credentials: LoginCredentials): Promise<APIResponse<AuthResponse>> => {
  return apiClient.post('/auth/login', credentials);
};

export const logout = (): Promise<APIResponse> => {
  return apiClient.get('/auth/logout');
};

export const getCurrentUser = (): Promise<APIResponse<{ user: User }>> => {
  return apiClient.get('/auth/me');
};

export const linkOAuthAccount = (providerData: OAuthProviderData): Promise<APIResponse> => {
  return apiClient.post('/auth/link', providerData);
};

export const unlinkOAuthAccount = (provider: string): Promise<APIResponse> => {
  return apiClient.delete(`/auth/unlink/${provider}`);
};
