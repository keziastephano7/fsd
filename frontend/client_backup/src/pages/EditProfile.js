import React, { useState, useEffect } from 'react';
import API from '../api';
import { useParams, useNavigate } from 'react-router-dom';

export default function EditProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', bio: '' });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get(`/users/${id}`);
        setForm({ name: res.data.name, bio: res.data.bio || '' });
        if (res.data.avatarUrl)
          setPreview(`http://localhost:5000${res.data.avatarUrl}`);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [id]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('bio', form.bio);
      if (avatar) fd.append('avatar', avatar);
      await API.put(`/users/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Profile updated!');
      nav(`/profile/${id}`);
    } catch (err) {
      console.error('Update failed', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="card">
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your name"
          required
        />
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Your bio"
        />
        {preview && (
          <img
            src={preview}
            alt="preview"
            width="120"
            style={{ borderRadius: '6px', display: 'block', marginBottom: '8px' }}
          />
        )}
        <input type="file" accept="image/*" onChange={e => setAvatar(e.target.files[0])} />
        <button type="submit">Save Changes</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
