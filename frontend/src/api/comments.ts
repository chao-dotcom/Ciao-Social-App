import apiClient, { APIResponse } from './client';
import { User } from './auth';
import { PaginationParams, PaginationInfo } from './articles';

export interface Comment {
  _id: string;
  articleId: string;
  text: string;
  author: string;
  authorDetails?: User;
  likes: {
    username: string;
    timestamp: string;
  }[];
  likesCount: number;
  parentCommentId?: string;
  editedAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: PaginationInfo;
}

export interface CreateCommentData {
  text: string;
  parentCommentId?: string;
}

export const getComments = (
  articleId: string,
  params?: PaginationParams
): Promise<APIResponse<CommentsResponse>> => {
  return apiClient.get(`/articles/${articleId}/comments`, { params });
};

export const createComment = (
  articleId: string,
  data: CreateCommentData
): Promise<APIResponse<{ comment: Comment }>> => {
  return apiClient.post(`/articles/${articleId}/comments`, data);
};

export const updateComment = (
  id: string,
  data: Partial<Comment>
): Promise<APIResponse<{ comment: Comment }>> => {
  return apiClient.put(`/comments/${id}`, data);
};

export const deleteComment = (id: string): Promise<APIResponse> => {
  return apiClient.delete(`/comments/${id}`);
};

export const toggleLike = (id: string): Promise<APIResponse<{ comment: Comment }>> => {
  return apiClient.put(`/comments/${id}/like`);
};
