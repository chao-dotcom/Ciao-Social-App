import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as usersAPI from '../api/users';
import * as authAPI from '../api/auth';

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    location: user?.location || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    zipcode: user?.zipcode || ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  
  useEffect(() => {
    // Load linked OAuth accounts
    if (user?.authProviders) {
      setLinkedAccounts(user.authProviders);
    }
  }, [user]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      await usersAPI.updateProfile(user.username, formData);
      setMessage('Profile updated successfully!');
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAvatarUpdate = async (e) => {
    e.preventDefault();
    
    if (!avatarFile) {
      setError('Please select an image');
      return;
    }
    
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const formDataObj = new FormData();
      formDataObj.append('avatar', avatarFile);
      
      await usersAPI.updateAvatar(formDataObj);
      setMessage('Avatar updated successfully!');
      setAvatarFile(null);
      setAvatarPreview(null);
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLinkGoogle = () => {
    // Redirect to Google OAuth with state parameter for linking
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/auth/google?link=true`;
  };
  
  const handleUnlinkProvider = async (provider) => {
    if (!window.confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      return;
    }
    
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      await authAPI.unlinkOAuthAccount(provider);
      setMessage(`${provider} account unlinked successfully!`);
      await refreshUser();
    } catch (err) {
      setError(err.message || `Failed to unlink ${provider} account`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Settings</h1>

          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">Profile Picture</h2>
              <form onSubmit={handleAvatarUpdate} className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-4">
                  <img src={avatarPreview || user?.avatar} alt="Avatar preview" className="w-24 h-24 rounded-full object-cover border-2 border-gray-100 shadow-sm" />
                  <div>
                    <label htmlFor="avatar-input" className="inline-block px-4 py-2 bg-teal-600 text-white rounded cursor-pointer">Change Photo</label>
                    <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    {avatarFile && (
                      <div className="mt-3">
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded">{loading ? 'Uploading...' : 'Upload Avatar'}</button>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">Profile Information</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 mb-1">Display Name</label>
                  <input id="displayName" name="displayName" type="text" value={formData.displayName} onChange={handleChange} placeholder="Your display name" className="w-full border rounded px-3 py-2" />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                  <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself" rows="4" className="w-full border rounded px-3 py-2" />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                  <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} placeholder="Where are you from?" className="w-full border rounded px-3 py-2" />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" className="w-full border rounded px-3 py-2" />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} placeholder="+1-234-567-8900" className="w-full border rounded px-3 py-2" />
                </div>

                <div>
                  <label htmlFor="zipcode" className="block text-sm font-semibold text-gray-700 mb-1">Zipcode</label>
                  <input id="zipcode" name="zipcode" type="text" value={formData.zipcode} onChange={handleChange} placeholder="12345" className="w-full border rounded px-3 py-2" />
                </div>

                {message && <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded">{message}</div>}
                {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded">{error}</div>}

                <div>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded">{loading ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">Linked Accounts</h2>
              <div className="bg-gray-50 rounded p-4 space-y-3">
                <p className="text-sm text-gray-600 mb-4">Connect your account with third-party providers for easy sign-in.</p>
                
                {linkedAccounts && linkedAccounts.length > 0 ? (
                  <div className="space-y-2">
                    {linkedAccounts.map((account, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-teal-600 font-semibold text-lg">{account.provider.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 capitalize">{account.provider}</div>
                            <div className="text-xs text-gray-500">{account.email || 'Connected'}</div>
                          </div>
                        </div>
                        <button onClick={() => handleUnlinkProvider(account.provider)} disabled={loading} className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100">{loading ? 'Unlinking...' : 'Unlink'}</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No linked accounts yet.</div>
                )}
                
                <div className="pt-3 border-t border-gray-200">
                  <button onClick={handleLinkGoogle} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    <span className="font-medium text-gray-700">{linkedAccounts.some(a => a.provider === 'google') ? 'Relink Google' : 'Link Google Account'}</span>
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">Account Information</h2>
              <div className="bg-gray-50 rounded p-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-700"><span className="font-semibold">Username</span><span className="text-gray-900">@{user?.username}</span></div>
                <div className="flex justify-between text-sm text-gray-700"><span className="font-semibold">Email</span><span className="text-gray-900">{user?.email}</span></div>
                <div className="flex justify-between text-sm text-gray-700"><span className="font-semibold">Member since</span><span className="text-gray-900">{new Date(user?.createdAt).toLocaleDateString()}</span></div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-800 mb-3">Danger Zone</h2>
              <div className="bg-white rounded border border-red-100 p-4">
                <p className="text-sm text-gray-600 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button onClick={() => window.location.href = '/delete-account'} className="px-4 py-2 bg-red-600 text-white rounded">Delete Account</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

