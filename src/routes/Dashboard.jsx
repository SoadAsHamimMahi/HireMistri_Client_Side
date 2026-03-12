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
    <div className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.3)] bg-[#121a2f] border border-slate-800 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(37,99,235,0.15)] hover:border-blue-500/40 group relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/80 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
      
      {/* Image */}
      <div className="relative h-48 bg-[#172136] overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={job.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#121a2f] to-[#172136]">
            <i className="fas fa-briefcase text-slate-700 text-5xl opacity-40"></i>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121a2f] to-transparent opacity-60 z-10"></div>
        {category && (
          <span className="absolute top-3 right-3 z-20 bg-blue-600/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded backdrop-blur-sm shadow-lg">
            {category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 relative z-20 -mt-2 bg-[#121a2f]">
        <h3 className="font-bold text-white text-lg mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors drop-shadow-md">{job.title}</h3>

        <div className="space-y-2 text-sm text-slate-400 font-medium flex-1">
          {location && (
            <div className="flex items-start gap-2">
              <i className="fas fa-map-marker-alt text-slate-500 mt-0.5 w-4 shrink-0"></i>
              <span className="line-clamp-2">{location}</span>
            </div>
          )}
          {category && (
            <div className="flex items-center gap-2">
              <i className="fas fa-tag text-slate-500 w-4 shrink-0"></i>
              <span>{category}</span>
            </div>
          )}
          {dateDisplay && (
            <div className="flex items-center gap-2">
              <i className="fas fa-calendar-alt text-slate-500 w-4 shrink-0"></i>
              <span>Posted: {dateDisplay}</span>
            </div>
          )}
        </div>

        {budget !== '' && budget !== undefined && (
          <p className="text-white font-extrabold text-xl mt-4 drop-shadow-sm">
            ৳{budget}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-slate-800">
          <Link
            to={`/My-Posted-Job-Details/${jobId}`}
            className="flex items-center justify-center gap-2 font-bold text-sm text-slate-300 hover:text-blue-400 transition-colors py-1"
          >
            View Details <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-[#121a2f] border border-slate-800 animate-pulse">
      <div className="h-48 bg-[#172136]"></div>
      <div className="p-5 space-y-4">
        <div className="h-6 bg-[#1e293b] rounded w-3/4"></div>
        <div className="h-4 bg-[#1e293b] rounded w-full"></div>
        <div className="h-4 bg-[#1e293b] rounded w-1/2"></div>
        <div className="h-8 bg-[#1e293b] rounded w-1/3 mt-4"></div>
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
    <div className="min-h-screen text-slate-300 pb-16 font-sans">
      <PageContainer>
        <div className="pt-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">Welcome back, Client! 👋</h1>
              <p className="text-slate-400 font-medium">Manage your job postings and find the perfect workers for your projects.</p>
            </div>
            <div className="flex items-center gap-3 bg-[#121a2f] border border-slate-800 p-3 rounded-2xl shadow-sm">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
                <i className="fas fa-user text-blue-400 text-xl"></i>
              </div>
              <div className="pr-2">
                <p className="font-bold text-white leading-snug">{user?.email || 'Client'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Client Account</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#121a2f] border border-slate-800/80 rounded-2xl shadow-lg shadow-black/20 p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Jobs</p>
                <p className="text-4xl font-extrabold text-white">{loading ? '—' : totalJobs}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 shadow-inner">
                <i className="fas fa-briefcase text-blue-400 text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-[#121a2f] border border-slate-800/80 rounded-2xl shadow-lg shadow-black/20 p-6 relative overflow-hidden group hover:border-green-500/30 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Jobs</p>
                <p className="text-4xl font-extrabold text-white">{loading ? '—' : activeJobs}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-green-500/10 border border-green-500/20 shadow-inner">
                <i className="fas fa-clock text-green-400 text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-[#121a2f] border border-slate-800/80 rounded-2xl shadow-lg shadow-black/20 p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Completed</p>
                <p className="text-4xl font-extrabold text-white">{loading ? '—' : completedJobs}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-500/10 border border-purple-500/20 shadow-inner">
                <i className="fas fa-check-circle text-purple-400 text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-[#121a2f] border border-slate-800/80 rounded-2xl shadow-lg shadow-black/20 p-6 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Applicants</p>
                <p className="text-4xl font-extrabold text-white">{loading ? '—' : totalApplicants}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-orange-500/10 border border-orange-500/20 shadow-inner">
                <i className="fas fa-users text-orange-400 text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Link to="/post-job" className="group">
            <div className="bg-[#121a2f] border border-slate-800 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-500/50 flex flex-col h-full bg-gradient-to-br from-[#121a2f] to-[#121a2f] hover:to-[#172136]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white">
                <i className="fas fa-plus text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg mb-1 group-hover:text-blue-400 transition-colors">Post New Job</h3>
                <p className="text-sm text-slate-400 font-medium">Create and publish a new job posting</p>
              </div>
            </div>
          </Link>

          <Link to="/My-Posted-Jobs" className="group">
            <div className="bg-[#121a2f] border border-slate-800 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-cyan-500/50 flex flex-col h-full bg-gradient-to-br from-[#121a2f] to-[#121a2f] hover:to-[#172136]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white">
                <i className="fas fa-list text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg mb-1 group-hover:text-cyan-400 transition-colors">My Jobs</h3>
                <p className="text-sm text-slate-400 font-medium">View and manage everywhere you posted</p>
              </div>
            </div>
          </Link>

          <Link to="/applications" className="group">
            <div className="bg-[#121a2f] border border-slate-800 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-500/50 flex flex-col h-full bg-gradient-to-br from-[#121a2f] to-[#121a2f] hover:to-[#172136]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white">
                <i className="fas fa-file-alt text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg mb-1 group-hover:text-emerald-400 transition-colors">Applications</h3>
                <p className="text-sm text-slate-400 font-medium">Review proposals from workers</p>
              </div>
            </div>
          </Link>

          <Link to="/my-profile" className="group">
            <div className="bg-[#121a2f] border border-slate-800 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-purple-500/50 flex flex-col h-full bg-gradient-to-br from-[#121a2f] to-[#121a2f] hover:to-[#172136]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:bg-purple-600 group-hover:text-white">
                <i className="fas fa-user text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg mb-1 group-hover:text-purple-400 transition-colors">My Profile</h3>
                <p className="text-sm text-slate-400 font-medium">Update configurations and settings</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Job Postings */}
        <div className="bg-[#121a2f] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-[#172136]/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm">
                  <i className="fas fa-briefcase"></i>
                </div>
                Recent Job Postings
              </h2>
              <Link to="/My-Posted-Jobs" className="text-sm font-bold text-blue-400 hover:text-white transition-colors bg-blue-500/10 hover:bg-blue-600 px-4 py-2 rounded-xl border border-blue-500/20 hover:border-blue-600">
                View All
              </Link>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-gradient-to-b from-[#121a2f] to-[#0b1121]">
            {error && (
              <div className="text-center py-6 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
                <i className="fas fa-exclamation-circle mr-2"></i> Failed to load jobs: {error}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl bg-[#0b1121]/50">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-folder-open text-4xl text-slate-600"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No jobs posted yet</h3>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto">You haven't posted any jobs. Create your first job posting to start receiving applications.</p>
                <Link to="/post-job" className="bg-[#2563eb] hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25">
                  <i className="fas fa-plus mr-2"></i> Post Your First Job
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
