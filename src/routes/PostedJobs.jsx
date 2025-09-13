import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Link } from 'react-router-dom';

export default function PostedJobs() {
  const { isDarkMode } = useTheme();
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const auth = useContext(AuthContext);
  const currentUser = auth?.user ?? null;
  const clientId = currentUser?.uid || null;

  useEffect(() => {
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    const url = clientId
      ? `${base}/api/browse-jobs?clientId=${encodeURIComponent(clientId)}`
      : `${base}/api/browse-jobs`;

    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        setErr('');

        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`);

        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Expected JSON, got '${ct}'. First bytes: ${text.slice(0, 80)}`);
        }

        const data = await res.json();
        if (ignore) return;

        const normalized = (Array.isArray(data) ? data : []).map((j) => ({
          ...j,
          id: j.id ?? (typeof j._id === 'string' ? j._id : j._id?.$oid) ?? String(j._id || ''),
          images: j.images || [],
          applicants: j.applicants || [],
          status: j.status || 'active',
        }));

        setJobs(normalized);
      } catch (e) {
        // Ignore AbortError noise from StrictMode
        if (e?.name !== 'AbortError') {
          setErr(e.message || 'Failed to load jobs');
          console.error(e);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [clientId]);

  const filteredJobs =
    filter === 'all'
      ? jobs
      : jobs.filter((job) => String(job.status).toLowerCase() === filter);

  // Calculate stats for header
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(job => job.status === 'active').length;
  const inProgressJobs = jobs.filter(job => job.status === 'in-progress').length;
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const totalApplicants = jobs.reduce((sum, job) => sum + (job.applicants?.length || 0), 0);

  // Filter options with counts
  const filterOptions = [
    { key: 'all', label: 'All Jobs', count: totalJobs, icon: '📋' },
    { key: 'active', label: 'Active', count: activeJobs, icon: '🟢' },
    { key: 'in-progress', label: 'In Progress', count: inProgressJobs, icon: '🟡' },
    { key: 'completed', label: 'Completed', count: completedJobs, icon: '🔵' }
  ];

  const getStatusColor = (status) => {
    switch (String(status).toLowerCase()) {
      case 'active':
        return isDarkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700';
      case 'in-progress':
        return isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700';
      default:
        return isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <div className={`h-12 w-64 mx-auto rounded-lg mb-4 ${isDarkMode ? 'bg-gray-700 animate-pulse' : 'bg-gray-200 animate-pulse'}`}></div>
            <div className={`h-6 w-96 mx-auto rounded ${isDarkMode ? 'bg-gray-700 animate-pulse' : 'bg-gray-200 animate-pulse'}`}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`rounded-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className={`h-48 ${isDarkMode ? 'bg-gray-700 animate-pulse' : 'bg-gray-200 animate-pulse'}`}></div>
                <div className="p-6">
                  <div className={`h-6 w-3/4 rounded mb-2 ${isDarkMode ? 'bg-gray-700 animate-pulse' : 'bg-gray-200 animate-pulse'}`}></div>
                  <div className={`h-4 w-1/2 rounded mb-4 ${isDarkMode ? 'bg-gray-700 animate-pulse' : 'bg-gray-200 animate-pulse'}`}></div>
                  <div className={`h-8 w-full rounded ${isDarkMode ? 'bg-gray-700 animate-pulse' : 'bg-gray-200 animate-pulse'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Oops! Something went wrong</h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{err}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Enhanced Header Section */}
      <div className={`relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-green-50 to-blue-50'}`}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header Title */}
          <div className="text-center mb-8">
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              📋 My Posted Jobs
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Manage your job postings and track applications
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={`rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/70 backdrop-blur-sm border border-gray-200'}`}>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalJobs}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Jobs</div>
            </div>
            <div className={`rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/70 backdrop-blur-sm border border-gray-200'}`}>
              <div className={`text-2xl font-bold text-green-500`}>{activeJobs}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active</div>
            </div>
            <div className={`rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/70 backdrop-blur-sm border border-gray-200'}`}>
              <div className={`text-2xl font-bold text-yellow-500`}>{inProgressJobs}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>In Progress</div>
            </div>
            <div className={`rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white/70 backdrop-blur-sm border border-gray-200'}`}>
              <div className={`text-2xl font-bold text-blue-500`}>{totalApplicants}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Applicants</div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Link 
              to="/post-job" 
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/25' : 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/25'}`}
            >
              <span className="text-xl">➕</span>
              Post New Job
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Modern Filter System */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                className={`group relative px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                  filter === option.key
                    ? isDarkMode
                      ? 'bg-green-600 text-white shadow-lg shadow-green-500/25'
                      : 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                    : isDarkMode
                      ? 'bg-gray-800/50 backdrop-blur-sm text-white border border-gray-700 hover:bg-gray-700/50 hover:border-gray-600'
                      : 'bg-white/70 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-white hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{option.icon}</span>
                  <span>{option.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    filter === option.key
                      ? isDarkMode ? 'bg-green-500 text-white' : 'bg-green-400 text-white'
                      : isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {option.count}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Job Cards */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">📋</div>
            <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {filter === 'all' ? 'No jobs posted yet' : `No ${filter} jobs found`}
            </h3>
            <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {filter === 'all' 
                ? 'Start by posting your first job to find skilled workers' 
                : `Try switching to a different filter or post a new job`
              }
            </p>
            {filter === 'all' && (
              <Link 
                to="/post-job" 
                className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/25' : 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/25'}`}
              >
                <span className="text-xl">➕</span>
                Post Your First Job
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredJobs.map((job) => (
            <div
              key={job.id}
              className={`group relative overflow-hidden rounded-2xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-2 ${
                isDarkMode 
                  ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 shadow-2xl shadow-gray-900/50' 
                  : 'bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-2xl shadow-gray-200/50'
              }`}
            >
              {/* Enhanced Image Section */}
              <div className="relative h-48 overflow-hidden">
                {/* Status Badge Overlay */}
                <div className="absolute top-4 left-4 z-10">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${getStatusColor(job.status)}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                    {job.status}
                  </span>
                </div>
                
                {/* Urgency Badge */}
                {job.applicants?.length > 5 && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-500 text-white backdrop-blur-sm">
                      🔥 Hot Job
                    </span>
                  </div>
                )}

                <Swiper modules={[Navigation, Pagination]} navigation pagination={{ clickable: true }} className="h-full">
                  {(job.images || []).map((img, idx) => (
                    <SwiperSlide key={idx}>
                      <img src={img} alt={`Job ${job.id}`} className="object-cover w-full h-48 transition-transform duration-500 group-hover:scale-110" />
                    </SwiperSlide>
                  ))}
                </Swiper>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Enhanced Job Content */}
              <div className="p-6 flex flex-col justify-between h-full">
                <div>
                  <h3 className={`text-xl font-bold mb-2 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {job.title}
                  </h3>
                  <p className={`text-sm font-medium mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {job.category}
                  </p>

                  {/* Enhanced Details Grid */}
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="text-lg">📍</span>
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="text-lg">💰</span>
                      <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                        {job.budget} ৳
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="text-lg">🗓️</span>
                      <span>{job.date}</span>
                    </div>
                  </div>

                  {/* Enhanced Applicants Section */}
                  <div className={`rounded-lg p-3 mb-4 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👷</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Applicants
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {job.applicants?.length || 0}
                        </span>
                        {job.applicants?.length > 0 && (
                          <div className="flex -space-x-2">
                            {job.applicants.slice(0, 3).map((applicant, idx) => (
                              <div key={idx} className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 border-2 border-white"></div>
                            ))}
                            {job.applicants.length > 3 && (
                              <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
                                +{job.applicants.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex gap-2">
                  <button className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white border border-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 border border-gray-300'
                  }`}>
                    ✏️ Edit
                  </button>
                  <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}>
                    🗑️
                  </button>
                  <Link 
                    to={`/My-Posted-Job-Details/${job.mongoId || job.id}`} 
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/25' 
                        : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25'
                    }`}
                  >
                    👁️ View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
