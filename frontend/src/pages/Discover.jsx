import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as usersAPI from '../api/users';

const Discover = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await usersAPI.searchUsers(searchQuery);
      setSearchResults(response.data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to search users');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (username, isFollowing) => {
    try {
      if (isFollowing) {
        await usersAPI.unfollowUser(username);
      } else {
        await usersAPI.followUser(username);
      }

      // Update the search results to reflect the change
      setSearchResults(prev =>
        prev.map(user =>
          user.username === username
            ? { ...user, isFollowing: !isFollowing }
            : user
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to update follow status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Discover People</h1>

          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or username..."
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <svg
                className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8 text-gray-500">
              Searching...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Search Results */}
          {!loading && searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-14 h-14 rounded-full object-cover cursor-pointer"
                      onClick={() => navigate(`/profile/${user.username}`)}
                    />
                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/profile/${user.username}`)}>
                      <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                      {user.bio && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{user.bio}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span><span className="font-semibold text-gray-700">{user.followersCount || 0}</span> followers</span>
                        <span><span className="font-semibold text-gray-700">{user.followingCount || 0}</span> following</span>
                      </div>
                    </div>
                  </div>

                  {currentUser?.username !== user.username && (
                    <button
                      onClick={() => handleFollowToggle(user.username, user.isFollowing)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        user.isFollowing
                          ? 'bg-white border border-teal-600 text-teal-600 hover:bg-teal-50'
                          : 'bg-teal-600 text-white hover:bg-teal-700'
                      }`}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && searchQuery.trim() && searchResults.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto w-16 h-16 text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-gray-500">No users found for "{searchQuery}"</p>
              <p className="text-sm text-gray-400 mt-2">Try searching with a different name or username</p>
            </div>
          )}

          {/* Initial State */}
          {!loading && !searchQuery.trim() && searchResults.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto w-16 h-16 text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-gray-500">Start typing to search for people</p>
              <p className="text-sm text-gray-400 mt-2">Find friends by their name or username</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discover;
