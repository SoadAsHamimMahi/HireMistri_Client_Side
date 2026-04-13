import { useContext, useRef, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Authentication/AuthProvider';
import { FaCheckCircle, FaTimes, FaCloudUploadAlt, FaMapMarkerAlt, FaPen, FaEdit, FaInfoCircle, FaArrowLeft, FaWrench, FaTools, FaAngleLeft, FaPaperPlane } from 'react-icons/fa';

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full mx-auto items-start">
        {/* Left — Upload */}
        <div className="space-y-8">
          <div>
            <p className="text-xs font-black text-[#0a58ca] uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
              <span className="w-10 h-0.5 bg-[#0a58ca]"></span>
              Step 5 of 5
            </p>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-6">
              Final <span className="text-[#0a58ca]">Review</span>
            </h2>
            <p className="text-gray-900 leading-relaxed font-medium">
              Upload site photos and verify all details to ensure you get 
              the best possible quotes from our Mistris.
            </p>
          </div>

          {/* Project Images */}
          <div className="space-y-5 bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-blue-500/[0.03]">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest px-1">Project Images</h3>

            {/* Drop zone */}
            <div
              className="border-2 border-dashed border-blue-100 hover:border-[#0a58ca] hover:bg-blue-50/30 rounded-3xl p-8 text-center cursor-pointer transition-all group"
              onClick={() => images.length < MAX_IMAGES && fileInputRef.current?.click()}
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0a58ca] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FaCloudUploadAlt size={24} />
              </div>
              <p className="text-sm font-black text-gray-900 mb-1">Upload Photo Site</p>
              <p className="text-xs text-gray-900 font-bold uppercase tracking-wider mb-6">
                Up to 5 photos • Max 5MB each
              </p>
              <button
                type="button"
                disabled={images.length >= MAX_IMAGES}
                className="bg-white border border-gray-200 hover:border-[#0a58ca] hover:text-[#0a58ca] disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-xl px-6 py-3 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Choose Photos
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
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {Array.from({ length: MAX_IMAGES }).map((_, i) => {
                const img = images[i];
                return img ? (
                  <div key={i} className="relative w-20 h-20 shrink-0 group">
                    <img
                      src={getImageSrc(img)}
                      alt={`Preview ${i + 1}`}
                      className="w-full h-full object-cover rounded-2xl border-2 border-white shadow-md"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                      aria-label="Remove image"
                    >
                      <FaTimes size={10} />
                    </button>
                    {typeof img === 'string' && (
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-black uppercase tracking-tighter bg-[#0a58ca] text-white px-2 py-0.5 rounded-lg shadow-sm">
                        Saved
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    key={i}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 shrink-0 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center cursor-pointer hover:border-[#0a58ca] hover:bg-blue-50/20 transition-all text-gray-200 hover:text-[#0a58ca]"
                  >
                    <span className="text-2xl">+</span>
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 flex items-start gap-3">
              <FaInfoCircle className="text-[#0a58ca] mt-0.5" size={12} />
              <p className="text-xs font-bold text-gray-900 italic leading-relaxed">
                Clear photos help Mistris provide more accurate quotes. Make sure the problem area is well-lit and clearly visible.
              </p>
            </div>
          </div>

          <button
            onClick={prevStep}
            className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-[#0a58ca] transition-colors"
          >
            <FaAngleLeft size={12} />
            Check Details
          </button>
        </div>

        {/* Right — Job Summary */}
        <div className="bg-white rounded-[2rem] p-8 lg:p-10 border-2 border-[#0a58ca]/10 shadow-2xl shadow-blue-500/[0.05] space-y-8 self-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[4rem] -z-10 opacity-50" />
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-5">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.15em]">Job Confirmation</h3>
            {goToStep && (
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="flex items-center gap-2 text-xs font-black text-[#0a58ca] uppercase tracking-widest hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all"
              >
                <FaEdit size={12} />
                Edit All
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Project Title */}
            <div>
              <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Project Title</p>
              <p className="text-xl font-black text-gray-900 leading-tight">
                {form.title || <span className="text-gray-300 italic">Not provided</span>}
              </p>
            </div>

            {/* Category + Budget side by side */}
            <div className="grid grid-cols-2 gap-6 bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
              <div>
                <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Category</p>
                <p className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[#0a58ca] shadow-sm">
                    <FaWrench size={10} />
                  </div>
                  {form.category || <span className="text-gray-300">—</span>}
                </p>
              </div>
              <div>
                <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Estimated Budget</p>
                <p className="text-sm font-black text-[#0a58ca] shadow-blue-500/10">
                  {form.budget ? `৳${form.budget}` : <span className="text-gray-300">—</span>}
                </p>
              </div>
            </div>

            {/* Location */}
            <div>
              <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">Target Location</p>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#0a58ca] shrink-0">
                  <FaMapMarkerAlt size={12} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700 leading-relaxed">
                    {form.locationText || form.location || <span className="text-gray-300">Not provided</span>}
                  </p>
                  {(form.floorHouseNo || form.landmark) && (
                    <p className="text-xs font-bold text-gray-900 mt-1 italic">
                      {[form.floorHouseNo, form.landmark].filter(Boolean).join(' • ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Required Skills */}
            {(form.skills || []).length > 0 && (
              <div>
                <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">Required Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-gray-50 border border-gray-100 text-gray-600 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">Detailed Scope</p>
              <div className="bg-gray-50/30 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-4">
                  {form.description || <span className="text-gray-300 italic">Not provided</span>}
                </p>
              </div>
            </div>

            {/* Grid for minor details */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {[
                { label: 'Urgency', value: urgencyLabel[form.urgency] || form.urgency },
                { label: 'Start Date', value: form.date },
                { label: 'Active For', value: form.duration },
                { label: 'Workers', value: form.workersNeeded },
              ].filter(d => d.value).map((item, idx) => (
                <div key={idx} className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
                   <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">{item.label}</p>
                   <p className="text-[11px] font-black text-gray-700">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-6 space-y-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 bg-[#0a58ca] hover:bg-[#084298] disabled:bg-gray-100 disabled:text-gray-300 text-white font-black rounded-2xl py-5 text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FaPaperPlane size={14} className="-rotate-45 -translate-y-0.5" />
                  {isEditMode ? 'Update Job Post' : 'Post Job Now'}
                </>
              )}
            </button>
            <p className="text-xs font-bold text-gray-900 text-center uppercase tracking-widest">
              Review and confirm before submitting.
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in transition-all duration-500">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm mx-auto p-10 text-center shadow-2xl border border-gray-100 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="mx-auto w-24 h-24 rounded-[2rem] bg-blue-50 flex items-center justify-center mb-8 shadow-inner">
              <div className="w-16 h-16 rounded-2xl bg-[#0a58ca] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                <FaCheckCircle className="text-3xl" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
              {isEditMode ? 'Job Updated!' : 'Mission Success!'}
            </h3>
            <p className="text-gray-500 text-sm font-medium mb-10 leading-relaxed px-2">
              {isEditMode
                ? 'Your updates have been deployed. All Mistris will see the corrected details immediately.'
                : 'Your job post has been broadcasted to our network of professional Mistris.'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={closeSuccessModal}
                className="w-full bg-[#0a58ca] hover:bg-[#084298] text-white font-black rounded-2xl py-4 text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full border border-gray-100 hover:border-blue-100 text-gray-400 hover:text-[#0a58ca] font-black rounded-2xl py-4 text-xs uppercase tracking-widest transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
