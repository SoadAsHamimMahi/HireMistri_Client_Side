import { useContext, useRef, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Authentication/AuthProvider';
import { FaCheckCircle, FaTimes, FaCloudUploadAlt, FaMapMarkerAlt, FaPen, FaEdit } from 'react-icons/fa';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;

export default function StepImagesReview({
  form,
  setForm,
  prevStep,
  goToStep,
  isEditMode = false,
  onSubmit,
  jobId,
  onSuccess,
}) {
  const { user } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fileInputRef = useRef(null);

  const images = form.images || [];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const existingUrls = images.filter((img) => typeof img === 'string');
    const existingFiles = images.filter((img) => img instanceof File);
    const maxNew = Math.max(0, MAX_IMAGES - existingUrls.length - existingFiles.length);
    const validFiles = [];
    for (const file of files) {
      if (validFiles.length >= maxNew) break;
      if (file.size <= MAX_FILE_SIZE_MB * 1024 * 1024) validFiles.push(file);
    }
    setForm({ ...form, images: [...existingUrls, ...existingFiles, ...validFiles] });
  };

  const removeImage = (index) => {
    setForm({ ...form, images: images.filter((_, i) => i !== index) });
  };

  const getImageSrc = (img) => {
    if (typeof img === 'string') return img;
    if (img instanceof File) return URL.createObjectURL(img);
    return '';
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('You must be logged in to ' + (isEditMode ? 'edit' : 'post') + ' a job!');
      return;
    }

    if (isEditMode && onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(form);
        setShowSuccessModal(true);
      } catch {
        // handled by parent
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);

    const sanitizeExpiresAt = (val) => {
      if (!val) return null;
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(val))) d.setHours(23, 59, 59, 999);
      return d > new Date() ? val : null;
    };

    const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    try {
      let imageUrls = [];
      if (images.length > 0) {
        const newFiles = images.filter((img) => img instanceof File);
        const existingUrls = images.filter((img) => typeof img === 'string');
        if (newFiles.length > 0) {
          const formData = new FormData();
          newFiles.forEach((file) => formData.append('images', file));
          const res = await axios.post(`${API_BASE}/api/browse-jobs/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          imageUrls = [...existingUrls, ...res.data.imageUrls];
        } else {
          imageUrls = existingUrls;
        }
      }

      await axios.post(`${API_BASE}/api/browse-jobs`, {
        clientId: user.uid,
        title: form.title,
        category: form.category,
        skills: form.skills || [],
        description: form.description,
        location: form.locationText || form.location,
        locationText: form.locationText || form.location || null,
        locationGeo: form.locationGeo || null,
        placeId: form.placeId || null,
        floorHouseNo: form.floorHouseNo || null,
        landmark: form.landmark || null,
        budget: form.budget,
        date: form.date,
        time: form.time,
        duration: form.duration,
        workersNeeded: form.workersNeeded,
        urgency: form.urgency,
        images: imageUrls,
        expiresAt: sanitizeExpiresAt(form.expiresAt),
      });

      setShowSuccessModal(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to post job:', err);
      alert('Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    window.location.href = isEditMode ? `/My-Posted-Job-Details/${jobId}` : '/dashboard';
  };

  const urgencyLabel = { Low: 'Standard', Medium: 'Urgent', High: 'Emergency' };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left — Upload */}
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
              Upload Images &amp; Review
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Add photos of the work site and confirm your job details before posting.
            </p>
          </div>

          {/* Project Images */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Project Images</h3>

            {/* Drop zone */}
            <div
              className="border-2 border-dashed border-[#1e3054] hover:border-[#1754cf]/60 rounded-xl p-6 bg-[#0e1627] text-center cursor-pointer transition-colors"
              onClick={() => images.length < MAX_IMAGES && fileInputRef.current?.click()}
            >
              <FaCloudUploadAlt className="text-4xl text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400 mb-0.5">Drag and drop images here</p>
              <p className="text-xs text-slate-600 mb-3">
                Upload up to 5 photos (Max 5MB each)
              </p>
              <button
                type="button"
                disabled={images.length >= MAX_IMAGES}
                className="bg-[#1754cf] hover:bg-blue-600 disabled:bg-[#1754cf]/30 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg px-5 py-2 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Select Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={images.length >= MAX_IMAGES}
              />
            </div>

            {/* Image slots row — 5 slots */}
            <div className="flex gap-2">
              {Array.from({ length: MAX_IMAGES }).map((_, i) => {
                const img = images[i];
                return img ? (
                  <div key={i} className="relative w-16 h-16 shrink-0 group">
                    <img
                      src={getImageSrc(img)}
                      alt={`Preview ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-[#1e3054]"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <FaTimes size={8} />
                    </button>
                    {typeof img === 'string' && (
                      <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-black/60 text-white px-1 rounded">
                        Existing
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    key={i}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 shrink-0 border border-dashed border-[#1e3054] rounded-lg flex items-center justify-center cursor-pointer hover:border-[#1754cf]/50 transition-colors text-slate-600 hover:text-slate-400"
                  >
                    <span className="text-xl">+</span>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <i className="fas fa-circle-info text-[#1754cf]" />
              Images help Mistris provide more accurate quotes. Make sure the area is well-lit.
            </p>
          </div>

          <button
            onClick={prevStep}
            className="flex items-center gap-2 text-slate-400 text-sm hover:text-white transition-colors"
          >
            <i className="fas fa-arrow-left text-xs" />
            Back
          </button>
        </div>

        {/* Right — Job Summary */}
        <div className="bg-[#111e34] border border-[#1e3054] rounded-2xl p-6 space-y-5 self-start">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Job Summary</h3>
            {goToStep && (
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="flex items-center gap-1.5 text-xs text-[#1754cf] hover:text-blue-400 font-medium transition-colors"
              >
                <FaPen size={10} />
                Edit All
              </button>
            )}
          </div>

          {/* Project Title */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Project Title
            </p>
            <p className="text-sm font-semibold text-white">
              {form.title || <span className="text-slate-500 font-normal">Not provided</span>}
            </p>
          </div>

          {/* Category + Budget side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</p>
              <p className="text-sm text-white flex items-center gap-1.5">
                <i className="fas fa-wrench text-[#1754cf] text-xs" />
                {form.category || <span className="text-slate-500">—</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Budget</p>
              <p className="text-sm font-semibold text-[#1754cf]">
                {form.budget ? `৳${form.budget}` : <span className="text-slate-500 font-normal">—</span>}
              </p>
            </div>
          </div>

          {/* Location */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location</p>
            <p className="text-sm text-white flex items-start gap-1.5">
              <FaMapMarkerAlt className="text-[#1754cf] mt-0.5 shrink-0 text-xs" />
              <span>
                {form.locationText || form.location || <span className="text-slate-500">Not provided</span>}
                {(form.floorHouseNo || form.landmark) && (
                  <span className="block text-xs text-slate-400 mt-0.5">
                    {[form.floorHouseNo, form.landmark].filter(Boolean).join(' • ')}
                  </span>
                )}
              </span>
            </p>
          </div>

          {/* Required Skills */}
          {(form.skills || []).length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {form.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-[#1754cf]/15 border border-[#1754cf]/30 text-[#a8c4ff] text-xs px-2.5 py-0.5 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">
              {form.description || <span className="text-slate-500">Not provided</span>}
            </p>
          </div>

          {/* Extra details (conditional) */}
          {(form.urgency || form.duration || form.date) && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1e3054]">
              {form.urgency && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Urgency</p>
                  <p className="text-xs text-white">{urgencyLabel[form.urgency] || form.urgency}</p>
                </div>
              )}
              {form.date && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</p>
                  <p className="text-xs text-white">{form.date}</p>
                </div>
              )}
              {form.duration && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</p>
                  <p className="text-xs text-white">{form.duration}</p>
                </div>
              )}
              {form.workersNeeded && (
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Workers</p>
                  <p className="text-xs text-white">{form.workersNeeded}</p>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 space-y-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#1754cf] hover:bg-blue-600 disabled:bg-[#1754cf]/40 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3.5 text-sm transition-colors"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEditMode ? 'Updating Job...' : 'Posting Job...'}
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  {isEditMode ? 'Update Job' : 'Submit Job'}
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-600 text-center">
              By submitting, you agree to our{' '}
              <a href="/terms" className="text-slate-400 hover:text-white underline underline-offset-2">
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c2e] border border-[#1e3054] rounded-2xl w-full max-w-sm mx-auto p-6 sm:p-7 text-center shadow-2xl">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#1754cf]/20 flex items-center justify-center mb-4">
              <FaCheckCircle className="text-[#1754cf] text-3xl" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {isEditMode ? 'Job Updated Successfully!' : 'Job Posted Successfully!'}
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {isEditMode
                ? 'Your job has been updated and changes are now visible to workers.'
                : 'Your job has been posted and is now visible to workers. You can manage it from your dashboard.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={closeSuccessModal}
                className="bg-[#1754cf] hover:bg-blue-600 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="border border-[#1e3054] hover:border-[#1754cf]/50 text-slate-300 hover:text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-colors"
              >
                Stay Here
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
