// src/routes/WorkerProfile.jsx
import { useParams } from 'react-router-dom';

export default function WorkerProfile() {
  const { workerId } = useParams();

  // Dummy data — you can fetch based on workerId later
  const worker = {
    name: 'Arif Hossain',
    skill: 'Plumber',
    rating: 4.8,
    experience: '5 years',
    jobsCompleted: 42,
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">{worker.name}</h2>
          <p>Skill: {worker.skill}</p>
          <p>Experience: {worker.experience}</p>
          <p>Completed Jobs: {worker.jobsCompleted}</p>
          <div className="rating rating-sm mt-2">
            <input
              type="radio"
              name="rating"
              className="mask mask-star-2 bg-yellow-400"
              checked
              readOnly
            />
            <span className="ml-2">{worker.rating}</span>
          </div>
          <div className="card-actions justify-end mt-4">
            <button className="btn btn-primary">Hire</button>
          </div>
        </div>
      </div>
    </div>
  );
}
