import { useState, useEffect, useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AuthContext } from '../Authentication/AuthProvider';
import { useParams } from 'react-router-dom';
import Messages from './Messages';

export default function Applications() {
  const { isDarkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const { jobId } = useParams(); // Get jobId from URL
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(null);
  const [workerDetails, setWorkerDetails] = useState({});

  // Function to fetch worker details
  const fetchWorkerDetails = async (workerId) => {
    if (workerDetails[workerId]) return workerDetails[workerId]; // Already cached
    
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      const response = await fetch(`${base}/api/users/${workerId}`, {
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

  // Message Button Component
  const MessageButton = ({ jobId, workerId, workerName }) => {
    const [showMessages, setShowMessages] = useState(false);

    return (
      <>
        <button 
          className="btn btn-sm btn-primary"
          onClick={() => setShowMessages(true)}
        >
          <i className="fas fa-comments mr-1"></i>
          Message
        </button>
        {showMessages && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMessages(false)} />
            <div className="relative bg-base-200 rounded-xl shadow-2xl w-full max-w-2xl">
              <Messages
                jobId={jobId}
                workerId={workerId}
                workerName={workerName}
                onClose={() => setShowMessages(false)}
              />
            </div>
          </div>
        )}
      </>
    );
  };

  // Fetch applications - either for specific job or all user's applications
  useEffect(() => {
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

    if (user?.uid) {
      fetchApplications();
    }
  }, [jobId, user?.uid]);

  const filteredApplicants = applications.filter(applicant => {
    const workerInfo = getWorkerInfo(applicant);
    const matchesFilter = filter === 'all' || applicant.status === filter;
    const matchesSearch = workerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         applicant.proposalText?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Update application status
  const updateApplicationStatus = async (applicationId, newStatus) => {
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
      setApplications(prev => 
        prev.map(app => 
          app._id === applicationId 
            ? { ...app, status: newStatus, updatedAt: updatedApplication.updatedAt }
            : app
        )
      );
      
    } catch (err) {
      console.error('Failed to update application status:', err);
      alert('Failed to update application status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'badge-success';
      case 'rejected':
        return 'badge-error';
      default:
        return 'badge-warning';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return 'fas fa-check-circle';
      case 'rejected':
        return 'fas fa-times-circle';
      default:
        return 'fas fa-clock';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="mt-4 text-lg text-base-content">Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-base-100 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold mb-2 text-base-content">Failed to load applications</h2>
            <p className="text-lg opacity-70">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 transition-colors duration-300">
      {/* Header */}
      <div className="shadow-sm border-b border-base-300 transition-colors duration-300 bg-base-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 text-base-content">
                <i className="fas fa-file-alt text-primary"></i>
                {jobId ? 'Job Applications' : 'All Applications'}
              </h1>
              <p className="mt-2 opacity-70">
                {jobId 
                  ? 'Review and manage applications for this specific job posting'
                  : 'Review and manage all applications across your job postings'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-base-200 border-l-4 border-info p-6 transition-colors duration-300">
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

          <div className="card bg-base-200 border-l-4 border-warning p-6 transition-colors duration-300">
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

          <div className={`card bg-base-200 border-l-4 border-primary p-6 transition-colors duration-300`}>
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

          <div className="card bg-base-200 border-l-4 border-error p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70">Rejected</p>
                <p className="text-3xl font-bold text-base-content">
                  {applications.filter(a => a.status === 'rejected').length}
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
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {filteredApplicants.map((applicant) => {
            const workerInfo = getWorkerInfo(applicant);
            return (
              <div key={applicant._id} className="card bg-base-200 shadow-sm border border-base-300 overflow-hidden transition-colors duration-300">
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
                            {applicant.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm mb-3 opacity-80">
                          <span className="flex items-center gap-1">
                            <i className="fas fa-user text-primary"></i>
                            Worker ID: {applicant.workerId}
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="fas fa-envelope text-primary"></i>
                            {workerInfo.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="fas fa-phone text-primary"></i>
                            {workerInfo.phone}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm opacity-70">
                            Applied {new Date(applicant.createdAt).toLocaleDateString()}
                          </span>
                          {applicant.updatedAt && applicant.updatedAt !== applicant.createdAt && (
                            <span className="text-sm opacity-70">
                              • Updated {new Date(applicant.updatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="card bg-base-300 p-4">
                          <h4 className="font-medium mb-2 text-base-content">Proposal:</h4>
                          <p className="opacity-80">
                            {applicant.proposalText || 'No proposal text provided.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button 
                        className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white border-none"
                        onClick={() => {
                          // TODO: Implement view profile functionality
                          alert('View Profile functionality will be implemented');
                        }}
                      >
                        <i className="fas fa-eye mr-1"></i>
                        View Profile
                      </button>
                      {applicant.status === 'pending' && (
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
                      {applicant.status === 'accepted' && (
                        <MessageButton
                          jobId={jobId || applicant.jobId}
                          workerId={applicant.workerId}
                          workerName={getWorkerInfo(applicant).name}
                        />
                      )}
                      {applicant.status === 'rejected' && (
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
        </div>
      </div>
    );
}