import { Link } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

function formatDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toISOString().slice(0, 10);
}

function JobCard({ job }) {
  const image = Array.isArray(job.images) && job.images.length > 0 ? job.images[0] : null;
  const jobId = job.mongoId || job.id || String(job._id || '');
  const category = job.category || job.categories?.[0] || '';
  const budget = job.budget ?? job.price ?? '';
  const location = job.location || job.locationString || '';
  const dateDisplay = job.date ? formatDate(job.date) : job.createdAt ? formatDate(job.createdAt) : '';

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg bg-base-200 border border-base-300 flex flex-col transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Image */}
      <div className="relative h-48 bg-base-300 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={job.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <i className="fas fa-briefcase text-primary text-5xl opacity-40"></i>
          </div>
        )}
        {category && (
          <span className="absolute top-3 right-3 bg-primary text-primary-content text-xs font-semibold px-3 py-1 rounded-full shadow">
            {category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-bold text-base-content text-base mb-3 line-clamp-2">{job.title}</h3>

        <div className="space-y-1.5 text-sm text-base-content opacity-70 flex-1">
          {location && (
            <div className="flex items-start gap-2">
              <i className="fas fa-map-marker-alt text-primary mt-0.5 w-3 shrink-0"></i>
              <span className="line-clamp-2">{location}</span>
            </div>
          )}
          {category && (
            <div className="flex items-center gap-2">
              <i className="fas fa-tag text-primary w-3 shrink-0"></i>
              <span>{category}</span>
            </div>
          )}
          {dateDisplay && (
            <div className="flex items-center gap-2">
              <i className="fas fa-calendar-alt text-primary w-3 shrink-0"></i>
              <span>Posted: {dateDisplay}</span>
            </div>
          )}
        </div>

        {budget !== '' && budget !== undefined && (
          <p className="text-primary font-extrabold text-xl mt-3">
            ৳{budget}
          </p>
        )}

        <div className="mt-3 pt-3 border-t border-base-300">
          <Link
            to={`/My-Posted-Job-Details/${jobId}`}
            className="flex items-center justify-center gap-2 font-bold text-sm text-base-content hover:text-primary transition-colors"
          >
            View Details <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-base-200 border border-base-300 animate-pulse">
      <div className="h-48 bg-base-300"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-base-300 rounded w-3/4"></div>
        <div className="h-4 bg-base-300 rounded w-full"></div>
        <div className="h-4 bg-base-300 rounded w-1/2"></div>
        <div className="h-6 bg-base-300 rounded w-1/3 mt-2"></div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { isDarkMode } = useTheme();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let ignore = false;
    setLoading(true);
    setError('');

    fetch(`${API_BASE}/api/browse-jobs?clientId=${encodeURIComponent(user.uid)}&status=all`, {
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();
        if (ignore) return;
        const normalized = (Array.isArray(data) ? data : []).map((j) => {
          const mongoId =
            typeof j._id === 'string' ? j._id
            : j._id?.$oid ?? j._id?.toString?.() ?? '';
          return {
            ...j,
            id: j.id ?? mongoId ?? String(j._id || ''),
            mongoId: mongoId || j.id || String(j._id || ''),
            images: j.images || [],
            applicants: j.applicants || [],
            status: String(j.status || 'active').toLowerCase(),
          };
        });
        setJobs(normalized);
      })
      .catch((e) => { if (!ignore) setError(e.message); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [user?.uid]);

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === 'active' || j.status === 'in-progress' || j.status === 'in progress').length;
  const completedJobs = jobs.filter((j) => j.status === 'completed').length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (Array.isArray(j.applicants) ? j.applicants.length : (j.applicants || 0)), 0);

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
    .slice(0, 3);

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
                <p className="text-sm text-muted">Client Account</p>
              </div>
            </div>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-base-200 border border-base-300 rounded-xl shadow-sm border-l-4 border-info p-4 lg:p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Total Jobs</p>
                <p className="text-3xl font-bold text-base-content">{loading ? '—' : totalJobs}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-info/20">
                <i className="fas fa-briefcase text-info text-xl"></i>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300 rounded-xl shadow-sm border-l-4 border-primary p-4 lg:p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Active Jobs</p>
                <p className="text-3xl font-bold text-base-content">{loading ? '—' : activeJobs}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/20">
                <i className="fas fa-clock text-primary text-xl"></i>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300 rounded-xl shadow-sm border-l-4 border-secondary p-4 lg:p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Completed</p>
                <p className="text-3xl font-bold text-base-content">{loading ? '—' : completedJobs}</p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-secondary/20">
                <i className="fas fa-check-circle text-secondary text-xl"></i>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300 rounded-xl shadow-sm border-l-4 border-warning p-4 lg:p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Total Applicants</p>
                <p className="text-3xl font-bold text-base-content">{loading ? '—' : totalApplicants}</p>
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
                  <p className="text-sm text-muted">Create a new job posting</p>
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
                  <p className="text-sm text-muted">View all your jobs</p>
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
                  <p className="text-sm text-muted">Review applications</p>
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
                  <p className="text-sm text-muted">Manage your profile</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Job Postings */}
        <div className="card bg-base-200 shadow-sm transition-colors duration-300">
          <div className="p-6 border-b border-base-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold mb-0 flex items-center gap-2 text-base-content">
                <i className="fas fa-briefcase text-primary"></i>
                Recent Job Postings
              </h2>
              <Link to="/My-Posted-Jobs" className="text-primary hover:text-primary-focus font-medium text-sm">
                View All
              </Link>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="text-center py-6 text-error text-sm">
                Failed to load jobs: {error}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="text-center py-10">
                <i className="fas fa-briefcase text-5xl text-base-content opacity-20 mb-4"></i>
                <p className="text-base-content opacity-60 mb-4">No jobs posted yet</p>
                <Link to="/post-job" className="btn btn-primary btn-sm">
                  Post Your First Job
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentJobs.map((job) => (
                  <JobCard key={job.mongoId || job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
