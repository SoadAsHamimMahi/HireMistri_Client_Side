import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ShareButton from '../components/ShareButton';

// Delete Job Button Component
function DeleteJobButton({ jobId, jobTitle, onDelete }) {
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await axios.delete(`${base}/api/browse-jobs/${jobId}`);
      setShowModal(false);
      if (onDelete) {
        onDelete();
      } else {
        navigate('/My-Posted-Jobs');
      }
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert(err.response?.data?.error || 'Failed to delete job. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button 
        className="btn btn-sm btn-error"
        onClick={() => setShowModal(true)}
      >
        🗑️
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-base-200 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-base-300">
            <h3 className="text-xl font-bold mb-4 text-base-content">Delete Job</h3>
            <p className="text-base-content opacity-70 mb-6">
              Are you sure you want to delete "{jobTitle}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="btn btn-outline"
                onClick={() => setShowModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-error text-white"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PostedJobs() {
  const { isDarkMode } = useTheme();
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const auth = useContext(AuthContext);
  const currentUser = auth?.user ?? null;
  const clientId = currentUser?.uid || null;

  useEffect(() => {
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    // Fetch all jobs for client including completed ones
    const url = clientId
      ? `${base}/api/browse-jobs?clientId=${encodeURIComponent(clientId)}&status=all`
      : `${base}/api/browse-jobs`;

    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        setErr('');

        const res = await fetch(url, { headers: { Accept: 'application/json' } });

        if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`);

        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Expected JSON, got '${ct}'. First bytes: ${text.slice(0, 80)}`);
        }

        const data = await res.json();
        if (ignore) return;

        const normalized = (Array.isArray(data) ? data : []).map((j) => {
          // Extract MongoDB _id properly
          let mongoId = null;
          if (j._id) {
            if (typeof j._id === 'string') {
              mongoId = j._id;
            } else if (j._id.$oid) {
              mongoId = j._id.$oid;
            } else if (j._id.toString) {
              mongoId = j._id.toString();
            }
          }
          
          return {
            ...j,
            id: j.id ?? mongoId ?? String(j._id || ''),
            mongoId: mongoId || j.id || String(j._id || ''),
            images: j.images || [],
            applicants: j.applicants || [],
            status: j.status || 'active',
          };
        });

        setJobs(normalized);
      } catch (e) {
        // Ignore AbortError noise from StrictMode
        if (e?.name !== 'AbortError') {
          setErr(e.message || 'Failed to load jobs');
          console.error(e);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [clientId]);

  const filteredJobs =
    filter === 'all'
      ? jobs
      : jobs.filter((job) => {
          const jobStatus = String(job.status || 'active').toLowerCase();
          const filterStatus = String(filter).toLowerCase();
          // Handle 'in-progress' vs 'in progress' variations
          if (filterStatus === 'in-progress' || filterStatus === 'in progress') {
            return jobStatus === 'in-progress' || jobStatus === 'in progress';
          }
          return jobStatus === filterStatus;
        });

  // Handle status change
  const handleStatusChange = async (jobId, newStatus) => {
    // Show confirmation for destructive status changes
    if (newStatus === 'cancelled' || newStatus === 'completed') {
      const confirmed = window.confirm(
        `Are you sure you want to mark this job as ${newStatus}? This action may affect active applications.`
      );
      if (!confirmed) return;
    }

    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      const response = await fetch(`${base}/api/browse-jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          clientId: clientId
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update status');
      }

      // Update local state
      setJobs(prevJobs =>
        prevJobs.map(j =>
          (j.mongoId || j.id) === jobId
            ? { ...j, status: newStatus }
            : j
        )
      );

      // Refresh jobs list to ensure we have all statuses
      const refreshResponse = await fetch(`${base}/api/browse-jobs?clientId=${encodeURIComponent(clientId)}&status=all`, {
        headers: { Accept: 'application/json' }
      });
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const normalized = (Array.isArray(refreshData) ? refreshData : []).map((j) => {
          let mongoId = null;
          if (j._id) {
            if (typeof j._id === 'string') {
              mongoId = j._id;
            } else if (j._id.$oid) {
              mongoId = j._id.$oid;
            } else if (j._id.toString) {
              mongoId = j._id.toString();
            }
          }
          return {
            ...j,
            id: j.id ?? mongoId ?? String(j._id || ''),
            mongoId: mongoId || j.id || String(j._id || ''),
            images: j.images || [],
            applicants: j.applicants || [],
            status: j.status || 'active',
          };
        });
        setJobs(normalized);
      }
    } catch (err) {
      console.error('Failed to update job status:', err);
      alert(err.message || 'Failed to update job status. Please try again.');
    }
  };

  // Calculate stats for header
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(job => String(job.status || 'active').toLowerCase() === 'active').length;
  const inProgressJobs = jobs.filter(job => {
    const status = String(job.status || '').toLowerCase();
    return status === 'in-progress' || status === 'in progress';
  }).length;
  const completedJobs = jobs.filter(job => String(job.status || '').toLowerCase() === 'completed').length;
  const totalApplicants = jobs.reduce((sum, job) => sum + (job.applicants?.length || 0), 0);

  // Filter options with counts
  const filterOptions = [
    { key: 'all', label: 'All Jobs', count: totalJobs, icon: '📋' },
    { key: 'active', label: 'Active', count: activeJobs, icon: '🟢' },
    { key: 'in-progress', label: 'In Progress', count: inProgressJobs, icon: '🟡' },
    { key: 'completed', label: 'Completed', count: completedJobs, icon: '🔵' }
  ];

  const getStatusColor = (status) => {
    switch (String(status).toLowerCase()) {
      case 'active':
        return 'badge-success';
      case 'in-progress':
        return 'badge-warning';
      case 'completed':
        return 'badge-info';
      default:
        return 'badge-neutral';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen page-bg transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="text-center mb-8">
            <div className="h-12 w-64 mx-auto rounded-lg mb-4 bg-base-300 animate-pulse"></div>
            <div className="h-6 w-96 mx-auto rounded bg-base-300 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-base-200">
                <div className="h-48 bg-base-300 animate-pulse"></div>
                <div className="p-6">
                  <div className="h-6 w-3/4 rounded mb-2 bg-base-300 animate-pulse"></div>
                  <div className="h-4 w-1/2 rounded mb-4 bg-base-300 animate-pulse"></div>
                  <div className="h-8 w-full rounded bg-base-300 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center page-bg">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold mb-2 text-base-content">Oops! Something went wrong</h2>
          <p className="text-lg opacity-70">{err}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg transition-colors duration-300">
      {/* Enhanced Header Section */}
      <div className="relative overflow-hidden bg-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          {/* Header Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-base-content">
              📋 My Posted Jobs
            </h1>
            <p className="text-lg opacity-70">
              Manage your job postings and track applications
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card bg-base-300 border border-base-300 rounded-xl p-4 text-center transition-all duration-300 hover:scale-105">
              <div className="text-2xl font-bold text-base-content">{totalJobs}</div>
              <div className="text-sm opacity-70">Total Jobs</div>
            </div>
            <div className="card bg-base-300 border border-base-300 rounded-xl p-4 text-center transition-all duration-300 hover:scale-105">
              <div className="text-2xl font-bold text-primary">{activeJobs}</div>
              <div className="text-sm opacity-70">Active</div>
            </div>
            <div className="card bg-base-300 border border-base-300 rounded-xl p-4 text-center transition-all duration-300 hover:scale-105">
              <div className="text-2xl font-bold text-warning">{inProgressJobs}</div>
              <div className="text-sm opacity-70">In Progress</div>
            </div>
            <div className="card bg-base-300 border border-base-300 rounded-xl p-4 text-center transition-all duration-300 hover:scale-105">
              <div className="text-2xl font-bold text-info">{totalApplicants}</div>
              <div className="text-sm opacity-70">Total Applicants</div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Link 
              to="/post-job" 
              className="btn btn-primary btn-lg gap-2"
            >
              <span className="text-xl">➕</span>
              Post New Job
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">

        {/* Modern Filter System */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                className={`btn ${filter === option.key ? 'btn-primary' : 'btn-outline'} gap-2`}
              >
                <span className="text-lg">{option.icon}</span>
                <span>{option.label}</span>
                <span className="badge badge-sm">{option.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Job Cards */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">📋</div>
            <h3 className="text-2xl font-bold mb-4 text-base-content">
              {filter === 'all' ? 'No jobs posted yet' : `No ${filter} jobs found`}
            </h3>
            <p className="text-lg mb-8 opacity-70">
              {filter === 'all' 
                ? 'Start by posting your first job to find skilled workers' 
                : `Try switching to a different filter or post a new job`
              }
            </p>
            {filter === 'all' && (
              <Link 
                to="/post-job" 
                className="btn btn-primary btn-lg gap-2"
              >
                <span className="text-xl">➕</span>
                Post Your First Job
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="card bg-base-200 border border-base-300 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-2"
            >
              {/* Enhanced Image Section */}
              <div className="relative h-48 overflow-hidden">
                {/* Status Badge Overlay */}
                <div className="absolute top-4 left-4 z-10">
                  <span className={`badge ${getStatusColor(job.status)} gap-1`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                    {job.status}
                  </span>
                </div>
                
                {/* Urgency Badge */}
                {job.applicants?.length > 5 && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="badge badge-warning gap-1">
                      🔥 Hot Job
                    </span>
                  </div>
                )}

                <Swiper modules={[Navigation, Pagination]} navigation pagination={{ clickable: true }} className="h-full">
                  {(job.images || []).map((img, idx) => (
                    <SwiperSlide key={idx}>
                      <img src={img} alt={`Job ${job.id}`} className="object-cover w-full h-48 transition-transform duration-500 group-hover:scale-110" />
                    </SwiperSlide>
                  ))}
                </Swiper>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Enhanced Job Content */}
              <div className="card-body">
                <div>
                  <h3 className="card-title line-clamp-2">
                    {job.title}
                  </h3>
                  <p className="text-sm opacity-70 mb-4">
                    {job.category}
                  </p>

                  {/* Enhanced Details Grid */}
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm opacity-80">
                      <span className="text-lg">📍</span>
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm opacity-80">
                      <span className="text-lg">💰</span>
                      <span className="font-bold text-primary">
                        {job.budget} ৳
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm opacity-80">
                      <span className="text-lg">🗓️</span>
                      <span>{job.date}</span>
                    </div>
                    {job.expiresAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-lg">⏰</span>
                        <span className={new Date(job.expiresAt) <= new Date() ? 'text-error font-semibold' : new Date(job.expiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-warning font-semibold' : 'opacity-80'}>
                          Expires: {new Date(job.expiresAt).toLocaleDateString()}
                          {new Date(job.expiresAt) > new Date() && (
                            <span className="ml-1 text-xs">
                              ({Math.ceil((new Date(job.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))} days left)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Applicants Section */}
                  <div className="card bg-base-300 p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👷</span>
                        <span className="text-sm font-medium opacity-80">
                          Applicants
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-info">
                          {job.applicants?.length || 0}
                        </span>
                        {job.applicants?.length > 0 && (
                          <div className="flex -space-x-2">
                            {job.applicants.slice(0, 3).map((applicant, idx) => (
                              <div key={idx} className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-secondary border-2 border-base-100"></div>
                            ))}
                            {job.applicants.length > 3 && (
                              <div className="w-6 h-6 rounded-full border-2 border-base-100 bg-base-300 flex items-center justify-center text-xs font-bold">
                                +{job.applicants.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-base-content opacity-70 mb-1">
                    Status
                  </label>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={job.status || 'active'}
                    onChange={(e) => handleStatusChange(job.mongoId || job.id, e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="card-actions justify-end gap-2">
                  <ShareButton
                    jobId={job.mongoId || job.id}
                    jobTitle={job.title}
                    jobDescription={job.description}
                    isClient={true}
                  />
                  <Link 
                    to={`/edit-job/${job.mongoId || job.id}`}
                    className="btn btn-sm btn-ghost"
                  >
                    ✏️ Edit
                  </Link>
                  <DeleteJobButton 
                    jobId={job.mongoId || job.id} 
                    jobTitle={job.title}
                    onDelete={() => {
                      // Remove the deleted job from the list
                      setJobs(prevJobs => prevJobs.filter(j => (j.mongoId || j.id) !== (job.mongoId || job.id)));
                    }}
                  />
                  <Link 
                    to={`/My-Posted-Job-Details/${job.mongoId || job.id}`} 
                    className="btn btn-sm btn-primary"
                  >
                    👁️ View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
