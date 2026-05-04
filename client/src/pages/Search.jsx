import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CAMPUSES, useLocation } from '../context/LocationContext';
import RestaurantCard from '../components/search/RestaurantCard';

const API_BASE_URL = '';

const RADIUS_MIN = 1000;
const RADIUS_MAX = 5000;
const RADIUS_STEP = 500;
const RADIUS_DEFAULT = 3000;

function formatRadius(value) {
  if (value < 1000) return `${value}m`;
  return `${(value / 1000).toFixed(1)} km`;
}

function CampusSelector({ onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
      {Object.entries(CAMPUSES).map(([name, value]) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className="card p-6 text-left border-2 border-transparent hover:border-brand-400 transition-colors"
        >
          <p className="text-lg font-bold text-surface-900 dark:text-white">{name}</p>
          <p className="text-sm text-surface-500 mt-1">
            {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </p>
        </button>
      ))}
    </div>
  );
}

export default function Search() {
  const { token } = useAuth();
  const { coords, state, chooseCampus, setState } = useLocation();

  const [radius, setRadius] = useState(() => {
    const stored = localStorage.getItem('jiit_radius');
    const parsed = stored ? Number(stored) : NaN;
    return Number.isFinite(parsed) ? parsed : RADIUS_DEFAULT;
  });
  const [restaurants, setRestaurants] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookmarkPending, setBookmarkPending] = useState('');

  const effectiveRadius = Math.round(radius);

  useEffect(() => {
    localStorage.setItem('jiit_radius', String(effectiveRadius));
  }, [effectiveRadius]);

  const fetchRestaurants = async (lat, lng, nextRadius) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/restaurants?lat=${lat}&lng=${lng}&radius=${Math.round(nextRadius)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errMsg = body.message || (typeof body.error === 'string' ? body.error : 'Failed to load restaurants');
        throw new Error(errMsg);
      }
      const data = await res.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !coords || !(state === 'granted' || state === 'fallback')) return;
    const handle = setTimeout(() => {
      fetchRestaurants(coords.lat, coords.lng, effectiveRadius);
    }, 700);
    return () => clearTimeout(handle);
  }, [token, coords, state, effectiveRadius]);

  useEffect(() => {
    if (!token) return;
    const loadBookmarks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookmarks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => []);
        if (res.ok && Array.isArray(data)) {
          setBookmarkedIds(new Set(data.map((b) => String(b.geoapifyId))));
        }
      } catch {
        // no-op
      }
    };
    loadBookmarks();
  }, [token]);

  const toggleBookmark = async (item) => {
    const id = String(item.geoapifyId);
    const wasBookmarked = bookmarkedIds.has(id);
    const next = new Set(bookmarkedIds);

    if (wasBookmarked) next.delete(id);
    else next.add(id);

    setBookmarkedIds(next);
    setBookmarkPending(id);

    try {
      const res = await fetch(
        wasBookmarked
          ? `${API_BASE_URL}/api/bookmarks/${encodeURIComponent(id)}`
          : `${API_BASE_URL}/api/bookmarks`,
        {
          method: wasBookmarked ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: wasBookmarked
            ? undefined
            : JSON.stringify({
                geoapifyId: id,
                name: item.name,
                amenity: item.amenity,
                cuisine: item.cuisine,
              }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update bookmark');
      }
    } catch {
      const rollback = new Set(next);
      if (wasBookmarked) rollback.add(id);
      else rollback.delete(id);
      setBookmarkedIds(rollback);
    } finally {
      setBookmarkPending('');
    }
  };

  const locationsReady = state === 'granted' || state === 'fallback';

  if (!token) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Sign in to explore nearby food</h1>
        <p className="text-surface-500 mt-2">Your account is required to access restaurants and bookmarks.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5">
      {state === 'requesting' && (
        <div className="card p-6 text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-surface-700 dark:text-surface-200">Getting your location…</p>
          <button
            className="mt-3 text-sm text-brand-600 dark:text-brand-300 hover:underline"
            onClick={() => setState('fallback')}
          >
            Choose campus instead
          </button>
        </div>
      )}

      {(state === 'denied' || state === 'fallback') && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Choose your campus</h2>
          <CampusSelector onSelect={chooseCampus} />
        </div>
      )}

      {locationsReady && coords && (
        <>
          <div className="card p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">Nearby food spots</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.keys(CAMPUSES).map((campusName) => (
                  <button
                    key={campusName}
                    className="text-sm px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600"
                    onClick={() => chooseCampus(campusName)}
                  >
                    {campusName}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="radius" className="text-sm font-medium text-surface-600 dark:text-surface-300">
                Radius: {formatRadius(effectiveRadius)}
              </label>
              <input
                id="radius"
                type="range"
                min={RADIUS_MIN}
                max={RADIUS_MAX}
                step={RADIUS_STEP}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="h-5 w-1/3 bg-surface-200 dark:bg-surface-700 rounded" />
                  <div className="h-4 w-1/2 bg-surface-200 dark:bg-surface-700 rounded mt-2" />
                  <div className="h-4 w-2/3 bg-surface-200 dark:bg-surface-700 rounded mt-2" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="card p-5 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => fetchRestaurants(coords.lat, coords.lng, effectiveRadius)}
                className="btn-primary mt-3"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && restaurants.length === 0 && (
            <div className="card p-6 text-center text-surface-500">
              No food spots found — try increasing the radius
            </div>
          )}

          {!loading && !error && restaurants.length > 0 && (
            <div className="space-y-3">
              {restaurants.map((item) => {
                const id = String(item.geoapifyId);
                return (
                  <RestaurantCard
                    key={id}
                    restaurant={item}
                    bookmarked={bookmarkedIds.has(id)}
                    onToggleBookmark={toggleBookmark}
                    showBookmarkButton={true}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
