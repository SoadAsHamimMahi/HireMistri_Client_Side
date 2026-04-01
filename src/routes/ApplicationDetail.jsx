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

  // Additional Charges & Completion State
  const [extraCharges, setExtraCharges] = useState([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);

  const fetchExtraCharges = async () => {
    if (!applicationId) return;
    try {
      const res = await axios.get(`${API_BASE}/api/applications/${applicationId}/additional-charges`);
      setExtraCharges(res.data);
    } catch (err) {
      console.warn('Could not fetch extra charges', err);
    }
  };

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
    if (applicationId) {
      fetchApplication();
      fetchExtraCharges();
    }
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

  const handleChargeAction = async (chargeId, action) => {
    try {
      await axios.post(`${API_BASE}/api/applications/${applicationId}/additional-charges/approve`, {
        chargeId,
        status: action
      });
      toast.success(`Charge ${action.toLowerCase()}!`);
      fetchExtraCharges();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action.toLowerCase()} charge`);
    }
  };

  const handleCompleteJob = async () => {
    setCompleting(true);
    try {
      const res = await axios.patch(`${API_BASE}/api/applications/${application._id}/status`, { status: 'completed' });
      setApplication(prev => ({ ...prev, ...res.data, workerInfo: prev.workerInfo, jobInfo: prev.jobInfo }));
      toast.success('Job marked as completed successfully!');
      setShowCompleteModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete job');
    } finally {
      setCompleting(false);
    }
  };

  const statusCfg = STATUS_CONFIG[(application?.status || 'pending').toLowerCase()] || STATUS_CONFIG.pending;
  
  // Calculations for Itemized Bill
  const laborAmount = Number(application?.finalPrice || application?.proposedPrice || 0);
  const approvedExtras = extraCharges.filter(c => c.status === 'APPROVED' && c.type === 'EXTRA_COST').reduce((s, c) => s + Number(c.amount), 0);
  const approvedTips = extraCharges.filter(c => c.status === 'APPROVED' && c.type === 'TIP').reduce((s, c) => s + Number(c.amount), 0);
  const totalBill = laborAmount + approvedExtras + approvedTips;

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

        {/* --- Job Progress Tracker Stepper --- */}
        <div className="glass rounded-2xl p-6 mb-8 overflow-x-auto">
          <div className="min-w-[600px] flex items-center justify-between relative">
            {/* Background line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 rounded-full overflow-hidden">
              {(() => {
                const stepIndex = ['pending', 'accepted', 'completed'].indexOf((application.status || 'pending').toLowerCase());
                const width = stepIndex === 0 ? '50%' : stepIndex === 1 ? '100%' : stepIndex === 2 ? '100%' : '50%';
                if (['rejected', 'withdrawn'].includes(application.status)) return null;
                return <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: stepIndex >= 2 ? '100%' : (stepIndex > 0 ? '50%' : '0%') }} />;
              })()}
            </div>

            {/* Step: Applied */}
            <div className={`relative z-10 flex flex-col items-center gap-2 ${['rejected', 'withdrawn'].includes(application.status) ? 'opacity-50' : 'opacity-100'}`}>
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <i className="fas fa-paper-plane"></i>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Applied</span>
            </div>

            {/* Step: Accepted */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              {['rejected', 'withdrawn'].includes(application.status) ? (
                <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  <i className="fas fa-times"></i>
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${['accepted', 'completed'].includes(application.status) ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-[#111621] border-2 border-slate-600 text-slate-500'}`}>
                  {['accepted', 'completed'].includes(application.status) ? <i className="fas fa-handshake"></i> : <i className="fas fa-hourglass-half"></i>}
                </div>
              )}
              <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${['rejected', 'withdrawn'].includes(application.status) ? 'text-red-400' : ['accepted', 'completed'].includes(application.status) ? 'text-green-400' : 'text-slate-500'}`}>
                {['rejected', 'withdrawn'].includes(application.status) ? application.status : 'Accepted'}
              </span>
            </div>

            {/* Step: Completed */}
            <div className={`relative z-10 flex flex-col items-center gap-2 ${['rejected', 'withdrawn'].includes(application.status) ? 'opacity-50' : 'opacity-100'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${application.status === 'completed' ? 'bg-[#1754cf] text-white shadow-[0_0_15px_rgba(23,84,207,0.5)]' : 'bg-[#111621] border-2 border-slate-600 text-slate-500'}`}>
                <i className="fas fa-flag-checkered"></i>
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${application.status === 'completed' ? 'text-blue-400' : 'text-slate-500'}`}>Completed</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Job Expiry Warning */}
            {application?.jobInfo?.status === 'expired' && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 flex items-start gap-4 shadow-lg shadow-orange-500/5 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                  <i className="fas fa-exclamation-triangle text-orange-500 text-lg"></i>
                </div>
                <div>
                  <h4 className="text-white font-bold text-base mb-1">Attention: Job Expired</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    This job has reached its expiration date and is no longer visible to new workers. 
                    You can still communicate with this applicant, but no new applications can be received.
                  </p>
                </div>
              </div>
            )}

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

            {/* Additional Charges Section for Client */}
            {isClient && ['accepted', 'completed'].includes(application.status) && (
               <div className="glass rounded-2xl p-6">
                 <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Additional Charges & Tips</h2>
                 </div>
                 
                 {extraCharges.length > 0 ? (
                    <div className="space-y-4">
                       {extraCharges.map(charge => (
                          <div key={charge._id} className="bg-[#111621] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                             <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${charge.type === 'TIP' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                       {charge.type.replace('_', ' ')}
                                    </span>
                                    <span className="text-white font-bold text-lg">৳{Number(charge.amount).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-slate-400">{charge.description}</p>
                                {charge.receiptUrls?.length > 0 && (
                                   <div className="flex gap-3 mt-2">
                                     {charge.receiptUrls.map((url, i) => (
                                        <a key={i} href={API_BASE + url} target="_blank" rel="noreferrer" className="text-xs text-[#1754cf] hover:underline flex items-center gap-1">
                                          <i className="fas fa-file-invoice"></i> Receipt {i + 1}
                                        </a>
                                     ))}
                                   </div>
                                )}
                             </div>
                             
                             <div className="flex flex-col gap-2 shrink-0">
                                {charge.status === 'PENDING' && application.status === 'accepted' ? (
                                   <div className="flex gap-2">
                                     <button onClick={() => handleChargeAction(charge._id, 'APPROVED')} className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 font-bold text-xs rounded-lg transition-colors">
                                        Approve
                                     </button>
                                     <button onClick={() => handleChargeAction(charge._id, 'REJECTED')} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold text-xs rounded-lg transition-colors">
                                        Reject
                                     </button>
                                   </div>
                                ) : (
                                   <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg text-center ${
                                      charge.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                      charge.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                      'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                   }`}>
                                      {charge.status}
                                   </span>
                                )}
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <p className="text-sm text-slate-500 italic">No additional charges requested by the worker.</p>
                 )}
                 
                 {/* Checkout / Complete Job Action */}
                 {application.status === 'accepted' && (
                    <div className="mt-8 pt-6 border-t border-white/5 text-right">
                       <button onClick={() => setShowCompleteModal(true)} className="inline-flex items-center gap-2 px-8 py-3 bg-[#1754cf] hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5">
                          Review & Complete Job <i className="fas fa-check-double"></i>
                       </button>
                    </div>
                 )}
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

      {/* Itemized Bill / Checkout Modal */}
      {showCompleteModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-[#111621] border border-white/10 rounded-2xl max-w-md w-full shadow-2xl p-6 relative">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-extrabold text-white">Itemized Final Bill</h3>
                  <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-white transition-colors">
                     <i className="fas fa-times"></i>
                  </button>
               </div>
               
               <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-slate-300">
                     <span className="text-sm font-medium">Labor Cost (Agreed Bid)</span>
                     <span className="font-bold">৳ {laborAmount.toLocaleString()}</span>
                  </div>
                  {approvedExtras > 0 && (
                     <div className="flex justify-between items-center text-blue-400">
                        <span className="text-sm font-medium">Approved Extra Costs</span>
                        <span className="font-bold">+ ৳ {approvedExtras.toLocaleString()}</span>
                     </div>
                  )}
                  {approvedTips > 0 && (
                     <div className="flex justify-between items-center text-purple-400">
                        <span className="text-sm font-medium">Approved Tips</span>
                        <span className="font-bold">+ ৳ {approvedTips.toLocaleString()}</span>
                     </div>
                  )}
                  
                  <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-center">
                     <span className="text-sm font-bold text-white uppercase tracking-widest">Total to Pay Worker</span>
                     <span className="text-3xl font-black text-green-400">৳ {totalBill.toLocaleString()}</span>
                  </div>
               </div>

               <div className="bg-[#1754cf]/10 border border-[#1754cf]/20 rounded-xl p-4 mb-6">
                  <p className="text-xs text-[#1754cf] leading-relaxed">
                     <i className="fas fa-info-circle mr-1"></i>
                     By completing this job, you confirm that the worker has finished the task to your satisfaction. You must pay this total amount directly to the worker. A platform fee will be automatically deducted from the worker's wallet.
                  </p>
               </div>

               <div className="flex gap-3">
                  <button onClick={() => setShowCompleteModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-colors">
                     Cancel
                  </button>
                  <button onClick={handleCompleteJob} disabled={completing} className="flex-[2] py-3 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-colors shadow-lg shadow-green-500/20 disabled:opacity-50">
                     {completing ? 'Processing...' : 'Confirm & Complete Job'}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
