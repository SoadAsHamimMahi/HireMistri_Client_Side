import { useEffect } from 'react';
import { FaArrowRight, FaArrowLeft, FaLightbulb } from 'react-icons/fa';
import { LocationPicker } from '../../components/maps';

export default function StepLocation({ form, setForm, nextStep, prevStep }) {
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if ((form.locationGeo || form.locationText) || !('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          locationGeo: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          locationText: prev.locationText || prev.location || '',
        }));
      },
      () => {}
    );
  }, [form.locationGeo, form.locationText, form.location, setForm]);

  const canContinue = Boolean(form.locationGeo || (form.locationText || form.location || '').trim());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left panel */}
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
            Set Exact Location
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Pin the exact spot where the work needs to be done. This helps our
            Mistris find you easily and provide accurate travel estimates.
          </p>
        </div>

        {/* Tips */}
        <div className="bg-[#111e34] border border-[#1e3054] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaLightbulb className="text-[#1754cf]" size={14} />
            <span className="text-sm font-semibold text-white">Tips for better accuracy</span>
          </div>
          <ul className="space-y-2.5">
            {[
              'Use landmarks like nearby shops, schools, or parks.',
              'Mention house or apartment numbers clearly.',
              'Drag the map marker to the precise entry gate.',
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
        {/* Location picker */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <i className="fas fa-location-dot mr-1.5" />
            Job Location
          </label>
          <div className="bg-[#0e1627] border border-[#1e3054] rounded-xl p-3">
            <LocationPicker
              value={form.locationText || form.location || ''}
              locationGeo={form.locationGeo}
              onChange={(loc) =>
                setForm((prev) => ({
                  ...prev,
                  location: loc?.locationText ?? prev.location,
                  locationText: loc?.locationText ?? prev.locationText,
                  locationGeo: loc?.locationGeo ?? prev.locationGeo,
                  placeId: loc?.placeId ?? prev.placeId,
                }))
              }
              placeholder="e.g. Blue Orchid Residency, Block C"
            />
          </div>
        </div>

        {/* Floor/House No. + Landmark side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Floor / House No.
            </label>
            <input
              type="text"
              name="floorHouseNo"
              value={form.floorHouseNo || ''}
              onChange={handleChange}
              placeholder="e.g. 402, Block B"
              className="w-full bg-[#0e1627] border border-[#1e3054] text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1754cf] focus:ring-1 focus:ring-[#1754cf]/40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Landmark{' '}
              <span className="text-slate-500 normal-case font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              name="landmark"
              value={form.landmark || ''}
              onChange={handleChange}
              placeholder="e.g. Near HDFC Bank"
              className="w-full bg-[#0e1627] border border-[#1e3054] text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1754cf] focus:ring-1 focus:ring-[#1754cf]/40 transition-colors"
            />
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
            disabled={!canContinue}
            className="flex items-center gap-2 bg-[#1754cf] hover:bg-blue-600 disabled:bg-[#1754cf]/30 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors"
          >
            Next: Review
            <FaArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
