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
import toast from 'react-hot-toast';
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

// Withdraw job offer (client only, for private/sent offers)
function WithdrawOfferButton({ jobId, jobTitle, clientId, onWithdrawn }) {
  const [withdrawing, setWithdrawing] = useState(false);
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  const handleWithdraw = async () => {
    if (!clientId || !jobId) return;
    if (!window.confirm(`Withdraw the job offer "${jobTitle}"? The worker will be notified.`)) return;
    try {
      setWithdrawing(true);
      await axios.post(`${base}/api/job-offers/${jobId}/withdraw`, { clientId }, { headers: { 'Content-Type': 'application/json' } });
      toast.success('Job offer withdrawn');
      if (onWithdrawn) onWithdrawn();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to withdraw offer');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-sm btn-error"
      onClick={handleWithdraw}
      disabled={withdrawing}
    >
      {withdrawing ? <span className="loading loading-spinner loading-sm" /> : 'Withdraw'}
    </button>
  );
}

export default function PostedJobs() {
  const { isDarkMode } = useTheme();
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [workerNames, setWorkerNames] = useState({});

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

  // Sent offers: private jobs where clientId is the current user
  const sentOffers = (jobs || []).filter((j) => j.isPrivate === true);
  const pendingSentOffers = sentOffers.filter((j) => String(j.offerStatus || '').toLowerCase() === 'pending');

  // Fetch worker display names for sent offers
  const sentOfferWorkerIds = [...new Set(sentOffers.map((j) => j.targetWorkerId).filter(Boolean))];
  useEffect(() => {
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    if (sentOfferWorkerIds.length === 0) return;
    let ignore = false;
    sentOfferWorkerIds.forEach((workerId) => {
      if (workerNames[workerId]) return;
      fetch(`${base}/api/users/${encodeURIComponent(workerId)}/public`, { headers: { Accept: 'application/json' } })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (ignore || !data) return;
          const name = data.displayName || [data.firstName, data.lastName].filter(Boolean).join(' ') || data.email || 'Worker';
          setWorkerNames((prev) => ({ ...prev, [workerId]: name }));
        })
        .catch(() => {});
    });
    return () => { ignore = true; };
  }, [sentOfferWorkerIds.join(',')]);

  const filteredJobs =
    filter === 'sent-offers'
      ? sentOffers
      : filter === 'all'
        ? jobs
        : jobs.filter((job) => {
            const jobStatus = String(job.status || 'active').toLowerCase();
            const filterStatus = String(filter).toLowerCase();
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
    { key: 'sent-offers', label: 'Sent Offers', count: sentOffers.length, icon: '✉️' },
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
              {filter === 'sent-offers' ? 'No sent offers' : filter === 'all' ? 'No jobs posted yet' : `No ${filter} jobs found`}
            </h3>
            <p className="text-lg mb-8 opacity-70">
              {filter === 'sent-offers'
                ? 'Job offers you send from a worker profile will appear here. You can withdraw pending offers.'
                : filter === 'all'
                  ? 'Start by posting your first job to find skilled workers'
                  : 'Try switching to a different filter or post a new job'
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
        ) : filter === 'sent-offers' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredJobs.map((job) => {
              const offerStatus = (job.offerStatus || 'pending').toLowerCase();
              const isPending = offerStatus === 'pending';
              const workerName = job.targetWorkerId ? (workerNames[job.targetWorkerId] || 'Loading...') : 'Worker';
              return (
                <div
                  key={job.id || job.mongoId}
                  className="card bg-base-200 border border-base-300 shadow-xl"
                >
                  <div className="card-body">
                    <h3 className="card-title line-clamp-2">{job.title}</h3>
                    <p className="text-sm opacity-70">{job.category}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">To:</span>
                      <span>{workerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-primary">{job.budget} {job.currency || '৳'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-sm ${isPending ? 'badge-warning' : offerStatus === 'accepted' ? 'badge-success' : 'badge-ghost'}`}>
                        {offerStatus}
                      </span>
                      {job.expiresAt && new Date(job.expiresAt) > new Date() && (
                        <span className="text-xs opacity-70">
                          Expires {new Date(job.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="card-actions justify-end mt-2">
                      {isPending && (
                        <WithdrawOfferButton
                          jobId={job.mongoId || job.id}
                          jobTitle={job.title}
                          clientId={clientId}
                          onWithdrawn={() => {
                            setJobs((prev) => prev.map((j) => (j.mongoId || j.id) === (job.mongoId || job.id) ? { ...j, offerStatus: 'withdrawn', status: 'cancelled' } : j));
                          }}
                        />
                      )}
                      <Link to={`/My-Posted-Job-Details/${job.mongoId || job.id}`} className="btn btn-sm btn-ghost">View</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const jobId = job.mongoId || job.id;
              const thumb = job.images?.[0] || null;
              const applicantCount = job.applicants?.length || 0;
              const isExpired = job.expiresAt && new Date(job.expiresAt) <= new Date();
              const expiresSoon = job.expiresAt && !isExpired &&
                new Date(job.expiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

              return (
                <div
                  key={jobId}
                  className="flex flex-col bg-base-200 border border-base-300 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-44 bg-base-300 flex-shrink-0">
                    {thumb ? (
                      <img src={thumb} alt={job.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <i className="fas fa-briefcase text-5xl text-primary/20" />
                      </div>
                    )}
                    {/* Category badge — top right */}
                    {job.category && (
                      <span className="absolute top-3 right-3 bg-primary text-primary-content text-xs font-semibold px-3 py-1 rounded-full shadow">
                        {job.category}
                      </span>
                    )}
                    {/* Status badge — top left */}
                    <span className={`absolute top-3 left-3 badge badge-sm ${getStatusColor(job.status)} gap-1`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {job.status}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-4">
                    {/* Title */}
                    <h3 className="font-bold text-base text-primary leading-snug line-clamp-1 mb-2">
                      {job.title}
                    </h3>

                    {/* Meta */}
                    <div className="space-y-1.5 text-sm text-base-content/70 flex-1">
                      {job.location && (
                        <div className="flex items-start gap-2">
                          <i className="fas fa-map-marker-alt text-primary mt-0.5 w-3.5 shrink-0" />
                          <span className="line-clamp-2 leading-snug">{job.location}</span>
                        </div>
                      )}
                      {job.date && (
                        <div className="flex items-center gap-2">
                          <i className="fas fa-calendar-alt text-primary w-3.5 shrink-0" />
                          <span>Posted: {job.date}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <i className="fas fa-users text-primary w-3.5 shrink-0" />
                        <span>
                          {applicantCount} applicant{applicantCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {job.expiresAt && (
                        <div className={`flex items-center gap-2 text-xs font-medium ${isExpired ? 'text-error' : expiresSoon ? 'text-warning' : 'text-base-content/50'}`}>
                          <i className="fas fa-clock w-3.5 shrink-0" />
                          <span>
                            {isExpired
                              ? 'Expired'
                              : `Expires ${new Date(job.expiresAt).toLocaleDateString()} (${Math.ceil((new Date(job.expiresAt) - new Date()) / 86400000)}d left)`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    {job.budget && (
                      <p className="text-primary font-extrabold text-2xl mt-3">
                        ৳{job.budget}
                      </p>
                    )}

                    {/* View Details */}
                    <div className="mt-3 pt-3 border-t border-base-300">
                      <Link
                        to={`/My-Posted-Job-Details/${jobId}`}
                        className="flex items-center justify-center gap-2 font-bold text-sm text-base-content hover:text-primary transition-colors"
                      >
                        View Details <i className="fas fa-arrow-right" />
                      </Link>
                    </div>

                    {/* Management strip */}
                    <div className="mt-3 pt-3 border-t border-base-300 flex items-center gap-1.5">
                      <select
                        className="select select-bordered select-xs flex-1 min-w-0"
                        value={job.status || 'active'}
                        onChange={(e) => handleStatusChange(jobId, e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                      <ShareButton jobId={jobId} jobTitle={job.title} jobDescription={job.description} isClient={true} />
                      <Link to={`/edit-job/${jobId}`} className="btn btn-xs btn-ghost px-2" title="Edit">
                        <i className="fas fa-pen" />
                      </Link>
                      <DeleteJobButton
                        jobId={jobId}
                        jobTitle={job.title}
                        onDelete={() => setJobs(prev => prev.filter(j => (j.mongoId || j.id) !== jobId))}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
