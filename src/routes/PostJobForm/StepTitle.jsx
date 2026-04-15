import { FaArrowRight, FaLightbulb } from 'react-icons/fa';

const TITLE_MAX_LENGTH = 80;
const MIN_WORDS = 10;

const POPULAR_EXAMPLES = [
  'AC Installation for 1.5 Ton split unit in Uttara',
  'Kitchen plumbing repair and tap replacement',
  'Interior wall painting for 2000 sq ft flat',
  'CCTV Camera setup for small retail shop',
];

export default function StepTitle({ form, setForm, nextStep }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'title' && value.length > TITLE_MAX_LENGTH) return;
    setForm({ ...form, [name]: value });
  };

  const wordCount = form.description?.trim().split(/\s+/).filter(Boolean).length || 0;
  const isDescriptionValid = wordCount >= MIN_WORDS;
  const titleLen = (form.title || '').length;
  const isTitleValid = titleLen > 0 && titleLen <= TITLE_MAX_LENGTH;
  const isDisabled = !isTitleValid || !isDescriptionValid;

  return (
    <div className="space-y-12 w-full mx-auto">
      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left panel */}
        <div className="space-y-8">
          <div>
            <p className="text-xs font-black text-[#0a58ca] uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
              <span className="w-10 h-0.5 bg-[#0a58ca]"></span>
              Step 1 of 5
            </p>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-6">
              Let's start with a <span className="text-[#0a58ca]">strong title</span>
            </h2>
            <p className="text-gray-500 leading-relaxed font-medium">
              This helps your job post stand out to the right mistris.
              It's the first thing they'll see, so make it clear and descriptive.
            </p>
          </div>

          {/* Pro Tips */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#0a58ca] shadow-sm">
                <FaLightbulb size={14} />
              </div>
              <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Pro Tips</span>
            </div>
            <ul className="space-y-4">
              {[
                'Specify the core skill needed',
                'Mention the scope of work',
                'Avoid generic words like "Need help"',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0a58ca] mt-2 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right panel - Form */}
        <div className="bg-white rounded-[2rem] p-8 lg:p-10 border border-gray-100 shadow-xl shadow-blue-500/[0.03] space-y-8">
          {/* Title input */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-900 uppercase tracking-widest px-1">
              Job post title
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0a58ca] transition-colors">
                <i className="fas fa-pen-nib text-sm" />
              </span>
              <input
                type="text"
                name="title"
                value={form.title || ''}
                onChange={handleChange}
                maxLength={TITLE_MAX_LENGTH}
                placeholder="e.g. Master Electrician for apartment setup"
                className="w-full bg-gray-50 border border-transparent text-gray-900 placeholder-gray-400 rounded-2xl pl-12 pr-20 py-4 text-base font-bold focus:outline-none focus:bg-white focus:border-[#0a58ca] focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-900 tabular-nums">
                {titleLen} / {TITLE_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Description textarea */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-900 uppercase tracking-widest px-1">
              Job description
            </label>
            <div className="relative group">
              <textarea
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                placeholder="Details about materials, requirements, constraints..."
                rows={6}
                className="w-full bg-gray-50 border border-transparent text-gray-900 placeholder-gray-400 rounded-3xl px-5 py-5 text-sm font-medium focus:outline-none focus:bg-white focus:border-[#0a58ca] focus:ring-4 focus:ring-blue-500/5 resize-none transition-all leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-xs text-gray-900 font-bold flex items-center gap-1.5 italic">
                  <i className="fas fa-info-circle text-[#0a58ca]" />
                  Minimum 10 words recommended
                </span>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    isDescriptionValid ? 'text-emerald-500' : wordCount > 0 ? 'text-amber-500' : 'text-gray-300'
                  }`}
                >
                  {wordCount} words
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <button
              className="px-6 py-3 text-xs font-black text-gray-300 uppercase tracking-widest cursor-not-allowed transition-colors"
                disabled
            >
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={isDisabled}
              className="flex items-center gap-3 bg-[#0a58ca] hover:bg-[#084298] disabled:bg-gray-100 disabled:text-gray-300 text-white font-black rounded-2xl px-10 py-4 text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Next Step
              <FaArrowRight size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* Popular Examples - full width */}
      <div className="pt-12 border-t border-gray-100">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-8 text-center">Popular Examples in Dhaka</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {POPULAR_EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setForm({ ...form, title: ex })}
              className="bg-white border border-gray-100 hover:border-[#0a58ca] hover:shadow-lg hover:shadow-blue-500/[0.03] rounded-2xl p-4 text-xs text-gray-600 font-bold text-left transition-all group relative overflow-hidden h-full"
            >
              <div className="absolute top-0 right-0 w-8 h-8 bg-blue-50 rounded-bl-2xl flex items-center justify-center text-[#0a58ca] opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fas fa-plus text-[10px]" />
              </div>
              <span className="line-clamp-2 pr-4">{ex}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
