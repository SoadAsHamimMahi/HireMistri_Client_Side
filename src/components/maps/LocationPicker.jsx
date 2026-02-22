import { useState, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete, Marker } from './googleMapsShim';

const DEFAULT_CENTER = { lat: 23.8103, lng: 90.4125 };
const MAP_CONTAINER_STYLE = { width: '100%', height: '280px', borderRadius: '0.5rem' };

export default function LocationPicker({ value = '', locationGeo, onChange, placeholder = 'Search or pick on map...', className = '' }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded } = useJsApiLoader({ id: 'location-picker', googleMapsApiKey: apiKey, libraries: ['places'] });
  const [center, setCenter] = useState(locationGeo ? { lat: locationGeo.lat, lng: locationGeo.lng } : DEFAULT_CENTER);
  const [markerPosition, setMarkerPosition] = useState(locationGeo ? { lat: locationGeo.lat, lng: locationGeo.lng } : null);
  const [addressText, setAddressText] = useState(value || '');
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);

  const getAddressComponent = useCallback((components = [], type) => {
    const found = components.find((c) => Array.isArray(c.types) && c.types.includes(type));
    return found?.long_name || '';
  }, []);

  const buildBestAddress = useCallback((placeOrResult) => {
    if (!placeOrResult) return '';
    const components = placeOrResult.address_components || [];
    const streetNumber =
      getAddressComponent(components, 'street_number') ||
      getAddressComponent(components, 'premise') ||
      getAddressComponent(components, 'subpremise');
    const route = getAddressComponent(components, 'route');
    const sublocality =
      getAddressComponent(components, 'sublocality_level_1') ||
      getAddressComponent(components, 'sublocality') ||
      getAddressComponent(components, 'neighborhood');
    const locality =
      getAddressComponent(components, 'locality') ||
      getAddressComponent(components, 'administrative_area_level_2') ||
      getAddressComponent(components, 'administrative_area_level_1');
    const postalCode = getAddressComponent(components, 'postal_code');
    const country = getAddressComponent(components, 'country');

    const line1 = [streetNumber, route].filter(Boolean).join(' ').trim();
    const line2 = [sublocality, locality].filter(Boolean).join(', ').trim();
    const line3 = [postalCode, country].filter(Boolean).join(', ').trim();
    const rebuilt = [line1, line2, line3].filter(Boolean).join(', ').trim();
    return rebuilt || placeOrResult.formatted_address || placeOrResult.name || '';
  }, [getAddressComponent]);

  const pickMostSpecificResult = useCallback((results = []) => {
    if (!results.length) return null;
    return (
      results.find((r) => r.types?.includes('street_address')) ||
      results.find((r) => r.types?.includes('premise')) ||
      results.find((r) => r.types?.includes('subpremise')) ||
      results.find((r) => r.types?.includes('route')) ||
      results[0]
    );
  }, []);

  const reverseGeocode = useCallback((lat, lng) => {
    if (!window.google || !geocoderRef.current) return;
    const geocoder = geocoderRef.current;
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      const best = pickMostSpecificResult(results || []);
      if (status === 'OK' && best) {
        const addr = buildBestAddress(best);
        setAddressText(addr);
        onChange?.({ locationText: addr, locationGeo: { lat, lng }, placeId: best.place_id || null });
      } else {
        const shortAddr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setAddressText(shortAddr);
        onChange?.({ locationText: shortAddr, locationGeo: { lat, lng }, placeId: null });
      }
    });
  }, [onChange, buildBestAddress, pickMostSpecificResult]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    geocoderRef.current = new window.google.maps.Geocoder();
    if (markerPosition) {
      setCenter(markerPosition);
    }
  }, [markerPosition]);

  const onPlaceSelect = useCallback(() => {
    const place = autocompleteRef.current?.getPlace?.();
    if (!place?.geometry?.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const pos = { lat, lng };
    setCenter(pos);
    setMarkerPosition(pos);
    const addr = buildBestAddress(place);
    setAddressText(addr);
    onChange?.({ locationText: addr, locationGeo: { lat, lng }, placeId: place.place_id || null });
  }, [onChange, buildBestAddress]);

  const geocodeTypedAddress = useCallback(() => {
    const query = (addressText || '').trim();
    if (!query || !window.google || !geocoderRef.current) return;
    geocoderRef.current.geocode({ address: query }, (results, status) => {
      const best = pickMostSpecificResult(results || []);
      if (status !== 'OK' || !best?.geometry?.location) return;
      const lat = best.geometry.location.lat();
      const lng = best.geometry.location.lng();
      const addr = buildBestAddress(best);
      setCenter({ lat, lng });
      setMarkerPosition({ lat, lng });
      setAddressText(addr);
      onChange?.({ locationText: addr, locationGeo: { lat, lng }, placeId: best.place_id || null });
    });
  }, [addressText, onChange, buildBestAddress, pickMostSpecificResult]);

  const onMarkerDragEnd = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });
    setCenter({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });
    setCenter({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  if (!apiKey) {
    return (
      <div className="form-control">
        <label className="label"><span className="label-text">Location</span></label>
        <input type="text" className={`input input-bordered ${className}`} value={value} onChange={(e) => onChange?.({ locationText: e.target.value, locationGeo: null, placeId: null })} placeholder={placeholder} />
        <p className="text-sm text-base-content/60 mt-1">Set VITE_GOOGLE_MAPS_API_KEY for map picker.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="form-control">
        <label className="label"><span className="label-text">Location</span></label>
        <div className="h-[280px] rounded-lg bg-base-300 animate-pulse flex items-center justify-center">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="form-control space-y-2">
      <label className="label"><span className="label-text">Location</span></label>
      <Autocomplete onLoad={(ac) => { autocompleteRef.current = ac; }} onPlaceChanged={onPlaceSelect}>
        <input
          type="text"
          className={`input input-bordered w-full ${className}`}
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          onBlur={geocodeTypedAddress}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              geocodeTypedAddress();
            }
          }}
          placeholder={placeholder}
        />
      </Autocomplete>
      <p className="text-xs text-base-content/60">Search above or click/drag marker on map.</p>
      <div className="rounded-xl border border-base-300 overflow-hidden shadow-sm">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={center}
          zoom={14}
          onLoad={onMapLoad}
          onClick={onMapClick}
          options={{ streetViewControl: false, mapTypeControl: true, fullscreenControl: true }}
        >
          {markerPosition && (
            <Marker position={markerPosition} draggable onDragEnd={onMarkerDragEnd} />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
