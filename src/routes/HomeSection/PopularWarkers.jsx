import { Link } from 'react-router-dom';
import workers from '../../FakeData/PopularWorker.json';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useTheme } from '../../contexts/ThemeContext';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const PopularWarkers = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="mt-16 px-4 md:px-8 lg:px-0 max-w-7xl mx-auto">
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
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                className="h-full"
              >
                {(worker.gigs || [worker.image]).map((img, idx) => (
                  <SwiperSlide key={idx}>
                    <img
                      src={img}
                      alt={`Gig ${idx + 1}`}
                      className="h-52 w-full object-cover"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <div className="card-body">
              <h2 className="card-title text-lg md:text-xl">
                {worker.name}
                <div className="badge badge-success">⭐ {worker.rating}</div>
              </h2>

              <p className="text-sm capitalize text-base-content opacity-70">
                {(worker.roles || [worker.role]).join(', ')} • {worker.jobs}+ jobs • {worker.location}
              </p>

              <p className="font-semibold mt-2 text-base-content">
                Starts from ৳{worker.price}
              </p>

              <div className="card-actions justify-end mt-3 flex-wrap gap-2">
                {(worker.roles || [worker.role]).map((role, idx) => (
                  <div key={idx} className="badge badge-outline capitalize">
                    {role}
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PopularWarkers;
