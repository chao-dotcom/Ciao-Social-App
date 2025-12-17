import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        if (!token) {
          console.error('No token found in OAuth callback');
          setError('No authentication token received');
          setTimeout(() => navigate('/login?error=oauth_failed', { replace: true }), 2000);
          return;
        }
        
        console.log('OAuth token received, length:', token.length);
        
        // Store the token in localStorage
        localStorage.setItem('authToken', token);
        console.log('Token stored in localStorage');
        
        // Refresh user data with the new token
        console.log('Calling refreshUser...');
        await refreshUser();
        console.log('User refreshed successfully');
        
        // Small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to feed
        console.log('Redirecting to /feed');
        navigate('/feed', { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Failed to complete sign in');
        setTimeout(() => navigate('/login?error=oauth_failed', { replace: true }), 2000);
      }
    };
    
    handleOAuthCallback();
  }, [location, navigate, refreshUser]);
  
  return (
    <div className="loading-center" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
            <p>Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem' }}>Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
