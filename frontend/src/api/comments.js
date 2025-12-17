import apiClient from './client';

export const getComments = (articleId, params) => {
  return apiClient.get(`/articles/${articleId}/comments`, { params });
};

export const createComment = (articleId, data) => {
  return apiClient.post(`/articles/${articleId}/comments`, data);
};

export const updateComment = (id, data) => {
  return apiClient.put(`/comments/${id}`, data);
};

export const deleteComment = (id) => {
  return apiClient.delete(`/comments/${id}`);
};

export const toggleLike = (id) => {
  return apiClient.put(`/comments/${id}/like`);
};

