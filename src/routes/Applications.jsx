import { useState, useEffect, useContext } from 'react';
import { getAuth } from 'firebase/auth';
import { useTheme } from '../contexts/ThemeContext';
import { AuthContext } from '../Authentication/AuthProvider';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApplicationNotes from '../components/ApplicationNotes';
import RatingModal from '../components/RatingModal';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';

export default function Applications() {
  const { isDarkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const { jobId } = useParams(); // Get jobId from URL
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('accepted');
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(null);
  const [workerDetails, setWorkerDetails] = useState({});
  const [negotiatingAppId, setNegotiatingAppId] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [negotiating, setNegotiating] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Rating modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedApplicationForRating, setSelectedApplicationForRating] = useState(null);

  // Accept success modal - show worker contact after accepting
  const [acceptSuccessModal, setAcceptSuccessModal] = useState(null); // { applicant, workerInfo }

  // Collapsible proposal and negotiation per application
  const [expandedProposal, setExpandedProposal] = useState({});
  const [expandedNegotiation, setExpandedNegotiation] = useState({});
  const toggleProposal = (id) => setExpandedProposal((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleNegotiation = (id) => setExpandedNegotiation((prev) => ({ ...prev, [id]: !prev[id] }));

  // Function to fetch worker details (name, etc. - no phone/email from public)
  const fetchWorkerDetails = async (workerId) => {
    if (workerDetails[workerId]) return workerDetails[workerId];
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      const response = await fetch(`${base}/api/users/${workerId}/public`, {
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const workerData = await response.json();
        setWorkerDetails(prev => ({ ...prev, [workerId]: workerData }));
        return workerData;
      }
    } catch (err) {
      console.error('Failed to fetch worker details:', err);
    }
    return null;
  };

  // Fetch worker contact (phone/email) - only after job accepted, requires auth
  const fetchWorkerContact = async (workerId) => {
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken?.();
      if (!token) return null;
      const res = await fetch(`${base}/api/users/${encodeURIComponent(workerId)}/contact`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.error('Failed to fetch worker contact:', err);
    }
    return null;
  };

  // Function to get worker info with fallbacks (phone/email only for accepted applications)
  const getWorkerInfo = (applicant) => {
    const workerData = workerDetails[applicant.workerId];
    const isAccepted = (applicant.status || '').toLowerCase() === 'accepted';
    return {
      name: ([workerData?.firstName, workerData?.lastName].filter(Boolean).join(' ').trim()) ||
        workerData?.displayName ||
        workerData?.name ||
        applicant.workerName ||
        'Unknown Worker',
      email: isAccepted ? (applicant.workerEmail || workerData?.email || '') : '',
      phone: isAccepted ? (applicant.workerPhone || workerData?.phone || '') : '',
      photo: workerData?.profileCover || workerData?.photoURL || workerData?.profileImage || applicant.workerImage || ''
    };
  };

  // Fetch applications - either for specific job or all user's applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');

      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      let response;

      if (jobId) {
        // Fetch applications for specific job
        response = await fetch(`${base}/api/job-applications/${jobId}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Fetch all applications for jobs posted by the current client
        const url = `${base}/api/client-applications/${user?.uid}`;
        response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setApplications(data || []);

      // Fetch worker details for each application if not already provided
      if (data && data.length > 0) {
        const workerIds = [...new Set(data.map(app => app.workerId).filter(Boolean))];
        await Promise.all(workerIds.map(workerId => fetchWorkerDetails(workerId)));
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchApplications();
    }
  }, [jobId, user?.uid]);

  // Poll for new notifications and refresh applications if needed
  useEffect(() => {
    if (!user?.uid) return;

    const checkNotifications = async () => {
      try {
        const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
        const response = await fetch(`${base}/api/notifications/${user.uid}`, {
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const withdrawnNotifications = (data.notifications || []).filter(
            n => n.type === 'application_withdrawn' && !n.read
          );

          // If there are new withdrawal notifications, refresh applications
          if (withdrawnNotifications.length > 0) {
            fetchApplications();
          }
        }
      } catch (err) {
        console.error('Failed to check notifications:', err);
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkNotifications, 10000);
    return () => clearInterval(interval);
  }, [user?.uid, jobId]);

  const filteredApplicants = applications.filter(applicant => {
    const workerInfo = getWorkerInfo(applicant);
    const matchesFilter = filter === 'all' || applicant.status === filter;
    const matchesSearch = workerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.proposalText?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Group by status: pending, accepted, completed, rejected
  const groupedApplicants = {
    pending: filteredApplicants.filter(a => (a.status || '').toLowerCase() === 'pending'),
    accepted: filteredApplicants.filter(a => (a.status || '').toLowerCase() === 'accepted'),
    completed: filteredApplicants.filter(a => (a.status || '').toLowerCase() === 'completed'),
    rejected: filteredApplicants.filter(a => (a.status || '').toLowerCase() === 'rejected')
  };
  const acceptedCount = groupedApplicants.accepted.length;
  const completedCount = groupedApplicants.completed.length;

  // Update application status
  const updateApplicationStatus = async (applicationId, newStatus) => {
    const applicant = applications.find(a => a._id === applicationId);
    try {
      setUpdating(applicationId);

      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      const response = await fetch(`${base}/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, actorRole: 'client' })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const updatedApplication = await response.json();

      // Update the local state
      const updatedApp = {
        ...applicant,
        ...updatedApplication,
        status: updatedApplication.status || newStatus,
        updatedAt: updatedApplication.updatedAt
      };
      setApplications(prev =>
        prev.map(app =>
          app._id === applicationId ? updatedApp : app
        )
      );

      if (newStatus === 'completed' && applicant) {
        if ((updatedApplication.status || '').toLowerCase() === 'completed') {
          toast.success('Job completed by both sides. You can now rate this worker.');
        } else {
          toast.success('Completion request sent. Waiting for worker confirmation.');
        }
      }
      if (newStatus === 'accepted' && applicant) {
        toast.success('Worker accepted! Call them to coordinate timing and location.');
        const [data, contact] = await Promise.all([
          fetchWorkerDetails(applicant.workerId),
          fetchWorkerContact(applicant.workerId)
        ]);
        const workerInfo = {
          name: data?.name || [data?.firstName, data?.lastName].filter(Boolean).join(' ') || applicant.workerName || 'Unknown Worker',
          email: contact?.email || applicant.workerEmail || '',
          phone: contact?.phone || applicant.workerPhone || ''
        };
        setAcceptSuccessModal({ applicant: updatedApp, workerInfo });
      }

    } catch (err) {
      console.error('Failed to update application status:', err);
      toast.error('Failed to update application status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'accepted': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    }
  };

  const getStatusIcon = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'accepted': return 'fas fa-check-circle';
      case 'completed': return 'fas fa-check-double';
      case 'rejected': return 'fas fa-times-circle';
      default: return 'fas fa-clock';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen text-slate-300 transition-colors duration-300 font-sans">
        <PageContainer>
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-6 text-lg text-slate-400 font-medium tracking-wide">Gathering applications...</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen text-slate-300 transition-colors duration-300 font-sans">
        <PageContainer>
          <div className="text-center py-20 bg-[#121a2f] border border-red-500/20 rounded-3xl shadow-xl mt-8">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-4xl text-red-500 outline-none"></i>
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-3">Failed to load applications</h2>
            <p className="text-lg text-slate-400 font-medium mx-auto">{error}</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  const toggleSelectForCompare = (id) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(item => item !== id);
      if (prev.length >= 3) {
        toast.error('You can compare up to 3 workers at a time');
        return prev;
      }
      return [...prev, id];
    });
  };

  const selectedWorkers = applications.filter(a => selectedForCompare.includes(a._id));

  return (
    <div className="text-slate-100 min-h-screen font-sans">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <div className="w-full px-6 sm:px-8 lg:px-14">
          <div className="py-10">
            {/* Header Section */}
            <div className="mb-10">
              <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                {jobId ? 'Job Applications' : 'Worker Applications'}
              </h1>
              <p className="text-slate-400 text-lg">
                You have <span className="text-[#1754cf] font-semibold">{applications.filter(a => (a.status || '').toLowerCase() === 'accepted').length} active hire{applications.filter(a => (a.status || '').toLowerCase() === 'accepted').length !== 1 ? 's' : ''}</span> and <span className="text-orange-400 font-semibold">{applications.filter(a => (a.status || '').toLowerCase() === 'pending').length} pending</span> request{applications.filter(a => (a.status || '').toLowerCase() === 'pending').length !== 1 ? 's' : ''}.
              </p>
            </div>

            {/* Tabs Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-white/5 gap-4 md:gap-0">
              <div className="flex gap-6 md:gap-10 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                <button
                  onClick={() => setFilter('accepted')}
                  className={`pb-4 ${filter === 'accepted' ? 'border-b-2 border-[#1754cf] text-white font-semibold' : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200 font-medium'} flex items-center gap-2 whitespace-nowrap transition-all`}
                >
                  <i className="fas fa-user-check text-xl"></i>
                  Active Hires
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`pb-4 ${filter === 'all' ? 'border-b-2 border-[#1754cf] text-white font-semibold' : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200 font-medium'} flex items-center gap-2 whitespace-nowrap transition-all`}
                >
                  <i className="fas fa-list text-xl"></i>
                  All
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`pb-4 ${filter === 'pending' ? 'border-b-2 border-[#1754cf] text-white font-semibold' : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200 font-medium'} flex items-center gap-2 whitespace-nowrap transition-all`}
                >
                  <i className="fas fa-clock text-xl"></i>
                  Pending
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`pb-4 ${filter === 'completed' ? 'border-b-2 border-[#1754cf] text-white font-semibold' : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200 font-medium'} flex items-center gap-2 whitespace-nowrap transition-all`}
                >
                  <i className="fas fa-check-double text-xl"></i>
                  Completed
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`pb-4 ${filter === 'rejected' ? 'border-b-2 border-[#1754cf] text-white font-semibold' : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200 font-medium'} flex items-center gap-2 whitespace-nowrap transition-all`}
                >
                  <i className="fas fa-times-circle text-xl"></i>
                  Rejected
                </button>
              </div>
              <div className="flex gap-3 mb-3 shrink-0 w-full md:w-auto items-center">
                {selectedForCompare.length >= 2 && (
                  <button 
                    onClick={() => setShowCompareModal(true)}
                    className="bg-[#1754cf] hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all animate-bounce"
                  >
                    <i className="fas fa-columns"></i> Compare ({selectedForCompare.length})
                  </button>
                )}
                <div className="relative flex-1 md:flex-none">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search applications..."
                    className="w-full bg-[#1a2232] border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#1754cf] md:w-64 text-slate-200 placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* List of Cards */}
            <div className="grid grid-cols-1 gap-4">
              {filteredApplicants.length === 0 ? (
                <div className="text-center py-20 bg-[#1a2232]/50 backdrop-blur-md rounded-2xl border border-white/5">
                  <div className="w-20 h-20 bg-[#243047] rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-inbox text-4xl text-slate-400"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No applications found</h3>
                  <p className="text-slate-500 font-medium mx-auto">
                    {applications.length === 0
                      ? 'No applications have been submitted for this job yet.'
                      : "We couldn't find any applications matching your search or filters."}
                  </p>
                </div>
              ) : (
                filteredApplicants.map((applicant) => {
                  const workerInfo = getWorkerInfo(applicant);
                  const isAccepted = (applicant.status || '').toLowerCase() === 'accepted';
                  const isPending = (applicant.status || '').toLowerCase() === 'pending';
                  const isCompleted = (applicant.status || '').toLowerCase() === 'completed';
                  const isRejected = (applicant.status || '').toLowerCase() === 'rejected';

                  // Dynamic icon/color logic based on status
                  let statusColor = "bg-slate-700 text-slate-300";
                  if (isPending) statusColor = "bg-orange-500/10 text-orange-400";
                  if (isAccepted) statusColor = "bg-[#1754cf]/10 text-[#1754cf]";
                  if (isCompleted) statusColor = "bg-purple-500/10 text-purple-400";
                  if (isRejected) statusColor = "bg-red-500/10 text-red-400";

                  const isSelected = selectedForCompare.includes(applicant._id);

                  return (
                    <div key={applicant._id} className={`bg-[#1a2232]/70 backdrop-blur-xl rounded-2xl p-5 border flex flex-wrap lg:flex-nowrap flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:border-[#1754cf]/30 transition-all group shadow-sm relative ${isSelected ? 'border-[#1754cf] ring-1 ring-[#1754cf]/30' : 'border-white/5'}`}>
                      <div className="flex items-start lg:items-center gap-5 w-full lg:w-auto">
                        <button 
                          onClick={() => toggleSelectForCompare(applicant._id)}
                          className={`shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-[#1754cf] border-[#1754cf] text-white' : 'border-white/10 hover:border-white/30 text-transparent'}`}
                        >
                          <i className="fas fa-check text-[10px]"></i>
                        </button>
                        <div className="h-16 w-16 min-w-[64px] rounded-2xl bg-gradient-to-br from-[#1754cf] to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shrink-0 ring-2 ring-white/5 overflow-hidden">
                          {workerInfo.photo ? (
                            <img src={workerInfo.photo} alt={workerInfo.name} className="w-full h-full object-cover" />
                          ) : (
                            workerInfo.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="w-full">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white group-hover:text-[#1754cf] transition-colors cursor-pointer" onClick={() => navigate(`/worker/${applicant.workerId}`)}>
                              {workerInfo.name}
                            </h3>
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${statusColor}`}>
                              {applicant.status || 'Pending'}
                            </span>
                            {applicant.proposedPrice && isPending && (
                              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                                ৳{applicant.proposedPrice.toLocaleString()} Offer
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 text-sm font-medium mb-1 line-clamp-1">
                            {applicant.title || applicant.jobTitle || 'Job Application'}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-xs">
                            <span className="flex items-center gap-1">
                              Applied {new Date(applicant.createdAt).toLocaleDateString()}
                            </span>
                            {isAccepted && (workerInfo.phone && workerInfo.phone !== 'No phone') && (
                              <span className="flex items-center gap-1 text-[#1754cf]">
                                <i className="fas fa-phone-alt text-[14px]"></i> {workerInfo.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:shrink-0 justify-end mt-2 lg:mt-0">
                        {/* Action buttons */}
                        <button
                          className="px-4 py-2.5 rounded-xl bg-[#243047] text-white text-sm font-semibold hover:bg-[#243047]/80 transition-all flex items-center justify-center gap-2 flex-1 lg:flex-none"
                          onClick={() => navigate(`/worker/${applicant.workerId}`)}
                        >
                          <i className="fas fa-user-circle text-lg"></i>
                          <span className="hidden sm:inline">Profile</span>
                        </button>

                        {isPending && (
                          <>
                            <button
                              className="px-4 py-2.5 rounded-xl bg-[#1754cf]/10 text-[#1754cf] border border-[#1754cf]/20 font-semibold text-sm hover:bg-[#1754cf] hover:text-white transition-all flex items-center justify-center gap-2 flex-1 lg:flex-none"
                              onClick={() => {
                                toggleProposal(applicant._id);
                              }}
                            >
                              <i className="fas fa-file-alt text-lg"></i>
                              <span className="hidden sm:inline">Proposal</span>
                            </button>
                            <button
                              className="px-4 py-2.5 rounded-xl bg-green-500/10 text-green-500 font-semibold text-sm hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-2 flex-1 lg:flex-none disabled:opacity-50"
                              onClick={() => updateApplicationStatus(applicant._id, 'accepted')}
                              disabled={updating === applicant._id}
                            >
                              {updating === applicant._id ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className="fas fa-check-circle text-lg"></i>}
                              <span className="hidden sm:inline">Accept</span>
                            </button>
                            <button
                              className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-500 font-semibold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 flex-1 lg:flex-none disabled:opacity-50"
                              onClick={() => updateApplicationStatus(applicant._id, 'rejected')}
                              disabled={updating === applicant._id}
                            >
                              {updating === applicant._id ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className="fas fa-times-circle text-lg"></i>}
                              <span className="hidden sm:inline">Reject</span>
                            </button>
                          </>
                        )}

                        {isAccepted && (
                          <>
                            <button
                              className="px-4 py-2.5 rounded-xl bg-green-500/10 text-green-500 font-semibold text-sm hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-2 flex-1 lg:flex-none disabled:opacity-50"
                              onClick={() => updateApplicationStatus(applicant._id, 'completed')}
                              disabled={updating === applicant._id}
                            >
                              {updating === applicant._id ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className="fas fa-check-double text-lg"></i>}
                              Mark Done
                            </button>
                          </>
                        )}

                        {isCompleted && (
                          <button
                            className="px-4 py-2.5 rounded-xl bg-yellow-500/10 text-yellow-500 font-semibold text-sm hover:bg-yellow-500 hover:text-white transition-all flex items-center justify-center gap-2 flex-1 lg:flex-none"
                            onClick={() => {
                              setSelectedApplicationForRating(applicant);
                              setRatingModalOpen(true);
                            }}
                          >
                            <i className="fas fa-star text-lg"></i>
                            Rate
                          </button>
                        )}

                        {isRejected && (
                          <button
                            className="px-4 py-2.5 rounded-xl bg-[#243047] text-white font-semibold text-sm hover:bg-[#243047]/80 transition-all flex items-center justify-center gap-2 flex-1 lg:flex-none disabled:opacity-50"
                            onClick={() => updateApplicationStatus(applicant._id, 'pending')}
                            disabled={updating === applicant._id}
                          >
                            {updating === applicant._id ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className="fas fa-undo text-lg"></i>}
                            Reconsider
                          </button>
                        )}
                      </div>

                      {/* Expandable Proposal block */}
                      {expandedProposal[applicant._id] && isPending && (
                        <div className="w-full mt-4 p-4 bg-[#111621] rounded-xl border border-white/5 shadow-inner">
                          <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                            <i className="fas fa-file-alt text-[#1754cf] text-sm"></i> Proposal
                          </h4>
                          <p className="text-slate-300 text-sm whitespace-pre-wrap">
                            {applicant.proposalText || 'No proposal text provided.'}
                          </p>
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pagination Area */}
          <div className="mt-12 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-slate-500 text-sm">Showing <span className="text-slate-200 font-medium">{filteredApplicants.length}</span> of <span className="text-slate-200 font-medium">{applications.length}</span> applications</p>
          </div>
        </div>

        {ratingModalOpen && selectedApplicationForRating && (
          <RatingModal
            isOpen={ratingModalOpen}
            onClose={() => {
              setRatingModalOpen(false);
              setSelectedApplicationForRating(null);
            }}
            jobId={jobId || selectedApplicationForRating.jobId}
            applicationId={selectedApplicationForRating._id?.toString() || selectedApplicationForRating._id}
            workerId={selectedApplicationForRating.workerId}
            workerName={getWorkerInfo(selectedApplicationForRating).name}
            jobTitle={selectedApplicationForRating.title || selectedApplicationForRating.jobTitle || 'Job'}
            onSuccess={() => {
              fetchApplications();
            }}
          />
        )}

        {/* Accept Success Modal */}
        {acceptSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setAcceptSuccessModal(null)}></div>
            <div className="bg-[#1a2232] border border-white/10 rounded-3xl w-full shadow-2xl relative z-10 overflow-hidden transform transition-all">
              <div className="px-8 pt-10 pb-6 text-center border-b border-white/5 relative">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-5 text-green-500">
                  <i className="fas fa-check-circle text-5xl"></i>
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-2">Worker Accepted!</h3>
                <p className="text-slate-400 font-medium">You can contact the worker now to coordinate time and location details.</p>
              </div>

              <div className="p-8 space-y-5 bg-[#111621]">
                <div className="bg-[#1a2232] rounded-2xl p-5 border border-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Worker Name</p>
                      <p className="font-extrabold text-xl text-white">{acceptSuccessModal.workerInfo.name}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a2232] rounded-2xl p-5 border border-white/5 space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Info</p>
                  {acceptSuccessModal.workerInfo.phone && acceptSuccessModal.workerInfo.phone !== 'No phone' && (
                    <a href={`tel:${acceptSuccessModal.workerInfo.phone.replace(/\s/g, '')}`} className="w-full bg-[#1754cf] hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2">
                      <i className="fas fa-phone-alt"></i> Call {acceptSuccessModal.workerInfo.phone}
                    </a>
                  )}
                  {acceptSuccessModal.workerInfo.email && acceptSuccessModal.workerInfo.email !== 'No email' && (
                    <a href={`mailto:${acceptSuccessModal.workerInfo.email}`} className="w-full bg-[#243047] hover:bg-[#243047]/80 text-white font-bold py-3 px-4 rounded-xl transition-all flex justify-center items-center gap-2">
                      <i className="fas fa-envelope"></i> Send Email
                    </a>
                  )}
                </div>

                <div className="pt-2">
                  <button className="w-full bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold py-3 rounded-xl transition-all" onClick={() => setAcceptSuccessModal(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Comparison Modal */}
        {showCompareModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowCompareModal(false)}></div>
            <div className="bg-[#111621] border border-white/10 rounded-[2.5rem] w-full max-w-4xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                 <div>
                   <h2 className="text-2xl font-black text-white tracking-tight">Compare Workers</h2>
                   <p className="text-slate-500 text-sm">Side-by-side comparison of selected applicants</p>
                 </div>
                 <button onClick={() => setShowCompareModal(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all">
                    <i className="fas fa-times"></i>
                 </button>
              </div>

              <div className="overflow-auto p-8">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedWorkers.map(app => {
                      const info = getWorkerInfo(app);
                      const fullInfo = workerDetails[app.workerId];
                      return (
                        <div key={app._id} className="bg-[#1a2232] rounded-[2rem] border border-white/5 p-6 flex flex-col">
                           <div className="flex flex-col items-center text-center mb-6">
                              <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 ring-4 ring-[#1754cf]/10">
                                 {info.photo ? <img src={info.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-blue-500 flex items-center justify-center text-2xl font-black text-white">{info.name[0]}</div>}
                              </div>
                              <h3 className="text-white font-bold text-lg leading-tight mb-1">{info.name}</h3>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1754cf] bg-blue-500/10 px-3 py-1 rounded-full">{fullInfo?.specialty || 'Generalist'}</span>
                           </div>

                           <div className="space-y-4 flex-1">
                              <div className="bg-white/5 rounded-2xl p-4">
                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Rating</p>
                                 <div className="flex items-center gap-2 text-yellow-400 font-black">
                                    <i className="fas fa-star"></i>
                                    <span>{fullInfo?.averageRating ? fullInfo.averageRating.toFixed(1) : 'No Rating'}</span>
                                    <span className="text-[10px] text-slate-500 font-bold ml-auto">({fullInfo?.totalReviews || 0} reviews)</span>
                                 </div>
                              </div>

                              <div className="bg-white/5 rounded-2xl p-4">
                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Price Offer</p>
                                 <p className="text-white font-black text-xl">৳{(app.finalPrice || app.proposedPrice || 0).toLocaleString()}</p>
                              </div>

                              <div className="bg-white/5 rounded-2xl p-4">
                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                 <p className="text-slate-300 font-bold text-sm uppercase tracking-wide">{app.status}</p>
                              </div>
                           </div>

                           <button 
                             onClick={() => { setShowCompareModal(false); navigate(`/worker/${app.workerId}`); }}
                             className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl border border-white/5 transition-all"
                           >
                             View Details
                           </button>
                        </div>
                      )
                    })}
                 </div>
              </div>

              <div className="p-6 bg-[#0f1420] border-t border-white/5 text-center shrink-0">
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Hire-Mistri Comparison Tool v1.0</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
