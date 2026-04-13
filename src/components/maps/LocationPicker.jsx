import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from './googleMapsShim';

const DEFAULT_CENTER = { lat: 23.8103, lng: 90.4125 }; // Dhaka
const MAP_CONTAINER_STYLE = { width: '100%', height: '300px', borderRadius: '0.5rem' };
const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

async function nominatimReverse(lat, lng) {
  const res = await fetch(
    `${NOMINATIM_REVERSE}?lat=${lat}&lon=${lng}&format=json&addressdetails=1&namedetails=1&zoom=18`,
    { headers: { 'Accept-Language': 'en' } }
  );
  if (!res.ok) throw new Error('Reverse geocode failed');
  return res.json();
}

async function googlePlacesSearch(query, sessionToken) {
  if (!window.google?.maps?.places) return [];
  const service = new window.google.maps.places.AutocompleteService();
  return new Promise((resolve) => {
    service.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'bd' },
        sessionToken,
      },
      (predictions, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
          resolve([]);
          return;
        }
        resolve(predictions);
      }
    );
  });
}

function buildDisplayName(data) {
  if (!data) return '';
  const a = data.address || {};

  // Building / named place (e.g. "S. Ali Tower", "Al Modina Tower Mosque")
  const building =
    a.amenity || a.building || a.shop || a.office ||
    a.tourism || a.leisure || a.historic ||
    (data.type !== 'road' && data.name) || '';

  // House / plot number (e.g. "184/A")
  const houseNumber = a.house_number || a.house_name || '';

  // Street
  const street = a.road || a.pedestrian || a.footway || a.path || a.cycleway || '';

  // House number + street (no "House/Plot" prefix — Nominatim numbers are already correct)
  const streetPart = [houseNumber, street].filter(Boolean).join(', ');

  // Sub-area
  const subArea = a.quarter || a.neighbourhood || a.suburb || a.hamlet || '';

  // City-level
  const city = a.city_district || a.town || a.city || a.village || a.county || '';

  // State + country
  const state = a.state || '';
  const country = a.country || '';

  const parts = [building, streetPart, subArea, city, state, country].filter(Boolean);

  // If we couldn't extract a street-level address (e.g. POI with no road in address object),
  // fall back to Nominatim's own display_name (take first 5 comma parts to keep it concise)
  if (!streetPart && !building && data.display_name) {
    return data.display_name.split(',').slice(0, 5).join(',').trim();
  }

  return parts.length >= 2 ? parts.join(', ') : data.display_name || '';
}

function parseGoogleAddressComponents(components = [], placeName = '') {
  const getCompResource = (type) => components.find((c) => Array.isArray(c.types) && c.types.includes(type));
  const getComp = (type) => {
    const comp = getCompResource(type);
    return comp?.long_name || comp?.short_name || '';
  };

  const streetNumber = getComp('street_number');
  const premise = getComp('premise');
  const subpremise = getComp('subpremise');
  const neighborhood = getComp('neighborhood');
  const sublocality = getComp('sublocality_level_1');

  // Landmark/Building candidates
  const pointOfInterest = getComp('point_of_interest');
  const establishment = getComp('establishment');
  const busStation = getComp('bus_station');
  const transitStation = getComp('transit_station');

  // Logic for Floor/House No.
  // Sometimes 'premise' contains the building name, 'subpremise' contains the floor/flat.
  // 'street_number' is the classic house number.
  const floorParts = [streetNumber, subpremise].map((s) => String(s).trim()).filter(Boolean);
  const floorHouseNo = floorParts.length ? floorParts.join(', ') : (premise || null);

  // Logic for Landmark
  // If placeName is just a generic address, skip it. If it looks like a specific POI, use it.
  const isGenericAddress = /^\d+|^[A-Z]\d+/.test(placeName) && placeName.includes(',');
  const landmarkCandidate = [
    !isGenericAddress ? placeName : '',
    pointOfInterest,
    establishment,
    busStation,
    transitStation,
    neighborhood,
    sublocality
  ].map(s => String(s || '').trim()).filter(Boolean);

  // Take the most specific one as the primary landmark
  const landmark = landmarkCandidate.length ? landmarkCandidate[0] : null;

  return { floorHouseNo, landmark };
}

