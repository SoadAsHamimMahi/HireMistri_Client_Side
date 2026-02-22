import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LocationPicker } from './maps';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const CATEGORIES = [
  'Electrician', 'Plumber', 'Mechanic', 'Technician', 'Carpenter',
  'Mason (Rajmistri)', 'Welder', 'Painter', 'AC Technician', 'Other'
];

function getDefaultExpiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 59, 999);
  return d.toISOString().slice(0, 16);
}

export default function JobOfferModal({ workerId, workerName, workerCategories = [], onClose, onSuccess }) {
  const { user } = useContext(AuthContext) || {};
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    locationText: '',
    locationGeo: null,
    placeId: null,
    budget: '',
    expiresAt: getDefaultExpiresAt(),
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLocationChange = (loc) => {
    setForm({
      ...form,
      location: loc?.locationText ?? form.location,
      locationText: loc?.locationText ?? form.locationText,
      locationGeo: loc?.locationGeo ?? form.locationGeo,
      placeId: loc?.placeId ?? form.placeId,
    });
  };

  const wordCount = form.description.trim().split(/\s+/).filter(Boolean).length;
  const minWords = 10;
  const isDescriptionValid = wordCount >= minWords;
  const categoryMismatch = form.category && workerCategories.length > 0 && !workerCategories.includes(form.category);

  useEffect(() => {
    if (!form.location && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'User-Agent': 'HireMistri/1.0' } }
            );
            const data = await res.json();
            const address = data.display_name || `Lat: ${latitude}, Lon: ${longitude}`;
            setForm((prev) => ({ ...prev, location: address }));
          } catch (err) {
            console.error('Error fetching location:', err);
          }
        },
        () => {}
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    if (!(form.locationText || form.location || '').trim()) {
      toast.error('Location is required');
      return;
    }
    const budgetNum = parseFloat(form.budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      toast.error('Budget must be a positive number');
      return;
    }
    if (!user?.uid) {
      toast.error('You must be logged in to send a job offer');
      return;
    }
    if (!workerId) {
      toast.error('Worker not specified');
      return;
    }
    const expiresAt = new Date(form.expiresAt);
    if (expiresAt <= new Date()) {
      toast.error('Offer must expire in the future');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        clientId: user.uid,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        location: (form.locationText || form.location || '').trim(),
        locationText: form.locationText || form.location || null,
        locationGeo: form.locationGeo || null,
        placeId: form.placeId || null,
        budget: budgetNum,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        isPrivate: true,
        targetWorkerId: workerId,
        conversationId: `profile_${user.uid}_${workerId}`,
        expiresAt: expiresAt.toISOString(),
      };
      const response = await axios.post(`${API_BASE}/api/browse-jobs`, payload);
      const days = Math.ceil((expiresAt - new Date()) / (24 * 60 * 60 * 1000));
      toast.success(`Job offer sent! It expires in ${days} day(s).`);
      if (onSuccess) onSuccess(response.data.jobId);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send job offer';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-2">Send Job Offer to {workerName || 'Worker'}</h3>
        <p className="text-sm text-muted mb-4">Only this worker will see this offer. They can accept or propose a different budget.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label"><span className="label-text">Job Title *</span></label>
            <input
              type="text"
              name="title"
              className="input input-bordered w-full"
              placeholder="e.g. Fix leaky faucet"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="label"><span className="label-text">Category *</span></label>
            <select
              name="category"
              className="select select-bordered w-full"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option disabled value="">Select Category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {categoryMismatch && (
              <p className="text-xs text-warning mt-1">
                This worker may not have listed this service. They can still respond to your offer.
              </p>
            )}
          </div>
          <div>
            <label className="label">
              <span className="label-text">Description *</span>
              <span className="label-text-alt">{wordCount}/{minWords} words min</span>
            </label>
            <textarea
              name="description"
              className="textarea textarea-bordered w-full"
              placeholder="Describe what you need..."
              value={form.description}
              onChange={handleChange}
              rows={4}
              required
            />
            {form.description && !isDescriptionValid && (
              <span className="label-text-alt text-error">{minWords - wordCount} more words required</span>
            )}
          </div>
          <div>
            <LocationPicker
              value={form.locationText || form.location || ''}
              locationGeo={form.locationGeo}
              onChange={handleLocationChange}
              placeholder="Search or pick job location"
            />
          </div>
          <div>
            <label className="label"><span className="label-text">Budget (BDT) *</span></label>
            <input
              type="number"
              name="budget"
              className="input input-bordered w-full"
              placeholder="e.g. 5000"
              value={form.budget}
              onChange={handleChange}
              min="0"
              step="100"
              required
            />
          </div>
          <div>
            <label className="label"><span className="label-text">Offer expires *</span></label>
            <input
              type="datetime-local"
              name="expiresAt"
              className="input input-bordered w-full"
              value={form.expiresAt}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
            <p className="text-xs text-muted mt-1">Default: 7 days. The worker must respond before this time.</p>
          </div>
          <div className="modal-action">
            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={submitting}>Cancel</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !isDescriptionValid || !form.title || !form.category || !(form.locationText || form.location) || !form.budget}
            >
              {submitting ? <><span className="loading loading-spinner loading-sm"></span> Sending...</> : 'Send Job Offer'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
