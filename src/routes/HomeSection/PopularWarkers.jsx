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
          // Map API response to component expected format
          const mappedWorkers = (Array.isArray(data) ? data : []).map(worker => {
            // Extract portfolio images (gigs)
            const portfolioImages = Array.isArray(worker.portfolio) 
              ? worker.portfolio.map(p => p.url || (typeof p === 'string' ? p : '')).filter(Boolean)
              : [];
            
            // Use profileCover as fallback if portfolio is empty
            const gigs = portfolioImages.length > 0 
              ? portfolioImages 
              : (worker.profileCover ? [worker.profileCover] : []);

            // Extract pricing
            const pricing = worker.pricing || {};
            const price = pricing.startingPrice || pricing.minimumCharge || pricing.hourlyRate || 0;

            // Extract location
            const location = worker.city || worker.country || 'Location not set';

            // Extract roles/categories
            const roles = Array.isArray(worker.servicesOffered?.categories) 
              ? worker.servicesOffered.categories 
              : [];

            return {
              id: worker.uid, // Use uid for routing
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
      <div className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-center text-2xl md:text-3xl font-bold mb-8 text-base-content">
          Most Popular Workers
        </h1>
        <div className="flex justify-center items-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="ml-4 text-base-content opacity-70">Loading workers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-center text-2xl md:text-3xl font-bold mb-8 text-base-content">
          Most Popular Workers
        </h1>
        <div className="alert alert-error">
          <i className="fas fa-exclamation-triangle"></i>
          <div>
            <h3 className="font-bold">Error Loading Workers</h3>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-center text-2xl md:text-3xl font-bold mb-8 text-base-content">
          Most Popular Workers
        </h1>
        <div className="text-center py-12">
          <i className="fas fa-users text-6xl text-base-content opacity-30 mb-4"></i>
          <p className="text-base-content opacity-70">No workers found at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-center text-2xl md:text-3xl font-bold mb-8 text-base-content">
        Most Popular Workers
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((worker) => (
          <Link
            to={`/worker/${worker.id}`}
            key={worker.id}
            className="card bg-base-200 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:ring-2 hover:ring-primary no-underline text-inherit"
          >
            {/* ✅ Gig Image Slider */}
            <div className="h-52 w-full overflow-hidden">
              {worker.gigs && worker.gigs.length > 0 ? (
                <Swiper
                  modules={[Navigation, Pagination]}
                  navigation
                  pagination={{ clickable: true }}
                  className="h-full"
                >
                  {worker.gigs.map((img, idx) => (
                    <SwiperSlide key={idx}>
                      <img
                        src={img}
                        alt={`Gig ${idx + 1}`}
                        className="h-52 w-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Worker+Portfolio';
                        }}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="h-52 w-full bg-base-300 flex items-center justify-center">
                  <i className="fas fa-user text-6xl text-base-content opacity-30"></i>
                </div>
              )}
            </div>

            <div className="card-body">
              <h2 className="card-title text-lg md:text-xl">
                {worker.name}
                {worker.rating > 0 && (
                  <div className="badge badge-success">⭐ {worker.rating.toFixed(1)}</div>
                )}
              </h2>

              <p className="text-sm capitalize text-base-content opacity-70">
                {worker.roles.length > 0 ? worker.roles.join(', ') : 'General Worker'} • {worker.jobs}+ jobs • {worker.location}
              </p>

              <p className="font-semibold mt-2 text-base-content">
                {worker.price > 0 ? `Starts from ৳${worker.price.toLocaleString()}` : 'Contact for price'}
              </p>

              <div className="card-actions justify-end mt-3 flex-wrap gap-2">
                {worker.roles.length > 0 ? (
                  worker.roles.map((role, idx) => (
                    <div key={idx} className="badge badge-outline capitalize">
                      {role}
                    </div>
                  ))
                ) : (
                  <div className="badge badge-outline">Worker</div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PopularWarkers;
