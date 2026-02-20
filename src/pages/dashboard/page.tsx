import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type FormEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { useConvexAuth, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from 'react-i18next';
import type { Id } from '../../../convex/_generated/dataModel';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import ComingSoon from '../../components/base/ComingSoon';
import DashboardTour from '../../components/base/DashboardTour';
import useCurrency from '../../hooks/useCurrency';
import VerificationStatus from '../../components/base/VerificationStatus';

type DashboardTab =
  | 'overview'
  | 'profile'
  | 'products'
  | 'orders'
  | 'reviews'
  | 'analytics'
  | 'subscription'
  | 'verification'
  | 'settings'
  | 'team'
  | 'galerie';

type Toast = { type: 'success' | 'error'; message: string } | null;

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
  products?: any[];
  orders?: any[];
  reviews?: any[];
}

function getSidebarTabs(category: string | undefined): Array<{ id: DashboardTab; label: string; icon: string }> {
  // À adapter selon les vraies catégories "vendeur de produits" vs "prestataire de services"
  const isProductVendor = category === 'Vente de produits';
  const isServiceProvider = category === 'Services';

  const baseTabs: Array<{ id: DashboardTab; label: string; icon: string }> = [
    { id: 'overview', label: 'Aperçu', icon: 'ri-dashboard-line' },
    { id: 'profile', label: 'Profil', icon: 'ri-building-line' },
    { id: 'orders', label: 'Commandes', icon: 'ri-shopping-cart-line' },
    { id: 'reviews', label: 'Avis', icon: 'ri-star-line' },
    { id: 'verification', label: 'Vérification', icon: 'ri-shield-check-line' },
    { id: 'analytics', label: 'Analytics', icon: 'ri-bar-chart-line' },
    { id: 'subscription', label: 'Abonnement', icon: 'ri-vip-crown-line' },
    { id: 'settings', label: 'Paramètres', icon: 'ri-settings-line' },
    { id: 'team', label: 'Équipe', icon: 'ri-team-line' },
  ];
  const tabs: Array<{ id: DashboardTab; label: string; icon: string }> = [...baseTabs];
  if (isProductVendor) {
    tabs.splice(2, 0, { id: 'products' as const, label: 'Produits', icon: 'ri-product-hunt-line' });
  }
  if (isServiceProvider) {
    tabs.splice(2, 0, { id: 'galerie' as const, label: 'Galerie', icon: 'ri-image-line' });
  }
  return tabs;
}


const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Gratuit',
    maxProducts: 5,
    features: ['5 produits max', 'Support de base', 'Profil simple'],
    canAccessAnalytics: false,
    canAccessPremiumFeatures: false,
    canCustomizeProfile: true,
    maxPhotos: 3,
  },
  basic: {
    name: 'Basic',
    maxProducts: 50,
    features: [
      '50 produits',
      'Support prioritaire',
      'Analytics de base',
      'Badge vérifié',
    ],
    canAccessAnalytics: true,
    canAccessPremiumFeatures: false,
    canCustomizeProfile: true,
    maxPhotos: 10,
  },
  premium: {
    name: 'Premium',
    maxProducts: -1,
    features: [
      'Produits illimités',
      'Support 24/7',
      'Analytics avancées',
      'Promotion prioritaire',
    ],
    canAccessAnalytics: true,
    canAccessPremiumFeatures: true,
    canCustomizeProfile: true,
    maxPhotos: -1,
  },
};


interface BusinessHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

interface ProfileData {
  business_name: string;
  description: string;
  category: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  image?: string;
  imageGallery?: string[];
  business_hours: BusinessHours;
  social_links: Record<string, string>;
}

const DEFAULT_PROFILE: ProfileData = {
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
    sunday: { open: '10:00', close: '16:00', closed: true },
  },
  social_links: {
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    whatsapp: '',
  },
};

const BUSINESS_CATEGORIES = [
  'Agriculture',
  'Textile',
  'Électronique',
  'Alimentation',
  'Construction',
  'Automobile',
  'Santé & Beauté',
  'Éducation',
  'Services',
];

const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

const DAY_NAMES: Record<
  keyof typeof DEFAULT_PROFILE.business_hours,
  string
> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

