import { useState, useEffect, useContext } from 'react';
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
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(null);
  const [workerDetails, setWorkerDetails] = useState({});
  const [negotiatingAppId, setNegotiatingAppId] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [negotiating, setNegotiating] = useState(false);
  
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

  // Function to fetch worker details
  const fetchWorkerDetails = async (workerId) => {
    if (workerDetails[workerId]) return workerDetails[workerId]; // Already cached
    
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      // Use public profile endpoint to avoid pulling private fields
      const response = await fetch(`${base}/api/users/${workerId}/public`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const workerData = await response.json();
        setWorkerDetails(prev => ({
          ...prev,
          [workerId]: workerData
        }));
        return workerData;
      }
    } catch (err) {
      console.error('Failed to fetch worker details:', err);
    }
    return null;
  };

  // Function to get worker info with fallbacks
  const getWorkerInfo = (applicant) => {
    const workerData = workerDetails[applicant.workerId];
    return {
      name: workerData?.displayName || 
            workerData?.name || 
            [workerData?.firstName, workerData?.lastName].filter(Boolean).join(' ') ||
            applicant.workerName || 
            'Unknown Worker',
      email: workerData?.email || applicant.workerEmail || 'No email',
      phone: workerData?.phone || applicant.workerPhone || 'No phone'
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
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const updatedApplication = await response.json();
      
      // Update the local state
      const updatedApp = { ...applicant, status: newStatus, updatedAt: updatedApplication.updatedAt };
      setApplications(prev => 
        prev.map(app => 
          app._id === applicationId ? updatedApp : app
        )
      );

      if (newStatus === 'completed' && applicant) {
        toast.success('Marked as completed. You can now rate this worker.');
      }
      if (newStatus === 'accepted' && applicant) {
        toast.success('Worker accepted! Call them to coordinate timing and location.');
        const data = await fetchWorkerDetails(applicant.workerId);
        const workerInfo = {
          name: data?.displayName || [data?.firstName, data?.lastName].filter(Boolean).join(' ') || applicant.workerName || 'Unknown Worker',
          email: data?.email || applicant.workerEmail || 'No email',
          phone: data?.phone || applicant.workerPhone || 'No phone'
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
      case 'accepted':
        return 'badge-success';
      case 'completed':
        return 'badge-info';
      case 'rejected':
        return 'badge-error';
      default:
        return 'badge-warning';
    }
  };

  const getStatusIcon = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'accepted':
        return 'fas fa-check-circle';
      case 'completed':
        return 'fas fa-check-double';
      case 'rejected':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-clock';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen page-bg transition-colors duration-300">
        <PageContainer>
          <div className="text-center py-10">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="mt-4 text-lg text-base-content">Loading applications...</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen page-bg transition-colors duration-300">
        <PageContainer>
          <div className="text-center py-10">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold mb-2 text-base-content">Failed to load applications</h2>
            <p className="text-lg opacity-70">{error}</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg transition-colors duration-300">
      <PageContainer>
        <PageHeader
          title={jobId ? 'Job Applications' : 'All Applications'}
          subtitle={jobId
            ? 'Review and manage applications for this specific job posting'
            : 'Review and manage all applications across your job postings'
          }
          icon={<i className="fas fa-file-alt"></i>}
        />
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="card bg-base-200 border-l-4 border-info p-4 lg:p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70">Total</p>
                <p className="text-3xl font-bold text-base-content">{applications.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-info/20">
                <i className="fas fa-briefcase text-info text-xl"></i>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border-l-4 border-warning p-4 lg:p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70">Pending</p>
                <p className="text-3xl font-bold text-base-content">
                  {applications.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-warning/20">
                <i className="fas fa-clock text-warning text-xl"></i>
              </div>
            </div>
          </div>

          <div className={`card bg-base-200 border-l-4 border-primary p-4 lg:p-6 transition-colors duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium opacity-70`}>Accepted</p>
                <p className={`text-3xl font-bold text-base-content`}>
                  {applications.filter(a => a.status === 'accepted').length}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-primary/20`}>
                <i className="fas fa-check-circle text-primary text-xl"></i>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border-l-4 border-info p-4 lg:p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70">Completed</p>
                <p className="text-3xl font-bold text-base-content">
                  {applications.filter(a => (a.status || '').toLowerCase() === 'completed').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-info/20">
                <i className="fas fa-check-double text-info text-xl"></i>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border-l-4 border-error p-4 lg:p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70">Rejected</p>
                <p className="text-3xl font-bold text-base-content">
                  {applications.filter(a => (a.status || '').toLowerCase() === 'rejected').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-error/20">
                <i className="fas fa-times-circle text-error text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card bg-base-200 shadow-sm p-6 mb-8 transition-colors duration-300">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2 text-base-content">Search by Name or Proposal</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by worker name or proposal text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`input input-bordered w-full pl-10`}
                />
                <i className={`fas fa-search absolute left-3 top-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
              </div>
            </div>
            <div className="lg:w-64">
              <label className="block text-sm font-medium mb-2 text-base-content">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={`select select-bordered w-full`}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Hires - Quick access when there are accepted applications */}
        {acceptedCount > 0 && filter === 'all' && (
          <div className="card bg-gradient-to-r from-success/10 to-emerald-500/10 border-2 border-success/30 shadow-lg mb-8 transition-colors duration-300">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <i className="fas fa-user-check text-success text-xl"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-base-content">Active Hires</h2>
                  <p className="text-sm opacity-70">Call your accepted workers to coordinate</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {groupedApplicants.accepted.slice(0, 5).map((applicant) => {
                  const info = getWorkerInfo(applicant);
                  return (
                    <div key={applicant._id} className="flex items-center gap-3 bg-base-100/80 rounded-xl p-4 border border-success/20 min-w-[200px]">
                      <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success font-bold">
                        {info.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base-content truncate">{info.name}</p>
                        <p className="text-xs opacity-70 truncate">{applicant.title || applicant.jobTitle || 'Job'}</p>
                        {info.phone && info.phone !== 'No phone' && (
                          <a href={`tel:${info.phone.replace(/\s/g, '')}`} className="btn btn-success btn-sm mt-2">
                            <i className="fas fa-phone mr-1"></i>Call
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Applications List - Grouped by status */}
        <div className="space-y-8">
          {['pending', 'accepted', 'completed', 'rejected'].map((statusKey) => {
            const group = groupedApplicants[statusKey];
            if (group.length === 0) return null;
            const sectionLabels = { pending: 'Pending Review', accepted: 'Active Hires', completed: 'Completed', rejected: 'Rejected' };
            const sectionIcons = { pending: 'fa-clock', accepted: 'fa-user-check', completed: 'fa-check-double', rejected: 'fa-times-circle' };
            const sectionClass = { pending: 'text-warning', accepted: 'text-success', completed: 'text-info', rejected: 'text-error' };
            return (
              <div key={statusKey}>
                <h3 className={`flex items-center gap-2 text-lg font-semibold mb-4 ${sectionClass[statusKey]}`}>
                  <i className={`fas ${sectionIcons[statusKey]} ${sectionClass[statusKey]}`}></i>
                  {sectionLabels[statusKey]} ({group.length})
                </h3>
                <div className="space-y-6">
                  {group.map((applicant) => {
                    const workerInfo = getWorkerInfo(applicant);
                    const isAccepted = (applicant.status || '').toLowerCase() === 'accepted';
                    return (
              <div key={applicant._id} className={`card shadow-sm overflow-hidden transition-colors duration-300 ${isAccepted ? 'bg-success/5 border-l-4 border-success' : 'bg-base-200 border border-base-300'}`}>
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-primary-content font-bold text-xl">
                        {workerInfo.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-base-content">
                            {workerInfo.name}
                          </h3>
                            <span className={`badge ${getStatusColor(applicant.status)} gap-1`}>
                            <i className={`${getStatusIcon(applicant.status)}`}></i>
                            {(applicant.status || '').toLowerCase() === 'accepted' ? 'Active' : (applicant.status || 'pending')}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm mb-3 opacity-80 space-y-0">
                          <span className="flex items-center gap-1">
                            <i className="fas fa-envelope text-primary"></i>
                            {workerInfo.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="fas fa-phone text-primary"></i>
                            {workerInfo.phone}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-sm opacity-70">
                            Applied {new Date(applicant.createdAt).toLocaleDateString()}
                          </span>
                          {applicant.updatedAt && applicant.updatedAt !== applicant.createdAt && (
                            <span className="text-sm opacity-70">
                              • Updated {new Date(applicant.updatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Collapsible Proposal */}
                        <div className="space-y-4">
                          {expandedProposal[applicant._id] ? (
                            <div className="card bg-base-300 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-base-content">Proposal</h4>
                                <button type="button" className="btn btn-ghost btn-xs" onClick={() => toggleProposal(applicant._id)}>Collapse</button>
                              </div>
                              <p className="text-base-content opacity-80 leading-relaxed">
                                {applicant.proposalText || 'No proposal text provided.'}
                              </p>
                            </div>
                          ) : (
                            <button type="button" className="btn btn-ghost btn-sm gap-2 text-primary" onClick={() => toggleProposal(applicant._id)}>
                              <i className="fas fa-file-alt"></i> View proposal
                            </button>
                          )}
                        </div>

                        {/* Price Negotiation Section - Collapsible */}
                        {applicant.proposedPrice && (
                          <div className="mt-4 space-y-4">
                            {expandedNegotiation[applicant._id] ? (
                          <div className="card bg-gradient-to-r from-primary/10 to-blue/10 border border-primary/20 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-base-content">
                                <i className="fas fa-money-bill-wave mr-2"></i>
                                Price Negotiation
                              </h4>
                              <div className="flex items-center gap-2">
                                {applicant.negotiationStatus && (
                                <span className={`badge badge-sm ${
                                  applicant.negotiationStatus === 'accepted' ? 'badge-success' :
                                  applicant.negotiationStatus === 'countered' ? 'badge-warning' :
                                  applicant.negotiationStatus === 'pending' ? 'badge-info' :
                                  'badge-ghost'
                                }`}>
                                  {applicant.negotiationStatus}
                                </span>
                                )}
                                <button type="button" className="btn btn-ghost btn-xs" onClick={() => toggleNegotiation(applicant._id)}>Hide</button>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-2 bg-base-200 rounded">
                                <span className="text-sm opacity-70">Worker Proposed:</span>
                                <span className="font-bold text-primary text-lg">
                                  ৳{applicant.proposedPrice.toLocaleString()}
                                </span>
                              </div>
                              
                              {applicant.counterPrice && (
                                <div className="flex items-center justify-between p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                                  <span className="text-sm opacity-70">Your Counter:</span>
                                  <span className="font-bold text-yellow-700 dark:text-yellow-300 text-lg">
                                    ৳{applicant.counterPrice.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              
                              {applicant.finalPrice && (
                                <div className="flex items-center justify-between p-2 bg-green-100 dark:bg-green-900/30 rounded">
                                  <span className="text-sm opacity-70">Final Agreed Price:</span>
                                  <span className="font-bold text-green-700 dark:text-green-300 text-lg">
                                    ৳{applicant.finalPrice.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              
                              {applicant.negotiationStatus !== 'accepted' && applicant.negotiationStatus !== 'cancelled' && (
                                <div className="mt-3">
                                  {negotiatingAppId === applicant._id ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">৳</span>
                                        <input
                                          type="number"
                                          value={counterPrice}
                                          onChange={(e) => setCounterPrice(e.target.value)}
                                          placeholder="Enter counter price"
                                          className="flex-1 input input-sm input-bordered"
                                          min="0"
                                          step="100"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          className="btn btn-sm btn-primary"
                                          onClick={async () => {
                                            if (!counterPrice || isNaN(parseFloat(counterPrice)) || parseFloat(counterPrice) <= 0) {
                                              alert('Please enter a valid price');
                                              return;
                                            }
                                            try {
                                              setNegotiating(true);
                                              const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
                                              const response = await fetch(`${base}/api/applications`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  jobId: applicant.jobId,
                                                  workerId: applicant.workerId,
                                                  counterPrice: parseFloat(counterPrice),
                                                  negotiationStatus: 'countered'
                                                })
                                              });
                                              if (response.ok) {
                                                const data = await response.json();
                                                setApplications(prev => prev.map(app => 
                                                  app._id === applicant._id 
                                                    ? { ...app, counterPrice: parseFloat(counterPrice), negotiationStatus: 'countered' }
                                                    : app
                                                ));
                                                setNegotiatingAppId(null);
                                                setCounterPrice('');
                                                alert('Counter-offer sent!');
                                              } else {
                                                throw new Error('Failed to send counter-offer');
                                              }
                                            } catch (err) {
                                              console.error('Failed to send counter-offer:', err);
                                              alert('Failed to send counter-offer. Please try again.');
                                            } finally {
                                              setNegotiating(false);
                                            }
                                          }}
                                          disabled={negotiating}
                                        >
                                          {negotiating ? (
                                            <i className="fas fa-spinner fa-spin"></i>
                                          ) : (
                                            <>
                                              <i className="fas fa-handshake mr-1"></i>
                                              Send Counter
                                            </>
                                          )}
                                        </button>
                                        <button
                                          className="btn btn-sm btn-ghost"
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
                                    <div className="flex gap-2">
                                      <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => {
                                          setNegotiatingAppId(applicant._id);
                                          setCounterPrice(applicant.counterPrice?.toString() || '');
                                        }}
                                      >
                                        <i className="fas fa-handshake mr-1"></i>
                                        {applicant.counterPrice ? 'Update Counter' : 'Counter Offer'}
                                      </button>
                                      <button
                                        className="btn btn-sm btn-success"
                                        onClick={async () => {
                                          if (!confirm(`Accept worker's proposed price of ৳${applicant.proposedPrice.toLocaleString()}?`)) return;
                                          try {
                                            setNegotiating(true);
                                            const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
                                            const response = await fetch(`${base}/api/applications`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                jobId: applicant.jobId,
                                                workerId: applicant.workerId,
                                                finalPrice: applicant.proposedPrice,
                                                negotiationStatus: 'accepted'
                                              })
                                            });
                                            if (response.ok) {
                                              setApplications(prev => prev.map(app => 
                                                app._id === applicant._id 
                                                  ? { ...app, finalPrice: applicant.proposedPrice, negotiationStatus: 'accepted' }
                                                  : app
                                              ));
                                              alert('Price accepted!');
                                            } else {
                                              throw new Error('Failed to accept price');
                                            }
                                          } catch (err) {
                                            console.error('Failed to accept price:', err);
                                            alert('Failed to accept price. Please try again.');
                                          } finally {
                                            setNegotiating(false);
                                          }
                                        }}
                                        disabled={negotiating}
                                      >
                                        <i className="fas fa-check mr-1"></i>
                                        Accept Price
                                      </button>
                                      <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={async () => {
                                          if (!confirm('Cancel price negotiation?')) return;
                                          try {
                                            setNegotiating(true);
                                            const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
                                            const response = await fetch(`${base}/api/applications`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                jobId: applicant.jobId,
                                                workerId: applicant.workerId,
                                                negotiationStatus: 'cancelled'
                                              })
                                            });
                                            if (response.ok) {
                                              setApplications(prev => prev.map(app => 
                                                app._id === applicant._id 
                                                  ? { ...app, negotiationStatus: 'cancelled' }
                                                  : app
                                              ));
                                            }
                                          } catch (err) {
                                            console.error('Failed to cancel negotiation:', err);
                                          } finally {
                                            setNegotiating(false);
                                          }
                                        }}
                                        disabled={negotiating}
                                      >
                                        <i className="fas fa-times mr-1"></i>
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                            ) : (
                              <button type="button" className="btn btn-ghost btn-sm gap-2 text-primary" onClick={() => toggleNegotiation(applicant._id)}>
                                <i className="fas fa-money-bill-wave"></i> View price details
                              </button>
                            )}
                          </div>
                        )}

                        {/* Application Notes */}
                        <ApplicationNotes
                          applicationId={applicant._id}
                          userId={user?.uid}
                          userName={user?.displayName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-2 ml-0 md:ml-4 mt-4 md:mt-0">
                      <button 
                        className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white border-none"
                        onClick={() => {
                          const wid = applicant.workerId;
                          if (!wid) return;
                          navigate(`/worker/${wid}`);
                        }}
                      >
                        <i className="fas fa-eye mr-1"></i>
                        View Profile
                      </button>
                      {(applicant.status || '').toLowerCase() === 'pending' && (
                        <>
                          <button 
                            className="btn btn-sm btn-primary border-none"
                            onClick={() => updateApplicationStatus(applicant._id, 'accepted')}
                            disabled={updating === applicant._id}
                          >
                            {updating === applicant._id ? (
                              <i className="fas fa-spinner fa-spin mr-1"></i>
                            ) : (
                              <i className="fas fa-check mr-1"></i>
                            )}
                            Accept
                          </button>
                          <button 
                            className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-none"
                            onClick={() => updateApplicationStatus(applicant._id, 'rejected')}
                            disabled={updating === applicant._id}
                          >
                            {updating === applicant._id ? (
                              <i className="fas fa-spinner fa-spin mr-1"></i>
                            ) : (
                              <i className="fas fa-times mr-1"></i>
                            )}
                            Reject
                          </button>
                        </>
                      )}
                      {(applicant.status || '').toLowerCase() === 'accepted' && (() => {
                        const info = getWorkerInfo(applicant);
                        return (
                          <div className="flex flex-col gap-2">
                            {(info.phone || info.email) && (
                              <>
                                {info.phone && info.phone !== 'No phone' && (
                                  <a
                                    href={`tel:${info.phone.replace(/\s/g, '')}`}
                                    className="btn btn-sm btn-success"
                                  >
                                    <i className="fas fa-phone mr-1"></i>Call Worker
                                  </a>
                                )}
                                {info.email && info.email !== 'No email' && (
                                  <a
                                    href={`mailto:${info.email}`}
                                    className="btn btn-sm btn-outline"
                                  >
                                    <i className="fas fa-envelope mr-1"></i>Email
                                  </a>
                                )}
                              </>
                            )}
                            <button
                              className="btn btn-sm btn-info border-none"
                              onClick={() => updateApplicationStatus(applicant._id, 'completed')}
                              disabled={updating === applicant._id}
                            >
                              {updating === applicant._id ? (
                                <i className="fas fa-spinner fa-spin mr-1"></i>
                              ) : (
                                <i className="fas fa-check-double mr-1"></i>
                              )}
                              Mark as Completed
                            </button>
                          </div>
                        );
                      })()}
                      {(applicant.status || '').toLowerCase() === 'completed' && (
                        <button
                          className="btn btn-sm btn-primary border-none"
                          onClick={() => {
                            setSelectedApplicationForRating(applicant);
                            setRatingModalOpen(true);
                          }}
                        >
                          <i className="fas fa-star mr-1"></i>
                          Rate Worker
                        </button>
                      )}
                      {(applicant.status || '').toLowerCase() === 'rejected' && (
                        <button 
                          className="btn btn-sm bg-gray-500 hover:bg-gray-600 text-white border-none"
                          onClick={() => updateApplicationStatus(applicant._id, 'pending')}
                          disabled={updating === applicant._id}
                        >
                          {updating === applicant._id ? (
                            <i className="fas fa-spinner fa-spin mr-1"></i>
                          ) : (
                            <i className="fas fa-undo mr-1"></i>
                          )}
                          Reconsider
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {filteredApplicants.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-inbox text-6xl mb-4 opacity-30"></i>
            <h3 className="text-xl font-semibold mb-2 text-base-content">No applications found</h3>
            <p className="opacity-70">
              {applications.length === 0 
                ? 'No applications have been submitted for this job yet.' 
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        )}
      </PageContainer>

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

      {/* Accept Success Modal - show worker contact after accepting */}
      {acceptSuccessModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md border-2 border-success shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center">
                <i className="fas fa-check-circle text-success text-2xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg text-base-content">Worker Accepted!</h3>
                <p className="text-sm opacity-70">Call to coordinate timing and location</p>
              </div>
            </div>
            <div className="bg-base-200 rounded-xl p-4 mb-4">
              <p className="font-semibold text-base-content">{acceptSuccessModal.workerInfo.name}</p>
              <p className="text-sm opacity-70 mt-1">{acceptSuccessModal.applicant.title || acceptSuccessModal.applicant.jobTitle || 'Job'}</p>
              {acceptSuccessModal.workerInfo.phone && acceptSuccessModal.workerInfo.phone !== 'No phone' && (
                <div className="mt-3">
                  <a
                    href={`tel:${acceptSuccessModal.workerInfo.phone.replace(/\s/g, '')}`}
                    className="btn btn-success btn-block"
                  >
                    <i className="fas fa-phone mr-2"></i>Call Now
                  </a>
                  <p className="text-xs opacity-70 mt-2">
                    {acceptSuccessModal.workerInfo.phone}
                  </p>
                </div>
              )}
              {acceptSuccessModal.workerInfo.email && acceptSuccessModal.workerInfo.email !== 'No email' && (
                <a
                  href={`mailto:${acceptSuccessModal.workerInfo.email}`}
                  className="btn btn-outline btn-sm mt-2"
                >
                  <i className="fas fa-envelope mr-2"></i>Email
                </a>
              )}
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setAcceptSuccessModal(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => setAcceptSuccessModal(null)}>
                Done
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => setAcceptSuccessModal(null)}></div>
        </div>
      )}
    </div>
  );
}