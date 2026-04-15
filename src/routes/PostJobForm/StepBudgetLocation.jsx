import { FaArrowRight, FaArrowLeft, FaLightbulb, FaMoneyBillWave, FaClock, FaCalendarAlt } from 'react-icons/fa';

export default function StepBudgetLocation({ form, setForm, nextStep, prevStep }) {
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full mx-auto items-start">
      {/* Left panel */}
      <div className="space-y-8">
        <div>
          <p className="text-xs font-black text-[#0a58ca] uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
            <span className="w-10 h-0.5 bg-[#0a58ca]"></span>
            Step 3 of 5
          </p>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-6">
            Set your <span className="text-[#0a58ca]">Budget</span> & <span className="text-[#0a58ca]">Schedule</span>
          </h2>
          <p className="text-gray-500 leading-relaxed font-medium">
            Define the financial range and timing for your project. This helps Mistris 
            provide accurate quotes and verify their availability for your schedule.
          </p>
        </div>

        {/* Pro Tip */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#0a58ca] shadow-sm">
              <FaLightbulb size={14} />
            </div>
            <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Pricing Tip</span>
          </div>
          <p className="text-sm text-gray-600 font-medium leading-relaxed">
            Mistris are 3x more likely to respond to posts with realistic budgets and clear timelines. 
            If you're unsure, check the average price guide below.
          </p>
        </div>

        <button
          onClick={prevStep}
          className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-[#0a58ca] transition-colors"
        >
          <FaArrowLeft size={10} />
          Go Back
        </button>
      </div>

      {/* Right panel */}
      <div className="bg-white rounded-[2rem] p-8 lg:p-10 border border-gray-100 shadow-xl shadow-blue-500/[0.03] space-y-10">
        {/* Estimated Budget */}
        <div className="space-y-4">
          <label className="block text-xs font-black text-gray-900 uppercase tracking-widest px-1">
            Expected Budget
          </label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0a58ca] font-black text-lg">
              ৳
            </span>
            <input
              name="budget"
              type="number"
              min="0"
              step="100"
              value={form.budget || ''}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full bg-gray-50 border border-transparent text-gray-900 placeholder-gray-300 rounded-2xl pl-10 pr-16 py-5 text-xl font-black focus:outline-none focus:bg-white focus:border-[#0a58ca] focus:ring-4 focus:ring-blue-500/5 transition-all tabular-nums"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-900 uppercase tracking-widest">
              BDT
            </span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100/50 rounded-xl p-3 flex items-center gap-3">
             <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-emerald-600 shadow-sm text-[10px]">
               <FaMoneyBillWave />
             </div>
             <p className="text-xs font-bold text-emerald-700">
              Average for similar jobs: <span className="font-black">৳2,500 – ৳5,000</span>
            </p>
          </div>
        </div>

        {/* Preferred Schedule */}
        <div className="space-y-4">
          <label className="block text-xs font-black text-gray-900 uppercase tracking-widest px-1">
            Preferred Schedule
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm font-black text-gray-900 uppercase block px-1">Start Date</span>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0a58ca] transition-colors pointer-events-none">
                  <FaCalendarAlt size={12} />
                </span>
                <input
                  name="date"
                  type="date"
                  min={getTodayDate()}
                  value={form.date || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-transparent text-gray-900 rounded-xl pl-10 pr-3 py-3 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#0a58ca] focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer"
                />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-black text-gray-900 uppercase block px-1">Preferred Time</span>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0a58ca] transition-colors pointer-events-none">
                  <FaClock size={12} />
                </span>
                <input
                  name="time"
                  type="time"
                  min={form.date === getTodayDate() ? getCurrentTime() : '00:00'}
                  value={form.time || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-transparent text-gray-900 rounded-xl pl-10 pr-3 py-3 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#0a58ca] focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Job Expiration */}
        <div className="space-y-4">
          <label className="block text-xs font-black text-gray-900 uppercase tracking-widest px-1">
            Job Expiration <span className="font-medium text-gray-900 italic">(Optional)</span>
          </label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0a58ca] transition-colors pointer-events-none">
              <i className="fas fa-hourglass-end text-sm" />
            </span>
            <input
              name="expiresAt"
              type="date"
              min={getTodayDate()}
              value={form.expiresAt || ''}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-transparent text-gray-900 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:bg-white focus:border-[#0a58ca] focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>
          <p className="text-xs text-gray-900 font-bold italic px-1">
            The job post will automatically close on this date if not filled.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={prevStep}
            className="px-6 py-3 text-xs font-black text-gray-300 uppercase tracking-widest hover:text-gray-600 transition-colors"
          >
            Back
          </button>
          <button
            onClick={nextStep}
            className="flex items-center gap-3 bg-[#0a58ca] hover:bg-[#084298] text-white font-black rounded-2xl px-10 py-4 text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Next: Location
            <FaArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
