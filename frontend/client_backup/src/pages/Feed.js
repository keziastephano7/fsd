import React, { useEffect, useState } from 'react';
import API from '../api';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import '../input.css';

export default function Feed({ user }) {
  const [posts, setPosts] = useState([]);

  const load = async () => {
    const res = await API.get('/posts');
    setPosts(res.data);
  };

  useEffect(() => { load(); }, []);

  const onPostCreated = (newPost) => setPosts(prev => [newPost, ...prev]);

  return (
    <div className="max-w-xl mx-auto mt-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">Feed</h2>
      {user && <CreatePost onCreated={onPostCreated} />}
      <div className="flex flex-col gap-4">
        {posts.map(p => (
          <PostCard key={p._id} post={p} onUpdate={load} />
        ))}
      </div>
    </div>
  );

}