

export default function StepTitle({ form, setForm, nextStep }) {
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left Section */}
      <div className="space-y-6">
        <p className="text-sm text-gray-500 font-medium">1/5 Job post</p>
        <h2 className="text-4xl font-bold leading-snug text-gray-900">
          Let's start with a strong title.
        </h2>
        <p className="text-gray-600">
          This helps your job post stand out to the right candidates.
          It’s the first thing they’ll see, so make it count!
        </p>
        <button className="btn btn-outline w-28" disabled>
          Back
        </button>
      </div>

      {/* Right Section */}
      <div className="space-y-6">
        <label className="block text-gray-700 font-semibold mb-2">
          Write a title for your job post
        </label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Responsive website development using MERN Stack"
          className="input input-bordered w-full"
        />

        <div className="space-y-2">
          <p className="font-semibold text-gray-700">Example titles</p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li><strong>Build responsive WordPress site</strong> with booking/payment</li>
            <li>AR experience needed for product demo</li>
            <li>Developer needed to update Android UI</li>
          </ul>
        </div>

        <button
          onClick={nextStep}
          className="btn bg-green-600 hover:bg-green-700 text-white w-32 mt-6"
        >
          Next: Skills
        </button>
      </div>
    </div>
  );
}
