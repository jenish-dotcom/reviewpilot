import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Star, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import ReviewCard from '../components/ReviewCard';

function AddReviewModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ reviewerName: '', rating: 5, reviewText: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/reviews', form);
      onAdded(res.data);
      toast.success('Review added and AI response generated!');
      onClose();
    } catch (err) {
      if (err.response?.status === 402) {
        toast.error('Monthly review limit reached. Please upgrade your plan.');
      } else {
        toast.error(err.response?.data?.error || 'Failed to add review');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Review</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Reviewer Name (optional)</label>
            <input
              type="text"
              value={form.reviewerName}
              onChange={e => setForm(f => ({ ...f, reviewerName: e.target.value }))}
              className="input"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="label">Star Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, rating: r }))}
                  className="p-1"
                >
                  <Star className={`w-7 h-7 ${r <= form.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Review Text *</label>
            <textarea
              value={form.reviewText}
              onChange={e => setForm(f => ({ ...f, reviewText: e.target.value }))}
              className="input min-h-[120px] resize-y"
              placeholder="Paste the customer's review here..."
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</> : 'Generate AI Response'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviews', { search, rating: ratingFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (ratingFilter) params.set('rating', ratingFilter);
      const res = await api.get(`/reviews?${params}`);
      return res.data;
    },
  });

  const handleAdded = (review) => {
    queryClient.invalidateQueries({ queryKey: ['reviews'] });
  };

  const handleUpdate = (updated) => {
    queryClient.setQueryData(['reviews', { search, rating: ratingFilter, page }], old => ({
      ...old,
      reviews: old.reviews.map(r => r.id === updated.id ? updated : r),
    }));
  };

  const handleDelete = (id) => {
    queryClient.setQueryData(['reviews', { search, rating: ratingFilter, page }], old => ({
      ...old,
      reviews: old.reviews.filter(r => r.id !== id),
      total: old.total - 1,
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.total ?? 0} total reviews
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Review
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
            placeholder="Search reviews…"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={e => { setRatingFilter(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map(r => (
            <option key={r} value={r}>{r} star{r !== 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      {/* Reviews */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 text-red-600 bg-red-50 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          Failed to load reviews
        </div>
      ) : data?.reviews?.length === 0 ? (
        <div className="text-center py-20">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">No reviews yet</h3>
          <p className="text-gray-500 text-sm mb-4">Add your first review to generate an AI response</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Add your first review
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {data.reviews.map(review => (
              <ReviewCard key={review.id} review={review} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm px-3 py-1.5"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {data.pages}</span>
              <button
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="btn-secondary text-sm px-3 py-1.5"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showModal && <AddReviewModal onClose={() => setShowModal(false)} onAdded={handleAdded} />}
    </div>
  );
}
