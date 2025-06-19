import { useState } from 'react';

export default function StepSkills({ form, setForm, nextStep, prevStep }) {
  const [input, setInput] = useState('');
  const popularSkills = [
    'Electrician',
    'Plumbing',
    'AC Repair',
    'Mechanic',
    'Tiling',
    'Welding',
    'Painting',
  ];

  const addSkill = (skill) => {
    if (skill && !form.skills.includes(skill)) {
      setForm({ ...form, skills: [...form.skills, skill] });
    }
    setInput('');
  };

  const removeSkill = (skill) => {
    setForm({
      ...form,
      skills: form.skills.filter((s) => s !== skill),
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Section */}
        <div className="space-y-6">
          <p className="text-sm text-gray-500 font-medium">2/5 Job post</p>
          <h2 className="text-3xl font-bold leading-snug text-gray-900">
            What are the main skills required for your work?
          </h2>
          <p className="text-gray-600">
            For the best results, add 3–5 relevant skills that define the task.
          </p>
          <button className="btn btn-outline w-28" onClick={prevStep}>
            Back
          </button>
        </div>

        {/* Right Section */}
        <div className="space-y-6">
          {/* Input */}
          <label className="block text-gray-700 font-semibold mb-2">
            Search skills or add your own
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill(input.trim());
                }
              }}
              placeholder="e.g. Plumber, Wiring..."
              className="input input-bordered w-full"
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => addSkill(input.trim())}
            >
              Add
            </button>
          </div>

          {/* Selected Skills */}
          <div className="flex flex-wrap gap-2">
            {form.skills.map((skill, idx) => (
              <span
                key={idx}
                className="badge badge-outline flex items-center gap-1 px-3 py-1"
              >
                {skill}
                <button
                  type="button"
                  className="text-red-500 ml-2"
                  onClick={() => removeSkill(skill)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          {/* Suggested Popular Skills */}
          <div>
            <p className="font-semibold mb-2 text-gray-700">
              Popular skills for home services:
            </p>
            <div className="flex flex-wrap gap-2">
              {popularSkills.map((s, i) => (
                <button
                  key={i}
                  className="btn btn-sm btn-outline"
                  onClick={() => addSkill(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={nextStep}
            className="btn bg-green-600 hover:bg-green-700 text-white w-32 mt-4"
            disabled={form.skills.length < 1}
          >
            Next: Scope
          </button>
        </div>
      </div>
    </div>
  );
}
