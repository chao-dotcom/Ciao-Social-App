import apiClient, { APIResponse } from './client';
import { User } from './auth';

export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  location?: string;
  headline?: string;
  phoneNumber?: string;
  zipcode?: string;
  dateOfBirth?: string;
}

export interface DeleteAccountData {
  password?: string;
  confirmation?: string;
}

export const searchUsers = (query: string): Promise<APIResponse<{ users: User[] }>> => {
  return apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
};

export const getProfile = (username: string): Promise<APIResponse<{ user: User }>> => {
  return apiClient.get(`/users/${username}`);
};

export const updateProfile = (
  username: string,
  data: UpdateProfileData
): Promise<APIResponse<{ user: User }>> => {
  return apiClient.put(`/users/${username}`, data);
};

export const updateAvatar = (formData: FormData): Promise<APIResponse<{ user: User }>> => {
  return apiClient.put('/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getFollowers = (username: string): Promise<APIResponse<{ followers: User[] }>> => {
  return apiClient.get(`/users/${username}/followers`);
};

export const getFollowing = (username: string): Promise<APIResponse<{ following: User[] }>> => {
  return apiClient.get(`/users/${username}/following`);
};

export const followUser = (username: string): Promise<APIResponse> => {
  return apiClient.put(`/following/${username}`);
};

export const unfollowUser = (username: string): Promise<APIResponse> => {
  return apiClient.delete(`/following/${username}`);
};

export const deleteAccount = (
  username: string,
  data: DeleteAccountData
): Promise<APIResponse> => {
  return apiClient.delete(`/users/${username}`, { data });
};
