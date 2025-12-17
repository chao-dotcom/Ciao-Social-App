import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as usersAPI from '../api/users';
import './DeleteAccount.css';

interface OAuthProvider {
  provider: string;
}

const DeleteAccount: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState<string>('');
  const [confirmText, setConfirmText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Check if user has password (local auth)
  const hasPassword = (user as any)?.authProviders?.some((p: OAuthProvider) => p.provider === 'local');
  
  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Confirmation check
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }
    
    // Password check for local auth users
    if (hasPassword && !password) {
      setError('Password required for local accounts');
      return;
    }
    
    if (!window.confirm('Are you absolutely sure? This action cannot be undone!')) {
      return;
    }
    
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const payload = hasPassword ? { password } : {};
      await usersAPI.deleteAccount(user.username, payload);
      
      // Logout and redirect
      await logout();
      alert('Your account has been deleted');
      navigate('/login');
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };
  
  return (
    <div className="delete-account-container">
      <div className="delete-account-card">
        <h1>⚠️ Delete Account</h1>
        
        <div className="warning-box">
          <h2>Warning: This action is permanent!</h2>
          <p>Deleting your account will:</p>
          <ul>
            <li>Permanently delete all your posts and comments</li>
            <li>Remove you from all followers/following lists</li>
            <li>Delete your profile information</li>
            <li>Cannot be undone or recovered</li>
          </ul>
        </div>
        
        <form onSubmit={handleDelete} className="delete-form">
          {hasPassword && (
            <div className="form-group">
              <label htmlFor="password">Confirm Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required={hasPassword}
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="confirm">Type "DELETE" to confirm</label>
            <input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              required
            />
          </div>
          
          {error && <div className="error">{error}</div>}
          
          <div className="button-group">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || confirmText !== 'DELETE'}
              className="btn btn-danger"
            >
              {loading ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccount;
