import { FaArrowRight, FaArrowLeft, FaLightbulb } from 'react-icons/fa';

export default function StepBudgetLocation({ form, setForm, nextStep, prevStep }) {
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left panel */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
            Set your Budget and Schedule
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Define the financial range and timing for your project to help mistris
            provide accurate quotes and availability.
          </p>
        </div>

        {/* Pro Tip */}
        <div className="bg-[#111e34] border border-[#1e3054] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaLightbulb className="text-[#1754cf]" size={14} />
            <span className="text-sm font-semibold text-white">Pro Tip</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Setting a realistic budget and clear schedule helps attract the most qualified
            professionals quickly. Experts are more likely to respond to jobs with clear timelines.
          </p>
        </div>

        <button
          onClick={prevStep}
          className="flex items-center gap-2 text-slate-400 text-sm hover:text-white transition-colors"
        >
          <FaArrowLeft size={11} />
          Back
        </button>
      </div>

      {/* Right panel */}
      <div className="space-y-6">
        {/* Estimated Budget */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <i className="fas fa-dollar-sign text-[#1754cf] text-sm" />
            <span className="text-sm font-semibold text-white">Estimated Budget</span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              $
            </span>
            <input
              name="budget"
              type="number"
              min="0"
              step="100"
              value={form.budget || ''}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full bg-[#0e1627] border border-[#1e3054] text-white placeholder-slate-600 rounded-xl pl-8 pr-16 py-3 text-sm focus:outline-none focus:border-[#1754cf] focus:ring-1 focus:ring-[#1754cf]/40 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              BDT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Average price for similar jobs: ৳2,500 – ৳5,000
          </p>
        </div>

        {/* Preferred Schedule */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <i className="fas fa-calendar-days text-[#1754cf] text-sm" />
            <span className="text-sm font-semibold text-white">Preferred Schedule</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                name="date"
                type="date"
                min={getTodayDate()}
                value={form.date || ''}
                onChange={handleChange}
                className="w-full bg-[#0e1627] border border-[#1e3054] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1754cf] focus:ring-1 focus:ring-[#1754cf]/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">
                Preferred Time
              </label>
              <input
                name="time"
                type="time"
                min={form.date === getTodayDate() ? getCurrentTime() : '00:00'}
                value={form.time || ''}
                onChange={handleChange}
                className="w-full bg-[#0e1627] border border-[#1e3054] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1754cf] focus:ring-1 focus:ring-[#1754cf]/40 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Job Expiration */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <i className="fas fa-hourglass-half text-[#1754cf] text-sm" />
            <span className="text-sm font-semibold text-white">
              Job Expiration{' '}
              <span className="text-slate-500 font-normal">(Optional)</span>
            </span>
          </div>
          <input
            name="expiresAt"
            type="date"
            min={getTodayDate()}
            value={form.expiresAt || ''}
            onChange={handleChange}
            className="w-full bg-[#0e1627] border border-[#1e3054] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1754cf] focus:ring-1 focus:ring-[#1754cf]/40 transition-colors"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            When should this job post automatically close?
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={prevStep}
            className="flex items-center gap-2 text-slate-400 text-sm hover:text-white transition-colors"
          >
            <FaArrowLeft size={11} />
            Back
          </button>
          <button
            onClick={nextStep}
            className="flex items-center gap-2 bg-[#1754cf] hover:bg-blue-600 text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
          >
            Next: Location
            <FaArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
