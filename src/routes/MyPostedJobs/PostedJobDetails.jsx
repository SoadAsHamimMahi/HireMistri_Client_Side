import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import axios from 'axios';
import ShareButton from '../../components/ShareButton';

// Delete Job Button Component
function DeleteJobButton({ jobId, jobTitle }) {
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await axios.delete(`${base}/api/browse-jobs/${jobId}`);
      setShowModal(false);
      navigate('/My-Posted-Jobs');
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
        className="btn btn-error text-white"
        onClick={() => setShowModal(true)}
      >
        Delete
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

export default function PostedJobDetails() {
  const { id } = useParams();
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Applications (for this job)
  const [apps, setApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsErr, setAppsErr] = useState('');

  // Modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const res = await fetch(`${base}/api/browse-jobs/${id}`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Expected JSON, got '${ct}'. First bytes: ${text.slice(0, 80)}`);
        }
        const data = await res.json();
        if (!ignore) setJob(data);
      } catch (e) {
        if (!ignore) setErr(e.message || 'Failed to load job');
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id, base]);

  // load applications for this job
  const fetchApplications = async () => {
    if (!id) return;
    try {
      setAppsLoading(true);
      setAppsErr('');
      const res = await fetch(`${base}/api/job-applications/${id}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setApps(data || []);
    } catch (e) {
      setAppsErr(e.message || 'Failed to load applications');
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [id, base]);

  // Poll for notifications and refresh applications if withdrawal notification received
  useEffect(() => {
    if (!id) return;
    
    // Refresh every 15 seconds to catch withdrawals
    const interval = setInterval(fetchApplications, 15000);
    return () => clearInterval(interval);
  }, [id, base]);

  const images = Array.isArray(job?.images) && job.images.length > 0
    ? job.images
    : ['https://via.placeholder.com/1200x800?text=No+Image'];

  // ---------- helpers ----------
  const timeAgo = (iso) => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d} day${d > 1 ? 's' : ''} ago`;
    if (h > 0) return `${h} hour${h > 1 ? 's' : ''} ago`;
    if (m > 0) return `${m} minute${m > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
      <span className="text-xl leading-6">{icon}</span>
      <div className="text-sm">
        <p className="text-base-content opacity-60">{label}</p>
        <p className="font-medium text-base-content">{value}</p>
      </div>
    </div>
  );

  const Badge = ({ text, tone = 'default' }) => {
    const tones = {
      default: 'badge-neutral',
      active: 'badge-success',
      'in-progress': 'badge-warning',
      completed: 'badge-info',
      pending: 'badge-neutral',
      accepted: 'badge-success',
      rejected: 'badge-error',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tones[tone] || tones.default}`}>
        {text}
      </span>
    );
  };

  // Accept / Reject
 // Accept / Reject
