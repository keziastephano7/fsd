import React, { useState, useEffect, useContext } from 'react';
import API from '../api';
import { AuthContext } from '../AuthContext';

export default function CreatePost({ onCreated }) {
  const { user } = useContext(AuthContext);

  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Clear inputs when user becomes null (logout)
  useEffect(() => {
    if (!user) {
      setCaption('');
      setFile(null);
      setError('');
      setFieldErrors({});
    }
  }, [user]);

  const submit = async e => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to post.');
      return;
    }

    setError('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('caption', caption);
      if (file) fd.append('image', file);
      const res = await API.post('/posts', fd); // let axios handle headers
      setCaption('');
      setFile(null);
      onCreated && onCreated(res.data);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        const map = {};
        data.errors.forEach(x => { if (x.param) map[x.param] = x.msg; });
        setFieldErrors(map);
      } else {
        setError(data?.message || 'Error creating post');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white dark:bg-[#07142a] rounded-xl shadow-card border border-neutral-100 dark:border-neutral-800">
      <form onSubmit={submit} className="space-y-3" autoComplete="off">
        <textarea
          name="caption"
          placeholder="What's happening?"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-neutral-50 dark:bg-[#07142a] text-neutral-900 dark:text-neutral-100"
          autoComplete="off"
          data-createpost-input
        />
        {fieldErrors.caption && <p className="text-sm text-red-500">{fieldErrors.caption}</p>}

        <input
          type="file"
          accept="image/*"
          onChange={e => setFile(e.target.files[0])}
          className="w-full text-neutral-700 dark:text-neutral-200"
          aria-label="Attach image"
        />

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={submitting || !user}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${submitting ? 'opacity-60 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
            aria-disabled={submitting || !user}
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </form>
    </div>
  );
}