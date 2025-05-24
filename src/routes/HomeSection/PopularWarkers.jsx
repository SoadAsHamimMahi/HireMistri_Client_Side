import { useNavigate } from 'react-router-dom';
import workers from '../../FakeData/PopularWorker.json';

const PopularWarkers = () => {
  const navigate = useNavigate();

  return (
    <div className="mt-16 px-4 md:px-8 lg:px-0 max-w-7xl mx-auto">
      <h1 className="text-center text-2xl md:text-3xl font-bold mb-8">
        Most Popular Workers
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {workers.map((worker) => (
          <div
            key={worker.id}
            className="card bg-base-100 shadow-md hover:shadow-lg cursor-pointer transition-all"
            onClick={() => navigate(`/worker/${worker.id}`)}
          >
            <figure>
              <img
                src={worker.image}
                alt={worker.name}
                className="h-52 w-full object-cover"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title text-lg md:text-xl">
                {worker.name}
                <div className="badge badge-success">⭐ {worker.rating}</div>
              </h2>
              <p className="text-sm text-gray-600">
                {worker.role} • {worker.jobs}+ jobs • {worker.location}
              </p>
              <p className="font-semibold text-gray-800 mt-2">
                Starts from ৳{worker.price}
              </p>
              <div className="card-actions justify-end mt-3 flex-wrap gap-2">
                <div className="badge badge-outline">{worker.role}</div>
                <div className="badge badge-outline">View</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularWarkers;
