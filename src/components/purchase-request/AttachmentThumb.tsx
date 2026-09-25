import { getAttachmentKind } from '../../lib/cloudinary';

/**
 * Vignette compacte et type-aware pour une pièce jointe de demande d'achat
 * (aperçu image, ou icône vidéo/document ouvrant dans un nouvel onglet).
 *
 * Copie du composant homonyme de src/pages/dashboard/page.tsx (non exporté
 * là-bas) : on n'ajoute qu'une prop `size` et un libellé d'icône accessible.
 */
export function AttachmentThumb({
  url,
  name,
  size = 'sm',
  openLabel,
}: {
  url: string;
  name?: string;
  size?: 'sm' | 'lg';
  /** Libellé localisé pour l'accessibilité (aria-label du lien). */
  openLabel?: string;
}) {
  const kind = getAttachmentKind(url);
  const dimension = size === 'lg' ? 'h-40 w-40' : 'h-16 w-16';

  if (kind === 'image') {
    return (
      <img
        src={url}
        alt={name || ''}
        className={`${dimension} rounded-lg object-cover`}
      />
    );
  }

  const icon =
    kind === 'video' ? (
      <i className="ri-video-line text-2xl" />
    ) : (
      <i className="ri-file-text-line text-2xl" />
    );

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={name}
      aria-label={openLabel || name || undefined}
      className={`flex ${dimension} items-center justify-center rounded-lg ${
        kind === 'video'
          ? 'bg-green-50 text-green-600 hover:bg-green-100'
          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
      }`}
    >
      {icon}
    </a>
  );
}

export default AttachmentThumb;
