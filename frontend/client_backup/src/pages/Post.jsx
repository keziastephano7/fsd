import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api';
import PostCard from '../components/PostCard';



export default function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    let mounted = true;
    API.get(`/posts/${id}`).then(res => {
      if (mounted) setPost(res.data);
    }).catch(err => {
      console.error('Failed to load post', err);
    });
    return () => { mounted = false };
  }, [id]);

  if (!post) return <div className="py-12 text-center">Loading...</div>;
  return (
    <div className="max-w-2xl mx-auto py-8">
      <PostCard post={post} showActions={true} />
    </div>
  );
}
