import { useState } from 'react';
import { Star, Copy, Edit2, Check, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewCard({ review, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayResponse = review.edited_response || review.ai_response;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (!review.responded_at) {
      try {
        const res = await api.put(`/reviews/${review.id}`, { responded: true });
        onUpdate(res.data);
      } catch {}
    }
    toast.success('Response copied to clipboard!');
  };

  const handleEdit = () => {
    setEditText(displayResponse);
    setEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put(`/reviews/${review.id}`, { editedResponse: editText });
      onUpdate(res.data);
      setEditing(false);
      toast.success('Response saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/reviews/${review.id}/regenerate`);
      onUpdate(res.data);
      toast.success('New response generated');
    } catch {
      toast.error('Failed to regenerate');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${review.id}`);
      onDelete(review.id);
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">{review.reviewer_name}</span>
            {review.responded_at && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Responded</span>
            )}
          </div>
          <StarRating rating={review.rating} />
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Review text */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-700 leading-relaxed">{review.review_text}</p>
      </div>

      {/* AI Response */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {review.edited_response ? 'Edited Response' : 'AI Response'}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRegenerate}
              disabled={loading}
              title="Regenerate"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleEdit}
              title="Edit"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              title="Delete"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="input min-h-[100px] resize-y text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={loading} className="btn-primary text-sm py-1.5 px-3">
                <Check className="w-3.5 h-3.5 mr-1" /> Save
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary text-sm py-1.5 px-3">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg p-3 relative group">
            <p className="text-sm text-gray-700 leading-relaxed pr-8">{displayResponse}</p>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-brand-600 bg-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Copy button */}
      {!editing && (
        <button onClick={handleCopy} className="btn-primary w-full text-sm py-2">
          {copied ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Response</>}
        </button>
      )}
    </div>
  );
}
