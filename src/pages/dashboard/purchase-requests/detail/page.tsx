import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useConvexAuth, useMutation } from 'convex/react';
import type { Id } from '@convex/_generated/dataModel';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@convex/_generated/api';
import { useConvexQuery, useConvexQuerySkippable } from '../../../../hooks/useConvexQuery';
import { Header } from '../../../../components/base';
import AttachmentThumb from '../../../../components/purchase-request/AttachmentThumb';
import StatusBadge from '../../../../components/purchase-request/StatusBadge';
import useFormatDate from '../../../../hooks/useFormatDate';
import type { PublicQuote, SupplierProfileSummary } from '@convex/supplierFlow';

type Quote = PublicQuote;
type SupplierProfile = SupplierProfileSummary;

const CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP', 'XOF'];

/**
 * Page détail d'une demande d'achat, rôle-adaptée :
 * - propriétaire (acheteur) : infos complètes + devis reçus ;
 * - fournisseur : infos + pièce jointe + formulaire de devis branché sur
 *   api.purchaseRequests.submitQuote (choix du profil si plusieurs) ;
 * - tout utilisateur authentifié peut consulter la demande (Phase 1).
 */
export default function DashboardPurchaseRequestDetailPage() {
  const { t } = useTranslation();
  const { requestId } = useParams<{ requestId: string }>();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const navigate = useNavigate();
  const { formatDateTime } = useFormatDate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Les identifiants Convex sont des chaînes base62 ; on évite d'appeler
  // la query avec un paramètre manifestement invalide.
  const validRequestId =
    typeof requestId === 'string' && /^[a-zA-Z0-9_-]{20,}$/.test(requestId)
      ? (requestId as Id<'purchaseRequests'>)
      : null;

  const { data: detail, isLoading: detailLoading } = useConvexQuerySkippable(
    api.supplierFlow.getPurchaseRequestDetail,
    validRequestId ? { requestId: validRequestId } : undefined,
    { staleTime: 30 * 1000 }
  );

  const { data: meData } = useConvexQuery(api.users.me, {}, { staleTime: 2 * 60 * 1000 });
  const isSupplier = meData?.user?.user_type === 'supplier';

  const { data: myProfiles } = useConvexQuerySkippable(
    api.supplierFlow.getMySupplierProfiles,
    isSupplier && detail && !detail.isOwner ? {} : undefined,
    { staleTime: 2 * 60 * 1000 }
  );

  const loading =
    authLoading || detailLoading || (validRequestId !== null && detail === undefined);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex h-64 items-center justify-center">
          <i className="ri-loader-4-line animate-spin text-3xl text-green-600" />
        </div>
      </div>
    );
  }

  if (!validRequestId || detail === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <i className="ri-search-eye-line mb-4 text-5xl text-gray-300" />
            <h1 className="mb-2 text-xl font-bold text-gray-900">
              {t('supplierFlow.request_not_found')}
            </h1>
            <p className="mb-6 text-sm text-gray-500">
              {t('supplierFlow.request_not_found_desc')}
            </p>
            <Link
              to="/dashboard/purchase-requests"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <i className="ri-arrow-left-line" />
              {t('supplierFlow.back_to_requests')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { request, quotes, isOwner } = detail;
  const myQuotes = quotes.filter((quote: Quote) => quote.isMine);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/dashboard/purchase-requests"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <i className="ri-arrow-left-line" />
            {t('supplierFlow.back_to_requests')}
          </Link>
          <StatusBadge status={request.status} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Colonne gauche : la demande */}
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="mb-1 text-xs text-gray-500">
                {t('supplierFlow.request_date', {
                  date: formatDateTime(request.createdAt),
                })}
              </p>
              <h1 className="mb-4 text-xl font-bold text-gray-900">
                {request.description}
              </h1>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4">
                  <dt className="text-xs font-medium text-gray-500">
                    {t('purchase_request.quantity')}
                  </dt>
                  <dd className="mt-1 font-semibold text-gray-900">
                    {request.quantity} {request.unit}
                  </dd>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <dt className="text-xs font-medium text-gray-500">
                    {t('purchase_request.whatsapp')}
                  </dt>
                  <dd className="mt-1 font-semibold text-gray-900">
                    {request.whatsapp}
                  </dd>
                </div>
              </dl>

              {request.attachment && (
                <div className="mt-6">
                  <p className="mb-2 text-xs font-medium text-gray-500">
                    {t('supplierFlow.attachment')}
                  </p>
                  <AttachmentThumb
                    url={request.attachment}
                    name={request.description}
                    size="lg"
                    openLabel={t('supplierFlow.open_attachment')}
                  />
                </div>
              )}
            </section>

            {/* Devis reçus (propriétaire) */}
            {isOwner && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <i className="ri-file-list-3-line text-green-600" />
                  {t('supplierFlow.quotes_received_title')}
                </h2>

                {quotes.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                    {t('supplierFlow.no_quotes_received')}
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {quotes.map((quote: Quote) => (
                      <QuoteCard key={quote._id} quote={quote} />
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          {/* Colonne droite : action selon le rôle */}
          <div className="space-y-6">
            {isOwner ? (
              <section className="rounded-2xl border border-green-200 bg-green-50 p-6">
                <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-green-800">
                  <i className="ri-user-star-line" />
                  {t('supplierFlow.owner_panel_title')}
                </h2>
                <p className="text-sm text-green-700">
                  {t('supplierFlow.owner_panel_desc')}
                </p>
              </section>
            ) : isSupplier ? (
              <QuoteForm
                requestId={request._id}
                profiles={myProfiles ?? []}
                alreadyQuotedProfileIds={myQuotes.map((quote: Quote) => quote.supplierId)}
              />
            ) : (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                {t('supplierFlow.not_owner_info')}
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function QuoteCard({ quote }: { quote: Quote }) {
  const { t } = useTranslation();
  const { formatDateTime } = useFormatDate();

  return (
    <li className="rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-medium text-gray-900">
            {quote.supplier ? (
              <Link
                to={`/supplier/${quote.supplier._id}`}
                className="hover:text-green-700"
              >
                {quote.supplier.business_name}
              </Link>
            ) : (
              quote.supplierName
            )}
            {quote.supplier?.verified && (
              <i
                className="ri-verified-badge-fill text-green-600"
                title={t('status.verified')}
              />
            )}
          </p>
          {quote.supplier && (
            <p className="text-xs text-gray-500">
              {quote.supplier.city}, {quote.supplier.state}
            </p>
          )}
        </div>
        <p className="text-xs text-gray-400">{formatDateTime(quote.createdAt)}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <p className="font-semibold text-gray-900">
          <i className="ri-money-dollar-circle-line mr-1 text-green-600" />
          {quote.price.toLocaleString()} {quote.currency}
        </p>
        <p className="text-gray-700">
          <i className="ri-truck-line mr-1 text-gray-400" />
          {quote.deliveryTime}
        </p>
      </div>

      {quote.message && (
        <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          {quote.message}
        </p>
      )}
    </li>
  );
}

function QuoteForm({
  requestId,
  profiles,
  alreadyQuotedProfileIds,
}: {
  requestId: Id<'purchaseRequests'>;
  profiles: SupplierProfile[];
  alreadyQuotedProfileIds: Id<'suppliers'>[];
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const submitQuoteMutation = useMutation(api.purchaseRequests.submitQuote);

  const [selectedProfileId, setSelectedProfileId] = useState<Id<'suppliers'> | null>(
    profiles[0]?._id ?? null
  );
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectableProfiles = profiles.filter(
    (profile) => !alreadyQuotedProfileIds.includes(profile._id)
  );
  const quotedProfiles = profiles.filter((profile) =>
    alreadyQuotedProfileIds.includes(profile._id)
  );

  // Les profils arrivent de façon asynchrone : on sélectionne le premier
  // profil disponible dès qu'ils sont chargés.
  useEffect(() => {
    if (!selectedProfileId && selectableProfiles.length > 0) {
      setSelectedProfileId(selectableProfiles[0]._id);
    }
  }, [selectedProfileId, selectableProfiles]);

  if (profiles.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-2 text-base font-semibold text-gray-900">
          {t('supplierFlow.quote_form_title')}
        </h2>
        <p className="text-sm text-gray-500">{t('supplierFlow.no_supplier_profile')}</p>
      </section>
    );
  }

  if (selectableProfiles.length === 0) {
    return (
      <section className="rounded-2xl border border-green-200 bg-green-50 p-6">
        <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-green-800">
          <i className="ri-check-double-line" />
          {t('supplierFlow.quote_submitted_title')}
        </h2>
        <p className="text-sm text-green-700">{t('supplierFlow.quote_already_submitted_all')}</p>
      </section>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceValue = Number(price);
    if (!selectedProfileId) {
      setError(t('supplierFlow.quote_profile_required'));
      return;
    }
    if (!price.trim() || Number.isNaN(priceValue) || priceValue <= 0) {
      setError(t('supplierFlow.quote_price_invalid'));
      return;
    }
    if (!deliveryTime.trim()) {
      setError(t('supplierFlow.quote_delivery_required'));
      return;
    }

    setSubmitting(true);
    try {
      await submitQuoteMutation({
        requestId,
        supplierId: selectedProfileId,
        price: priceValue,
        currency,
        deliveryTime: deliveryTime.trim(),
        message: message.trim(),
      });
      setSubmitted(true);
      await queryClient.invalidateQueries({
        queryKey: ['supplierFlow/getPurchaseRequestDetail'],
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('supplierFlow.quote_submit_error')
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="rounded-2xl border border-green-200 bg-green-50 p-6">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <i className="ri-check-line text-2xl text-green-600" />
        </div>
        <h2 className="mb-1 text-base font-semibold text-green-800">
          {t('supplierFlow.quote_submitted_title')}
        </h2>
        <p className="text-sm text-green-700">{t('supplierFlow.quote_submitted_desc')}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-900">
        <i className="ri-send-plane-2-line text-green-600" />
        {t('supplierFlow.quote_form_title')}
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        {t('supplierFlow.quote_form_desc')}
      </p>

      {quotedProfiles.length > 0 && (
        <p className="mb-4 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
          <i className="ri-information-line mr-1" />
          {t('supplierFlow.quote_already_submitted')}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {selectableProfiles.length > 1 && (
          <div>
            <label
              htmlFor="quote-supplier-profile"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('supplierFlow.quote_supplier_profile')}
            </label>
            <select
              id="quote-supplier-profile"
              value={selectedProfileId ?? ''}
              onChange={(e) => setSelectedProfileId(e.target.value as Id<'suppliers'>)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {selectableProfiles.map((profile) => (
                <option key={profile._id} value={profile._id}>
                  {profile.business_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="quote-price"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('supplierFlow.quote_price')}
            </label>
            <input
              id="quote-price"
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div>
            <label
              htmlFor="quote-currency"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('supplierFlow.quote_currency')}
            </label>
            <select
              id="quote-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="quote-delivery"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('supplierFlow.quote_delivery_time')}
          </label>
          <input
            id="quote-delivery"
            type="text"
            value={deliveryTime}
            onChange={(e) => setDeliveryTime(e.target.value)}
            placeholder={t('supplierFlow.quote_delivery_placeholder')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div>
          <label
            htmlFor="quote-message"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('supplierFlow.quote_message')}
          </label>
          <textarea
            id="quote-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('supplierFlow.quote_message_placeholder')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 font-semibold text-white transition-all hover:from-green-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <>
              <i className="ri-loader-4-line animate-spin" />
              {t('supplierFlow.quote_submitting')}
            </>
          ) : (
            <>
              <i className="ri-send-plane-2-line" />
              {t('supplierFlow.quote_submit')}
            </>
          )}
        </button>
      </form>
    </section>
  );
}
