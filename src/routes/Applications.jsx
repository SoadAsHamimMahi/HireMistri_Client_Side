// src/routes/Applications.jsx

const applicants = [
    { id: 1, name: 'Arif Hossain', skill: 'Plumber', rating: 4.7 },
    { id: 2, name: 'Salman Rahman', skill: 'Electrician', rating: 4.9 },
  ];
  
  export default function Applications() {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Job Applications</h2>
        <div className="grid gap-4">
          {applicants.map((worker) => (
            <div key={worker.id} className="card bg-base-100 shadow-md">
              <div className="card-body flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">{worker.name}</h3>
                  <p className="text-sm">{worker.skill}</p>
                  <div className="rating rating-sm mt-1">
                    <input
                      type="radio"
                      name={`rating-${worker.id}`}
                      className="mask mask-star-2 bg-yellow-400"
                      checked
                      readOnly
                    />
                    <span className="ml-2">{worker.rating}</span>
                  </div>
                </div>
                <div className="card-actions mt-2 md:mt-0">
                  <button className="btn btn-sm btn-primary">Accept</button>
                  <button className="btn btn-sm btn-outline">View Profile</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  