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

  return (
    <div>
      {!profile ? (
        <p>Loading...</p>
      ) : (
        <div>
          <h2>{profile.name}</h2>
          <p>{profile.bio}</p>

          {/* ✅ Avatar display */}
          {profile.avatarUrl && (
            <img
              src={`http://localhost:5000${profile.avatarUrl}`}
              width="120"
              alt="avatar"
            />
          )}

          {/* ✅ Add this: show Edit button only if logged-in user matches the profile */}
          {user && (user.id === id || user._id === id) && (
            <button
              style={{
                marginTop: '8px',
                padding: '6px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => (window.location.href = `/profile/${id}/edit`)}
            >
              ✏️ Edit Profile
            </button>
          )}

          <h3>Posts</h3>
          <div>
            {posts.map((pt) => (
              <div key={pt._id} className="card">
                {pt.imageUrl && (
                  <img
                    src={`http://localhost:5000${pt.imageUrl}`}
                    alt="post"
                    className="small"
                  />
                )}
                <p>{pt.caption}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

}
