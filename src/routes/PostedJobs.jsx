import { useEffect, useState } from 'react';
import jobsData from '../FakeData/fake_posted_jobs.json';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function PostedJobs() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    setJobs(jobsData);
  }, []);

  const filteredJobs = filter === 'all' ? jobs : jobs.filter((job) => job.status === filter);
  const openModal = (job) => setSelectedJob(job);
  const closeModal = () => setSelectedJob(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-8 text-primary">📋 My Posted Jobs</h1>

      {/* Filter Tabs */}
      <div className="tabs tabs-boxed justify-center mb-8">
        {['all', 'active', 'in-progress', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`tab ${filter === status ? 'tab-active' : ''} capitalize`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Job List */}
      <div className="space-y-8">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white shadow-lg border rounded-xl overflow-hidden flex flex-col md:flex-row">
            {/* Left: Image Slider */}
            <div className="md:w-2/5 w-full">
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                className="h-full"
              >
                {job.images.map((img, idx) => (
                  <SwiperSlide key={idx}>
                    <img
                      src={img}
                      alt={`Job ${job.id}`}
                      className="object-cover w-full h-60 md:h-full"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Right: Job Details */}
            <div className="md:w-3/5 w-full p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-3xl font-bold text-gray-800 mb-3">{job.title}</h3>
                <div className="text-xl text-gray-700 space-y-1 mb-4 leading-relaxed">
                  <p><span className="font-semibold text-gray-800">📂 Category:</span> {job.category}</p>
                  <p><span className="font-semibold text-gray-800">📍 Location:</span> <span className="text-gray-600">{job.location}</span></p>
                  <p><span className="font-semibold text-gray-800">💰 Budget:</span> <span className="text-green-600 font-medium">{job.budget} ৳</span></p>
                  <p><span className="font-semibold text-gray-800">🗓️ Date:</span> <span className="text-gray-500">{job.date}</span></p>
                </div>

                {/* Applicants */}
                <div>
                  <p className="font-semibold text-sm mb-2">👷 Applicants:</p>
                  {job.applicants.length > 0 ? (
                    <div className="space-y-1">
                      {job.applicants.map((a, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-gray-100 px-3 py-1 rounded-md border"
                        >
                          <span className="font-medium">{a.name}</span>
                          <span className="text-sm text-gray-700">
                            <span className="text-green-600 font-semibold">৳{a.price}</span> | ⭐ {a.rating}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">❌ No applicants yet.</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex gap-3">
                <button className="btn btn-outline">Edit</button>
                <button className="btn  btn-error text-white text-xl">Delete</button>
                <button className="btn bg-green-500 text-white text-xl" onClick={() => openModal(job)}>
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Job Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
          <div className="bg-white w-11/12 md:w-2/3 lg:w-1/2 p-6 rounded-lg shadow-lg relative">
            <button className="absolute top-2 right-2 text-xl" onClick={closeModal}>✖</button>
            <h2 className="text-xl font-bold mb-4">{selectedJob.title}</h2>
            <p><strong>Category:</strong> {selectedJob.category}</p>
            <p><strong>Location:</strong> {selectedJob.location}</p>
            <p><strong>Budget:</strong> ৳{selectedJob.budget}</p>
            <p><strong>Status:</strong> {selectedJob.status}</p>
            <p><strong>Date:</strong> {selectedJob.date}</p>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">Applicants:</h3>
              {selectedJob.applicants.length > 0 ? (
                <ul className="list-disc pl-5 text-sm space-y-1">
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
