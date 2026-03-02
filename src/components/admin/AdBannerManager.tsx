import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

interface AdBanner {
  _id: Id<'ad_banners'>;
  name: string;
  image: string;
  link?: string;
  position: string;
  is_active: boolean;
  order?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

// Image Input Component with Upload/URL toggle
function BannerImageInput({
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
          placeholder="https://example.com/banner.jpg"
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
            Click to upload banner image
          </button>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative w-full max-w-md">
          <img
            src={preview}
            alt="Banner preview"
            className="w-full h-32 object-cover rounded-lg border border-gray-200"
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

export default function AdBannerManager() {
  const banners = useQuery(api.adBanners.getAllBanners) || [];
  const addBanner = useMutation(api.adBanners.addBanner);
  const updateBanner = useMutation(api.adBanners.updateBanner);
  const deleteBanner = useMutation(api.adBanners.deleteBanner);
  const toggleBannerStatus = useMutation(api.adBanners.toggleBannerStatus);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdBanner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    link: '',
    position: 'homepage_top',
    is_active: true,
    order: 0,
    start_date: '',
    end_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const positionOptions = [
    { value: 'homepage_top', label: 'Homepage Top' },
    { value: 'homepage_bottom', label: 'Homepage Bottom' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'search_results', label: 'Search Results' },
    { value: 'category_page', label: 'Category Page' },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      image: '',
      link: '',
      position: 'homepage_top',
      is_active: true,
      order: 0,
      start_date: '',
      end_date: '',
    });
    setEditingBanner(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.image.trim()) {
      alert('Please fill in banner name and image');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBanner) {
        await updateBanner({
          id: editingBanner._id,
          name: formData.name,
          image: formData.image,
          link: formData.link || undefined,
          position: formData.position,
          is_active: formData.is_active,
          order: formData.order || undefined,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
        });
      } else {
        await addBanner({
          name: formData.name,
          image: formData.image,
          link: formData.link || undefined,
          position: formData.position,
          is_active: formData.is_active,
          order: formData.order || undefined,
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
        });
      }
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Failed to save banner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (banner: AdBanner) => {
    setEditingBanner(banner);
    setFormData({
      name: banner.name,
      image: banner.image,
      link: banner.link || '',
      position: banner.position,
      is_active: banner.is_active,
      order: banner.order || 0,
      start_date: banner.start_date || '',
      end_date: banner.end_date || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: Id<'ad_banners'>) => {
    try {
      await deleteBanner({ id });
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  const handleToggleStatus = async (banner: AdBanner) => {
    try {
      await toggleBannerStatus({ id: banner._id, is_active: !banner.is_active });
    } catch (error) {
      console.error('Error toggling banner status:', error);
      alert('Failed to update banner status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ad Banner Management</h2>
          <p className="mt-1 text-gray-600">Manage advertising banners across the platform</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
        >
          <i className={showAddForm ? 'ri-close-line' : 'ri-add-line'}></i>
          {showAddForm ? 'Cancel' : 'Add Banner'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold mb-4">
            {editingBanner ? 'Edit Banner' : 'New Banner'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banner Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Summer Sale 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              >
                {positionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banner Image *
              </label>
              <BannerImageInput
                value={formData.image}
                onChange={(value) => setFormData({ ...formData, image: value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link URL (Optional)
              </label>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="https://example.com/offer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <i className="ri-loader-4-line animate-spin"></i>
              ) : (
                <i className="ri-save-line"></i>
              )}
              {editingBanner ? 'Update Banner' : 'Add Banner'}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Banners List */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">All Banners ({banners.length})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 py-3 font-semibold text-gray-600">Preview</th>
                <th className="text-left px-2 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-2 py-3 font-semibold text-gray-600">Position</th>
                <th className="text-left px-2 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-2 py-3 font-semibold text-gray-600">Order</th>
                <th className="text-left px-2 py-3 font-semibold text-gray-600">Dates</th>
                <th className="text-left px-2 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.length > 0 ? (
                banners.map((banner) => (
                  <tr key={banner._id} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-3">
                      <img
                        src={banner.image}
                        alt={banner.name}
                        className="w-24 h-12 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="48" viewBox="0 0 96 48"%3E%3Crect width="96" height="48" fill="%23f3f4f6"/%3E%3Ctext x="48" y="24" font-size="10" fill="%239ca3af" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="font-medium">{banner.name}</div>
                      {banner.link && (
                        <a
                          href={banner.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:underline truncate max-w-[150px] block"
                        >
                          {banner.link}
                        </a>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {positionOptions.find((p) => p.value === banner.position)?.label || banner.position}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => handleToggleStatus(banner)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          banner.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {banner.is_active ? (
                          <>
                            <i className="ri-eye-line mr-1"></i> Active
                          </>
                        ) : (
                          <>
                            <i className="ri-eye-off-line mr-1"></i> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-2 py-3">{banner.order || 0}</td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-600">
                        {banner.start_date && (
                          <div>From: {new Date(banner.start_date).toLocaleDateString()}</div>
                        )}
                        {banner.end_date && (
                          <div>To: {new Date(banner.end_date).toLocaleDateString()}</div>
                        )}
                        {!banner.start_date && !banner.end_date && (
                          <span className="text-gray-400">No dates set</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          <i className="ri-edit-line mr-1"></i>Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(banner._id)}
                          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                          <i className="ri-delete-bin-line mr-1"></i>Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 p-8">
                    <i className="ri-image-line text-4xl mb-2 block"></i>
                    No banners found. Add your first banner above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Banner</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this banner? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm as Id<'ad_banners'>)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
