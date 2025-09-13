// src/routes/Applications.jsx
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const applicants = [
  { 
    id: 1, 
    name: 'Arif Hossain', 
    skill: 'Plumber', 
    rating: 4.7, 
    experience: '5 years',
    location: 'Dhanmondi, Dhaka',
    hourlyRate: '৳300/hour',
    status: 'pending',
    appliedDate: '2 days ago',
    proposal: 'I have 5 years of experience in plumbing. I can fix your bathroom leak quickly and efficiently.',
    avatar: 'https://i.pravatar.cc/100?img=1'
  },
  { 
    id: 2, 
    name: 'Salman Rahman', 
    skill: 'Electrician', 
    rating: 4.9, 
    experience: '8 years',
    location: 'Gulshan, Dhaka',
    hourlyRate: '৳400/hour',
    status: 'accepted',
    appliedDate: '1 day ago',
    proposal: 'Professional electrician with 8 years of experience. I can handle all types of electrical repairs.',
    avatar: 'https://i.pravatar.cc/100?img=2'
  },
  { 
    id: 3, 
    name: 'Karim Ahmed', 
    skill: 'AC Technician', 
    rating: 4.5, 
    experience: '3 years',
    location: 'Uttara, Dhaka',
    hourlyRate: '৳350/hour',
    status: 'rejected',
    appliedDate: '3 days ago',
    proposal: 'Specialized in AC maintenance and repair. Quick service guaranteed.',
    avatar: 'https://i.pravatar.cc/100?img=3'
  },
  ];
  
  export default function Applications() {
  const { isDarkMode } = useTheme();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredApplicants = applicants.filter(applicant => {
    const matchesFilter = filter === 'all' || applicant.status === filter;
    const matchesSearch = applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         applicant.skill.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
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

    return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`shadow-sm border-b transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <i className="fas fa-file-alt text-green-600"></i>
                Job Applications
              </h1>
              <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Review and manage applications for your job postings
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
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{applicants.length}</p>
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
                  {applicants.filter(a => a.status === 'pending').length}
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
                  {applicants.filter(a => a.status === 'accepted').length}
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
                  {applicants.filter(a => a.status === 'rejected').length}
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
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Search by Name or Skill</label>
              <div className="relative">
                    <input
                  type="text"
                  placeholder="e.g. Arif Hossain or Plumber"
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
          {filteredApplicants.map((applicant) => (
            <div key={applicant.id} className={`rounded-xl shadow-sm border overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <img
                      src={applicant.avatar}
                      alt={applicant.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{applicant.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(applicant.status)}`}>
                          <i className={`${getStatusIcon(applicant.status)} mr-1`}></i>
                          {applicant.status}
                        </span>
                      </div>
                      
                      <div className={`flex items-center gap-4 text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className="flex items-center gap-1">
                          <i className="fas fa-tools text-green-600"></i>
                          {applicant.skill}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="fas fa-map-marker-alt text-green-600"></i>
                          {applicant.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="fas fa-clock text-green-600"></i>
                          {applicant.experience}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="fas fa-money-bill-wave text-green-600"></i>
                          {applicant.hourlyRate}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`fas fa-star text-sm ${
                                i < Math.floor(applicant.rating) ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            ></i>
                          ))}
                        </div>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{applicant.rating}</span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>• Applied {applicant.appliedDate}</span>
                      </div>

                      <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Proposal:</h4>
                        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{applicant.proposal}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button className="btn btn-sm bg-green-500 hover:bg-green-600 text-white border-none">
                      <i className="fas fa-eye mr-1"></i>
                      View Profile
                    </button>
                    {applicant.status === 'pending' && (
                      <>
                        <button className="btn btn-sm bg-green-500 hover:bg-green-600 text-white border-none">
                          <i className="fas fa-check mr-1"></i>
                          Accept
                        </button>
                        <button className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-none">
                          <i className="fas fa-times mr-1"></i>
                          Reject
                        </button>
                      </>
                    )}
                    {applicant.status === 'accepted' && (
                      <button className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white border-none">
                        <i className="fas fa-comments mr-1"></i>
                        Message
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredApplicants.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
        </div>
      </div>
    );
  }
  