const decide = async (app, nextStatus) => {
  if (!app || !app._id) {
    alert('Missing application id'); 
    return;
  }
  try {
    setDeciding(true);

    // ✅ use the status endpoint
    const res = await fetch(`${base}/api/applications/${app._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || `Failed to update status (${res.status})`);
    }

    // update local UI
    setApps(prev =>
      prev.map(x => x._id === app._id ? { ...x, status: nextStatus } : x)
    );
    setSelected(s => s && { ...s, status: nextStatus });
  } catch (e) {
    alert(e.message || 'Failed to update application');
  } finally {
    setDeciding(false);
  }
};


  const openModal = (app) => {
    setSelected(app);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setSelected(null);
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    // Show confirmation for destructive status changes
    if (newStatus === 'cancelled' || newStatus === 'completed') {
      const confirmed = window.confirm(
        `Are you sure you want to mark this job as ${newStatus}? This action may affect active applications.`
      );
      if (!confirmed) return;
    }

    try {
      const response = await fetch(`${base}/api/browse-jobs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update status');
      }

      const updated = await response.json();
      setJob(updated.job || { ...job, status: newStatus });
    } catch (err) {
      console.error('Failed to update job status:', err);
      alert(err.message || 'Failed to update job status. Please try again.');
    }
  };

  if (loading) return <div className="py-16 text-center">Loading…</div>;
  if (err) return <div className="py-16 text-center text-red-600">❌ {err}</div>;
  if (!job) return <div className="py-16 text-center">Not found.</div>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-5">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
          {job.title}
        </h1>
        <Link to="/My-Posted-Jobs" className="btn btn-outline btn-sm">Back</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: slider */}
        <div className="self-start bg-base-200 border border-base-300 rounded-xl overflow-hidden shadow-sm transition-colors duration-300">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            className="w-full h-full"
          >
            {images.map((img, i) => (
              <SwiperSlide key={i} className="!p-0">
                <img
                  src={img}
                  alt={`Job image ${i + 1}`}
                  className="w-full h-[450px] object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Right: details + applicants */}
        <div className="bg-base-200 border border-base-300 rounded-xl p-5 md:p-6 shadow-sm flex flex-col gap-5 transition-colors duration-300">
          {/* top row */}
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge text={job.status || 'active'} tone={(job.status || 'active').toLowerCase()} />
              {Array.isArray(job.skills) && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 text-xs bg-base-300 text-base-content rounded-full border border-base-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <InfoRow icon="⏱️" label="Posted" value={timeAgo(job.createdAt)} />
            </div>
          </div>

          {/* info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon="🧰" label="Category" value={job.category || '—'} />
            <InfoRow icon="📍" label="Location" value={job.location || '—'} />
            <InfoRow icon="💸" label="Budget" value={`${job.budget || 0} ৳`} />
            <InfoRow icon="📅" label="Schedule" value={`${job.date || '—'}${job.time ? ` • ${job.time}` : ''}`} />
            {job.expiresAt && (
              <InfoRow 
                icon="⏰" 
                label="Expires" 
                value={
                  <span className={new Date(job.expiresAt) <= new Date() ? 'text-error font-semibold' : new Date(job.expiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-warning font-semibold' : ''}>
                    {new Date(job.expiresAt).toLocaleDateString()}
                    {new Date(job.expiresAt) > new Date() && (
                      <span className="ml-1 text-xs opacity-70">
                        ({Math.ceil((new Date(job.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))} days left)
                      </span>
                    )}
                  </span>
                } 
              />
            )}
          </div>

          {/* description */}
          <div>
            <p className="text-base-content opacity-60 text-sm mb-1">Description</p>
            <p className="leading-relaxed text-base-content bg-base-100 p-4 rounded-lg">
              {job.description || 'No description provided.'}
            </p>
          </div>

          {/* Status Selector */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-base-content opacity-70 mb-2">
              Job Status
            </label>
            <select
              className="select select-bordered w-full"
              value={job.status || 'active'}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* actions */}
          <div className="pt-2 flex gap-3">
            <Link to="/My-Posted-Jobs" className="btn btn-outline">Back to list</Link>
            <ShareButton
              jobId={id}
              jobTitle={job.title}
              jobDescription={job.description}
              isClient={true}
            />
            <Link to={`/edit-job/${id}`} className="btn btn-primary">Edit</Link>
            <DeleteJobButton jobId={id} jobTitle={job.title} />
          </div>

          {/* Applicants */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Applicants</h2>
              <Badge text={`${apps?.length || 0} total`} />
            </div>

            {appsLoading ? (
              <div className="p-4 border rounded-lg text-sm text-base-content opacity-70 bg-base-100">Loading applications…</div>
            ) : appsErr ? (
              <div className="p-4 border rounded-lg text-sm text-rose-600 bg-rose-50">❌ {appsErr}</div>
            ) : Array.isArray(apps) && apps.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Worker</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((a, i) => (
                      <tr key={`${a.workerId}-${i}`}>
                        <td>{i + 1}</td>
                        <td>{a.workerName || '—'}</td>
                        <td className="break-all">{a.workerEmail || a.postedByEmail || '—'}</td>
                        <td>{a.workerPhone || '—'}</td>
                        <td><Badge text={a.status || 'pending'} tone={(a.status || 'pending').toLowerCase()} /></td>
                        <td className="text-right">
                          <button className="btn btn-sm btn-outline" onClick={() => openModal(a)}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 border rounded-lg text-sm text-base-content opacity-70 bg-base-100">
                No applicants yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-base-200 border border-base-300 w-full max-w-lg rounded-xl shadow-lg p-5 transition-colors duration-300">
            <h3 className="text-lg font-semibold mb-3">Application</h3>

            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between gap-3">
                <span className="text-base-content opacity-60 w-28">Name</span>
                <span className="font-medium">{selected.workerName || '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-base-content opacity-60 w-28">Email</span>
                <span className="font-medium break-all">{selected.workerEmail || selected.postedByEmail || '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-base-content opacity-60 w-28">Phone</span>
                <span className="font-medium">{selected.workerPhone || '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-base-content opacity-60 w-28">Status</span>
                <span><Badge text={selected.status || 'pending'} tone={(selected.status || 'pending').toLowerCase()} /></span>
              </div>
            </div>

            <div>
              <p className="text-base-content opacity-60 text-sm mb-1">Proposal</p>
              <div className="p-3 border rounded-lg bg-base-100 whitespace-pre-wrap">
                {selected.proposalText || '—'}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button className="btn" onClick={closeModal}>Close</button>
              <div className="flex gap-2">
                <button
                  className="btn btn-success"
                  disabled={deciding}
                  onClick={() => decide(selected, 'accepted')}
                >
                  {deciding && selected.status !== 'accepted' ? 'Saving…' : 'Accept'}
                </button>
                <button
                  className="btn btn-error text-white"
                  disabled={deciding}
                  onClick={() => decide(selected, 'rejected')}
                >
                  {deciding && selected.status !== 'rejected' ? 'Saving…' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
