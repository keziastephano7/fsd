// App.js (updated)
import React, { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import API, { setAuthToken } from './api';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import CreatePostPage from './pages/CreatePost';
import Navbar from './components/Navbar';
import { AuthContext } from './AuthContext';
import TagPage from './pages/TagPage';
import { ThemeProvider } from './ThemeContext';
import Landing from './pages/Landing'; // Add this import
import PostPage from './pages/Post';
import Groups from './pages/Groups';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <ThemeProvider>
      <div className="min-h-screen transition-colors duration-300 relative">
        {/* Content with higher z-index */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <Navbar />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={user ? <Feed user={user} /> : <Landing />} />
              <Route path="/posts/:id" element={<PostPage />} />
              <Route path="/signup" element={<Signup />}/>
              <Route path="/login" element={<Login />}/>
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/profile/:id/edit" element={<EditProfile />} />
              <Route path="/create" element={<CreatePostPage />} />
              <Route path="/tag/:tag" element={<TagPage />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:groupId" element={<Groups />} />
            </Routes>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;