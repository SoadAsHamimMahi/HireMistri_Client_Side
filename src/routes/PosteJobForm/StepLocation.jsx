import { useEffect } from 'react';
import { FaMapMarkerAlt, FaArrowRight, FaArrowLeft, FaCrosshairs } from 'react-icons/fa';
import { LocationPicker } from '../../components/maps';

export default function StepLocation({ form, setForm, nextStep, prevStep }) {
  useEffect(() => {
    if ((form.locationGeo || form.locationText) || !('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setForm((prev) => ({
          ...prev,
          locationGeo: { lat: latitude, lng: longitude },
          locationText: prev.locationText || prev.location || '',
        }));
      },
      () => {}
    );
  }, [form.locationGeo, form.locationText, form.location, setForm]);

  const canContinue = Boolean(form.locationGeo || (form.locationText || form.location || '').trim());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card bg-base-200 shadow-sm border border-base-300">
        <div className="card-body p-6 lg:p-8 space-y-6">
          <div>
            <p className="text-sm font-medium text-base-content opacity-60 mb-2">Step 5 of 6</p>
            <h2 className="text-3xl lg:text-4xl font-bold leading-snug text-base-content mb-4">
              Set Exact Location
            </h2>
            <p className="text-base-content opacity-70 leading-relaxed">
              Search your full address or pin your exact place on the map so workers can navigate easily.
            </p>
          </div>

          <div className="bg-base-100 rounded-lg p-4 border border-base-300">
            <p className="text-sm font-semibold text-base-content mb-2">Tips for exact address:</p>
            <ul className="text-sm text-base-content opacity-70 space-y-1 list-disc list-inside">
              <li>Type house/road number, then choose a suggestion</li>
              <li>If needed, drag marker to exact gate/building</li>
              <li>Use landmark text if map cannot find your house number</li>
            </ul>
          </div>

          <button className="btn btn-outline w-32" onClick={prevStep}>
            <FaArrowLeft className="mr-2" />
            Back
          </button>
        </div>
      </div>

      <div className="card bg-base-200 shadow-sm border border-base-300">
        <div className="card-body p-6 lg:p-8 space-y-5">
          <div className="bg-base-100 rounded-lg p-4 border border-base-300">
            <div className="flex items-center gap-2 mb-3">
              <FaMapMarkerAlt className="text-base-content opacity-70" />
              <h3 className="font-semibold text-base-content">Job Location</h3>
            </div>
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
              placeholder="e.g. House 12, Road 3, Dhanmondi, Dhaka"
            />
            <div className="mt-2 flex items-start gap-2 text-xs text-base-content/60">
              <FaCrosshairs className="mt-0.5" />
              <p>Press Enter after typing an address to auto-pin it, then fine-tune using marker drag.</p>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-base-300">
            <button onClick={nextStep} className="btn btn-primary btn-lg" disabled={!canContinue}>
              Next: Review
              <FaArrowRight className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
