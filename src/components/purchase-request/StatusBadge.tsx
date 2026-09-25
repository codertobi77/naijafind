import { useTranslation } from 'react-i18next';

/**
 * Badge de statut d'une demande d'achat.
 * NB : appels t() littéraux via une table de correspondance — ne pas passer
 * une clé dynamique à t() (cf. commentaire dans src/pages/purchase-request/page.tsx).
 */
export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    contacted: 'bg-blue-100 text-blue-800',
    quoted: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const labelKeys: Record<string, () => string> = {
    pending: () => t('supplierFlow.status_pending'),
    contacted: () => t('supplierFlow.status_contacted'),
    quoted: () => t('supplierFlow.status_quoted'),
    completed: () => t('supplierFlow.status_completed'),
    cancelled: () => t('supplierFlow.status_cancelled'),
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        styles[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {labelKeys[status]?.() ?? status}
    </span>
  );
}

export default StatusBadge;
