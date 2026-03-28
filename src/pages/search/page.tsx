import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@convex/_generated/api';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { useAction } from 'convex/react';
import type { Map, Marker, Popup } from 'mapbox-gl';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

// Helper function to add timeout to promises
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};

// Dynamically import mapbox-gl only when needed
let mapboxglPromise: Promise<typeof import('mapbox-gl')> | null = null;
const getMapboxgl = () => {
  if (!mapboxglPromise) {
    mapboxglPromise = import('mapbox-gl').then((mod) => {
      // Dynamically import CSS
      import('mapbox-gl/dist/mapbox-gl.css');
      return mod;
    });
  }
  return mapboxglPromise;
};

interface Supplier {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  review_count: number;
  distance?: number;
  verified: boolean;
  image_url: string;
  description: string;
  phone: string;
  email: string;
  // Location fields for map
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
}

// Component to display suppliers on a map using Mapbox with 3D terrain
function SupplierMapView({ suppliers, userLocation }: { suppliers: Supplier[]; userLocation?: { lat: number; lng: number } | null }) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 9.0820, lng: 8.6753 }); // Default Nigeria center
  const [mapZoom, setMapZoom] = useState(6);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const approximatedSuppliersRef = useRef(new Map<string, { lat: number; lng: number }>());
  const userMarkerRef = useRef<Marker | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate deterministic approximate coordinates based on location string
  const getApproximateCoordinates = (supplier: Supplier): { lat: number; lng: number } | null => {
    // If already computed, return cached
    if (approximatedSuppliersRef.current.has(supplier.id)) {
      return approximatedSuppliersRef.current.get(supplier.id)!;
    }
    
    // For suppliers with exact coordinates, use them
    if (supplier.latitude && supplier.longitude) {
      const coords = { lat: supplier.latitude, lng: supplier.longitude };
      approximatedSuppliersRef.current.set(supplier.id, coords);
      return coords;
    }
    
    // Parse location field to extract city, state, country
    // Location format is typically: "City, State, Country" or "City, State"
    const locationParts = (supplier.location || '').split(',').map(p => p.trim()).filter(Boolean);
    const cityFromLocation = locationParts[0] || '';
    const stateFromLocation = locationParts[1] || '';
    const countryFromLocation = locationParts[2] || supplier.country || 'Nigeria';
    
    // Also check city and state fields as fallback
    const city = supplier.city || cityFromLocation;
    const state = supplier.state || stateFromLocation;
    
    // Create a unique key based on the parsed location
    const locationKey = `${city},${state},${countryFromLocation}`;
    
    // For approximate locations, generate pseudorandom offset based on location string hash
    const hash = locationKey.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
    }, 0);
    
    // Base coordinates for major Nigerian cities and states
    const locationCoords: Record<string, { lat: number; lng: number }> = {
      // Major cities
      'lagos': { lat: 6.5244, lng: 3.3792 },
      'abuja': { lat: 9.0765, lng: 7.3986 },
      'fct': { lat: 9.0765, lng: 7.3986 },
      'ibadan': { lat: 7.3775, lng: 3.9470 },
      'port harcourt': { lat: 4.8156, lng: 7.0498 },
      'kano': { lat: 12.0022, lng: 8.5920 },
      'kaduna': { lat: 10.5105, lng: 7.4165 },
      'enugu': { lat: 6.5244, lng: 7.5186 },
      'benin': { lat: 6.3350, lng: 5.6037 },
      'jos': { lat: 9.8965, lng: 8.8583 },
      'ilorin': { lat: 8.4799, lng: 4.5418 },
      'aba': { lat: 5.1066, lng: 7.3667 },
      'calabar': { lat: 4.9757, lng: 8.3417 },
      'owerri': { lat: 5.4836, lng: 7.0333 },
      'akure': { lat: 7.2571, lng: 5.2058 },
      'ife': { lat: 7.4825, lng: 4.5603 },
      'lokoja': { lat: 7.8023, lng: 6.7430 },
      'makurdi': { lat: 7.7337, lng: 8.5333 },
      'minna': { lat: 9.6139, lng: 6.5569 },
      'sokoto': { lat: 13.0059, lng: 5.2476 },
      'maiduguri': { lat: 11.8469, lng: 13.1571 },
      'yola': { lat: 9.2035, lng: 12.4954 },
      'bauchi': { lat: 10.3157, lng: 9.8434 },
      'gombe': { lat: 10.2897, lng: 11.1711 },
      'damaturu': { lat: 11.7470, lng: 11.9608 },
      'jalingo': { lat: 8.8937, lng: 11.3590 },
      'dutse': { lat: 11.7591, lng: 9.3230 },
      'birnin kebbi': { lat: 12.4539, lng: 4.1975 },
      'awka': { lat: 6.2100, lng: 7.0700 },
      'yenegoa': { lat: 4.9247, lng: 6.2640 },
      'asaba': { lat: 6.2000, lng: 6.7333 },
      'abakaliki': { lat: 6.3249, lng: 8.1137 },
      'ado ekiti': { lat: 7.6213, lng: 5.2210 },
      'abeokuta': { lat: 7.1475, lng: 3.3619 },
      'akwa ibom': { lat: 5.0000, lng: 7.8333 },
      'uyo': { lat: 5.0333, lng: 7.9167 },
      'ikeja': { lat: 6.5965, lng: 3.3421 },
      'lekki': { lat: 6.4698, lng: 3.5852 },
      'ikekja': { lat: 6.5965, lng: 3.3421 },
      'yaba': { lat: 6.5000, lng: 3.3667 },
      'surulere': { lat: 6.5000, lng: 3.3500 },
      'apapa': { lat: 6.4500, lng: 3.3667 },
      'oshodi': { lat: 6.5500, lng: 3.3500 },
      'ikoyi': { lat: 6.4500, lng: 3.4333 },
      'victoria island': { lat: 6.4333, lng: 3.4167 },
      'vi': { lat: 6.4333, lng: 3.4167 },
      'ikeja g': { lat: 6.6249, lng: 3.3506 },
      // States (approximate centers)
      'lagos state': { lat: 6.5244, lng: 3.3792 },
      'fct (abuja)': { lat: 9.0765, lng: 7.3986 },
      'oyo state': { lat: 7.3775, lng: 3.9470 },
      'rivers state': { lat: 4.8156, lng: 7.0498 },
      'kano state': { lat: 12.0022, lng: 8.5920 },
      'kaduna state': { lat: 10.5105, lng: 7.4165 },
      'enugu state': { lat: 6.5244, lng: 7.5186 },
      'edo state': { lat: 6.3350, lng: 5.6037 },
      'plateau state': { lat: 9.8965, lng: 8.8583 },
      'kwara state': { lat: 8.4799, lng: 4.5418 },
      'abia state': { lat: 5.1066, lng: 7.3667 },
      'cross river': { lat: 4.9757, lng: 8.3417 },
      'imo state': { lat: 5.4836, lng: 7.0333 },
      'ondo state': { lat: 7.2571, lng: 5.2058 },
      'osun state': { lat: 7.4825, lng: 4.5603 },
      'kogi state': { lat: 7.8023, lng: 6.7430 },
      'benue state': { lat: 7.7337, lng: 8.5333 },
      'niger state': { lat: 9.6139, lng: 6.5569 },
      'sokoto state': { lat: 13.0059, lng: 5.2476 },
      'borno state': { lat: 11.8469, lng: 13.1571 },
      'adamawa state': { lat: 9.2035, lng: 12.4954 },
      'bauchi state': { lat: 10.3157, lng: 9.8434 },
      'gombe state': { lat: 10.2897, lng: 11.1711 },
      'yobe state': { lat: 11.7470, lng: 11.9608 },
      'taraba state': { lat: 8.8937, lng: 11.3590 },
      'jigawa state': { lat: 11.7591, lng: 9.3230 },
      'kebbi state': { lat: 12.4539, lng: 4.1975 },
      'anambra state': { lat: 6.2100, lng: 7.0700 },
      'bayelsa state': { lat: 4.9247, lng: 6.2640 },
      'delta state': { lat: 6.2000, lng: 6.7333 },
      'ebonyi state': { lat: 6.3249, lng: 8.1137 },
      'ekiti state': { lat: 7.6213, lng: 5.2210 },
      'ogun state': { lat: 7.1475, lng: 3.3619 },
      'akwa ibom state': { lat: 5.0333, lng: 7.9167 },
    };
    
    // Try to match city or state from location
    const searchKey = locationKey.toLowerCase();
    let baseCoords = locationCoords['lagos']; // Default to Lagos
    let matchedLocation = '';
    
    // First try to match full location string
    for (const [key, coords] of Object.entries(locationCoords)) {
      if (searchKey.includes(key)) {
        baseCoords = coords;
        matchedLocation = key;
        break;
      }
    }
    
    // If no match found, try individual parts
    if (!matchedLocation) {
      // Try city match
      if (city) {
        const cityLower = city.toLowerCase();
        for (const [key, coords] of Object.entries(locationCoords)) {
          if (cityLower.includes(key) || key.includes(cityLower)) {
            baseCoords = coords;
            matchedLocation = key;
            break;
          }
        }
      }
      
      // If still no match, try state
      if (!matchedLocation && state) {
        const stateLower = state.toLowerCase();
        for (const [key, coords] of Object.entries(locationCoords)) {
          if (stateLower.includes(key) || key.includes(stateLower)) {
            baseCoords = coords;
            matchedLocation = key;
            break;
          }
        }
      }
    }
    
    // Generate approximate offset (different for each supplier to avoid overlap)
    // Use a smaller offset for city-level precision (~2-3km)
    const offsetLat = (Math.abs(hash) % 500 - 250) / 10000; // ±0.025 degrees (~2-3km)
    const offsetLng = (Math.abs(hash >> 8) % 500 - 250) / 10000;
    
    const approxCoords = {
      lat: baseCoords.lat + offsetLat,
      lng: baseCoords.lng + offsetLng
    };
    
    approximatedSuppliersRef.current.set(supplier.id, approxCoords);
    return approxCoords;
  };

  // Add or update user location marker
  const addUserMarker = async () => {
    if (!mapInstanceRef.current || !userLocation) return;
    const mapboxgl = await getMapboxgl();

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Create user location marker element
    const el = document.createElement('div');
    el.className = 'user-marker';
    el.style.width = '24px';
    el.style.height = '24px';
    el.innerHTML = `
      <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-blue-300 animate-pulse">
        <i class="ri-user-fill text-white text-xs"></i>
      </div>
    `;

    const popup = new mapboxgl.Popup({ offset: 10 }).setHTML(
      `<div class="p-2 text-sm">
        <p class="font-medium text-gray-900">${t('search.your_position')}</p>
      </div>`
    );

    userMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(popup)
      .addTo(mapInstanceRef.current);
  };

  // Update user marker when location changes
  useEffect(() => {
    if (mapInstanceRef.current && userLocation) {
      addUserMarker();
      // Center map on user location
      mapInstanceRef.current.setCenter([userLocation.lng, userLocation.lat]);
      mapInstanceRef.current.setZoom(13);
    }
  }, [userLocation]);

  // Calculate map center based on suppliers with valid coordinates
  useEffect(() => {
    const suppliersWithCoords = suppliers.filter(s => {
      const coords = getApproximateCoordinates(s);
      return coords !== null;
    });
    
    if (suppliersWithCoords.length > 0) {
      const avgLat = suppliersWithCoords.reduce((sum, s) => {
        const coords = getApproximateCoordinates(s);
        return sum + (coords?.lat || 0);
      }, 0) / suppliersWithCoords.length;
      const avgLng = suppliersWithCoords.reduce((sum, s) => {
        const coords = getApproximateCoordinates(s);
        return sum + (coords?.lng || 0);
      }, 0) / suppliersWithCoords.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
      
      // Adjust zoom based on number of suppliers and spread
      if (suppliersWithCoords.length === 1) {
        setMapZoom(14);
      } else if (suppliersWithCoords.length <= 5) {
        setMapZoom(12);
      } else {
        setMapZoom(10);
      }
    }
  }, [suppliers]);

  // Add 3D buildings layer
  const add3DBuildings = (map: Map) => {
    if (!map.getLayer('3d-buildings')) {
      map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 12,
        'paint': {
          'fill-extrusion-color': '#d4a574',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.8,
          'fill-extrusion-vertical-gradient': true,
          'fill-extrusion-ambient-occlusion-intensity': 0.3
        }
      });
    }
  };

  // Initialize Mapbox map with 3D terrain
  useEffect(() => {
    const initMap = async () => {
      if (mapRef.current && !mapInstanceRef.current) {
        const mapboxgl = await getMapboxgl();
        (mapboxgl as any).accessToken = MAPBOX_TOKEN;
        
        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [mapCenter.lng, mapCenter.lat],
          zoom: mapZoom,
          pitch: 45, // Tilt for 3D perspective
          bearing: -17.6,
          antialias: true
        });

        mapInstanceRef.current = map;

        map.on('load', () => {
          // Add 3D terrain
          map.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
          
          map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
          
          // Add 3D buildings
          add3DBuildings(map);
          
          // Add markers for suppliers
          void addSupplierMarkers();
        });
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  // Update map center and markers when suppliers change
  useEffect(() => {
    if (mapInstanceRef.current && suppliers.length > 0) {
      mapInstanceRef.current.setCenter([mapCenter.lng, mapCenter.lat]);
      mapInstanceRef.current.setZoom(mapZoom);
      
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Add new markers
      void addSupplierMarkers();
    }
  }, [mapCenter, mapZoom, suppliers]);

  const addSupplierMarkers = async () => {
    if (!mapInstanceRef.current) return;
    const mapboxgl = await getMapboxgl();

    // Mapping des catégories aux icônes Remix Icon
    const getCategoryIcon = (category: string): string => {
      const categoryLower = category.toLowerCase();
      const iconMap: Record<string, string> = {
        'restaurant': 'ri-restaurant-line',
        'food': 'ri-restaurant-2-line',
        'cafe': 'ri-cup-line',
        'hotel': 'ri-hotel-bed-line',
        'hôtel': 'ri-hotel-bed-line',
        'shop': 'ri-shopping-bag-line',
        'store': 'ri-store-line',
        'boutique': 'ri-t-shirt-line',
        'clothing': 'ri-t-shirt-air-line',
        'fashion': 'ri-t-shirt-line',
        'pharmacy': 'ri-medicine-bottle-line',
        'pharmacie': 'ri-medicine-bottle-line',
        'hospital': 'ri-hospital-line',
        'clinic': 'ri-first-aid-kit-line',
        'bank': 'ri-bank-line',
        'banque': 'ri-bank-line',
        'atm': 'ri-money-cny-circle-line',
        'salon': 'ri-scissors-line',
        'barber': 'ri-scissors-cut-line',
        'beauty': 'ri-eye-line',
        'spa': 'ri-drop-line',
        'gym': 'ri-run-line',
        'fitness': 'ri-heart-pulse-line',
        'school': 'ri-school-line',
        'école': 'ri-school-line',
        'university': 'ri-graduation-cap-line',
        'gas': 'ri-gas-station-line',
        'station': 'ri-gas-station-line',
        'car': 'ri-car-line',
        'auto': 'ri-car-washing-line',
        'repair': 'ri-tools-line',
        'service': 'ri-customer-service-line',
        'office': 'ri-building-line',
        'bureau': 'ri-building-line',
        'market': 'ri-shopping-cart-line',
        'supermarket': 'ri-shopping-cart-2-line',
        'electronics': 'ri-smartphone-line',
        'tech': 'ri-computer-line',
        'it': 'ri-code-line',
        'consulting': 'ri-briefcase-line',
        'lawyer': 'ri-scales-line',
        'legal': 'ri-file-shield-line',
        'real estate': 'ri-home-line',
        'immobilier': 'ri-building-4-line',
        'construction': 'ri-building-3-line',
        'plumber': 'ri-water-flash-line',
        'electrician': 'ri-flashlight-line',
        'cleaning': 'ri-brush-line',
        'delivery': 'ri-truck-line',
        'transport': 'ri-bus-line',
        'taxi': 'ri-taxi-line',
        'travel': 'ri-plane-line',
        'tourism': 'ri-map-pin-range-line',
        'entertainment': 'ri-movie-line',
        'event': 'ri-calendar-event-line',
        'photography': 'ri-camera-line',
        'printing': 'ri-printer-line',
        'bookstore': 'ri-book-line',
        'library': 'ri-book-open-line',
        'art': 'ri-paint-brush-line',
        'gallery': 'ri-gallery-line',
        'music': 'ri-music-line',
        'dance': 'ri-user-voice-line',
      };
      
      // Recherche exacte d'abord
      if (iconMap[categoryLower]) {
        return iconMap[categoryLower];
      }
      
      // Recherche partielle
      for (const [key, icon] of Object.entries(iconMap)) {
        if (categoryLower.includes(key) || key.includes(categoryLower)) {
          return icon;
        }
      }
      
      // Icône par défaut
      return 'ri-store-2-line';
    };

    for (const supplier of suppliers) {
      const coords = getApproximateCoordinates(supplier);
      if (!coords) continue;
      
      const isExact = supplier.latitude && supplier.longitude;
      const categoryIcon = getCategoryIcon(supplier.category);
      
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.innerHTML = `
        <div class="w-10 h-10 ${isExact ? 'bg-green-600' : 'bg-yellow-500'} rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform border-3 border-white ring-2 ${isExact ? 'ring-green-400' : 'ring-yellow-300'}">
          <i class="${categoryIcon} text-white text-sm"></i>
        </div>
        ${!isExact ? '<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-600 rounded-full flex items-center justify-center border border-white"><i class="ri-question-line text-white text-[8px]"></i></div>' : ''}
      `;

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        closeOnClick: false
      }).setHTML(
        `<div class="p-3 min-w-[200px]">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="font-semibold text-sm text-gray-900">${supplier.name}</h3>
            ${isExact 
              ? '<span class="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">' + t('map.exact') + '</span>'
              : '<span class="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">' + t('map.approximate') + '</span>'
            }
          </div>
          <p class="text-xs text-gray-600 mb-1">${supplier.category}</p>
          <p class="text-xs text-gray-500">${supplier.location}</p>
          ${supplier.rating ? `<div class="flex items-center gap-1 mt-2"><i class="ri-star-fill text-yellow-500 text-xs"></i><span class="text-xs font-medium">${supplier.rating}</span></div>` : ''}
        </div>`
      );

      const marker = new mapboxgl.Marker(el)
        .setLngLat([coords.lng, coords.lat])
        .setPopup(popup);
      
      if (mapInstanceRef.current) {
        marker.addTo(mapInstanceRef.current);
      }

      // Afficher le popup au hover
      el.addEventListener('mouseenter', () => {
        if (mapInstanceRef.current) {
          marker.togglePopup();
        }
      });

      // Cacher le popup quand on quitte le hover
      el.addEventListener('mouseleave', () => {
        popup.remove();
      });

      // Click pour sélectionner le supplier
      el.addEventListener('click', () => {
        setSelectedSupplier(supplier);
      });

      markersRef.current.push(marker);
    }
  };

  return (
    <>
      <div className="relative w-full h-full">
        <div ref={mapRef} className="w-full h-full bg-gray-100" />
        
        {/* Expand button */}
        <button
          onClick={() => setIsExpanded(true)}
          className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors z-10"
          title={t('map.expand')}
        >
          <i className="ri-fullscreen-line text-gray-700 text-lg"></i>
        </button>
        
        {/* Supplier list overlay */}
      <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-3 max-h-32 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-700 mb-2">
          {t('map.suppliers_found', { count: suppliers.length })}
        </p>
        <div className="space-y-1">
          {suppliers.slice(0, 5).map((supplier) => {
            const isExact = !!(supplier.latitude && supplier.longitude);
            return (
              <div key={supplier.id} className="flex items-center gap-2 text-xs">
                <i className={`ri-map-pin-${isExact ? 'fill' : 'line'} ${isExact ? 'text-green-600' : 'text-yellow-600'}`}></i>
                <span className="truncate">{supplier.name}</span>
                {!isExact && (
                  <span className="text-gray-400 text-[10px]">({t('map.approximate')})</span>
                )}
              </div>
            );
          })}
          {suppliers.length > 5 && (
            <p className="text-xs text-gray-500">
              +{suppliers.length - 5} {t('map.more_suppliers')}
            </p>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <i className="ri-map-pin-fill text-green-600"></i>
          <span>{t('map.exact_location')}</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <i className="ri-map-pin-line text-yellow-600"></i>
          <span>{t('map.approximate_location')}</span>
        </div>
        <div className="flex items-center gap-2">
          <i className="ri-user-fill text-blue-500"></i>
          <span>{t('search.your_position')}</span>
        </div>
      </div>

      {/* Selected supplier popup */}
      {selectedSupplier && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-sm">{selectedSupplier.name}</h4>
            <button 
              onClick={() => setSelectedSupplier(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
          <p className="text-xs text-gray-600 mb-1">{selectedSupplier.category}</p>
          <p className="text-xs text-gray-500">{selectedSupplier.location}</p>
          <Link 
            to={`/supplier/${selectedSupplier.id}`}
            className="mt-2 text-xs text-green-600 hover:text-green-700 font-medium inline-flex items-center"
          >
            {t('supplier.see_details')} <i className="ri-arrow-right-line ml-1"></i>
          </Link>
        </div>
      )}
      </div>

      {/* Expanded Map Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('map.full_map_view')} - {suppliers.length} {t('map.suppliers')}
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="flex-1 relative">
              <ExpandedMapView 
                suppliers={suppliers} 
                userLocation={userLocation}
                onClose={() => setIsExpanded(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Expanded Map View Component for fullscreen modal
function ExpandedMapView({ 
  suppliers, 
  userLocation,
  onClose
}: { 
  suppliers: Supplier[]; 
  userLocation?: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const approximatedSuppliersRef = useRef(new Map<string, { lat: number; lng: number }>());

  const getApproximateCoordinates = (supplier: Supplier): { lat: number; lng: number } | null => {
    if (approximatedSuppliersRef.current.has(supplier.id)) {
      return approximatedSuppliersRef.current.get(supplier.id)!;
    }
    if (supplier.latitude && supplier.longitude) {
      const coords = { lat: supplier.latitude, lng: supplier.longitude };
      approximatedSuppliersRef.current.set(supplier.id, coords);
      return coords;
    }
    const locationParts = (supplier.location || '').split(',').map(p => p.trim()).filter(Boolean);
    const cityFromLocation = locationParts[0] || '';
    const stateFromLocation = locationParts[1] || '';
    const city = supplier.city || cityFromLocation;
    const state = supplier.state || stateFromLocation;
    const locationKey = `${city},${state},Nigeria`;
    const hash = locationKey.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0) | 0, 0);
    const locationCoords: Record<string, { lat: number; lng: number }> = {
      'lagos': { lat: 6.5244, lng: 3.3792 },
      'abuja': { lat: 9.0765, lng: 7.3986 },
      'fct': { lat: 9.0765, lng: 7.3986 },
      'ibadan': { lat: 7.3775, lng: 3.9470 },
      'port harcourt': { lat: 4.8156, lng: 7.0498 },
      'kano': { lat: 12.0022, lng: 8.5920 },
      'kaduna': { lat: 10.5105, lng: 7.4165 },
    };
    const searchKey = locationKey.toLowerCase();
    let baseCoords = locationCoords['lagos'] || { lat: 9.0820, lng: 8.6753 };
    for (const [key, coords] of Object.entries(locationCoords)) {
      if (searchKey.includes(key)) {
        baseCoords = coords;
        break;
      }
    }
    const offsetLat = (Math.abs(hash) % 500 - 250) / 10000;
    const offsetLng = (Math.abs(hash >> 8) % 500 - 250) / 10000;
    const approxCoords = { lat: baseCoords.lat + offsetLat, lng: baseCoords.lng + offsetLng };
    approximatedSuppliersRef.current.set(supplier.id, approxCoords);
    return approxCoords;
  };

  useEffect(() => {
    const initMap = async () => {
      if (mapRef.current && !mapInstanceRef.current) {
        const mapboxgl = await getMapboxgl();
        (mapboxgl as any).accessToken = MAPBOX_TOKEN;
        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [8.6753, 9.0820],
          zoom: 6,
          pitch: 45,
          bearing: -17.6,
          antialias: true
        });
        mapInstanceRef.current = map;
        map.on('load', () => {
          map.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });
          map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
          if (!map.getLayer('3d-buildings')) {
            map.addLayer({
              'id': '3d-buildings',
              'source': 'composite',
              'source-layer': 'building',
              'filter': ['==', 'extrude', 'true'],
              'type': 'fill-extrusion',
              'minzoom': 12,
              'paint': {
                'fill-extrusion-color': '#d4a574',
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.8,
                'fill-extrusion-vertical-gradient': true,
                'fill-extrusion-ambient-occlusion-intensity': 0.3
              }
            });
          }
          addSupplierMarkers();
        });
      }
    };
    initMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  const addSupplierMarkers = async () => {
    if (!mapInstanceRef.current) return;
    const mapboxgl = await getMapboxgl();
    suppliers.forEach(supplier => {
      const coords = getApproximateCoordinates(supplier);
      if (!coords) return;
      const isExact = supplier.latitude && supplier.longitude;
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.innerHTML = `
        <div class="w-10 h-10 ${isExact ? 'bg-green-600' : 'bg-yellow-500'} rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform border-3 border-white ring-2 ${isExact ? 'ring-green-400' : 'ring-yellow-300'}">
          <i class="ri-store-2-line text-white text-sm"></i>
        </div>
      `;
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, closeOnClick: false }).setHTML(
        `<div class="p-3 min-w-[200px]">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="font-semibold text-sm text-gray-900">${supplier.name}</h3>
            ${isExact ? '<span class="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Exact</span>' : '<span class="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Approximate</span>'}
          </div>
          <p class="text-xs text-gray-600 mb-1">${supplier.category}</p>
          <p class="text-xs text-gray-500">${supplier.location}</p>
          ${supplier.rating ? `<div class="flex items-center gap-1 mt-2"><i class="ri-star-fill text-yellow-500 text-xs"></i><span class="text-xs font-medium">${supplier.rating}</span></div>` : ''}
        </div>`
      );
      const marker = new mapboxgl.Marker(el).setLngLat([coords.lng, coords.lat]).setPopup(popup);
      if (mapInstanceRef.current) marker.addTo(mapInstanceRef.current);
      el.addEventListener('mouseenter', () => { if (mapInstanceRef.current) marker.togglePopup(); });
      el.addEventListener('mouseleave', () => { popup.remove(); });
      el.addEventListener('click', () => { setSelectedSupplier(supplier); });
      markersRef.current.push(marker);
    });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full bg-gray-100" />
      {selectedSupplier && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold">{selectedSupplier.name}</h4>
            <button onClick={() => setSelectedSupplier(null)} className="text-gray-400 hover:text-gray-600"><i className="ri-close-line"></i></button>
          </div>
          <p className="text-sm text-gray-600 mb-1">{selectedSupplier.category}</p>
          <p className="text-sm text-gray-500 mb-3">{selectedSupplier.location}</p>
          <Link to={`/supplier/${selectedSupplier.id}`} onClick={onClose} className="text-sm text-green-600 hover:text-green-700 font-medium inline-flex items-center">{t('supplier.see_details')} <i className="ri-arrow-right-line ml-1"></i></Link>
        </div>
      )}
    </div>
  );
}

export default function Search() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Search page is publicly accessible - no auth required

  const [products, setProducts] = useState<any[]>([]);
  const [allMapProducts, setAllMapProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [allSuppliersLoading, setAllSuppliersLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [mapSearchResults, setMapSearchResults] = useState<any>(null);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    query: searchParams.get('q') || '',
    distance: '50',
    rating: '',
    verified: false
  });
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const itemsPerPage = 20;

  const cityOptions = Array.from(new Set(products.flatMap(p => p.suppliers?.map((s: any) => s.location) || [])));
  const citySuggestions = ['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt']; // mock pop

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Request user's geolocation
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(t('search.location_not_supported'));
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(t('search.location_permission_denied'));
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(t('search.location_unavailable'));
            break;
          case error.TIMEOUT:
            setLocationError(t('search.location_timeout'));
            break;
          default:
            setLocationError(t('search.location_error'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Get coordinates for selected location to enable distance filtering (fallback)
  const getLocationCoords = (location: string): { lat: number; lng: number } | null => {
    if (!location) return null;
    
    const locationLower = location.toLowerCase();
    
    const locationCoords: Record<string, { lat: number; lng: number }> = {
      'lagos': { lat: 6.5244, lng: 3.3792 },
      'abuja': { lat: 9.0765, lng: 7.3986 },
      'fct': { lat: 9.0765, lng: 7.3986 },
      'ibadan': { lat: 7.3775, lng: 3.9470 },
      'port harcourt': { lat: 4.8156, lng: 7.0498 },
      'kano': { lat: 12.0022, lng: 8.5920 },
      'kaduna': { lat: 10.5105, lng: 7.4165 },
      'enugu': { lat: 6.5244, lng: 7.5186 },
      'benin': { lat: 6.3350, lng: 5.6037 },
      'jos': { lat: 9.8965, lng: 8.8583 },
      'ilorin': { lat: 8.4799, lng: 4.5418 },
      'aba': { lat: 5.1066, lng: 7.3667 },
      'calabar': { lat: 4.9757, lng: 8.3417 },
      'owerri': { lat: 5.4836, lng: 7.0333 },
      'akure': { lat: 7.2571, lng: 5.2058 },
      'ife': { lat: 7.4825, lng: 4.5603 },
      'lokoja': { lat: 7.8023, lng: 6.7430 },
      'makurdi': { lat: 7.7337, lng: 8.5333 },
      'minna': { lat: 9.6139, lng: 6.5569 },
      'sokoto': { lat: 13.0059, lng: 5.2476 },
      'maiduguri': { lat: 11.8469, lng: 13.1571 },
      'yola': { lat: 9.2035, lng: 12.4954 },
      'bauchi': { lat: 10.3157, lng: 9.8434 },
      'gombe': { lat: 10.2897, lng: 11.1711 },
      'damaturu': { lat: 11.7470, lng: 11.9608 },
      'jalingo': { lat: 8.8937, lng: 11.3590 },
      'dutse': { lat: 11.7591, lng: 9.3230 },
      'birnin kebbi': { lat: 12.4539, lng: 4.1975 },
      'awka': { lat: 6.2100, lng: 7.0700 },
      'yenegoa': { lat: 4.9247, lng: 6.2640 },
      'asaba': { lat: 6.2000, lng: 6.7333 },
      'abakaliki': { lat: 6.3249, lng: 8.1137 },
      'ado ekiti': { lat: 7.6213, lng: 5.2210 },
      'abeokuta': { lat: 7.1475, lng: 3.3619 },
      'akwa ibom': { lat: 5.0000, lng: 7.8333 },
      'uyo': { lat: 5.0333, lng: 7.9167 },
      'ikeja': { lat: 6.5965, lng: 3.3421 },
      'lekki': { lat: 6.4698, lng: 3.5852 },
      'yaba': { lat: 6.5000, lng: 3.3667 },
      'surulere': { lat: 6.5000, lng: 3.3500 },
      'apapa': { lat: 6.4500, lng: 3.3667 },
      'oshodi': { lat: 6.5500, lng: 3.3500 },
      'ikoyi': { lat: 6.4500, lng: 3.4333 },
      'victoria island': { lat: 6.4333, lng: 3.4167 },
      'vi': { lat: 6.4333, lng: 3.4167 },
    };
    
    for (const [key, coords] of Object.entries(locationCoords)) {
      if (locationLower.includes(key)) {
        return coords;
      }
    }
    
    return null;
  };

  const handleScrollToResults = () => {
    setTimeout(()=>{
      document.getElementById('resultSection')?.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  // Use user's location if available, otherwise fall back to selected city coordinates
  const effectiveLocationCoords = userLocation || getLocationCoords(filters.location);
  
  // Setup action for product search
  const searchProductsAction = useAction(api.productSearch.searchProductsMultilingual);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Perform search when filters change
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      setPaginationLoading(currentPage > 0);
      
      try {
        const result = await withTimeout(
          searchProductsAction({
            q: filters.query || undefined,
            category: filters.category || undefined,
            limit: BigInt(itemsPerPage),
            offset: BigInt(currentPage * itemsPerPage),
            sortBy: sortBy === 'relevance' ? 'relevance' : sortBy === 'alpha_asc' ? 'price_asc' : sortBy === 'alpha_desc' ? 'price_desc' : 'relevance',
          }),
          30000, // 30 second timeout
          t('search.timeout_error')
        );
        setSearchResults(result);
      } catch (error) {
        console.error('Search error:', error);
        setSearchError(error instanceof Error ? error.message : 'Erreur lors de la recherche');
      } finally {
        setLoading(false);
        setPaginationLoading(false);
      }
    };
    
    void performSearch();
  }, [filters, currentPage, sortBy]);
  
  // Perform map search when viewMode changes to map
  useEffect(() => {
    if (viewMode !== 'map') return;
    
    const performMapSearch = async () => {
      setAllSuppliersLoading(true);
      
      try {
        // Hard cap for map view to prevent huge payloads + thousands of DOM markers
        // Increased from 500 to 5000 to show more suppliers on map
        const MAP_RESULTS_LIMIT = 5000;

        const result = await withTimeout(
          searchProductsAction({
            q: filters.query || undefined,
            category: filters.category || undefined,
            limit: BigInt(MAP_RESULTS_LIMIT),
            offset: BigInt(0),
            sortBy: sortBy === 'relevance' ? 'relevance' : sortBy === 'alpha_asc' ? 'price_asc' : sortBy === 'alpha_desc' ? 'price_desc' : 'relevance',
          }),
          30000,
          t('search.map_timeout_error')
        );
        setMapSearchResults(result);
      } catch (error) {
        console.error('Map search error:', error);
      } finally {
        setAllSuppliersLoading(false);
      }
    };
    
    void performMapSearch();
  }, [viewMode, filters, sortBy]);

  // Process paginated products for list view
  useEffect(() => {
    if (!searchResults) return;
    const productList = (searchResults.products || []).map((p: any) => ({
      id: p._id as string,
      name: p.name ?? '',
      description: p.description ?? p.shortDescription ?? '',
      price: p.price,
      category: p.category ?? '',
      images: p.images || [],
      relevanceScore: p.relevanceScore ?? 0,
      suppliers: (p.suppliers || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        rating: s.rating ?? 0,
        review_count: s.reviews_count ?? 0,
        verified: !!s.verified,
        location: [s.city, s.state].filter(Boolean).join(', '),
        category: s.category ?? '',
        matchScore: s.matchScore ?? 0,
        matchConfidence: s.matchConfidence ?? 'medium',
      })),
      totalSuppliers: p.totalSuppliers ?? 0,
    }));
    setProducts(productList);
    setTotalCount(searchResults.total ?? productList.length);
    // Scroll to results after loading completes
    if (!loading && productList.length > 0) {
      handleScrollToResults();
    }
  }, [searchResults, loading, currentPage]);
  
  // Process ALL products for map view (no pagination)
  useEffect(() => {
    if (!mapSearchResults) return;
    const allList = (mapSearchResults.products || []).map((p: any) => ({
      id: p._id as string,
      name: p.name ?? '',
      description: p.description ?? p.shortDescription ?? '',
      price: p.price,
      category: p.category ?? '',
      images: p.images || [],
      relevanceScore: p.relevanceScore ?? 0,
      suppliers: (p.suppliers || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        rating: s.rating ?? 0,
        review_count: s.reviews_count ?? 0,
        verified: !!s.verified,
        location: [s.city, s.state].filter(Boolean).join(', '),
        category: s.category ?? '',
        matchScore: s.matchScore ?? 0,
        matchConfidence: s.matchConfidence ?? 'medium',
      })),
      totalSuppliers: p.totalSuppliers ?? 0,
    }));
    setAllMapProducts(allList);
  }, [mapSearchResults]);

  useEffect(() => {
    setCurrentPage(0); // Reset to first page when filters change
  }, [filters, sortBy]);

  // Cache categories with longer stale time
  const { data: categories } = useConvexQuery(
    api.categories.getAllCategories,
    {},
    { staleTime: 15 * 60 * 1000 } // 15 minutes
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" id="resultSection">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Filters - Desktop: Always visible, Mobile: Collapsible */}
          <div className={`lg:w-1/4 ${showFiltersMobile ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl shadow-soft p-4 sm:p-6 lg:sticky lg:top-24 border border-gray-100">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h3 className="font-bold text-base sm:text-lg flex items-center">
                  <i className="ri-filter-3-line mr-2 text-green-600"></i>
                  {t('search.filters')}
                </h3>
                <button
                  onClick={() => setFilters({category: '', location: '', query: '', distance: '50', rating: '', verified: false})}
                  className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  {t('filter.clear')}
                </button>
              </div>
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="ri-search-line mr-1"></i>
                  {t('search.title')}
                </label>
                <input
                  type="text"
                  value={filters.query}
                  onChange={(e) => setFilters({...filters, query: e.target.value})}
                  placeholder={t('search.placeholder')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm outline-none"
                />
                {!filters.query && (
                  <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-2">
                    {t('search.suggestions')}
                    {citySuggestions.map(c => (
                      <button key={c} className="underline text-green-700 hover:text-green-900 px-2"
                        onClick={()=>setFilters({...filters, query: c})}>{c}</button>
                    ))}
                    {categories && categories.slice(0,2).map((cat: any) => (
                      <button key={cat._id} className="underline text-blue-700 hover:text-blue-900 px-2"
                        onClick={()=>setFilters({...filters, category: cat.name})}>{cat.name}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* City/state combo */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="ri-map-pin-line mr-1"></i>
                  {t('filter.city')}
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm pr-10 outline-none"
                >
                  <option value="">{t('filter.all_cities')}</option>
                  {cityOptions.filter(Boolean).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                  {cityOptions.length === 0 && citySuggestions.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-600 mt-1">{t('filter.by_city')}</div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="ri-list-check mr-1"></i>
                  {t('filter.category')}
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm pr-10 outline-none"
                >
                  <option value="">{t('filter.all_categories')}</option>
                  {categories?.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-600 mt-1">{t('filter.by_category')}</div>
              </div>

              {/* Distance */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('filter.max_distance')}
                </label>
                
                {/* User location button */}
                <div className="mb-3">
                  {!userLocation ? (
                    <button
                      onClick={requestUserLocation}
                      disabled={locationLoading}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      {locationLoading ? (
                        <>
                          <i className="ri-loader-4-line animate-spin"></i>
                          <span>{t('search.locating')}</span>
                        </>
                      ) : (
                        <>
                          <i className="ri-crosshair-line"></i>
                          <span>{t('search.use_my_location')}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center justify-between px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
                      <span className="flex items-center gap-2">
                        <i className="ri-map-pin-fill"></i>
                        <span>{t('search.my_location')}</span>
                      </span>
                      <button
                        onClick={() => setUserLocation(null)}
                        className="text-green-600 hover:text-green-800"
                        title={t('search.reset')}
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                  )}
                  {locationError && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <i className="ri-error-warning-line"></i>
                      {locationError}
                    </p>
                  )}
                </div>

                <select
                  value={filters.distance}
                  onChange={(e) => setFilters({...filters, distance: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm pr-8"
                >
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                  <option value="50">50 km</option>
                  <option value="100">100 km</option>
                </select>
                <div className="text-xs text-gray-600 mt-1">
                  {userLocation 
                    ? t('search.distance_from')
                    : filters.location 
                      ? t('search.distance_from_location', { location: filters.location })
                      : t('search.select_city_or_use_position')
                  }
                </div>
              </div>

              {/* Minimum rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('filter.min_rating')}
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters({...filters, rating: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm pr-8"
                >
                  <option value="">{t('filter.all_ratings')}</option>
                  <option value="4">4+ {t('filter.stars')}</option>
                  <option value="4.5">4.5+ {t('filter.stars')}</option>
                  <option value="4.8">4.8+ {t('filter.stars')}</option>
                </select>
                <div className="text-xs text-gray-600 mt-1">{t('filter.by_rating')}</div>
              </div>

              <button
                onClick={() => setFilters({category: '', location: '', query: '', distance: '50', rating: '', verified: false})}
                className="w-full text-green-600 hover:text-green-700 text-sm font-medium"
              >
                {t('filter.reset')}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:w-3/4">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                className="w-full bg-white rounded-xl shadow-soft border border-gray-100 p-3 flex items-center justify-between"
              >
                <span className="font-medium text-gray-700 flex items-center">
                  <i className="ri-filter-3-line mr-2 text-green-600"></i>
                  {showFiltersMobile ? t('search.hide_filters') : t('search.show_filters')}
                </span>
                <i className={`ri-arrow-${showFiltersMobile ? 'up' : 'down'}-line text-gray-400`}></i>
              </button>
            </div>

            {/* Results header */}
            <div className="bg-white rounded-2xl shadow-soft p-6 mb-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {t('search.results_title')}
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base flex items-center flex-wrap gap-2">
                    {loading ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        {t('search.loading')}
                      </>
                    ) : (
                      <>
                        <i className="ri-checkbox-circle-line text-green-600 mr-2"></i>
                        {totalCount === 0 ? (
                          <>0 {t('search.products')} {t('search.results')}</>
                        ) : (
                          <>
                            {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, totalCount)}/{totalCount} {t('search.products')}
                          </>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="flex bg-gray-100 rounded-xl p-1.5 shadow-sm">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'list'
                          ? 'bg-white text-gray-900 shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <i className="ri-list-unordered mr-2"></i>
                      <span className="hidden sm:inline">{t('view.list')}</span>
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'map'
                          ? 'bg-white text-gray-900 shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <i className="ri-map-pin-line mr-2"></i>
                      <span className="hidden sm:inline">{t('view.map')}</span>
                    </button>
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm pr-10 outline-none"
                  >
                    <option value="alpha_asc">{t('search.sort.alpha_asc')}</option>
                    <option value="alpha_desc">{t('search.sort.alpha_desc')}</option>
                    <option value="relevance">{t('search.sort.relevance')}</option>
                    <option value="distance">{t('search.sort.distance')}</option>
                    <option value="rating">{t('search.sort.rating')}</option>
                    <option value="reviews">{t('results.reviews')}</option>
                  </select>
                </div>
              </div>
            </div>

            {searchError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-red-700">
                  <i className="ri-error-warning-line"></i>
                  <span>{searchError}</span>
                  <button 
                    onClick={() => setSearchError(null)}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'map' && (
              <div className="bg-white rounded-lg shadow-sm mb-6 h-64 sm:h-96 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center text-gray-500">
                    <i className="ri-map-pin-line text-4xl mb-2"></i>
                    <p>{t('search.map_view_unavailable')}</p>
                  </div>
                </div>
              </div>
            )}

            {loading || paginationLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-16 sm:w-24 h-16 sm:h-24 bg-gray-200 rounded-lg flex-shrink-0 shimmer"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 shimmer"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4 mb-2 shimmer"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 shimmer"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {products.map((product: any) => {
                  const productId = product.id;
                  const mainSupplier = product.suppliers?.[0];
                                
                  return (
                    <div key={productId} className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 border border-gray-100 hover:-translate-y-1">
                      <div className="p-6">
                        <div className="flex gap-6">
                          <div className="w-20 sm:w-28 h-20 sm:h-28 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                            {product.images?.[0] ? (
                              <img 
                                src={product.images[0]} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                <i className="ri-box-3-line text-3xl text-gray-400"></i>
                              </div>
                            )}
                          </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                                <span className="truncate">{product.name}</span>
                              </h3>
                              <p className="text-green-600 text-sm font-semibold flex items-center">
                                <i className="ri-price-tag-3-line mr-1"></i>
                                {product.category}
                                {product.price && (
                                  <span className="ml-3 text-gray-700">₦{product.price.toLocaleString()}</span>
                                )}
                              </p>
                            </div>
                            <div className="text-right ml-2 flex-shrink-0">
                              <div className="flex items-center gap-1.5 mb-1 bg-gradient-to-br from-blue-50 to-indigo-50 px-3 py-2 rounded-xl border border-blue-200">
                                <i className="ri-store-2-line text-blue-500 text-sm"></i>
                                <div className="font-bold text-sm text-gray-900">{product.totalSuppliers}</div>
                                <div className="text-gray-500 text-xs">{t('search.suppliers')}</div>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                          
                          {/* Suppliers list */}
                          {product.suppliers && product.suppliers.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('search.available_from')}:</p>
                              <div className="flex flex-wrap gap-2">
                                {product.suppliers.slice(0, 3).map((s: any) => (
                                  <Link
                                    key={s.id}
                                    to={`/supplier/${s.id}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    {s.verified && <i className="ri-verified-badge-fill text-green-500"></i>}
                                    <span className="truncate max-w-[120px]">{s.name}</span>
                                    {s.rating > 0 && (
                                      <span className="flex items-center text-yellow-600">
                                        <i className="ri-star-fill text-[10px]"></i>
                                        {s.rating}
                                      </span>
                                    )}
                                  </Link>
                                ))}
                                {product.suppliers.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-500">
                                    +{product.suppliers.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => (document.querySelector('#vapi-widget-floating-button') as HTMLElement | null)?.click()}
                                className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                                title={t('search.make_appointment')}
                              >
                                <i className="ri-calendar-line text-base sm:text-lg"></i>
                              </button>
                            </div>
                            <Link
                              to={`/product/${product.id}`}
                              className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                            >
                              {t('search.view_details')}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

            {!loading && products.length > 0 && (
              <div className="mt-8 flex flex-col items-center gap-4">
                {/* Total count */}
                <p className="text-sm text-gray-600">
                  {t('search.total_products', { count: totalCount })}
                </p>
                
                <div className="flex justify-center">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <i className="ri-arrow-left-line"></i>
                    </button>
                    
                    {Array.from({ length: Math.min(5, Math.ceil(totalCount / itemsPerPage)) }, (_, i) => {
                      const totalPages = Math.ceil(totalCount / itemsPerPage);
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (currentPage < 3) {
                        pageNum = i;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            currentPage === pageNum
                              ? 'bg-green-600 text-white'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / itemsPerPage) - 1, p + 1))}
                      disabled={currentPage >= Math.ceil(totalCount / itemsPerPage) - 1}
                      className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <i className="ri-arrow-right-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