export default function LocationPicker({
  value = '',
  locationGeo,
  onChange,
  placeholder = 'Search an address...',
  className = '',
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded } = useJsApiLoader({
    id: 'location-picker',
    googleMapsApiKey: apiKey,
    libraries: ['places'],
  });

  const [center, setCenter] = useState(
    locationGeo ? { lat: locationGeo.lat, lng: locationGeo.lng } : DEFAULT_CENTER
  );
  const [markerPosition, setMarkerPosition] = useState(
    locationGeo ? { lat: locationGeo.lat, lng: locationGeo.lng } : null
  );
  const [addressText, setAddressText] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const geocoderRef = useRef(null);
  const autocompleteSessionTokenRef = useRef(null);
  const placeDetailsCacheRef = useRef(new Map());

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Try Google Geocoder first, fall back to Nominatim
  const getPlaceExtras = useCallback(async (placeId = null, result = null) => {
    if (placeId && placeDetailsCacheRef.current.has(placeId)) return placeDetailsCacheRef.current.get(placeId);

    // If we already have the geocode result, we can parse it directly without an extra API call.
    if (result?.address_components) {
      const parsed = parseGoogleAddressComponents(result.address_components, result.name || '');
      const data = { ...parsed, name: result.name || null };
      if (placeId) placeDetailsCacheRef.current.set(placeId, data);
      return data;
    }

    if (!placeId || !window.google?.maps?.places) return { floorHouseNo: null, landmark: null, name: null };

    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const details = await new Promise((resolve) => {
      service.getDetails(
        {
          placeId,
          fields: ['name', 'address_components'],
        },
        (place, status) => {
          if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
            resolve({ floorHouseNo: null, landmark: null, name: null });
            return;
          }
          const parsed = parseGoogleAddressComponents(place.address_components || [], place.name || '');
          resolve({ ...parsed, name: place.name || null });
        }
      );
    });

    placeDetailsCacheRef.current.set(placeId, details);
    return details;
  }, []);

  // Helper to build a clean address that includes the building name if it's not already at the start.
  const buildLocationString = (name, formattedAddress) => {
    if (!name) return formattedAddress || '';
    if (!formattedAddress) return name;
    // If the name is already the first part of the address, don't repeat it.
    if (formattedAddress.toLowerCase().startsWith(name.toLowerCase())) return formattedAddress;
    return `${name}, ${formattedAddress}`;
  };

  const reverseGeocode = useCallback(
    (lat, lng) => {
      setReverseLoading(true);

      const applyAddr = async (addr, placeId = null, result = null) => {
        const extras = await getPlaceExtras(placeId, result);
        const finalAddr = buildLocationString(extras.name, addr);
        setAddressText(finalAddr);
        onChange?.({
          locationText: finalAddr,
          locationGeo: { lat, lng },
          placeId,
          floorHouseNo: extras.floorHouseNo,
          landmark: extras.landmark,
        });
        setReverseLoading(false);
      };

      const fallbackToNominatim = async () => {
        try {
          const data = await nominatimReverse(lat, lng);
          const addr = data.display_name
            ? data.display_name.split(',').slice(0, 6).join(',').trim()
            : buildDisplayName(data);
          await applyAddr(addr || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          await applyAddr(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      };

      if (geocoderRef.current) {
        geocoderRef.current.geocode({ location: { lat, lng } }, async (results, status) => {
          if (status === 'OK' && results?.length) {
            // Prioritize results that are buildings or specific addresses
            const best =
              results.find((r) => r.types?.includes('street_address')) ||
              results.find((r) => r.types?.includes('premise')) ||
              results.find((r) => r.types?.includes('point_of_interest')) ||
              results.find((r) => r.types?.includes('establishment')) ||
              results.find((r) => r.types?.includes('street_address')) ||
              results[0];
            await applyAddr(best.formatted_address || '', best.place_id || null, best);
          } else {
            await fallbackToNominatim();
          }
        });
      } else {
        fallbackToNominatim();
      }
    },
    [onChange, getPlaceExtras]
  );

  // Google Places Autocomplete search for dropdown
  const handleInputChange = (e) => {
    const val = e.target.value;
    setAddressText(val);
    setSuggestions([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim() || val.trim().length < 2) {
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        if (!autocompleteSessionTokenRef.current && window.google?.maps?.places) {
          autocompleteSessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }
        const results = await googlePlacesSearch(val, autocompleteSessionTokenRef.current);
        setSuggestions(results || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const handleSuggestionClick = async (item) => {
    const placeId = item.place_id;
    const addr = item.description || item.structured_formatting?.main_text || '';
    setAddressText(addr);
    setShowSuggestions(false);
    setSuggestions([]);
    
    setReverseLoading(true);
    const extras = await getPlaceExtras(placeId);
    
    // Refresh session token for next search
    if (window.google?.maps?.places) {
      autocompleteSessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    }

    if (geocoderRef.current) {
      geocoderRef.current.geocode({ placeId }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const res = results[0];
          const lat = res.geometry.location.lat();
          const lng = res.geometry.location.lng();
          setCenter({ lat, lng });
          setMarkerPosition({ lat, lng });
          const finalAddr = buildLocationString(extras.name || addr, res.formatted_address);
          onChange?.({
            locationText: finalAddr,
            locationGeo: { lat, lng },
            placeId,
            floorHouseNo: extras.floorHouseNo,
            landmark: extras.landmark,
          });
          setAddressText(finalAddr);
        }
        setReverseLoading(false);
      });
    } else {
      setReverseLoading(false);
    }
  };

  // Save raw typed text on blur/Enter if no suggestion was chosen
  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
    const query = (addressText || '').trim();
    if (query) onChange?.({ locationText: query, locationGeo: markerPosition || null, placeId: null });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
    }
  };

  // GPS "Use my location"
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCenter({ lat, lng });
        setMarkerPosition({ lat, lng });
        await reverseGeocode(lat, lng);
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setGpsError('Location access denied. Please allow location or type manually.');
      },
      { timeout: 8000 }
    );
  };

  const onMapClick = useCallback(
    async (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      setCenter({ lat, lng });

      if (e.placeId) {
        // e.stop(); // Optional: prevent the default Google info window
        const placeId = e.placeId;
        setReverseLoading(true);
        const extras = await getPlaceExtras(placeId);

        if (geocoderRef.current) {
          geocoderRef.current.geocode({ placeId }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              const res = results[0];
              const finalAddr = buildLocationString(extras.name, res.formatted_address);
              setAddressText(finalAddr);
              onChange?.({
                locationText: finalAddr,
                locationGeo: { lat, lng },
                placeId,
                floorHouseNo: extras.floorHouseNo,
                landmark: extras.landmark,
              });
            }
            setReverseLoading(false);
          });
        } else {
          setReverseLoading(false);
          reverseGeocode(lat, lng);
        }
      } else {
        reverseGeocode(lat, lng);
      }
    },
    [reverseGeocode, getPlaceExtras, onChange]
  );

  const onMarkerDragEnd = useCallback(
    (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      setCenter({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  const onMapLoad = useCallback(() => {
    if (window.google?.maps?.Geocoder && !geocoderRef.current) {
      try {
        geocoderRef.current = new window.google.maps.Geocoder();
      } catch (error) {
        console.warn('Failed to initialize Google Geocoder:', error);
      }
    }
  }, []);

  if (!apiKey) {
    return (
      <div className="form-control">
        <label className="label">
          <span className="label-text">Location</span>
        </label>
        <input
          type="text"
          className={`input input-bordered ${className}`}
          value={value}
          onChange={(e) =>
            onChange?.({ locationText: e.target.value, locationGeo: null, placeId: null })
          }
          placeholder={placeholder}
        />
        <p className="text-sm text-base-content/60 mt-1">
          Set VITE_GOOGLE_MAPS_API_KEY for map picker.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="form-control">
        <label className="label">
          <span className="label-text">Location</span>
        </label>
        <div className="h-[300px] rounded-lg bg-base-300 animate-pulse flex items-center justify-center text-base-content/50">
          Loading map...
        </div>
      </div>
    );
  }

  return (
    <div className="form-control space-y-2">
      <label className="label">
        <span className="label-text">Location</span>
      </label>

      {/* Search input + GPS button */}
      <div ref={wrapperRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              className={`input input-bordered w-full pr-10 ${className}`}
              value={addressText}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder={placeholder}
            />
            {(searchLoading || reverseLoading) && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="loading loading-spinner loading-xs text-primary" />
              </span>
            )}
          </div>

          {/* GPS button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={gpsLoading}
            className="btn btn-outline btn-primary px-3"
            title="Use my current location"
          >
            {gpsLoading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <i className="fas fa-crosshairs text-base" />
            )}
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-xl shadow-xl max-h-64 overflow-y-auto">
            {suggestions.map((item) => {
              const mainText = item.structured_formatting?.main_text || '';
              const secondaryText = item.structured_formatting?.secondary_text || '';
              return (
                <li key={item.place_id}>
                  <button
                    type="button"
                    onMouseDown={() => handleSuggestionClick(item)}
                    className="w-full text-left px-4 py-3 hover:bg-primary/10 hover:text-primary text-sm border-b border-base-300 last:border-0 flex items-start gap-3 transition-colors"
                  >
                    <i className="fas fa-map-marker-alt text-primary mt-1 shrink-0 text-xs" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-base-content line-clamp-1">{mainText}</span>
                      {secondaryText && (
                        <span className="text-xs text-base-content/60 line-clamp-1">{secondaryText}</span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {gpsError && (
        <p className="text-xs text-error flex items-center gap-1">
          <i className="fas fa-exclamation-circle" /> {gpsError}
        </p>
      )}

      <p className="text-xs text-base-content/60">
        Type to search, click the map to pin, or{' '}
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="text-primary underline underline-offset-2"
        >
          use my location
        </button>
        . Drag the marker to adjust.
      </p>

      {/* Map */}
      <div className="rounded-xl border border-base-300 overflow-hidden shadow-sm">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={center}
          zoom={14}
          onLoad={onMapLoad}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          {markerPosition && (
            <Marker position={markerPosition} draggable onDragEnd={onMarkerDragEnd} />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
