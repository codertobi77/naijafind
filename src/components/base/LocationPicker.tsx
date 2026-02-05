import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

// Country data with their states/regions
const COUNTRY_DATA: Record<string, { name: string; states: string[]; center: { lat: number; lng: number } }> = {
  'NG': {
    name: 'Nigeria',
    states: [
      'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
      'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
      'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
      'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
      'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT (Abuja)'
    ],
    center: { lat: 9.0820, lng: 8.6753 }
  },
  'BJ': {
    name: 'Benin',
    states: [
      'Alibori', 'Atacora', 'Atlantique', 'Borgou', 'Collines', 'Couffo', 'Donga',
      'Littoral', 'Mono', 'Oueme', 'Plateau', 'Zou'
    ],
    center: { lat: 9.3077, lng: 2.3158 }
  },
  'TG': {
    name: 'Togo',
    states: [
      'Centrale', 'Kara', 'Maritime', 'Plateaux', 'Savannes'
    ],
    center: { lat: 8.6195, lng: 0.8248 }
  },
  'GH': {
    name: 'Ghana',
    states: [
      'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
      'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'
    ],
    center: { lat: 7.9465, lng: -1.0232 }
  },
  'CI': {
    name: "Côte d'Ivoire",
    states: [
      'Abidjan', 'Bas-Sassandra', 'Comoé', 'Denguélé', 'Gôh-Djiboua', 'Lacs', 'Lagunes',
      'Montagnes', 'Sassandra-Marahoué', 'Savanes', 'Vallée du Bandama', 'Woroba', 'Zanzan', 'Yamoussoukro'
    ],
    center: { lat: 7.5400, lng: -5.5471 }
  }
};

