// src/routes/Dashboard.jsx
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';

const dummyJobs = [
  { id: 1, title: 'Fix Bathroom Leak', status: 'Open', applicants: 3, budget: '৳2,500', location: 'Dhanmondi, Dhaka' },
  { id: 2, title: 'AC Maintenance', status: 'In Progress', applicants: 1, budget: '৳1,800', location: 'Gulshan, Dhaka' },
  { id: 3, title: 'Electrical Repair', status: 'Completed', applicants: 5, budget: '৳3,200', location: 'Uttara, Dhaka' },
];

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { isDarkMode } = useTheme();
  
  const totalJobs = dummyJobs.length;
  const activeJobs = dummyJobs.filter(job => job.status === 'Open' || job.status === 'In Progress').length;
  const completedJobs = dummyJobs.filter(job => job.status === 'Completed').length;
  const totalApplicants = dummyJobs.reduce((sum, job) => sum + job.applicants, 0);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header Section */}
      <div className={`shadow-sm border-b transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Welcome back, Client! 👋
              </h1>
              <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Manage your job postings and find the perfect workers for your projects.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <i className="fas fa-user text-green-600 text-xl"></i>
              </div>
              <div>
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.email || 'Client'}</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Client Account</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-xl shadow-sm border-l-4 border-blue-500 p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Jobs</p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalJobs}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <i className="fas fa-briefcase text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border-l-4 border-green-500 p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Active Jobs</p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activeJobs}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <i className="fas fa-clock text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border-l-4 border-purple-500 p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completed</p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{completedJobs}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                <i className="fas fa-check-circle text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-sm border-l-4 border-yellow-500 p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Applicants</p>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalApplicants}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                <i className="fas fa-users text-yellow-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/post-job" className="group">
            <div className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-green-600' : 'bg-white border-gray-100 hover:border-green-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'bg-green-900/30 group-hover:bg-green-800/50' : 'bg-green-100 group-hover:bg-green-200'}`}>
                  <i className="fas fa-plus text-green-600 text-xl"></i>
                </div>
                <div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Post New Job</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Create a new job posting</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/My-Posted-Jobs" className="group">
            <div className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-600' : 'bg-white border-gray-100 hover:border-blue-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'bg-blue-900/30 group-hover:bg-blue-800/50' : 'bg-blue-100 group-hover:bg-blue-200'}`}>
                  <i className="fas fa-list text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>My Jobs</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>View all your jobs</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/applications" className="group">
            <div className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-orange-600' : 'bg-white border-gray-100 hover:border-orange-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'bg-orange-900/30 group-hover:bg-orange-800/50' : 'bg-orange-100 group-hover:bg-orange-200'}`}>
                  <i className="fas fa-file-alt text-orange-600 text-xl"></i>
                </div>
                <div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Applications</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Review applications</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/my-profile" className="group">
            <div className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-purple-600' : 'bg-white border-gray-100 hover:border-purple-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'bg-purple-900/30 group-hover:bg-purple-800/50' : 'bg-purple-100 group-hover:bg-purple-200'}`}>
                  <i className="fas fa-user text-purple-600 text-xl"></i>
                </div>
                <div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>My Profile</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage your profile</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Jobs */}
        <div className={`rounded-xl shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <i className="fas fa-briefcase text-green-600"></i>
                Recent Job Postings
              </h2>
              <Link to="/My-Posted-Jobs" className="text-green-600 hover:text-green-700 font-medium">
                View All
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {dummyJobs.map((job) => (
                <div key={job.id} className={`flex items-center justify-between p-4 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{job.title}</h3>
                    <div className={`flex items-center gap-4 mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-map-marker-alt text-green-600"></i>
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-money-bill-wave text-green-600"></i>
                        {job.budget}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-users text-blue-600"></i>
                        {job.applicants} applicants
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      job.status === 'Open' ? (isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700') :
                      job.status === 'In Progress' ? (isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700') :
                      (isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')
                    }`}>
                      {job.status}
                    </span>
                    <Link to="/applications" className="btn btn-sm bg-green-500 hover:bg-green-600 text-white border-none">
                      View Applications
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
