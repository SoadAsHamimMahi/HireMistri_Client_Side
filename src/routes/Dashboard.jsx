// src/routes/Dashboard.jsx
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';

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
    <div className="min-h-screen page-bg transition-colors duration-300">
      <PageContainer>
        <PageHeader
          title="Welcome back, Client! 👋"
          subtitle="Manage your job postings and find the perfect workers for your projects."
          actions={
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/20">
                <i className="fas fa-user text-primary text-xl"></i>
              </div>
              <div>
                <p className="font-semibold text-base-content">{user?.email || 'Client'}</p>
                <p className="text-sm text-base-content opacity-50">Client Account</p>
              </div>
            </div>
          }
        />
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-base-200 border-l-4 border-info p-4 lg:p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-base-content opacity-70">Total Jobs</p>
                <p className="text-3xl font-bold text-base-content">{totalJobs}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-info/20">
                <i className="fas fa-briefcase text-info text-xl"></i>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border-l-4 border-primary p-4 lg:p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70">Active Jobs</p>
                <p className="text-3xl font-bold text-base-content">{activeJobs}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/20">
                <i className="fas fa-clock text-primary text-xl"></i>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border-l-4 border-secondary p-4 lg:p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-base-content opacity-70">Completed</p>
                <p className="text-3xl font-bold text-base-content">{completedJobs}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-secondary/20">
                <i className="fas fa-check-circle text-secondary text-xl"></i>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border-l-4 border-warning p-4 lg:p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-base-content opacity-70">Total Applicants</p>
                <p className="text-3xl font-bold text-base-content">{totalApplicants}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-warning/20">
                <i className="fas fa-users text-warning text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/post-job" className="group">
            <div className="card bg-base-200 shadow-sm hover:shadow-md transition-all duration-300 p-4 lg:p-6 border border-base-300 hover:border-primary">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors bg-primary/20 group-hover:bg-primary/30">
                  <i className="fas fa-plus text-primary text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-base-content">Post New Job</h3>
                  <p className="text-sm opacity-70">Create a new job posting</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/My-Posted-Jobs" className="group">
            <div className="card bg-base-200 shadow-sm hover:shadow-md transition-all duration-300 p-4 lg:p-6 border border-base-300 hover:border-info">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors bg-info/20 group-hover:bg-info/30">
                  <i className="fas fa-list text-info text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-base-content">My Jobs</h3>
                  <p className="text-sm text-base-content opacity-70">View all your jobs</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/applications" className="group">
            <div className="card bg-base-200 shadow-sm hover:shadow-md transition-all duration-300 p-4 lg:p-6 border border-base-300 hover:border-accent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors bg-accent/20 group-hover:bg-accent/30">
                  <i className="fas fa-file-alt text-accent text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-base-content">Applications</h3>
                  <p className="text-sm text-base-content opacity-70">Review applications</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/my-profile" className="group">
            <div className="card bg-base-200 shadow-sm hover:shadow-md transition-all duration-300 p-4 lg:p-6 border border-base-300 hover:border-secondary">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors bg-secondary/20 group-hover:bg-secondary/30">
                  <i className="fas fa-user text-secondary text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-base-content">My Profile</h3>
                  <p className="text-sm text-base-content opacity-70">Manage your profile</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Jobs */}
        <div className="card bg-base-200 shadow-sm transition-colors duration-300">
          <div className="p-6 border-b border-base-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold mb-0 flex items-center gap-2 text-base-content">
                <i className="fas fa-briefcase text-primary"></i>
                Recent Job Postings
              </h2>
              <Link to="/My-Posted-Jobs" className="text-primary hover:text-primary-focus font-medium">
                View All
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {dummyJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 rounded-lg transition-colors bg-base-300 hover:bg-base-300/80">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base-content">{job.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-base-content opacity-70">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-map-marker-alt text-primary"></i>
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-money-bill-wave text-primary"></i>
                        {job.budget}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-users text-info"></i>
                        {job.applicants} applicants
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      job.status === 'Open' ? 'badge-success' :
                      job.status === 'In Progress' ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {job.status}
                    </span>
                    <Link to="/applications" className="btn btn-sm btn-primary border-none">
                      View Applications
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
