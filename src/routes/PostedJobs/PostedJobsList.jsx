import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../Authentication/AuthProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer';

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
            ? "w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm font-bold text-red-500 text-left transition-colors bg-transparent border-none"
            : isIconOnly 
              ? "p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" 
              : "w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors border border-red-100"
        }
        title="Delete Job"
        onClick={() => setShowModal(true)}
      >
        <i className={isIconOnly === 'dropdown' ? "fas fa-trash-alt text-sm" : isIconOnly ? "fas fa-trash-alt text-lg" : "fas fa-trash-alt text-sm"}></i>
        {isIconOnly === 'dropdown' && " Delete Job"}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
            </div>
            <h3 className="text-2xl font-black mb-2 text-gray-900 text-center">Delete Job Post</h3>
            <p className="text-gray-500 mb-8 text-center text-sm font-medium">
              Are you sure you want to permanently delete <span className="font-bold text-gray-900">"{jobTitle}"</span>? This action cannot be undone.
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
      className="p-2.5 bg-red-50 rounded-xl text-red-500 hover:text-white hover:bg-red-500 transition-colors"
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
          const name = [data.firstName, data.lastName].filter(Boolean).join(' ') || data.email || 'Worker';
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
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-[#0a58ca] rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl text-gray-900 font-black tracking-widest uppercase">Syncing Jobs...</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-[3rem] border border-red-100 shadow-2xl text-center max-w-lg">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
          </div>
          <h2 className="text-3xl font-black mb-4 text-gray-900">Error Loading Jobs</h2>
          <p className="text-gray-500 font-medium mb-8 leading-relaxed">{err}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#0a58ca] hover:bg-[#084298] text-white font-black py-4 px-10 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
          >
            Retry Now
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#f8f9fa] font-['Inter',sans-serif] pb-20 relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="fixed top-1/2 -left-24 w-72 h-72 bg-blue-50/50 rounded-full blur-3xl pointer-events-none z-0"></div>

      <PageContainer>
        <main className="py-8 w-full relative z-10">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 bg-white rounded-2xl p-8 md:p-12 border border-blue-50/50 shadow-xl shadow-blue-500/[0.03] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-20 -mt-20 blur-2xl"></div>
            <div className="relative z-10">
              <p className="text-xs font-black text-[#0a58ca] uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                <span className="w-10 h-0.5 bg-[#0a58ca]"></span>
                Client Dashboard
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">My Posted <span className="text-[#0a58ca]">Jobs</span></h1>
              <p className="text-gray-500 text-lg font-medium">
                Manage your active projects and review applicants for consistent results.
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/post-job-wizard" className="hidden sm:flex items-center gap-3 bg-[#0a58ca] hover:bg-[#084298] text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                <i className="fas fa-plus text-sm"></i>
                Post New Job
              </Link>
            </div>
          </div>

          {/* Stats Dashboard Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Jobs', val: totalJobs, icon: 'fa-briefcase', color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Active', val: activeJobs, icon: 'fa-bolt', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'In Progress', val: inProgressJobs, icon: 'fa-tools', color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Completed', val: completedJobs, icon: 'fa-check-double', color: 'text-purple-600', bg: 'bg-purple-50' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border-t-4 border-t-[#0a58ca] border-x border-b border-gray-100 shadow-xl shadow-blue-500/[0.03] flex flex-col gap-2 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-2`}>
                  <i className={`fas ${stat.icon}`}></i>
                </div>
                <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-black text-gray-900">{stat.val}</p>
              </div>
            ))}
          </div>

          {/* Tabs Navigation */}
          <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-[2rem] border border-blue-50/50 mb-10 overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: 'all', label: 'All Projects' },
              { id: 'active', label: `Active (${activeJobs})` },
              { id: 'in progress', label: `In Progress (${inProgressJobs})` },
              { id: 'completed', label: `Completed (${completedJobs})` },
              { id: 'expired', label: `Expired` },
              { id: 'drafts', label: `Drafts (${draftJobs})` },
              { id: 'sent-offers', label: `Sent Offers (${sentOffers.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl whitespace-nowrap transition-all duration-300 ${
                  (filter === tab.id || (filter === 'in-progress' && tab.id === 'in progress'))
                    ? 'bg-[#0a58ca] text-white shadow-xl shadow-blue-500/20'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Job Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredJobs.length === 0 ? (
              <div className="col-span-full text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-blue-500/[0.03]">
                 <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <i className="fas fa-folder-open text-4xl text-[#0a58ca]"></i>
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-2">No Jobs Found</h3>
                 <p className="text-gray-500 font-medium mb-8">You haven't posted any jobs in this category yet.</p>
                 <Link to="/post-job-wizard" className="bg-[#0a58ca] hover:bg-[#084298] text-white font-black py-4 px-10 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all inline-flex items-center gap-2">
                   <i className="fas fa-plus text-sm"></i> Post Your First Job
                 </Link>
              </div>
            ) : (
              filteredJobs.map(job => {
                const jobId = job.mongoId || job.id;
                const status = String(job.status || 'active').toLowerCase();
                const offerStatus = (job.offerStatus || 'pending').toLowerCase();
                const isPrivate = job.isPrivate;
                
                // Formatting Badges
                let badgeColor = 'bg-gray-100 text-gray-600';
                let badgeLabel = status;
                
                if (status === 'active') { badgeColor = 'bg-blue-50 text-blue-600'; }
                if (status === 'completed') { badgeColor = 'bg-emerald-50 text-emerald-600'; }
                if (status === 'draft') { badgeColor = 'bg-gray-100 text-gray-600'; badgeLabel = 'Draft'; }
                if (status === 'cancelled') { badgeColor = 'bg-red-50 text-red-600'; }
                if (status === 'expired') { badgeColor = 'bg-gray-100 text-gray-400'; badgeLabel = 'Expired'; }
                if (isPrivate) { 
                  badgeColor = offerStatus === 'accepted' ? 'bg-emerald-50 text-emerald-600' : offerStatus === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600';
                  badgeLabel = `Offer ${offerStatus}`;
                }

                const applicantsCount = job.applicants?.length || 0;
                const hasApplicants = applicantsCount > 0;
                const isDropdownOpen = openDropdownMap[jobId] || false;

                return (
                  <div key={jobId} className="bg-white rounded-2xl overflow-hidden border border-blue-50 hover:border-blue-100 shadow-xl shadow-blue-500/[0.04] hover:shadow-blue-500/[0.12] transition-all duration-500 group flex flex-col relative">
                    <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/5 transition-colors pointer-events-none"></div>
                    <div className="relative h-48 overflow-hidden">
                      {job.images && job.images.length > 0 ? (
                        <img 
                          src={job.images[0]} 
                          alt={job.title} 
                          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${status === 'draft' ? 'opacity-60 grayscale' : ''}`} 
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                          <i className="fas fa-hard-hat text-5xl text-[#0a58ca] opacity-20"></i>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className={`${badgeColor} text-[10px] font-black px-3 py-1.5 rounded-xl shadow-sm uppercase tracking-widest`}>
                          {badgeLabel}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                          <h3 className="text-xl font-black text-gray-900 line-clamp-1 mb-1 group-hover:text-[#0a58ca] transition-colors">{job.title}</h3>
                          <p className="text-xs font-black text-gray-900 uppercase tracking-widest">
                            {job.date || 'Recent Post'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#0a58ca] font-black text-xl">৳{job.budget || '—'}</p>
                          <p className="text-[10px] text-gray-900 font-black uppercase tracking-widest">{job.paymentType === 'hourly' ? 'Rate/Hr' : 'Budget'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-8 mt-auto">
                        {isPrivate ? (
                          <div className="flex items-center gap-3 bg-blue-50/50 p-2 pr-4 rounded-2xl border border-blue-100/50 w-full">
                             <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-[#0a58ca] shadow-sm">
                               <i className="fas fa-user-tie text-xs"></i>
                             </div>
                             <p className="text-xs font-bold text-gray-900">Offer for: <span className="text-[#0a58ca]">{workerNames[job.targetWorkerId] || 'Mistri'}</span></p>
                          </div>
                        ) : status === 'completed' ? (
                           <div className="flex items-center gap-3 bg-emerald-50/50 p-2 pr-4 rounded-2xl border border-emerald-100/50 w-full">
                             <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                               <i className="fas fa-check-circle text-xs"></i>
                             </div>
                             <p className="text-xs font-bold text-emerald-900">Project Completed</p>
                           </div>
                        ) : hasApplicants ? (
                           <div className="flex items-center justify-between w-full">
                             <div className="flex items-center gap-2">
                               <div className="flex -space-x-3">
                                 {[1, 2].map(i => (
                                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[#0a58ca] text-[10px] font-black shadow-sm">
                                     <i className="fas fa-user"></i>
                                   </div>
                                 ))}
                               </div>
                               <p className="text-xs font-black text-gray-700 uppercase tracking-widest ml-1"><span className="text-[#0a58ca] font-black">{applicantsCount}</span> Applicants</p>
                             </div>
                             <i className="fas fa-users text-[#0a58ca] opacity-20"></i>
                           </div>
                        ) : (
                           <p className="text-xs font-bold text-gray-900 italic flex items-center gap-2">
                             <i className="fas fa-hourglass-start text-[#0a58ca]"></i> Waiting for Mistris...
                           </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {status === 'draft' ? (
                          <Link to={`/edit-job/${jobId}`} className="flex-1 bg-white border-2 border-blue-50 text-[#0a58ca] hover:border-[#0a58ca] font-black py-4 rounded-2xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-sm">
                            Finish Listing <i className="fas fa-edit"></i>
                          </Link>
                        ) : hasApplicants && !isPrivate ? (
                          <Link to={`/applications/${jobId}`} className="flex-1 bg-[#0a58ca] hover:bg-[#084298] text-white font-black py-4 rounded-2xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-500/20">
                             Review Apps <i className="fas fa-chevron-right"></i>
                          </Link>
                        ) : (
                          <Link to={`/My-Posted-Job-Details/${jobId}`} className="flex-1 bg-[#0a58ca] hover:bg-[#084298] text-white font-black py-4 rounded-2xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-500/20">
                             View Details <i className="fas fa-chevron-right"></i>
                          </Link>
                        )}

                        <div className="relative">
                          <button 
                            onClick={(e) => { e.preventDefault(); toggleDropdown(jobId); }}
                            className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all flex items-center justify-center active:scale-90"
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          
                          {isDropdownOpen && (
                            <div 
                              className="absolute bottom-16 right-0 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl py-3 z-[100] overflow-hidden transform animate-in slide-in-from-bottom-2"
                              onMouseLeave={() => setOpenDropdownMap({})}
                            >
                              <Link to={`/edit-job/${jobId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 text-xs font-black text-gray-900 uppercase tracking-widest transition-colors">
                                <i className="fas fa-edit text-blue-500"></i> Edit Job
                              </Link>

                              {status !== 'completed' && status !== 'cancelled' && !isPrivate && (
                                 <button 
                                   onClick={() => handleStatusChange(jobId, 'completed')}
                                   className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 text-xs font-black text-emerald-600 uppercase tracking-widest text-left transition-colors"
                                 >
                                   <i className="fas fa-check-circle"></i> Mark Completed
                                 </button>
                              )}

                              <div className="my-2 border-t border-gray-50"></div>
                              
                              <DeleteJobButton 
                                jobId={jobId} 
                                jobTitle={job.title} 
                                isIconOnly={'dropdown'}
                                onDelete={() => setJobs(prev => prev.filter(j => (j.mongoId || j.id) !== jobId))}
                              />
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
      </PageContainer>
    </div>
  );
}
