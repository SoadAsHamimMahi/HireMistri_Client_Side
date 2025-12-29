import { FaClock, FaUsers, FaFlag, FaFolderOpen, FaArrowRight, FaArrowLeft } from "react-icons/fa";

export default function StepScope({ form, setForm, nextStep, prevStep }) {
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isDisabled = !form.category;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Section - Instructions */}
      <div className="card bg-base-200 shadow-sm border border-base-300">
        <div className="card-body p-6 lg:p-8 space-y-6">
          <div>
            <p className="text-sm font-medium text-base-content opacity-60 mb-2">Step 3 of 5</p>
            <h2 className="text-3xl lg:text-4xl font-bold leading-snug text-base-content mb-4">
              Define the scope of your work
            </h2>
            <p className="text-base-content opacity-70 leading-relaxed">
              How big is your project? Is it urgent? How many workers do you need?
            </p>
          </div>

          {/* Tips Section */}
          <div className="bg-base-100 rounded-lg p-4 border border-base-300">
            <p className="text-sm font-semibold text-base-content mb-2">💡 Scope details help:</p>
            <ul className="text-sm text-base-content opacity-70 space-y-1 list-disc list-inside">
              <li>Workers understand the project size</li>
              <li>Better time and resource planning</li>
              <li>More accurate quotes and timelines</li>
            </ul>
          </div>

          <button className="btn btn-outline w-32" onClick={prevStep}>
            <FaArrowLeft className="mr-2" />
            Back
          </button>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="card bg-base-200 shadow-sm border border-base-300">
        <div className="card-body p-6 lg:p-8 space-y-6">
          {/* Job Category */}
          <div className="space-y-2">
            <label className="block font-semibold text-base-content opacity-80">
              Job Category <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute top-3.5 left-3 text-base-content opacity-50">
                <FaFolderOpen />
              </span>
              <select
                name="category"
                className="select select-bordered w-full pl-10 bg-base-100 border-base-300 focus:ring-2 focus:ring-primary"
                value={form.category || ''}
                onChange={handleChange}
                required
              >
                <option disabled value="">Select Category</option>
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="Mechanic">Mechanic</option>
                <option value="Technician">Technician</option>
                <option value="Carpenter">Carpenter</option>
                <option value="Mason">Mason (Rajmistri)</option>
                <option value="Welder">Welder</option>
                <option value="Painter">Painter</option>
                <option value="AC Technician">AC Technician</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <p className="text-xs text-base-content opacity-60">
              Select the primary category for your job
            </p>
          </div>

          {/* Project Details Group */}
          <div className="bg-base-100 rounded-lg p-4 border border-base-300 space-y-4">
            <h3 className="font-semibold text-base-content opacity-80 text-sm">Project Details</h3>
            
            {/* Duration */}
            <div className="space-y-2">
              <label className="block font-medium text-base-content opacity-80">
                Estimated Duration
              </label>
              <div className="relative">
                <span className="absolute top-3.5 left-3 text-base-content opacity-50">
                  <FaClock />
                </span>
                <input
                  type="text"
                  name="duration"
                  placeholder="e.g. 2 days, 1 week, 2-3 weeks"
                  value={form.duration || ''}
                  onChange={handleChange}
                  className="input input-bordered w-full pl-10 bg-base-100 border-base-300 focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-xs text-base-content opacity-60">
                How long do you expect this project to take?
              </p>
            </div>

            {/* Number of Workers */}
            <div className="space-y-2">
              <label className="block font-medium text-base-content opacity-80">
                Number of Workers
              </label>
              <div className="relative">
                <span className="absolute top-3.5 left-3 text-base-content opacity-50">
                  <FaUsers />
                </span>
                <input
                  type="number"
                  name="workersNeeded"
                  min="1"
                  placeholder="e.g. 1, 2, 5"
                  value={form.workersNeeded || ''}
                  onChange={handleChange}
                  className="input input-bordered w-full pl-10 bg-base-100 border-base-300 focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-xs text-base-content opacity-60">
                How many workers do you need for this job?
              </p>
            </div>
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <label className="block font-semibold text-base-content opacity-80">
              Urgency Level
            </label>
            <div className="relative">
              <span className="absolute top-3.5 left-3 text-base-content opacity-50 z-10">
                <FaFlag />
              </span>
              <select
                name="urgency"
                className="select select-bordered w-full pl-10 bg-base-100 border-base-300 focus:ring-2 focus:ring-primary"
                value={form.urgency || ''}
                onChange={handleChange}
              >
                <option disabled value="">Select urgency level</option>
                <option value="Low">Low (Flexible timeline)</option>
                <option value="Medium">Medium (Within a week)</option>
                <option value="High">High (ASAP / Urgent)</option>
              </select>
            </div>
            <p className="text-xs text-base-content opacity-60">
              How urgent is this job?
            </p>
          </div>

          {/* Navigation Button */}
          <div className="flex justify-end pt-4 border-t border-base-300">
            <button
              onClick={nextStep}
              disabled={isDisabled}
              className="btn btn-primary btn-lg"
            >
              Next: Budget
              <FaArrowRight className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
