import { FaEdit, FaFileAlt, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

export default function StepTitle({ form, setForm, nextStep }) {
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const wordCount = form.description?.trim().split(/\s+/).filter(Boolean).length || 0;
  const minWords = 20;
  const isDescriptionValid = wordCount >= minWords;
  const isDisabled = !form.title?.trim() || !isDescriptionValid;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Section - Instructions */}
      <div className="card bg-base-200 shadow-sm border border-base-300">
        <div className="card-body p-6 lg:p-8 space-y-6">
          <div>
            <p className="text-sm font-medium text-base-content opacity-60 mb-2">Step 1 of 5</p>
            <h2 className="text-3xl lg:text-4xl font-bold leading-snug text-base-content mb-4">
              Let's start with a strong title.
            </h2>
            <p className="text-base-content opacity-70 leading-relaxed">
              This helps your job post stand out to the right candidates.
              It's the first thing they'll see, so make it count!
            </p>
          </div>

          {/* Tips Section */}
          <div className="bg-base-100 rounded-lg p-4 border border-base-300">
            <p className="text-sm font-semibold text-base-content mb-2">💡 Tips for a great title:</p>
            <ul className="text-sm text-base-content opacity-70 space-y-1 list-disc list-inside">
              <li>Be specific about what you need</li>
              <li>Include key skills or technologies</li>
              <li>Keep it concise and clear</li>
            </ul>
          </div>

          <button className="btn btn-outline w-32" disabled>
            <FaArrowLeft className="mr-2" />
            Back
          </button>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="card bg-base-200 shadow-sm border border-base-300">
        <div className="card-body p-6 lg:p-8 space-y-6">
          {/* Title input */}
          <div className="space-y-2">
            <label className="block font-semibold text-base-content opacity-80">
              Write a title for your job post
            </label>
            <div className="relative">
              <span className="absolute top-3.5 left-3 text-base-content opacity-50">
                <FaEdit />
              </span>
              <input
                type="text"
                name="title"
                value={form.title || ''}
                onChange={handleChange}
                placeholder="e.g. Responsive website development using MERN Stack"
                className="input input-bordered w-full pl-10 bg-base-100 border-base-300 focus:ring-2 focus:ring-primary"
              />
            </div>
            {form.title && (
              <p className="text-xs text-base-content opacity-60">
                {form.title.length} characters
              </p>
            )}
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <label className="block font-semibold text-base-content opacity-80">
              Job Description
            </label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-base-content opacity-50">
                <FaFileAlt />
              </span>
              <textarea
                name="description"
                value={form.description || ''}
                onChange={handleChange}
                placeholder="Describe what needs to be done, requirements, timeline, and any other important details..."
                className="textarea textarea-bordered w-full h-32 pl-10 bg-base-100 border-base-300 focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-base-content opacity-60">
                Minimum {minWords} words required
              </p>
              <p
                className={`text-xs font-medium ${
                  isDescriptionValid
                    ? 'text-success'
                    : wordCount > 0
                    ? 'text-warning'
                    : 'text-base-content opacity-60'
                }`}
              >
                {wordCount} / {minWords} words
              </p>
            </div>
          </div>

          {/* Examples */}
          <div className="bg-base-100 rounded-lg p-4 border border-base-300">
            <p className="font-semibold text-sm text-base-content opacity-80 mb-2">
              Example titles:
            </p>
            <ul className="text-sm space-y-1.5 text-base-content opacity-70">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span><strong>Build responsive WordPress site</strong> with booking/payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>AR experience needed for product demo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Developer needed to update Android UI</span>
              </li>
            </ul>
          </div>

          {/* Navigation Button */}
          <div className="flex justify-end pt-4 border-t border-base-300">
            <button
              onClick={nextStep}
              disabled={isDisabled}
              className="btn btn-primary btn-lg"
            >
              Next: Skills
              <FaArrowRight className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
