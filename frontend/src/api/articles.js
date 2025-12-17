import apiClient from './client';

export const getFeed = (params) => {
  return apiClient.get('/articles', { params });
};

export const getArticle = (id) => {
  return apiClient.get(`/articles/${id}`);
};

export const getArticlesByAuthor = (username, params) => {
  return apiClient.get(`/articles/user/${username}`, { params });
};

export const createArticle = (formData) => {
  return apiClient.post('/article', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const updateArticle = (id, data) => {
  return apiClient.put(`/articles/${id}`, data);
};

export const deleteArticle = (id) => {
  return apiClient.delete(`/articles/${id}`);
};

export const toggleLike = (id) => {
  return apiClient.put(`/articles/${id}/like`);
};

