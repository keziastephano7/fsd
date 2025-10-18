import React, { useEffect, useState } from 'react';
import API from '../api';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';

export default function Feed({ user }) {
  const [posts, setPosts] = useState([]);

  const load = async () => {
    const res = await API.get('/posts');
    setPosts(res.data);
  };

  useEffect(() => { load(); }, []);

  const onPostCreated = (newPost) => setPosts(prev => [newPost, ...prev]);

  return (
    <div>
      <h2>Feed</h2>
      {user && <CreatePost onCreated={onPostCreated} />}
      <div>
        {posts.map(p => <PostCard key={p._id} post={p} onUpdate={() => load()} />)}
      </div>
    </div>
  );
}