import React, { useEffect, useState, useContext } from 'react';
import API from '../api';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';

export default function FollowingPage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [privateList, setPrivateList] = useState(false);

  useEffect(() => {
    setItems([]);
    setPage(0);
    loadPage(0);
  }, [id]);

  const loadPage = async (p) => {
    setLoading(true);
    setPrivateList(false);
    try {
      const res = await API.get(`/users/${id}/following?page=${p}&limit=${limit}`);
      if (res.data && res.data.items) {
        setItems(prev => p === 0 ? res.data.items : [...prev, ...res.data.items]);
        setTotal(res.data.total || 0);
        setPage(res.data.page || p);
      }
    } catch (err) {
      if (err.response && (err.response.status === 403 || (err.response.data && err.response.data.private))) {
        setPrivateList(true);
      } else {
        console.error('Failed to load following page', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    loadPage(page + 1);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Following</h2>

      {privateList ? (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl text-center">
          This list is private — only the account owner and followers can view it.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(f => (
            <Link key={f._id} to={`/profile/${f._id}`} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {f.avatarUrl ? <img src={buildUrl(f.avatarUrl)} alt={f.name} className="w-full h-full object-cover" /> : (f.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium">{f.name}</div>
              </div>
            </Link>
          ))}

          {items.length < total && (
            <div className="text-center mt-4">
              <button onClick={loadMore} disabled={loading} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}

          {items.length === 0 && !loading && (
            <div className="text-center text-gray-500 p-6">No following yet</div>
          )}
        </div>
      )}
    </div>
  );
}
