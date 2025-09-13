// src/routes/PostJobForm/StepBudgetLocation.jsx

import { useEffect } from 'react';
import { FaMapMarkerAlt, FaMoneyBillWave, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';

export default function StepBudgetLocation({ form, setForm, nextStep, prevStep }) {
  const { isDarkMode } = useTheme();
  
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

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Section */}
        <div className="space-y-6">
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>4/5 Job post</p>
          <h2 className={`text-3xl font-bold leading-snug ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Set your Budget and Location</h2>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Help workers know how much you can pay and where the work is located.
          </p>
          <button onClick={prevStep} className={`btn btn-outline w-28 ${isDarkMode ? 'text-white border-white hover:bg-white hover:text-gray-900' : ''}`}>Back</button>
        </div>

        {/* Right Section */}
        <div className="space-y-6">
          {/* Budget */}
          <div>
            <label className={`block font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Estimated Budget (৳)</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-400"><FaMoneyBillWave /></span>
              <input
                name="budget"
                type="number"
                className={`input input-bordered w-full pl-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                placeholder="e.g. 1000"
                value={form.budget}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={`block font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-400"><FaMapMarkerAlt /></span>
              <input
                name="location"
                type="text"
                className={`input input-bordered w-full pl-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                value={form.location}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className={`block font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Preferred Date</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-400"><FaCalendarAlt /></span>
              <input
                name="date"
                type="date"
                min={getTodayDate()}
                className={`input input-bordered w-full pl-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                value={form.date}
                onChange={handleChange}
                style={{
                  colorScheme: isDarkMode ? 'dark' : 'light',
                  backgroundColor: isDarkMode ? '#374151' : 'white',
                  color: isDarkMode ? 'white' : 'black'
                }}
              />
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Only future dates can be selected
            </p>
          </div>

          {/* Time */}
          <div>
            <label className={`block font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Preferred Time</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-400"><FaClock /></span>
              <input
                name="time"
                type="time"
                min={form.date === getTodayDate() ? getCurrentTime() : '00:00'}
                className={`input input-bordered w-full pl-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                value={form.time}
                onChange={handleChange}
                style={{
                  colorScheme: isDarkMode ? 'dark' : 'light',
                  backgroundColor: isDarkMode ? '#374151' : 'white',
                  color: isDarkMode ? 'white' : 'black'
                }}
              />
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {form.date === getTodayDate() ? 'Only future times can be selected for today' : 'Select any time for future dates'}
            </p>
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