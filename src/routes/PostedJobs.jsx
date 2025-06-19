// src/routes/PostedJobs.jsx
import { useEffect, useState } from 'react';
import jobsData from '../FakeData/fake_posted_jobs.json';

export default function PostedJobs() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    setJobs(jobsData);
  }, []);

  const filteredJobs =
    filter === 'all' ? jobs : jobs.filter((job) => job.status === filter);

  const openModal = (job) => setSelectedJob(job);
  const closeModal = () => setSelectedJob(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">📋 Your Posted Jobs</h1>

      {/* Filter Buttons */}
      <div className="flex gap-4 justify-center mb-6">
        {['all', 'active', 'in-progress', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`btn btn-sm ${
              filter === status ? 'btn-primary' : 'btn-outline'
            } capitalize`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div className="space-y-6">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="flex flex-col md:flex-row gap-4 bg-white shadow-md rounded-lg p-4 border"
          >
            {/* Left: Images */}
            <div className="flex gap-2 overflow-x-auto md:w-1/3">
              {job.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Job ${job.id}`}
                  className="w-36 h-24 object-cover rounded border"
                />
              ))}
            </div>

            {/* Right: Info */}
            <div className="md:w-2/3 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{job.title}</h3>
                <p className="text-sm text-gray-600 mb-1">📂 {job.category}</p>
                <p className="text-sm text-gray-600 mb-1">📍 {job.location}</p>
                <p className="text-sm text-gray-600 mb-1">💰 ৳{job.budget}</p>
                <p className="text-sm text-gray-500 mb-2">🗓️ {job.date}</p>

                {/* Applicants */}
                {job.applicants.length > 0 ? (
                  <div className="bg-gray-50 p-2 rounded border mt-2">
                    <p className="font-medium mb-1">👷 Applicants:</p>
                    <ul className="space-y-1 text-sm">
                      {job.applicants.map((a, i) => (
                        <li key={i}>
                          ✅ {a.name} – ৳{a.price} – ⭐ {a.rating}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">❌ No applicants yet.</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <button className="btn btn-sm btn-outline">Edit</button>
                <button className="btn btn-sm btn-error text-white">Delete</button>
                <button className="btn btn-sm btn-info text-white" onClick={() => openModal(job)}>
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 lg:w-1/2 p-6 relative">
            <button
              className="absolute top-2 right-2 text-lg"
              onClick={closeModal}
            >
              ✖
            </button>
            <h2 className="text-2xl font-bold mb-4">{selectedJob.title}</h2>
            <p><strong>Category:</strong> {selectedJob.category}</p>
            <p><strong>Location:</strong> {selectedJob.location}</p>
            <p><strong>Budget:</strong> ৳{selectedJob.budget}</p>
            <p><strong>Status:</strong> {selectedJob.status}</p>
            <p><strong>Date:</strong> {selectedJob.date}</p>

            <div className="mt-4">
              <h3 className="font-semibold mb-1">Applicants:</h3>
              {selectedJob.applicants.length > 0 ? (
                <ul className="list-disc list-inside text-sm">
                  {selectedJob.applicants.map((a, i) => (
                    <li key={i}>
                      {a.name} – ৳{a.price} – ⭐ {a.rating}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No applicants yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
