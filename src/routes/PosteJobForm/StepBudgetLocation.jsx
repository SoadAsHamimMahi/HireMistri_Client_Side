import { useEffect } from 'react';
import { FaMapMarkerAlt, FaMoneyBillWave, FaCalendarAlt, FaClock, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import LocationAutocomplete from '../../components/LocationAutocomplete';

export default function StepBudgetLocation({ form, setForm, nextStep, prevStep }) {
  // Auto-detect location on mount
  useEffect(() => {
    if (!form.location && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await res.json();
            const address = data.display_name || `Lat: ${latitude}, Lon: ${longitude}`;
            setForm((prev) => ({ ...prev, location: address }));
          } catch (error) {
            console.error('Error fetching location:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Section - Instructions */}
      <div className="card bg-base-200 shadow-sm border border-base-300">
        <div className="card-body p-6 lg:p-8 space-y-6">
          <div>
            <p className="text-sm font-medium text-base-content opacity-60 mb-2">Step 4 of 5</p>
            <h2 className="text-3xl lg:text-4xl font-bold leading-snug text-base-content mb-4">
              Set your Budget and Location
            </h2>
            <p className="text-base-content opacity-70 leading-relaxed">
              Help workers know how much you can pay and where the work is located.
            </p>
          </div>

          {/* Tips Section */}
          <div className="bg-base-100 rounded-lg p-4 border border-base-300">
            <p className="text-sm font-semibold text-base-content mb-2">💡 Budget & Location tips:</p>
            <ul className="text-sm text-base-content opacity-70 space-y-1 list-disc list-inside">
              <li>Set a realistic budget range</li>
              <li>Be specific about location</li>
              <li>Choose preferred date and time</li>
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
          {/* Budget and Location Group */}
          <div className="bg-base-100 rounded-lg p-4 border border-base-300 space-y-4">
            <h3 className="font-semibold text-base-content opacity-80 text-sm">Payment & Location</h3>
            
            {/* Budget */}
            <div className="space-y-2">
              <label className="block font-semibold text-base-content opacity-80">
                Estimated Budget (৳)
              </label>
              <div className="relative">
                <span className="absolute top-3.5 left-3 text-base-content opacity-50">
                  <FaMoneyBillWave />
                </span>
                <input
                  name="budget"
                  type="number"
                  min="0"
                  step="100"
                  className="input input-bordered w-full pl-10 bg-base-100 border-base-300 focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 5000, 10000"
                  value={form.budget || ''}
                  onChange={handleChange}
                />
              </div>
              <p className="text-xs text-base-content opacity-60">
                Enter your estimated budget in Bangladeshi Taka (৳)
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="block font-semibold text-base-content opacity-80">
                Location
              </label>
              <div className="relative">
                <span className="absolute top-3.5 left-3 text-base-content opacity-50 z-10">
                  <FaMapMarkerAlt />
                </span>
                <LocationAutocomplete
                  value={form.location || ''}
                  onChange={(value) => setForm({ ...form, location: value })}
                  placeholder="e.g. Dhanmondi, Dhaka or Full address"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-base-content opacity-60">
                Start typing to see location suggestions, or we'll try to auto-detect your location
              </p>
            </div>
          </div>

          {/* Date and Time Group */}
          <div className="bg-base-100 rounded-lg p-4 border border-base-300 space-y-4">
            <h3 className="font-semibold text-base-content opacity-80 text-sm">Preferred Schedule</h3>
            
            {/* Date */}
            <div className="space-y-2">
              <label className="block font-semibold text-base-content opacity-80">
                Preferred Date
              </label>
              <div className="relative">
                <span className="absolute top-3.5 left-3 text-base-content opacity-50">
                  <FaCalendarAlt />
                </span>
                <input
                  name="date"
                  type="date"
                  min={getTodayDate()}
                  className="input input-bordered w-full pl-10 bg-base-100 border-base-300 focus:ring-2 focus:ring-primary text-base-content"
                  value={form.date || ''}
                  onChange={handleChange}
                />
              </div>
              <p className="text-xs text-base-content opacity-60">
                Only future dates can be selected
              </p>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <label className="block font-semibold text-base-content opacity-80">
                Preferred Time
              </label>
              <div className="relative">
                <span className="absolute top-3.5 left-3 text-base-content opacity-50">
                  <FaClock />
                </span>
                <input
                  name="time"
                  type="time"
                  min={form.date === getTodayDate() ? getCurrentTime() : '00:00'}
                  className="input input-bordered w-full pl-10 bg-base-100 border-base-300 focus:ring-2 focus:ring-primary text-base-content"
                  value={form.time || ''}
                  onChange={handleChange}
                />
              </div>
              <p className="text-xs text-base-content opacity-60">
                {form.date === getTodayDate()
                  ? 'Only future times can be selected for today'
                  : 'Select any time for future dates'}
              </p>
            </div>

            {/* Expiration Date (Optional) */}
            <div className="space-y-2">
              <label className="block font-semibold text-base-content opacity-80">
                Expiration Date <span className="text-xs opacity-60">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute top-3.5 left-3 text-base-content opacity-50">
                  <FaCalendarAlt />
                </span>
                <input
                  name="expiresAt"
                  type="date"
                  min={getTodayDate()}
                  className="input input-bordered w-full pl-10 bg-base-100 border-base-300 focus:ring-2 focus:ring-primary text-base-content"
                  value={form.expiresAt || ''}
                  onChange={handleChange}
                />
              </div>
              <p className="text-xs text-base-content opacity-60">
                Job will be automatically closed on this date. Leave empty for no expiration.
              </p>
            </div>
          </div>

          {/* Navigation Button */}
          <div className="flex justify-end pt-4 border-t border-base-300">
            <button onClick={nextStep} className="btn btn-primary btn-lg">
              Next: Images
              <FaArrowRight className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}