// StepScope.jsx
import { FaClock, FaUsers, FaFlag } from "react-icons/fa";

export default function StepScope({ form, setForm, nextStep, prevStep }) {
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Section */}
        <div className="space-y-6">
          <p className="text-sm text-gray-500 font-medium">3/5 Job post</p>
          <h2 className="text-3xl font-bold leading-snug text-gray-900">
            Define the scope of your work
          </h2>
          <p className="text-gray-600">
            How big is your project? Is it urgent? How many workers do you need?
          </p>
          <button onClick={prevStep} className="btn btn-outline w-28">
            Back
          </button>
        </div>

        {/* Right Section */}
        <div className="space-y-6">
          {/* Category */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Job Category</label>
            <select
              name="category"
              className="select select-bordered w-full"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option disabled value="">Select Category</option>
              <option value="Electrician">Electrician</option>
              <option value="Plumber">Plumber</option>
              <option value="Mechanic">Mechanic</option>
              <option value="Technician">Technician</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Estimated Duration
            </label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-400"><FaClock /></span>
              <input
                type="text"
                name="duration"
                placeholder="e.g. 2 days, 1 week"
                value={form.duration || ''}
                onChange={handleChange}
                className="input input-bordered w-full pl-10"
              />
            </div>
          </div>

          {/* Number of Workers */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Number of Workers</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-400"><FaUsers /></span>
              <input
                type="number"
                name="workersNeeded"
                placeholder="e.g. 1, 2, 5"
                value={form.workersNeeded || ''}
                onChange={handleChange}
                className="input input-bordered w-full pl-10"
              />
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Urgency Level</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-400"><FaFlag /></span>
              <select
                name="urgency"
                className="select select-bordered w-full pl-10"
                value={form.urgency || ''}
                onChange={handleChange}
              >
                <option disabled value="">Select urgency</option>
                <option value="Low">Low (Flexible)</option>
                <option value="Medium">Medium</option>
                <option value="High">High (ASAP)</option>
              </select>
            </div>
          </div>

          <button
            onClick={nextStep}
            className="btn bg-green-600 hover:bg-green-700 text-white w-32 mt-4"
            disabled={!form.category}
          >
            Next: Budget
          </button>
        </div>
      </div>
    </div>
  );
}
