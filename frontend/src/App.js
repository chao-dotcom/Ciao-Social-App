import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Header from './components/layout/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Discover from './pages/Discover';
import DeleteAccount from './pages/DeleteAccount';
import OAuthCallback from './pages/OAuthCallback';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route 
                path="/feed" 
                element={
                  <PrivateRoute>
                    <Feed />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/profile/:username" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/discover" 
                element={
                  <PrivateRoute>
                    <Discover />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/delete-account" 
                element={
                  <PrivateRoute>
                    <DeleteAccount />
                  </PrivateRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/feed" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

