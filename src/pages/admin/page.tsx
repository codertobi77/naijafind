import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useConvexAuth } from 'convex/react';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { useTranslation } from 'react-i18next';
import useCurrency from '../../hooks/useCurrency';
import type { Id } from 'convex/values';
import type { Doc } from 'convex/values';
import { SupplierBulkImport, ProductBulkImport } from '../../components/admin';
import { useNotifications } from '../../hooks/useNotifications';
import { useToast } from '../../hooks/useToast';
import { ToastContainer, NotificationDropdown } from '../../components/base';
import { LogoLink } from '../../components/base/Logo';
import AdBannerManager from '../../components/admin/AdBannerManager';

// Define proper TypeScript interfaces based on Convex data model
type Supplier = Doc<"suppliers">;
type Category = Doc<"categories">;

// Types

// Common Remix Icon names for autocomplete
const COMMON_REMIX_ICONS = [
  'ri-home-line', 'ri-home-fill', 'ri-building-line', 'ri-building-fill',
  'ri-store-line', 'ri-store-fill', 'ri-restaurant-line', 'ri-restaurant-fill',
  'ri-hotel-bed-line', 'ri-hotel-bed-fill', 'ri-hospital-line', 'ri-hospital-fill',
  'ri-school-line', 'ri-school-fill', 'ri-bank-line', 'ri-bank-fill',
  'ri-shopping-bag-line', 'ri-shopping-bag-fill', 'ri-shopping-cart-line', 'ri-shopping-cart-fill',
  'ri-car-line', 'ri-car-fill', 'ri-truck-line', 'ri-truck-fill',
  'ri-plane-line', 'ri-plane-fill', 'ri-train-line', 'ri-train-fill',
  'ri-phone-line', 'ri-phone-fill', 'ri-mail-line', 'ri-mail-fill',
  'ri-map-pin-line', 'ri-map-pin-fill', 'ri-global-line', 'ri-global-fill',
  'ri-computer-line', 'ri-computer-fill', 'ri-smartphone-line', 'ri-smartphone-fill',
  'ri-wifi-line', 'ri-wifi-fill', 'ri-cloud-line', 'ri-cloud-fill',
  'ri-tools-line', 'ri-tools-fill', 'ri-hammer-line', 'ri-hammer-fill',
  'ri-paint-brush-line', 'ri-paint-brush-fill', 'ri-palette-line', 'ri-palette-fill',
  'ri-music-line', 'ri-music-fill', 'ri-movie-line', 'ri-movie-fill',
  'ri-gamepad-line', 'ri-gamepad-fill', 'ri-book-line', 'ri-book-fill',
  'ri-graduation-cap-line', 'ri-graduation-cap-fill', 'ri-award-line', 'ri-award-fill',
  'ri-trophy-line', 'ri-trophy-fill', 'ri-medal-line', 'ri-medal-fill',
  'ri-heart-line', 'ri-heart-fill', 'ri-star-line', 'ri-star-fill',
  'ri-user-line', 'ri-user-fill', 'ri-team-line', 'ri-team-fill',
  'ri-customer-service-line', 'ri-customer-service-fill',
  'ri-settings-line', 'ri-settings-fill', 'ri-dashboard-line', 'ri-dashboard-fill',
  'ri-bar-chart-line', 'ri-bar-chart-fill', 'ri-pie-chart-line', 'ri-pie-chart-fill',
  'ri-calendar-line', 'ri-calendar-fill', 'ri-time-line', 'ri-time-fill',
  'ri-notification-line', 'ri-notification-fill', 'ri-mail-unread-line', 'ri-mail-unread-fill',
  'ri-search-line', 'ri-search-fill', 'ri-filter-line', 'ri-filter-fill',
  'ri-sort-asc', 'ri-sort-desc', 'ri-arrow-up-line', 'ri-arrow-down-line',
  'ri-add-line', 'ri-subtract-line', 'ri-close-line', 'ri-check-line',
  'ri-edit-line', 'ri-edit-fill', 'ri-delete-bin-line', 'ri-delete-bin-fill',
  'ri-save-line', 'ri-save-fill', 'ri-download-line', 'ri-download-fill',
  'ri-upload-line', 'ri-upload-fill', 'ri-share-line', 'ri-share-fill',
  'ri-printer-line', 'ri-printer-fill', 'ri-file-list-line', 'ri-file-list-fill',
  'ri-clipboard-line', 'ri-clipboard-fill', 'ri-folder-line', 'ri-folder-fill',
  'ri-image-line', 'ri-image-fill', 'ri-gallery-line', 'ri-gallery-fill',
  'ri-camera-line', 'ri-camera-fill', 'ri-video-line', 'ri-video-fill',
  'ri-mic-line', 'ri-mic-fill', 'ri-voiceprint-line', 'ri-voiceprint-fill',
  'ri-lock-line', 'ri-lock-fill', 'ri-unlock-line', 'ri-unlock-fill',
  'ri-key-line', 'ri-key-fill', 'ri-shield-line', 'ri-shield-fill',
  'ri-error-warning-line', 'ri-error-warning-fill', 'ri-question-line', 'ri-question-fill',
  'ri-information-line', 'ri-information-fill', 'ri-alert-line', 'ri-alert-fill',
  'ri-flashlight-line', 'ri-flashlight-fill', 'ri-flash-line', 'ri-flash-fill',
  'ri-sun-line', 'ri-sun-fill', 'ri-moon-line', 'ri-moon-fill',
  'ri-drop-line', 'ri-drop-fill', 'ri-oil-line', 'ri-oil-fill',
  'ri-fire-line', 'ri-fire-fill', 'ri-water-flash-line', 'ri-water-flash-fill',
  'ri-seedling-line', 'ri-seedling-fill', 'ri-leaf-line', 'ri-leaf-fill',
  'ri-tree-line', 'ri-tree-fill', 'ri-plant-line', 'ri-plant-fill',
  'ri-recycle-line', 'ri-recycle-fill', 'ri-earth-line', 'ri-earth-fill',
  'ri-magic-line', 'ri-magic-fill', 'ri-sparkling-line', 'ri-sparkling-fill',
  'ri-gift-line', 'ri-gift-fill', 'ri-coupon-line', 'ri-coupon-fill',
  'ri-vip-crown-line', 'ri-vip-crown-fill', 'ri-vip-diamond-line', 'ri-vip-diamond-fill',
  'ri-currency-line', 'ri-currency-fill', 'ri-coins-line', 'ri-coins-fill',
  'ri-wallet-line', 'ri-wallet-fill', 'ri-bank-card-line', 'ri-bank-card-fill',
  'ri-safe-line', 'ri-safe-fill', 'ri-hand-coin-line', 'ri-hand-coin-fill',
  'ri-exchange-dollar-line', 'ri-exchange-dollar-fill', 'ri-funds-line', 'ri-funds-fill',
  'ri-stock-line', 'ri-stock-fill', 'ri-auction-line', 'ri-auction-fill',
  'ri-scales-line', 'ri-scales-fill', 'ri-auction-fill', 'ri-gavel-line',
  'ri-brush-line', 'ri-brush-fill', 'ri-pencil-line', 'ri-pencil-fill',
  'ri-quill-pen-line', 'ri-quill-pen-fill', 'ri-mark-pen-line', 'ri-mark-pen-fill',
  'ri-scissors-line', 'ri-scissors-fill', 'ri-scissors-cut-line', 'ri-scissors-cut-fill',
  'ri-ruler-line', 'ri-ruler-fill', 'ri-compasses-line', 'ri-compasses-fill',
  'ri-drag-move-line', 'ri-drag-move-fill', 'ri-drag-drop-line', 'ri-drag-drop-fill',
  'ri-focus-line', 'ri-focus-fill', 'ri-focus-2-line', 'ri-focus-2-fill',
  'ri-crop-line', 'ri-crop-fill', 'ri-contrast-line', 'ri-contrast-fill',
  'ri-brightness-line', 'ri-brightness-fill', 'ri-eye-line', 'ri-eye-fill',
  'ri-eye-off-line', 'ri-eye-off-fill', 'ri-glasses-line', 'ri-glasses-fill',
  'ri-sunglasses-line', 'ri-sunglasses-fill', 'ri-run-line', 'ri-run-fill',
  'ri-walk-line', 'ri-walk-fill', 'ri-bike-line', 'ri-bike-fill',
  'ri-swimming-pool-line', 'ri-swimming-pool-fill', 'ri-basketball-line', 'ri-basketball-fill',
  'ri-football-line', 'ri-football-fill', 'ri-volleyball-line', 'ri-volleyball-fill',
  'ri-boxing-line', 'ri-boxing-fill', 'ri-dumbbell-line', 'ri-dumbbell-fill',
  'ri-fitness-center-line', 'ri-fitness-center-fill', 'ri-yoga-line', 'ri-yoga-fill',
  'ri-mental-health-line', 'ri-mental-health-fill', 'ri-first-aid-kit-line', 'ri-first-aid-kit-fill',
  'ri-medicine-bottle-line', 'ri-medicine-bottle-fill', 'ri-capsule-line', 'ri-capsule-fill',
  'ri-surgical-mask-line', 'ri-surgical-mask-fill', 'ri-thermometer-line', 'ri-thermometer-fill',
  'ri-heart-pulse-line', 'ri-heart-pulse-fill', 'ri-mental-health-line', 'ri-mental-health-fill',
  'ri-service-line', 'ri-service-fill', 'ri-customer-service-2-line', 'ri-customer-service-2-fill',
  'ri-robot-line', 'ri-robot-fill', 'ri-brain-line', 'ri-brain-fill',
  'ri-lightbulb-line', 'ri-lightbulb-fill', 'ri-lightbulb-flash-line', 'ri-lightbulb-flash-fill',
  'ri-flashlight-line', 'ri-flashlight-fill', 'ri-lamp-line', 'ri-lamp-fill',
  'ri-candle-line', 'ri-candle-fill', 'ri-firework-line', 'ri-firework-fill',
  'ri-confetti-line', 'ri-confetti-fill', 'ri-balloon-line', 'ri-balloon-fill',
  'ri-music-2-line', 'ri-music-2-fill', 'ri-headphone-line', 'ri-headphone-fill',
  'ri-speaker-line', 'ri-speaker-fill', 'ri-volume-up-line', 'ri-volume-up-fill',
  'ri-volume-down-line', 'ri-volume-down-fill', 'ri-volume-mute-line', 'ri-volume-mute-fill',
  'ri-play-line', 'ri-play-fill', 'ri-pause-line', 'ri-pause-fill',
  'ri-stop-line', 'ri-stop-fill', 'ri-skip-back-line', 'ri-skip-back-fill',
  'ri-skip-forward-line', 'ri-skip-forward-fill', 'ri-shuffle-line', 'ri-shuffle-fill',
  'ri-repeat-line', 'ri-repeat-fill', 'ri-repeat-one-line', 'ri-repeat-one-fill',
  'ri-play-list-line', 'ri-play-list-fill', 'ri-play-list-add-line', 'ri-play-list-add-fill',
  'ri-mic-2-line', 'ri-mic-2-fill', 'ri-disc-line', 'ri-disc-fill',
  'ri-album-line', 'ri-album-fill', 'ri-dvd-line', 'ri-dvd-fill',
  'ri-clapperboard-line', 'ri-clapperboard-fill', 'ri-film-line', 'ri-film-fill',
  'ri-article-line', 'ri-article-fill', 'ri-newspaper-line', 'ri-newspaper-fill',
  'ri-broadcast-line', 'ri-broadcast-fill', 'ri-live-line', 'ri-live-fill',
  'ri-record-circle-line', 'ri-record-circle-fill', 'ri-webcam-line', 'ri-webcam-fill',
  'ri-slideshow-line', 'ri-slideshow-fill', 'ri-presentation-line', 'ri-presentation-fill',
  'ri-stack-line', 'ri-stack-fill', 'ri-layers-line', 'ri-layers-fill',
  'ri-layout-line', 'ri-layout-fill', 'ri-layout-grid-line', 'ri-layout-grid-fill',
  'ri-layout-masonry-line', 'ri-layout-masonry-fill', 'ri-dashboard-line', 'ri-dashboard-fill',
  'ri-window-line', 'ri-window-fill', 'ri-door-line', 'ri-door-fill',
  'ri-archive-line', 'ri-archive-fill', 'ri-archive-drawer-line', 'ri-archive-drawer-fill',
  'ri-drawer-line', 'ri-drawer-fill', 'ri-cupboard-line', 'ri-cupboard-fill',
  'ri-fridge-line', 'ri-fridge-fill', 'ri-washing-machine-line', 'ri-washing-machine-fill',
  'ri-t-shirt-line', 'ri-t-shirt-fill', 'ri-t-shirt-air-line', 'ri-t-shirt-air-fill',
  'ri-shirt-line', 'ri-shirt-fill', 'ri-handbag-line', 'ri-handbag-fill',
  'ri-backpack-line', 'ri-backpack-fill', 'ri-luggage-cart-line', 'ri-luggage-cart-fill',
  'ri-suitcase-line', 'ri-suitcase-fill', 'ri-briefcase-line', 'ri-briefcase-fill',
  'ri-suitcase-2-line', 'ri-suitcase-2-fill', 'ri-suitcase-3-line', 'ri-suitcase-3-fill',
  'ri-passport-line', 'ri-passport-fill', 'ri-ticket-line', 'ri-ticket-fill',
  'ri-vip-line', 'ri-vip-fill', 'ri-poker-hearts-line', 'ri-poker-hearts-fill',
  'ri-poker-clubs-line', 'ri-poker-clubs-fill', 'ri-poker-diamonds-line', 'ri-poker-diamonds-fill',
  'ri-poker-spades-line', 'ri-poker-spades-fill', 'ri-dice-line', 'ri-dice-fill',
  'ri-billiards-line', 'ri-billiards-fill', 'ri-footprint-line', 'ri-footprint-fill',
  'ri-paw-print-line', 'ri-paw-print-fill', 'ri-bug-line', 'ri-bug-fill',
  'ri-bug-2-line', 'ri-bug-2-fill', 'ri-spider-line', 'ri-spider-fill',
  'ri-bear-smile-line', 'ri-bear-smile-fill', 'ri-ghost-line', 'ri-ghost-fill',
  'ri-ghost-smile-line', 'ri-ghost-smile-fill', 'ri-robot-2-line', 'ri-robot-2-fill',
  'ri-aliens-line', 'ri-aliens-fill', 'ri-space-ship-line', 'ri-space-ship-fill',
  'ri-planet-line', 'ri-planet-fill', 'ri-sun-cloudy-line', 'ri-sun-cloudy-fill',
  'ri-moon-cloudy-line', 'ri-moon-cloudy-fill', 'ri-temp-hot-line', 'ri-temp-hot-fill',
  'ri-temp-cold-line', 'ri-temp-cold-fill', 'ri-windy-line', 'ri-windy-fill',
  'ri-showers-line', 'ri-showers-fill', 'ri-heavy-showers-line', 'ri-heavy-showers-fill',
  'ri-thunderstorms-line', 'ri-thunderstorms-fill', 'ri-hail-line', 'ri-hail-fill',
  'ri-snowy-line', 'ri-snowy-fill', 'ri-foggy-line', 'ri-foggy-fill',
  'ri-cloudy-line', 'ri-cloudy-fill', 'ri-cloud-windy-line', 'ri-cloud-windy-fill',
  'ri-sun-foggy-line', 'ri-sun-foggy-fill', 'ri-moon-foggy-line', 'ri-moon-foggy-fill',
  'ri-flashlight-line', 'ri-flashlight-fill', 'ri-landscape-line', 'ri-landscape-fill',
  'ri-gallery-upload-line', 'ri-gallery-upload-fill', 'ri-gallery-download-line', 'ri-gallery-download-fill',
];

