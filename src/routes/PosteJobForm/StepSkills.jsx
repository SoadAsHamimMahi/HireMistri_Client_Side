import { useState } from 'react';
import { FaTags, FaSearch, FaPlus, FaTimes, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

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
    'Carpenter',
    'Mason',
    'Painter',
  ];

  const addSkill = (skill) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !form.skills?.includes(trimmedSkill)) {
      setForm({ ...form, skills: [...(form.skills || []), trimmedSkill] });
    }
    setInput('');
  };

  const removeSkill = (skill) => {
    setForm({
      ...form,
      skills: (form.skills || []).filter((s) => s !== skill),
    });
  };

  const skills = form.skills || [];
  const isDisabled = skills.length < 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Section - Instructions */}
      <div className="card bg-base-200 shadow-sm border border-base-300">
        <div className="card-body p-6 lg:p-8 space-y-6">
          <div>
            <p className="text-sm font-medium text-base-content opacity-60 mb-2">Step 2 of 5</p>
            <h2 className="text-3xl lg:text-4xl font-bold leading-snug text-base-content mb-4">
              What are the main skills required for your work?
            </h2>
            <p className="text-base-content opacity-70 leading-relaxed">
              For the best results, add 3–5 relevant skills that define the task.
            </p>
          </div>

          {/* Tips Section */}
          <div className="bg-base-100 rounded-lg p-4 border border-base-300">
            <p className="text-sm font-semibold text-base-content mb-2">💡 Why skills matter:</p>
            <ul className="text-sm text-base-content opacity-70 space-y-1 list-disc list-inside">
              <li>Help workers find your job faster</li>
              <li>Match with the right candidates</li>
              <li>Set clear expectations</li>
            </ul>
          </div>

          <button className="btn btn-outline w-32" onClick={prevStep}>
            <FaArrowLeft className="mr-2" />
            Back
          </button>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="card bg-base-200 shadow-sm border border-base-300">
        <div className="card-body p-6 lg:p-8 space-y-6">
          {/* Input Section */}
          <div className="space-y-2">
            <label className="block font-semibold text-base-content opacity-80">
              Search skills or add your own
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute top-3.5 left-3 text-base-content opacity-50">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(input);
                    }
                  }}
                  placeholder="e.g. Plumber, Wiring, Installation..."
                  className="input input-bordered w-full pl-10 bg-base-100 border-base-300 focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => addSkill(input)}
                disabled={!input.trim()}
              >
                <FaPlus className="mr-1" />
                Add
              </button>
            </div>
            <p className="text-xs text-base-content opacity-60">
              Press Enter to add a skill
            </p>
          </div>

          {/* Selected Skills */}
          {skills.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-base-content opacity-80">
                  Selected Skills ({skills.length})
                </label>
                {skills.length >= 3 && (
                  <span className="badge badge-success badge-sm">
                    Great! {skills.length} skills added
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 p-3 bg-base-100 rounded-lg border border-base-300 min-h-[60px]">
                {skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="badge badge-primary badge-lg gap-2 px-3 py-2.5"
                  >
                    <FaTags className="text-xs" />
                    <span>{skill}</span>
                    <button
                      type="button"
                      className="ml-1 hover:bg-primary-focus rounded-full p-0.5 transition-colors"
                      onClick={() => removeSkill(skill)}
                      aria-label={`Remove ${skill}`}
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Skills */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FaTags className="text-primary" />
              <p className="font-semibold text-base-content opacity-80">
                Popular skills for home services:
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularSkills.map((s, i) => {
                const isSelected = skills.includes(s);
                return (
                  <button
                    key={i}
                    type="button"
                    className={`btn btn-sm ${
                      isSelected
                        ? 'btn-primary'
                        : 'btn-outline hover:btn-primary'
                    }`}
                    onClick={() => (isSelected ? removeSkill(s) : addSkill(s))}
                  >
                    {isSelected && <FaTimes className="mr-1 text-xs" />}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Button */}
          <div className="flex justify-end pt-4 border-t border-base-300">
            <button
              onClick={nextStep}
              disabled={isDisabled}
              className="btn btn-primary btn-lg"
            >
              Next: Scope
              <FaArrowRight className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
