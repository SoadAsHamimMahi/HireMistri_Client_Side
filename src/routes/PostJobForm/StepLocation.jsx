import { useEffect } from 'react';
import { FaArrowRight, FaArrowLeft, FaLightbulb, FaMapMarkerAlt, FaBuilding, FaRoad } from 'react-icons/fa';
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
      () => { }
    );
  }, [form.locationGeo, form.locationText, form.location, setForm]);

  const canContinue = Boolean(form.locationGeo || (form.locationText || form.location || '').trim());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full mx-auto items-start">
      {/* Left panel */}
      <div className="space-y-8">
        <div>
          <p className="text-xs font-black text-[#0a58ca] uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
            <span className="w-10 h-0.5 bg-[#0a58ca]"></span>
            Step 4 of 5
          </p>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-6">
            Pin the <span className="text-[#0a58ca]">exact spot</span>
          </h2>
          <p className="text-gray-500 leading-relaxed font-medium">
            Helping our Mistris find you easily leads to more accurate quotes and 
            faster travel. Be as precise as possible with the map and address details.
          </p>
        </div>

        {/* Tips */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#0a58ca] shadow-sm">
              <FaLightbulb size={14} />
            </div>
            <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Accuracy Tips</span>
          </div>
          <ul className="space-y-4">
            {[
              'Use landmarks like nearby schools or malls',
              'Include your House, Flat, or Block number',
              'Adjust the map pin for exact entry gate',
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
        {/* Location picker */}
        <div className="space-y-4">
          <label className="block text-xs font-black text-gray-900 uppercase tracking-widest px-1">
            Job Location
          </label>
          <div className="bg-gray-50 border border-transparent group-focus-within:bg-white group-focus-within:border-[#0a58ca] rounded-2xl p-2 transition-all group relative">
            <div className="absolute left-6 top-6 text-[#0a58ca] z-10 pointer-events-none">
              <FaMapMarkerAlt size={16} />
            </div>
            <div className="relative z-0">
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
                    floorHouseNo:
                      String(prev.floorHouseNo || '').trim().length > 0
                        ? prev.floorHouseNo
                        : (loc?.floorHouseNo ?? prev.floorHouseNo),
                    landmark:
                      String(prev.landmark || '').trim().length > 0 ? prev.landmark : (loc?.landmark ?? prev.landmark),
                  }))
                }
                placeholder="Find city or area in Dhaka..."
              />
            </div>
          </div>
        </div>

        {/* Floor/House No. + Landmark side by side */}
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-900 uppercase tracking-widest px-1">
              Floor / House No
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0a58ca] transition-colors pointer-events-none">
                <FaBuilding size={14} />
              </span>
              <input
                type="text"
                name="floorHouseNo"
                value={form.floorHouseNo || ''}
                onChange={handleChange}
                placeholder="e.g. 402, Block B"
                className="w-full bg-gray-50 border border-transparent text-gray-900 rounded-2xl pl-12 pr-4 py-4 text-base font-bold focus:outline-none focus:bg-white focus:border-[#0a58ca] focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-900 uppercase tracking-widest px-1">
              Landmark <span className="font-medium text-gray-900 italic">(Optional)</span>
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0a58ca] transition-colors pointer-events-none">
                <FaRoad size={14} />
              </span>
              <input
                type="text"
                name="landmark"
                value={form.landmark || ''}
                onChange={handleChange}
                placeholder="e.g. Near HDFC Bank"
                className="w-full bg-gray-50 border border-transparent text-gray-900 rounded-2xl pl-12 pr-4 py-4 text-base font-bold focus:outline-none focus:bg-white focus:border-[#0a58ca] focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
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
            disabled={!canContinue}
            className="flex items-center gap-3 bg-[#0a58ca] hover:bg-[#084298] disabled:bg-gray-100 disabled:text-gray-300 text-white font-black rounded-2xl px-10 py-4 text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Next: Review
            <FaArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
