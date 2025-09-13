import { useContext, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Authentication/AuthProvider';
import { useTheme } from '../../contexts/ThemeContext';

export default function StepImagesReview({ form, setForm, prevStep }) {
  const { isDarkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setForm({ ...form, images: files });
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("You must be logged in to post a job!");
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ First: Upload images
      const formData = new FormData();
      form.images.forEach((file) => {
        formData.append("images", file);
      });

      const uploadRes = await axios.post(
        "http://localhost:5000/api/browse-jobs/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const imageUrls = uploadRes.data.imageUrls; // ✅ Get image URLs from backend

      // ✅ Second: Save job data with image URLs
      await axios.post("http://localhost:5000/api/browse-jobs", {
        clientId: user.uid,
        title: form.title,
        category: form.category,
        skills: form.skills,
        description: form.description,
        location: form.location,
        budget: form.budget,
        date: form.date,
        time: form.time,
        images: imageUrls, // ✅ store URLs
      });

      // Show success modal
      setShowSuccessModal(true);
    } catch (err) {
      console.error("❌ Failed to post job:", err);
      alert("❌ Failed to post job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    // Reset form or redirect to dashboard
    window.location.href = '/dashboard';
  };

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Section */}
        <div className="space-y-6">
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>5/5 Final Review</p>
          <h2 className={`text-3xl font-bold leading-snug ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Upload Images & Review
          </h2>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Upload any reference images and confirm the details before posting.
          </p>

          {/* Image Upload */}
          <div>
            <label className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Upload Reference Images</label>
            <input
              type="file"
              multiple
              className={`file-input file-input-bordered w-full mt-2 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              onChange={handleImageChange}
            />
          </div>

          <button onClick={prevStep} className={`btn btn-outline mt-4 ${isDarkMode ? 'text-white border-white hover:bg-white hover:text-gray-900' : ''}`}>Back</button>
        </div>

        {/* Right Section: Preview */}
        <div className={`rounded-xl shadow p-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>📝 Job Summary</h3>
          <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <li><strong>Title:</strong> {form.title}</li>
            <li><strong>Category:</strong> {form.category}</li>
            <li><strong>Skills:</strong> {form.skills.join(', ')}</li>
            <li><strong>Description:</strong> {form.description}</li>
            <li><strong>Location:</strong> {form.location}</li>
            <li><strong>Budget:</strong> ৳{form.budget}</li>
            <li><strong>Date & Time:</strong> {form.date} at {form.time}</li>
            <li><strong>Images:</strong> {form.images.length} file(s)</li>
          </ul>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn bg-green-600 hover:bg-green-700 text-white w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Posting Job...
              </>
            ) : (
              '✅ Submit Job'
            )}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-xl shadow-2xl p-8 max-w-md mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              {/* Success Message */}
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Job Posted Successfully!
              </h3>
              <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Your job has been posted and is now visible to workers. You can manage it from your dashboard.
              </p>
              
              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={closeSuccessModal}
                  className="btn bg-green-600 hover:bg-green-700 text-white px-6"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className={`btn btn-outline ${isDarkMode ? 'text-white border-white hover:bg-white hover:text-gray-900' : ''}`}
                >
                  Stay Here
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}