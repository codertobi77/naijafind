import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Id } from '@convex/_generated/dataModel';
import { useQuoteRequest } from '../hooks/useProductSourcing';
import type { SupplierSnapshot } from '../hooks/useProductSourcing';

interface QuoteRequestFormProps {
  productId: Id<'products'>;
  productName: string;
  suppliers: SupplierSnapshot[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuoteRequestForm({
  productId,
  productName,
  suppliers,
  isOpen,
  onClose,
  onSuccess,
}: QuoteRequestFormProps) {
  const { t } = useTranslation();
  const { submitQuoteRequest, submitting, success, error, reset } = useQuoteRequest();

  const [selectedSupplierIds, setSelectedSupplierIds] = useState<Set<string>>(
    () => new Set(suppliers.map((s) => s.id))
  );

  const [formData, setFormData] = useState({
    quantity: '',
    quantityUnit: 'units',
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    buyerCountry: '',
    buyerCompany: '',
    preferredDeliveryDate: '',
    budgetRange: '',
    message: '',
  });

  const handleSelectAll = useCallback(() => {
    setSelectedSupplierIds(new Set(suppliers.map((s) => s.id)));
  }, [suppliers]);

  const handleSelectNone = useCallback(() => {
    setSelectedSupplierIds(new Set());
  }, []);

  const toggleSupplier = useCallback((supplierId: string) => {
    setSelectedSupplierIds((prev) => {
      const next = new Set(prev);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else {
        next.add(supplierId);
      }
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const supplierIds = Array.from(selectedSupplierIds) as Id<'suppliers'>[];

    const result = await submitQuoteRequest(productId, supplierIds, {
      quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
      quantityUnit: formData.quantityUnit,
      buyerName: formData.buyerName,
      buyerEmail: formData.buyerEmail,
      buyerPhone: formData.buyerPhone || undefined,
      buyerCountry: formData.buyerCountry || undefined,
      buyerCompany: formData.buyerCompany || undefined,
      preferredDeliveryDate: formData.preferredDeliveryDate || undefined,
      budgetRange: formData.budgetRange || undefined,
      message: formData.message,
    });

    if (result && onSuccess) {
      onSuccess();
    }
  };

  const handleClose = () => {
    reset();
    setFormData({
      quantity: '',
      quantityUnit: 'units',
      buyerName: '',
      buyerEmail: '',
      buyerPhone: '',
      buyerCountry: '',
      buyerCompany: '',
      preferredDeliveryDate: '',
      budgetRange: '',
      message: '',
    });
    setSelectedSupplierIds(new Set(suppliers.map((s) => s.id)));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('rfq.title')}</h2>
              <p className="text-sm text-gray-600 mt-1">{t('rfq.subtitle')}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ri-close-line text-2xl" />
            </button>
          </div>

          {/* Product Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500">{t('products.details_title')}</p>
            <p className="font-semibold text-gray-900">{productName}</p>
          </div>

          {/* Success State */}
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-3xl text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('rfq.success_title')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('rfq.success_message', { count: selectedSupplierIds.size })}
              </p>
              <button
                onClick={handleClose}
                className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                {t('products.close')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Supplier Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    {t('rfq.selected_suppliers', { count: selectedSupplierIds.size })}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      {t('rfq.select_all')}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleSelectNone}
                      className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                    >
                      {t('rfq.select_none')}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3">
                  {suppliers.map((supplier) => (
                    <label
                      key={supplier.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSupplierIds.has(supplier.id)}
                        onChange={() => toggleSupplier(supplier.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900 truncate">
                            {supplier.name}
                          </span>
                          {supplier.verified && (
                            <i
                              className="ri-verified-badge-fill text-green-500 text-sm"
                              title={t('supplier.verified')}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              supplier.matchConfidence === 'high'
                                ? 'bg-green-100 text-green-700'
                                : supplier.matchConfidence === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {t(`match.confidence.${supplier.matchConfidence}`)}
                          </span>
                          {supplier.rating !== undefined && (
                            <span className="flex items-center gap-1">
                              <i className="ri-star-fill text-yellow-500" />
                              {supplier.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedSupplierIds.size === 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    {t('rfq.validation.supplier_required')}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('rfq.quantity')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    placeholder={t('rfq.quantity_placeholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('rfq.quantity_unit')}
                  </label>
                  <select
                    value={formData.quantityUnit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, quantityUnit: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="units">{t('rfq.units')}</option>
                    <option value="kg">{t('rfq.kg')}</option>
                    <option value="liters">{t('rfq.liters')}</option>
                    <option value="pieces">{t('rfq.pieces')}</option>
                    <option value="boxes">{t('rfq.boxes')}</option>
                    <option value="pallets">{t('rfq.pallets')}</option>
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('rfq.your_name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.buyerName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, buyerName: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('rfq.your_email')} *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.buyerEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, buyerEmail: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('rfq.your_phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.buyerPhone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, buyerPhone: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('rfq.your_company')}
                  </label>
                  <input
                    type="text"
                    value={formData.buyerCompany}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, buyerCompany: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Delivery & Budget */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('rfq.delivery_date')}
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDeliveryDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        preferredDeliveryDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('rfq.budget_range')}
                  </label>
                  <select
                    value={formData.budgetRange}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, budgetRange: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">{t('rfq.select_budget')}</option>
                    <option value="low">{t('rfq.budget_low')}</option>
                    <option value="medium">{t('rfq.budget_medium')}</option>
                    <option value="high">{t('rfq.budget_high')}</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('rfq.message')} *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder={t('rfq.message_placeholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    <i className="ri-error-warning-line mr-2" />
                    {error}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={submitting || selectedSupplierIds.size === 0}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin" />
                      {t('rfq.submitting')}
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-fill" />
                      {t('rfq.submit')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {t('products.cancel')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
