import React, { useState, useEffect, useRef } from 'react';

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

export default function LocationAutocomplete({ value, onChange, placeholder = "Enter location...", className = "" }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      searchLocation(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const searchLocation = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${NOMINATIM_API}?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'HireMistri/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch location suggestions');
      }

      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setSelectedIndex(-1);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleSelect = (suggestion) => {
    const displayName = suggestion.display_name || suggestion.name || '';
    setQuery(displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    if (onChange) {
      onChange(displayName);
    }
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  const handleBlur = () => {
    // Delay to allow click events on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`input input-bordered w-full ${className}`}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="loading loading-spinner loading-xs"></span>
          </span>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSelect(suggestion)}
              className={`px-4 py-3 cursor-pointer hover:bg-base-200 transition-colors ${
                index === selectedIndex ? 'bg-base-200' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-lg' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <i className="fas fa-map-marker-alt text-primary mt-1"></i>
                <div className="flex-1">
                  <p className="font-medium text-base-content">
                    {suggestion.display_name || suggestion.name || 'Location'}
                  </p>
                  {suggestion.address && (
                    <p className="text-sm opacity-70">
                      {[
                        suggestion.address.city,
                        suggestion.address.state,
                        suggestion.address.country
                      ].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showSuggestions && suggestions.length === 0 && query.trim().length >= 3 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 text-center">
          <p className="text-base-content opacity-70">No locations found</p>
        </div>
      )}
    </div>
  );
}

