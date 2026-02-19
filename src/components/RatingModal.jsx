import { useState, useEffect, useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AuthContext } from '../Authentication/AuthProvider';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const RATING_CATEGORIES = [
  { key: 'qualityOfWork', label: 'Quality of Work', icon: 'fas fa-tools', description: 'How well was the job completed?' },
  { key: 'punctuality', label: 'Punctuality', icon: 'fas fa-clock', description: 'Did they arrive on time and meet deadlines?' },
  { key: 'communication', label: 'Communication', icon: 'fas fa-comments', description: 'How well did they communicate throughout?' },
  { key: 'professionalism', label: 'Professionalism', icon: 'fas fa-user-tie', description: 'Were they professional in behavior and appearance?' },
  { key: 'valueForMoney', label: 'Value for Money', icon: 'fas fa-dollar-sign', description: 'Was the price fair for the work done?' },
  { key: 'cleanliness', label: 'Cleanliness', icon: 'fas fa-broom', description: 'Did they clean up after completing the work?' },
];

const RatingModal = ({ 
  isOpen, 
  onClose, 
  jobId, 
  applicationId, 
  workerId, 
  workerName,
  jobTitle,
  onSuccess 
}) => {
  const { isDarkMode } = useTheme();
  const { user } = useContext(AuthContext) || {};
  const [ratings, setRatings] = useState({
    qualityOfWork: 0,
    punctuality: 0,
    communication: 0,
    professionalism: 0,
    valueForMoney: 0,
    cleanliness: 0,
  });
  const [overallRating, setOverallRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingReview, setExistingReview] = useState(null);

  // Check if review already exists (reset when opening for a different application)
  useEffect(() => {
    if (isOpen && applicationId) {
      setExistingReview(null);
      setRatings({
        qualityOfWork: 0,
        punctuality: 0,
        communication: 0,
        professionalism: 0,
        valueForMoney: 0,
        cleanliness: 0,
      });
      setOverallRating(0);
      setReviewText('');
      setError('');

      (async () => {
        try {
          const response = await fetch(`${API_BASE}/api/reviews/application/${applicationId}`, {
            headers: { Accept: 'application/json' },
          });
          if (response.ok) {
            const review = await response.json();
            setExistingReview(review);
            setRatings(review.ratings || {
              qualityOfWork: 0,
              punctuality: 0,
              communication: 0,
              professionalism: 0,
              valueForMoney: 0,
              cleanliness: 0,
            });
            setOverallRating(review.overallRating || 0);
            setReviewText(review.reviewText || '');
          } else {
            setExistingReview(null);
          }
        } catch (err) {
          console.error('Failed to check existing review:', err);
          setExistingReview(null);
        }
      })();
    }
  }, [isOpen, applicationId]);

  // Calculate overall rating when category ratings change
  useEffect(() => {
    const ratingValues = Object.values(ratings).filter(v => v > 0);
    if (ratingValues.length > 0) {
      const avg = ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length;
      setOverallRating(Math.round(avg * 10) / 10);
    } else {
      setOverallRating(0);
    }
  }, [ratings]);

  const handleRatingChange = (category, value) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
    setError('');
  };

  const handleStarClick = (category, value) => {
    handleRatingChange(category, value);
  };

  const handleSubmit = async () => {
    // Validation
    const hasRatings = Object.values(ratings).some(r => r > 0);
    if (!hasRatings) {
      setError('Please rate at least one category');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (!user?.uid) {
        setError('Please log in to submit a review');
        return;
      }

      const response = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          jobId,
          applicationId,
          workerId,
          clientId: user.uid,
          ratings,
          overallRating,
          reviewText: reviewText.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit review');
      }

      const data = await response.json();
      
      if (onSuccess) {
        onSuccess(data.review);
      }
      
      // Reset form
      setRatings({
        qualityOfWork: 0,
        punctuality: 0,
        communication: 0,
        professionalism: 0,
        valueForMoney: 0,
        cleanliness: 0,
      });
      setReviewText('');
      onClose();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ category, value, onChange, disabled: starDisabled }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange && onChange(category, star)}
            className={`text-2xl transition-colors ${
              star <= value
                ? 'text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            } ${!starDisabled ? 'hover:text-yellow-400' : ''} focus:outline-none`}
            disabled={submitting || starDisabled}
          >
            <i className="fas fa-star"></i>
          </button>
        ))}
        <span className="ml-2 text-sm text-base-content opacity-70">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className={`relative bg-base-200 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
        isDarkMode ? 'dark' : ''
      }`}>
        <div className="sticky top-0 bg-base-200 border-b border-base-300 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-base-content">
              {existingReview ? 'Your Review' : 'Rate Worker'}
            </h3>
            <p className="text-sm text-base-content opacity-70 mt-1">
              {workerName} • {jobTitle || 'Job'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={submitting}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          )}

          {existingReview && (
            <div className="alert alert-info">
              <i className="fas fa-info-circle"></i>
              <span>You&apos;ve already reviewed this worker for this job.</span>
            </div>
          )}

          {/* Rating Categories */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-base-content">Rate by Category</h4>
            {RATING_CATEGORIES.map((category) => (
              <div
                key={category.key}
                className="bg-base-100 rounded-lg p-4 border border-base-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <i className={`${category.icon} text-primary`}></i>
                      <span className="font-medium text-base-content">{category.label}</span>
                    </div>
                    <p className="text-sm text-base-content opacity-70">{category.description}</p>
                  </div>
                </div>
                <StarRating
                  category={category.key}
                  value={ratings[category.key]}
                  onChange={existingReview ? undefined : handleStarClick}
                  disabled={!!existingReview}
                />
              </div>
            ))}
          </div>

          {/* Overall Rating Display */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-base-content">Overall Rating</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">{overallRating.toFixed(1)}</span>
                <span className="text-base-content opacity-70">/ 5.0</span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <i
                  key={star}
                  className={`fas fa-star text-lg ${
                    star <= Math.round(overallRating)
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                ></i>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-base-content mb-2">
              Written Review (Optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => !existingReview && setReviewText(e.target.value)}
              placeholder="Share your experience with this worker..."
              className="textarea textarea-bordered w-full min-h-[120px] resize-none"
              disabled={submitting || !!existingReview}
              maxLength={1000}
            />
            <div className="text-xs text-base-content opacity-60 mt-1 text-right">
              {reviewText.length}/1000 characters
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 justify-end pt-4 border-t border-base-300">
            <button
              onClick={onClose}
              className="btn btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={submitting || overallRating === 0 || !!existingReview}
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Submitting...
                </>
              ) : existingReview ? (
                <>
                  <i className="fas fa-check mr-2"></i>
                  Already reviewed
                </>
              ) : (
                <>
                  <i className="fas fa-star mr-2"></i>
                  Submit Review
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
