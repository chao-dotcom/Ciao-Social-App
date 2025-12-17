import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import * as articlesAPI from '../../api/articles';
import { Article } from '../../api/articles';
import CommentSection from './CommentSectionClean';

interface ArticleCardProps {
  article: Article;
  onDelete: (id: string) => void;
  onUpdate: (article: Article) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onDelete, onUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>(article.text);
  const [liked, setLiked] = useState<boolean>(
    article.likes?.some(like => like.username === user?.username) || false
  );
  const [likesCount, setLikesCount] = useState<number>(article.likesCount || 0);
  const [showComments, setShowComments] = useState<boolean>(false);
  
  const isOwner = user?.username === article.author;
  
  const handleLike = async (): Promise<void> => {
    try {
      const response = await articlesAPI.toggleLike(article._id);
      setLiked(response.data.liked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      console.error('Failed to like article:', error);
    }
  };
  
  const handleEdit = async (): Promise<void> => {
    if (!editText.trim()) {
      alert('Article text cannot be empty');
      return;
    }
    
    try {
      const response = await articlesAPI.updateArticle(article._id, {
        text: editText
      });
      onUpdate(response.data.article);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update article:', error);
      alert('Failed to update article: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  const handleDelete = async (): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      await articlesAPI.deleteArticle(article._id);
      onDelete(article._id);
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert('Failed to delete article: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-start gap-4">
        <Link to={`/profile/${article.author}`} className="flex-shrink-0">
          <img
            src={article.authorDetails?.avatar}
            alt={article.authorDetails?.displayName || article.author}
            className="w-12 h-12 rounded-full object-cover"
          />
        </Link>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <Link to={`/profile/${article.author}`} className="font-semibold text-gray-800 hover:underline">
                {article.authorDetails?.displayName || article.author}
              </Link>
              <div className="text-xs text-gray-500">{formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}{article.editedAt && ' (edited)'}</div>
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(!isEditing)} className="text-gray-500 hover:text-gray-700">✏️</button>
                <button onClick={handleDelete} className="text-gray-500 hover:text-red-600">🗑️</button>
              </div>
            )}
          </div>

          <div className="mt-3">
            {isEditing ? (
              <div>
                <textarea
                  value={editText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)}
                  className="w-full border rounded p-2"
                  rows={4}
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleEdit} className="px-3 py-1 bg-teal-600 text-white rounded">Save</button>
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1 border rounded">Cancel</button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 whitespace-pre-wrap">{article.text}</p>
            )}

            {article.images && article.images.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {article.images.map((image, index) => (
                  <img key={index} src={image.url} alt={`Uploaded content ${index + 1}`} className="w-full rounded object-cover max-h-64" />
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4">
            <button onClick={handleLike} className={`flex items-center gap-2 text-sm ${liked ? 'text-red-500' : 'text-gray-600'}`}>
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{likesCount}</span>
            </button>

            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-gray-600 text-sm">
              <span>💬</span>
              <span>{article.commentsCount || 0}</span>
            </button>
          </div>

          {showComments && (
            <div className="mt-3">
              <CommentSection articleId={article._id} commentsCount={article.commentsCount} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
