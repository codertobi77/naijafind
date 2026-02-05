import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConvexQuery } from '../../hooks/useConvexQuery';
import { api } from '../../../convex/_generated/api';
import { useCurrency } from '../../hooks/useCurrency';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../../components/base/LanguageSelector';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

export default function MyOrders() {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { data: orders, isLoading } = useConvexQuery(
    api.orders.getCustomerOrders,
    { status: statusFilter === 'all' ? undefined : statusFilter },
    { staleTime: 1 * 60 * 1000 }
  );

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center group">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <i className="ri-compass-3-fill text-white text-xl"></i>
                </div>
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent" style={{ fontFamily: "Pacifico, serif" }}>
                  NaijaFind
                </span>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-1">
              <Link to="/" className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium transition-all">{t('nav.home')}</Link>
              <Link to="/search" className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium transition-all">{t('nav.search')}</Link>
              <Link to="/categories" className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium transition-all">{t('nav.categories')}</Link>
              <Link to="/about" className="px-4 py-2 rounded-lg text-gray-700 hover:text-green-600 hover:bg-green-50 font-medium transition-all">{t('nav.about')}</Link>
            </nav>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <LanguageSelector />
              <SignedOut>
                <Link to="/auth/login" className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-2.5 rounded-xl hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium whitespace-nowrap text-sm sm:text-base transform hover:-translate-y-0.5">
                  {t('nav.login')}
                </Link>
              </SignedOut>
              <SignedIn>
                <Link 
                  to="/my-orders"
                  className="text-green-600 bg-green-50 font-medium px-3 py-2 rounded-lg transition-colors hidden sm:block"
                >
                  Mes commandes
                </Link>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mes commandes</h1>
          <p className="text-gray-600 mt-1">Suivez l'état de vos commandes et consultez votre historique</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'confirmed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmées
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'processing' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En traitement
            </button>
            <button
              onClick={() => setStatusFilter('shipped')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'shipped' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expédiées
            </button>
            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'delivered' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Livrées
            </button>
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de vos commandes...</p>
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">Commande #{order.order_number}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Fournisseur: <span className="font-medium">{order.supplierName || 'N/A'}</span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(Number(order.total_amount))}</p>
                      <p className="text-sm text-gray-600">{order.order_items?.length || 0} article(s)</p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {order.order_items?.slice(0, 4).map((item: any, index: number) => (
                        <div key={index} className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <i className="ri-shopping-bag-line text-gray-400 text-xl" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.order_items?.length > 4 && (
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm text-gray-600">+{order.order_items.length - 4}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                    <Link
                      to={`/order/${order._id}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Voir les détails
                    </Link>
                    {order.status === 'delivered' && (
                      <Link
                        to={`/supplier/${order.supplierId}`}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Laisser un avis
                      </Link>
                    )}
                  </div>
                </div>

                {/* Progress Bar for non-cancelled orders */}
                {order.status !== 'cancelled' && (
                  <div className="bg-gray-50 px-4 sm:px-6 py-3">
                    <div className="flex items-center">
                      {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, index) => {
                        const stepOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                        const currentIndex = stepOrder.indexOf(order.status);
                        const isCompleted = index <= currentIndex;
                        const isCurrent = index === currentIndex;
                        
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className={`
                              w-3 h-3 rounded-full ${
                                isCompleted 
                                  ? isCurrent ? 'bg-green-600 ring-4 ring-green-200' : 'bg-green-500'
                                  : 'bg-gray-300'
                              }
                            `} />
                            {index < 4 && (
                              <div className={`
                                flex-1 h-0.5 mx-1 ${
                                  isCompleted && index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                                }
                              `} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Commande</span>
                      <span>Confirmée</span>
                      <span>Préparation</span>
                      <span>Expédiée</span>
                      <span>Livrée</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-shopping-cart-line text-3xl text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande</h3>
            <p className="text-gray-600 mb-6">Vous n'avez pas encore passé de commande</p>
            <Link
              to="/search"
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <i className="ri-search-line mr-2" />
              Découvrir des produits
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
