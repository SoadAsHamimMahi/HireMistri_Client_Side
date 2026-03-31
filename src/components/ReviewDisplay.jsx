import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const RATING_CATEGORIES = [
  { key: 'qualityOfWork', label: 'Quality of Work', icon: 'fas fa-tools' },
  { key: 'punctuality', label: 'Punctuality', icon: 'fas fa-clock' },
  { key: 'communication', label: 'Communication', icon: 'fas fa-comments' },
  { key: 'professionalism', label: 'Professionalism', icon: 'fas fa-user-tie' },
  { key: 'valueForMoney', label: 'Value for Money', icon: 'fas fa-dollar-sign' },
  { key: 'cleanliness', label: 'Cleanliness', icon: 'fas fa-broom' },
];

const ReviewCard = ({ review }) => {
  const { isDarkMode } = useTheme();
  
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`fas fa-star text-sm ${
              star <= Math.round(rating)
                ? 'text-yellow-400'
                : 'text-muted'
            }`}
          ></i>
        ))}
        <span className="ml-1 text-sm font-medium text-muted">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6 border-none shadow-lg mb-4 hover:border-[#1754cf]/20 transition-all group">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1754cf] to-[#2563eb] flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
            {review.clientName?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <p className="font-bold text-white text-lg leading-tight">{review.clientName || 'Anonymous Client'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-[#1754cf] bg-[#1754cf]/10 px-2 py-0.5 rounded-md uppercase tracking-wider border border-[#1754cf]/20">Verified Hiring</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          {renderStars(review.overallRating || 0)}
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Overall Satisfaction</span>
        </div>
      </div>

      {review.reviewText && (
        <div className="relative">
          <i className="fas fa-quote-left absolute -left-2 -top-2 text-white/5 text-3xl"></i>
          <p className="text-slate-300 text-sm leading-relaxed mb-6 italic pl-4 relative z-10 font-light">
            "{review.reviewText}"
          </p>
        </div>
      )}

      {/* Category Ratings */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 pt-5 border-t border-white/5">
        {RATING_CATEGORIES.map((category) => {
          const rating = review.ratings?.[category.key] || 0;
          if (rating === 0) return null;
          
          return (
            <div key={category.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <i className={`${category.icon} text-[#1754cf] text-[10px]`}></i>
                  {category.label}
                </span>
                <span className="text-[10px] font-black text-white">{rating}</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#1754cf] to-[#2563eb] rounded-full" 
                  style={{ width: `${(rating / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ReviewDisplay = ({ workerId, limit = 10 }) => {
  const { isDarkMode } = useTheme();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workerId) {
      setLoading(false);
      return;
    }

    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch(`${API_BASE}/api/reviews/worker/${workerId}?limit=${limit}`, {
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.status}`);
        }

        const data = await response.json();
        if (!ignore) {
          setReviews(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Failed to fetch reviews:', e);
        if (!ignore) {
          setError(e?.message || 'Failed to load reviews');
          setReviews([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [workerId, limit]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <span className="loading loading-spinner loading-md"></span>
        <p className="text-sm text-muted mt-2">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <i className="fas fa-exclamation-triangle"></i>
        <span>{error}</span>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <i className="fas fa-comments text-4xl text-base-content opacity-30 mb-3"></i>
        <p className="text-muted">No reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review, index) => (
        <ReviewCard key={review._id || index} review={review} />
      ))}
    </div>
  );
};

export default ReviewDisplay;
