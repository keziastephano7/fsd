import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import { buildUrl } from '../utils/url';

export default function LikedUsersModal({ postId, open, onClose }) {
  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    setError('');
    API.get(`/posts/${postId}/likes`)
      .then(r => {
        if (!mounted) return;
        setLikers(r.data.likers || r.data || []);
      })
      .catch(e => {
        console.error('Failed to fetch likers', e);
        if (!mounted) return;
        setError(e?.response?.data?.message || 'Failed to load likers');
        setLikers([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [open, postId]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.98, y: 6, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 6, opacity: 0 }}
            className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Likes</h3>
              <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300">Close</button>
            </div>

            <div className="py-1" style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {loading && <div className="text-center text-sm text-gray-500">Loading...</div>}
              {!loading && error && (
                <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
              )}
              {!loading && !error && likers.length === 0 && (
                <div className="text-sm text-gray-500">No likes yet</div>
              )}
              {!loading && !error && likers.map(u => (
                <div key={u._id} className="flex items-center gap-3 py-2 px-1 hover:bg-gray-50 dark:hover:bg-gray-900/30 rounded-md">
                  {u.avatarUrl ? (
                    <img src={buildUrl(u.avatarUrl)} alt={u.name || 'User avatar'} className="w-9 h-9 rounded-full object-cover bg-gray-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-medium text-sm text-gray-700">{u.name?.charAt(0) || '?'}</div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{u.name || 'User'}</div>
                    {u.username && <div className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</div>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
