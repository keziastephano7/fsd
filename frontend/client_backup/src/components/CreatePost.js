import React, { useState } from 'react';
import API from '../api';

export default function CreatePost({ onCreated }) {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const submit = async e => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    try {
      const fd = new FormData();
      fd.append('caption', caption);
      if (file) fd.append('image', file);
      const res = await API.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCaption('');
      setFile(null);
      onCreated(res.data);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const map = {};
        data.errors.forEach(x => { map[x.param] = x.msg; });
        setFieldErrors(map);
      } else {
        setError(data?.message || 'Error creating post');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 p-6 bg-white rounded-xl shadow-md border border-secondary">
      <form onSubmit={submit} className="space-y-4">
        <textarea
          placeholder="What's happening?"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-lightGray text-darkText"
        />
        {fieldErrors.caption && <p className="text-error text-sm">{fieldErrors.caption}</p>}

        <input
          type="file"
          accept="image/*"
          onChange={e => setFile(e.target.files[0])}
          className="w-full text-darkText"
        />

        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent transition"
        >
          Post
        </button>

        {error && <p className="text-error text-sm mt-1">{error}</p>}
      </form>
    </div>
  );
}
