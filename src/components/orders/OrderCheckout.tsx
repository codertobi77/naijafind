import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrency } from '../../hooks/useCurrency';

interface CartItem {
  productId: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  image_url?: string;
}

interface ShippingAddress {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  postal_code?: string;
}

interface OrderCheckoutProps {
  supplierId: string;
  cartItems: CartItem[];
  onSuccess?: (order: { id: string; order_number: string }) => void;
  onCancel?: () => void;
}

export function OrderCheckout({ supplierId, cartItems, onSuccess, onCancel }: OrderCheckoutProps) {
  const { formatCurrency } = useCurrency();
  const createOrderMutation = useMutation(api.orders.createOrder);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'shipping' | 'review' | 'success'>('shipping');
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postal_code: '',
  });
  const [notes, setNotes] = useState('');

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.full_name || !shippingAddress.phone || !shippingAddress.address || !shippingAddress.city || !shippingAddress.state) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setError(null);
    setStep('review');
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        product_name: item.product_name,
        quantity: BigInt(item.quantity),
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        image_url: item.image_url,
      }));

      const result = await createOrderMutation({
        supplierId,
        shipping_address: shippingAddress,
        order_items: orderItems,
        notes: notes || undefined,
      });

      setStep('success');
      onSuccess?.({ id: result.id as string, order_number: result.order_number });
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-check-line text-3xl text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Commande confirmée !</h2>
          <p className="text-gray-600 mb-4">Votre commande a été passée avec succès.</p>
          <button
            onClick={onCancel}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Continuer mes achats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {step === 'shipping' ? 'Adresse de livraison' : 'Récapitulatif de la commande'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>
        
        {/* Progress */}
        <div className="flex items-center mt-4 space-x-2">
          <div className={`flex-1 h-2 rounded ${step === 'shipping' ? 'bg-green-600' : 'bg-green-200'}`} />
          <div className={`flex-1 h-2 rounded ${step === 'review' ? 'bg-green-600' : 'bg-gray-200'}`} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Livraison</span>
          <span>Confirmation</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      {step === 'shipping' ? (
        <form onSubmit={handleSubmitShipping} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shippingAddress.full_name}
              onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Votre nom complet"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={shippingAddress.phone}
              onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="+234 XX XXX XXXX"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse <span className="text-red-500">*</span>
            </label>
            <textarea
              value={shippingAddress.address}
              onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Votre adresse de livraison"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ville"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                État <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="État"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Instructions de livraison ou autres notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Continuer
            </button>
          </div>
        </form>
      ) : (
        <div className="p-6">
          {/* Order Summary */}
          <div className="space-y-3 mb-6">
            {cartItems.map((item, index) => (
              <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.product_name} className="w-16 h-16 rounded object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center">
                    <i className="ri-shopping-bag-line text-gray-400 text-xl" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product_name}</p>
                  <p className="text-sm text-gray-600">
                    {item.quantity} × {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <p className="font-medium text-gray-900">
                  {formatCurrency(item.unit_price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Shipping Address */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Adresse de livraison</h3>
            <p className="text-sm text-gray-600">{shippingAddress.full_name}</p>
            <p className="text-sm text-gray-600">{shippingAddress.phone}</p>
            <p className="text-sm text-gray-600">{shippingAddress.address}</p>
            <p className="text-sm text-gray-600">{shippingAddress.city}, {shippingAddress.state}</p>
            <button
              onClick={() => setStep('shipping')}
              className="text-sm text-green-600 hover:text-green-700 mt-2"
            >
              Modifier
            </button>
          </div>

          {/* Total */}
          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('shipping')}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retour
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <i className="ri-loader-4-line animate-spin mr-2" />
                  Traitement...
                </span>
              ) : (
                'Confirmer la commande'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderCheckout;
