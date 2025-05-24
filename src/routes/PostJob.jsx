// src/routes/PostJob.jsx
import { useState } from 'react';

export default function PostJob() {
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    budget: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Job posted:', form);
    // You'd handle API submission here
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Post a New Job</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          type="text"
          placeholder="Job Title"
          className="input input-bordered w-full"
          value={form.title}
          onChange={handleChange}
        />
        <select
          name="category"
          className="select select-bordered w-full"
          value={form.category}
          onChange={handleChange}
        >
          <option disabled value="">
            Select Category
          </option>
          <option value="Electrician">Electrician</option>
          <option value="Plumber">Plumber</option>
          <option value="Mechanic">Mechanic</option>
          <option value="Technician">Technician</option>
        </select>
        <textarea
          name="description"
          className="textarea textarea-bordered w-full"
          placeholder="Job Description"
          value={form.description}
          onChange={handleChange}
        ></textarea>
        <input
          name="location"
          type="text"
          placeholder="Your Location"
          className="input input-bordered w-full"
          value={form.location}
          onChange={handleChange}
        />
        <input
          name="budget"
          type="number"
          placeholder="Estimated Budget (optional)"
          className="input input-bordered w-full"
          value={form.budget}
          onChange={handleChange}
        />
        <button type="submit" className="btn btn-primary w-full">
          Submit Job
        </button>
      </form>
    </div>
  );
}
