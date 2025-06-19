// src/routes/PostJobForm/StepBudgetLocation.jsx

import { useEffect } from 'react';
import { FaMapMarkerAlt, FaMoneyBillWave, FaCalendarAlt, FaClock } from 'react-icons/fa';

export default function StepBudgetLocation({ form, setForm, nextStep, prevStep }) {
  // 🌍 Auto-detect location on mount
  useEffect(() => {
    if (!form.location && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await res.json();
        const address = data.display_name || `Lat: ${latitude}, Lon: ${longitude}`;
        setForm(prev => ({ ...prev, location: address }));
      });
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Section */}
        <div className="space-y-6">
          <p className="text-sm text-gray-500 font-medium">4/5 Job post</p>
          <h2 className="text-3xl font-bold leading-snug text-gray-900">Set your Budget and Location</h2>
          <p className="text-gray-600">
            Help workers know how much you can pay and where the work is located.
          </p>
          <button onClick={prevStep} className="btn btn-outline w-28">Back</button>
        </div>

        {/* Right Section */}
        <div className="space-y-6">
          {/* Budget */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Estimated Budget (৳)</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-400"><FaMoneyBillWave /></span>
              <input
                name="budget"
                type="number"
                className="input input-bordered w-full pl-10"
                placeholder="e.g. 1000"
                value={form.budget}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Location</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-400"><FaMapMarkerAlt /></span>
              <input
                name="location"
                type="text"
                className="input input-bordered w-full pl-10"
                value={form.location}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Preferred Date</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-400"><FaCalendarAlt /></span>
              <input
                name="date"
                type="date"
                className="input input-bordered w-full pl-10"
                value={form.date}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Preferred Time</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-400"><FaClock /></span>
              <input
                name="time"
                type="time"
                className="input input-bordered w-full pl-10"
                value={form.time}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            onClick={nextStep}
            className="btn bg-green-600 hover:bg-green-700 text-white w-32 mt-4"
          >
            Next: Images
          </button>
        </div>
      </div>
    </div>
  );
}
