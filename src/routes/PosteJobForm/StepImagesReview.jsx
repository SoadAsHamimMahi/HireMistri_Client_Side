import { useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Authentication/AuthProvider';

export default function StepImagesReview({ form, setForm, prevStep }) {
  const { user } = useContext(AuthContext); 

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setForm({ ...form, images: files });
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("You must be logged in to post a job!");
      return;
    }

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

      alert("✅ Job successfully posted with image upload!");
    } catch (err) {
      console.error("❌ Failed to post job:", err);
      alert("❌ Failed to post job. Please try again.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Section */}
        <div className="space-y-6">
          <p className="text-sm text-gray-500 font-medium">5/5 Final Review</p>
          <h2 className="text-3xl font-bold leading-snug text-gray-900">
            Upload Images & Review
          </h2>
          <p className="text-gray-600">
            Upload any reference images and confirm the details before posting.
          </p>

          {/* Image Upload */}
          <div>
            <label className="font-medium text-gray-700">Upload Reference Images</label>
            <input
              type="file"
              multiple
              className="file-input file-input-bordered w-full mt-2"
              onChange={handleImageChange}
            />
          </div>

          <button onClick={prevStep} className="btn btn-outline mt-4">Back</button>
        </div>

        {/* Right Section: Preview */}
        <div className="bg-gray-50 rounded-xl shadow p-6 border">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">📝 Job Summary</h3>
          <ul className="space-y-2 text-sm text-gray-700">
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
            className="btn bg-green-600 hover:bg-green-700 text-white w-full mt-6"
          >
            ✅ Submit Job
          </button>
        </div>
      </div>
    </div>
  );
}
