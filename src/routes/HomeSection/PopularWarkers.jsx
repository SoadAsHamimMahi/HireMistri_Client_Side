import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useTheme } from '../../contexts/ThemeContext';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const PopularWarkers = () => {
  const { isDarkMode } = useTheme();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch(`${API_BASE}/api/browse-workers?limit=9&sortBy=popular`, {
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch workers: ${response.status}`);
        }

        const data = await response.json();
        
        if (!ignore) {
          const mappedWorkers = (Array.isArray(data) ? data : []).map(worker => {
            const portfolioImages = Array.isArray(worker.portfolio) 
              ? worker.portfolio.map(p => p.url || (typeof p === 'string' ? p : '')).filter(Boolean)
              : [];
            
            const gigs = portfolioImages.length > 0 
              ? portfolioImages 
              : (worker.profileCover ? [worker.profileCover] : []);

            const pricing = worker.pricing || {};
            const price = pricing.startingPrice || pricing.minimumCharge || pricing.hourlyRate || 0;

            const location = worker.city || worker.country || 'Location not set';

            const roles = Array.isArray(worker.servicesOffered?.categories) 
              ? worker.servicesOffered.categories 
              : [];

            return {
              id: worker.uid,
              name: worker.displayName || 'Worker',
              roles: roles,
              rating: worker.stats?.averageRating || 0,
              jobs: worker.stats?.workerCompletedJobs || 0,
              location: location,
              gigs: gigs,
              price: price,
            };
          });

          setWorkers(mappedWorkers);
        }
      } catch (e) {
        console.error('Failed to fetch popular workers:', e);
        if (!ignore) {
          setError(e?.message || 'Failed to load popular workers');
          setWorkers([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-extrabold mb-10 text-white tracking-tight">
          Most Popular Workers
        </h2>
        <div className="flex justify-center flex-col items-center py-16 gap-4">
          <span className="loading loading-spinner text-blue-500 loading-lg"></span>
          <span className="text-slate-400 font-medium tracking-wide">Connecting to top talent...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-extrabold mb-10 text-white tracking-tight">
          Most Popular Workers
        </h2>
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-center justify-center gap-4 max-w-2xl mx-auto">
          <i className="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
          <div>
            <h3 className="font-bold text-white mb-1">Error Loading Workers</h3>
            <div className="text-sm text-slate-300">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-extrabold mb-10 text-white tracking-tight">
          Most Popular Workers
        </h2>
        <div className="text-center py-20 bg-[#121a2f] border border-slate-800 rounded-2xl max-w-4xl mx-auto">
          <i className="fas fa-users text-7xl text-slate-600 mb-6 drop-shadow-lg"></i>
          <p className="text-slate-400 font-medium text-lg">No popular workers found at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-white tracking-tight">
          Most Popular Workers
        </h2>
        <p className="text-slate-400 text-sm md:text-base font-medium">Hire from our top-rated, proven professionals ready right now.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {workers.map((worker) => (
          <div key={worker.id} className="group flex flex-col bg-[#121a2f] rounded-2xl border border-slate-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(37,99,235,0.15)] hover:border-blue-500/40 relative overflow-hidden">
            
            {/* Top Glow on hover */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/80 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>

            {/* ✅ Gig Image Slider */}
            <div className="h-56 w-full overflow-hidden relative">
              {worker.gigs && worker.gigs.length > 0 ? (
                <Swiper
                  modules={[Navigation, Pagination]}
                  navigation
                  pagination={{ clickable: true }}
                  className="h-full w-full custom-swiper"
                >
                  {worker.gigs.map((img, idx) => (
                    <SwiperSlide key={idx}>
                      <img
                        src={img}
                        alt={`Gig ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Worker+Portfolio';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121a2f] to-transparent opacity-80 z-10"></div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="h-full w-full bg-[#172136] flex items-center justify-center relative">
                  <i className="fas fa-user text-6xl text-slate-700/50"></i>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121a2f] to-transparent opacity-80"></div>
                </div>
              )}

              {/* Verified Badge overlaying image */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-lg">
                <i className="fas fa-check-circle"></i> Verified
              </div>
            </div>

            {/* Card Content Area - shifted up slightly for overlap effect */}
            <div className="flex-1 flex flex-col p-6 pt-0 relative z-20 -mt-8">
              
              {/* Profile Header Row */}
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xl md:text-2xl font-bold text-white truncate drop-shadow-md pr-2">
                  <Link to={`/worker/${worker.id}`} className="hover:text-blue-400 transition-colors">
                    {worker.name}
                  </Link>
                </h3>
                
                {worker.rating > 0 && (
                  <div className="flex items-center gap-1 bg-[#172136] border border-slate-700 px-2.5 py-1 rounded-lg shadow-sm">
                    <i className="fas fa-star text-yellow-500 text-xs text-center w-3"></i>
                    <span className="font-bold text-white text-sm">{worker.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Stats & Meta info */}
              <div className="space-y-2 mb-6 text-sm text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <i className="fas fa-tools w-4 text-center text-slate-500"></i>
                  <span className="capitalize">{worker.roles.length > 0 ? worker.roles[0] : 'General Worker'}</span>
                  {worker.roles.length > 1 && <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">+{worker.roles.length - 1}</span>}
                </div>
                
                <div className="flex justify-between items-center text-xs text-slate-500 pt-1 pb-1">
                  <div className="flex items-center gap-1.5">
                    <i className="fas fa-check-circle text-green-500/80"></i>
                    <span className="text-slate-300 font-semibold">{worker.jobs}+</span> jobs done
                  </div>
                  <div className="flex items-center gap-1.5">
                    <i className="fas fa-map-marker-alt text-slate-400"></i>
                    <span className="truncate max-w-[100px]">{worker.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <div className="flex justify-between items-center bg-[#172136] p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rate</span>
                  <span className="font-extrabold text-white text-lg">
                    {worker.price > 0 ? `৳${worker.price.toLocaleString()}` : 'Negotiable'}
                  </span>
                </div>

                <Link
                  to={`/worker/${worker.id}`}
                  className="block w-full text-center bg-[#1e293b] hover:bg-[#2563eb] border border-slate-700 hover:border-[#2563eb] text-slate-200 hover:text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 md:shadow-[0_4px_14px_0_rgba(37,99,235,0)] hover:shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] group-hover:bg-[#2563eb] group-hover:border-[#2563eb] group-hover:text-white"
                >
                  View Profile
                </Link>
              </div>

            </div>
          </div>
        ))}
      </div>

      <style>{`
        .custom-swiper .swiper-button-next,
        .custom-swiper .swiper-button-prev {
          color: white !important;
          background: rgba(0,0,0,0.5);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .custom-swiper .swiper-button-next:after,
        .custom-swiper .swiper-button-prev:after {
          font-size: 14px;
        }
        .custom-swiper:hover .swiper-button-next,
        .custom-swiper:hover .swiper-button-prev {
          opacity: 1;
        }
        .custom-swiper .swiper-pagination-bullet {
          background: white !important;
          opacity: 0.5;
        }
        .custom-swiper .swiper-pagination-bullet-active {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default PopularWarkers;
