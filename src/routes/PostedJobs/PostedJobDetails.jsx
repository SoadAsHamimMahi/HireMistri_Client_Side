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
        className="bg-white hover:bg-red-50 text-red-500 border border-gray-100 hover:border-red-100 font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-blue-500/[0.03] flex items-center gap-3 text-xs uppercase tracking-widest active:scale-95"
        onClick={() => setShowModal(true)}
      >
        <i className="fas fa-trash-alt"></i> Delete
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[3rem] shadow-2xl p-10 w-full max-w-md border border-gray-100">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-8 border border-red-100">
              <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
            </div>
            <h3 className="text-3xl font-black mb-3 text-gray-900 text-center">Delete Post?</h3>
            <p className="text-gray-500 mb-10 text-center text-sm font-medium leading-relaxed">
              Are you sure you want to permanently delete <span className="font-bold text-gray-900">"{jobTitle}"</span>? This action cannot be undone and all pending applications will be lost.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-400 font-black py-4 px-6 rounded-2xl transition-all border border-gray-100 text-xs uppercase tracking-widest active:scale-95"
                onClick={() => setShowModal(false)}
                disabled={deleting}
              >
                Go Back
              </button>
              <button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-3 text-xs uppercase tracking-widest active:scale-95"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-trash-alt"></i>
                )}
                Confirm Delete
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
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-[#0a58ca] text-lg shrink-0 shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">{label}</p>
        <div className="font-bold text-gray-900">{value}</div>
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
    <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm ${getStatusClasses(tone)}`}>
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
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-[#0a58ca] rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-xl text-gray-900 font-black tracking-widest uppercase">Loading...</p>
      </div>
    </div>
  );

  if (err) return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
      <div className="text-center bg-white p-12 rounded-2xl border border-red-100 shadow-2xl max-w-lg">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
        </div>
        <h2 className="text-3xl font-black mb-4 text-gray-900">Error Loading Job</h2>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">{err}</p>
        <Link to="/My-Posted-Jobs" className="bg-[#0a58ca] hover:bg-[#084298] text-white font-black py-4 px-10 rounded-2xl text-xs uppercase tracking-widest transition-all">Back to Jobs</Link>
      </div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
      <div className="text-center bg-white p-12 rounded-2xl border border-gray-100 shadow-2xl max-w-lg">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <i className="fas fa-search text-3xl text-[#0a58ca]"></i>
        </div>
        <h2 className="text-3xl font-black mb-4 text-gray-900">Job Not Found</h2>
        <Link to="/My-Posted-Jobs" className="bg-[#0a58ca] hover:bg-[#084298] text-white font-black py-4 px-10 rounded-2xl text-xs uppercase tracking-widest transition-all">Back to List</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 pb-20 font-['Inter',sans-serif] relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="fixed top-1/2 -left-24 w-72 h-72 bg-blue-50/30 rounded-full blur-3xl pointer-events-none z-0"></div>

      <PageContainer>
        <div className="relative z-10">
        {/* Header & Title */}
        <div className="pt-12 mb-12 flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="flex-1">
            <Link to="/My-Posted-Jobs" className="inline-flex items-center gap-3 text-xs font-black text-[#0a58ca] uppercase tracking-widest hover:gap-4 transition-all mb-6">
              <i className="fas fa-arrow-left"></i> Back to My Jobs
            </Link>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900 mb-4 leading-tight">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <Badge text={job.status || 'active'} tone={job.status || 'active'} />
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <i className="far fa-clock text-[#0a58ca]"></i> Posted {timeAgo(job.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <ShareButton
              jobId={id}
              jobTitle={job.title}
              jobDescription={job.description}
              isClient={true}
            />
            <Link to={`/edit-job/${id}`} className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-100 font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-blue-500/[0.03] flex items-center gap-3 text-xs uppercase tracking-widest">
              <i className="fas fa-pen text-[#0a58ca]"></i> Edit Task
            </Link>
            <DeleteJobButton jobId={id} jobTitle={job.title} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Image & Location */}
          <div className="lg:col-span-5 flex flex-col gap-10">
            {/* Slider */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/[0.03] p-4 relative group">
              <div className="rounded-xl overflow-hidden relative">
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  navigation
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 3500, disableOnInteraction: false }}
                  className="w-full aspect-square object-cover"
                >
                  {images.map((img, i) => (
                    <SwiperSlide key={i}>
                      <img
                        src={img}
                        alt={`Job Visual ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading={i === 0 ? 'eager' : 'lazy'}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>

            {/* General Maps */}
            {(job.locationGeo || job.locationText || job.location) && (
              <div className="bg-white border-t-4 border-t-[#0a58ca] border-x border-b border-gray-100 rounded-2xl p-8 shadow-xl shadow-blue-500/[0.03]">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#0a58ca]">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  Location Map
                </h3>
                <div className="rounded-2xl overflow-hidden border border-gray-100">
                  <JobLocationMap
                    locationGeo={job.locationGeo}
                    locationText={job.locationText || job.location}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Information & Applicants */}
          <div className="lg:col-span-7 flex flex-col gap-10">
            
            <div className="bg-white border-t-4 border-t-[#0a58ca] border-x border-b border-gray-100 rounded-2xl p-8 md:p-10 shadow-xl shadow-blue-500/[0.03]">
              <div className="flex flex-col sm:flex-row gap-6 justify-between items-start mb-10 pb-6 border-b border-gray-50">
                <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#0a58ca]">
                    <i className="fas fa-briefcase"></i>
                  </div>
                  Job Overview
                </h2>
                <div className="relative w-full sm:w-64">
                   <select
                    className="w-full bg-gray-50 border border-transparent text-gray-900 text-xs font-black uppercase tracking-widest rounded-2xl px-5 py-4 appearance-none focus:outline-none focus:bg-white focus:border-[#0a58ca] focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer"
                    value={job.status || 'active'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="active">🟢 Active</option>
                    <option value="on-hold">🟡 On Hold</option>
                    <option value="cancelled">🔴 Cancelled</option>
                    <option value="completed">🟣 Completed</option>
                  </select>
                  <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]"></i>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                <InfoRow icon={<i className="fas fa-wrench"></i>} label="Category" value={job.category || '—'} />
                <InfoRow icon={<i className="fas fa-map-marker-alt"></i>} label="Location" value={job.location || '—'} />
                <InfoRow icon={<i className="fas fa-money-bill-wave"></i>} label="Budget" value={job.budget ? `৳${job.budget.toLocaleString()}` : '—'} />
                <InfoRow icon={<i className="fas fa-calendar-alt"></i>} label="Schedule" value={`${job.date || '—'}${job.time ? ` • ${job.time}` : ''}`} />
              </div>

              {/* Skills */}
              {Array.isArray(job.skills) && job.skills.length > 0 && (
                <div className="mb-10">
                  <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Required Expertise</p>
                  <div className="flex flex-wrap gap-3">
                    {job.skills.map((s, i) => (
                      <span key={i} className="px-4 py-2 text-xs font-black bg-gray-50 text-[#0a58ca] rounded-xl border border-gray-100 uppercase tracking-widest">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Scope of Work</p>
                <div className="leading-relaxed text-gray-600 font-medium text-base bg-blue-50/30 border border-blue-100/50 p-8 rounded-2xl whitespace-pre-line leading-relaxed shadow-inner">
                  {job.description || 'No description provided.'}
                </div>
              </div>
            </div>

            {/* Applicants Section */}
            <div className="bg-white border-t-4 border-t-[#0a58ca] border-x border-b border-gray-100 rounded-2xl p-8 md:p-10 shadow-xl shadow-blue-500/[0.03] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
                <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#0a58ca]">
                    <i className="fas fa-users"></i>
                  </div>
                  Applicants List
                </h2>
                <div className="bg-blue-50 border border-blue-100 text-[#0a58ca] font-black px-4 py-1.5 rounded-xl text-xs uppercase tracking-widest shadow-sm">
                  {apps?.length || 0} Total
                </div>
              </div>

              {appsLoading ? (
                <div className="py-20 text-center text-gray-400 font-black uppercase tracking-widest bg-gray-50 rounded-2xl">
                  <i className="fas fa-spinner fa-spin mr-3 text-[#0a58ca]"></i> Loading...
                </div>
              ) : appsErr ? (
                <div className="p-6 border border-red-100 rounded-2xl bg-red-50 text-red-500 font-bold flex items-center gap-4">
                  <i className="fas fa-exclamation-circle text-2xl"></i> {appsErr}
                </div>
              ) : Array.isArray(apps) && apps.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-blue-100/50 shadow-lg shadow-blue-500/[0.02]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#0a58ca] border-b border-[#0a58ca] text-white font-black uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="px-6 py-5 w-8">#</th>
                        <th className="px-6 py-5">Mistri Profile</th>
                        <th className="px-6 py-5">Quote</th>
                        <th className="px-6 py-5 text-center">Status</th>
                        <th className="px-6 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {apps.map((a, i) => (
                        <tr key={`${a.workerId}-${i}`} className="hover:bg-gray-50/50 transition-all group">
                          <td className="px-6 py-6 font-black text-gray-400">{i + 1}</td>
                          <td className="px-6 py-6">
                            <Link to={`/worker/${a.workerId}`} className="flex items-center gap-4 group/link">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0a58ca] font-black text-sm overflow-hidden border border-blue-100 shrink-0">
                                {workerDetails[a.workerId]?.profileCover ? (
                                  <img src={workerDetails[a.workerId].profileCover} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  (workerDetails[a.workerId]?.displayName || a.workerName || 'W').charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="font-black text-gray-900 group-hover/link:text-[#0a58ca] transition-colors uppercase tracking-wide">
                                {([workerDetails[a.workerId]?.firstName, workerDetails[a.workerId]?.lastName].filter(Boolean).join(' ').trim()) ||
                                  workerDetails[a.workerId]?.displayName || 
                                  a.workerName || 
                                  'Unknown Worker'}
                              </span>
                            </Link>
                          </td>
                          <td className="px-6 py-6 font-black text-gray-900">{formatCurrency(a.proposedPrice)}</td>
                          <td className="px-6 py-6 text-center">
                            <Badge text={a.status || 'pending'} tone={(a.status || 'pending').toLowerCase()} />
                          </td>
                          <td className="px-6 py-6 text-right">
                            <button 
                              className="bg-white hover:bg-[#0a58ca] text-[#0a58ca] hover:text-white border border-blue-100 hover:border-[#0a58ca] font-black py-2.5 px-6 rounded-xl transition-all text-[10px] uppercase tracking-widest shadow-sm active:scale-95" 
                              onClick={() => openModal(a)}
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <i className="fas fa-inbox text-3xl text-gray-200"></i>
                  </div>
                  <p className="text-gray-500 font-black uppercase tracking-widest text-xs">No applications yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </PageContainer>

      {/* Detail Management Modal */}
      {open && selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white border border-gray-100 w-full max-w-2xl mx-auto rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gray-50 border-b border-gray-100 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-xs font-black mb-0 text-gray-900 flex items-center gap-3 uppercase tracking-widest">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#0a58ca]">
                  <i className="fas fa-clipboard-list"></i>
                </div>
                Application Management
              </h3>
              <button className="w-10 h-10 rounded-2xl bg-white border border-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all shadow-sm active:scale-90" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-blue-50 flex items-center justify-center text-[#0a58ca] font-black text-2xl shadow-sm overflow-hidden border border-blue-100">
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
                    <h4 className="font-black text-2xl text-gray-900 uppercase tracking-tight">
                      {([workerDetails[selected.workerId]?.firstName, workerDetails[selected.workerId]?.lastName].filter(Boolean).join(' ').trim()) ||
                        workerDetails[selected.workerId]?.displayName || 
                        selected.workerName || 
                        '—'}
                    </h4>
                    <div className="flex items-center gap-4 mt-3">
                      <Badge text={selected.status || 'pending'} tone={(selected.status || 'pending').toLowerCase()} />
                      <Link to={`/worker/${selected.workerId}`} className="text-xs font-black text-[#0a58ca] hover:underline uppercase tracking-widest flex items-center gap-2 transition-all">
                        View Profile <i className="fas fa-external-link-alt text-[10px]"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#0a58ca] shadow-sm">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Email</p>
                    <p className="font-bold text-gray-700 truncate">
                      {selected.status?.toLowerCase() === 'accepted' ? (selected.workerEmail || selected.postedByEmail || 'Hidden until accepted') : 'Hidden until accepted'}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#0a58ca] shadow-sm">
                    <i className="fas fa-phone-alt"></i>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Phone</p>
                    <p className="font-bold text-gray-700">
                      {selected.status?.toLowerCase() === 'accepted' ? (selected.workerPhone || 'Not provided') : 'Hidden until accepted'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Proposal Details</p>
                <div className="p-8 border border-gray-100 rounded-[2rem] bg-gray-50/50 text-gray-600 font-medium text-base whitespace-pre-wrap leading-relaxed">
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
                          <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-blue-100/50">
                            <label className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2 block">Set Negotiation Price</label>
                            <div className="flex items-center gap-3">
                              <span className="w-12 h-12 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-[#0a58ca] font-black shadow-sm">৳</span>
                              <input
                                type="number"
                                min="1"
                                step="100"
                                value={counterPrice}
                                onChange={(e) => setCounterPrice(e.target.value)}
                                className="flex-1 bg-white border border-gray-100 text-gray-900 rounded-xl px-5 py-3 focus:outline-none focus:border-[#0a58ca] focus:ring-4 focus:ring-blue-500/5 font-black text-lg transition-all"
                                placeholder="Enter Price"
                              />
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button
                                className="flex-1 bg-[#0a58ca] hover:bg-[#084298] text-white font-black py-4 rounded-2xl transition-all flex justify-center items-center shadow-lg shadow-blue-500/20 text-xs uppercase tracking-widest active:scale-95"
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
                                {negotiating ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-paper-plane mr-2 text-[10px]"></i> Send Counter</>}
                              </button>
                              <button
                                className="w-28 bg-white hover:bg-gray-100 text-gray-400 font-black py-4 rounded-2xl transition-all border border-gray-100 text-xs uppercase tracking-widest active:scale-95"
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
                          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                            <button
                              className="flex-1 bg-white border border-[#0a58ca] text-[#0a58ca] hover:bg-blue-50 font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest shadow-sm active:scale-95"
                              onClick={() => {
                                setNegotiatingAppId(selected._id);
                                setCounterPrice(selected.counterPrice?.toString() || '');
                              }}
                            >
                              <i className="fas fa-hand-holding-usd"></i> Make Counter Offer
                            </button>
                            {String(selected.negotiationStatus || '').toLowerCase() !== 'countered' && (
                            <button
                              className="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100 hover:border-emerald-600 font-black py-4 px-6 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-3 text-xs uppercase tracking-widest active:scale-95"
                              disabled={negotiating}
                              onClick={() =>
                                updateNegotiation(
                                  selected,
                                  { finalPrice: Number(selected.proposedPrice), negotiationStatus: 'accepted' },
                                  'Price structure accepted!'
                                )
                              }
                            >
                              <i className="fas fa-check"></i> Accept Price
                            </button>
                            )}
                            <button
                              className="w-full sm:w-16 bg-white hover:bg-red-50 text-gray-300 hover:text-red-500 border border-gray-100 hover:border-red-100 font-black py-4 px-2 rounded-2xl transition-all flex items-center justify-center active:scale-95"
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
            <div className="bg-white border-t border-gray-100 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 sticky bottom-0 z-10 backdrop-blur-md bg-white/90">
              <button className="w-full sm:w-auto bg-gray-50 hover:bg-gray-100 text-gray-400 font-black py-4 px-8 rounded-2xl transition-all border border-gray-100 text-xs uppercase tracking-widest active:scale-95" onClick={closeModal}>Go Back</button>
              
              <div className="flex w-full sm:w-auto gap-3">
                {selected.status?.toLowerCase() === 'completed' ? (
                  <button
                    className="flex-1 sm:flex-none bg-[#0a58ca] hover:bg-[#084298] text-white shadow-xl shadow-blue-500/20 font-black py-4 px-10 rounded-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest active:scale-95"
                    onClick={() => {
                      setSelectedApplication(selected);
                      setRatingModalOpen(true);
                      closeModal();
                    }}
                  >
                    <i className="fas fa-star"></i> Rate Progress
                  </button>
                ) : selected.status?.toLowerCase() === 'accepted' ? (
                  <button
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 font-black py-4 px-10 rounded-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest active:scale-95"
                    disabled={deciding}
                    onClick={() => decide(selected, 'completed')}
                  >
                    {deciding ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-double text-sm"></i>}
                    {deciding ? 'Processing...' : 'Complete Project'}
                  </button>
                ) : (
                  <>
                    <button
                      className="flex-1 sm:flex-none bg-white hover:bg-red-50 border border-red-100 text-red-500 font-black py-4 px-10 rounded-2xl transition-all text-xs uppercase tracking-widest active:scale-95"
                      disabled={deciding}
                      onClick={() => decide(selected, 'rejected')}
                    >
                      {deciding && selected.status !== 'rejected' ? <i className="fas fa-spinner fa-spin"></i> : 'Decline'}
                    </button>
                    <button
                      className={`flex-1 sm:flex-none font-black py-4 px-10 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-xs uppercase tracking-widest active:scale-95 ${deciding || (selected.proposedPrice && !isPriceFinalized(selected)) ? 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200 shadow-none' : 'bg-[#0a58ca] hover:bg-[#084298] text-white shadow-blue-500/20'}`}
                      disabled={deciding || (selected.proposedPrice && !isPriceFinalized(selected))}
                      onClick={() => decide(selected, 'accepted')}
                      title={selected.proposedPrice && !isPriceFinalized(selected) ? 'Finalize price first' : 'Accept application'}
                    >
                      {deciding && selected.status !== 'accepted' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-user-check text-sm"></i>}
                      Hire Mistri
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
