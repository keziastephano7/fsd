import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import API, { setAuthToken } from './api';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';

function App() {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const navigate = useNavigate();

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    // optionally fetch current user from token
    // but we store user at login/register
  }, []);

  return (
    <div>
      <nav className="topbar">
        <Link to="/">Feed</Link>
        {user ? (
          <>
            <Link to={`/profile/${user.id}`}>Profile</Link>
            <button onClick={logout}>Logout</button>
            <span className="muted">Hello, {user.name}</span>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Feed user={user} />} />
          <Route path="/signup" element={<Signup onAuth={(u, t) => { setUser(u); setAuthToken(t); localStorage.setItem('user', JSON.stringify(u)); }} />} />
          <Route path="/login" element={<Login onAuth={(u, t) => { setUser(u); setAuthToken(t); localStorage.setItem('user', JSON.stringify(u)); }} />} />
          <Route path="/profile/:id" element={<Profile user={user} />} />
          <Route path="/profile/:id/edit" element={<EditProfile />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
