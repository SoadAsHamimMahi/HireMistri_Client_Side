import { useTheme } from '../../contexts/ThemeContext';

export default function StepTitle({ form, setForm, nextStep }) {
  const { isDarkMode } = useTheme();
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


    const wordCount = form.description.trim().split(/\s+/).filter(Boolean).length;

  const isDisabled = !form.title.trim() || wordCount < 20;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left Section */}
      <div className="space-y-6">
        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>1/5 Job post</p>
        <h2 className={`text-4xl font-bold leading-snug ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Let's start with a strong title.
        </h2>
        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
          This helps your job post stand out to the right candidates.
          It's the first thing they'll see, so make it count!
        </p>
        <button className={`btn btn-outline w-28 ${isDarkMode ? 'text-white border-white hover:bg-white hover:text-gray-900' : ''}`} disabled>
          Back
        </button>
      </div>

      {/* Right Section */}
      <div className="space-y-6">
        {/* Title input */}
        <label className={`block font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Write a title for your job post
        </label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Responsive website development using MERN Stack"
          className={`input input-bordered w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
        />

        {/* Description input */}
        <label className={`block font-semibold mb-2 mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Job Description
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe what needs to be done..."
          className={`textarea textarea-bordered w-full h-32 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
        />

        {/* Examples */}
        <div className="space-y-2">
          <p className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Example titles</p>
          <ul className={`list-disc list-inside text-sm space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <li><strong>Build responsive WordPress site</strong> with booking/payment</li>
            <li>AR experience needed for product demo</li>
            <li>Developer needed to update Android UI</li>
          </ul>
        </div>

        {/* NEXT button */}
        <button
          onClick={nextStep}
          disabled={isDisabled}
          className={`btn w-32 mt-6 ${
            isDisabled
              ? isDarkMode 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          Next: Skills
        </button>
      </div>
    </div>
  );
}
