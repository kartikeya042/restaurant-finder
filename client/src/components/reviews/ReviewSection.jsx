import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = '';

export default function ReviewSection({ restaurantId }) {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  const [myReview, setMyReview] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [restaurantId, token]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${encodeURIComponent(restaurantId)}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');
      const data = await res.json();
      setReviews(data.reviews || []);
      setStats({ averageRating: data.averageRating || 0, totalReviews: data.totalReviews || 0 });
      
      if (user) {
        // Compare with both id and _id depending on token payload
        const mine = data.reviews.find(r => r.user?._id === user.id || r.user?._id === user._id);
        setMyReview(mine || null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    
    try {
      const url = editingId 
        ? `${API_BASE_URL}/api/reviews/${editingId}`
        : `${API_BASE_URL}/api/reviews/${encodeURIComponent(restaurantId)}`;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save review');
      
      setRating(5);
      setComment('');
      setEditingId(null);
      fetchReviews();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete review');
      setMyReview(null);
      fetchReviews();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-sm text-surface-500 py-4 text-center">Loading reviews...</div>;
  if (error) return <div className="text-sm text-red-500 py-2">{error}</div>;

  return (
    <div className="mt-4 border-t border-surface-200 dark:border-surface-800 pt-4">
      <div className="flex items-center gap-2 mb-4">
        <h4 className="font-semibold text-lg text-surface-900 dark:text-white">Reviews</h4>
        <div className="text-sm text-surface-500">
          <span className="text-amber-500 mr-1">★</span>
          {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'No ratings'} 
          <span className="ml-1">({stats.totalReviews})</span>
        </div>
      </div>
      
      {!token ? (
        <p className="text-sm text-surface-500 mb-4 bg-surface-50 dark:bg-surface-800 p-3 rounded-lg text-center">
          Please sign in to leave a review.
        </p>
      ) : (!myReview && !editingId) ? (
        <form onSubmit={handleSubmit} className="mb-6 bg-surface-50 dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
          <h5 className="font-medium mb-3 text-surface-900 dark:text-white">Rate your experience</h5>
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(num => (
              <button 
                type="button" 
                key={num} 
                onClick={() => setRating(num)}
                className={`text-2xl transition-colors ${rating >= num ? 'text-amber-500' : 'text-surface-300 dark:text-surface-600 hover:text-amber-400'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-surface-900 dark:text-white"
            placeholder="Write your review (optional)..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className="flex justify-end">
            <button type="submit" className="btn-primary py-2 px-5 text-sm">Submit Review</button>
          </div>
        </form>
      ) : editingId ? (
        <form onSubmit={handleSubmit} className="mb-6 bg-surface-50 dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
          <h5 className="font-medium mb-3 text-surface-900 dark:text-white">Edit your review</h5>
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(num => (
              <button 
                type="button" 
                key={num} 
                onClick={() => setRating(num)}
                className={`text-2xl transition-colors ${rating >= num ? 'text-amber-500' : 'text-surface-300 dark:text-surface-600 hover:text-amber-400'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="w-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg p-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-surface-900 dark:text-white"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setEditingId(null); setRating(5); setComment(''); }} className="px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="btn-primary py-2 px-5 text-sm">Update</button>
          </div>
        </form>
      ) : null}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-4">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map(r => {
            const isMine = user && (r.user?._id === user.id || r.user?._id === user._id);
            return (
              <div key={r._id} className="bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-surface-900 dark:text-white">{r.user?.name || 'Unknown User'}</span>
                      {isMine && <span className="text-[10px] uppercase font-bold tracking-wider bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 px-2 py-0.5 rounded-full">You</span>}
                    </div>
                    <div className="text-amber-500 text-sm mt-0.5 tracking-widest">
                      {'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}
                    </div>
                  </div>
                  {isMine && !editingId && (
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setEditingId(r._id); setRating(r.rating); setComment(r.comment || ''); }} className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(r._id)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline">Delete</button>
                    </div>
                  )}
                </div>
                {r.comment && <p className="text-sm text-surface-700 dark:text-surface-300 mt-2 leading-relaxed">{r.comment}</p>}
                <span className="text-xs text-surface-400 mt-3 block">{new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
