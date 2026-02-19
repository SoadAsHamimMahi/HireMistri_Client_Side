import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import axios from 'axios';
import toast from 'react-hot-toast';
import LocationAutocomplete from './LocationAutocomplete';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function ChatJobCreationModal({ 
  onClose, 
  onSuccess,
  conversationId,
  targetWorkerId
}) {
  const { user } = useContext(AuthContext) || {};
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    budget: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLocationChange = (location) => {
    setForm({ ...form, location });
  };

  const wordCount = form.description.trim().split(/\s+/).filter(Boolean).length;
  const minWords = 10; // Reduced from 20 to 10 for simplicity
  const isDescriptionValid = wordCount >= minWords;

  // Auto-detect location on mount
  useEffect(() => {
    if (!form.location && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              {
                headers: {
                  'User-Agent': 'HireMistri/1.0'
                }
              }
            );
            const data = await res.json();
            const address = data.display_name || `Lat: ${latitude}, Lon: ${longitude}`;
            setForm((prev) => ({ ...prev, location: address }));
          } catch (error) {
            console.error('Error fetching location:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Silently fail - user can still enter location manually
        }
      );
    }
  }, []); // Run once on mount

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!form.category) {
      toast.error('Category is required');
      return;
    }

    if (!isDescriptionValid) {
      toast.error(`Description must be at least ${minWords} words`);
      return;
    }

    if (!form.location.trim()) {
      toast.error('Location is required');
      return;
    }

    if (!form.budget || parseFloat(form.budget) <= 0) {
      toast.error('Budget must be a positive number');
      return;
    }

    if (!user?.uid) {
      toast.error('You must be logged in to create a job');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        clientId: user.uid,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
        budget: parseFloat(form.budget),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        // Private job fields - if created from chat
        ...(conversationId && targetWorkerId && {
          isPrivate: true,
          conversationId: conversationId,
          targetWorkerId: targetWorkerId
        })
      };

      const response = await axios.post(`${API_BASE}/api/browse-jobs`, payload);
      
      toast.success('Job created successfully!');
      if (onSuccess) {
        onSuccess(response.data.jobId);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create job:', err);
      toast.error(err.response?.data?.error || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-4">Create Job</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="label">
              <span className="label-text">Job Title *</span>
            </label>
            <input
              type="text"
              name="title"
              className="input input-bordered w-full"
              placeholder="e.g. Need a plumber to fix leaky faucet"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="label">
              <span className="label-text">Category *</span>
            </label>
            <select
              name="category"
              className="select select-bordered w-full"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option disabled value="">Select Category</option>
              <option value="Electrician">Electrician</option>
              <option value="Plumber">Plumber</option>
              <option value="Mechanic">Mechanic</option>
              <option value="Technician">Technician</option>
              <option value="Carpenter">Carpenter</option>
              <option value="Mason">Mason (Rajmistri)</option>
              <option value="Welder">Welder</option>
              <option value="Painter">Painter</option>
              <option value="AC Technician">AC Technician</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="label">
              <span className="label-text">Description *</span>
              <span className="label-text-alt">
                {wordCount}/{minWords} words min
              </span>
            </label>
            <textarea
              name="description"
              className="textarea textarea-bordered w-full"
              placeholder="Briefly describe what needs to be done..."
              value={form.description}
              onChange={handleChange}
              rows={4}
              required
            />
            {form.description && !isDescriptionValid && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {minWords - wordCount} more words required
                </span>
              </label>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="label">
              <span className="label-text">Location *</span>
            </label>
            <LocationAutocomplete
              value={form.location}
              onChange={handleLocationChange}
              placeholder="Enter job location"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="label">
              <span className="label-text">Budget (BDT) *</span>
            </label>
            <input
              type="number"
              name="budget"
              className="input input-bordered w-full"
              placeholder="e.g. 5000, 10000"
              value={form.budget}
              onChange={handleChange}
              min="0"
              step="100"
              required
            />
          </div>

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !isDescriptionValid || !form.title || !form.category || !form.location || !form.budget}
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                'Create Job'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
