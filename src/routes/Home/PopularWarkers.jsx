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
              name: [worker.firstName, worker.lastName].filter(Boolean).join(' ') || 'Worker',
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
      <div className="mt-20 w-full mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="mt-20 w-full mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-extrabold mb-10 text-white tracking-tight">
          Most Popular Workers
        </h2>
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-center justify-center gap-4 mx-auto">
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
      <div className="mt-20 w-full mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl md:text-4xl font-extrabold mb-10 text-white tracking-tight">
          Most Popular Workers
        </h2>
        <div className="text-center py-20 bg-[#121a2f] border border-slate-800 rounded-2xl mx-auto">
          <i className="fas fa-users text-7xl text-slate-600 mb-6 drop-shadow-lg"></i>
          <p className="text-slate-400 font-medium text-lg">No popular workers found at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 bg-white w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center lg:text-left mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Most Popular Workers
          </h2>
          <p className="text-gray-500 text-sm md:text-base font-medium">Hire from our top-rated, proven professionals ready right now.</p>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {workers.map((worker) => (
          <div key={worker.id} className="border border-gray-100 rounded-xl p-4 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow">

            {/* ✅ Gig Image Slider */}
            <div className="relative mb-4 rounded-lg overflow-hidden h-48">
              {/* Verified Badge overlaying */}
              <div className="absolute top-2 left-2 z-20 bg-[#0a58ca] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
                <i className="fas fa-check-circle"></i> Verified
              </div>
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
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Worker+Portfolio';
                        }}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="h-full w-full bg-gray-100 flex items-center justify-center relative">
                  <i className="fas fa-user text-6xl text-gray-300"></i>
                </div>
              )}
            </div>

            {/* Card Content Area */}
            <div className="flex-1 flex flex-col">
              {/* Profile Header Row */}
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-[#0a58ca] text-lg truncate pr-2">
                  <Link to={`/worker/${worker.id}`} className="hover:text-[#084298] transition-colors">
                    {worker.name}
                  </Link>
                </h3>

                {worker.rating > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded text-xs font-bold shadow-sm">
                    <i className="fas fa-star w-3"></i>
                    {worker.rating.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Stats & Meta info */}
              <p className="text-gray-600 text-sm mb-1 capitalize">
                {worker.roles.length > 0 ? worker.roles[0] : 'General Worker'}
                {worker.roles.length > 1 && <span className="ml-1 text-xs text-gray-500">+{worker.roles.length - 1}</span>}
              </p>
              
              <p className="text-[#0a58ca] font-medium text-sm mb-3">{worker.jobs}+ jobs done</p>

              <div className="text-gray-500 text-sm flex items-center justify-between gap-1 mb-4 mt-auto">
                <div className="flex items-center gap-1 truncate w-2/3">
                  <i className="fas fa-map-marker-alt w-3"></i>
                  <span className="truncate">{worker.location}</span>
                </div>
                <div className="font-bold text-gray-900 border-l border-gray-200 pl-2">
                  {worker.price > 0 ? `৳${worker.price.toLocaleString()}` : 'Neg.'}
                </div>
              </div>

              <Link
                to={`/worker/${worker.id}`}
                className="w-full text-center bg-[#0a58ca] hover:bg-[#084298] text-white py-2 rounded-md font-medium transition-colors text-sm"
              >
                View Profile
              </Link>
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
    </section>
  );
};

export default PopularWarkers;
