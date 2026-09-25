import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConvexAuth, useMutation } from 'convex/react';
import type { Id } from '@convex/_generated/dataModel';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@convex/_generated/api';
import { useConvexQuery } from '../../../../hooks/useConvexQuery';
import { Header } from '../../../../components/base';
import AttachmentThumb from '../../../../components/purchase-request/AttachmentThumb';
import StatusBadge from '../../../../components/purchase-request/StatusBadge';
import useFormatDate from '../../../../hooks/useFormatDate';
import type { MyPurchaseRequest, OpenPurchaseRequest } from '@convex/supplierFlow';

/**
 * Page « Demandes d'achat » du dashboard, rôle-adaptée :
 * - fournisseur : demandes ouvertes (status pending) auxquelles répondre,
 *   puis ses propres demandes ;
 * - acheteur : ses demandes avec leur statut et le nombre de devis reçus.
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

  const handleDelete = async (requestId: Id<'purchaseRequests'>) => {
    try {
      await deletePurchaseRequestMutation({ id: requestId });
      setDeletingRequestId(null);
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
            {deleteError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {deleteError}
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
                      <RequestCard key={request._id} request={request} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Mes demandes (acheteur ET fournisseur) */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('supplierFlow.my_requests_title')}
                </h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                  {myRequests?.length ?? 0}
                </span>
              </div>

              {(myRequests?.length ?? 0) === 0 ? (
                <EmptyState
                  icon="ri-shopping-cart-line"
                  message={t('supplierFlow.no_requests')}
                  hint={t('supplierFlow.no_requests_hint')}
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {(myRequests ?? []).map((request: MyPurchaseRequest) => (
                    <RequestCard
                      key={request._id}
                      request={request}
                      quotesCount={request.quotesCount}
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
            </section>
          </div>
        )}
      </main>
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

function RequestCard({
  request,
  quotesCount,
  onDelete,
}: {
  request: MyPurchaseRequest | OpenPurchaseRequest;
  quotesCount?: number;
  onDelete?: ReactNode;
}) {
  const { t } = useTranslation();
  const { formatShortDate } = useFormatDate();
  const attachmentUrl = request.attachment || undefined;

  return (
    <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-3">
            <StatusBadge status={request.status} />
            <span className="text-xs text-gray-500">
              {formatShortDate(request.createdAt)}
            </span>
          </div>
          <p className="mb-1 line-clamp-2 font-medium text-gray-900">
            {request.description}
          </p>
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
