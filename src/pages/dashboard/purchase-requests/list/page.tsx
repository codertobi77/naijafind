import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConvexAuth, useAction, useMutation } from 'convex/react';
import type { Id } from '@convex/_generated/dataModel';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@convex/_generated/api';
import { useConvexQuery } from '../../../../hooks/useConvexQuery';
import { Header } from '../../../../components/base';
import AttachmentThumb from '../../../../components/purchase-request/AttachmentThumb';
import StatusBadge from '../../../../components/purchase-request/StatusBadge';
import ProcessingOptionBadge from '../../../../components/purchase-request/ProcessingOptionBadge';
import useFormatDate from '../../../../hooks/useFormatDate';
import type { MyPurchaseRequest, OpenPurchaseRequest } from '@convex/supplierFlow';

// Statuts d'une demande d'achat (filtre du dashboard). 'all' = pas de filtre.
const STATUS_FILTERS = ['all', 'pending', 'contacted', 'quoted', 'completed', 'cancelled'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

/**
 * Page « Demandes d'achat » du dashboard, rôle-adaptée :
 * - fournisseur : demandes ouvertes (status pending) auxquelles répondre,
 *   puis ses propres demandes ;
 * - acheteur : ses demandes avec leur statut et le nombre de devis reçus.
 *
 * « Mes demandes » : N° de suivi affiché sur chaque carte, description
 * complète lisible dans une modal, filtre par statut et suppression
 * multiple (devis et pièces jointes associés inclus).
 */
export default function DashboardPurchaseRequestsListPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const { data: meData } = useConvexQuery(api.users.me, {}, { staleTime: 2 * 60 * 1000 });
  const isSupplier = meData?.user?.user_type === 'supplier';

  const { data: openRequests, isLoading: openLoading } = useConvexQuery(
    api.supplierFlow.getOpenPurchaseRequests,
    { limit: 50 },
    { staleTime: 60 * 1000 }
  );
  const { data: myRequests, isLoading: myLoading } = useConvexQuery(
    api.supplierFlow.getMyPurchaseRequests,
    { limit: 50 },
    { staleTime: 60 * 1000 }
  );

  const deletePurchaseRequestMutation = useMutation(api.purchaseRequests.deletePurchaseRequest);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filtre par statut + sélection multiple (« Mes demandes »)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkSuccessCount, setBulkSuccessCount] = useState<number | null>(null);

  // Description complète affichée dans une modal (mes demandes ET demandes ouvertes)
  const [expandedRequest, setExpandedRequest] = useState<
    MyPurchaseRequest | OpenPurchaseRequest | null
  >(null);

  // Demandes de l'utilisateur filtrées par statut (côté client).
  const filteredRequests = (myRequests ?? []).filter(
    (request: MyPurchaseRequest) =>
      statusFilter === 'all' || request.status === statusFilter
  );

  const allFilteredSelected =
    filteredRequests.length > 0 &&
    filteredRequests.every((request: MyPurchaseRequest) => selectedIds.has(request._id));

  const statusLabel = (status: StatusFilter): string => {
    switch (status) {
      case 'all': return t('supplierFlow.filter_all');
      case 'pending': return t('supplierFlow.status_pending');
      case 'contacted': return t('supplierFlow.status_contacted');
      case 'quoted': return t('supplierFlow.status_quoted');
      case 'completed': return t('supplierFlow.status_completed');
      case 'cancelled': return t('supplierFlow.status_cancelled');
    }
  };

  const handleFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setConfirmBulkDelete(false);
    // Retirer de la sélection les demandes qui ne sont plus visibles :
    // la suppression groupée ne doit porter que sur des demandes affichées.
    const visibleIds = new Set(
      (myRequests ?? [])
        .filter((request: MyPurchaseRequest) => value === 'all' || request.status === value)
        .map((request: MyPurchaseRequest) => request._id as string)
    );
    setSelectedIds((prev) => new Set([...prev].filter((id) => visibleIds.has(id))));
  };

  const toggleSelect = (id: string) => {
    setConfirmBulkDelete(false);
    setBulkSuccessCount(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setConfirmBulkDelete(false);
    setBulkSuccessCount(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (filteredRequests.every((request: MyPurchaseRequest) => next.has(request._id))) {
        filteredRequests.forEach((request: MyPurchaseRequest) => next.delete(request._id));
      } else {
        filteredRequests.forEach((request: MyPurchaseRequest) => next.add(request._id));
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    setDeleteError(null);
    let deleted = 0;
    let lastError: unknown = null;
    for (const id of selectedIds) {
      try {
        await deletePurchaseRequestMutation({ id: id as Id<'purchaseRequests'> });
        deleted++;
      } catch (err) {
        console.error('Failed to delete purchase request:', err);
        lastError = err;
      }
    }
    setIsBulkDeleting(false);
    setConfirmBulkDelete(false);
    if (deleted > 0) {
      setBulkSuccessCount(deleted);
    }
    if (lastError) {
      setDeleteError(
        lastError instanceof Error
          ? lastError.message
          : t('supplierFlow.delete_error')
      );
    }
    setSelectedIds(new Set());
    await queryClient.invalidateQueries({
      queryKey: ['supplierFlow/getMyPurchaseRequests'],
    });
  };

  const handleDelete = async (requestId: Id<'purchaseRequests'>) => {
    try {
      await deletePurchaseRequestMutation({ id: requestId });
      setDeletingRequestId(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
      await queryClient.invalidateQueries({
        queryKey: ['supplierFlow/getMyPurchaseRequests'],
      });
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : t('supplierFlow.delete_error')
      );
      setDeletingRequestId(null);
    }
  };

  const initializeXpressPayment = useAction(api.payments.initializeXpressPayment);
  const [xpressUpgradingId, setXpressUpgradingId] = useState<string | null>(null);
  const [xpressError, setXpressError] = useState<string | null>(null);

  // Passer une de SES demandes en Xpress (15 000 XOF) : redirection vers le
  // checkout Moneroo ; la demande passe en Xpress après paiement confirmé.
  const handleXpressUpgrade = async (requestId: Id<'purchaseRequests'>) => {
    const email = meData?.user?.email;
    if (!email) {
      setXpressError(t('supplierFlow.xpress_upgrade_no_email'));
      return;
    }
    setXpressUpgradingId(requestId);
    setXpressError(null);
    try {
      const result = await initializeXpressPayment({
        requestId,
        customerEmail: email,
      });
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      throw new Error('checkoutUrl manquant');
    } catch (err) {
      console.error('Xpress upgrade failed:', err);
      setXpressError(
        err instanceof Error && err.message
          ? err.message
          : t('supplierFlow.xpress_upgrade_error')
      );
      setXpressUpgradingId(null);
    }
  };

  const loading = authLoading || myLoading || (isSupplier && openLoading);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {/* Titre de page */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('supplierFlow.list_title')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isSupplier
                ? t('supplierFlow.list_subtitle_supplier')
                : t('supplierFlow.list_subtitle_buyer')}
            </p>
          </div>
          <Link
            to={isSupplier ? '/dashboard' : '/'}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <i className="ri-arrow-left-line" />
            {isSupplier ? t('nav.dashboard') : t('common.return_home')}
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <i className="ri-loader-4-line animate-spin text-3xl text-green-600" />
          </div>
        ) : (
          <div className="space-y-10">
            {(deleteError || xpressError) && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {deleteError ?? xpressError}
              </div>
            )}

            {bulkSuccessCount != null && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {t('supplierFlow.bulk_delete_success', { nb: bulkSuccessCount })}
              </div>
            )}

            {/* Demandes ouvertes (vue fournisseur) */}
            {isSupplier && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('supplierFlow.open_requests_title')}
                  </h2>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                    {openRequests?.length ?? 0}
                  </span>
                </div>

                {(openRequests?.length ?? 0) === 0 ? (
                  <EmptyState
                    icon="ri-inbox-archive-line"
                    message={t('supplierFlow.no_open_requests')}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {(openRequests ?? []).map((request: OpenPurchaseRequest) => (
                      <RequestCard
                        key={request._id}
                        request={request}
                        onExpandDescription={setExpandedRequest}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Mes demandes (acheteur ET fournisseur) */}
            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('supplierFlow.my_requests_title')}
                  </h2>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                    {filteredRequests.length}
                  </span>
                </div>

                {(myRequests?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="status-filter"
                      className="text-xs font-medium text-gray-500"
                    >
                      {t('supplierFlow.filter_by_status')}
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => handleFilterChange(e.target.value as StatusFilter)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500"
                    >
                      {STATUS_FILTERS.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {(myRequests?.length ?? 0) === 0 ? (
                <EmptyState
                  icon="ri-shopping-cart-line"
                  message={t('supplierFlow.no_requests')}
                  hint={t('supplierFlow.no_requests_hint')}
                />
              ) : (
                <>
                  {/* Barre d'outils : tout sélectionner + suppression groupée */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        disabled={filteredRequests.length === 0}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      {t('supplierFlow.select_all')}
                    </label>
                    {selectedIds.size > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">
                          {t('supplierFlow.selected_count', { nb: selectedIds.size })}
                        </span>
                        <button
                          onClick={() => setSelectedIds(new Set())}
                          disabled={isBulkDeleting}
                          className="rounded-lg px-3 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
                        >
                          {t('supplierFlow.clear_selection')}
                        </button>
                        <button
                          onClick={() => setConfirmBulkDelete(true)}
                          disabled={isBulkDeleting}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        >
                          <i className="ri-delete-bin-line" />
                          {t('supplierFlow.delete_selected')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Confirmation de la suppression groupée */}
                  {confirmBulkDelete && (
                    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-red-700">
                        {t('supplierFlow.delete_selected_confirm', { nb: selectedIds.size })}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void handleBulkDelete()}
                          disabled={isBulkDeleting}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
                        >
                          {isBulkDeleting && <i className="ri-loader-4-line animate-spin" />}
                          {isBulkDeleting
                            ? t('supplierFlow.bulk_deleting')
                            : t('supplierFlow.delete_selected_confirm_yes')}
                        </button>
                        <button
                          onClick={() => setConfirmBulkDelete(false)}
                          disabled={isBulkDeleting}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        >
                          {t('btn.no')}
                        </button>
                      </div>
                    </div>
                  )}

                  {filteredRequests.length === 0 ? (
                    <EmptyState
                      icon="ri-filter-3-line"
                      message={t('supplierFlow.no_matching_filter')}
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {filteredRequests.map((request: MyPurchaseRequest) => (
                        <RequestCard
                          key={request._id}
                          request={request}
                          quotesCount={request.quotesCount}
                          selectable
                          isSelected={selectedIds.has(request._id)}
                          onToggleSelect={toggleSelect}
                          onExpandDescription={setExpandedRequest}
                          onUpgradeXpress={
                            request.processingOption === 'normal' ? (
                              <button
                                onClick={() => void handleXpressUpgrade(request._id)}
                                disabled={xpressUpgradingId === request._id}
                                className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:from-amber-600 hover:to-orange-600 disabled:opacity-70"
                              >
                                <i
                                  className={
                                    xpressUpgradingId === request._id
                                      ? 'ri-loader-4-line animate-spin'
                                      : 'ri-flashlight-line'
                                  }
                                />
                                {xpressUpgradingId === request._id
                                  ? t('supplierFlow.xpress_upgrade_success')
                                  : t('supplierFlow.xpress_upgrade_button')}
                              </button>
                            ) : undefined
                          }
                          onDelete={
                            deletingRequestId === request._id ? (
                              <span className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDelete(request._id)}
                                  className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700"
                                >
                                  {t('btn.yes')}
                                </button>
                                <button
                                  onClick={() => setDeletingRequestId(null)}
                                  className="rounded-lg px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100"
                                >
                                  {t('btn.no')}
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() => setDeletingRequestId(request._id)}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                              >
                                <i className="ri-delete-bin-line" />
                                {t('btn.delete')}
                              </button>
                            )
                          }
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Modal : description complète d'une demande */}
      {expandedRequest && (
        <DescriptionModal
          request={expandedRequest}
          onClose={() => setExpandedRequest(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ icon, message, hint }: { icon: string; message: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      <i className={`${icon} mb-3 text-4xl text-gray-300`} />
      <p className="text-gray-500">{message}</p>
      {hint && <p className="mt-1 text-sm text-gray-400">{hint}</p>}
    </div>
  );
}

/**
 * Modal compacte affichant le texte intégral de la description d'une demande
 * (la carte est tronquée à 2 lignes), avec son N° de suivi et son statut.
 */
function DescriptionModal({
  request,
  onClose,
}: {
  request: MyPurchaseRequest | OpenPurchaseRequest;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { formatShortDate } = useFormatDate();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('supplierFlow.description_title')}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">
              {t('supplierFlow.description_title')}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {request.requestNumber != null && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                  {t('supplierFlow.request_number_value', { number: request.requestNumber })}
                </span>
              )}
              <StatusBadge status={request.status} />
              <ProcessingOptionBadge option={request.processingOption} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label={t('btn.close')}
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">
          {request.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
          <span>
            <i className="ri-stack-line mr-1" />
            {request.quantity} {request.unit}
          </span>
          <span>{formatShortDate(request.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function RequestCard({
  request,
  quotesCount,
  onDelete,
  onUpgradeXpress,
  selectable,
  isSelected,
  onToggleSelect,
  onExpandDescription,
}: {
  request: MyPurchaseRequest | OpenPurchaseRequest;
  quotesCount?: number;
  onDelete?: ReactNode;
  onUpgradeXpress?: ReactNode;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onExpandDescription?: (request: MyPurchaseRequest | OpenPurchaseRequest) => void;
}) {
  const { t } = useTranslation();
  const { formatShortDate } = useFormatDate();
  const attachmentUrl = request.attachment || undefined;

  return (
    <article
      className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        isSelected ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Case à cocher de sélection (suppression groupée) */}
          {selectable && (
            <input
              type="checkbox"
              checked={isSelected ?? false}
              onChange={() => onToggleSelect?.(request._id)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500"
              aria-label={t('supplierFlow.select_one')}
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {request.requestNumber != null && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                  {t('supplierFlow.request_number_value', { number: request.requestNumber })}
                </span>
              )}
              <StatusBadge status={request.status} />
              <ProcessingOptionBadge option={request.processingOption} />
              <span className="text-xs text-gray-500">
                {formatShortDate(request.createdAt)}
              </span>
            </div>
            {/* Description tronquée : clic pour lire le texte intégral en modal */}
            <button
              type="button"
              onClick={() => onExpandDescription?.(request)}
              className="group mb-1 flex w-full items-start gap-1 text-left"
              title={t('supplierFlow.read_description')}
            >
              <p className="line-clamp-2 font-medium text-gray-900 group-hover:text-green-700">
                {request.description}
              </p>
              <i className="ri-fullscreen-line mt-0.5 shrink-0 text-gray-300 transition-colors group-hover:text-green-600" />
            </button>
            <p className="text-sm text-gray-600">
              <i className="ri-stack-line mr-1" />
              {request.quantity} {request.unit}
            </p>
            {request.whatsapp && (
              <p className="mt-1 text-sm text-gray-500">
                <i className="ri-whatsapp-line mr-1" />
                {request.whatsapp}
              </p>
            )}
          </div>
        </div>
        {attachmentUrl && (
          <AttachmentThumb
            url={attachmentUrl}
            name={request.description}
            openLabel={t('supplierFlow.open_attachment')}
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
        {quotesCount !== undefined ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
            <i className="ri-file-list-3-line" />
            {t('supplierFlow.quotes_count', { count: quotesCount })}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {onUpgradeXpress}
          {onDelete}
          <Link
            to={`/dashboard/purchase-requests/${request._id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            {t('supplierFlow.view_request')}
            <i className="ri-arrow-right-line" />
          </Link>
        </div>
      </div>
    </article>
  );
}