// Icon Autocomplete Component
function IconAutocomplete({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [filteredIcons, setFilteredIcons] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const term = searchTerm.toLowerCase().replace(/ri-/g, '').replace(/-line/g, '').replace(/-fill/g, '');
    if (term.length > 0) {
      const filtered = COMMON_REMIX_ICONS.filter(icon =>
        icon.toLowerCase().includes(term) ||
        icon.replace(/ri-/g, '').replace(/-line/g, '').replace(/-fill/g, '').includes(term)
      ).slice(0, 10);
      setFilteredIcons(filtered);
    } else {
      setFilteredIcons(COMMON_REMIX_ICONS.slice(0, 8));
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (icon: string) => {
    onChange(icon);
    setSearchTerm(icon);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);
    onChange(val);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          placeholder={placeholder || "Search icons..."}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {value && <i className={`${value} text-lg`}></i>}
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 text-xs text-gray-500 border-b border-gray-100">
            {filteredIcons.length} icons found
          </div>
          {filteredIcons.map((icon) => (
            <button
              key={icon}
              onClick={() => handleSelect(icon)}
              className="w-full px-3 py-2 flex items-center gap-3 hover:bg-green-50 transition-colors text-left"
            >
              <i className={`${icon} text-xl text-gray-600`}></i>
              <span className="text-sm text-gray-700">{icon}</span>
              {value === icon && (
                <i className="ri-check-line text-green-500 ml-auto"></i>
              )}
            </button>
          ))}
          {filteredIcons.length === 0 && (
            <div className="px-3 py-4 text-center text-gray-500 text-sm">
              No icons found. Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Category Image Input Component with Upload/URL toggle
function CategoryImageInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [mode, setMode] = useState<'url' | 'upload'>(value && !value.startsWith('data:') ? 'url' : 'upload');
  const [preview, setPreview] = useState<string>(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(value || '');
    if (value && !value.startsWith('data:')) {
      setMode('url');
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onChange(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPreview(url);
    onChange(url);
  };

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            mode === 'url'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <i className="ri-link mr-1"></i>
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            mode === 'upload'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <i className="ri-upload-cloud-2-line mr-1"></i>
          Upload
        </button>
      </div>

      {/* Input based on mode */}
      {mode === 'url' ? (
        <input
          type="text"
          value={value || ''}
          onChange={handleUrlChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          placeholder="https://example.com/image.jpg"
        />
      ) : (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-sm text-gray-600"
          >
            <i className="ri-upload-cloud-line text-xl mb-1 block"></i>
            Click to upload image
          </button>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative w-24 h-24">
          <img
            src={preview}
            alt="Category preview"
            className="w-full h-full object-cover rounded-lg border border-gray-200"
            onError={() => setPreview('')}
          />
          <button
            type="button"
            onClick={() => {
              setPreview('');
              onChange('');
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      )}
    </div>
  );
}

// Add ConfirmationModal component
function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  isDanger = false
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}) {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  const confirmButtonClass = isDanger
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-green-600 hover:bg-green-700 text-white";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {title}
            </h3>
            <button 
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {cancelLabel || t('admin.cancel')}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg ${confirmButtonClass}`}
            >
              {confirmLabel || t('admin.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function AdminPage(){
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { data: meData } = useConvexQuery(
    api.users.me,
    {},
    { staleTime: 2 * 60 * 1000 } // Cache user data for 2 minutes
  );
  const { data: pendingSuppliers, refetch: refetchPendingSuppliers } = useConvexQuery(
    api.admin.getPendingSuppliers,
    {},
    { staleTime: 2 * 60 * 1000 }
  );
  const { data: allSuppliers, isLoading: suppliersLoading, refetch: refetchAllSuppliers } = useConvexQuery(
    api.suppliers.getFilteredSuppliers,
    {
      approved: supplierFilters.approved,
      featured: supplierFilters.featured,
      category: supplierFilters.category || undefined,
      searchQuery: supplierFilters.searchQuery || undefined,
      limit: 500,
    },
    { staleTime: 2 * 60 * 1000 }
  );
  const { data: categories, refetch: refetchCategories } = useConvexQuery(
    api.categories.getFilteredCategories,
    {
      isActive: categoryFilters.isActive,
      searchQuery: categoryFilters.searchQuery || undefined,
      limit: 100,
    },
    { staleTime: 5 * 60 * 1000 }
  );
  const { data: allProducts } = useConvexQuery(
    api.products.getFilteredProducts,
    {
      status: productFilters.status || undefined,
      category: productFilters.category || undefined,
      supplierId: productFilters.supplierId || undefined,
      searchQuery: productFilters.searchQuery || undefined,
      minPrice: productFilters.minPrice,
      maxPrice: productFilters.maxPrice,
      limit: 500,
    },
    { staleTime: 2 * 60 * 1000 }
  );
  const { data: allGalleries } = useConvexQuery(
    api.suppliers.listAllGalleriesAdmin,
    {},
    { staleTime: 2 * 60 * 1000 }
  );

  const { data: adminStats, refetch: refetchAdminStats } = useConvexQuery(
    api.stats.getAdminStats,
    {},
    { staleTime: 5 * 1000 } // Cache stats for 5 seconds only
  );

// Statistiques depuis la table stats (plus performant)
const usersCount = adminStats?.totalSuppliers || 0;
const reviewsCount = adminStats?.totalReviews || 0;
const pendingCount = adminStats?.pendingSuppliers || 0;
  
  const addCategory = useMutation(api.categories.addCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const initCategories = useMutation(api.init.initCategories);
  const approveSupplier = useMutation(api.admin.approveSupplier);
  const rejectSupplier = useMutation(api.admin.rejectSupplier);
  const deleteSupplier = useMutation(api.admin.deleteSupplier);
  const deleteAllSuppliers = useMutation(api.admin.deleteAllSuppliers);
  const setSupplierFeatured = useMutation(api.admin.setSupplierFeatured);
  const { data: featuredSuppliers, refetch: refetchFeaturedSuppliers } = useConvexQuery(
    api.admin.getFeaturedSuppliers,
    {},
    { staleTime: 2 * 60 * 1000 }
  );
  const sendAdminNotification = useMutation(api.notifications.sendAdminNotification);
  const sendBulkNotification = useMutation(api.notifications.sendBulkNotification);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'suppliers' | 'categories' | 'featured' | 'products' | 'notifications' | 'import' | 'productImport' | 'adBanners' | 'claims'>('overview');
  // Suppression de l’état fournisseurs simulé (on utilise allSuppliers de Convex)

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Id<"categories"> | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
    image: '',
    is_active: true,
    order: 0
  });
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'system' as 'system' | 'order' | 'review' | 'message' | 'verification' | 'approval',
    userId: '',
    actionUrl: '',
    sendToAll: false,
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Filter states for Suppliers, Categories, and Products
  const [supplierFilters, setSupplierFilters] = useState({
    approved: undefined as boolean | undefined,
    featured: undefined as boolean | undefined,
    category: '',
    searchQuery: '',
  });
  const [categoryFilters, setCategoryFilters] = useState({
    isActive: undefined as boolean | undefined,
    searchQuery: '',
  });
  const [productFilters, setProductFilters] = useState({
    status: '',
    category: '',
    supplierId: '',
    searchQuery: '',
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
  });

  // Vérifier l'accès admin
  // Be more lenient with the admin check to allow for loading states
  const isAdmin = meData?.user?.is_admin === true || meData?.user?.user_type === 'admin';
  
  // Rediriger si pas admin
  React.useEffect(() => {
    // Only redirect if we're done loading and either not authenticated or explicitly not admin
    // This prevents redirecting during the loading state
    if (!isLoading && isAuthenticated && meData !== undefined && !isAdmin) {
      navigate('/');
    }
    
    // If not authenticated at all, redirect
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate, meData]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('admin.overview')}
                </h2>
                <p className="mt-1 text-gray-600">
                  {t('admin.overview_description')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={t('admin.pending_suppliers')}
                value={pendingCount}
                icon="ri-store-line"
                iconColor="text-blue-600"
                iconBg="bg-blue-100"
              />
              <StatCard
                label={t('admin.total_suppliers')}
                value={usersCount}
                icon="ri-store-2-line"
                iconColor="text-green-600"
                iconBg="bg-green-100"
              />
              <StatCard
                label={t('admin.reviews')}
                value={reviewsCount}
                icon="ri-star-line"
                iconColor="text-yellow-600"
                iconBg="bg-yellow-100"
              />
              <StatCard
                label={t('admin.total_products')}
                value={adminStats?.totalProducts || 0}
                icon="ri-product-hunt-line"
                iconColor="text-purple-600"
                iconBg="bg-purple-100"
              />
            </div>

            {/* Recent Pending Suppliers Card */}
            <div className="mt-6">
              <RecentSuppliersCard
                suppliers={pendingSuppliers || []}
                onApprove={() => {}}
                onReject={() => {}}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {/* Tableau Fournisseurs - Top 10 */}
              <div className="bg-white rounded-lg shadow p-4 overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">{t('admin.suppliers')}</h3>
                  <span className="text-xs text-gray-500">Top 10</span>
                </div>
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2">Nom</th>
                      <th className="px-2 py-2">Email</th>
                      <th className="px-2 py-2">Catégorie</th>
                      <th className="px-2 py-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSuppliers?.slice(0, 10).map((supplier) => (
                      <tr key={supplier._id}>
                        <td className="px-2 py-2">{supplier.business_name}</td>
                        <td className="px-2 py-2">{supplier.email}</td>
                        <td className="px-2 py-2">{supplier.category}</td>
                        <td className="px-2 py-2">
                          {supplier.approved ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {t('admin.approved')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {t('admin.pending')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tableau Produits - Top 10 */}
              <div className="bg-white rounded-lg shadow p-4 overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">{t('admin.products')}</h3>
                  <span className="text-xs text-gray-500">Top 10</span>
                </div>
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2">Nom</th>
                      <th className="px-2 py-2">Prix</th>
                      <th className="px-2 py-2">Catégorie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProducts?.slice(0, 10).map((product) => (
                      <tr key={product._id}>
                        <td className="px-2 py-2">{product.name}</td>
                        <td className="px-2 py-2">{formatCurrency(product.price)}</td>
                        <td className="px-2 py-2">{product.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'suppliers':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('admin.supplier_management')}
                </h2>
                <p className="mt-1 text-gray-600">
                  {t('admin.supplier_management_description')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    refetchAllSuppliers();
                    showToast('success', t('admin.suppliers_refreshed'));
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                  title={t('admin.refresh_suppliers')}
                >
                  <i className="ri-refresh-line"></i>
                  {t('admin.refresh')}
                </button>
                <button
                  onClick={() => {
                    showConfirm(
                      t('admin.delete_all_suppliers'),
                      t('admin.confirm_delete_all_suppliers'),
                      async () => {
                        try {
                          const result: any = await deleteAllSuppliers({});
                          showToast('success', result.message || t('admin.delete_all_suppliers_success'));
                          refetchAllSuppliers();
                          // Delay refetch to allow scheduler job to complete
                          setTimeout(() => refetchAdminStats(), 1000);
                        } catch (error: any) {
                          console.error('Error deleting all suppliers:', error);
                          showToast('error', error.message || t('admin.error_delete_all_suppliers'));
                        }
                      },
                      true
                    );
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  🗑️ {t('admin.delete_all_suppliers')}
                </button>
              </div>
            </div>

            {/* Suppliers Filter Controls */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                  <select
                    value={supplierFilters.approved === undefined ? '' : supplierFilters.approved ? 'approved' : 'pending'}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSupplierFilters(prev => ({
                        ...prev,
                        approved: value === '' ? undefined : value === 'approved'
                      }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Tous</option>
                    <option value="approved">Approuvé</option>
                    <option value="pending">En attente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Premium</label>
                  <select
                    value={supplierFilters.featured === undefined ? '' : supplierFilters.featured ? 'yes' : 'no'}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSupplierFilters(prev => ({
                        ...prev,
                        featured: value === '' ? undefined : value === 'yes'
                      }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Tous</option>
                    <option value="yes">Oui</option>
                    <option value="no">Non</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Catégorie</label>
                  <select
                    value={supplierFilters.category}
                    onChange={(e) => setSupplierFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Toutes</option>
                    {categories?.map((cat) => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Recherche</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={supplierFilters.searchQuery}
                      onChange={(e) => setSupplierFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                      placeholder="Nom, email, ville..."
                      className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    />
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSupplierFilters({ approved: undefined, featured: undefined, category: '', searchQuery: '' });
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <i className="ri-close-line mr-1"></i>
                  Réinitialiser
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold mb-4">{t('admin.all_suppliers')}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.name')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.email')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.category')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.status')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.featured')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSuppliers && allSuppliers.length > 0 ? (
                      allSuppliers.map((supplier: Supplier) => (
                        <tr key={supplier._id} className="border-b">
                          <td className="px-2 py-3 font-medium">{supplier.business_name}</td>
                          <td className="px-2 py-3">{supplier.email}</td>
                          <td className="px-2 py-3">{supplier.category}</td>
                          <td className="px-2 py-3">
                            {supplier.approved ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {t('admin.approved')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {t('admin.pending')}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-3">
                            {supplier.featured ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {t('admin.yes')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {t('admin.no')}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedSupplier(supplier);
                                  setIsModalOpen(true);
                                }}
                                className="text-xs px-2 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                              >
                                {t('admin.view')}
                              </button>
                              
                              {!supplier.approved && (
                                <button 
                                  onClick={() => {
                                    showConfirm(
                                      t('admin.approve_supplier'),
                                      t('admin.confirm_approve_supplier'),
                                      async () => {
                                        setIsApproving(supplier._id);
                                        try {
                                          await approveSupplier({ supplierId: supplier._id });
                                          refetchAllSuppliers();
                                          // Delay refetch to allow scheduler job to complete
                                          setTimeout(() => refetchAdminStats(), 500);
                                          showToast('success', t('admin.supplier_approved'));
                                        } catch (error: any) {
                                          console.error('Error approving supplier:', error);
                                          showToast('error', error.message || t('admin.error_approve_supplier'));
                                        } finally {
                                          setIsApproving(null);
                                        }
                                      }
                                    );
                                  }}
                                  disabled={isApproving === supplier._id}
                                  className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                  {isApproving === supplier._id ? (
                                    <i className="ri-loader-4-line animate-spin"></i>
                                  ) : (
                                    t('admin.approve')
                                  )}
                                </button>
                              )}
                              
                              {supplier.approved && (
                                <button 
                                  onClick={() => {
                                    setIsSettingFeatured(supplier._id);
                                    setSupplierFeatured({ 
                                      supplierId: supplier._id, 
                                      featured: !supplier.featured 
                                    }).then(() => {
                                      refetchAllSuppliers();
                                      // Delay refetch to allow scheduler job to complete
                                      setTimeout(() => refetchAdminStats(), 500);
                                      showToast('success', supplier.featured 
                                        ? t('admin.supplier_unfeatured') 
                                        : t('admin.supplier_featured')
                                      );
                                    }).catch((error: any) => {
                                      console.error('Error updating featured status:', error);
                                      showToast('error', error.message || t('admin.error_set_premium'));
                                    }).finally(() => {
                                      setIsSettingFeatured(null);
                                    });
                                  }}
                                  disabled={isSettingFeatured === supplier._id}
                                  className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 ${
                                    supplier.featured 
                                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  {isSettingFeatured === supplier._id ? (
                                    <i className="ri-loader-4-line animate-spin"></i>
                                  ) : (
                                    supplier.featured ? t('admin.unfeature') : t('admin.feature')
                                  )}
                                </button>
                              )}
                              
                              <button 
                                onClick={() => {
                                  showConfirm(
                                    t('admin.delete_supplier'),
                                    t('admin.confirm_delete_supplier'),
                                    async () => {
                                      setIsDeleting(supplier._id);
                                      try {
                                        await deleteSupplier({ supplierId: supplier._id });
                                        refetchAllSuppliers();
                                        // Delay refetch to allow scheduler job to complete
                                        setTimeout(() => refetchAdminStats(), 500);
                                        showToast('success', t('admin.supplier_deleted'));
                                      } catch (error: any) {
                                        console.error('Error deleting supplier:', error);
                                        showToast('error', error.message || t('admin.error_delete_supplier'));
                                      } finally {
                                        setIsDeleting(null);
                                      }
                                    },
                                    true
                                  );
                                }}
                                disabled={isDeleting === supplier._id}
                                className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                {isDeleting === supplier._id ? (
                                  <i className="ri-loader-4-line animate-spin"></i>
                                ) : (
                                  t('admin.delete')
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-gray-400 p-4">
                          {t('admin.no_suppliers')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'categories':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('admin.category_management')}
                </h2>
                <p className="mt-1 text-gray-600">
                  {t('admin.category_management_description')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg opacity-50 cursor-not-allowed transition-colors text-sm"
                  title={t('admin.init_categories_disabled')}
                >
                  🔄 {t('admin.init_categories')}
                </button>
                <button
                  onClick={() => {
                    setShowAddCategory(true);
                    setEditingCategory(null);
                    setCategoryForm({ name: '', description: '', icon: '', image: '', is_active: true, order: 0 });
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  + {t('admin.add_category')}
                </button>
              </div>
            </div>

            {/* Categories Filter Controls */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                  <select
                    value={categoryFilters.isActive === undefined ? '' : categoryFilters.isActive ? 'active' : 'inactive'}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCategoryFilters(prev => ({
                        ...prev,
                        isActive: value === '' ? undefined : value === 'active'
                      }));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Tous</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Recherche</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={categoryFilters.searchQuery}
                      onChange={(e) => setCategoryFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                      placeholder="Nom, description..."
                      className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    />
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCategoryFilters({ isActive: undefined, searchQuery: '' });
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <i className="ri-close-line mr-1"></i>
                  Réinitialiser
                </button>
              </div>
            </div>

            {showAddCategory && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold mb-4">{editingCategory ? t('admin.edit_category') : t('admin.new_category')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.category_name')} *
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder={t('admin.placeholder_category')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.icon')} (Remix Icon)
                    </label>
                    <IconAutocomplete
                      value={categoryForm.icon}
                      onChange={(value) => setCategoryForm({...categoryForm, icon: value})}
                      placeholder={t('admin.placeholder_icon') || "Search icons..."}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.category_image')}
                    </label>
                    <CategoryImageInput
                      value={categoryForm.image}
                      onChange={(value) => setCategoryForm({...categoryForm, image: value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.description')}
                    </label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder={t('admin.placeholder_description')}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.display_order')}
                    </label>
                    <input
                      type="number"
                      value={categoryForm.order}
                      onChange={(e) => setCategoryForm({...categoryForm, order: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={categoryForm.is_active}
                        onChange={(e) => setCategoryForm({...categoryForm, is_active: e.target.checked})}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{t('admin.active')}</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      if (editingCategory) {
                        handleUpdateCategory(editingCategory);
                      } else {
                        handleAddCategory();
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    {editingCategory ? t('admin.save') : t('admin.add')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCategory(false);
                      setEditingCategory(null);
                      setCategoryForm({ name: '', description: '', icon: '', image: '', is_active: true, order: 0 });
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    {t('admin.cancel')}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold mb-4">{t('admin.categories')}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">{t('admin.name')}</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">{t('admin.description')}</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">{t('admin.icon')}</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">{t('admin.image')}</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">{t('admin.display_order')}</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">{t('admin.status')}</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories?.map((category) => (
                      <tr key={category._id} className="border-b">
                        {editingCategory === category._id ? (
                          <>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={categoryForm.name}
                                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={categoryForm.description}
                                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <IconAutocomplete
                                value={categoryForm.icon}
                                onChange={(value) => setCategoryForm({...categoryForm, icon: value})}
                              />
                            </td>
                            <td className="py-2 px-2">
                              <CategoryImageInput
                                value={categoryForm.image}
                                onChange={(value) => setCategoryForm({...categoryForm, image: value})}
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={categoryForm.order}
                                onChange={(e) => setCategoryForm({...categoryForm, order: parseInt(e.target.value) || 0})}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={categoryForm.is_active}
                                  onChange={(e) => setCategoryForm({...categoryForm, is_active: e.target.checked})}
                                  className="rounded border-gray-300 text-green-600"
                                />
                              </label>
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateCategory(category._id)}
                                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                >
                                  {t('admin.save')}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                                >
                                  {t('admin.cancel')}
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-2 font-medium">{category.name}</td>
                            <td className="py-2 px-2 text-gray-600">{category.description || '-'}</td>
                            <td className="py-2 px-2">
                              {category.icon ? (
                                <div className="flex items-center">
                                  <i className={`${category.icon} text-lg mr-2`}></i>
                                  <span className="text-sm text-gray-600">{category.icon}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-2">
                              {category.image ? (
                                <img src={category.image} alt={category.name} className="w-8 h-8 object-cover rounded" />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-2">{category.order ? Number(category.order) : '-'}</td>
                            <td className="py-2 px-2">
                              {category.is_active ? (
                                <span className="text-green-600">{t('admin.active')}</span>
                              ) : (
                                <span className="text-red-600">{t('admin.inactive')}</span>
                              )}
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEdit(category)}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                >
                                  {t('admin.edit')}
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category._id)}
                                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                                >
                                  {t('admin.delete')}
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {(!categories || categories.length === 0) && (
                      <tr>
                        <td colSpan={6} className="text-center text-gray-400 p-4">
                          {t('admin.no_categories')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'featured':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('admin.premium_suppliers')}
              </h2>
              <p className="mt-1 text-gray-600">
                {t('admin.premium_suppliers_description')}
              </p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold mb-4">{t('admin.all_premium_suppliers')}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.name')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.email')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.category')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.premium_status')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featuredSuppliers && featuredSuppliers.length > 0 ? (
                      featuredSuppliers.map((supplier: Supplier) => (
                        <tr key={supplier._id} className="border-b">
                          <td className="px-2 py-3 font-medium">{supplier.business_name}</td>
                          <td className="px-2 py-3">{supplier.email}</td>
                          <td className="px-2 py-3">{supplier.category}</td>
                          <td className="px-2 py-3">
                            {supplier.featured ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {t('admin.featured')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {t('admin.not_featured')}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex space-x-2">
                              {supplier.featured ? (
                                <button 
                                  onClick={() => {
                                    setSupplierFeatured({ supplierId: supplier._id, featured: false }).then(() => {
                                      // Refresh the featured suppliers list
                                      refetchFeaturedSuppliers();
                                    }).catch((error: any) => {
                                      console.error('Error removing featured status:', error);
                                      showToast('error', error.message || t('admin.error_remove_premium'));
                                    });
                                  }}
                                  className="text-xs px-3 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700 transition-colors"
                                >
                                  {t('admin.remove_premium')}
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setSupplierFeatured({ supplierId: supplier._id, featured: true }).then(() => {
                                      // Refresh the featured suppliers list
                                      refetchFeaturedSuppliers();
                                    }).catch((error: any) => {
                                      console.error('Error setting featured status:', error);
                                      showToast('error', error.message || t('admin.error_set_premium'));
                                    });
                                  }}
                                  className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                                >
                                  {t('admin.set_premium')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-400 p-4">
                          {t('admin.no_premium_suppliers')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'products':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('admin.products')}
              </h2>
              <p className="mt-1 text-gray-600">
                {t('admin.products_management_description')}
              </p>
            </div>

            {/* Products Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <StatCard
                label={t('admin.total_products')}
                value={allProducts?.length || 0}
                icon="ri-shopping-bag-line"
                iconColor="text-blue-600"
                iconBg="bg-blue-100"
              />
              <StatCard
                label={t('admin.active_products')}
                value={allProducts?.filter((p: any) => p.status === 'active').length || 0}
                icon="ri-check-line"
                iconColor="text-green-600"
                iconBg="bg-green-100"
              />
              <StatCard
                label={t('admin.inactive_products')}
                value={allProducts?.filter((p: any) => p.status === 'inactive').length || 0}
                icon="ri-close-line"
                iconColor="text-red-600"
                iconBg="bg-red-100"
              />
              <StatCard
                label={t('admin.total_stock')}
                value={allProducts?.reduce((acc: number, p: any) => acc + (Number(p.stock) || 0), 0) || 0}
                icon="ri-archive-line"
                iconColor="text-purple-600"
                iconBg="bg-purple-100"
              />
            </div>

            {/* Products Filter Controls */}
            <div className="bg-white rounded-lg border p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                  <select
                    value={productFilters.status}
                    onChange={(e) => setProductFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Tous</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="out_of_stock">Rupture de stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Catégorie</label>
                  <select
                    value={productFilters.category}
                    onChange={(e) => setProductFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Toutes</option>
                    {categories?.map((cat) => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fournisseur</label>
                  <select
                    value={productFilters.supplierId}
                    onChange={(e) => setProductFilters(prev => ({ ...prev, supplierId: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 max-w-[180px]"
                  >
                    <option value="">Tous</option>
                    {allSuppliers?.map((s) => (
                      <option key={s._id} value={s._id}>{s.business_name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Recherche</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productFilters.searchQuery}
                      onChange={(e) => setProductFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                      placeholder="Nom, description..."
                      className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    />
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setProductFilters({ status: '', category: '', supplierId: '', searchQuery: '', minPrice: undefined, maxPrice: undefined });
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <i className="ri-close-line mr-1"></i>
                  Réinitialiser
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold mb-4">{t('admin.all_products')}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.image')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.name')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.category')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.price')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.stock')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.status')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.supplier')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProducts && allProducts.length > 0 ? (
                      allProducts.map((product: any) => (
                        <tr key={product._id} className="border-b hover:bg-gray-50">
                          <td className="px-2 py-3">
                            {product.images && product.images.length > 0 ? (
                              <img 
                                src={product.images[0]} 
                                alt={product.name}
                                className="h-12 w-12 rounded object-cover border"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center text-gray-400">
                                <i className="ri-image-line text-xl" />
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-3 font-medium">{product.name}</td>
                          <td className="px-2 py-3">{product.category || '-'}</td>
                          <td className="px-2 py-3">{formatCurrency(Number(product.price || 0))}</td>
                          <td className="px-2 py-3">{product.stock ?? 0}</td>
                          <td className="px-2 py-3">
                            {product.status === 'active' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {t('admin.active')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {t('admin.inactive')}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-3">
                            {allSuppliers?.find((s: any) => s._id === product.supplierId)?.business_name || product.supplierId}
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsProductModalOpen(true);
                                }}
                                className="text-xs px-2 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                              >
                                {t('admin.view')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center text-gray-400 p-4">
                          {t('admin.no_products')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Envoyer une notification</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Titre de la notification"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={4}
                    placeholder="Message de la notification"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={notificationForm.type}
                    onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="system">Système</option>
                    <option value="order">Commande</option>
                    <option value="review">Avis</option>
                    <option value="message">Message</option>
                    <option value="verification">Vérification</option>
                    <option value="approval">Approbation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lien d'action (optionnel)
                  </label>
                  <input
                    type="text"
                    value={notificationForm.actionUrl}
                    onChange={(e) => setNotificationForm({...notificationForm, actionUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="/dashboard ou https://..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendToAll"
                    checked={notificationForm.sendToAll}
                    onChange={(e) => setNotificationForm({...notificationForm, sendToAll: e.target.checked})}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="sendToAll" className="text-sm text-gray-700">
                    Envoyer à tous les utilisateurs
                  </label>
                </div>

                {!notificationForm.sendToAll && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID Utilisateur *
                    </label>
                    <input
                      type="text"
                      value={notificationForm.userId}
                      onChange={(e) => setNotificationForm({...notificationForm, userId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="ID de l'utilisateur"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Trouvez l'ID dans la liste des fournisseurs ou utilisateurs
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={async () => {
                      if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
                        showToast('error', 'Le titre et le message sont requis');
                        return;
                      }
                      if (!notificationForm.sendToAll && !notificationForm.userId.trim()) {
                        showToast('error', 'Veuillez sélectionner un utilisateur ou choisir "Envoyer à tous"');
                        return;
                      }
                      
                      setSendingNotification(true);
                      try {
                        if (notificationForm.sendToAll) {
                          // Get all user IDs from suppliers
                          const userIds = allSuppliers?.map((s: any) => s.userId) || [];
                          if (userIds.length === 0) {
                            showToast('error', 'Aucun utilisateur trouvé');
                            return;
                          }
                          await sendBulkNotification({
                            userIds,
                            title: notificationForm.title,
                            message: notificationForm.message,
                            type: notificationForm.type,
                            actionUrl: notificationForm.actionUrl || undefined,
                          });
                          showToast('success', `Notification envoyée à ${userIds.length} utilisateurs`);
                        } else {
                          await sendAdminNotification({
                            userId: notificationForm.userId,
                            title: notificationForm.title,
                            message: notificationForm.message,
                            type: notificationForm.type,
                            actionUrl: notificationForm.actionUrl || undefined,
                          });
                          showToast('success', 'Notification envoyée avec succès');
                        }
                        // Reset form
                        setNotificationForm({
                          title: '',
                          message: '',
                          type: 'system',
                          userId: '',
                          actionUrl: '',
                          sendToAll: false,
                        });
                      } catch (error: any) {
                        console.error('Error sending notification:', error);
                        showToast('error', error.message || 'Erreur lors de l\'envoi');
                      } finally {
                        setSendingNotification(false);
                      }
                    }}
                    disabled={sendingNotification}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {sendingNotification ? (
                      <span className="flex items-center gap-2">
                        <i className="ri-loader-4-line animate-spin" />
                        Envoi...
                      </span>
                    ) : (
                      'Envoyer la notification'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setNotificationForm({
                        title: '',
                        message: '',
                        type: 'system',
                        userId: '',
                        actionUrl: '',
                        sendToAll: false,
                      });
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Fournisseurs"
                value={allSuppliers?.length || 0}
                icon="ri-store-line"
                iconColor="text-blue-600"
                iconBg="bg-blue-100"
              />
              <StatCard
                label="Notifications envoyées"
                value={unreadCount}
                icon="ri-notification-3-line"
                iconColor="text-yellow-600"
                iconBg="bg-yellow-100"
              />
              <StatCard
                label="Non lues (vous)"
                value={unreadCount}
                icon="ri-mail-unread-line"
                iconColor="text-red-600"
                iconBg="bg-red-100"
              />
            </div>
          </div>
        );
      case 'import':
        return <SupplierBulkImport />;
      case 'productImport':
        return <ProductBulkImport />;
      case 'adBanners':
        return <AdBannerManager />;
      case 'claims':
        return <SupplierClaimsManager />;
      default:
        return null;
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      showToast('error', t('admin.name_required'));
      return;
    }
    try {
      await addCategory({
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        icon: categoryForm.icon || undefined,
        image: categoryForm.image || undefined,
        is_active: categoryForm.is_active,
        order: categoryForm.order ? categoryForm.order : 0,
      });
      refetchCategories(); // Refresh the categories list
      setCategoryForm({ name: '', description: '', icon: '', image: '', is_active: true, order: 0 });
      setShowAddCategory(false);
      showToast('success', t('admin.category_added_success'));
    } catch (error: any) {
      showToast('error', error.message || t('admin.error_add_category'));
    }
  };

  const handleUpdateCategory = async (id: Id<"categories">) => {
    if (!categoryForm.name.trim()) {
      showToast('error', t('admin.name_required'));
      return;
    }
    try {
      await updateCategory({
        id,
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        icon: categoryForm.icon || undefined,
        image: categoryForm.image || undefined,
        is_active: categoryForm.is_active,
        order: categoryForm.order ? categoryForm.order : 0,
      });
      refetchCategories(); // Refresh the categories list
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', icon: '', image: '', is_active: true, order: 0 });
      showToast('success', t('admin.category_updated_success'));
    } catch (error: any) {
      showToast('error', error.message || t('admin.error_update_category'));
    }
  };

  const handleDeleteCategory = async (id: Id<"categories">) => {
    showConfirm(
      t('admin.delete_category'),
      t('admin.confirm_delete'),
      async () => {
        try {
          await deleteCategory({ id });
          refetchCategories(); // Refresh the categories list
          showToast('success', t('admin.category_deleted_success'));
        } catch (error: any) {
          showToast('error', error.message || t('admin.error_delete_category'));
        }
      },
      true
    );
  };

  // Add state for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [isDangerAction, setIsDangerAction] = useState(false);
  
  // Toast notification system
  const { toasts, showToast, removeToast } = useToast();
  
  // Notifications system with Convex
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(50);

  // Loading states for supplier actions
  const [isApproving, setIsApproving] = useState<Id<"suppliers"> | null>(null);
  const [isRejecting, setIsRejecting] = useState<Id<"suppliers"> | null>(null);
  const [isDeleting, setIsDeleting] = useState<Id<"suppliers"> | null>(null);
  const [isSettingFeatured, setIsSettingFeatured] = useState<Id<"suppliers"> | null>(null);


  // Add helper functions for confirmation modal
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger = false
  ) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => onConfirm);
    setIsDangerAction(isDanger);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // StatCard component
  function StatCard({
    label,
    value,
    icon,
    iconBg,
    iconColor,
  }: {
    label: string;
    value: string | number;
    icon: string;
    iconBg: string;
    iconColor: string;
  }) {
    return (
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconBg}`}
          >
            <i className={`${icon} text-xl ${iconColor}`} />
          </div>
          <div className="ml-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {label}
            </p>
            <p className="text-lg font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    );
  }

  // Update the RecentSuppliersCard component to use proper async handlers
  function RecentSuppliersCard({
    suppliers,
    onApprove,
    onReject,
  }: {
    suppliers: Supplier[];
    onApprove: (supplierId: Id<"suppliers">) => void;
    onReject: (supplierId: Id<"suppliers">) => void;
  }) {
    // Extract async handlers
    const handleApprove = async (supplierId: Id<"suppliers">) => {
      setIsApproving(supplierId);
      try {
        await approveSupplier({ supplierId });
        refetchPendingSuppliers();
        showToast('success', t('admin.supplier_approved'));
      } catch (error: any) {
        console.error('Error approving supplier:', error);
        showToast('error', error.message || t('admin.error_approve_supplier'));
      } finally {
        setIsApproving(null);
      }
    };

    const handleReject = async (supplierId: Id<"suppliers">) => {
      showConfirm(
        t('admin.reject_supplier'),
        t('admin.confirm_reject'),
        async () => {
          setIsRejecting(supplierId);
          try {
            await rejectSupplier({ supplierId });
            refetchPendingSuppliers();
            showToast('success', t('admin.supplier_rejected'));
          } catch (error: any) {
            console.error('Error rejecting supplier:', error);
            showToast('error', error.message || t('admin.error_reject_supplier'));
          } finally {
            setIsRejecting(null);
          }
        },
        true
      );
    };

    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">{t('admin.pending_suppliers')}</h3>
        <div className="space-y-3">
          {suppliers.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              {t('admin.no_pending_suppliers')}
            </p>
          ) : (
            suppliers.slice(0, 5).map((supplier) => (
              <div key={supplier._id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <p className="font-medium text-gray-900">{supplier.business_name}</p>
                  <p className="text-xs text-gray-500">{supplier.email}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApprove(supplier._id)}
                    disabled={isApproving === supplier._id}
                    className="text-xs px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isApproving === supplier._id ? (
                      <i className="ri-loader-4-line animate-spin"></i>
                    ) : (
                      t('admin.approve')
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(supplier._id)}
                    disabled={isRejecting === supplier._id}
                    className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isRejecting === supplier._id ? (
                      <i className="ri-loader-4-line animate-spin"></i>
                    ) : (
                      t('admin.reject')
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  function SupplierDetailsModal({ 
    supplier, 
    isOpen, 
    onClose 
  }: { 
    supplier: Supplier | null; 
    isOpen: boolean; 
    onClose: () => void; 
  }) {
    if (!isOpen || !supplier) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {t('admin.supplier_details')}
              </h3>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.name')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {supplier.business_name}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.email')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {supplier.email}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.category')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {supplier.category}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.location')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {supplier.city}, {supplier.state}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.phone')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {supplier.phone || '-'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.website')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {supplier.website || '-'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('admin.description')}
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {supplier.description || '-'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">{t('admin.approved')}</p>
                  <p className="font-semibold">
                    {supplier.approved ? 
                      <span className="text-green-600">{t('admin.yes')}</span> : 
                      <span className="text-red-600">{t('admin.no')}</span>
                    }
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">{t('admin.featured')}</p>
                  <p className="font-semibold">
                    {supplier.featured ? 
                      <span className="text-green-600">{t('admin.yes')}</span> : 
                      <span className="text-red-600">{t('admin.no')}</span>
                    }
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">{t('admin.verified')}</p>
                  <p className="font-semibold">
                    {supplier.verified ? 
                      <span className="text-green-600">{t('admin.yes')}</span> : 
                      <span className="text-red-600">{t('admin.no')}</span>
                    }
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.created_at')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : '-'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.updated_at')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {supplier.updated_at ? new Date(supplier.updated_at).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {t('admin.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const startEdit = (category: Category) => {
    setEditingCategory(category._id);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      image: category.image || '',
      is_active: category.is_active ?? true,
      order: category.order ? Number(category.order) : 0,
    });
    setShowAddCategory(false);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', icon: '', image: '', is_active: true, order: 0 });
  };

  function ProductDetailsModal({
    product,
    isOpen,
    onClose,
    suppliers,
  }: {
    product: any;
    isOpen: boolean;
    onClose: () => void;
    suppliers: any[];
  }) {
    if (!isOpen || !product) return null;

    const supplier = suppliers?.find((s: any) => s._id === product.supplierId);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {t('admin.product_details')}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              {/* Product Images */}
              {product.images && product.images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.images')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.images.map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        className="h-20 w-20 rounded object-cover border"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.name')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{product.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.category')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{product.category || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.price')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatCurrency(Number(product.price || 0))}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.stock')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{product.stock ?? 0}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.status')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {product.status === 'active' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {t('admin.active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {t('admin.inactive')}
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.supplier')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {supplier?.business_name || product.supplierId}
                  </p>
                </div>
              </div>

              {product.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.description')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{product.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.created_at')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {product.created_at ? new Date(product.created_at).toLocaleDateString() : '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.updated_at')}
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {t('admin.close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || meData === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('msg.loading')}</p>
          <p className="mt-2 text-sm text-gray-500">{t('admin.checking_permissions')}</p>
        </div>
      </div>
    );
  }
  // Show a more informative message when user is not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the admin panel.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Current user type: {meData?.user?.user_type || 'Unknown'}<br/>
            Is admin: {meData?.user?.is_admin ? 'Yes' : 'No'}
          </p>
          <button 
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-full w-64 border-r border-green-100 bg-gradient-to-b from-green-50 to-white transition-transform duration-300 lg:translate-x-0">
        <div className="flex h-full flex-col">
          <div className="border-b border-green-100 p-6">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/Suji Logo.webp" alt="Suji Logo" className="h-12 w-auto" />
              <span className="text-2xl font-bold text-green-600" style={{ fontFamily: 'Pacifico, serif' }}>
                Suji
              </span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <i className="ri-dashboard-line text-lg" />
                <span className="font-medium">{t('admin.overview')}</span>
              </button>
              <button
                onClick={() => setActiveTab('suppliers')}
                className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  activeTab === 'suppliers'
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <i className="ri-store-line text-lg" />
                <span className="font-medium">{t('admin.suppliers')}</span>
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  activeTab === 'categories'
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <i className="ri-list-check text-lg" />
                <span className="font-medium">{t('admin.categories')}</span>
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  activeTab === 'products'
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <i className="ri-shopping-bag-line text-lg" />
                <span className="font-medium">{t('admin.products')}</span>
              </button>
              <button
                onClick={() => setActiveTab('featured')}
                className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  activeTab === 'featured'
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <i className="ri-star-line text-lg" />
                <span className="font-medium">{t('admin.premium_suppliers')}</span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <i className="ri-notification-3-line text-lg" />
                <span className="font-medium">Notifications</span>
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  activeTab === 'import'
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <i className="ri-upload-cloud-line text-lg" />
                <span className="font-medium">Import Fournisseurs</span>
              </button>
              <button
                onClick={() => setActiveTab('productImport')}
                className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  activeTab === 'productImport'
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <i className="ri-archive-line text-lg" />
                <span className="font-medium">Import Produits</span>
              </button>
              <button
                onClick={() => setActiveTab('adBanners')}
                className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  activeTab === 'adBanners'
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <i className="ri-image-line text-lg" />
                <span className="font-medium">Ad Banners</span>
              </button>
              <button
                onClick={() => setActiveTab('claims')}
                className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  activeTab === 'claims'
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <i className="ri-shield-user-line text-lg" />
                <span className="font-medium">{t('claims.sidebar.menu')}</span>
              </button>
            </div>
          </nav>

          <div className="border-t border-green-100 p-4">
            <div className="flex items-center space-x-3 rounded-lg px-2 py-2 hover:bg-green-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                <i className="ri-user-line" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  Admin
                </p>
                <p className="truncate text-xs text-gray-500">{t('admin.admin_panel')}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                {activeTab === 'overview' && t('admin.overview')}
                {activeTab === 'suppliers' && t('admin.suppliers')}
                {activeTab === 'categories' && t('admin.categories')}
                {activeTab === 'featured' && t('admin.premium_suppliers')}
                {activeTab === 'products' && t('admin.products')}
                {activeTab === 'notifications' && 'Envoyer une notification'}
                {activeTab === 'import' && 'Import Fournisseurs'}
                {activeTab === 'productImport' && 'Import Produits'}
                {activeTab === 'adBanners' && 'Ad Banners'}
                {activeTab === 'claims' && t('claims.sidebar.page_title')}
              </h1>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-6">
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                loading={notificationsLoading}
                onMarkRead={markAsRead}
                onMarkAllRead={markAllAsRead}
                onDelete={deleteNotification}
              />
              <div className="hidden items-center space-x-2 rounded-lg px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">
                  <i className="ri-user-line text-sm" />
                </div>
                <span className="truncate max-w-[120px]">Admin</span>
              </div>
              <button
                onClick={() => navigate('/')}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Retour à l'accueil"
              >
                <i className="ri-home-line text-xl" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {renderContent()}
          </div>
        </main>
      </div>
      
      {/* Add Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirmModal(false)}
        isDanger={isDangerAction}
      />

      {/* Add Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        suppliers={allSuppliers || []}
      />

      {/* Add Supplier Details Modal */}
      <SupplierDetailsModal
        supplier={selectedSupplier}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSupplier(null);
        }}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// Supplier Claims Manager Component
function SupplierClaimsManager() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [processingClaim, setProcessingClaim] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Fetch pending claims
  const { data: pendingClaims, refetch: refetchClaims } = useConvexQuery(
    api.suppliers.getPendingClaims, 
    {}, 
    { staleTime: 30 * 1000 }
  );
  
  // Mutations
  const approveClaim = useMutation(api.suppliers.approveClaim);
  const rejectClaim = useMutation(api.suppliers.rejectClaim);
  
  const handleApprove = async (claimId: string) => {
    setProcessingClaim(claimId);
    try {
      await approveClaim({ claimId, notes });
      showToast('success', t('claims.notification.claim_approved'));
      refetchClaims();
      setShowDetailModal(false);
      setNotes('');
    } catch (error: any) {
      showToast('error', error.message || t('claims.notification.error_approve'));
    } finally {
      setProcessingClaim(null);
    }
  };
  
  const handleReject = async (claimId: string) => {
    setProcessingClaim(claimId);
    try {
      await rejectClaim({ claimId, notes });
      showToast('success', t('claims.notification.claim_rejected'));
      refetchClaims();
      setShowDetailModal(false);
      setNotes('');
    } catch (error: any) {
      showToast('error', error.message || t('claims.notification.error_reject'));
    } finally {
      setProcessingClaim(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t('claims.admin.title')}
          </h2>
          <p className="mt-1 text-gray-600">
            {t('claims.admin.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <i className="ri-time-line mr-1" />
            {pendingClaims?.length || 0} {t('claims.admin.status.pending').toLowerCase()}
          </span>
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('claims.admin.table.business')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('claims.admin.table.claimant')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('claims.admin.table.business_email')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('claims.admin.table.date')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('claims.admin.table.status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('claims.admin.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingClaims && pendingClaims.length > 0 ? (
                pendingClaims.map((claim: any) => (
                  <tr key={claim._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <i className="ri-store-line text-green-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {claim.supplier?.business_name || t('claims.detail.not_available')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {claim.supplier?.city}, {claim.supplier?.state}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {claim.claimant?.firstName} {claim.claimant?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{claim.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{claim.supplierEmail || t('claims.modal.verify.not_available')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {new Date(claim.claimedAt).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(claim.claimedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <i className="ri-time-line mr-1" />
                        {t('claims.admin.status.pending')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setShowDetailModal(true);
                          }}
                          className="text-xs px-3 py-1.5 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                        >
                          {t('claims.admin.view_details')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <i className="ri-shield-check-line text-4xl text-gray-300 mb-2" />
                      <p className="text-sm">{t('claims.admin.no_claims')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t('claims.detail.title')}</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label={t('claims.detail.close')}
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Supplier Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{t('claims.detail.business_info')}</h4>
                <p className="text-sm text-gray-700"><strong>{t('claims.detail.business_name')}</strong> {selectedClaim.supplier?.business_name}</p>
                <p className="text-sm text-gray-700"><strong>{t('claims.detail.business_email_label')}</strong> {selectedClaim.supplier?.email || t('claims.detail.not_available')}</p>
                <p className="text-sm text-gray-700"><strong>{t('claims.detail.business_phone')}</strong> {selectedClaim.supplier?.phone || t('claims.detail.not_available')}</p>
                <p className="text-sm text-gray-700"><strong>{t('claims.detail.business_address')}</strong> {selectedClaim.supplier?.address || t('claims.detail.not_available')}</p>
                <p className="text-sm text-gray-700"><strong>{t('claims.detail.business_location')}</strong> {selectedClaim.supplier?.city}, {selectedClaim.supplier?.state}</p>
              </div>

              {/* Claimant Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{t('claims.detail.claimant_info')}</h4>
                <p className="text-sm text-gray-700"><strong>{t('claims.detail.claimant_name')}</strong> {selectedClaim.claimant?.firstName} {selectedClaim.claimant?.lastName}</p>
                <p className="text-sm text-gray-700"><strong>{t('claims.detail.claimant_email')}</strong> {selectedClaim.userEmail}</p>
                <p className="text-sm text-gray-700"><strong>{t('claims.detail.claimant_date')}</strong> {new Date(selectedClaim.claimedAt).toLocaleString('fr-FR')}</p>
              </div>

              {/* Email Verification */}
              <div className={`rounded-lg p-4 ${
                selectedClaim.userEmail.toLowerCase() === (selectedClaim.supplierEmail || '').toLowerCase()
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <h4 className="font-medium text-gray-900 mb-2">{t('claims.detail.email_verification')}</h4>
                {selectedClaim.userEmail.toLowerCase() === (selectedClaim.supplierEmail || '').toLowerCase() ? (
                  <p className="text-sm text-green-700">
                    <i className="ri-check-line mr-1" />
                    {t('claims.detail.email_match')}
                  </p>
                ) : (
                  <p className="text-sm text-yellow-700">
                    <i className="ri-alert-line mr-1" />
                    {t('claims.detail.email_mismatch')}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('claims.detail.notes.label')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder={t('claims.detail.notes.placeholder')}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('claims.detail.cancel')}
                </button>
                <button
                  onClick={() => handleReject(selectedClaim._id)}
                  disabled={processingClaim === selectedClaim._id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {processingClaim === selectedClaim._id ? (
                    <i className="ri-loader-4-line animate-spin" />
                  ) : (
                    <><i className="ri-close-line mr-1" /> {t('claims.detail.reject')}</>
                  )}
                </button>
                <button
                  onClick={() => handleApprove(selectedClaim._id)}
                  disabled={processingClaim === selectedClaim._id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {processingClaim === selectedClaim._id ? (
                    <i className="ri-loader-4-line animate-spin" />
                  ) : (
                    <><i className="ri-check-line mr-1" /> {t('claims.detail.approve')}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
