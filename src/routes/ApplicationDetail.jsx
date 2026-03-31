import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../Authentication/AuthProvider';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const STATUS_CONFIG = {
  pending:   { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: 'fa-clock', label: 'Pending' },
  accepted:  { color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',   icon: 'fa-check-circle', label: 'Accepted' },
  rejected:  { color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',        icon: 'fa-times-circle', label: 'Rejected' },
  completed: { color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',      icon: 'fa-check-double', label: 'Completed' },
  withdrawn: { color: 'text-slate-400',  bg: 'bg-slate-500/10 border-slate-500/20',   icon: 'fa-undo', label: 'Withdrawn' },
};

export default function ApplicationDetail() {
  const { applicationId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/applications/by-id/${applicationId}`);
      setApplication(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) fetchApplication();
  }, [applicationId]);

  const handleStatusChange = async (newStatus) => {
    if (!application?._id) return;
    setUpdating(true);
    try {
      const res = await axios.patch(`${API_BASE}/api/applications/${application._id}/status`, { status: newStatus });
      setApplication(prev => ({ ...prev, ...res.data, workerInfo: prev.workerInfo, jobInfo: prev.jobInfo }));
      toast.success(`Application ${newStatus}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const statusCfg = STATUS_CONFIG[(application?.status || 'pending').toLowerCase()] || STATUS_CONFIG.pending;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111621' }}>
        <div className="flex flex-col items-center gap-4">
          <i className="fas fa-spinner fa-spin text-3xl text-[#1754cf]"></i>
          <p className="text-slate-400 text-sm">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111621' }}>
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
          <h2 className="text-white font-bold text-xl mb-2">Application not found</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-[#1754cf] text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all">
            <i className="fas fa-arrow-left mr-2"></i>Go Back
          </button>
        </div>
      </div>
    );
  }

  const { workerInfo, jobInfo } = application;
  const isClient = user?.uid !== application.workerId;

  return (
    <div className="min-h-screen text-slate-100" style={{ background: '#111621', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .glass { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); backdrop-filter: blur(12px); }
      `}</style>

      <div className="w-full px-6 py-10">

        {/* Back button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors group">
          <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
          Back
        </button>

        {/* Page title */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Application Detail</h1>
            <p className="text-slate-500 text-sm mt-1">ID: <span className="font-mono text-slate-400">{application._id}</span></p>
          </div>
          {/* Status badge */}
          <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full border font-semibold text-sm ${statusCfg.bg} ${statusCfg.color}`}>
            <i className={`fas ${statusCfg.icon}`}></i>
            {statusCfg.label}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Worker Card */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Worker Information</h2>
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center bg-[#1754cf]/20 text-[#1754cf] font-bold text-3xl flex-shrink-0 border border-white/10 shadow-lg">
                  {workerInfo?.profileCover || workerInfo?.photoURL
                    ? <img src={workerInfo.profileCover || workerInfo.photoURL} alt={workerInfo.displayName || workerInfo.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    : (workerInfo?.displayName || workerInfo?.name || application.workerName || 'W').charAt(0).toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-extrabold text-xl truncate">
                    {workerInfo?.displayName || workerInfo?.name || application.workerName || 'Unknown Worker'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    {workerInfo?.specialty && (
                      <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                        <i className="fas fa-tools text-[#1754cf]/60"></i> {workerInfo.specialty}
                      </span>
                    )}
                    {workerInfo?.averageRating > 0 && (
                      <span className="text-yellow-400 text-xs font-bold flex items-center gap-1.5 bg-yellow-400/10 px-2 py-0.5 rounded-lg border border-yellow-400/20">
                        <i className="fas fa-star text-[10px]"></i>{workerInfo.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/worker/${application.workerId}`}
                    className="inline-flex items-center gap-2 mt-3 text-xs font-bold text-blue-400 hover:text-white transition-colors group/link"
                  >
                    View Full Profile <i className="fas fa-arrow-right text-[10px] group-hover/link:translate-x-1 transition-transform"></i>
                  </Link>
                </div>
              </div>
            </div>

            {/* Proposal */}
            {(application.proposalText || application.proposal) && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Proposal</h2>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {application.proposalText || application.proposal}
                </p>
              </div>
            )}

            {/* Pricing */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Pricing</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {application.proposedPrice && (
                  <div className="bg-[#1754cf]/5 border border-[#1754cf]/10 rounded-xl p-4">
                    <p className="text-slate-500 text-xs mb-1">Proposed Price</p>
                    <p className="text-white font-bold text-lg">{application.proposedPrice} <span className="text-slate-500 text-sm font-normal">{application.currency || 'BDT'}</span></p>
                  </div>
                )}
                {application.counterPrice && (
                  <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4">
                    <p className="text-slate-500 text-xs mb-1">Counter Offer</p>
                    <p className="text-orange-400 font-bold text-lg">{application.counterPrice} <span className="text-slate-500 text-sm font-normal">{application.currency || 'BDT'}</span></p>
                  </div>
                )}
                {application.finalPrice && (
                  <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4">
                    <p className="text-slate-500 text-xs mb-1">Agreed Price</p>
                    <p className="text-green-400 font-bold text-lg">{application.finalPrice} <span className="text-slate-500 text-sm font-normal">{application.currency || 'BDT'}</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* Client actions */}
            {isClient && application.status === 'pending' && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Actions</h2>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleStatusChange('accepted')}
                    disabled={updating}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                  >
                    {updating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                    Accept Application
                  </button>
                  <button
                    onClick={() => handleStatusChange('rejected')}
                    disabled={updating}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                  >
                    {updating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-times"></i>}
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="space-y-6">

            {/* Job Info */}
            {jobInfo && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Job</h2>
                <h3 className="text-white font-bold text-base mb-2">{jobInfo.title}</h3>
                {jobInfo.category && (
                  <span className="inline-block text-xs bg-[#1754cf]/10 text-[#1754cf] px-2 py-0.5 rounded-full border border-[#1754cf]/20 mb-3">
                    {jobInfo.category}
                  </span>
                )}
                {jobInfo.description && (
                  <p className="text-slate-400 text-sm line-clamp-3 mb-3">{jobInfo.description}</p>
                )}
                {jobInfo.location && (
                  <p className="text-slate-500 text-xs"><i className="fas fa-map-marker-alt mr-1.5"></i>{jobInfo.location}</p>
                )}
                {jobInfo.budget && (
                  <p className="text-slate-500 text-xs mt-1"><i className="fas fa-wallet mr-1.5"></i>Budget: {jobInfo.budget}</p>
                )}
                <Link
                  to={`/My-Posted-Job-Details/${application.jobId}`}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-[#1754cf]/10 hover:bg-[#1754cf]/20 border border-[#1754cf]/20 text-[#1754cf] rounded-xl text-sm font-semibold transition-all"
                >
                  <i className="fas fa-external-link-alt text-xs"></i> View Full Job
                </Link>
              </div>
            )}

            {/* Timeline */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Timeline</h2>
              <div className="space-y-3">
                {application.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#1754cf]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="fas fa-paper-plane text-[10px] text-[#1754cf]"></i>
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold">Applied</p>
                      <p className="text-slate-500 text-xs">{new Date(application.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {application.updatedAt && application.updatedAt !== application.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${statusCfg.bg}`}>
                      <i className={`fas ${statusCfg.icon} text-[10px] ${statusCfg.color}`}></i>
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold">Status updated to {statusCfg.label}</p>
                      <p className="text-slate-500 text-xs">{new Date(application.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat link */}
            {application.jobId && application.workerId && (
              <Link
                to={`/chats?workerId=${application.workerId}&jobId=${application.jobId}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#1754cf] hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-[#1754cf]/20"
              >
                <i className="fas fa-comment-dots"></i>
                Message Worker
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
