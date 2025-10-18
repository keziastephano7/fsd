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
    <div className="card">
      <form onSubmit={submit}>
        <textarea placeholder="What's happening?" value={caption} onChange={e => setCaption(e.target.value)} />
        {fieldErrors.caption && <div className="error">{fieldErrors.caption}</div>}
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />
        <button type="submit">Post</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
