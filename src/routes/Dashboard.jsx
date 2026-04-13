import { Link } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import PageContainer from '../components/layout/PageContainer';

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
  const category = job.category || job.categories?.[0] || 'Worker';
  const budget = job.budget ?? job.price ?? '';
  const location = job.location || job.locationString || 'Not specified';
  const dateDisplay = job.date ? formatDate(job.date) : job.createdAt ? formatDate(job.createdAt) : '';

  // Get relative time (simplified)
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const posted = new Date(dateStr);
    const diffDays = Math.floor((new Date() - posted) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Posted today';
    if (diffDays === 1) return 'Posted yesterday';
    return `Posted ${diffDays} days ago`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group overflow-hidden">
      {/* Image Section */}
      <div className="relative h-44 overflow-hidden bg-gray-50">
        {image ? (
          <img
            src={image}
            alt={job.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#f4f6f9]">
            <i className="fas fa-tools text-gray-300 text-5xl"></i>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-[#0a58ca] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md shadow-sm border border-blue-50">
            {category}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 text-base mb-3 line-clamp-2 h-12 leading-tight group-hover:text-[#0a58ca] transition-colors">
          {job.title}
        </h3>

        <div className="space-y-2.5 mb-5 flex-1">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <i className="fas fa-map-marker-alt text-gray-400 w-3.5"></i>
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-gray-400 uppercase tracking-tight">{getRelativeTime(job.createdAt || job.date)}</span>
            <span className="text-[#0a58ca] text-lg font-black">৳{budget}</span>
          </div>
        </div>

        <Link
          to={`/My-Posted-Job-Details/${jobId}`}
          className="flex items-center justify-between font-bold text-xs text-[#0a58ca] hover:text-[#084298] transition-colors pt-4 border-t border-gray-50 group/link"
        >
          View Details
          <i className="fas fa-arrow-right group-hover/link:translate-x-1 transition-transform"></i>
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
      <div className="h-40 bg-gray-50 rounded-xl mb-4"></div>
      <div className="h-5 bg-gray-100 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-50 rounded w-1/2 mb-6"></div>
      <div className="h-10 bg-gray-50 rounded-lg w-full"></div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
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
          const mongoId = typeof j._id === 'string' ? j._id : j._id?.$oid ?? j._id?.toString?.() ?? '';
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
    .slice(0, 8); // Showing more for the grid

  return (
    <div className="bg-[#f8f9fa] min-h-screen text-gray-900 pb-20 font-sans">
      <PageContainer>
        {/* Header Section */}
        <div className="pt-10 mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, Client! 👋
          </h1>
          
          <div className="flex items-center gap-4 bg-white p-2.5 pr-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#0a58ca]">
              <i className="fas fa-user-circle text-2xl"></i>
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm leading-tight truncate max-w-[200px]">{user?.email}</p>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Client Account</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Jobs', val: totalJobs, icon: 'fa-briefcase', color: 'bg-blue-600' },
            { label: 'Active Jobs', val: activeJobs, icon: 'fa-clock', color: 'bg-blue-500' },
            { label: 'Completed', val: completedJobs, icon: 'fa-check-double', color: 'bg-blue-400' },
            { label: 'Applicants', val: totalApplicants, icon: 'fa-users', color: 'bg-blue-300' }
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${stat.color} shadow-lg shadow-blue-500/10`}>
                <i className={`fas ${stat.icon} text-lg`}></i>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{loading ? '—' : stat.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { title: 'Post New Job', desc: 'Post f/w new job treeement a me administrative search prousers.', icon: 'fa-plus-circle', path: '/post-job' },
            { title: 'My Jobs', desc: 'You can make my jobs to your jobs some post na My jobs.', icon: 'fa-briefcase', path: '/My-Posted-Jobs' },
            { title: 'Applications', desc: 'Duneswan your applications now charming on your applications.', icon: 'fa-file-alt', path: '/applications' },
            { title: 'My Profile', desc: 'My eyes or I am loved to mani or a-homeruas my profile.', icon: 'fa-user-cog', path: '/my-profile' }
          ].map((action, i) => (
            <Link key={i} to={action.path} className="group">
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-blue-100 text-center flex flex-col items-center h-full">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#0a58ca] mb-6 transition-colors group-hover:bg-[#0a58ca] group-hover:text-white">
                  <i className={`fas ${action.icon} text-2xl`}></i>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-[#0a58ca] transition-colors">{action.title}</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Job Postings */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900">Recent Job Postings</h2>
            <Link to="/My-Posted-Jobs" className="bg-[#0a58ca] hover:bg-[#084298] text-white px-6 py-2 rounded-lg font-bold text-xs transition-colors shadow-lg shadow-blue-500/20">
              View All
            </Link>
          </div>

          {error ? (
            <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 text-center font-bold">
              <i className="fas fa-exclamation-triangle mr-2"></i> Error: {error}
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-inbox text-3xl text-gray-300"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-500 font-medium mb-8">You haven't posted any jobs yet. Get started by clicking the button below.</p>
              <Link to="/post-job" className="bg-[#0a58ca] text-white px-10 py-3.5 rounded-xl font-bold transition-all hover:bg-[#084298] shadow-lg shadow-blue-500/20">
                Post Your First Job
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentJobs.map((job) => (
                <JobCard key={job.mongoId || job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
