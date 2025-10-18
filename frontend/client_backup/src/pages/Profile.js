import React, { useEffect, useState } from 'react';
import API from '../api';
import { useParams } from 'react-router-dom';

export default function Profile({ user }) {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await API.get(`/users/${id}`);
      setProfile(res.data);
      const p = await API.get(`/posts?author=${id}`);
      setPosts(p.data);
    };
    load();
  }, [id]);

  if (!profile) {
    return <p className="text-center mt-20 text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      {/* Profile Header */}
      <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-md border border-gray-200">
        {profile.avatarUrl ? (
          <img
            src={`http://localhost:5000${profile.avatarUrl}`}
            alt="avatar"
            className="w-32 h-32 rounded-full object-cover mb-4"
          />
        ) : (
          <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 flex items-center justify-center text-gray-500 text-xl">
            {profile.name.charAt(0)}
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-2">{profile.name}</h2>
        <p className="text-gray-600 text-center">{profile.bio}</p>

        {user && (user.id === id || user._id === id) && (
          <button
            onClick={() => (window.location.href = `/profile/${id}/edit`)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {/* Posts Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Posts</h3>
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center">No posts yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {posts.map((pt) => (
              <div
                key={pt._id}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-4"
              >
                {pt.imageUrl && (
                  <img
                    src={`http://localhost:5000${pt.imageUrl}`}
                    alt="post"
                    className="w-full h-48 object-cover rounded-md mb-3"
                  />
                )}
                <p className="text-gray-700">{pt.caption}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