interface LocationPickerProps {
  value: {
    country: string;
    state: string;
    city: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
  onChange: (value: {
    country: string;
    state: string;
    city: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  }) => void;
  errors?: Record<string, string>;
}

export default function LocationPicker({ value, onChange, errors }: LocationPickerProps) {
  const { t } = useTranslation();
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 9.0820, lng: 8.6753 }); // Default to Nigeria center
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);

  // Initialize Mapbox when modal opens
  useEffect(() => {
    if (showMap && mapRef.current && !mapInstanceRef.current) {
      setIsMapLoading(true);

      // Set Mapbox token
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const initialCenter = selectedLocation || mapCenter;
      
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [initialCenter.lng, initialCenter.lat],
        zoom: 12,
        pitch: 45,
        bearing: -17.6,
        antialias: true
      });

      mapInstanceRef.current = map;

      map.on('load', () => {
        setIsMapLoading(false);

        // Add 3D terrain
        map.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
        map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

        // Add 3D buildings
        if (!map.getLayer('3d-buildings')) {
          map.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 12,
            'paint': {
              'fill-extrusion-color': '#a8a8a8',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.6
            }
          });
        }

        // Add marker if location already selected
        if (selectedLocation) {
          markerRef.current = new mapboxgl.Marker({ draggable: true })
            .setLngLat([selectedLocation.lng, selectedLocation.lat])
            .addTo(map);

          markerRef.current.on('dragend', () => {
            const lngLat = markerRef.current?.getLngLat();
            if (lngLat) {
              const newLocation = { lat: lngLat.lat, lng: lngLat.lng };
              setSelectedLocation(newLocation);
            }
          });
        }
      });

      // Add click listener to map
      map.on('click', (e: mapboxgl.MapMouseEvent) => {
        const clickedLng = e.lngLat.lng;
        const clickedLat = e.lngLat.lat;
        const clickedLocation = { lat: clickedLat, lng: clickedLng };
        
        setSelectedLocation(clickedLocation);

        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setLngLat([clickedLng, clickedLat]);
        } else {
          markerRef.current = new mapboxgl.Marker({ draggable: true })
            .setLngLat([clickedLng, clickedLat])
            .addTo(map);

          markerRef.current.on('dragend', () => {
            const lngLat = markerRef.current?.getLngLat();
            if (lngLat) {
              const newLocation = { lat: lngLat.lat, lng: lngLat.lng };
              setSelectedLocation(newLocation);
            }
          });
        }
      });
    }

    // Cleanup map when modal closes
    return () => {
      if (!showMap && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMap, mapCenter]);

  // Update marker position when selectedLocation changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedLocation && markerRef.current) {
      mapInstanceRef.current.setCenter([selectedLocation.lng, selectedLocation.lat]);
    }
  }, [selectedLocation]);

  // Simple geocoding function using a free service
  const geocodeState = async (state: string, countryCode: string) => {
    try {
      const countryName = COUNTRY_DATA[countryCode]?.name || '';
      const query = encodeURIComponent(`${state}, ${countryName}`);
      
      // Use OpenStreetMap Nominatim for geocoding (free, no API key required)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        setMapCenter({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      // Fallback to country center
      if (COUNTRY_DATA[countryCode]) {
        setMapCenter(COUNTRY_DATA[countryCode].center);
      }
    }
  };

  const handleCountryChange = (countryCode: string) => {
    onChange({
      ...value,
      country: countryCode,
      state: '', // Reset state when country changes
      city: '',
      latitude: null,
      longitude: null
    });
    setSelectedLocation(null);
  };

  const handleStateChange = (state: string) => {
    onChange({
      ...value,
      state,
      city: '',
      latitude: null,
      longitude: null
    });
    setSelectedLocation(null);
  };

  const openMapPicker = () => {
    if (!value.country || !value.state) {
      alert(t('location.select_country_state_first'));
      return;
    }
    setShowMap(true);
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      onChange({
        ...value,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng
      });
      setShowMap(false);
    }
  };

  const availableStates = value.country ? COUNTRY_DATA[value.country]?.states || [] : [];

  return (
    <div className="space-y-4">
      {/* Country Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('location.country')} *
        </label>
        <select
          value={value.country}
          onChange={(e) => handleCountryChange(e.target.value)}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white ${
            errors?.country ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
        >
          <option value="">{t('location.select_country')}</option>
          {Object.entries(COUNTRY_DATA).map(([code, data]) => (
            <option key={code} value={code}>
              {data.name}
            </option>
          ))}
        </select>
        {errors?.country && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <i className="ri-error-warning-line mr-1"></i>
            {errors.country}
          </p>
        )}
      </div>

      {/* State/Department Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('location.state_department')} *
        </label>
        <select
          value={value.state}
          onChange={(e) => handleStateChange(e.target.value)}
          disabled={!value.country}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none bg-white ${
            errors?.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
          } ${!value.country ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="">{t('location.select_state')}</option>
          {availableStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        {errors?.state && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <i className="ri-error-warning-line mr-1"></i>
            {errors.state}
          </p>
        )}
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('location.city')} *
        </label>
        <input
          type="text"
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
            errors?.city ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
          placeholder={t('location.city_placeholder')}
        />
        {errors?.city && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <i className="ri-error-warning-line mr-1"></i>
            {errors.city}
          </p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('location.address')}
        </label>
        <input
          type="text"
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          placeholder={t('location.address_placeholder')}
        />
      </div>

      {/* Map Picker Button */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('location.exact_location')}
        </label>
        <button
          type="button"
          onClick={openMapPicker}
          disabled={!value.country || !value.state}
          className={`w-full px-4 py-3 border-2 border-dashed rounded-xl transition-all flex items-center justify-center gap-2 ${
            value.latitude && value.longitude
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-700'
          } ${(!value.country || !value.state) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <i className={`${value.latitude && value.longitude ? 'ri-map-pin-fill' : 'ri-map-pin-line'} text-xl`}></i>
          <span>
            {value.latitude && value.longitude
              ? t('location.location_selected')
              : t('location.select_on_map')}
          </span>
        </button>
        {value.latitude && value.longitude && (
          <p className="mt-2 text-sm text-green-600 flex items-center">
            <i className="ri-check-line mr-1"></i>
            {t('location.coords', { lat: value.latitude.toFixed(6), lng: value.longitude.toFixed(6) })}
          </p>
        )}
      </div>

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('location.select_exact_location')}
              </h3>
              <button
                onClick={() => setShowMap(false)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <div className="p-4 bg-blue-50 border-b">
              <p className="text-sm text-blue-800 flex items-center">
                <i className="ri-information-line mr-2"></i>
                {t('location.map_instructions') || 'Cliquez sur la carte pour sélectionner une position. Vous pouvez aussi déplacer le marqueur.'}
              </p>
            </div>

            <div className="flex-1 relative min-h-[400px]">
              {/* Mapbox Container */}
              <div ref={mapRef} className="w-full h-full min-h-[400px] bg-gray-100">
                {isMapLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <i className="ri-loader-4-line animate-spin text-2xl"></i>
                      <span>Chargement de la carte...</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selected Coordinates Display */}
              <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {t('location.selected_coordinates') || 'Coordonnées sélectionnées'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder={t('location.latitude')}
                      value={selectedLocation?.lat || ''}
                      onChange={(e) => {
                        const lat = parseFloat(e.target.value);
                        setSelectedLocation(prev => ({ 
                          lat: isNaN(lat) ? 0 : lat, 
                          lng: prev?.lng || 0 
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder={t('location.longitude')}
                      value={selectedLocation?.lng || ''}
                      onChange={(e) => {
                        const lng = parseFloat(e.target.value);
                        setSelectedLocation(prev => ({ 
                          lat: prev?.lat || 0, 
                          lng: isNaN(lng) ? 0 : lng 
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                {selectedLocation && (
                  <p className="mt-2 text-xs text-green-600 flex items-center">
                    <i className="ri-map-pin-fill mr-1"></i>
                    Position sélectionnée: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('btn.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmLocation}
                disabled={!selectedLocation}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('location.confirm_location')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
