import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as usersAPI from '../api/users';
import * as articlesAPI from '../api/articles';
import ArticleCard from '../components/article/ArticleCard';
import { User } from '../api/auth';
import { Article } from '../api/articles';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [following, setFollowing] = useState<boolean>(false);
  
  const isOwnProfile = currentUser?.username === username;
  
  useEffect(() => {
    const loadAll = async () => {
      if (!username) return;
      
      setLoading(true);
      try {
        const [profileRes, articlesRes] = await Promise.all([
          usersAPI.getProfile(username),
          articlesAPI.getArticlesByAuthor(username),
        ]);

        setProfile(profileRes.data.user);
        setFollowing(profileRes.data.user.isFollowing || false);
        setArticles(articlesRes.data.articles || []);
      } catch (error) {
        console.error('Failed to load profile or articles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [username]);
  
  const handleFollow = async () => {
    if (!username) return;
    
    try {
      if (following) {
        await usersAPI.unfollowUser(username);
        setFollowing(false);
        setProfile(prev => prev ? ({
          ...prev,
          followersCount: Math.max(0, (prev.followersCount || 0) - 1)
        }) : null);
      } else {
        await usersAPI.followUser(username);
        setFollowing(true);
        setProfile(prev => prev ? ({
          ...prev,
          followersCount: (prev.followersCount || 0) + 1
        }) : null);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
      alert((error as Error).message);
    }
  };
  
  const handleArticleDeleted = (articleId: string) => {
    setArticles(prev => prev.filter(article => article._id !== articleId));
  };
  
  const handleArticleUpdated = (updatedArticle: Article) => {
    setArticles(prev =>
      prev.map(article =>
        article._id === updatedArticle._id ? updatedArticle : article
      )
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-gray-600">User not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="h-36 bg-gradient-to-r from-teal-500 to-teal-700"></div>
          <div className="px-6 py-6">
            <div className="flex items-start gap-6">
              <img src={profile.avatar} alt={profile.username} className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md transform -translate-y-12 z-20" />

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">{profile.displayName}</h1>
                    <p className="text-sm text-gray-500">@{profile.username}</p>
                    {profile.bio && <p className="mt-2 text-gray-700">{profile.bio}</p>}
                  </div>

                  {!isOwnProfile && (
                    <div>
                      <button onClick={handleFollow} className={`px-4 py-2 rounded ${following ? 'bg-white border text-teal-600' : 'bg-teal-600 text-white'}`}>
                        {following ? 'Unfollow' : 'Follow'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                  <div><span className="font-semibold text-gray-900">{profile.followersCount || 0}</span> Followers</div>
                  <div><span className="font-semibold text-gray-900">{profile.followingCount || 0}</span> Following</div>
                  <div><span className="font-semibold text-gray-900">{articles.length}</span> Posts</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Posts</h2>
          {articles.length > 0 ? (
            articles.map(article => (
              <div key={article._id} className="mb-4">
                <ArticleCard
                  article={article}
                  onDelete={handleArticleDeleted}
                  onUpdate={handleArticleUpdated}
                />
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-600">No posts yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
