import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import * as commentsAPI from '../../api/comments';
import { Comment } from '../../api/comments';

interface CommentSectionCleanProps {
  articleId: string;
  commentsCount?: number;
}

const CommentSectionClean: React.FC<CommentSectionCleanProps> = ({ articleId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');

  const { user } = useAuth();

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const loadComments = async (): Promise<void> => {
    try {
      const response = await commentsAPI.getComments(articleId);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const response = await commentsAPI.createComment(articleId, { text: newComment });
      setComments(prev => [...prev, response.data.comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert('Failed to post comment: ' + (error instanceof Error ? error.message : ''));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId: string): Promise<void> => {
    if (!editText.trim()) return;
    try {
      const response = await commentsAPI.updateComment(commentId, { text: editText });
      setComments(prev => prev.map(c => c._id === commentId ? response.data.comment : c));
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to update comment:', error);
      alert('Failed to update comment: ' + (error instanceof Error ? error.message : ''));
    }
  };

  const handleDelete = async (commentId: string): Promise<void> => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentsAPI.deleteComment(commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment: ' + (error instanceof Error ? error.message : ''));
    }
  };

  const handleLike = async (commentId: string): Promise<void> => {
    try {
      const response = await commentsAPI.toggleLike(commentId);
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, likesCount: response.data.likesCount } : c));
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  return (
    <div className="mt-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <img src={user?.avatar} alt={user?.username} className="w-8 h-8 rounded-full object-cover" />
        <input
          type="text"
          value={newComment}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button type="submit" disabled={loading} className="px-3 py-1 bg-teal-600 text-white rounded">
          {loading ? '...' : '➤'}
        </button>
      </form>

      <div className="mt-3 space-y-3">
        {comments.map(comment => (
          <div key={comment._id} className="flex items-start gap-3">
            <Link to={`/profile/${comment.author}`}>
              <img src={comment.authorDetails?.avatar} alt={comment.authorDetails?.displayName || comment.author} className="w-8 h-8 rounded-full object-cover" />
            </Link>

            <div className="flex-1">
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex items-center justify-between gap-2">
                  <Link to={`/profile/${comment.author}`} className="text-sm font-medium text-gray-800 hover:underline">
                    {comment.authorDetails?.displayName || comment.author}
                  </Link>
                  <div className="text-xs text-gray-400">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</div>
                </div>

                {editingId === comment._id ? (
                  <div className="mt-2 flex gap-2">
                    <input type="text" value={editText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditText(e.target.value)} className="flex-1 border rounded px-2" />
                    <button onClick={() => handleEdit(comment._id)} className="px-2 bg-green-500 text-white rounded">✓</button>
                    <button onClick={() => setEditingId(null)} className="px-2 bg-gray-300 rounded">✕</button>
                  </div>
                ) : (
                  <p className="mt-2 text-gray-700">{comment.text}</p>
                )}
              </div>

              <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                <button onClick={() => handleLike(comment._id)} className="hover:text-teal-600">Like {comment.likesCount > 0 && `(${comment.likesCount})`}</button>

                {user?.username === comment.author && (
                  <>
                    <button onClick={() => { setEditingId(comment._id); setEditText(comment.text); }} className="hover:text-teal-600">Edit</button>
                    <button onClick={() => handleDelete(comment._id)} className="hover:text-red-600">Delete</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSectionClean;
