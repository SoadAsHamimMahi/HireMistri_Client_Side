import { useContext, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Authentication/AuthProvider';
import { FaImage, FaArrowLeft, FaCheckCircle, FaFileImage, FaTimes } from 'react-icons/fa';

export default function StepImagesReview({ form, setForm, prevStep, isEditMode = false, onSubmit, jobId, onSuccess }) {
  const { user } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // In edit mode, images might be URLs, so we need to handle both
    const existingImages = (form.images || []).filter(img => typeof img === 'string');
    const newFiles = files;
    setForm({ ...form, images: [...existingImages, ...newFiles] });
  };

  const removeImage = (index) => {
    const newImages = (form.images || []).filter((_, i) => i !== index);
    setForm({ ...form, images: newImages });
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("You must be logged in to " + (isEditMode ? "edit" : "post") + " a job!");
      return;
    }

    // If custom onSubmit is provided (for edit mode), use it
    if (isEditMode && onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(form);
        setShowSuccessModal(true);
      } catch (err) {
        // Error handling is done in parent component
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Original submit logic for creating new jobs
    setIsSubmitting(true);

    try {
      // First: Upload images if any
      let imageUrls = [];
      if (form.images && form.images.length > 0) {
        // Filter out URLs (existing images) and only upload new files
        const newImageFiles = form.images.filter(img => img instanceof File);
        const existingImageUrls = form.images.filter(img => typeof img === 'string');
        
        if (newImageFiles.length > 0) {
          const formData = new FormData();
          newImageFiles.forEach((file) => {
            formData.append("images", file);
          });

          const uploadRes = await axios.post(
            "http://localhost:5000/api/browse-jobs/upload",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );

          imageUrls = [...existingImageUrls, ...uploadRes.data.imageUrls];
        } else {
          imageUrls = existingImageUrls;
        }
      }

      const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
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
        budget: form.budget,
        date: form.date,
        time: form.time,
        duration: form.duration,
        workersNeeded: form.workersNeeded,
        urgency: form.urgency,
        images: imageUrls,
        expiresAt: form.expiresAt || null,
      });

      // Show success modal
      setShowSuccessModal(true);
      // Clear draft on success
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Failed to post job:", err);
      alert("Failed to post job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    if (isEditMode) {
      // For edit mode, navigate will be handled by parent
      window.location.href = `/My-Posted-Job-Details/${jobId}`;
    } else {
      window.location.href = '/dashboard';
    }
  };

  const images = form.images || [];
  
  // Helper to check if image is a URL or File
  const getImageSrc = (img) => {
    if (typeof img === 'string') return img; // URL
    if (img instanceof File) return URL.createObjectURL(img); // File
    return '';
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Section - Image Upload */}
        <div className="card bg-base-200 shadow-sm border border-base-300">
          <div className="card-body p-6 lg:p-8 space-y-6">
            <div>
              <p className="text-sm font-medium text-base-content opacity-60 mb-2">Step 6 of 6</p>
              <h2 className="text-3xl lg:text-4xl font-bold leading-snug text-base-content mb-4">
                Upload Images & Review
              </h2>
              <p className="text-base-content opacity-70 leading-relaxed">
                Upload any reference images and confirm the details before posting.
              </p>
            </div>

            {/* Image Upload Area */}
            <div className="space-y-4">
              <label className="block font-semibold text-base-content opacity-80">
                Upload Reference Images (Optional)
              </label>
              <div className="border-2 border-dashed border-base-300 rounded-lg p-6 bg-base-100 hover:border-primary transition-colors">
                <div className="flex flex-col items-center justify-center text-center">
                  <FaImage className="text-4xl text-base-content opacity-50 mb-3" />
                  <p className="text-sm text-base-content opacity-70 mb-2">
                    Drag and drop images here, or click to browse
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="file-input file-input-bordered file-input-primary w-full max-w-xs"
                    onChange={handleImageChange}
                  />
                  <p className="text-xs text-base-content opacity-60 mt-2">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-base-content opacity-80">
                    {isEditMode ? 'Current Images' : 'Selected Images'} ({images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={getImageSrc(img)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-base-300"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove image"
                        >
                          <FaTimes />
                        </button>
                        {typeof img === 'string' && (
                          <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1 rounded">
                            Existing
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="btn btn-outline w-32" onClick={prevStep}>
              <FaArrowLeft className="mr-2" />
              Back
            </button>
          </div>
        </div>

        {/* Right Section - Job Summary */}
        <div className="card bg-base-200 shadow-sm border border-base-300">
          <div className="card-body p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FaFileImage className="text-primary" />
              <h3 className="text-xl font-semibold text-base-content">Job Summary</h3>
            </div>

            <div className="bg-base-100 rounded-lg p-4 border border-base-300 space-y-3">
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold text-base-content opacity-60">Title</span>
                  <p className="text-sm text-base-content">{form.title || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-base-content opacity-60">Category</span>
                  <p className="text-sm text-base-content">{form.category || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-base-content opacity-60">Skills</span>
                  <p className="text-sm text-base-content">
                    {(form.skills || []).length > 0 ? form.skills.join(', ') : 'Not provided'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-base-content opacity-60">Description</span>
                  <p className="text-sm text-base-content line-clamp-3">
                    {form.description || 'Not provided'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-base-content opacity-60">Location</span>
                  <p className="text-sm text-base-content">{form.locationText || form.location || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-base-content opacity-60">Budget</span>
                  <p className="text-sm font-semibold text-primary">
                    {form.budget ? `৳${form.budget}` : 'Not provided'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-base-content opacity-60">Date & Time</span>
                  <p className="text-sm text-base-content">
                    {form.date && form.time
                      ? `${form.date} at ${form.time}`
                      : 'Not provided'}
                  </p>
                </div>
                {form.duration && (
                  <div>
                    <span className="text-xs font-semibold text-base-content opacity-60">Duration</span>
                    <p className="text-sm text-base-content">{form.duration}</p>
                  </div>
                )}
                {form.workersNeeded && (
                  <div>
                    <span className="text-xs font-semibold text-base-content opacity-60">Workers Needed</span>
                    <p className="text-sm text-base-content">{form.workersNeeded}</p>
                  </div>
                )}
                {form.urgency && (
                  <div>
                    <span className="text-xs font-semibold text-base-content opacity-60">Urgency</span>
                    <p className="text-sm text-base-content">{form.urgency}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs font-semibold text-base-content opacity-60">Images</span>
                  <p className="text-sm text-base-content">{images.length} file(s)</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn-primary btn-lg w-full"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  {isEditMode ? 'Updating Job...' : 'Posting Job...'}
                </>
              ) : (
                <>
                  <FaCheckCircle className="mr-2" />
                  {isEditMode ? 'Update Job' : 'Submit Job'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card bg-base-200 shadow-2xl max-w-md w-full border border-base-300">
            <div className="card-body text-center p-8">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-primary/20 mb-4">
                <FaCheckCircle className="h-10 w-10 text-primary" />
              </div>

              {/* Success Message */}
              <h3 className="text-2xl font-bold mb-2 text-base-content">
                {isEditMode ? 'Job Updated Successfully!' : 'Job Posted Successfully!'}
              </h3>
              <p className="mb-6 text-base-content opacity-70">
                {isEditMode 
                  ? 'Your job has been updated and changes are now visible to workers.'
                  : 'Your job has been posted and is now visible to workers. You can manage it from your dashboard.'}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button onClick={closeSuccessModal} className="btn btn-primary">
                  Go to Dashboard
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="btn btn-outline"
                >
                  Stay Here
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}