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
                : 'text-gray-300 dark:text-gray-600'
            }`}
          ></i>
        ))}
        <span className="ml-1 text-sm font-medium text-base-content opacity-70">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-base-100 rounded-lg p-4 lg:p-6 border border-base-300 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-primary-content font-bold">
            {review.clientName?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <p className="font-semibold text-base-content">{review.clientName || 'Anonymous'}</p>
            <p className="text-xs text-base-content opacity-60">
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          {renderStars(review.overallRating || 0)}
        </div>
      </div>

      {review.reviewText && (
        <p className="text-base-content opacity-80 mb-4 whitespace-pre-wrap">
          {review.reviewText}
        </p>
      )}

      {/* Category Ratings */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-base-300">
        {RATING_CATEGORIES.map((category) => {
          const rating = review.ratings?.[category.key] || 0;
          if (rating === 0) return null;
          
          return (
            <div key={category.key} className="flex items-center gap-2">
              <i className={`${category.icon} text-primary text-xs`}></i>
              <span className="text-xs text-base-content opacity-70 flex-1 truncate">
                {category.label}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i
                    key={star}
                    className={`fas fa-star text-xs ${
                      star <= Math.round(rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  ></i>
                ))}
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
        <p className="text-sm text-base-content opacity-70 mt-2">Loading reviews...</p>
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
        <p className="text-base-content opacity-70">No reviews yet.</p>
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
