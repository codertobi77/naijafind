import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { CSVLink } from "react-csv";
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useNavigate } from 'react-router-dom';

interface DashboardData {
  profile: any;
  stats: {
    totalOrders: number;
    totalProducts: number;
    totalReviews: number;
    averageRating: number;
    monthlyRevenue: number;
    monthlyPerformance: { month: string; value: number }[];
  };
  recentOrders: any[];
  recentReviews: any[];
}

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const meData = useQuery(api.users.me, {});
  const navigate = useNavigate();

  // Redirection accès refusé : non authentifié ou mauvais rôle
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || meData?.user?.user_type !== 'supplier')) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, isLoading, meData, navigate]);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [profileData, setProfileData] = useState({
    business_name: '',
    description: '',
    category: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    website: '',
    business_hours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true }
    },
    social_links: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      whatsapp: ''
    }
  });

  const categories = [
    'Agriculture', 'Textile', 'Électronique', 'Alimentation', 
    'Construction', 'Automobile', 'Santé & Beauté', 'Éducation', 'Services'
  ];

  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
    'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
    'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  const dayNames = {
    monday: 'Lundi',
    tuesday: 'Mardi', 
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
  };

  // Configuration des plans d'abonnement
  const subscriptionPlans = {
    free: {
      name: 'Gratuit',
      maxProducts: 5,
      features: ['5 produits max', 'Support de base', 'Profil simple'],
      canAccessAnalytics: false,
      canAccessPremiumFeatures: false,
      canCustomizeProfile: true,
      maxPhotos: 3
    },
    basic: {
      name: 'Basic',
      maxProducts: 50,
      features: ['50 produits', 'Support prioritaire', 'Analytics de base', 'Badge vérifié'],
      canAccessAnalytics: true,
      canAccessPremiumFeatures: false,
      canCustomizeProfile: true,
      maxPhotos: 10
    },
    premium: {
      name: 'Premium',
      maxProducts: -1, // illimité
      features: ['Produits illimités', 'Support 24/7', 'Analytics avancées', 'Promotion prioritaire'],
      canAccessAnalytics: true,
      canAccessPremiumFeatures: true,
      canCustomizeProfile: true,
      maxPhotos: -1 // illimité
    }
  };

  const currentPlan = data?.profile?.subscription_plan || 'free';
  const planConfig = subscriptionPlans[currentPlan as keyof typeof subscriptionPlans];

  // Etats Produits
  const [products, setProducts] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showProductDeleteModal, setShowProductDeleteModal] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'add'|'edit'|'delete'>('add');
  const [productModalData, setProductModalData] = useState<any>(null);
  // Etats Commandes
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showOrderDeleteModal, setShowOrderDeleteModal] = useState(false);
  const [orderModalMode, setOrderModalMode] = useState<'add'|'edit'|'delete'>('add');
  const [orderModalData, setOrderModalData] = useState<any>(null);
  const [orderForm, setOrderForm] = useState<{ order_number: string; total_amount: string | number; status: string }>({ order_number: '', total_amount: '', status: 'pending' });
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState<'all'|'pending'|'completed'>('all');
  const [orderPage, setOrderPage] = useState(1);
  const [orderOpLoading, setOrderOpLoading] = useState(false);
  const [orderToast, setOrderToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // Etats Avis (pour éviter erreurs de compilation)
  const [showReviewRespondModal, setShowReviewRespondModal] = useState(false);
  const [showReviewDeleteModal, setShowReviewDeleteModal] = useState(false);
  const [reviewModalMode, setReviewModalMode] = useState<'respond'|'delete'>('respond');
  const [reviewModalData, setReviewModalData] = useState<any>(null);
  const [reviewOpLoading, setReviewOpLoading] = useState(false);
  const [reviewToast, setReviewToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // Etats Paiement (mock)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentPlanChoice, setPaymentPlanChoice] = useState('basic');
  const [notifications, setNotifications] = useState([
    {id: 1, type: 'order', message: "Nouvelle commande reçue #0001", read: false, created_at: Date.now()},
    {id: 2, type: 'review', message: "Nouvel avis client ajouté", read: false, created_at: Date.now() - 1_000_000},
    {id: 3, type: 'info', message: "Votre profil a été validé.", read: true, created_at: Date.now() - 86400000},
  ]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLButtonElement>(null);

  // Etats simulation paiement/abonnements
  const [mockPayments, setMockPayments] = useState([
    { id: 1, plan: 'basic', amount: 5000, date: Date.now() - 80*86400000, status: 'paid' },
    { id: 2, plan: 'premium', amount: 15000, date: Date.now() - 10*86400000, status: 'pending' },
  ]);
  const [simPayOpen, setSimPayOpen] = useState(false);
  const [simPayStatus, setSimPayStatus] = useState<'idle'|'pending'|'success'|'failed'>('idle');
  const [simChosenPlan, setSimChosenPlan] = useState<null|string>(null);

  const unreadCount = notifications.filter(n=>!n.read).length;
  const handleMarkRead = (id:number) => setNotifications(list=>list.map(n=>n.id===id?{...n,read:true}:n));
  const handleDeleteNotif = (id:number) => setNotifications(list=>list.filter(n=>n.id!==id));

  useEffect(() => {
    if (data?.products && Array.isArray(data.products)) setProducts(data.products);
    else setProducts([
      { id: 1, name: 'Produit A', price: 15000, stock: 20, status: 'active' },
      { id: 2, name: 'Produit B', price: 32000, stock: 0, status: 'inactive' },
    ]);
  }, [data]);

  useEffect(() => {
    if (orderModalMode === 'edit' && orderModalData) {
      setOrderForm({
        order_number: orderModalData.order_number || '',
        total_amount: orderModalData.total_amount || '',
        status: orderModalData.status || 'pending'
      });
    } else if (orderModalMode === 'add') {
      setOrderForm({ order_number: '', total_amount: '', status: 'pending' });
    }
  }, [orderModalMode, orderModalData, showOrderModal]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/supplier-dashboard`,
        {
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
          }
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setData(result);
        if (result.profile) {
          setProfileData({
            business_name: result.profile.business_name || '',
            description: result.profile.description || '',
            category: result.profile.category || '',
            address: result.profile.address || '',
            city: result.profile.city || '',
            state: result.profile.state || '',
            phone: result.profile.business_phone || '',
            email: result.profile.business_email || '',
            website: result.profile.website || '',
            business_hours: result.profile.business_hours || profileData.business_hours,
            social_links: result.profile.social_links || profileData.social_links
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/update-supplier-profile`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(profileData)
        }
      );

      if (response.ok) {
        setSaveStatus('success');
        setEditMode(false);
        await fetchDashboardData();
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('user.profile');
    window.REACT_APP_NAVIGATE('/');
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBusinessHoursChange = (day: string, field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day as keyof typeof prev.business_hours],
          [field]: value
        }
      }
    }));
  };

  const handleSocialLinksChange = (platform: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }));
  };

  const checkFeatureAccess = (feature: string) => {
    switch (feature) {
      case 'analytics':
        return planConfig.canAccessAnalytics;
      case 'premium':
        return planConfig.canAccessPremiumFeatures;
      case 'products':
        return data?.stats.totalProducts < planConfig.maxProducts || planConfig.maxProducts === -1;
      default:
        return true;
    }
  };

  const showUpgradePrompt = (feature: string) => {
    setShowUpgradeModal(true);
  };

  // Gestion CRUD Produits côté Dashboard (à placer dans Dashboard)
  const handleAddProduct = async (formData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/products-crud`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchDashboardData();
      return {success: true};
    } catch (err) { return {success: false, error: err.message}; }
  }

  // Gestion CRUD Commandes côté Dashboard
  const handleAddOrder = async (formData: { order_number: string; total_amount: number | string; status: string }) => {
    try {
      setOrderOpLoading(true);
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/orders-crud`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...formData, total_amount: Number(formData.total_amount) }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchDashboardData();
      setOrderToast({ type: 'success', message: 'Commande ajoutée avec succès' });
      return { success: true };
    } catch (err: any) { setOrderToast({ type: 'error', message: err.message || 'Erreur lors de l\'ajout' }); return { success: false, error: err.message }; }
    finally { setOrderOpLoading(false); }
  };

  const handleEditOrder = async (formData: { id: number; order_number: string; total_amount: number | string; status: string }) => {
    try {
      setOrderOpLoading(true);
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/orders-crud`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...formData, total_amount: Number(formData.total_amount) }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchDashboardData();
      setOrderToast({ type: 'success', message: 'Commande mise à jour' });
      return { success: true };
    } catch (err: any) { setOrderToast({ type: 'error', message: err.message || 'Erreur lors de la mise à jour' }); return { success: false, error: err.message }; }
    finally { setOrderOpLoading(false); }
  };

  const handleDeleteOrder = async (id: number) => {
    try {
      setOrderOpLoading(true);
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/orders-crud?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
        }
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchDashboardData();
      setOrderToast({ type: 'success', message: 'Commande supprimée' });
      return { success: true };
    } catch (err: any) { setOrderToast({ type: 'error', message: err.message || 'Erreur lors de la suppression' }); return { success: false, error: err.message }; }
    finally { setOrderOpLoading(false); }
  };

  const handleEditProduct = async (formData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/products-crud`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchDashboardData();
      return {success: true};
    } catch (err) { return {success: false, error: err.message}; }
  }

  const handleDeleteProduct = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/products-crud?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
        }
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchDashboardData();
      return {success: true};
    } catch (err) { return {success: false, error: err.message}; }
  }

  // Gestion Avis
  const handleUpdateReview = async (payload: { id: number; status?: string; response?: string }) => {
    try {
      setReviewOpLoading(true);
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/reviews-crud`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchDashboardData();
      setReviewToast({ type: 'success', message: 'Avis mis à jour' });
      return { success: true };
    } catch (err: any) { setReviewToast({ type: 'error', message: err.message || 'Erreur lors de la mise à jour' }); return { success: false, error: err.message }; }
    finally { setReviewOpLoading(false); }
  };

  const handleDeleteReview = async (id: number) => {
    try {
      setReviewOpLoading(true);
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/reviews-crud?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token.access_token}`,
          'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
        }
      });
      if (!response.ok) throw new Error((await response.json()).error);
      await fetchDashboardData();
      setReviewToast({ type: 'success', message: 'Avis supprimé' });
      return { success: true };
    } catch (err: any) { setReviewToast({ type: 'error', message: err.message || 'Erreur lors de la suppression' }); return { success: false, error: err.message }; }
    finally { setReviewOpLoading(false); }
  };

  // Préparer analytics mensuels à partir des commandes et reviews :
  const monthlyAggregates = (() => {
    // Clef "YYYY-MM" -> { revenue, orders, reviews }
    const orders = (data as any)?.orders || [];
    const reviews = (data as any)?.reviews || [];
    const agg: Record<string, { month: string; revenue: number; orders: number; reviews: number }> = {};
    orders.forEach((o:any) => {
      const date = o.created_at ? new Date(o.created_at) : new Date();
      const k = date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0');
      if (!agg[k]) agg[k] = { month: k, revenue: 0, orders: 0, reviews: 0 };
      agg[k].revenue += Number(o.total_amount||0);
      agg[k].orders += 1;
    });
    reviews.forEach((r:any)=>{
      const date = r.created_at ? new Date(r.created_at) : new Date();
      const k = date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0');
      if (!agg[k]) agg[k] = { month: k, revenue: 0, orders: 0, reviews: 0 };
      agg[k].reviews += 1;
    });
    // Sort by month asc
    return Object.values(agg).sort((a,b)=>a.month.localeCompare(b.month));
  })();

  // Action simulate
  const handleMockPay = useCallback((planId:string, amount:number) => {
    setSimPayStatus('pending');
    setTimeout(()=>{
      const success = Math.random() > 0.3; // 70% réussite
      setSimPayStatus(success?'success':'failed');
      if (success) setMockPayments(list=>[
        ...list,
        { id: Math.random(), plan: planId, amount, date: Date.now(), status: 'paid' }
      ]);
    }, 2000);
  }, []);

  // ... après les états existants dans Dashboard :
  const [team, setTeam] = useState([
    { id: 1, name: 'Alice N.', email: 'alice@naijafind.com', role: 'admin', status: 'active', isMe: true },
    { id: 2, name: 'Sam O.', email: 'sam@society.com', role: 'editor', status: 'active' },
    { id: 3, name: 'Jean L.', email: 'jean@naijafind.com', role: 'editor', status: 'pending' },
  ]);
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState('editor');
  const [showInvite, setShowInvite] = useState(false);
  const handleInvite = () => {
    if (!invEmail.includes('@') || !invRole) return;
    setTeam(list => [...list, { id: Math.random(), name: invEmail.split('@')[0], email: invEmail, role: invRole, status: 'pending' }]);
    setInvEmail(''); setInvRole('editor'); setShowInvite(false);
  };
  const handleRemoveUser = (id) => setTeam(list => list.filter(u=>u.id!==id));
  const handleChangeRole = (id, newRole) => setTeam(list => list.map(u=>u.id===id ? {...u, role: newRole} : u));
  const handleValidate = id => setTeam(list=>list.map(u=>u.id===id?{...u,status:'active'}:u));

  // Pour multi-session mock :
  const [currentUser, setCurrentUser] = useState(team[0]);
  useEffect(()=>{setCurrentUser(team.find(u=>u.isMe)||team[0]);}, [team]);
  const otherUsers = team.filter(u=>!u.isMe && u.status==='active');

  // Dans les tabs (vers tab.settings/subscription)
  {[
   { id: 'overview', label: 'Aperçu', icon: 'ri-dashboard-line', mobile: 'Aperçu' },
   { id: 'profile', label: 'Profil entreprise', icon: 'ri-building-line', mobile: 'Profil' },
   { id: 'products', label: 'Produits', icon: 'ri-product-hunt-line', mobile: 'Produits' },
   { id: 'orders', label: 'Commandes', icon: 'ri-shopping-cart-line', mobile: 'Commandes' },
   { id: 'reviews', label: 'Avis', icon: 'ri-star-line', mobile: 'Avis' },
   { id: 'analytics', label: 'Analytics', icon: 'ri-bar-chart-line', mobile: 'Analytics', premium: !planConfig.canAccessAnalytics },
   { id: 'subscription', label: 'Abonnement', icon: 'ri-vip-crown-line', mobile: 'Plan' },
   { id: 'team', label: 'Équipe', icon: 'ri-team-line', mobile: 'Équipe' }
  ].map(tab =>  )}

  // Ajoute le rendu "tab équipe" :
  {activeTab==='team' && (
    <div className="">
      <h3 className="text-lg font-semibold mb-6">Gestion de l'équipe</h3>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-gray-700">Membres de l'entreprise :</span>
        <button className="bg-green-600 text-white px-3 py-1 rounded text-sm" onClick={()=>setShowInvite(true)}><i className="ri-user-add-line mr-1"></i>Inviter un membre</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {team.map(u=>(
              <tr key={u.id} className="border-b">
                <td className="py-2 font-medium">{u.name}{u.isMe && <span className="ml-1 bg-green-100 text-green-800 px-2 rounded text-xs">Vous</span>}</td>
                <td>{u.email}</td>
                <td>
                  <select disabled={u.isMe} value={u.role} onChange={e=>handleChangeRole(u.id,e.target.value)} className="border p-1 rounded">
                    <option value="admin">Admin</option>
                    <option value="editor">Éditeur</option>
                  </select>
                </td>
                <td>{u.status==='active'?<span className="text-green-600">Actif</span>:<span className="text-yellow-600">En attente</span>}{u.status==='pending' && <button className="ml-2 text-xs text-green-600 underline" onClick={()=>handleValidate(u.id)}>Valider</button>}</td>
                <td>
                  {!u.isMe && <button className="text-xs text-red-700 px-2 py-1 rounded border border-red-100 hover:bg-red-100" onClick={()=>handleRemoveUser(u.id)}>Supprimer</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded p-6 shadow w-full max-w-md">
            <div className="mb-3 text-lg font-semibold">Inviter un membre</div>
            <input className="border px-3 py-2 w-full rounded mb-3" type="email" value={invEmail} onChange={e=>setInvEmail(e.target.value)} placeholder="Email du membre à inviter" />
            <div className="mb-2">
              <select className="border px-2 py-1 rounded w-full" value={invRole} onChange={e=>setInvRole(e.target.value)}>
                <option value="editor">Éditeur</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 bg-gray-200 rounded" onClick={()=>setShowInvite(false)}>Annuler</button>
              <button className="px-3 py-1 bg-green-600 text-white rounded" disabled={!invEmail.includes('@')} onClick={handleInvite}>Inviter</button>
            </div>
          </div>
        </div>
      )}
      {/* Switch utilisateur actuel (si plusieurs users actifs) */}
      {otherUsers.length>0 && (
        <div className="mt-8 pt-6 border-t text-xs text-gray-500 flex gap-2 items-baseline">
          Changer d'utilisateur : 
          <select value={currentUser.id} onChange={e=>setCurrentUser(team.find(u=>u.id==e.target.value)||team[0])} className="ml-2 border border-green-200 px-2 py-1 rounded">
            {team.filter(u=>u.status==='active').map(u=>(
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )}
  // ...

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-green-50 to-white border-r border-green-100 transform transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-green-100">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <i className="ri-store-line text-white text-xl"></i>
              </div>
              <span className="text-xl font-bold text-green-600" style={{ fontFamily: "Pacifico, serif" }}>
                NaijaFind
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-2">
              {[
                { id: 'overview', label: 'Aperçu', icon: 'ri-dashboard-line', premium: false },
                { id: 'profile', label: 'Profil', icon: 'ri-building-line', premium: false },
                { id: 'products', label: 'Produits', icon: 'ri-product-hunt-line', premium: false },
                { id: 'orders', label: 'Commandes', icon: 'ri-shopping-cart-line', premium: false },
                { id: 'reviews', label: 'Avis', icon: 'ri-star-line', premium: false },
                { id: 'analytics', label: 'Analytics', icon: 'ri-bar-chart-line', premium: !planConfig.canAccessAnalytics },
                { id: 'subscription', label: 'Abonnement', icon: 'ri-vip-crown-line', premium: false },
                { id: 'team', label: 'Équipe', icon: 'ri-team-line', premium: false }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.premium) {
                      showUpgradePrompt('analytics');
                    } else {
                      setActiveTab(tab.id);
                      setSidebarOpen(false); // Close sidebar on mobile after selection
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                  } ${tab.premium ? 'opacity-60' : ''}`}
                >
                  <i className={`${tab.icon} text-lg`}></i>
                  <span className="font-medium">{tab.label}</span>
                  {tab.premium && <i className="ri-lock-line text-sm ml-auto"></i>}
                </button>
              ))}
            </div>
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-green-100">
            <div className="flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-green-50 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-white"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{data?.profile?.business_name || 'Mon entreprise'}</p>
                <p className="text-xs text-gray-500 truncate">{planConfig.name} Plan</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                  <i className="ri-menu-line text-xl"></i>
                </button>
                
                {/* Page Title */}
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {activeTab === 'overview' && 'Aperçu'}
                    {activeTab === 'profile' && 'Profil entreprise'}
                    {activeTab === 'products' && 'Produits'}
                    {activeTab === 'orders' && 'Commandes'}
                    {activeTab === 'reviews' && 'Avis'}
                    {activeTab === 'analytics' && 'Analytics'}
                    {activeTab === 'subscription' && 'Abonnement'}
                    {activeTab === 'team' && 'Équipe'}
                  </h1>
                </div>
              </div>

                {/* Plan Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentPlan === 'premium' ? 'bg-purple-100 text-purple-800' :
                  currentPlan === 'basic' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {planConfig.name}
                </div>
                
                {/* Notifications */}
                <div className="relative">
                  <button ref={notifRef}
                    className={`p-2 text-gray-400 hover:text-gray-600 relative rounded-lg hover:bg-gray-100`} onClick={()=>setNotifOpen(o=>!o)}>
                    <i className="ri-notification-line text-xl"></i>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full px-1 min-w-[18px] h-[18px] flex items-center justify-center">{unreadCount}</span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                      <div className="px-4 py-3 border-b font-bold text-gray-700 flex justify-between items-center bg-gray-50">
                        Notifications
                        <button className="text-xs text-gray-400 hover:text-gray-700" onClick={()=>setNotifOpen(false)}><i className="ri-close-line"></i></button>
                      </div>
                      {notifications.length === 0 && <div className="p-4 text-gray-500 text-center">Aucune notification</div>}
                      {notifications.map(n=>(
                        <div key={n.id} className={`px-4 py-3 flex justify-between items-start space-x-2 border-b last:border-0 ${n.read ? 'bg-white' : 'bg-yellow-50'}`} >
                          <div className="flex-1 text-sm">
                            <div className="font-semibold mb-1">{n.type==='order'?<i className="ri-shopping-cart-line text-green-600"></i>:n.type==='review'?<i className="ri-star-line text-yellow-600"></i>:<i className="ri-information-line text-blue-500"></i>} <span className="ml-2">{n.message}</span></div>
                            <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString('fr-FR')}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!n.read && <button className="text-xs text-green-600 hover:text-green-700" onClick={()=>handleMarkRead(n.id)}>Marquer lu</button>}
                            <button className="text-xs text-red-500 hover:text-red-700" onClick={()=>handleDeleteNotif(n.id)}><i className="ri-delete-bin-line"></i></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* User Menu */}
                <div className="relative">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <i className="ri-user-line text-white text-sm"></i>
                    </div>
                    <span className="hidden sm:inline font-medium truncate max-w-32">{data?.profile?.business_name || 'Utilisateur'}</span>
                    <i className="ri-arrow-down-s-line hidden sm:inline text-sm"></i>
                  </button>
                </div>
                
                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                  title="Déconnexion"
                >
                  <i className="ri-logout-box-line text-xl"></i>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Welcome Section - Only show on overview */}
            {activeTab === 'overview' && (
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Bienvenue, {data?.profile?.business_name}
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Gérez votre entreprise et suivez vos performances
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {saveStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
                <i className="ri-check-line mr-2"></i>
                Profil mis à jour avec succès !
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
                <i className="ri-error-warning-line mr-2"></i>
                Erreur lors de la mise à jour. Veuillez réessayer.
              </div>
            )}

            {/* Stats Cards - Only show on overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-shopping-cart-line text-lg sm:text-2xl text-blue-600"></i>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Commandes</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{data?.stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-product-hunt-line text-lg sm:text-2xl text-green-600"></i>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Produits</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {data?.stats.totalProducts}
                  {planConfig.maxProducts !== -1 && (
                    <span className="text-sm text-gray-500">/{planConfig.maxProducts}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="ri-star-line text-lg sm:text-2xl text-yellow-600"></i>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Note</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{data?.stats.averageRating}/5</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-lg sm:text-2xl text-purple-600"></i>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Revenus</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">₦{data?.stats.monthlyRevenue?.toLocaleString()}</p>
              </div>
            </div>
          </div>
            )}

            {/* Content Sections */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Commandes récentes */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Commandes récentes</h3>
                  <div className="space-y-4">
                    {data?.recentOrders?.length > 0 ? (
                      data.recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">#{order.order_number}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₦{parseFloat(order.total_amount).toLocaleString()}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">Aucune commande récente</p>
                    )}
                  </div>
                </div>

                {/* Avis récents */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Avis récents</h3>
                  <div className="space-y-4">
                    {data?.recentReviews?.length > 0 ? (
                      data.recentReviews.map((review) => (
                        <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <i
                                  key={star}
                                  className={`ri-star-${star <= review.rating ? 'fill' : 'line'} text-yellow-400 text-sm`}
                                ></i>
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{review.comment}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">Aucun avis récent</p>
                    )}
                  </div>
                </div>
              </div>
              )}

              {activeTab === 'profile' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <h3 className="text-lg font-semibold">Profil de votre entreprise</h3>
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      <i className="ri-edit-line mr-2"></i>
                      Modifier le profil
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setEditMode(false)}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <i className="ri-loader-4-line animate-spin mr-2"></i>
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <i className="ri-save-line mr-2"></i>
                            Sauvegarder
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                  {/* Informations générales */}
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Informations générales</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom de l'entreprise *
                          </label>
                          {editMode ? (
                            <input
                              type="text"
                              value={profileData.business_name}
                              onChange={(e) => handleInputChange('business_name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            />
                          ) : (
                            <p className="text-gray-900">{profileData.business_name || 'Non renseigné'}</p>
                          )}
                          <div className="text-xs text-gray-600 mt-1">Ce nom sera visible publiquement sur votre profil fournisseur.</div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description de l'entreprise *
                          </label>
                          {editMode ? (
                            <textarea
                              rows={4}
                              value={profileData.description}
                              onChange={(e) => handleInputChange('description', e.target.value)}
                              maxLength={500}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              placeholder="Décrivez votre entreprise et vos services..."
                            />
                          ) : (
                            <p className="text-gray-900">{profileData.description || 'Non renseigné'}</p>
                          )}
                          <div className="text-xs text-gray-600 mt-1">Décrivez votre entreprise (max. 500 caractères).</div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Catégorie *
                          </label>
                          {editMode ? (
                            <select
                              value={profileData.category}
                              onChange={(e) => handleInputChange('category', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8 text-sm"
                            >
                              <option value="">Sélectionnez une catégorie</option>
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-gray-900">{profileData.category || 'Non renseigné'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Informations de contact</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email professionnel *
                          </label>
                          {editMode ? (
                            <input
                              type="email"
                              value={profileData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            />
                          ) : (
                            <p className="text-gray-900">{profileData.email || 'Non renseigné'}</p>
                          )}
                          <div className="text-xs text-gray-600 mt-1">Ce nom sera visible publiquement sur votre profil fournisseur.</div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Téléphone *
                          </label>
                          {editMode ? (
                            <input
                              type="tel"
                              value={profileData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              placeholder="+234 xxx xxx xxxx"
                            />
                          ) : (
                            <p className="text-gray-900">{profileData.phone || 'Non renseigné'}</p>
                          )}
                          <div className="text-xs text-gray-600 mt-1">Ce numéro sera visible publiquement sur votre profil fournisseur.</div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Site web
                          </label>
                          {editMode ? (
                            <input
                              type="url"
                              value={profileData.website}
                              onChange={(e) => handleInputChange('website', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              placeholder="https://votre-site.com"
                            />
                          ) : (
                            <p className="text-gray-900">{profileData.website || 'Non renseigné'}</p>
                          )}
                          <div className="text-xs text-gray-600 mt-1">Ce lien sera visible publiquement sur votre profil fournisseur.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Localisation et horaires */}
                  <div className="space-y-6">
                    {/* Adresse */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Localisation</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Adresse complète *
                          </label>
                          {editMode ? (
                            <input
                              type="text"
                              value={profileData.address}
                              onChange={(e) => handleInputChange('address', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              placeholder="Numéro, rue, quartier..."
                            />
                          ) : (
                            <p className="text-gray-900">{profileData.address || 'Non renseigné'}</p>
                          )}
                          <div className="text-xs text-gray-600 mt-1">Ce numéro et cette adresse seront visibles publiquement sur votre profil fournisseur.</div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Ville *
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                value={profileData.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              />
                            ) : (
                              <p className="text-gray-900">{profileData.city || 'Non renseigné'}</p>
                            )}
                            <div className="text-xs text-gray-600 mt-1">Ce nom de ville sera visible publiquement sur votre profil fournisseur.</div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              État *
                            </label>
                            {editMode ? (
                              <select
                                value={profileData.state}
                                onChange={(e) => handleInputChange('state', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8 text-sm"
                              >
                                <option value="">Sélectionnez un état</option>
                                {nigerianStates.map(state => (
                                  <option key={state} value={state}>{state}</option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-gray-900">{profileData.state || 'Non renseigné'}</p>
                            )}
                            <div className="text-xs text-gray-600 mt-1">Ce nom d'état sera visible publiquement sur votre profil fournisseur.</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Horaires d'ouverture */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Horaires d'ouverture</h4>
                      
                      <div className="space-y-3">
                        {Object.entries(dayNames).map(([day, dayLabel]) => (
                          <div key={day} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="w-full sm:w-20 text-sm font-medium text-gray-700">
                              {dayLabel}
                            </div>
                            
                            {editMode ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={!profileData.business_hours[day as keyof typeof profileData.business_hours]?.closed}
                                    onChange={(e) => handleBusinessHoursChange(day, 'closed', !e.target.checked)}
                                    className="mr-2"
                                  />
                                  <span className="text-sm">Ouvert</span>
                                </label>
                                
                                {!profileData.business_hours[day as keyof typeof profileData.business_hours]?.closed && (
                                  <>
                                    <input
                                      type="time"
                                      value={profileData.business_hours[day as keyof typeof profileData.business_hours]?.open || '08:00'}
                                      onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                    <span className="text-gray-500 text-sm">à</span>
                                    <input
                                      type="time"
                                      value={profileData.business_hours[day as keyof typeof profileData.business_hours]?.close || '18:00'}
                                      onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-900">
                                {profileData.business_hours[day as keyof typeof profileData.business_hours]?.closed ? (
                                  <span className="text-red-600">Fermé</span>
                                ) : (
                                  <span>
                                    {profileData.business_hours[day as keyof typeof profileData.business_hours]?.open || '08:00'} - {profileData.business_hours[day as keyof typeof profileData.business_hours]?.close || '18:00'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Réseaux sociaux */}
                    {planConfig.canCustomizeProfile && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Réseaux sociaux</h4>
                        
                        <div className="space-y-4">
                          {[
                            { key: 'facebook', label: 'Facebook', icon: 'ri-facebook-fill', placeholder: 'https://facebook.com/votre-page' },
                            { key: 'instagram', label: 'Instagram', icon: 'ri-instagram-fill', placeholder: 'https://instagram.com/votre-compte' },
                            { key: 'twitter', label: 'Twitter', icon: 'ri-twitter-fill', placeholder: 'https://twitter.com/votre-compte' },
                            { key: 'linkedin', label: 'LinkedIn', icon: 'ri-linkedin-fill', placeholder: 'https://linkedin.com/company/votre-entreprise' },
                            { key: 'whatsapp', label: 'WhatsApp', icon: 'ri-whatsapp-fill', placeholder: '+234 xxx xxx xxxx' }
                          ].map((social) => (
                            <div key={social.key}>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <i className={`${social.icon} mr-2`}></i>
                                {social.label}
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  value={profileData.social_links[social.key as keyof typeof profileData.social_links]}
                                  onChange={(e) => handleSocialLinksChange(social.key, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                  placeholder={social.placeholder}
                                />
                              ) : (
                                <p className="text-gray-900">
                                  {profileData.social_links[social.key as keyof typeof profileData.social_links] || 'Non renseigné'}
                                </p>
                              )}
                              <div className="text-xs text-gray-600 mt-1">Ce lien sera visible publiquement sur votre profil fournisseur.</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <div>
                    <h3 className="text-lg font-semibold">Gestion des produits</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {planConfig.maxProducts === -1 
                        ? 'Produits illimités' 
                        : `${data?.stats.totalProducts || 0}/${planConfig.maxProducts} produits utilisés`
                      }
                    </p>
                  </div>

                  {checkFeatureAccess('products') ? (
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                      onClick={() => { setProductModalMode('add'); setProductModalData(null); setShowProductModal(true); }}
                    >
                      <i className="ri-add-line mr-2"></i>
                      Ajouter un produit
                    </button>
                  ) : (
                    <button 
                      onClick={() => showUpgradePrompt('products')}
                      className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed whitespace-nowrap"
                      disabled
                    >
                      <i className="ri-lock-line mr-2"></i>
                      Limite atteinte
                    </button>
                  )}
                </div>

                {!checkFeatureAccess('products') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <i className="ri-information-line text-yellow-600 mr-2"></i>
                      <p className="text-yellow-800">
                        Vous avez atteint la limite de {planConfig.maxProducts} produits. 
                        <button 
                          onClick={() => setActiveTab('subscription')}
                          className="ml-1 underline hover:no-underline"
                        >
                          Passez à un plan supérieur
                        </button> pour ajouter plus de produits.
                      </p>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-lg border">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b">Nom</th>
                        <th className="py-2 px-4 border-b">Prix</th>
                        <th className="py-2 px-4 border-b">Stock</th>
                        <th className="py-2 px-4 border-b">Statut</th>
                        <th className="py-2 px-4 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(products || []).map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 px-4 border-b">{p.name}</td>
                          <td className="py-2 px-4 border-b">₦{parseFloat(p.price).toLocaleString()}</td>
                          <td className="py-2 px-4 border-b">{p.stock}</td>
                          <td className="py-2 px-4 border-b">
                            <span className={`px-2 py-1 rounded-full text-xs ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.status}</span>
                          </td>
                          <td className="py-2 px-4 border-b space-x-2">
                            <button className="text-blue-600 hover:underline" onClick={() => { setProductModalMode('edit'); setProductModalData(p); setShowProductModal(true); }}>Éditer</button>
                            <button className="text-red-600 hover:underline" onClick={() => { setProductModalMode('delete'); setProductModalData(p); setShowProductDeleteModal(true); }}>Supprimer</button>
                          </td>
                        </tr>
                      ))}
                      {(!products || products.length === 0) && (
                        <tr>
                          <td className="py-6 text-center text-gray-500" colSpan={5}>Aucun produit</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Modal ajouter/éditer un produit */}
                {showProductModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 min-w-[300px] max-w-md w-full">
                      <h4 className="font-semibold text-lg mb-4">{productModalMode === 'add' ? 'Ajouter un produit' : 'Éditer le produit'}</h4>
                      <form onSubmit={(e) => { e.preventDefault(); setShowProductModal(false); }} className="space-y-4">
                        <div>
                          <label className="block text-sm mb-1">Nom</label>
                          <input type="text" defaultValue={productModalData?.name || ''} className="border rounded px-3 py-2 w-full" required />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Prix</label>
                          <input type="number" defaultValue={productModalData?.price || ''} className="border rounded px-3 py-2 w-full" required />
                          <div className="text-xs text-gray-600 mt-1">Exemple : 12000 ou 3500</div>
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Stock</label>
                          <input type="number" defaultValue={productModalData?.stock || 0} className="border rounded px-3 py-2 w-full" required />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Statut</label>
                          <select defaultValue={productModalData?.status || 'active'} className="border rounded px-3 py-2 w-full">
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                          </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">{productModalMode === 'add' ? 'Ajouter' : 'Enregistrer'}</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Modal suppression produit */}
                {showProductDeleteModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 min-w-[300px] max-w-md w-full text-center">
                      <h4 className="font-semibold text-lg mb-4">Supprimer le produit</h4>
                      <p>Voulez-vous vraiment supprimer « {productModalData?.name} » ?</p>
                      <div className="flex justify-end space-x-2 mt-6">
                        <button type="button" onClick={() => setShowProductDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                        <button type="button" onClick={() => { setShowProductDeleteModal(false); }} className="px-4 py-2 bg-red-600 text-white rounded">Supprimer</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Analytics et performances</h3>
                
                {planConfig.canAccessAnalytics ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Vues du profil</h4>
                          <i className="ri-eye-line text-blue-500 text-xl"></i>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-2">1,234</div>
                        <div className="text-sm text-green-600">+12% ce mois</div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Contacts reçus</h4>
                          <i className="ri-mail-line text-green-500 text-xl"></i>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-2">89</div>
                        <div className="text-sm text-green-600">+8% ce mois</div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Taux de conversion</h4>
                          <i className="ri-percentage-line text-purple-500 text-xl"></i>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-2">7.2%</div>
                        <div className="text-sm text-green-600">+2.1% ce mois</div>
                      </div>
                    </div>

                    {planConfig.canAccessPremiumFeatures && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Analytics avancées (Premium)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Sources de trafic</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Recherche directe</span>
                                <span className="text-sm font-medium">45%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Réseaux sociaux</span>
                                <span className="text-sm font-medium">30%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Référencement</span>
                                <span className="text-sm font-medium">25%</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Heures de pointe</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">9h - 12h</span>
                                <span className="text-sm font-medium">35%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">14h - 17h</span>
                                <span className="text-sm font-medium">40%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">19h - 21h</span>
                                <span className="text-sm font-medium">25%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Évolution des performances</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={data?.stats?.monthlyPerformance || [
                              { month: 'Jan', value: 0 },
                              { month: 'Feb', value: 0 },
                              { month: 'Mar', value: 0 },
                              { month: 'Apr', value: 0 },
                              { month: 'May', value: 0 },
                              { month: 'Jun', value: 0 },
                              { month: 'Jul', value: 0 },
                              { month: 'Aug', value: 0 },
                              { month: 'Sep', value: 0 },
                              { month: 'Oct', value: 0 },
                              { month: 'Nov', value: 0 },
                              { month: 'Dec', value: 0 },
                            ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Historique mensuel (chiffre d'affaires, commandes, avis)</h4>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyAggregates} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Chiffre d'affaires (₦)" />
                            <Line type="monotone" dataKey="orders" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} name="Nb commandes" />
                            <Line type="monotone" dataKey="reviews" stroke="#a21caf" strokeWidth={2} dot={{ r: 3 }} name="Nb avis" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-3">
                        <CSVLink 
                          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 text-sm"
                          data={monthlyAggregates}
                          filename="analytics-mensuelles.csv"
                          separator={";"}
                        >
                          Exporter CSV
                        </CSVLink>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <i className="ri-lock-line text-4xl text-gray-400 mb-4"></i>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Analytics non disponibles</h4>
                    <p className="text-gray-600 mb-6">
                      Les analytics sont disponibles à partir du plan Basic.
                    </p>
                    <button 
                      onClick={() => setActiveTab('subscription')}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      Voir les plans
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subscription' && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Gestion de l'abonnement</h3>
                <div className="mb-6">
                  <div className="mb-2 font-medium">Abonnement actuel :</div>
                  <div className="px-4 py-2 rounded bg-green-50 inline-block mb-2 font-bold">
                    {planConfig.name} ({currentPlan})
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                  {[
                    {
                      id: 'free',
                      name: 'Gratuit',
                      price: '0',
                      features: ['5 produits max', 'Support de base', 'Profil simple'],
                      current: currentPlan === 'free'
                    },
                    {
                      id: 'basic',
                      name: 'Basic',
                      price: '5,000',
                      features: ['50 produits', 'Support prioritaire', 'Analytics de base', 'Badge vérifié'],
                      current: currentPlan === 'basic'
                    },
                    {
                      id: 'premium',
                      name: 'Premium',
                      price: '15,000',
                      features: ['Produits illimités', 'Support 24/7', 'Analytics avancées', 'Promotion prioritaire'],
                      current: currentPlan === 'premium'
                    }
                  ].map((plan) => (
                    <div key={plan.id} className={`border rounded-lg p-4 sm:p-6 ${plan.current ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                      <div className="text-center">
                        <h4 className="text-lg font-semibold">{plan.name}</h4>
                        <div className="mt-2">
                          <span className="text-2xl sm:text-3xl font-bold">₦{plan.price}</span>
                          <span className="text-gray-600">/mois</span>
                        </div>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <i className="ri-check-line text-green-500 mr-2 flex-shrink-0"></i>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        className={`w-full mt-6 py-2 px-4 rounded-lg font-medium whitespace-nowrap ${plan.current ? 'bg-green-600 text-white' : 'border border-green-600 text-green-600 hover:bg-green-50'}`}
                        disabled={plan.current}
                        onClick={() => {
                          if (!plan.current) { setPaymentPlanChoice(plan.id); setShowPaymentModal(true); setPaymentSuccess(false); }
                        }}
                      >
                        {plan.current ? 'Plan actuel' : 'Choisir ce plan'}
                      </button>
                    </div>
                  ))}
                </div>
                {/* Nouvel historique paiements mock */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-8">
                  <div className="font-semibold mb-3 text-gray-900">Historique de paiement (simulation)</div>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Offre</th><th>Date</th><th>Montant</th><th>Statut</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockPayments.map((p)=>(
                        <tr key={p.id} className="border-b">
                          <td className="py-2 font-medium">{p.plan}</td>
                          <td>{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                          <td>₦{p.amount.toLocaleString()}</td>
                          <td><span className={`px-2 py-1 rounded-full text-xs ${p.status==='paid'?'bg-green-100 text-green-800':p.status==='pending'?'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-600'}`}>{p.status}</span></td>
                          <td>
                            {p.status === 'pending' && <button className="text-red-600 hover:underline mr-4" onClick={()=>setMockPayments(list=>list.filter(x=>x.id!==p.id))}>Annuler</button>}
                          </td>
                        </tr>
                      ))}
                      {mockPayments.length === 0 && <tr><td colSpan={5} className="text-center p-4 text-gray-400">Aucune transaction</td></tr>}
                    </tbody>
                  </table>
                </div>
                {/* Simuler paiement (bouton visible si pas déjà payé le plan premium)*/}
                <div className="mb-10">
                  <button className="bg-green-700 text-white px-4 py-2 rounded" onClick={()=>{setSimPayOpen(true);setSimPayStatus('idle')}}>
                    Simuler un paiement d'abonnement
                  </button>
                  {simPayOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
                        <div className="mb-3 text-lg font-semibold">Paiement d'abonnement (simulation)</div>
                        <div className="mb-3">Sélectionnez une offre :</div>
                        <select value={simChosenPlan||''} onChange={e=>setSimChosenPlan(e.target.value)} className="mb-6 border rounded px-3 py-2 w-full">
                          <option value="">---</option>
                          <option value="basic">Basic (₦5000)</option>
                          <option value="premium">Premium (₦15000)</option>
                        </select>
                        <div className="mb-4">
                        {simPayStatus === 'pending' && <div className="text-green-700"><i className="ri-loader-4-line animate-spin"></i> Paiement en cours...</div>}
                        {simPayStatus === 'success' && <div className="text-green-700">Paiement réussi, abonnement activé !</div>}
                        {simPayStatus === 'failed' && <div className="text-red-700">Paiement échoué (simulation).</div>}
                        </div>
                        <div className="flex justify-center space-x-2">
                          {simPayStatus === 'idle' && <button disabled={!simChosenPlan} className="bg-green-600 text-white px-4 py-2 rounded" onClick={()=>simChosenPlan && handleMockPay(simChosenPlan,simChosenPlan==='premium'?15000:5000)}>Payer (simulation)</button>}
                          <button className="bg-gray-500 text-white px-3 py-2 rounded" onClick={()=>setSimPayOpen(false)}>Fermer</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Comparaison des fonctionnalités */}
                <div className="mt-8 bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Comparaison des fonctionnalités</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Fonctionnalité</th>
                          <th className="text-center py-2">Gratuit</th>
                          <th className="text-center py-2">Basic</th>
                          <th className="text-center py-2">Premium</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        <tr className="border-b">
                          <td className="py-2">Nombre de produits</td>
                          <td className="text-center py-2">5</td>
                          <td className="text-center py-2">50</td>
                          <td className="text-center py-2">Illimité</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Analytics</td>
                          <td className="text-center py-2"><i className="ri-close-line text-red-500"></i></td>
                          <td className="text-center py-2"><i className="ri-check-line text-green-500"></i></td>
                          <td className="text-center py-2"><i className="ri-check-line text-green-500"></i></td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Analytics avancées</td>
                          <td className="text-center py-2"><i className="ri-close-line text-red-500"></i></td>
                          <td className="text-center py-2"><i className="ri-close-line text-red-500"></i></td>
                          <td className="text-center py-2"><i className="ri-check-line text-green-500"></i></td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">Support prioritaire</td>
                          <td className="text-center py-2"><i className="ri-close-line text-red-500"></i></td>
                          <td className="text-center py-2"><i className="ri-check-line text-green-500"></i></td>
                          <td className="text-center py-2"><i className="ri-check-line text-green-500"></i></td>
                        </tr>
                        <tr>
                          <td className="py-2">Badge vérifié</td>
                          <td className="text-center py-2"><i className="ri-close-line text-red-500"></i></td>
                          <td className="text-center py-2"><i className="ri-check-line text-green-500"></i></td>
                          <td className="text-center py-2"><i className="ri-check-line text-green-500"></i></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                {orderToast && (
                  <div className={`mb-4 p-3 rounded ${orderToast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                    {orderToast.message}
                  </div>
                )}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Gestion des commandes</h3>
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    onClick={() => {
                      setOrderModalMode('add');
                      setOrderModalData(null);
                      setShowOrderModal(true);
                    }}
                  >
                    <i className="ri-add-line mr-2" />Ajouter une commande
                  </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(1); }}
                    placeholder="#, montant..."
                    className="border rounded px-3 py-2 w-full"
                  />
                  <select
                    value={orderStatus}
                    onChange={(e) => { setOrderStatus(e.target.value as any); setOrderPage(1); }}
                    className="border rounded px-3 py-2 w-full"
                  >
                    <option value="all">Tous statuts</option>
                    <option value="pending">En attente</option>
                    <option value="completed">Complétée</option>
                  </select>
                  <div className="flex items-center text-sm text-gray-600">
                    {orderOpLoading ? <><i className="ri-loader-4-line animate-spin mr-2"></i>Traitement en cours...</> : ' '}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-lg border">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b">#</th>
                        <th className="py-2 px-4 border-b">Date</th>
                        <th className="py-2 px-4 border-b">Montant</th>
                        <th className="py-2 px-4 border-b">Statut</th>
                        <th className="py-2 px-4 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((() => {
                        const all = (data as any)?.orders || data?.recentOrders || [];
                        const filtered = all.filter((o: any) => {
                          const matchesStatus = orderStatus === 'all' ? true : o.status === orderStatus;
                          const q = orderSearch.trim().toLowerCase();
                          const matchesQuery = q === '' ? true : (
                            String(o.order_number || '').toLowerCase().includes(q) ||
                            String(o.total_amount || '').toLowerCase().includes(q)
                          );
                          return matchesStatus && matchesQuery;
                        });
                        const start = (orderPage - 1) * 10;
                        const pageItems = filtered.slice(start, start + 10);
                        return pageItems.length > 0 ? pageItems : [
                          {id: 1, order_number: '0001', created_at: Date.now(), total_amount: 15000, status: 'pending'},
                          {id: 2, order_number: '0002', created_at: Date.now(), total_amount: 32000, status: 'completed'},
                        ];
                      })()).map((order) => (
                        <tr key={order.id}>
                          <td className="py-2 px-4 border-b">{order.order_number}</td>
                          <td className="py-2 px-4 border-b">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                          <td className="py-2 px-4 border-b">₦{parseFloat(order.total_amount).toLocaleString()}</td>
                          <td className="py-2 px-4 border-b">
                            <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'completed' ? 'bg-green-100 text-green-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{order.status}</span>
                          </td>
                          <td className="py-2 px-4 border-b space-x-2">
                            <button className="text-blue-600 hover:underline" onClick={() => { setOrderModalMode('edit'); setOrderModalData(order); setShowOrderModal(true); }}>Éditer</button>
                            <button className="text-red-600 hover:underline" onClick={() => { setOrderModalMode('delete'); setOrderModalData(order); setShowOrderDeleteModal(true); }}>Supprimer</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Modal ajouter/éditer une commande */}
                {showOrderModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 min-w-[300px] max-w-md w-full">
                      <h4 className="font-semibold text-lg mb-4">{orderModalMode === 'add' ? 'Ajouter une commande' : 'Éditer la commande'}</h4>
                      <form onSubmit={async e => {
                        e.preventDefault();
                        if (orderModalMode === 'add') {
                          const res = await handleAddOrder(orderForm);
                          if (res.success) setShowOrderModal(false);
                        } else if (orderModalMode === 'edit' && orderModalData?.id) {
                          const res = await handleEditOrder({ id: orderModalData.id, ...orderForm });
                          if (res.success) setShowOrderModal(false);
                        }
                      }} className="space-y-4">
                        <div>
                          <label className="block text-sm mb-1">Numéro commande</label>
                          <input type="text" value={orderForm.order_number} onChange={(e) => setOrderForm(prev => ({ ...prev, order_number: e.target.value }))} className="border rounded px-3 py-2 w-full" required />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Montant</label>
                          <input type="number" value={String(orderForm.total_amount)} onChange={(e) => setOrderForm(prev => ({ ...prev, total_amount: e.target.value }))} className="border rounded px-3 py-2 w-full" required />
                          <div className="text-xs text-gray-600 mt-1">Exemple : 12000 ou 3500</div>
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Statut</label>
                          <select value={orderForm.status} onChange={(e) => setOrderForm(prev => ({ ...prev, status: e.target.value }))} className="border rounded px-3 py-2 w-full">
                            <option value="pending">En attente</option>
                            <option value="completed">Complétée</option>
                          </select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button type="button" onClick={() => setShowOrderModal(false)} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">{orderModalMode === 'add' ? 'Ajouter' : 'Enregistrer'}</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                {/* Modal suppression commande */}
                {showOrderDeleteModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 min-w-[300px] max-w-md w-full text-center">
                      <h4 className="font-semibold text-lg mb-4">Supprimer la commande</h4>
                      <p>Voulez-vous vraiment supprimer la commande #{orderModalData?.order_number} ?</p>
                      <div className="flex justify-end space-x-2 mt-6">
                        <button type="button" onClick={() => setShowOrderDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                        <button type="button" onClick={async () => { if (orderModalData?.id) { const res = await handleDeleteOrder(orderModalData.id); if (res.success) setShowOrderDeleteModal(false); } }} className="px-4 py-2 bg-red-600 text-white rounded">Supprimer</button>
                      </div>
                    </div>
                  </div>
                )}
                {(() => {
                  const all = (data as any)?.orders || data?.recentOrders || [];
                  const filtered = all.filter((o: any) => {
                    const matchesStatus = orderStatus === 'all' ? true : o.status === orderStatus;
                    const q = orderSearch.trim().toLowerCase();
                    const matchesQuery = q === '' ? true : (
                      String(o.order_number || '').toLowerCase().includes(q) ||
                      String(o.total_amount || '').toLowerCase().includes(q)
                    );
                    return matchesStatus && matchesQuery;
                  });
                  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
                  const page = Math.min(orderPage, totalPages);
                  if (page !== orderPage) setOrderPage(page);
                  return (
                    <div className="flex justify-between items-center mt-4 text-sm text-gray-700">
                      <div>
                        Page {page} / {totalPages} — {filtered.length} commandes
                      </div>
                      <div className="space-x-2">
                        <button disabled={page <= 1} onClick={() => setOrderPage(prev => Math.max(1, prev - 1))} className={`px-3 py-1 border rounded ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>Précédent</button>
                        <button disabled={page >= totalPages} onClick={() => setOrderPage(prev => Math.min(totalPages, prev + 1))} className={`px-3 py-1 border rounded ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}>Suivant</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {reviewToast && (
                  <div className={`mb-4 p-3 rounded ${reviewToast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                    {reviewToast.message}
                  </div>
                )}
                <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <h3 className="text-lg font-semibold">Gestion des avis clients</h3>
                  {reviewOpLoading && <div className="text-sm text-gray-600 mt-2 sm:mt-0"><i className="ri-loader-4-line animate-spin mr-2"></i>Traitement en cours...</div>}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-lg border">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b">#</th>
                        <th className="py-2 px-4 border-b">Date</th>
                        <th className="py-2 px-4 border-b">Note</th>
                        <th className="py-2 px-4 border-b">Commentaire</th>
                        <th className="py-2 px-4 border-b">Statut</th>
                        <th className="py-2 px-4 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.recentReviews || [
                        { id: 1, rating: 4, comment: 'Bon service', created_at: Date.now(), status: 'published', response: '' },
                        { id: 2, rating: 2, comment: 'Attente trop longue', created_at: Date.now(), status: 'pending', response: '' },
                      ]).map((review) => (
                        <tr key={review.id}>
                          <td className="py-2 px-4 border-b">{review.id}</td>
                          <td className="py-2 px-4 border-b">{new Date(review.created_at).toLocaleDateString('fr-FR')}</td>
                          <td className="py-2 px-4 border-b">
                            {[1,2,3,4,5].map(star => (
                              <i key={star} className={`ri-star-${star <= review.rating ? 'fill' : 'line'} text-yellow-400 text-sm`} />
                            ))}
                          </td>
                          <td className="py-2 px-4 border-b min-w-[160px]">{review.comment}</td>
                          <td className="py-2 px-4 border-b">
                            <span className={`px-2 py-1 rounded-full text-xs ${review.status === 'published' ? 'bg-green-100 text-green-800' : review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{review.status}</span>
                          </td>
                          <td className="py-2 px-4 border-b space-x-2">
                            <button
                              className="text-green-600 hover:underline"
                              onClick={async () => {
                                await handleUpdateReview({ id: review.id, status: review.status === 'published' ? 'hidden' : 'published' });
                              }}
                            >{review.status === 'published' ? 'Mettre hors ligne' : 'Valider'}</button>
                            <button className="text-blue-600 hover:underline" onClick={() => { setReviewModalMode('respond'); setReviewModalData(review); setShowReviewRespondModal(true); }}>Répondre</button>
                            <button className="text-red-600 hover:underline" onClick={() => { setReviewModalMode('delete'); setReviewModalData(review); setShowReviewDeleteModal(true); }}>Supprimer</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Modal répondre à un avis */}
                {showReviewRespondModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 min-w-[300px] max-w-md w-full">
                      <h4 className="font-semibold text-lg mb-4">Répondre à l'avis</h4>
                      <div className="bg-gray-50 p-2 mb-4 rounded">{reviewModalData?.comment}</div>
                      <form onSubmit={async e => {e.preventDefault(); if (reviewModalData?.id) { const textarea = (e.currentTarget.elements.namedItem('response') as HTMLTextAreaElement); const res = await handleUpdateReview({ id: reviewModalData.id, response: textarea.value }); if (res.success) setShowReviewRespondModal(false); }}} className="space-y-4">
                        <div>
                          <label className="block text-sm mb-1">Votre réponse</label>
                          <textarea name="response" className="border rounded px-3 py-2 w-full" defaultValue={reviewModalData?.response || ''} required />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button type="button" onClick={() => setShowReviewRespondModal(false)} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Envoyer</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                {/* Modal suppression avis */}
                {showReviewDeleteModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 min-w-[300px] max-w-md w-full text-center">
                      <h4 className="font-semibold text-lg mb-4">Supprimer l'avis</h4>
                      <p>Voulez-vous vraiment supprimer l'avis #{reviewModalData?.id} ?</p>
                      <div className="flex justify-end space-x-2 mt-6">
                        <button type="button" onClick={() => setShowReviewDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                        <button type="button" onClick={async () => { if (reviewModalData?.id) { const res = await handleDeleteReview(reviewModalData.id); if (res.success) setShowReviewDeleteModal(false); } }} className="px-4 py-2 bg-red-600 text-white rounded">Supprimer</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="">
                <h3 className="text-lg font-semibold mb-6">Gestion de l'équipe</h3>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-gray-700">Membres de l'entreprise :</span>
                  <button className="bg-green-600 text-white px-3 py-1 rounded text-sm" onClick={()=>setShowInvite(true)}><i className="ri-user-add-line mr-1"></i>Inviter un membre</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead>
                    <tbody>
                      {team.map(u=>(
                        <tr key={u.id} className="border-b">
                          <td className="py-2 font-medium">{u.name}{u.isMe && <span className="ml-1 bg-green-100 text-green-800 px-2 rounded text-xs">Vous</span>}</td>
                          <td>{u.email}</td>
                          <td>
                            <select disabled={u.isMe} value={u.role} onChange={e=>handleChangeRole(u.id,e.target.value)} className="border p-1 rounded">
                              <option value="admin">Admin</option>
                              <option value="editor">Éditeur</option>
                            </select>
                          </td>
                          <td>{u.status==='active'?<span className="text-green-600">Actif</span>:<span className="text-yellow-600">En attente</span>}{u.status==='pending' && <button className="ml-2 text-xs text-green-600 underline" onClick={()=>handleValidate(u.id)}>Valider</button>}</td>
                          <td>
                            {!u.isMe && <button className="text-xs text-red-700 px-2 py-1 rounded border border-red-100 hover:bg-red-100" onClick={()=>handleRemoveUser(u.id)}>Supprimer</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {showInvite && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="bg-white rounded p-6 shadow w-full max-w-md">
                      <div className="mb-3 text-lg font-semibold">Inviter un membre</div>
                      <input className="border px-3 py-2 w-full rounded mb-3" type="email" value={invEmail} onChange={e=>setInvEmail(e.target.value)} placeholder="Email du membre à inviter" />
                      <div className="mb-2">
                        <select className="border px-2 py-1 rounded w-full" value={invRole} onChange={e=>setInvRole(e.target.value)}>
                          <option value="editor">Éditeur</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button className="px-3 py-1 bg-gray-200 rounded" onClick={()=>setShowInvite(false)}>Annuler</button>
                        <button className="px-3 py-1 bg-green-600 text-white rounded" disabled={!invEmail.includes('@')} onClick={handleInvite}>Inviter</button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Switch utilisateur actuel (si plusieurs users actifs) */}
                {otherUsers.length>0 && (
                  <div className="mt-8 pt-6 border-t text-xs text-gray-500 flex gap-2 items-baseline">
                    Changer d'utilisateur : 
                    <select value={currentUser.id} onChange={e=>setCurrentUser(team.find(u=>u.id==e.target.value)||team[0])} className="ml-2 border border-green-200 px-2 py-1 rounded">
                      {team.filter(u=>u.status==='active').map(u=>(
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal de mise à niveau */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <i className="ri-vip-crown-line text-4xl text-yellow-500 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Fonctionnalité Premium
              </h3>
              <p className="text-gray-600 mb-6">
                Cette fonctionnalité nécessite un plan Basic ou Premium pour être accessible.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setActiveTab('subscription');
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  Voir les plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal paiement Stripe mock */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 min-w-[300px] max-w-md w-full text-center">
            {!paymentSuccess ? (
              <>
                <h4 className="font-semibold text-lg mb-4">Confirmer le paiement</h4>
                <p>Vous allez être redirigé vers Stripe pour payer le nouveau plan <b>{paymentPlanChoice}</b>.</p>
                <div className="flex justify-end space-x-2 mt-6">
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
                  <button type="button" onClick={() => setPaymentSuccess(true)} className="px-4 py-2 bg-green-600 text-white rounded">Payer maintenant (Stripe)</button>
                </div>
              </>
            ) : (
              <>
                <h4 className="font-semibold text-lg mb-4">Paiement effectué</h4>
                <p>La transaction serait réalisée ici via Stripe.<br/>Le plan sera activé automatiquement après paiement effectif.</p>
                <div className="flex justify-end mt-6">
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 bg-green-600 text-white rounded">Fermer</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