// Interactive dashboard tour implementation with fixed prop handling
export default function Dashboard() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { data: meData } = useConvexQuery(
    api.users.me,
    {},
    { staleTime: 2 * 60 * 1000 } // Cache user data for 2 minutes
  );
  const navigate = useNavigate();
  const [approvalChecked, setApprovalChecked] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    
    if (!isLoading && meData?.user?.user_type !== 'supplier') {
      navigate('/auth/login');
      return;
    }
    
    // Check if supplier is approved
    if (meData?.supplier && meData.supplier.approved === false && !approvalChecked) {
      setApprovalChecked(true); // Prevent repeated redirects
      navigate('/', { state: { message: 'Votre profil est en attente d\'approbation par l\'administrateur.' } });
      return;
    }
  }, [isAuthenticated, isLoading, meData, navigate, approvalChecked]);

  // Show tour on first visit
  useEffect(() => {
    if (!localStorage.getItem('dashboardTourCompleted')) {
      setShowTour(true);
    }
  }, []);



  // Convex queries with caching strategy
  const { data: dashboardData } = useConvexQuery(
    api.dashboard.supplierDashboard,
    {},
    { staleTime: 2 * 60 * 1000 } // Cache dashboard data for 2 minutes
  );
  const { data: productsData } = useConvexQuery(
    api.products.listProducts,
    {},
    { staleTime: 3 * 60 * 1000 } // Cache products for 3 minutes
  );
  const { data: ordersData } = useConvexQuery(
    api.orders.getSupplierOrders,
    {},
    { staleTime: 1 * 60 * 1000 } // Cache orders for 1 minute (more dynamic data)
  );
  const { data: reviewsData } = useConvexQuery(
    api.reviews.listReviews,
    {},
    { staleTime: 3 * 60 * 1000 } // Cache reviews for 3 minutes
  );

  // Convex mutations
  const createProductMutation = useMutation(api.products.createProduct);
  const updateProductMutation = useMutation(api.products.updateProduct);
  const deleteProductMutation = useMutation(api.products.deleteProduct);
  const updateOrderStatusMutation = useMutation(api.orders.updateOrderStatus);
  const deleteOrderMutation = useMutation(api.orders.deleteOrder);
  const updateReviewMutation = useMutation(api.reviews.updateReview);
  const deleteReviewMutation = useMutation(api.reviews.deleteReview);
  const updateSupplierProfileMutation = useMutation(api.suppliers.updateSupplierProfile);

  const loading = dashboardData === undefined;
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profileData, setProfileData] = useState(DEFAULT_PROFILE);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] =
    useState<'idle' | 'success' | 'error'>('idle');

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingUpgradeFeature, setPendingUpgradeFeature] = useState<
    string | null
  >(null);

  const [products, setProducts] = useState<any[]>([]);
  const [productModalMode, setProductModalMode] =
    useState<'add' | 'edit' | 'delete'>('add');
  const [productModalData, setProductModalData] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showProductDeleteModal, setShowProductDeleteModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    stock: '',
    status: 'active' as 'active' | 'inactive',
    category: '',
    description: '',
    images: [] as string[],
  });
  const [productOpLoading, setProductOpLoading] = useState(false);
  const [productToast, setProductToast] = useState<Toast>(null);

  const [showOrderViewModal, setShowOrderViewModal] = useState(false);
  const [showOrderDeleteModal, setShowOrderDeleteModal] = useState(false);
  const [orderModalData, setOrderModalData] = useState<any>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] =
    useState<'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [orderOpLoading, setOrderOpLoading] = useState(false);
  const [orderToast, setOrderToast] = useState<Toast>(null);

  const [showReviewRespondModal, setShowReviewRespondModal] = useState(false);
  const [showReviewDeleteModal, setShowReviewDeleteModal] = useState(false);
  const [_reviewModalMode, setReviewModalMode] =
    useState<'respond' | 'delete'>('respond');
  const [reviewModalData, setReviewModalData] = useState<any>(null);
  const [reviewOpLoading, setReviewOpLoading] = useState(false);
  const [reviewToast, setReviewToast] = useState<Toast>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentPlanChoice, setPaymentPlanChoice] = useState('basic');

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'order',
      message: 'Nouvelle commande reçue #0001',
      read: false,
      created_at: Date.now(),
    },
    {
      id: 2,
      type: 'review',
      message: 'Nouvel avis client ajouté',
      read: false,
      created_at: Date.now() - 1_000_000,
    },
    {
      id: 3,
      type: 'info',
      message: 'Votre profil a été validé.',
      read: true,
      created_at: Date.now() - 86_400_000,
    },
  ]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLButtonElement>(null);

  // Team management state (not fully implemented)
  const [team, setTeam] = useState([
    {
      id: 1,
      name: 'Alice N.',
      email: 'alice@olufinja.com',
      role: 'admin',
      status: 'active',
      isMe: true,
    },
    {
      id: 2,
      name: 'Sam O.',
      email: 'sam@society.com',
      role: 'editor',
      status: 'active',
    },
    {
      id: 3,
      name: 'Jean L.',
      email: 'jean@olufinja.com',
      role: 'editor',
      status: 'pending',
    },
  ]);
  // const [currentUser, setCurrentUser] = useState(team[0]);
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState('editor');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentPlan = (dashboardData?.profile as any)?.subscription_plan || 'free';
  const planConfig =
    SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS];
  const totalProducts = dashboardData?.stats?.totalProducts ?? 0;

  // Remove old getAccessToken - no longer needed

  const monthlyAggregates = useMemo(() => {
    const orders = ordersData || [];
    const reviews = reviewsData || [];
    const agg: Record<
      string,
      { month: string; revenue: number; orders: number; reviews: number }
    > = {};

    orders.forEach((order: any) => {
      const date = order.created_at ? new Date(order.created_at) : new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0'
      )}`;
      if (!agg[key]) agg[key] = { month: key, revenue: 0, orders: 0, reviews: 0 };
      agg[key].revenue += Number(order.total_amount || 0);
      agg[key].orders += 1;
    });

    reviews.forEach((review: any) => {
      const date = review.created_at ? new Date(review.created_at) : new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0'
      )}`;
      if (!agg[key]) agg[key] = { month: key, revenue: 0, orders: 0, reviews: 0 };
      agg[key].reviews += 1;
    });

    return Object.values(agg).sort((a, b) => a.month.localeCompare(b.month));
  }, [ordersData, reviewsData]);

  const upgradeCopy = useMemo(() => {
    switch (pendingUpgradeFeature) {
      case 'analytics':
        return t('dashboard.upgrade.analytics');
      case 'products':
        return t('dashboard.upgrade.products');
      case 'premium':
        return t('dashboard.upgrade.premium');
      default:
        return t('dashboard.upgrade.default');
    }
  }, [pendingUpgradeFeature, t]);

  const handleMarkRead = (id: number) =>
    setNotifications((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const handleDeleteNotif = (id: number) =>
    setNotifications((list) => list.filter((n) => n.id !== id));

  useEffect(() => {
    if (!showProductModal) return;
    if (productModalMode === 'edit' && productModalData) {
      setProductForm({
        name: productModalData.name ?? '',
        price: String(productModalData.price ?? ''),
        stock: String(productModalData.stock ?? ''),
        status:
          (productModalData.status as 'active' | 'inactive') ?? 'active',
        category: productModalData.category ?? '',
        description: productModalData.description ?? '',
        images: productModalData.images ?? [],
      });
    } else if (productModalMode === 'add') {
      setProductForm({ name: '', price: '', stock: '', status: 'active', category: '', description: '', images: [] });
    }
  }, [productModalMode, productModalData, showProductModal]);

    // Sync profile data from dashboardData
  useEffect(() => {
    if (dashboardData?.profile) {
      // Transform business_hours from Convex format to frontend format
      const transformedBusinessHours: BusinessHours = {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '17:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: true },
      };
      const businessHoursData = (dashboardData.profile as any).business_hours || {};
      
      (Object.entries(DEFAULT_PROFILE.business_hours) as [keyof BusinessHours, BusinessHours[keyof BusinessHours]][]).forEach(([day, defaultHours]) => {
        const hoursData = businessHoursData[day];
        
        if (typeof hoursData === 'string') {
          if (hoursData === 'closed') {
            transformedBusinessHours[day] = { ...defaultHours, closed: true } as BusinessHours[typeof day];
          } else if (hoursData.includes('-')) {
            const [open, close] = hoursData.split('-');
            transformedBusinessHours[day] = { open, close, closed: false } as BusinessHours[typeof day];
          } else {
            // Fallback to default if format is unexpected
            transformedBusinessHours[day] = defaultHours;
          }
        } else {
          // If it's already in the correct format or undefined, use default
          transformedBusinessHours[day] = defaultHours;
        }
      });

      setProfileData({
        business_name: dashboardData.profile.business_name || '',
        description: dashboardData.profile.description || '',
        category: dashboardData.profile.category || '',
        address: dashboardData.profile.address || '',
        city: dashboardData.profile.city || '',
        state: dashboardData.profile.state || '',
        phone: dashboardData.profile.phone || '',
        email: dashboardData.profile.email || '',
        website: dashboardData.profile.website || '',
        image: dashboardData.profile.image || '',
        imageGallery: dashboardData.profile.imageGallery || [],
        business_hours: transformedBusinessHours,
        social_links: (dashboardData.profile as any).social_links || DEFAULT_PROFILE.social_links,
      });
    }
  }, [dashboardData]);

  // Sync profile data from dashboardData
  useEffect(() => {
    if (dashboardData?.profile) {
      setProfileData({
        business_name: dashboardData.profile.business_name || '',
        description: dashboardData.profile.description || '',
        category: dashboardData.profile.category || '',
        address: dashboardData.profile.address || '',
        city: dashboardData.profile.city || '',
        state: dashboardData.profile.state || '',
        phone: dashboardData.profile.phone || '',
        email: dashboardData.profile.email || '',
        website: dashboardData.profile.website || '',
        business_hours: (dashboardData.profile as any).business_hours || DEFAULT_PROFILE.business_hours,
        social_links: (dashboardData.profile as any).social_links || DEFAULT_PROFILE.social_links,
      });
    }
  }, [dashboardData]);

  // Sync products from productsData
  useEffect(() => {
    if (productsData && Array.isArray(productsData)) {
      setProducts(productsData);
    }
  }, [productsData]);

  const handleSaveProfile = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      await updateSupplierProfileMutation({
        business_name: profileData.business_name,
        email: profileData.email,
        phone: profileData.phone,
        description: profileData.description,
        category: profileData.category,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        website: profileData.website,
        business_hours: profileData.business_hours as any,
        social_links: profileData.social_links as any,
      });
      setSaveStatus('success');
      setEditMode(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [updateSupplierProfileMutation, profileData]);

  const handleLogout = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleInputChange = (field: string, value: unknown) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBusinessHoursChange = (
    day: keyof typeof DEFAULT_PROFILE.business_hours,
    field: 'open' | 'close' | 'closed',
    value: string | boolean
  ) => {
    setProfileData((prev) => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleSocialLinksChange = (platform: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value,
      },
    }));
  };

  const checkFeatureAccess = useCallback(
    (feature: 'analytics' | 'premium' | 'products') => {
      if (feature === 'analytics') return planConfig.canAccessAnalytics;
      if (feature === 'premium') return planConfig.canAccessPremiumFeatures;
      if (feature === 'products')
        return (
          planConfig.maxProducts === -1 || totalProducts < planConfig.maxProducts
        );
      return true;
    },
    [
      planConfig.canAccessAnalytics,
      planConfig.canAccessPremiumFeatures,
      planConfig.maxProducts,
      totalProducts,
    ]
  );

  const showUpgradePrompt = (feature: string) => {
    setPendingUpgradeFeature(feature);
    setShowUpgradeModal(true);
  };

  const handleAddProduct = async (payload: {
    name: string;
    price: number;
    stock: number;
    status: 'active' | 'inactive';
    category?: string;
    description?: string;
    images?: string[];
  }) => {
    try {
      await createProductMutation({
        name: payload.name,
        price: payload.price,
        stock: BigInt(payload.stock),
        status: payload.status,
        category: payload.category,
        description: payload.description,
        images: payload.images,
      });
      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('dashboard.errors.add_product', 'Error adding product');
      return { success: false, error: message };
    }
  };

  const handleEditProduct = async (payload: {
    id: string | number;
    name: string;
    price: number;
    stock: number;
    status: 'active' | 'inactive';
    category?: string;
    description?: string;
    images?: string[];
  }) => {
    try {
      await updateProductMutation({
        id: payload.id as Id<"products">,
        name: payload.name,
        price: payload.price,
        stock: BigInt(payload.stock),
        status: payload.status,
        category: payload.category,
        description: payload.description,
        images: payload.images,
      });
      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('dashboard.errors.update_product', 'Error updating product');
      return { success: false, error: message };
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    try {
      await deleteProductMutation({ id: id as Id<"products"> });
      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('dashboard.errors.delete_product', 'Error deleting product');
      return { success: false, error: message };
    }
  };

  const submitProductForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProductOpLoading(true);
    setProductToast(null);

    const payload = {
      name: productForm.name.trim(),
      price: Number(productForm.price) || 0,
      stock: Number(productForm.stock) || 0,
      status: productForm.status,
      category: productForm.category.trim() || undefined,
      description: productForm.description.trim() || undefined,
      images: productForm.images.length > 0 ? productForm.images : undefined,
    };

    let result;
    if (productModalMode === 'edit' && productModalData) {
      result = await handleEditProduct({ id: productModalData.id, ...payload });
    } else {
      result = await handleAddProduct(payload);
    }

    if (result.success) {
      setProductToast({
        type: 'success',
        message:
          productModalMode === 'add'
            ? 'Produit ajouté avec succès'
            : 'Produit mis à jour',
      });
      setShowProductModal(false);
      setProductModalData(null);
    } else {
      setProductToast({
        type: 'error',
        message: result.error || "Erreur lors de l'opération",
      });
    }

    setProductOpLoading(false);
  };

  const confirmDeleteProduct = async () => {
    if (!productModalData?.id) return;
    setProductOpLoading(true);
    const result = await handleDeleteProduct(productModalData.id);
    if (result.success) {
      setProductToast({ type: 'success', message: 'Produit supprimé' });
      setShowProductDeleteModal(false);
      setProductModalData(null);
    } else {
      setProductToast({
        type: 'error',
        message: result.error || 'Erreur lors de la suppression',
      });
    }
    setProductOpLoading(false);
  };

  const handleUpdateOrderStatus = async (payload: {
    id: string | number;
    status: string;
    payment_status?: string;
  }) => {
    try {
      setOrderOpLoading(true);
      await updateOrderStatusMutation({
        id: payload.id as Id<"orders">,
        status: payload.status,
        payment_status: payload.payment_status,
      });
      setOrderToast({ type: 'success', message: t('dashboard.success.order_updated', 'Statut de commande mis à jour') });
      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('dashboard.errors.update_order');
      setOrderToast({ type: 'error', message });
      return { success: false, error: message };
    } finally {
      setOrderOpLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string | number) => {
    try {
      setOrderOpLoading(true);
      await deleteOrderMutation({ id: orderId as Id<"orders"> });
      setOrderToast({ type: 'success', message: t('dashboard.success.order_deleted', 'Commande supprimée') });
      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('dashboard.errors.delete_order');
      setOrderToast({ type: 'error', message });
      return { success: false, error: message };
    } finally {
      setOrderOpLoading(false);
    }
  };

  const handleUpdateReview = async (payload: {
    id: string | number;
    status?: string;
    response?: string;
  }) => {
    try {
      setReviewOpLoading(true);
      await updateReviewMutation({
        id: payload.id as Id<"reviews">,
        status: payload.status,
        response: payload.response,
      });
      setReviewToast({ type: 'success', message: t('dashboard.success.review_updated', 'Avis mis à jour') });
      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('dashboard.errors.update_review');
      setReviewToast({ type: 'error', message });
      return { success: false, error: message };
    } finally {
      setReviewOpLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string | number) => {
    try {
      setReviewOpLoading(true);
      await deleteReviewMutation({ id: reviewId as Id<"reviews"> });
      setReviewToast({ type: 'success', message: t('dashboard.success.review_deleted', 'Avis supprimé') });
      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('dashboard.errors.delete_review');
      setReviewToast({ type: 'error', message });
      return { success: false, error: message };
    } finally {
      setReviewOpLoading(false);
    }
  };

  const handleExportMonthlyCSV = useCallback(() => {
    if (!monthlyAggregates.length) return;
    const headers = ['month', 'revenue', 'orders', 'reviews'];
    const rows = monthlyAggregates.map((entry) =>
      [entry.month, entry.revenue, entry.orders, entry.reviews].join(';')
    );
    const content = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'analytics-mensuelles.csv');
    link.click();
    URL.revokeObjectURL(url);
  }, [monthlyAggregates]);

  const otherUsers = team.filter((member) => !member.isMe && member.status === 'active');

  const handleInvite = () => {
    // For now, just close the modal as team management is not fully implemented
    setShowInviteModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="dashboard-overview">
            <OverviewSection
              data={dashboardData as any}
              planConfig={planConfig}
              totalProducts={totalProducts}
            />
          </div>
        );
      case 'profile':
        return (
          <ProfileSection
            profileData={profileData}
            editMode={editMode}
            setEditMode={setEditMode}
            onChangeField={handleInputChange}
            onSave={handleSaveProfile}
            saving={saving}
            saveStatus={saveStatus}
            categories={BUSINESS_CATEGORIES}
            states={NIGERIAN_STATES}
            onBusinessHoursChange={handleBusinessHoursChange}
            onSocialChange={handleSocialLinksChange}
          />
        );
      case 'products':
        return (
          <ProductsSection
            products={products}
            planConfig={planConfig}
            totalProducts={totalProducts}
            productToast={productToast}
            onAdd={() => {
              setProductModalMode('add');
              setProductModalData(null);
              setShowProductModal(true);
            }}
            onEdit={(product) => {
              setProductModalMode('edit');
              setProductModalData(product);
              setShowProductModal(true);
            }}
            onDelete={(product) => {
              setProductModalMode('delete');
              setProductModalData(product);
              setShowProductDeleteModal(true);
            }}
            canManage={checkFeatureAccess('products')}
            onUpgrade={() => showUpgradePrompt('products')}
            setActiveTab={setActiveTab}
          />
        );
      case 'orders':
        return (
          <OrdersSection
            orders={ordersData || []}
            orderStatus={orderStatus}
            setOrderStatus={setOrderStatus}
            orderSearch={orderSearch}
            setOrderSearch={setOrderSearch}
            onView={(order) => {
              setOrderModalData(order);
              setShowOrderViewModal(true);
            }}
            onUpdateStatus={async (orderId, status) => {
              await handleUpdateOrderStatus({ id: orderId, status });
            }}
            onDelete={(order) => {
              setOrderModalData(order);
              setShowOrderDeleteModal(true);
            }}
            orderToast={orderToast}
          />
        );
      case 'reviews':
        return (
          <ReviewsSection
            data={dashboardData as any}
            onRespond={(review) => {
              setReviewModalMode('respond');
              setReviewModalData(review);
              setShowReviewRespondModal(true);
            }}
            onDelete={(review) => {
              setReviewModalMode('delete');
              setReviewModalData(review);
              setShowReviewDeleteModal(true);
            }}
            reviewToast={reviewToast}
          />
        );
      case 'verification':
        return (
          <div className="dashboard-verification">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Vérification du Profil</h2>
            {dashboardData?.profile && (
              <VerificationStatus supplierId={dashboardData.profile._id as Id<'suppliers'>} />
            )}
          </div>
        );
      case 'analytics':
        return (
          <AnalyticsSection
            monthlyAggregates={monthlyAggregates}
            planConfig={planConfig}
            handleExportCSV={handleExportMonthlyCSV}
            onRequestUpgrade={() => showUpgradePrompt('analytics')}
          />
        );
      case 'subscription':
        return <SubscriptionSection />;
      case 'settings':
        return <ComingSoon feature="settings" />;
      case 'team':
        return <TeamSection />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar
        businessName={dashboardData?.profile?.business_name || 'Mon entreprise'}
        planName={planConfig.name}
        tabs={getSidebarTabs(dashboardData?.profile?.category).map((tab) => ({
          ...tab,
          premium:
            tab.id === 'analytics' ? !planConfig.canAccessAnalytics : false,
        }))}
        activeTab={activeTab}
        onChange={(tabId, requiresUpgrade) => {
          if (requiresUpgrade) {
            showUpgradePrompt(tabId);
            return;
          }
          setActiveTab(tabId);
          setSidebarOpen(false);
        }}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-h-screen lg:pl-64">
        <DashboardHeader
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen((open) => !open)}
          currentPlan={currentPlan}
          planLabel={planConfig.name}
          businessName={dashboardData?.profile?.business_name || 'Utilisateur'}
          notifications={notifications}
          unreadCount={unreadCount}
          notifOpen={notifOpen}
          notifRef={notifRef as any}
          onToggleNotifications={() => setNotifOpen((open) => !open)}
          onMarkRead={handleMarkRead}
          onDelete={handleDeleteNotif}
          onLogout={handleLogout}
          onStartTour={() => setShowTour(true)}
        />

        <main className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{renderContent()}</div>
        </main>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        description={upgradeCopy}
        onClose={() => {
          setShowUpgradeModal(false);
          setPendingUpgradeFeature(null);
        }}
        onSeePlans={() => {
          setShowUpgradeModal(false);
          setPendingUpgradeFeature(null);
          setActiveTab('subscription');
        }}
      />

      <ProductModal
        open={showProductModal}
        mode={productModalMode}
        form={productForm}
        loading={productOpLoading}
        onClose={() => setShowProductModal(false)}
        onSubmit={submitProductForm}
        onChange={setProductForm}
      />

      <ConfirmModal
        open={showProductDeleteModal}
        title="Supprimer le produit"
        message={
          productModalData
            ? `Voulez-vous vraiment supprimer « ${productModalData.name} » ?`
            : ''
        }
        loading={productOpLoading}
        confirmLabel="Supprimer"
        confirmType="danger"
        onCancel={() => setShowProductDeleteModal(false)}
        onConfirm={confirmDeleteProduct}
      />

      <OrderViewModal
        open={showOrderViewModal}
        order={orderModalData}
        onClose={() => setShowOrderViewModal(false)}
      />

      <ConfirmModal
        open={showOrderDeleteModal}
        title="Supprimer la commande"
        message={
          orderModalData
            ? `Voulez-vous supprimer la commande #${orderModalData.order_number} ?`
            : ''
        }
        loading={orderOpLoading}
        confirmLabel="Supprimer"
        confirmType="danger"
        onCancel={() => setShowOrderDeleteModal(false)}
        onConfirm={async () => {
          if (!orderModalData) return;
          await handleDeleteOrder(orderModalData._id);
          setShowOrderDeleteModal(false);
        }}
      />

      <ReviewRespondModal
        open={showReviewRespondModal}
        loading={reviewOpLoading}
        review={reviewModalData}
        onClose={() => setShowReviewRespondModal(false)}
        onSubmit={async (response) => {
          if (!reviewModalData) return;
          await handleUpdateReview({
            id: reviewModalData.id,
            response,
          });
          setShowReviewRespondModal(false);
        }}
      />

      <ConfirmModal
        open={showReviewDeleteModal}
        title="Supprimer l'avis"
        message={
          reviewModalData
            ? `Supprimer l'avis de ${reviewModalData.customer_name || 'client'} ?`
            : ''
        }
        loading={reviewOpLoading}
        confirmLabel="Supprimer"
        confirmType="danger"
        onCancel={() => setShowReviewDeleteModal(false)}
        onConfirm={async () => {
          if (!reviewModalData) return;
          await handleDeleteReview(reviewModalData.id);
          setShowReviewDeleteModal(false);
        }}
      />

      <PaymentModal
        open={showPaymentModal}
        loading={paymentSuccess}
        planId={paymentPlanChoice}
        onClose={() => {
          setPaymentSuccess(false);
          setShowPaymentModal(false);
        }}
        onConfirm={() => {
          setPaymentSuccess(true);
          setTimeout(() => {
            setPaymentSuccess(false);
            setShowPaymentModal(false);
          }, 1200);
        }}
      />

      <InviteModal
        open={showInviteModal}
        email={invEmail}
        role={invRole}
        onClose={() => setShowInviteModal(false)}
        onChangeEmail={setInvEmail}
        onChangeRole={setInvRole}
        onSubmit={handleInvite}
      />

      {productToast && (
        <ToastInline
          toast={productToast}
          onDismiss={() => setProductToast(null)}
        />
      )}

      {orderToast && (
        <ToastInline toast={orderToast} onDismiss={() => setOrderToast(null)} />
      )}

      {reviewToast && (
        <ToastInline
          toast={reviewToast}
          onDismiss={() => setReviewToast(null)}
        />
      )}
      
      <DashboardTour 
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={() => localStorage.setItem('dashboardTourCompleted', 'true')}
      />
    </div>
  );
}

