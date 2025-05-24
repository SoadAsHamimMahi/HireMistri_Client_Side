// src/routes/Dashboard.jsx
import { Link } from 'react-router-dom';

const dummyJobs = [
  { id: 1, title: 'Fix Bathroom Leak', status: 'Open' },
  { id: 2, title: 'AC Maintenance', status: 'In Progress' },
];

export default function Dashboard() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Posted Jobs</h2>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dummyJobs.map((job) => (
              <tr key={job.id}>
                <td>{job.title}</td>
                <td>
                  <span className={`badge badge-${job.status === 'Open' ? 'success' : 'info'}`}>
                    {job.status}
                  </span>
                </td>
                <td>
                  <Link to={`/applications`}>
                    <button className="btn btn-outline btn-sm">View Applications</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
