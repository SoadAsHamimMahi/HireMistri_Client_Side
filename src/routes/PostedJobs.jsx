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

  if (loading) return <div className={`py-10 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Loading…</div>;
  if (err) return <div className="py-10 text-center text-red-600">{err}</div>;

  return (
    <div className={`max-w-7xl mx-auto px-4 py-10 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <h1 className={`text-3xl font-bold text-center mb-8 ${isDarkMode ? 'text-white' : 'text-primary'}`}>📋 My Posted Jobs</h1>

      {/* Filter Tabs */}
      <div className={`tabs tabs-boxed justify-center mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {['all', 'active', 'in-progress', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`tab capitalize transition-colors duration-300 ${
              filter === status 
                ? 'tab-active bg-green-500 !text-white' 
                : isDarkMode 
                  ? '!text-white hover:!bg-gray-700 hover:!text-white' 
                  : '!text-gray-800 hover:!bg-gray-200 hover:!text-gray-800'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className={`shadow-lg border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            {/* Image Slider */}
            <div className="h-48">
              <Swiper modules={[Navigation, Pagination]} navigation pagination={{ clickable: true }} className="h-full">
                {(job.images || []).map((img, idx) => (
                  <SwiperSlide key={idx}>
                    <img src={img} alt={`Job ${job.id}`} className="object-cover w-full h-48" />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Job Info */}
            <div className="p-5 flex flex-col justify-between">
              <div>
                <h3 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{job.title}</h3>
                <p className={`mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{job.category}</p>

                {/* Status */}
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>

                {/* Details */}
                <div className={`mt-3 space-y-1 text-sm ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  <p>📍 {job.location}</p>
                  <p>
                    💰 <span className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{job.budget} ৳</span>
                  </p>
                  <p>🗓️ {job.date}</p>
                </div>

                {/* Applicants */}
                <div className="mt-4">
                  <p className={`font-semibold text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    👷 Applicants: <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{job.applicants?.length || 0}</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex justify-between">
                <button className={`btn btn-sm ${isDarkMode ? 'btn-outline text-white border-white hover:bg-white hover:text-gray-900' : 'btn-outline'}`}>Edit</button>
                <button className={`btn btn-sm ${isDarkMode ? 'btn-error text-white' : 'btn-error text-white'}`}>Delete</button>
                <Link to={`/My-Posted-Job-Details/${job.mongoId || job.id}`} className={`btn text-xl ${isDarkMode ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