function DashboardSidebar({
  businessName,
  planName,
  tabs,
  activeTab,
  onChange,
  sidebarOpen,
  setSidebarOpen,
}: {
  businessName: string;
  planName: string;
  tabs: Array<{ id: DashboardTab; label: string; icon: string; premium?: boolean }>;
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab, requiresUpgrade: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 border-r border-green-100 bg-gradient-to-b from-green-50 to-white transition-transform duration-300 lg:translate-x-0 dashboard-sidebar ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-green-100 p-6">
            <Link to="/" className="flex items-center space-x-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white">
                <i className="ri-store-line text-xl" />
              </span>
              <span
                className="text-xl font-bold text-green-600"
                style={{ fontFamily: 'Pacifico, serif' }}
              >
                Olufinja
              </span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onChange(tab.id, Boolean(tab.premium))}
                  className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-600 text-white shadow'
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                  } ${tab.premium ? 'opacity-60' : ''}`}
                  data-tour={`${tab.id}-tab`}
                >
                  <i className={`${tab.icon} text-lg`} />
                  <span className="font-medium">{tab.label}</span>
                  {tab.premium && (
                    <i className="ri-lock-line ml-auto text-sm text-current" />
                  )}
                </button>
              ))}
            </div>
          </nav>

          <div className="border-t border-green-100 p-4">
            <div className="flex items-center space-x-3 rounded-lg px-2 py-2 hover:bg-green-50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                <i className="ri-user-line" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {businessName}
                </p>
                <p className="truncate text-xs text-gray-500">{planName}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setSidebarOpen(false)}
      />
    </>
  );
}

function DashboardHeader({
  activeTab,
  sidebarOpen,
  toggleSidebar,
  currentPlan,
  planLabel,
  businessName,
  notifications,
  unreadCount,
  notifOpen,
  notifRef,
  onToggleNotifications,
  onMarkRead,
  onDelete,
  onLogout,
  onStartTour,
}: {
  activeTab: DashboardTab;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  currentPlan: string;
  planLabel: string;
  businessName: string;
  notifications: Array<{
    id: number;
    type: string;
    message: string;
    read: boolean;
    created_at: number;
  }>;
  unreadCount: number;
  notifOpen: boolean;
  notifRef: React.RefObject<HTMLButtonElement>;
  onToggleNotifications: () => void;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  onLogout: () => void;
  onStartTour: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <i className="ri-menu-line text-xl" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {activeTab === 'overview' && 'Aperçu'}
            {activeTab === 'profile' && 'Profil entreprise'}
            {activeTab === 'products' && 'Produits'}
            {activeTab === 'orders' && 'Commandes'}
            {activeTab === 'reviews' && 'Avis'}
            {activeTab === 'verification' && 'Vérification'}
            {activeTab === 'analytics' && 'Analytics'}
            {activeTab === 'subscription' && 'Abonnement'}
            {activeTab === 'team' && 'Équipe'}
          </h1>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-6">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              currentPlan === 'premium'
                ? 'bg-purple-100 text-purple-800'
                : currentPlan === 'basic'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {planLabel}
          </span>

          <button
            onClick={onStartTour}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Start tour"
            title="Start tour"
          >
            <i className="ri-information-line text-xl" />
          </button>

          <div className="relative">
            <button
              ref={notifRef}
              onClick={onToggleNotifications}
              className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 notification-button"
              aria-label="Notifications"
            >
              <i className="ri-notification-line text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-xs overflow-hidden rounded-lg border bg-white shadow-lg">
                <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                  <span>Notifications</span>
                  <button
                    className="text-gray-400 hover:text-gray-700"
                    onClick={onToggleNotifications}
                  >
                    <i className="ri-close-line text-lg" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">
                      Aucune notification
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start justify-between space-x-3 border-b px-4 py-3 text-sm last:border-0 ${
                          notification.read ? 'bg-white' : 'bg-yellow-50'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(notification.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex flex-col space-y-2 text-xs">
                          {!notification.read && (
                            <button
                              className="text-green-600 hover:text-green-700"
                              onClick={() => onMarkRead(notification.id)}
                            >
                              Marquer lu
                            </button>
                          )}
                          <button
                            className="text-red-500 hover:text-red-700"
                            onClick={() => onDelete(notification.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden items-center space-x-2 rounded-lg px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">
              <i className="ri-user-line text-sm" />
            </div>
            <span className="truncate max-w-[120px]">{businessName}</span>
          </div>

          <button
            onClick={onLogout}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Déconnexion"
          >
            <i className="ri-logout-box-line text-xl" />
          </button>
        </div>
      </div>
    </header>
  );
}

function OverviewSection({
  data,
  planConfig,
  totalProducts,
}: {
  data: DashboardData | null;
  planConfig: (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];
  totalProducts: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Bienvenue, {data?.profile?.business_name || 'Mon entreprise'}
          </h2>
          <p className="mt-1 text-gray-600">
            Gérez votre entreprise et suivez vos performances en temps réel.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Commandes"
          value={data?.stats?.totalOrders?.toLocaleString('fr-FR') || '0'}
          icon="ri-shopping-cart-line"
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          label="Produits"
          value={
            planConfig.maxProducts === -1
              ? `${totalProducts.toLocaleString('fr-FR')} / Illimité`
              : `${totalProducts.toLocaleString('fr-FR')} / ${
                  planConfig.maxProducts
                }`
          }
          icon="ri-product-hunt-line"
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          label="Avis"
          value={data?.stats?.totalReviews?.toLocaleString('fr-FR') || '0'}
          icon="ri-star-line"
          iconColor="text-yellow-600"
          iconBg="bg-yellow-100"
        />
        <StatCard
          label="Revenus mensuels"
          value={`₦${(data?.stats?.monthlyRevenue || 0).toLocaleString('fr-FR')}`}
          icon="ri-money-dollar-circle-line"
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentOrdersCard orders={data?.recentOrders || []} />
        <RecentReviewsCard reviews={data?.recentReviews || []} />
      </div>
    </div>
  );
}

function ProfileSection({
  profileData,
  editMode,
  setEditMode,
  onChangeField,
  onSave,
  saving,
  saveStatus,
  categories,
  states,
  onBusinessHoursChange,
  onSocialChange,
}: {
  profileData: typeof DEFAULT_PROFILE;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  onChangeField: (field: string, value: unknown) => void;
  onSave: () => void;
  saving: boolean;
  saveStatus: 'idle' | 'success' | 'error';
  categories: string[];
  states: string[];
  onBusinessHoursChange: (
    day: keyof typeof DEFAULT_PROFILE.business_hours,
    field: 'open' | 'close' | 'closed',
    value: string | boolean
  ) => void;
  onSocialChange: (platform: string, value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Profil de votre entreprise
          </h2>
          <p className="text-sm text-gray-600">
            Complétez les informations pour inspirer confiance aux acheteurs.
          </p>
        </div>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <i className="ri-edit-line mr-2" />
            Modifier
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? (
                <span className="flex items-center space-x-2">
                  <i className="ri-loader-4-line animate-spin" />
                  <span>Sauvegarde...</span>
                </span>
              ) : (
                <span>
                  <i className="ri-save-line mr-2" />
                  Sauvegarder
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {saveStatus === 'success' && (
        <Alert tone="success" message="Profil mis à jour avec succès." />
      )}
      {saveStatus === 'error' && (
        <Alert tone="error" message="Erreur lors de la sauvegarde du profil." />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Informations générales">
          <div className="space-y-4">
            <Field
              label="Nom de l'entreprise"
              value={profileData.business_name}
              readOnly={!editMode}
              onChange={(value) => onChangeField('business_name', value)}
            />
            <Textarea
              label="Description"
              value={profileData.description}
              readOnly={!editMode}
              onChange={(value) => onChangeField('description', value)}
            />
            <Select
              label="Catégorie principale"
              value={profileData.category}
              readOnly={!editMode}
              options={categories}
              placeholder="Sélectionnez une catégorie"
              onChange={(value) => onChangeField('category', value)}
            />
          </div>
        </Card>

        <Card title="Coordonnées">
          <div className="space-y-4">
            <Field
              label="Téléphone"
              value={profileData.phone}
              readOnly={!editMode}
              onChange={(value) => onChangeField('phone', value)}
            />
            <Field
              label="Email"
              value={profileData.email}
              readOnly={!editMode}
              onChange={(value) => onChangeField('email', value)}
            />
            <Field
              label="Site web"
              value={profileData.website}
              readOnly={!editMode}
              placeholder="https://..."
              onChange={(value) => onChangeField('website', value)}
            />
          </div>
        </Card>

        <Card title="Localisation" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Adresse"
              value={profileData.address}
              readOnly={!editMode}
              onChange={(value) => onChangeField('address', value)}
            />
            <Field
              label="Ville"
              value={profileData.city}
              readOnly={!editMode}
              onChange={(value) => onChangeField('city', value)}
            />
            <Select
              label="État"
              value={profileData.state}
              readOnly={!editMode}
              options={states}
              placeholder="Sélectionnez un état"
              onChange={(value) => onChangeField('state', value)}
            />
          </div>
        </Card>

        <Card title="Horaires d'ouverture">
          <div className="space-y-3">
            {(Object.keys(DAY_NAMES) as Array<
              keyof typeof DEFAULT_PROFILE.business_hours
            >).map((dayKey) => {
              const day = profileData.business_hours[dayKey];
              return (
                <div key={dayKey} className="flex items-center space-x-3">
                  <span className="w-24 text-sm font-medium text-gray-700">
                    {DAY_NAMES[dayKey]}
                  </span>
                  {editMode ? (
                    <>
                      <input
                        type="time"
                        value={day.open}
                        disabled={day.closed}
                        onChange={(event) =>
                          onBusinessHoursChange(dayKey, 'open', event.target.value)
                        }
                        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={day.close}
                        disabled={day.closed}
                        onChange={(event) =>
                          onBusinessHoursChange(dayKey, 'close', event.target.value)
                        }
                        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <label className="ml-auto flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={day.closed}
                          onChange={(event) =>
                            onBusinessHoursChange(dayKey, 'closed', event.target.checked)
                          }
                          className="rounded border-gray-300 text-green-600"
                        />
                        <span>Fermé</span>
                      </label>
                    </>
                  ) : (
                    <span className="ml-auto text-sm text-gray-700">
                      {day.closed ? 'Fermé' : `${day.open} - ${day.close}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Réseaux sociaux">
          <div className="space-y-3">
            {Object.entries(profileData.social_links).map(([platform, value]) => (
              <Field
                key={platform}
                label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                value={value}
                readOnly={!editMode}
                onChange={(newValue) => onSocialChange(platform, newValue)}
                placeholder={`Lien ${platform}`}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProductsSection({
  products,
  planConfig,
  totalProducts,
  productToast,
  onAdd,
  onEdit,
  onDelete,
  canManage,
  onUpgrade,
  setActiveTab,
}: {
  products: any[];
  planConfig: (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];
  totalProducts: number;
  productToast: Toast;
  onAdd: () => void;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  canManage: boolean;
  onUpgrade: () => void;
  setActiveTab: (tab: DashboardTab) => void;
}) {
  const { formatCurrency } = useCurrency();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Gestion des produits
          </h2>
          <p className="text-sm text-gray-600">
            Ajoutez, modifiez ou supprimez des produits pour rester à jour.
          </p>
        </div>
        {canManage ? (
          <button
            onClick={onAdd}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <i className="ri-add-line mr-2" />
            Ajouter un produit
          </button>
        ) : (
          <button
            onClick={onUpgrade}
            className="cursor-not-allowed rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-white"
          >
            <i className="ri-lock-line mr-2" />
            Limite atteinte
          </button>
        )}
      </div>

      {planConfig.maxProducts !== -1 && (
        <Alert
          tone={
            totalProducts >= planConfig.maxProducts ? 'warning' : 'information'
          }
          message={`Vous utilisez ${totalProducts}/${planConfig.maxProducts} produits disponibles.`}
          actionLabel={
            totalProducts >= planConfig.maxProducts ? 'Voir les plans' : undefined
          }
          onAction={
            totalProducts >= planConfig.maxProducts
              ? () => setActiveTab('subscription')
              : undefined
          }
        />
      )}

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Image
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Nom
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Catégorie
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Prix
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Stock
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Statut
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  Aucun produit enregistré pour le moment.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {product.category || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatCurrency(Number(product.price || 0))}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {product.stock ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {product.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <button
                        className="text-sm font-medium text-green-600 hover:text-green-800"
                        onClick={() => onEdit(product)}
                      >
                        Modifier
                      </button>
                      <button
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                        onClick={() => onDelete(product)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersSection({
  orders,
  orderStatus,
  setOrderStatus,
  orderSearch,
  setOrderSearch,
  onView,
  onUpdateStatus,
  onDelete,
  orderToast,
}: {
  orders: any[];
  orderStatus: 'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  setOrderStatus: (status: 'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => void;
  orderSearch: string;
  setOrderSearch: (value: string) => void;
  onView: (order: any) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onDelete: (order: any) => void;
  orderToast: Toast;
}) {
  const { formatCurrency } = useCurrency();
  const filteredOrders =
    orders?.filter((order: any) => {
      const matchesSearch =
        orderSearch === '' ||
        (order.order_number || '')
          .toLowerCase()
          .includes(orderSearch.toLowerCase()) ||
        (order.shipping_address?.full_name || '')
          .toLowerCase()
          .includes(orderSearch.toLowerCase());
      const matchesStatus =
        orderStatus === 'all' || order.status === orderStatus;
      return matchesSearch && matchesStatus;
    }) || [];

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Suivi des commandes
          </h2>
          <p className="text-sm text-gray-600">
            Gérez vos commandes clients et suivez leur statut.
          </p>
        </div>
      </div>

      {orderToast && (
        <Alert
          tone={orderToast.type === 'success' ? 'success' : 'error'}
          message={orderToast.message}
        />
      )}

      <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={orderSearch}
          onChange={(event) => setOrderSearch(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500 sm:max-w-xs"
          placeholder="Rechercher..."
        />
        <select
          value={orderStatus}
          onChange={(event) =>
            setOrderStatus(event.target.value as any)
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500 sm:w-auto"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmée</option>
          <option value="processing">En traitement</option>
          <option value="shipped">Expédiée</option>
          <option value="delivered">Livrée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                N° Commande
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Client
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Articles
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Montant
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Statut
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Date
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  Aucune commande ne correspond aux filtres sélectionnés.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order: any) => (
                <tr key={order._id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    #{order.order_number}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {order.shipping_address?.full_name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {order.order_items?.length || 0} article(s)
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatCurrency(Number(order.total_amount || 0))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        onClick={() => onView(order)}
                      >
                        Voir
                      </button>
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateStatus(order._id, e.target.value)}
                          className="text-xs rounded border border-gray-300 px-2 py-1 focus:ring-2 focus:ring-green-500"
                        >
                          <option value="pending">En attente</option>
                          <option value="confirmed">Confirmée</option>
                          <option value="processing">En traitement</option>
                          <option value="shipped">Expédiée</option>
                          <option value="delivered">Livrée</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                      )}
                      <button
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                        onClick={() => onDelete(order)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewsSection({
  data,
  onRespond,
  onDelete,
  reviewToast,
}: {
  data: DashboardData | null;
  onRespond: (review: any) => void;
  onDelete: (review: any) => void;
  reviewToast: Toast;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Retours clients
        </h2>
        <p className="text-sm text-gray-600">
          Répondez aux avis pour renforcer la confiance auprès des nouveaux
          acheteurs.
        </p>
      </div>

      {reviewToast && (
        <Alert
          tone={reviewToast.type === 'success' ? 'success' : 'error'}
          message={reviewToast.message}
        />
      )}

      <div className="space-y-4">
        {(data?.reviews || []).length === 0 ? (
          <Card>
            <p className="py-10 text-center text-sm text-gray-500">
              Aucun avis pour le moment.
            </p>
          </Card>
        ) : (
          data?.reviews?.map((review: any) => (
            <Card key={review.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {review.customer_name || 'Client'}
                    </p>
                    <div className="flex items-center space-x-1 text-yellow-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={`${
                            star <= Number(review.rating || 0)
                              ? 'ri-star-fill'
                              : 'ri-star-line'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{review.comment}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {review.created_at
                      ? new Date(review.created_at).toLocaleDateString('fr-FR')
                      : ''}
                  </p>
                  {review.response && (
                    <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                      <p className="font-medium">Votre réponse :</p>
                      <p>{review.response}</p>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3 text-sm font-medium">
                  <button
                    className="text-green-600 hover:text-green-800"
                    onClick={() => onRespond(review)}
                  >
                    {review.response ? 'Modifier la réponse' : 'Répondre'}
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => onDelete(review)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function AnalyticsSection({
  monthlyAggregates,
  planConfig,
  handleExportCSV,
  onRequestUpgrade,
}: {
  monthlyAggregates: Array<{
    month: string;
    revenue: number;
    orders: number;
    reviews: number;
  }>;
  planConfig: (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];
  handleExportCSV: () => void;
  onRequestUpgrade: () => void;
}) {
  const canAccessAnalytics = planConfig.canAccessAnalytics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Analytics et performances
          </h2>
          <p className="text-sm text-gray-600">
            Visualisez les performances de votre boutique sur les derniers mois.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <i className="ri-download-2-line mr-2" />
          Exporter en CSV
        </button>
      </div>

      {canAccessAnalytics ? (
        <Card title="Performance mensuelle">
          {monthlyAggregates.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Pas encore de données analytiques.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyAggregates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Chiffre d'affaires"
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Commandes"
                  />
                  <Line
                    type="monotone"
                    dataKey="reviews"
                    stroke="#a855f7"
                    strokeWidth={2}
                    name="Avis"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center space-y-3 py-12 text-center">
            <i className="ri-lock-line text-4xl text-gray-400" />
            <p className="text-sm text-gray-600">
              Les analytics sont disponibles à partir du plan Basic.
            </p>
            <button
              onClick={onRequestUpgrade}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Voir les plans disponibles
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

function SubscriptionSection() {
  // For now, show coming soon message as this feature is not fully implemented
  return <ComingSoon feature="subscription" />;
}

function TeamSection() {
  // For now, show coming soon message as this feature is not fully implemented
  return <ComingSoon feature="team" />;
}

function ProductModal({
  open,
  mode,
  form,
  loading,
  onClose,
  onSubmit,
  onChange,
}: {
  open: boolean;
  mode: 'add' | 'edit' | 'delete';
  form: { 
    name: string; 
    price: string; 
    stock: string; 
    status: 'active' | 'inactive';
    category: string;
    description: string;
    images: string[];
  };
  loading: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onChange: React.Dispatch<
    React.SetStateAction<{
      name: string;
      price: string;
      stock: string;
      status: 'active' | 'inactive';
      category: string;
      description: string;
      images: string[];
    }>
  >;
}) {
  const [imageUrl, setImageUrl] = useState('');
  
  if (!open) return null;
  return (
    <Modal title={mode === 'add' ? 'Ajouter un produit' : 'Modifier le produit'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Nom"
          value={form.name}
          readOnly={false}
          onChange={(value) => onChange((prev) => ({ ...prev, name: value }))}
          required
        />
        <Field
          label="Prix"
          type="number"
          value={form.price}
          readOnly={false}
          onChange={(value) => onChange((prev) => ({ ...prev, price: value }))}
          required
        />
        <Field
          label="Stock"
          type="number"
          value={form.stock}
          readOnly={false}
          onChange={(value) => onChange((prev) => ({ ...prev, stock: value }))}
          required
        />
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Statut</label>
          <select
            value={form.status}
            onChange={(event) =>
              onChange((prev) => ({
                ...prev,
                status: event.target.value as 'active' | 'inactive',
              }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
        <Field
          label="Catégorie"
          value={form.category}
          placeholder="Ex: Électronique, Vêtements, Alimentation..."
          readOnly={false}
          onChange={(value) => onChange((prev) => ({ ...prev, category: value }))}
        />
        <Textarea
          label="Description"
          value={form.description}
          placeholder="Description du produit..."
          readOnly={false}
          onChange={(value) => onChange((prev) => ({ ...prev, description: value }))}
        />
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Images du produit</label>
          <div className="flex flex-wrap gap-2">
            {form.images.map((img, index) => (
              <div key={index} className="relative">
                <img src={img} alt={`Product ${index}`} className="h-16 w-16 rounded object-cover border" />
                <button
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index),
                    }))
                  }
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL de l'image..."
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={() => {
                if (imageUrl.trim()) {
                  onChange((prev) => ({
                    ...prev,
                    images: [...prev.images, imageUrl.trim()],
                  }));
                  setImageUrl('');
                }
              }}
              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Ajouter
            </button>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? 'En cours...' : mode === 'add' ? 'Ajouter' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function OrderViewModal({
  open,
  order,
  onClose,
}: {
  open: boolean;
  order: any;
  onClose: () => void;
}) {
  const { formatCurrency } = useCurrency();
  
  if (!open || !order) return null;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Modal title={`Commande #${order.order_number}`} onClose={onClose}>
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Statut:</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-gray-900">Informations client</h4>
          <p className="text-sm"><span className="text-gray-600">Nom:</span> {order.shipping_address?.full_name || 'N/A'}</p>
          <p className="text-sm"><span className="text-gray-600">Téléphone:</span> {order.shipping_address?.phone || 'N/A'}</p>
          <p className="text-sm"><span className="text-gray-600">Adresse:</span> {order.shipping_address?.address || 'N/A'}</p>
          <p className="text-sm"><span className="text-gray-600">Ville:</span> {order.shipping_address?.city || 'N/A'}, {order.shipping_address?.state || 'N/A'}</p>
        </div>

        {/* Order Items */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Articles commandés</h4>
          <div className="space-y-3">
            {order.order_items?.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.product_name} className="w-12 h-12 rounded object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                    <i className="ri-shopping-bag-line text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product_name}</p>
                  <p className="text-xs text-gray-600">Qté: {Number(item.quantity)} × {formatCurrency(Number(item.unit_price))}</p>
                </div>
                <p className="font-medium text-sm">{formatCurrency(Number(item.total_price))}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">Total</span>
            <span className="font-bold text-lg text-green-600">{formatCurrency(Number(order.total_amount))}</span>
          </div>
        </div>

        {/* Dates */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>Commandée le: {order.created_at ? new Date(order.created_at).toLocaleString('fr-FR') : 'N/A'}</p>
          <p>Dernière mise à jour: {order.updated_at ? new Date(order.updated_at).toLocaleString('fr-FR') : 'N/A'}</p>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-yellow-50 rounded-lg p-3">
            <h4 className="font-medium text-sm text-yellow-800 mb-1">Notes</h4>
            <p className="text-sm text-yellow-700">{order.notes}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}

function OrderModal({
  open,
  mode,
  form,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: 'add' | 'edit' | 'delete';
  form: { order_number: string; total_amount: string | number; status: string };
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: { order_number: string; total_amount: number; status: string }) => Promise<void>;
}) {
  const [localForm, setLocalForm] = useState(form);

  useEffect(() => {
    setLocalForm(form);
  }, [form, open]);

  if (!open) return null;

  return (
    <Modal title={mode === 'add' ? 'Ajouter une commande' : 'Modifier la commande'} onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit({
            order_number: localForm.order_number,
            total_amount: Number(localForm.total_amount) || 0,
            status: localForm.status,
          });
        }}
        className="space-y-4"
      >
        <Field
          label="Numéro de commande"
          value={localForm.order_number}
          readOnly={false}
          onChange={(value) =>
            setLocalForm((prev) => ({ ...prev, order_number: value }))
          }
          required
        />
        <Field
          label="Montant"
          type="number"
          value={localForm.total_amount}
          readOnly={false}
          onChange={(value) =>
            setLocalForm((prev) => ({ ...prev, total_amount: value }))
          }
          required
        />
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Statut</label>
          <select
            value={localForm.status}
            onChange={(event) =>
              setLocalForm((prev) => ({ ...prev, status: event.target.value }))
            }
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="pending">En attente</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? 'En cours...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReviewRespondModal({
  open,
  review,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  review: any;
  loading: boolean;
  onClose: () => void;
  onSubmit: (response: string) => Promise<void>;
}) {
  const [response, setResponse] = useState('');

  useEffect(() => {
    setResponse(review?.response || '');
  }, [review, open]);

  if (!open) return null;

  return (
    <Modal
      title={
        review?.response ? 'Modifier la réponse' : 'Répondre à l’avis'
      }
      onClose={onClose}
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit(response);
        }}
        className="space-y-4"
      >
        <Textarea
          label="Message"
          value={response}
          readOnly={false}
          onChange={setResponse}
          required
        />
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? 'En cours...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmModal({
  open,
  title,
  message,
  loading,
  onCancel,
  onConfirm,
  confirmLabel = 'Confirmer',
  confirmType = 'primary',
}: {
  open: boolean;
  title: string;
  message: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmType?: 'primary' | 'danger';
}) {
  if (!open) return null;

  const confirmClasses =
    confirmType === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-green-600 hover:bg-green-700';

  return (
    <Modal title={title} onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-gray-700">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${confirmClasses}`}
          >
            {loading ? 'En cours...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PaymentModal({
  open,
  loading,
  planId,
  onClose,
  onConfirm,
}: {
  open: boolean;
  loading: boolean;
  planId: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <Modal title="Confirmer le paiement" onClose={onClose}>
      <p className="text-sm text-gray-700">
        Vous allez être redirigé vers Stripe pour payer le plan{' '}
        <span className="font-semibold">{planId}</span>.
      </p>
      <div className="mt-6 flex justify-end space-x-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? 'Paiement...' : 'Payer maintenant'}
        </button>
      </div>
    </Modal>
  );
}

function InviteModal({
  open,
  email,
  role,
  onClose,
  onChangeEmail,
  onChangeRole,
  onSubmit,
}: {
  open: boolean;
  email: string;
  role: string;
  onClose: () => void;
  onChangeEmail: (value: string) => void;
  onChangeRole: (value: string) => void;
  onSubmit: () => void;
}) {
  if (!open) return null;
  return (
    <Modal title="Inviter un membre" onClose={onClose}>
      <div className="space-y-4">
        <Field
          label="Email"
          value={email}
          readOnly={false}
          onChange={onChangeEmail}
          placeholder="email@example.com"
          type="email"
        />
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Rôle</label>
          <select
            value={role}
            onChange={(event) => onChangeRole(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="editor">Éditeur</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={!email.includes('@')}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            Inviter
          </button>
        </div>
      </div>
    </Modal>
  );
}

function UpgradeModal({
  open,
  description,
  onClose,
  onSeePlans,
}: {
  open: boolean;
  description: string;
  onClose: () => void;
  onSeePlans: () => void;
}) {
  if (!open) return null;
  return (
    <Modal title="Fonctionnalité Premium" onClose={onClose}>
      <div className="space-y-6 text-center">
        <i className="ri-vip-crown-line text-4xl text-yellow-500" />
        <p className="text-sm text-gray-600">{description}</p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Fermer
          </button>
          <button
            onClick={onSeePlans}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Voir les plans
          </button>
        </div>
      </div>
    </Modal>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
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

function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border bg-white p-6 shadow-sm ${className}`}>
      {title && (
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
  placeholder,
  type = 'text',
  required,
}: {
  label: string;
  value: string | number;
  onChange?: (value: string) => void;
  readOnly: boolean;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        readOnly={readOnly}
        required={required}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500 ${
          readOnly ? 'bg-gray-100 text-gray-500' : ''
        }`}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  readOnly,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value}
        readOnly={readOnly}
        required={required}
        placeholder={placeholder}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        rows={3}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500 ${
          readOnly ? 'bg-gray-100 text-gray-500' : ''
        }`}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  readOnly,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly: boolean;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {readOnly ? (
        <input
          readOnly
          value={value || ''}
          className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500"
        />
      ) : (
        <select
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function RecentOrdersCard({ orders }: { orders: any[] }) {
  const { formatCurrency } = useCurrency();
  
  return (
    <Card title="Commandes récentes">
      <div className="space-y-3">
        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            Aucune commande récente.
          </p>
        ) : (
          orders.slice(0, 5).map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-900">
                  #{order.order_number}
                </p>
                <p className="text-xs text-gray-500">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString('fr-FR')
                    : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatCurrency(Number(order.total_amount || 0))}
                </p>
                <StatusPill status={order.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function RecentReviewsCard({ reviews }: { reviews: any[] }) {
  return (
    <Card title="Avis récents">
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            Aucun avis récent.
          </p>
        ) : (
          reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">
                  {review.customer_name || 'Client'}
                </p>
                <div className="flex items-center space-x-1 text-yellow-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      className={`${
                        star <= Number(review.rating || 0)
                          ? 'ri-star-fill'
                          : 'ri-star-line'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-700">{review.comment}</p>
              <p className="text-xs text-gray-400">
                {review.created_at
                  ? new Date(review.created_at).toLocaleDateString('fr-FR')
                  : ''}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const mapping: Record<string, { label: string; className: string }> = {
    delivered: { label: 'Livrée', className: 'bg-green-100 text-green-700' },
    shipped: { label: 'Expédiée', className: 'bg-indigo-100 text-indigo-700' },
    processing: { label: 'En traitement', className: 'bg-purple-100 text-purple-700' },
    confirmed: { label: 'Confirmée', className: 'bg-blue-100 text-blue-700' },
    pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700' },
    cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-700' },
  };
  const { label, className } = mapping[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function Alert({
  tone,
  message,
  actionLabel,
  onAction,
}: {
  tone: 'success' | 'error' | 'warning' | 'information';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const palette = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: 'ri-check-line',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'ri-error-warning-line',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: 'ri-alert-line',
    },
    information: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'ri-information-line',
    },
  }[tone];

  return (
    <div className={`flex items-center justify-between rounded-lg border ${palette.bg} ${palette.border} px-4 py-3 ${palette.text}`}>
      <div className="flex items-center space-x-2">
        <i className={`${palette.icon}`} />
        <span className="text-sm">{message}</span>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-sm font-semibold underline-offset-2 hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg border bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Fermer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>
        <div className="px-4 py-5">{children}</div>
      </div>
    </div>
  );
}

function ToastInline({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
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
          Fermer
        </button>
      </div>
    </div>
  );
}

