import { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import axios from 'axios';
import ShareButton from '../../components/ShareButton';
import RatingModal from '../../components/RatingModal';
import { AuthContext } from '../../Authentication/AuthProvider';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { JobLocationMap, LiveTrackingMap } from '../../components/maps';
import PageContainer from '../../components/layout/PageContainer';
import toast from 'react-hot-toast';

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
      toast.success('Job deleted successfully');
    } catch (err) {
      console.error('Failed to delete job:', err);
      toast.error(err.response?.data?.error || 'Failed to delete job. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button 
        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        onClick={() => setShowModal(true)}
      >
        <i className="fas fa-trash-alt"></i> Delete
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#121a2f] rounded-2xl shadow-2xl p-8 w-full border border-red-500/30">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white text-center">Delete Job Post</h3>
            <p className="text-slate-400 mb-8 text-center text-sm">
              Are you sure you want to permanently delete <span className="font-bold text-slate-200">"{jobTitle}"</span>? This action cannot be undone and all pending applications will be lost.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                className="flex-1 bg-[#1e293b] hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-colors border border-slate-600"
                onClick={() => setShowModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-trash-alt"></i>
                )}
                {deleting ? 'Deleting...' : 'Delete'}
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
  const { user } = useContext(AuthContext) || {};
  const { socket } = useWebSocket() || {};

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
  const [negotiatingAppId, setNegotiatingAppId] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [negotiating, setNegotiating] = useState(false);

  // Rating modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [workerDetails, setWorkerDetails] = useState({});

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

  // Function to handle rating success
  const handleRatingSuccess = () => {
    fetchApplications();
  };

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

      // Fetch worker details for each unique workerId
      if (data && data.length > 0) {
        const workerIds = [...new Set(data.map(app => app.workerId).filter(Boolean))];
        workerIds.forEach(wid => fetchWorkerDetails(wid));
      }
    } catch (e) {
      setAppsErr(e.message || 'Failed to load applications');
    } finally {
      setAppsLoading(false);
    }
  };

  const fetchWorkerDetails = async (workerId) => {
    if (workerDetails[workerId]) return;
    try {
      const resp = await fetch(`${base}/api/users/${workerId}/public`, {
        headers: { Accept: 'application/json' }
      });
      if (resp.ok) {
        const data = await resp.json();
        setWorkerDetails(prev => ({ ...prev, [workerId]: data }));
      }
    } catch (err) {
      console.error('Failed to fetch worker details:', err);
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
    <div className="flex items-start gap-4 p-4 rounded-xl bg-[#172136] border border-slate-800/80">
      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#121a2f] border border-slate-700 text-blue-400 text-lg shrink-0 shadow-inner">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">{label}</p>
        <div className="font-semibold text-slate-200">{value}</div>
      </div>
    </div>
  );

  const getStatusClasses = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'active': case 'accepted': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'in-progress': return 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'rejected': case 'cancelled': return 'bg-red-500/20 text-red-500 border border-red-500/30';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      default: return 'bg-slate-700 text-slate-300 border border-slate-600';
    }
  };

  const Badge = ({ text, tone = 'default' }) => (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusClasses(tone)}`}>
      {text}
    </span>
  );

  // Accept / Reject
  const decide = async (app, nextStatus) => {
    if (!app || !app._id) {
      toast.error('Missing application id'); 
      return;
    }
    if (nextStatus === 'accepted' && app.proposedPrice && !isPriceFinalized(app)) {
      toast.error('Please finalize price negotiation before accepting this worker.');
      return;
    }
    try {
      setDeciding(true);

      const res = await fetch(`${base}/api/applications/${app._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          ...(nextStatus === 'completed' ? { actorRole: 'client' } : {})
        }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || `Failed to update status (${res.status})`);
      }

      const updated = await res.json().catch(() => ({}));
      setApps(prev =>
        prev.map(x => x._id === app._id ? { ...x, ...updated, status: updated.status || nextStatus } : x)
      );
      setSelected(s => (s ? { ...s, ...updated, status: updated.status || nextStatus } : s));
      toast.success(`Application ${nextStatus}`);
    } catch (e) {
      toast.error(e.message || 'Failed to update application');
    } finally {
      setDeciding(false);
    }
  };

  const isPriceFinalized = (app) => {
    if (!app?.proposedPrice) return true;
    const hasFinalPrice = app.finalPrice != null && Number(app.finalPrice) > 0;
    const negotiationAccepted = (app.negotiationStatus || '').toLowerCase() === 'accepted';
    return hasFinalPrice || negotiationAccepted;
  };

  const formatCurrency = (amount) => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return '—';
    return `৳${n.toLocaleString()}`;
  };

  const updateNegotiation = async (app, payload, onSuccessMessage) => {
    if (!app?.jobId || !app?.workerId) {
      alert('Missing application identifiers');
      return;
    }
    try {
      setNegotiating(true);
      const res = await fetch(`${base}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: app.jobId,
          workerId: app.workerId,
          ...payload
        })
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || 'Failed to update negotiation');
      }
      const data = await res.json();
      const updatedApp = data?.application || {};
      setApps((prev) => prev.map((x) => (x._id === app._id ? { ...x, ...updatedApp } : x)));
      setSelected((prev) => (prev && prev._id === app._id ? { ...prev, ...updatedApp } : prev));
      if (onSuccessMessage) toast.success(onSuccessMessage);
      setNegotiatingAppId(null);
      setCounterPrice('');
    } catch (e) {
      toast.error(e.message || 'Failed to update negotiation');
    } finally {
      setNegotiating(false);
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
      toast.success(`Job marked as ${newStatus}`);
    } catch (err) {
      console.error('Failed to update job status:', err);
      toast.error(err.message || 'Failed to update job status. Please try again.');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0b1121] text-slate-300 font-sans">
      <PageContainer>
        <div className="text-center py-20">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl text-slate-400 font-semibold tracking-wide">Loading job details...</p>
        </div>
      </PageContainer>
    </div>
  );

  if (err) return (
    <div className="min-h-screen bg-[#0b1121] text-slate-300 font-sans flex items-center justify-center">
      <div className="text-center bg-[#121a2f] p-10 border border-red-500/20 rounded-3xl shadow-2xl mx-4">
        <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"></i>
        <h2 className="text-3xl font-bold mb-3 text-white">Error Loading Job</h2>
        <p className="text-lg opacity-80 text-slate-400 mb-6">{err}</p>
        <Link to="/My-Posted-Jobs" className="btn btn-outline text-slate-300">Back to Jobs</Link>
      </div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-[#0b1121] text-slate-300 font-sans flex items-center justify-center">
      <div className="text-center bg-[#121a2f] p-10 border border-slate-800 rounded-3xl shadow-xl mx-4">
        <i className="fas fa-search text-5xl text-slate-500 mb-6"></i>
        <h2 className="text-3xl font-bold mb-3 text-white">Job Not Found</h2>
        <Link to="/My-Posted-Jobs" className="btn btn-primary mt-4">Back to List</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1121] text-slate-300 pb-16 font-sans">
      <PageContainer>
        {/* Header & Title */}
        <div className="pt-8 mb-8 flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="flex-1">
            <Link to="/My-Posted-Jobs" className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors mb-4">
              <i className="fas fa-arrow-left"></i> Back to My Jobs
            </Link>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge text={job.status || 'active'} tone={job.status || 'active'} />
              <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <i className="far fa-clock"></i> Posted {timeAgo(job.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <ShareButton
              jobId={id}
              jobTitle={job.title}
              jobDescription={job.description}
              isClient={true}
            />
            <Link to={`/edit-job/${id}`} className="bg-[#1e293b] hover:bg-slate-700 text-white border border-slate-600 font-bold py-2 px-4 rounded-xl transition-colors shadow-sm flex items-center gap-2">
              <i className="fas fa-pen"></i> Edit Task
            </Link>
            <DeleteJobButton jobId={id} jobTitle={job.title} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image & Location */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {/* Slider */}
            <div className="bg-[#121a2f] border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-2 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div className="rounded-xl overflow-hidden relative">
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  navigation
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 3500, disableOnInteraction: false }}
                  className="w-full aspect-video md:aspect-square object-cover"
                >
                  {images.map((img, i) => (
                    <SwiperSlide key={i}>
                      <img
                        src={img}
                        alt={`Job Visual ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading={i === 0 ? 'eager' : 'lazy'}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#121a2f] to-transparent pointer-events-none"></div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>

            {/* General Maps */}
            {(job.locationGeo || job.locationText || job.location) && (
              <div className="bg-[#121a2f] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-blue-500"></i> Location Map
                </h3>
                <div className="border border-slate-700 rounded-xl overflow-hidden shadow-inner">
                  <JobLocationMap
                    locationGeo={job.locationGeo}
                    locationText={job.locationText || job.location}
                  />
                </div>
              </div>
            )}

            {/* Live tracking (if accepted) */}
            {(() => {
              const acceptedApp = Array.isArray(apps) ? apps.find((a) => (a.status || '').toLowerCase() === 'accepted') : null;
              const peerWorkerId = acceptedApp?.workerId;
              if (!id || !user?.uid || !peerWorkerId) return null;
              return (
                <div className="bg-gradient-to-br from-[#121a2f] to-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                    <i className="fas fa-satellite-dish text-indigo-400 animate-pulse"></i> Live Worker Tracking
                  </h3>
                  <div className="border border-indigo-500/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.15)] relative z-10">
                    <LiveTrackingMap
                      jobId={id}
                      jobLocationGeo={job.locationGeo}
                      currentUserId={user.uid}
                      peerUserId={peerWorkerId}
                      socket={socket}
                      isAccepted={!!acceptedApp}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right Column: Information & Applicants */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            <div className="bg-[#121a2f] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-3 flex justify-between items-center">
                <span>Job Overview</span>
                <div className="relative w-48 shrink-0">
                  <select
                    className="w-full bg-[#0b1121] border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                    value={job.status || 'active'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="active">🟢 Status: Active</option>
                    <option value="on-hold">🟡 Status: On Hold</option>
                    <option value="cancelled">🔴 Status: Cancelled</option>
                    <option value="completed">🟣 Status: Completed</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-3 top-3 text-slate-500 pointer-events-none text-xs"></i>
                </div>
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <InfoRow icon={<i className="fas fa-briefcase"></i>} label="Category" value={job.category || '—'} />
                <InfoRow icon={<i className="fas fa-map-marker-alt"></i>} label="Location" value={job.location || '—'} />
                <InfoRow icon={<i className="fas fa-money-bill-wave"></i>} label="Budget" value={job.budget ? `৳${job.budget.toLocaleString()}` : '—'} />
                <InfoRow icon={<i className="fas fa-calendar-alt"></i>} label="Schedule" value={`${job.date || '—'}${job.time ? ` • ${job.time}` : ''}`} />
                {job.expiresAt && (
                  <InfoRow 
                    icon={<i className="fas fa-hourglass-half"></i>} 
                    label="Expiration" 
                    value={
                      <div className="flex flex-col">
                        <span className={new Date(job.expiresAt) <= new Date() ? 'text-red-400 font-bold' : new Date(job.expiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-orange-400 font-bold' : 'text-slate-200'}>
                          {new Date(job.expiresAt).toLocaleDateString()}
                        </span>
                        {new Date(job.expiresAt) > new Date() && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {Math.ceil((new Date(job.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))} days left
                          </span>
                        )}
                      </div>
                    } 
                  />
                )}
              </div>

              {/* Skills */}
              {Array.isArray(job.skills) && job.skills.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((s, i) => (
                      <span key={i} className="px-3 py-1.5 text-xs font-bold bg-[#172136] text-blue-300 rounded-lg border border-slate-700 shadow-sm shadow-[#0b1121]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Full Description</p>
                <div className="leading-relaxed text-slate-300 text-sm bg-[#0b1121] border border-slate-800 p-5 rounded-xl whitespace-pre-line shadow-inner">
                  {job.description || 'No description provided.'}
                </div>
              </div>
            </div>

            {/* Applicants Section */}
            <div className="bg-[#121a2f] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <i className="fas fa-users text-blue-500"></i> Applications
                </h2>
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold px-3 py-1 rounded-full text-xs box-content">
                  {apps?.length || 0} Total
                </div>
              </div>

              {appsLoading ? (
                <div className="py-10 text-center text-slate-400 font-medium bg-[#0b1121] rounded-xl border border-slate-800">
                  <i className="fas fa-spinner fa-spin mr-2"></i> Loading applications...
                </div>
              ) : appsErr ? (
                <div className="p-5 border border-red-500/30 rounded-xl bg-red-500/10 text-red-400 flex items-center gap-3">
                  <i className="fas fa-exclamation-circle text-2xl"></i> {appsErr}
                </div>
              ) : Array.isArray(apps) && apps.length > 0 ? (
                <div className="overflow-x-auto bg-[#0b1121] rounded-xl border border-slate-800">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#172136] border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-4 w-8 text-center">#</th>
                        <th className="px-4 py-4">Worker Profile</th>
                        <th className="px-4 py-4">Proposed</th>
                        <th className="px-4 py-4">Negotiation</th>
                        <th className="px-4 py-4 text-center">Status</th>
                        <th className="px-4 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {apps.map((a, i) => (
                        <tr key={`${a.workerId}-${i}`} className="hover:bg-[#172136] transition-colors group">
                          <td className="px-4 py-4 text-center font-medium text-slate-500">{i + 1}</td>
                          <td className="px-4 py-4">
                            <Link to={`/worker/${a.workerId}`} className="flex items-center gap-3 group/link">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden border border-white/10 shrink-0">
                                {workerDetails[a.workerId]?.profileCover ? (
                                  <img src={workerDetails[a.workerId].profileCover} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  (workerDetails[a.workerId]?.displayName || a.workerName || 'W').charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="font-bold text-slate-200 group-hover/link:text-blue-400 transition-colors">
                                {([workerDetails[a.workerId]?.firstName, workerDetails[a.workerId]?.lastName].filter(Boolean).join(' ').trim()) ||
                                  workerDetails[a.workerId]?.displayName || 
                                  a.workerName || 
                                  'Unknown Worker'}
                              </span>
                            </Link>
                          </td>
                          <td className="px-4 py-4 font-extrabold text-white">{formatCurrency(a.proposedPrice)}</td>
                          <td className="px-4 py-4">
                            {a.proposedPrice ? (
                              <Badge text={a.negotiationStatus || 'pending'} tone={(a.negotiationStatus || 'pending').toLowerCase() === 'accepted' ? 'accepted' : 'pending'} />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <Badge text={a.status || 'pending'} tone={(a.status || 'pending').toLowerCase()} />
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button className="bg-[#1e293b] hover:bg-blue-600 text-white border border-slate-600 hover:border-blue-500 font-bold py-1.5 px-4 rounded-lg transition-all text-xs" onClick={() => openModal(a)}>
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center bg-[#0b1121] rounded-xl border border-slate-800 border-dashed">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-inbox text-3xl text-slate-600"></i>
                  </div>
                  <p className="text-slate-400 font-medium text-sm">No applications have been submitted for this job yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>

      {/* Detail Management Modal */}
      {open && selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-[#121a2f] border border-blue-500/20 w-full max-w-2xl mx-auto rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#172136] border-b border-slate-800 px-6 py-5 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-xl font-bold mb-0 text-white flex items-center gap-2">
                <i className="fas fa-clipboard-list text-blue-500"></i> Application Management
              </h3>
              <button className="w-8 h-8 rounded-full bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg overflow-hidden border-2 border-white/5">
                    {workerDetails[selected.workerId]?.profileCover ? (
                      <img src={workerDetails[selected.workerId].profileCover} className="w-full h-full object-cover" alt="" />
                    ) : (
                      (([workerDetails[selected.workerId]?.firstName, workerDetails[selected.workerId]?.lastName].filter(Boolean).join(' ').trim()) ||
                      workerDetails[selected.workerId]?.displayName || 
                      selected.workerName || 
                      'W').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-lg text-white">
                      {([workerDetails[selected.workerId]?.firstName, workerDetails[selected.workerId]?.lastName].filter(Boolean).join(' ').trim()) ||
                        workerDetails[selected.workerId]?.displayName || 
                        selected.workerName || 
                        '—'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge text={selected.status || 'pending'} tone={(selected.status || 'pending').toLowerCase()} />
                      <Link to={`/worker/${selected.workerId}`} className="text-[10px] font-bold text-blue-400 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors">
                        View Profile <i className="fas fa-external-link-alt text-[8px]"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0b1121] border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                  <i className="fas fa-envelope text-blue-400/50 text-xl"></i>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</p>
                    <p className="font-semibold text-slate-300 truncate">
                      {selected.status?.toLowerCase() === 'accepted' ? (selected.workerEmail || selected.postedByEmail || 'Hidden until accepted') : 'Hidden until accepted'}
                    </p>
                  </div>
                </div>
                <div className="bg-[#0b1121] border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                  <i className="fas fa-phone-alt text-blue-400/50 text-xl"></i>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone</p>
                    <p className="font-semibold text-slate-300">
                      {selected.status?.toLowerCase() === 'accepted' ? (selected.workerPhone || 'Not provided') : 'Hidden until accepted'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Proposal Letter</p>
                <div className="p-5 border border-slate-800/80 rounded-xl bg-[#172136] text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {selected.proposalText || 'No proposal text provided by the worker.'}
                </div>
              </div>

              {selected.proposedPrice && (
                <div className="mb-6 border border-indigo-500/20 rounded-xl bg-gradient-to-br from-[#172136] to-[rgba(79,70,229,0.05)] overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-800/80 bg-[#121a2f] flex justify-between items-center">
                    <p className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <i className="fas fa-handshake text-indigo-400"></i> Price Negotiation
                    </p>
                    <Badge text={selected.negotiationStatus || 'pending'} tone={(selected.negotiationStatus || 'pending').toLowerCase() === 'accepted' ? 'accepted' : 'pending'} />
                  </div>
                  
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-center text-sm p-3 bg-[#0b1121] rounded-lg border border-slate-800">
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Worker Proposed</span>
                      <span className="font-extrabold text-indigo-400 text-lg">{formatCurrency(selected.proposedPrice)}</span>
                    </div>
                    {selected.counterPrice > 0 && (
                      <div className="flex justify-between items-center text-sm p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <span className="text-orange-400/80 font-semibold text-xs uppercase tracking-wider">Your Counter</span>
                        <span className="font-extrabold text-orange-400 text-lg">{formatCurrency(selected.counterPrice)}</span>
                      </div>
                    )}
                    {selected.finalPrice > 0 && (
                      <div className="flex justify-between items-center text-sm p-3 bg-green-500/10 rounded-lg border border-green-500/20 shadow-inner">
                        <span className="text-green-400/80 font-bold text-xs uppercase tracking-wider bg-green-500/20 px-2 py-0.5 rounded">Final Agreed</span>
                        <span className="font-extrabold text-green-400 text-xl">{formatCurrency(selected.finalPrice)}</span>
                      </div>
                    )}

                    {/* Negotiation Controls */}
                    {(selected.negotiationStatus || 'pending') !== 'accepted' && (selected.negotiationStatus || 'pending') !== 'cancelled' && (
                      <div className="pt-4 mt-2 border-t border-slate-700">
                        {negotiatingAppId === selected._id ? (
                          <div className="space-y-3 bg-[#0b1121] p-4 rounded-xl border border-blue-500/30">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enter New Counter Price</label>
                            <div className="flex items-center gap-2">
                              <span className="w-10 h-10 flex items-center justify-center bg-[#1e293b] border border-slate-600 rounded-lg text-slate-400 font-bold">৳</span>
                              <input
                                type="number"
                                min="1"
                                step="100"
                                value={counterPrice}
                                onChange={(e) => setCounterPrice(e.target.value)}
                                className="flex-1 bg-[#121a2f] border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold"
                                placeholder="E.g. 1500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center shadow-lg"
                                disabled={negotiating}
                                onClick={() => {
                                  const value = parseFloat(counterPrice);
                                  if (Number.isNaN(value) || value <= 0) {
                                    toast.error('Enter a valid counter price');
                                    return;
                                  }
                                  updateNegotiation(
                                    selected,
                                    { counterPrice: value, negotiationStatus: 'countered' },
                                    'Counter offer sent successfully!'
                                  );
                                }}
                              >
                                {negotiating ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-paper-plane mr-2"></i> Send Counter Offer</>}
                              </button>
                              <button
                                className="w-24 bg-[#1e293b] hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg transition-colors border border-slate-600"
                                disabled={negotiating}
                                onClick={() => {
                                  setNegotiatingAppId(null);
                                  setCounterPrice('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                            <button
                              className="flex-1 bg-[#2563eb] hover:bg-blue-600 shadow-lg shadow-blue-500/20 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                              onClick={() => {
                                setNegotiatingAppId(selected._id);
                                setCounterPrice(selected.counterPrice?.toString() || '');
                              }}
                            >
                              <i className="fas fa-hand-holding-usd"></i> Make Counter Offer
                            </button>
                            {String(selected.negotiationStatus || '').toLowerCase() !== 'countered' && (
                            <button
                              className="flex-1 bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                              disabled={negotiating}
                              onClick={() =>
                                updateNegotiation(
                                  selected,
                                  { finalPrice: Number(selected.proposedPrice), negotiationStatus: 'accepted' },
                                  'Price structure accepted!'
                                )
                              }
                            >
                              <i className="fas fa-check"></i> Accept Their Price
                            </button>
                            )}
                            <button
                              className="w-full sm:w-auto bg-[#1e293b] hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 text-slate-400 border border-slate-600 font-bold py-2.5 px-4 rounded-xl transition-colors shrink-0"
                              disabled={negotiating}
                              onClick={() => {
                                if(window.confirm("Cancel this ongoing negotiation?")) {
                                  updateNegotiation(
                                    selected,
                                    { negotiationStatus: 'cancelled' },
                                    'Negotiation cancelled'
                                  )
                                }
                              }}
                              title="Cancel Negotiation"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
            {/* Modal Actions Footer */}
            <div className="bg-[#0b1121] border-t border-slate-800 p-5 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-10">
              <button className="w-full sm:w-auto bg-[#1e293b] hover:bg-slate-700 text-white border border-slate-600 font-bold py-3 px-6 rounded-xl transition-colors text-sm" onClick={closeModal}>Go Back</button>
              
              <div className="flex w-full sm:w-auto gap-2">
                {selected.status?.toLowerCase() === 'completed' ? (
                  <button
                    className="flex-1 sm:flex-none bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    onClick={() => {
                      setSelectedApplication(selected);
                      setRatingModalOpen(true);
                      closeModal();
                    }}
                  >
                    <i className="fas fa-star"></i> Rate Worker
                  </button>
                ) : selected.status?.toLowerCase() === 'accepted' ? (
                  <button
                    className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-500 text-white shadow-lg font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    disabled={deciding}
                    onClick={() => decide(selected, 'completed')}
                  >
                    {deciding ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-double"></i>}
                    {deciding ? 'Saving...' : 'Mark Job Completed'}
                  </button>
                ) : (
                  <>
                    <button
                      className="flex-1 sm:flex-none bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-bold py-3 px-6 rounded-xl transition-colors"
                      disabled={deciding}
                      onClick={() => decide(selected, 'rejected')}
                    >
                      {deciding && selected.status !== 'rejected' ? <i className="fas fa-spinner fa-spin"></i> : 'Reject'}
                    </button>
                    <button
                      className={`flex-1 sm:flex-none font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${deciding || (selected.proposedPrice && !isPriceFinalized(selected)) ? 'bg-slate-700 text-slate-500 bg-opacity-50 cursor-not-allowed border border-slate-600' : 'bg-[#2563eb] hover:bg-blue-600 text-white'}`}
                      disabled={deciding || (selected.proposedPrice && !isPriceFinalized(selected))}
                      onClick={() => decide(selected, 'accepted')}
                      title={selected.proposedPrice && !isPriceFinalized(selected) ? 'Finalize price first' : 'Accept application'}
                    >
                      {deciding && selected.status !== 'accepted' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-user-check"></i>}
                      Accept Hire
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModalOpen && selectedApplication && (
        <RatingModal
          isOpen={ratingModalOpen}
          onClose={() => {
            setRatingModalOpen(false);
            setSelectedApplication(null);
          }}
          jobId={id}
          applicationId={selectedApplication._id?.toString() || selectedApplication._id}
          workerId={selectedApplication.workerId}
          workerName={selectedApplication.workerName || 'Worker'}
          jobTitle={job?.title}
          onSuccess={() => {
            // Refresh applications to show updated review status
            fetchApplications();
          }}
        />
      )}
    </div>
  );
}
