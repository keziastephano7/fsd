import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import API, { setAuthToken } from './api';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import './input.css';


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
      <nav className="bg-white shadow flex items-center justify-between px-4 py-2 sticky top-0 z-10">
        <div className="flex gap-4 items-center">
          <Link to="/" className="font-semibold text-blue-600 text-lg">MySocial</Link>
          {user && <Link to={`/profile/${user.id}`} className="text-gray-700 hover:text-blue-600">Profile</Link>}
        </div>
        <div className="flex gap-3 items-center">
          {user ? (
            <>
              <span className="text-sm text-gray-600">Hi, {user.name}</span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
              <Link to="/signup" className="text-gray-700 hover:text-blue-600">Signup</Link>
            </>
          )}
        </div>
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
