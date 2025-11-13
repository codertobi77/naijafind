import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useConvexAuth } from 'convex/react';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { useTranslation } from 'react-i18next';

const mockStats = {
  fournisseurs: 12,
  utilisateurs: 350,
  commandes: 80,
  avis: 31,
  caTotal: 3400000,
};
const mockSuppliers = [
  {id: 1, name: 'ABC Ltd', email:'abc@company.com', active:true},
  {id: 2, name: 'Soleil SARL', email:'hello@soleil.com', active:false},
  {id: 3, name: 'Digitex', email:'contact@digitex.ng', active:true},
];
const mockOrders = [
  {id:1,num:'0001', montant:15000, date:Date.now()-9000000, supplier:'ABC Ltd'},
  {id:2,num:'0002', montant:32000, date:Date.now()-700000, supplier:'Digitex'},
];
const mockReviews=[
  {id:1, user:'Ola K.', comment:'Super service', date:Date.now()-3200000},
  {id:2, user:'Helen', comment:'Livraison rapide', date:Date.now()-4300000},
];

export default function AdminPage(){
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { data: meData } = useConvexQuery(
    api.users.me,
    {},
    { staleTime: 2 * 60 * 1000 } // Cache user data for 2 minutes
  );
  const { data: categories } = useConvexQuery(
    api.categories.getAllCategoriesAdmin,
    {},
    { staleTime: 5 * 60 * 1000 } // Cache categories for 5 minutes
  );
  const addCategory = useMutation(api.categories.addCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const initCategories = useMutation(api.init.initCategories);
  
  const [fournisseurs,setFournisseurs] = useState(mockSuppliers);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
    is_active: true,
    order: 0
  });

  // Vérifier l'accès admin
  const isAdmin = meData?.user?.is_admin === true || meData?.user?.user_type === 'admin';

  // Rediriger si pas admin
  React.useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate('/');
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert(t('admin.name_required'));
      return;
    }
    try {
      await addCategory({
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        icon: categoryForm.icon || undefined,
        is_active: categoryForm.is_active,
        order: categoryForm.order ? BigInt(categoryForm.order) : undefined,
      });
      setCategoryForm({ name: '', description: '', icon: '', is_active: true, order: 0 });
      setShowAddCategory(false);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'ajout de la catégorie');
    }
  };

  const handleUpdateCategory = async (id: any) => {
    if (!categoryForm.name.trim()) {
      alert(t('admin.name_required'));
      return;
    }
    try {
      await updateCategory({
        id,
        name: categoryForm.name,
        description: categoryForm.description || undefined,
        icon: categoryForm.icon || undefined,
        is_active: categoryForm.is_active,
        order: categoryForm.order ? BigInt(categoryForm.order) : undefined,
      });
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', icon: '', is_active: true, order: 0 });
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la modification de la catégorie');
    }
  };

  const handleDeleteCategory = async (id: any) => {
    if (!confirm(t('admin.confirm_delete'))) return;
    try {
      await deleteCategory({ id });
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression de la catégorie');
    }
  };

  const startEdit = (category: any) => {
    setEditingCategory(category._id);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      is_active: category.is_active ?? true,
      order: category.order ? Number(category.order) : 0,
    });
    setShowAddCategory(false);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', icon: '', is_active: true, order: 0 });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('msg.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Link to="/" className="text-xl sm:text-2xl font-bold text-green-600" style={{ fontFamily: "Pacifico, serif" }}>
            {t('admin.title')}
          </Link>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid md:grid-cols-5 gap-6 mb-10">
          <div className="bg-white rounded-lg shadow-sm p-5 col-span-1 text-center"><div className="text-xs text-gray-400">{t('admin.suppliers')}</div><div className="text-xl font-bold">{mockStats.fournisseurs}</div></div>
          <div className="bg-white rounded-lg shadow-sm p-5 col-span-1 text-center"><div className="text-xs text-gray-400">{t('admin.users')}</div><div className="text-xl font-bold">{mockStats.utilisateurs}</div></div>
          <div className="bg-white rounded-lg shadow-sm p-5 col-span-1 text-center"><div className="text-xs text-gray-400">{t('admin.orders')}</div><div className="text-xl font-bold">{mockStats.commandes}</div></div>
          <div className="bg-white rounded-lg shadow-sm p-5 col-span-1 text-center"><div className="text-xs text-gray-400">{t('admin.reviews')}</div><div className="text-xl font-bold">{mockStats.avis}</div></div>
          <div className="bg-white rounded-lg shadow-sm p-5 col-span-1 text-center"><div className="text-xs text-gray-400">{t('admin.total_revenue')}</div><div className="text-xl font-bold">₦{mockStats.caTotal.toLocaleString()}</div></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Fournisseurs */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">{t('admin.suppliers_list')}</h3>
            <table className="min-w-full text-sm">
              <thead><tr><th>{t('admin.name')}</th><th>{t('admin.email')}</th><th>{t('admin.status')}</th><th>{t('admin.actions')}</th></tr></thead>
              <tbody>
                {fournisseurs.map(f=>(
                  <tr key={f.id} className="border-b">
                    <td className="py-2 font-medium">{f.name}</td>
                    <td>{f.email}</td>
                    <td>{f.active? <span className="text-green-600">{t('admin.active')}</span>: <span className="text-red-600">{t('admin.inactive')}</span>}</td>
                    <td>
                      <button onClick={()=>setFournisseurs(list=>list.map(x=>x.id===f.id?{...x,active:!x.active}:x))} className="text-xs mr-1 px-2 py-1 rounded border border-gray-300 hover:bg-green-50">
                        {f.active? t('admin.disable') : t('admin.enable')}
                      </button>
                      <button className="text-xs text-red-700 px-2 py-1 rounded border border-red-100 hover:bg-red-100" onClick={()=>setFournisseurs(list=>list.filter(x=>x.id!==f.id))}>{t('admin.delete')}</button>
                    </td>
                  </tr>
                ))}
                {fournisseurs.length===0 && <tr><td colSpan={4} className="text-center text-gray-400 p-4">{t('admin.no_suppliers')}</td></tr>}
              </tbody>
            </table>
          </div>
          {/* Activité récente */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">{t('admin.recent_activity')}</h3>
            <div className="mb-6">
              <div className="mb-2 text-sm font-bold">{t('admin.latest_orders')}</div>
              <ul className="pl-4 list-disc">
                {mockOrders.map(o=>(<li key={o.id} className="mb-1">{t('admin.order')} #{o.num}: ₦{o.montant.toLocaleString()} <span className="ml-2 text-gray-400 text-xs">({o.supplier})</span></li>))}
                {mockOrders.length===0 && <li className="text-gray-400">{t('admin.no_orders')}</li>}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-sm font-bold">{t('admin.latest_reviews')}</div>
              <ul className="pl-4 list-disc">
                {mockReviews.map(r=>(<li key={r.id} className="mb-1">{r.user}: <span className="italic">"{r.comment}"</span></li>))}
                {mockReviews.length===0 && <li className="text-gray-400">{t('admin.no_reviews')}</li>}
              </ul>
            </div>
          </div>
          
          {/* Gestion des Catégories */}
          <div className="bg-white rounded-lg border p-6 col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">{t('admin.category_management')}</h3>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (confirm(t('admin.confirm_init'))) {
                      try {
                        const result = await initCategories({});
                        alert(result.message || t('admin.init_success'));
                      } catch (error: any) {
                        alert(error.message || 'Erreur lors de l\'initialisation');
                      }
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  🔄 {t('admin.init_categories')}
                </button>
                <button
                  onClick={() => {
                    setShowAddCategory(true);
                    setEditingCategory(null);
                    setCategoryForm({ name: '', description: '', icon: '', is_active: true, order: 0 });
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  + {t('admin.add_category')}
                </button>
              </div>
            </div>

            {showAddCategory && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium mb-3">{t('admin.new_category')}</h4>
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
                    onClick={handleAddCategory}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    {t('admin.add')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCategory(false);
                      setCategoryForm({ name: '', description: '', icon: '', is_active: true, order: 0 });
                    }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    {t('admin.cancel')}
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">{t('admin.name')}</th>
                    <th className="text-left py-2 px-2">{t('admin.description')}</th>
                    <th className="text-left py-2 px-2">{t('admin.icon')}</th>
                    <th className="text-left py-2 px-2">{t('admin.display_order')}</th>
                    <th className="text-left py-2 px-2">{t('admin.status')}</th>
                    <th className="text-left py-2 px-2">{t('admin.actions')}</th>
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
                            {category.icon && <i className={category.icon}></i>}
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
      </div>
    </div>
  );
}