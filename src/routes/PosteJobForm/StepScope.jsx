import { FaArrowRight, FaArrowLeft, FaLightbulb, FaChevronDown } from 'react-icons/fa';

const CATEGORIES = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Mason',
  'AC Technician',
  'Mechanic',
  'Welder',
  'Technician',
  'Other',
];

const URGENCY_OPTIONS = [
  { value: 'Low', label: 'Standard', sub: 'Within a week', icon: 'fa-calendar-alt', color: 'bg-blue-50' },
  { value: 'Medium', label: 'Urgent', sub: '1–2 days', icon: 'fa-bolt', color: 'bg-orange-50' },
  { value: 'High', label: 'Emergency', sub: 'Immediate', icon: 'fa-exclamation-circle', color: 'bg-red-50' },
];

export default function StepScope({ form, setForm, nextStep, prevStep }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      setForm((prev) => {
        const next = { ...prev, category: value };
        const skills = Array.isArray(prev.skills) ? prev.skills : [];
        if (value && !skills.includes(value)) next.skills = [...skills, value];
        return next;
      });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const isDisabled = !form.category;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full mx-auto items-start">
      {/* Left panel */}
      <div className="space-y-8">
        <div>
          <p className="text-xs font-black text-[#0a58ca] uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
            <span className="w-10 h-0.5 bg-[#0a58ca]"></span>
            Step 2 of 5
          </p>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-6">
            Define the <span className="text-[#0a58ca]">scope</span> of work
          </h2>
          <p className="text-gray-500 leading-relaxed font-medium">
            Providing clear details about the job helps us match you with the right Mistri. 
            Select the professional category and set the urgency level.
          </p>
        </div>

        {/* Pro Tips */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#0a58ca] shadow-sm">
              <FaLightbulb size={14} />
            </div>
            <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Helpful Info</span>
          </div>
          <ul className="space-y-4">
            {[
              'Emergency jobs get prioritized matching',
              'Specify specific tools if needed in description',
              'Standardize the number of workers for safety',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0a58ca] mt-2 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
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
      <div className="bg-white rounded-[2rem] p-8 lg:p-10 border border-gray-100 shadow-xl shadow-blue-500/[0.03] space-y-8">
        {/* Job Category */}
        <div className="space-y-3">
          <label className="block text-xs font-black text-gray-900 uppercase tracking-widest px-1">
            Professional Category
          </label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0a58ca] transition-colors">
              <i className="fas fa-hammer text-sm" />
            </span>
            <select
              name="category"
              value={form.category || ''}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-transparent text-gray-900 rounded-2xl pl-12 pr-10 py-4 text-base font-bold focus:outline-none focus:bg-white focus:border-[#0a58ca] focus:ring-4 focus:ring-blue-500/5 appearance-none transition-all cursor-pointer"
            >
              <option disabled value="">Select the type of professional</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
              <FaChevronDown size={10} />
            </span>
          </div>
        </div>

        {/* Duration + Workers side by side */}
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-900 uppercase tracking-widest px-1">
              Estimated Duration
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0a58ca] transition-colors">
                <i className="fas fa-hourglass-half text-sm" />
              </span>
              <input
                type="text"
                name="duration"
                value={form.duration || ''}
                onChange={handleChange}
                placeholder="e.g. 2 days"
                className="w-full bg-gray-50 border border-transparent text-gray-900 rounded-2xl pl-12 pr-4 py-4 text-base font-bold focus:outline-none focus:bg-white focus:border-[#0a58ca] focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-900 uppercase tracking-widest px-1">
              Workers Needed
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0a58ca] transition-colors">
                <i className="fas fa-users-cog text-sm" />
              </span>
              <input
                type="number"
                name="workersNeeded"
                min="1"
                value={form.workersNeeded || ''}
                onChange={handleChange}
                placeholder="1"
                className="w-full bg-gray-50 border border-transparent text-gray-900 rounded-2xl pl-12 pr-4 py-4 text-base font-bold focus:outline-none focus:bg-white focus:border-[#0a58ca] focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Urgency Level — button cards */}
        <div className="space-y-4">
          <label className="block text-xs font-black text-gray-900 uppercase tracking-widest px-1">
            Urgency Level
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {URGENCY_OPTIONS.map((opt) => {
              const isActive = form.urgency === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, urgency: opt.value })}
                  className={`p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${
                    isActive
                      ? 'border-[#0a58ca] bg-blue-50/50 shadow-md shadow-blue-500/5 translate-y-[-2px]'
                      : 'border-gray-100 bg-white text-gray-400 hover:border-blue-100 hover:bg-gray-50'
                  }`}
                >
                  <div className={`mb-3 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? 'bg-[#0a58ca] text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 text-gray-300'
                  }`}>
                    <i className={`fas ${opt.icon} text-xs`} />
                  </div>
                  <div className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-[#0a58ca]' : 'text-gray-900'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs mt-1 font-bold opacity-60">
                    {opt.sub}
                  </div>
                </button>
              );
            })}
          </div>
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
            disabled={isDisabled}
            className="flex items-center gap-3 bg-[#0a58ca] hover:bg-[#084298] disabled:bg-gray-100 disabled:text-gray-300 text-white font-black rounded-2xl px-10 py-4 text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Next: Budget
            <FaArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
