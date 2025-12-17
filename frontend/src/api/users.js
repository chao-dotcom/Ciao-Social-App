import apiClient from './client';

export const searchUsers = (query) => {
  return apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
};

export const getProfile = (username) => {
  return apiClient.get(`/users/${username}`);
};

export const updateProfile = (username, data) => {
  return apiClient.put(`/users/${username}`, data);
};

export const updateAvatar = (formData) => {
  return apiClient.put('/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getFollowers = (username) => {
  return apiClient.get(`/users/${username}/followers`);
};

export const getFollowing = (username) => {
  return apiClient.get(`/users/${username}/following`);
};

export const followUser = (username) => {
  return apiClient.put(`/following/${username}`);
};

export const unfollowUser = (username) => {
  return apiClient.delete(`/following/${username}`);
};

export const deleteAccount = (username, data) => {
  return apiClient.delete(`/users/${username}`, { data });
};

