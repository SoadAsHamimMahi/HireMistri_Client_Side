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
  { value: 'Low', label: 'Standard', sub: 'Within a week' },
  { value: 'Medium', label: 'Urgent', sub: '1–2 days' },
  { value: 'High', label: 'Emergency', sub: 'Immediate' },
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left panel */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
            Define the scope of your work
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Provide details about the job to help us find the right professional for you.
            Clear requirements lead to better quotes and faster hiring.
          </p>
        </div>

        {/* Pro Tips */}
        <div className="bg-[#111e34] border border-[#1e3054] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaLightbulb className="text-[#1754cf]" size={14} />
            <span className="text-sm font-semibold text-white">Pro Tips</span>
          </div>
          <ul className="space-y-2.5">
            {[
              'Be specific about the number of workers.',
              'Urgent jobs are prioritized in our matching.',
              'Describe any specific tools required.',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1754cf] mt-1.5 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
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
      <div className="space-y-5">
        {/* Job Category */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Job Category
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              <i className="fas fa-user-tie" />
            </span>
            <select
              name="category"
              value={form.category || ''}
              onChange={handleChange}
              className="w-full bg-[#0e1627] border border-[#1e3054] text-white rounded-xl pl-9 pr-9 py-3 text-sm focus:outline-none focus:border-[#1754cf] focus:ring-1 focus:ring-[#1754cf]/40 appearance-none transition-colors"
            >
              <option disabled value="">Select a professional</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              <FaChevronDown size={11} />
            </span>
          </div>
        </div>

        {/* Duration + Workers side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Estimated Duration
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                <i className="fas fa-clock" />
              </span>
              <input
                type="text"
                name="duration"
                value={form.duration || ''}
                onChange={handleChange}
                placeholder="e.g. 3 days"
                className="w-full bg-[#0e1627] border border-[#1e3054] text-white placeholder-slate-600 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-[#1754cf] focus:ring-1 focus:ring-[#1754cf]/40 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Workers Needed
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                <i className="fas fa-users" />
              </span>
              <input
                type="number"
                name="workersNeeded"
                min="1"
                value={form.workersNeeded || ''}
                onChange={handleChange}
                placeholder="1"
                className="w-full bg-[#0e1627] border border-[#1e3054] text-white placeholder-slate-600 rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-[#1754cf] focus:ring-1 focus:ring-[#1754cf]/40 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Urgency Level — button cards */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <i className="fas fa-flag mr-1.5" />
            Urgency Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {URGENCY_OPTIONS.map((opt) => {
              const isActive = form.urgency === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, urgency: opt.value })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'border-[#1754cf] bg-[#1754cf]/10 text-white'
                      : 'border-[#1e3054] bg-[#0e1627] text-slate-400 hover:border-[#1754cf]/50 hover:text-slate-200'
                  }`}
                >
                  <div className="text-sm font-semibold">{opt.label}</div>
                  <div className="text-xs mt-0.5 opacity-70">{opt.sub}</div>
                </button>
              );
            })}
          </div>
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
            disabled={isDisabled}
            className="flex items-center gap-2 bg-[#1754cf] hover:bg-blue-600 disabled:bg-[#1754cf]/30 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
          >
            Next: Budget
            <FaArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
