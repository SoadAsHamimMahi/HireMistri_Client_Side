import { useState, useEffect, useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AuthContext } from '../Authentication/AuthProvider';
import { useParams } from 'react-router-dom';

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
          // Fetch all applications for the current user
          response = await fetch(`${base}/api/my-applications/${user?.uid}`, {
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
        return isDarkMode ? 'bg-green-600 text-white border-green-500' : 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return isDarkMode ? 'bg-red-600 text-white border-red-500' : 'bg-red-100 text-red-700 border-red-200';
      default:
        return isDarkMode ? 'bg-yellow-600 text-white border-yellow-500' : 'bg-yellow-100 text-yellow-700 border-yellow-200';
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
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="text-center">
            <div className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-white' : 'border-gray-900'}`}></div>
            <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Failed to load applications</h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`shadow-sm border-b transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <i className="fas fa-file-alt text-green-600"></i>
                {jobId ? 'Job Applications' : 'All Applications'}
              </h1>
              <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
          <div className={`rounded-xl shadow-sm border-l-4 border-blue-500 p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total</p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{applications.length}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <i className="fas fa-briefcase text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border-l-4 border-yellow-500 p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pending</p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {applications.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                <i className="fas fa-clock text-yellow-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border-l-4 border-green-500 p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Accepted</p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {applications.filter(a => a.status === 'accepted').length}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border-l-4 border-red-500 p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Rejected</p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {applications.filter(a => a.status === 'rejected').length}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                <i className="fas fa-times-circle text-red-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`rounded-xl shadow-sm p-6 mb-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Search by Name or Proposal</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by worker name or proposal text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                />
                <i className={`fas fa-search absolute left-3 top-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
              </div>
            </div>
            <div className="lg:w-64">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
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
              <div key={applicant._id} className={`rounded-xl shadow-sm border overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                        {workerInfo.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {workerInfo.name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(applicant.status)}`}>
                            <i className={`${getStatusIcon(applicant.status)} mr-1`}></i>
                            {applicant.status}
                          </span>
                        </div>
                        
                        <div className={`flex items-center gap-4 text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span className="flex items-center gap-1">
                            <i className="fas fa-user text-green-600"></i>
                            Worker ID: {applicant.workerId}
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="fas fa-envelope text-green-600"></i>
                            {workerInfo.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <i className="fas fa-phone text-green-600"></i>
                            {workerInfo.phone}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Applied {new Date(applicant.createdAt).toLocaleDateString()}
                          </span>
                          {applicant.updatedAt && applicant.updatedAt !== applicant.createdAt && (
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              • Updated {new Date(applicant.updatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Proposal:</h4>
                          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
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
                            className="btn btn-sm bg-green-500 hover:bg-green-600 text-white border-none"
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
                        <button 
                          className="btn btn-sm bg-purple-500 hover:bg-purple-600 text-white border-none"
                          onClick={() => {
                            // TODO: Implement messaging functionality
                            alert('Messaging functionality will be implemented');
                          }}
                        >
                          <i className="fas fa-comments mr-1"></i>
                          Message
                        </button>
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
            <i className={`fas fa-inbox text-6xl mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No applications found</h3>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
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