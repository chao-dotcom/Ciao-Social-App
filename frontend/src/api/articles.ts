import apiClient, { APIResponse } from './client';
import { User } from './auth';

export interface Article {
  _id: string;
  text: string;
  images: {
    url: string;
    publicId?: string;
    width?: number;
    height?: number;
    format?: string;
  }[];
  author: string;
  authorDetails?: User;
  likes: {
    username: string;
    timestamp: string;
  }[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  hashtags: string[];
  mentions: string[];
  visibility: 'public' | 'followers' | 'private';
  isDeleted: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ArticlesResponse {
  articles: Article[];
  pagination: PaginationInfo;
}

export const getFeed = (params?: PaginationParams): Promise<APIResponse<ArticlesResponse>> => {
  return apiClient.get('/articles', { params });
};

export const getArticle = (id: string): Promise<APIResponse<{ article: Article }>> => {
  return apiClient.get(`/articles/${id}`);
};

export const getArticlesByAuthor = (
  username: string,
  params?: PaginationParams
): Promise<APIResponse<ArticlesResponse>> => {
  return apiClient.get(`/articles/user/${username}`, { params });
};

export const createArticle = (formData: FormData): Promise<APIResponse<{ article: Article }>> => {
  return apiClient.post('/article', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const updateArticle = (id: string, data: Partial<Article>): Promise<APIResponse<{ article: Article }>> => {
  return apiClient.put(`/articles/${id}`, data);
};

export const deleteArticle = (id: string): Promise<APIResponse> => {
  return apiClient.delete(`/articles/${id}`);
};

export const toggleLike = (id: string): Promise<APIResponse<{ article: Article }>> => {
  return apiClient.put(`/articles/${id}/like`);
};
