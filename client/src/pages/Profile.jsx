import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import RestaurantCard from '../components/search/RestaurantCard';

const API_BASE_URL = '';

function domainOnly(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function Profile() {
  const { token } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookmarks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load bookmarks');
        }
        setBookmarks(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const handleRemove = async (geoapifyId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks/${encodeURIComponent(geoapifyId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove bookmark');
      }
      setBookmarks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!token) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Sign in to view bookmarks</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Saved Spots</h1>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 h-24 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="card p-4 text-red-600 dark:text-red-400">{error}</div>
      )}

      {!loading && !error && bookmarks.length === 0 && (
        <div className="card p-6 text-center text-surface-500">
          No saved spots yet — start exploring!
        </div>
      )}

      {!loading && !error && bookmarks.length > 0 && (
        <div className="space-y-3">
          {bookmarks.map((b) => (
            <RestaurantCard
              key={String(b.geoapifyId)}
              restaurant={b}
              showBookmarkButton={false}
              onRemove={() => handleRemove(String(b.geoapifyId))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
