import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useConvexAuth } from 'convex/react';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { useTranslation } from 'react-i18next';
import useCurrency from '../../hooks/useCurrency';
import type { Id } from '../../../convex/_generated/dataModel';
import type { Doc } from '../../../convex/_generated/dataModel';

// Define proper TypeScript interfaces based on Convex data model
type Supplier = Doc<"suppliers">;
type Category = Doc<"categories">;

// Add Toast type definition
type Toast = { type: 'success' | 'error'; message: string } | null;

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

// Add Toast component
function Toast({
  toast,
  onDismiss,
  t
}: {
  toast: Toast;
  onDismiss: () => void;
  t: (key: string) => string;
}) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`flex items-center space-x-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
          toast.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}
      >
        <span>{toast.message}</span>
        <button
          onClick={onDismiss}
          className="text-xs font-medium uppercase tracking-wide"
        >
          {t('admin.close')}
        </button>
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
  const { data: categories, refetch: refetchCategories } = useConvexQuery(
    api.categories.getAllCategoriesAdmin,
    {},
    { staleTime: 5 * 60 * 1000 } // Cache categories for 5 minutes
  );
  const { data: pendingSuppliers, refetch: refetchPendingSuppliers } = useConvexQuery(api.admin.getPendingSuppliers, {}, { staleTime: 2 * 60 * 1000 });
  const { data: allSuppliers, refetch: refetchAllSuppliers } = useConvexQuery(api.suppliers.getAllSuppliers, {}, { staleTime: 2 * 60 * 1000 });
const { data: allProducts } = useConvexQuery(api.products.listAllProductsAdmin, {}, { staleTime: 2 * 60 * 1000 });
const { data: allGalleries } = useConvexQuery(api.suppliers.listAllGalleriesAdmin, {}, { staleTime: 2 * 60 * 1000 });

// Statistiques dynamiques
const usersCount = allSuppliers ? allSuppliers.length : 0;
const ordersCount = allProducts ? allProducts.reduce((acc, p) => acc + (p.orders_count || 0), 0) : 0;
const reviewsCount = allSuppliers ? allSuppliers.reduce((acc, s) => acc + (s.reviews_count || 0), 0) : 0;
const totalRevenue = allProducts ? allProducts.reduce((acc, p) => acc + (p.total_sales || 0), 0) : 0;
  
  const addCategory = useMutation(api.categories.addCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const initCategories = useMutation(api.init.initCategories);
  const approveSupplier = useMutation(api.admin.approveSupplier);
  const rejectSupplier = useMutation(api.admin.rejectSupplier);
  const deleteSupplier = useMutation(api.admin.deleteSupplier);
  const setSupplierFeatured = useMutation(api.admin.setSupplierFeatured);
  const { data: featuredSuppliers, refetch: refetchFeaturedSuppliers } = useConvexQuery(api.admin.getFeaturedSuppliers, {}, { staleTime: 2 * 60 * 1000 });
  
  const [activeTab, setActiveTab] = useState<'overview' | 'suppliers' | 'categories' | 'featured'>('overview');
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard
                label={t('admin.pending_suppliers')}
                value={pendingSuppliers?.length || 0}
                icon="ri-store-line"
                iconColor="text-blue-600"
                iconBg="bg-blue-100"
              />
              <StatCard
                label={t('admin.users')}
                value={usersCount ?? 0}
                icon="ri-user-line"
                iconColor="text-green-600"
                iconBg="bg-green-100"
              />
              <StatCard
                label={t('admin.orders')}
                value={ordersCount ?? 0}
                icon="ri-shopping-cart-line"
                iconColor="text-purple-600"
                iconBg="bg-purple-100"
              />
              <StatCard
                label={t('admin.reviews')}
                value={reviewsCount ?? 0}
                icon="ri-star-line"
                iconColor="text-yellow-600"
                iconBg="bg-yellow-100"
              />
              <StatCard
                label={t('admin.total_revenue')}
                value={formatCurrency(totalRevenue ?? 0)}
                icon="ri-money-dollar-circle-line"
                iconColor="text-red-600"
                iconBg="bg-red-100"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {/* Tableau Fournisseurs */}
              <div className="col-span-1 bg-white rounded-lg shadow p-4 overflow-auto">
                <h3 className="text-lg font-bold mb-2">{t('admin.suppliers')}</h3>
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
                    {allSuppliers?.map((supplier) => (
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

              {/* Tableau Produits */}
              <div className="col-span-1 bg-white rounded-lg shadow p-4 overflow-auto">
                <h3 className="text-lg font-bold mb-2">{t('admin.products')}</h3>
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2">Nom</th>
                      <th className="px-2 py-2">Prix</th>
                      <th className="px-2 py-2">Catégorie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProducts?.map((product) => (
                      <tr key={product._id}>
                        <td className="px-2 py-2">{product.name}</td>
                        <td className="px-2 py-2">{formatCurrency(product.price)}</td>
                        <td className="px-2 py-2">{product.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tableau Galeries */}
              <div className="col-span-1 bg-white rounded-lg shadow p-4 overflow-auto">
                <h3 className="text-lg font-bold mb-2">{t('admin.galleries')}</h3>
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2">Nom</th>
                      <th className="px-2 py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allGalleries?.map((gallery) => (
                      <tr key={gallery._id}>
                        <td className="px-2 py-2">{gallery.name}</td>
                        <td className="px-2 py-2">{gallery.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* À remplacer par une vraie section d’activité si besoin */}
            </div>
          </div>
        );
      case 'suppliers':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('admin.supplier_management')}
              </h2>
              <p className="mt-1 text-gray-600">
                {t('admin.supplier_management_description')}
              </p>
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
                                      showToast('success', supplier.featured 
                                        ? t('admin.supplier_unfeatured') 
                                        : t('admin.supplier_featured')
                                      );
                                    }).catch((error: any) => {
                                      console.error('Error updating featured status:', error);
                                      showToast('error', error.message || t('admin.error_set_featured'));
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
                  onClick={() => {
                    showConfirm(
                      t('admin.init_categories'),
                      t('admin.confirm_init'),
                      async () => {
                        try {
                          const result: any = await initCategories({});
                          showToast('success', result.message || t('admin.init_success'));
                        } catch (error: any) {
                          showToast('error', error.message || t('admin.error_init_categories'));
                        }
                      }
                    );
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
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
                    <input
                      type="text"
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder={t('admin.placeholder_icon')}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('admin.category_image')} (URL)
                    </label>
                    <input
                      type="text"
                      value={categoryForm.image}
                      onChange={(e) => setCategoryForm({...categoryForm, image: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder={t('admin.placeholder_image')}
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
                              <input
                                type="text"
                                value={categoryForm.icon}
                                onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={categoryForm.image}
                                onChange={(e) => setCategoryForm({...categoryForm, image: e.target.value})}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
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
                {t('admin.featured_businesses')}
              </h2>
              <p className="mt-1 text-gray-600">
                {t('admin.featured_businesses_description')}
              </p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold mb-4">{t('admin.all_featured_businesses')}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.name')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.email')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.category')}</th>
                      <th className="text-left px-2 py-3 font-semibold text-gray-600">{t('admin.featured_status')}</th>
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
                                      showToast('error', error.message || t('admin.error_remove_featured'));
                                    });
                                  }}
                                  className="text-xs px-3 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700 transition-colors"
                                >
                                  {t('admin.remove_featured')}
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setSupplierFeatured({ supplierId: supplier._id, featured: true }).then(() => {
                                      // Refresh the featured suppliers list
                                      refetchFeaturedSuppliers();
                                    }).catch((error: any) => {
                                      console.error('Error setting featured status:', error);
                                      showToast('error', error.message || t('admin.error_set_featured'));
                                    });
                                  }}
                                  className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                                >
                                  {t('admin.set_featured')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-400 p-4">
                          {t('admin.no_featured_businesses')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
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
  
  // Add state for toast
  const [toast, setToast] = useState<Toast>(null);
  
  // Add loading states for supplier actions
  const [isApproving, setIsApproving] = useState<Id<"suppliers"> | null>(null);
  const [isRejecting, setIsRejecting] = useState<Id<"suppliers"> | null>(null);
  const [isDeleting, setIsDeleting] = useState<Id<"suppliers"> | null>(null);
  const [isSettingFeatured, setIsSettingFeatured] = useState<Id<"suppliers"> | null>(null);

  // Add helper functions for toast
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

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

  // RecentActivityCard component
  function RecentActivityCard({
    orders,
    reviews,
  }: {
    orders: any[];
    reviews: any[];
  }) {
    const { formatCurrency } = useCurrency();
    
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">{t('admin.recent_activity')}</h3>
        <div className="mb-6">
          <div className="mb-2 text-sm font-bold">{t('admin.latest_orders')}</div>
          <ul className="pl-4 list-disc">
            {orders.map((order) => (
              <li key={order.id} className="mb-1">
                {t('admin.order')} #{order.num}: {formatCurrency(order.montant)}{' '}
                <span className="ml-2 text-gray-400 text-xs">({order.supplier})</span>
              </li>
            ))}
            {orders.length === 0 && <li className="text-gray-400">{t('admin.no_orders')}</li>}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-sm font-bold">{t('admin.latest_reviews')}</div>
          <ul className="pl-4 list-disc">
            {reviews.map((review) => (
              <li key={review.id} className="mb-1">
                {review.user}: <span className="italic">"{review.comment}"</span>
              </li>
            ))}
            {reviews.length === 0 && <li className="text-gray-400">{t('admin.no_reviews')}</li>}
          </ul>
        </div>
      </div>
    );
  }

  // Supplier Details Modal component
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
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white">
                <i className="ri-admin-line text-xl" />
              </span>
              <span
                className="text-xl font-bold text-green-600"
                style={{ fontFamily: 'Pacifico, serif' }}
              >
                NaijaFind
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
                onClick={() => setActiveTab('featured')}
                className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                  activeTab === 'featured'
                    ? 'bg-green-600 text-white shadow'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <i className="ri-star-line text-lg" />
                <span className="font-medium">{t('admin.featured_businesses')}</span>
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
                {activeTab === 'featured' && t('admin.featured_businesses')}
              </h1>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-6">
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
      
      {/* Add Toast */}
      <Toast toast={toast} onDismiss={() => setToast(null)} t={t} />
    </div>
  );
}
