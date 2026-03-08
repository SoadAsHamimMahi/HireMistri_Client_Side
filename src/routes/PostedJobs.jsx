import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// Delete Job Modal & Logic
function DeleteJobButton({ jobId, jobTitle, onDelete, isIconOnly = false }) {
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
      toast.error(err.response?.data?.error || 'Failed to delete job.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button 
        type="button"
        className={
          isIconOnly === 'dropdown' 
            ? "w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 text-sm font-medium text-red-500 text-left transition-colors bg-transparent border-none"
            : isIconOnly 
              ? "p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" 
              : "w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
        }
        title="Delete Job"
        onClick={() => setShowModal(true)}
      >
        <i className={isIconOnly === 'dropdown' ? "fas fa-trash-alt text-sm" : isIconOnly ? "fas fa-trash-alt text-lg" : "fas fa-trash-alt text-sm"}></i>
        {isIconOnly === 'dropdown' && " Delete Job"}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#1a2232] rounded-2xl shadow-2xl p-8 max-w-md w-full border border-red-500/30">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white text-center">Delete Job Post</h3>
            <p className="text-slate-400 mb-8 text-center text-sm">
              Are you sure you want to permanently delete <span className="font-bold text-slate-200">"{jobTitle}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-colors border border-slate-700"
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
                  <i className="fas fa-trash-alt text-sm"></i>
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

// Withdraw Offer Logic
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
      className="p-2.5 bg-red-500/10 rounded-xl text-red-400 hover:text-white hover:bg-red-500 transition-colors"
      title="Withdraw Offer"
      onClick={handleWithdraw}
      disabled={withdrawing}
    >
      {withdrawing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-undo text-lg"></i>}
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
    const url = clientId
      ? `${base}/api/browse-jobs?clientId=${encodeURIComponent(clientId)}&status=all`
      : `${base}/api/browse-jobs`;

    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        setErr('');

        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (ignore) return;

        const normalized = (Array.isArray(data) ? data : []).map((j) => {
          let mongoId = null;
          if (j._id) {
            mongoId = typeof j._id === 'string' ? j._id : j._id.$oid || j._id.toString();
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
        if (e?.name !== 'AbortError') {
          setErr(e.message || 'Failed to load jobs');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [clientId]);

  // Handle worker names for sent offers
  const sentOffers = (jobs || []).filter((j) => j.isPrivate === true);
  const sentOfferWorkerIds = [...new Set(sentOffers.map((j) => j.targetWorkerId).filter(Boolean))];
  
  useEffect(() => {
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    if (sentOfferWorkerIds.length === 0) return;
    let ignore = false;
    sentOfferWorkerIds.forEach((workerId) => {
      if (workerNames[workerId]) return;
      fetch(`${base}/api/users/${encodeURIComponent(workerId)}/public`)
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

  // Dropdown Management State
  const [openDropdownMap, setOpenDropdownMap] = useState({});
  const toggleDropdown = (id) => {
    setOpenDropdownMap(prev => ({ [id]: !prev[id] })); // close others, toggle this
  };

  // Status Change function
  const handleStatusChange = async (jobId, newStatus) => {
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      const response = await fetch(`${base}/api/browse-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, clientId })
      });

      if (!response.ok) throw new Error('Failed to update status');

      setJobs(prevJobs => prevJobs.map(j => (j.mongoId || j.id) === jobId ? { ...j, status: newStatus } : j));
      toast.success(`Job marked as ${newStatus}`);
      setOpenDropdownMap({}); // Close dropdown
    } catch (err) {
      toast.error('Failed to update job status.');
    }
  };

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(job => String(job.status || 'active').toLowerCase() === 'active').length;
  const inProgressJobs = jobs.filter(job => ['in-progress', 'in progress'].includes(String(job.status || '').toLowerCase())).length;
  const completedJobs = jobs.filter(job => String(job.status || '').toLowerCase() === 'completed').length;
  const draftJobs = jobs.filter(job => String(job.status || '').toLowerCase() === 'draft').length;

  const filteredJobs = 
    filter === 'sent-offers' ? sentOffers :
    filter === 'all' ? jobs :
    jobs.filter(job => {
      const st = String(job.status || 'active').toLowerCase();
      const fl = String(filter).toLowerCase();
      if (fl === 'in progress' || fl === 'in-progress') return st === 'in-progress' || st === 'in progress';
      if (fl === 'drafts') return st === 'draft';
      return st === fl;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111621] text-slate-100 flex items-center justify-center">
        <span className="loading loading-spinner text-[#1754cf] loading-lg"></span>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-[#111621] text-slate-100 flex items-center justify-center">
        <div className="bg-[#1a2232] p-8 rounded-2xl border border-red-500/20 text-center">
          <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-bold mb-2">Error Loading Jobs</h2>
          <p className="text-slate-400">{err}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111621] text-slate-100 font-['Inter',sans-serif] pb-20">
      <style>{`
        .glass-panel {
          background: rgba(26, 34, 50, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
      
      {/* Top Header logic is typically in a separate layout, but we'll adapt the main content block from Stitch */}
      <main className="px-6 lg:px-20 py-8 max-w-[1400px] mx-auto w-full">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">My Posted Jobs</h1>
            <p className="text-slate-400 text-lg">
              You have <span className="text-[#1754cf] font-bold">{activeJobs} active</span> projects requiring attention.
            </p>
          </div>
          <div className="flex gap-3">
            {/* The filter options on mobile could be mapped to this filter button, handled mostly by tabs below */}
            <Link to="/post-job" className="hidden sm:flex items-center gap-2 bg-[#1754cf] hover:bg-[#1754cf]/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#1754cf]/20">
              <i className="fas fa-plus text-sm"></i>
              Post New Job
            </Link>
            <Link to="/post-job" className="sm:hidden flex items-center justify-center bg-[#1754cf] text-white w-10 h-10 rounded-xl">
              <i className="fas fa-plus"></i>
            </Link>
          </div>
        </div>

        {/* Stats Dashboard Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-1">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-[#1754cf]/10 rounded-lg text-[#1754cf]">
                <i className="fas fa-briefcase"></i>
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium">Total Jobs</p>
            <p className="text-3xl font-bold text-white">{totalJobs}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-1">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-[#0bda5e]/10 rounded-lg text-[#0bda5e]">
                <i className="fas fa-bolt"></i>
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium">Active</p>
            <p className="text-3xl font-bold text-white">{activeJobs}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-1">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                <i className="fas fa-tools"></i>
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium">In Progress</p>
            <p className="text-3xl font-bold text-white">{inProgressJobs}</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-1">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                <i className="fas fa-check-double"></i>
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium">Completed</p>
            <p className="text-3xl font-bold text-white">{completedJobs}</p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-800 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Jobs' },
            { id: 'active', label: `Active (${activeJobs})` },
            { id: 'in progress', label: `In Progress (${inProgressJobs})` },
            { id: 'completed', label: `Completed (${completedJobs})` },
            { id: 'drafts', label: `Drafts (${draftJobs})` },
            { id: 'sent-offers', label: `Sent Offers (${sentOffers.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-6 py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                (filter === tab.id || (filter === 'in-progress' && tab.id === 'in progress'))
                  ? 'border-[#1754cf] text-[#1754cf]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Job Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-[#1a2232] rounded-2xl border border-slate-800 border-dashed">
               <i className="fas fa-folder-open text-6xl text-slate-600 mb-4"></i>
               <h3 className="text-2xl font-bold text-white mb-2">No Jobs Found</h3>
               <p className="text-slate-400 mb-6">You don't have any jobs matching this filter.</p>
               <Link to="/post-job" className="bg-[#1754cf] hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl inline-flex items-center gap-2">
                 <i className="fas fa-plus text-sm"></i> Post a Job
               </Link>
            </div>
          ) : (
            filteredJobs.map(job => {
              const jobId = job.mongoId || job.id;
              const status = String(job.status || 'active').toLowerCase();
              const offerStatus = (job.offerStatus || 'pending').toLowerCase();
              const isPrivate = job.isPrivate;
              
              // Formatting Badges
              let badgeColor = 'bg-slate-500';
              let badgeLabel = status;
              
              if (status === 'active') { badgeColor = 'bg-[#1754cf]'; }
              if (status === 'completed') { badgeColor = 'bg-[#0bda5e]'; }
              if (status === 'draft') { badgeColor = 'bg-slate-600'; badgeLabel = 'Draft'; }
              if (status === 'cancelled') { badgeColor = 'bg-red-500'; }
              if (isPrivate) { 
                badgeColor = offerStatus === 'accepted' ? 'bg-[#0bda5e]' : offerStatus === 'pending' ? 'bg-orange-500' : 'bg-red-500';
                badgeLabel = `Offer ${offerStatus}`;
              }

              // Application Count Avatars
              const applicantsCount = job.applicants?.length || 0;
              const hasApplicants = applicantsCount > 0;
              const firstTwoApplicants = job.applicants?.slice(0, 2) || [];
              
              const isDropdownOpen = openDropdownMap[jobId] || false;

              return (
                <div key={jobId} className="glass-panel rounded-2xl overflow-visible hover:border-[#1754cf]/40 transition-all group flex flex-col relative z-0">
                  <div className="relative h-40 overflow-hidden rounded-t-2xl z-0">
                    {job.images && job.images.length > 0 ? (
                      <img 
                        src={job.images[0]} 
                        alt={job.title} 
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${status === 'draft' ? 'opacity-60' : ''}`} 
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1e293b] flex items-center justify-center">
                        <i className="fas fa-hard-hat text-5xl text-slate-700 opacity-60"></i>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`${badgeColor} text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider`}>
                        {badgeLabel}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1 relative z-10 bg-[#1a2232] rounded-b-2xl">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1 pr-4">
                        <h3 className="text-xl font-bold text-white line-clamp-1">{job.title}</h3>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
                          {job.date ? `Posted ${job.date}` : 'Recently Created'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[#1754cf] font-bold text-lg">৳{job.budget || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase">{job.paymentType === 'hourly' ? 'Rate/Hr' : 'Budget'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-6 mt-auto">
                      {isPrivate ? (
                        <>
                           <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-800 text-slate-400">
                             <i className="fas fa-user text-sm"></i>
                           </div>
                           <p className="text-xs text-slate-400">Sent to: <span className="text-white font-bold">{workerNames[job.targetWorkerId] || 'Worker'}</span></p>
                        </>
                      ) : status === 'completed' ? (
                         <>
                           <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#0bda5e]/20 text-[#0bda5e]">
                             <i className="fas fa-check-circle text-sm"></i>
                           </div>
                           <p className="text-xs text-slate-400 flex items-center gap-1">Marked as Completed</p>
                         </>
                      ) : status === 'draft' ? (
                          <>
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-700 text-slate-400">
                              <i className="fas fa-edit text-sm"></i>
                            </div>
                            <p className="text-xs text-slate-400 italic">Complete description to post</p>
                          </>
                      ) : hasApplicants ? (
                         <>
                           <div className="flex -space-x-2 overflow-hidden">
                             {firstTwoApplicants.map((app, idx) => (
                               <div key={idx} className="inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-[#111621] bg-[#1754cf]/20 text-[#1754cf] font-bold text-[10px]">
                                 A
                               </div>
                             ))}
                             {applicantsCount > 2 && (
                               <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-700 ring-2 ring-[#111621] text-[10px] font-bold text-white">
                                 +{applicantsCount - 2}
                               </div>
                             )}
                           </div>
                           <p className="text-xs text-slate-400"><span className="text-white font-bold">{applicantsCount}</span> Applicants</p>
                         </>
                      ) : (
                         <>
                           <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                             <i className="fas fa-user-times text-sm"></i>
                           </div>
                           <p className="text-xs text-slate-400">No applicants yet</p>
                         </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Main Action Button */}
                      {status === 'draft' ? (
                        <Link to={`/edit-job/${jobId}`} className="flex-1 bg-transparent border border-[#1754cf] text-[#1754cf] hover:bg-[#1754cf]/10 font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                          Finish Listing <i className="fas fa-edit text-sm"></i>
                        </Link>
                      ) : status === 'completed' ? (
                        <Link to={`/My-Posted-Job-Details/${jobId}`} className="flex-1 bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                          View Details <i className="fas fa-file-invoice text-sm"></i>
                        </Link>
                      ) : hasApplicants && !isPrivate ? (
                        <Link to={`/applications/${jobId}`} className="flex-1 bg-[#1754cf] hover:bg-[#1754cf]/90 text-white font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                           Review Apps <i className="fas fa-arrow-right text-sm"></i>
                        </Link>
                      ) : (
                        <Link to={`/My-Posted-Job-Details/${jobId}`} className="flex-1 bg-[#1754cf] hover:bg-[#1754cf]/90 text-white font-bold py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                           View Details <i className="fas fa-arrow-right text-sm"></i>
                        </Link>
                      )}

                      {/* Ellipsis Dropdown for actions */}
                      <div className="relative">
                        <button 
                          onClick={() => toggleDropdown(jobId)} 
                          onBlur={() => setTimeout(() => setOpenDropdownMap(prev => ({...prev, [jobId]: false})), 200)}
                          className="p-2.5 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors flex items-center justify-center"
                        >
                          <i className="fas fa-ellipsis-h text-lg"></i>
                        </button>
                        
                        {isDropdownOpen && (
                          <div className="absolute bottom-12 right-0 w-48 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl py-2 z-50 overflow-hidden transform origin-bottom-right">
                            <Link to={`/edit-job/${jobId}`} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-700 text-sm font-medium text-slate-200">
                              <i className="fas fa-edit text-sm"></i> Edit Job
                            </Link>

                            {/* Status Adjustments */}
                            {status !== 'completed' && status !== 'cancelled' && !isPrivate && (
                               <button 
                                 onMouseDown={() => handleStatusChange(jobId, 'completed')}
                                 className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 text-sm font-medium text-[#0bda5e] text-left"
                               >
                                 <i className="fas fa-check-circle text-sm"></i> Mark Completed
                               </button>
                            )}

                            {isPrivate && (job.offerStatus || 'pending').toLowerCase() === 'pending' ? (
                              <div className="px-1 pt-1 pb-1">
                                <WithdrawOfferButton 
                                  jobId={jobId} 
                                  jobTitle={job.title} 
                                  clientId={clientId}
                                  onWithdrawn={() => setJobs(prev => prev.map(j => j.mongoId === jobId ? { ...j, offerStatus: 'withdrawn', status: 'cancelled'} : j))}
                                />
                              </div>
                            ) : (
                              <div className="mt-1 border-t border-slate-700 pt-1 w-full text-left">
                                <DeleteJobButton 
                                  jobId={jobId} 
                                  jobTitle={job.title} 
                                  isIconOnly={'dropdown'}
                                  onDelete={() => setJobs(prev => prev.filter(j => (j.mongoId || j.id) !== jobId))}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  );
}
