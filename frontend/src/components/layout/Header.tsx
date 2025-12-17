import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../asset/logo.png';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/feed" className="flex items-center gap-3">
          <img src={logo} alt="Ciao logo" className="w-14 h-14 object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <Link to="/feed" className="text-gray-700 hover:text-teal-600">🏠 Feed</Link>
          <Link to="/discover" className="text-gray-700 hover:text-teal-600">🔍 Discover</Link>
          <Link to={`/profile/${user?.username}`} className="text-gray-700 hover:text-teal-600">👤 Profile</Link>
          <Link to="/settings" className="text-gray-700 hover:text-teal-600">⚙️ Settings</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to={`/profile/${user?.username}`} className="flex items-center gap-2">
            <img
              src={user?.avatar}
              alt={user?.username}
              className="w-9 h-9 rounded-full object-cover"
            />
            <span className="hidden sm:inline text-gray-800">{user?.displayName}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-white border rounded text-sm text-gray-700 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
