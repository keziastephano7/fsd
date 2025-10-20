import React, { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import API, { setAuthToken } from './api';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import CreatePostPage from './pages/CreatePost';
import './styles.css';
import Navbar from './components/Navbar';
import { AuthContext } from './AuthContext';
import TagPage from './pages/TagPage';
import { ThemeProvider } from './ThemeContext'; // Add this import

function App() {
  const { user } = useContext(AuthContext);

  return (
    <ThemeProvider> {/* Wrap everything with ThemeProvider */}
      <div className="min-h-screen bg-neutral-50 dark:bg-[#031021] transition-colors duration-300">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Feed user={user} />} />
            <Route
              path="/signup"
              element={<Signup />}
            />
            <Route
              path="/login"
              element={<Login />}
            />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/profile/:id/edit" element={<EditProfile />} />
            <Route path="/create" element={<CreatePostPage />} />
            <Route path="/tag/:tag" element={<TagPage />} />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;