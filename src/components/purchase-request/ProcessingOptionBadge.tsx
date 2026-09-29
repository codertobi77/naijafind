import { useTranslation } from 'react-i18next';

/**
 * Badge de l'option de traitement d'une demande d'achat.
 * Seule Xpress est mise en avant (payante, 48-72h) : Normal est le défaut
 * discret. Les demandes antérieures (sans processingOption) n'affichent rien.
 * NB : clé littérale — ne pas passer une clé dynamique à t() (cf. StatusBadge).
 */
export function ProcessingOptionBadge({ option }: { option: string | undefined }) {
  const { t } = useTranslation();

  if (option !== 'xpress') {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
      <i className="ri-flashlight-line" />
      {t('supplierFlow.processing_xpress_badge')}
    </span>
  );
}

export default ProcessingOptionBadge;
