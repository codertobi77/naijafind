import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  const [mapCenter, setMapCenter] = useState({ lat: 9.0820, lng: 8.6753 }); // Default to Nigeria center
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Update map center when country or state changes
  useEffect(() => {
    if (value.country && COUNTRY_DATA[value.country]) {
      const country = COUNTRY_DATA[value.country];
      
      if (value.state) {
        // Try to geocode the state to get its center
        geocodeState(value.state, value.country);
      } else {
        setMapCenter(country.center);
      }
    }
  }, [value.country, value.state]);

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
                {t('location.map_instructions')}
              </p>
            </div>

            <div className="flex-1 relative min-h-[400px]">
              {/* Google Maps Container */}
              <div id="google-map-picker" className="w-full h-full min-h-[400px]">
                <iframe
                  src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d250000!2d${mapCenter.lng}!3d${mapCenter.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '400px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
              
              {/* Manual coordinate input as fallback */}
              <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {t('location.manual_coords')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder={t('location.latitude')}
                    value={selectedLocation?.lat || ''}
                    onChange={(e) => setSelectedLocation({ 
                      lat: parseFloat(e.target.value) || 0, 
                      lng: selectedLocation?.lng || 0 
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder={t('location.longitude')}
                    value={selectedLocation?.lng || ''}
                    onChange={(e) => setSelectedLocation({ 
                      lat: selectedLocation?.lat || 0, 
                      lng: parseFloat(e.target.value) || 0 
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
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
