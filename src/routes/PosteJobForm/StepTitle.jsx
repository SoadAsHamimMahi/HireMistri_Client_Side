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
    <div className="space-y-8">
      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left panel */}
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold text-[#1754cf] uppercase tracking-widest mb-3">STEP 1 OF 5</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
              Let's start with a strong title
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              This helps your job post stand out to the right mistris (professionals).
              It's the first thing they'll see, so make it count!
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
                'Specify the core skill (e.g., Electrician, Plumber, Mason)',
                'Mention the scope (e.g., Full bathroom renovation)',
                'Avoid using all caps or generic words like "Need help"',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1754cf] mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <button
            className="flex items-center gap-2 text-slate-500 text-sm cursor-not-allowed select-none"
            disabled
          >
            Back
          </button>
        </div>

        {/* Right panel - Form */}
        <div className="space-y-5">
          {/* Title input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Write a title for your job post
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                <i className="fas fa-pen" />
              </span>
              <input
                type="text"
                name="title"
                value={form.title || ''}
                onChange={handleChange}
                maxLength={TITLE_MAX_LENGTH}
                placeholder="e.g. Master Electrician needed for 3-bedroom apartment"
                className="w-full bg-[#0e1627] border border-[#1e3054] text-white placeholder-slate-600 rounded-xl pl-9 pr-24 py-3 text-sm focus:outline-none focus:border-[#1754cf] focus:ring-1 focus:ring-[#1754cf]/40 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                {titleLen} / {TITLE_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Description textarea */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Describe what needs to be done
            </label>
            <textarea
              name="description"
              value={form.description || ''}
              onChange={handleChange}
              placeholder="Mention specific requirements, materials needed, and any constraints..."
              rows={5}
              className="w-full bg-[#0e1627] border border-[#1e3054] text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1754cf] focus:ring-1 focus:ring-[#1754cf]/40 resize-none transition-colors"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <i className="fas fa-circle-info" />
                Minimum 10 words recommended
              </span>
              <span
                className={`text-xs font-medium ${
                  isDescriptionValid ? 'text-green-400' : wordCount > 0 ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                {wordCount} words
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              className="text-slate-600 text-sm cursor-not-allowed select-none"
              disabled
            >
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={isDisabled}
              className="flex items-center gap-2 bg-[#1754cf] hover:bg-blue-600 disabled:bg-[#1754cf]/30 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
            >
              Next: Scope
              <FaArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Popular Examples in Dhaka - full width */}
      <div className="border-t border-[#1e3054] pt-6">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Popular Examples in Dhaka</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {POPULAR_EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setForm({ ...form, title: ex })}
              className="bg-[#111e34] border border-[#1e3054] hover:border-[#1754cf]/50 rounded-xl p-3 text-sm text-slate-300 text-left transition-colors"
            >
              &ldquo;{ex}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
