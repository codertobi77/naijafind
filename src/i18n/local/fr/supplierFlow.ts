export const supplierFlow = {
  // Page liste /dashboard/purchase-requests
  "supplierFlow.list_title": "Demandes d'achat",
  "supplierFlow.list_subtitle_supplier":
    "Parcourez les demandes ouvertes et soumettez vos devis, ou suivez vos propres demandes.",
  "supplierFlow.list_subtitle_buyer":
    "Suivez vos demandes d'achat et les devis reçus des fournisseurs.",
  "supplierFlow.open_requests_title": "Demandes ouvertes",
  "supplierFlow.my_requests_title": "Mes demandes",
  "supplierFlow.no_open_requests":
    "Aucune demande ouverte pour le moment. Revenez bientôt !",
  "supplierFlow.no_requests": "Vous n'avez pas encore de demande d'achat",
  "supplierFlow.no_requests_hint":
    "Publiez une demande depuis la page « Demande d'achat » pour recevoir des offres de fournisseurs.",
  "supplierFlow.view_request": "Voir le détail",
  "supplierFlow.quotes_count_one": "{{count}} devis reçu",
  "supplierFlow.quotes_count_other": "{{count}} devis reçus",
  "supplierFlow.delete_error": "Erreur lors de la suppression de la demande",
  "supplierFlow.open_attachment": "Ouvrir la pièce jointe",

  // Statuts d'une demande d'achat
  "supplierFlow.status_pending": "En attente",
  "supplierFlow.status_contacted": "Contacté",
  "supplierFlow.status_quoted": "Devis reçu",
  "supplierFlow.status_completed": "Complété",
  "supplierFlow.status_cancelled": "Annulé",

  // Page détail /dashboard/purchase-requests/:requestId
  "supplierFlow.request_not_found": "Demande introuvable",
  "supplierFlow.request_not_found_desc":
    "Cette demande d'achat n'existe pas ou a été supprimée.",
  "supplierFlow.back_to_requests": "Retour aux demandes",
  "supplierFlow.request_date": "Publiée le {{date}}",
  "supplierFlow.attachment": "Pièce jointe",

  // Devis reçus (vue propriétaire)
  "supplierFlow.quotes_received_title": "Devis reçus",
  "supplierFlow.no_quotes_received":
    "Aucun devis reçu pour le moment. Les fournisseurs notifiés vous répondront bientôt.",
  "supplierFlow.owner_panel_title": "Votre demande",
  "supplierFlow.owner_panel_desc":
    "Vous êtes le propriétaire de cette demande. Les devis des fournisseurs apparaîtront ici dès qu'ils répondront.",
  "supplierFlow.not_owner_info":
    "Cette demande a été publiée par un autre utilisateur. Vous pouvez la consulter mais seuls les fournisseurs peuvent y répondre.",

  // Formulaire de devis (vue fournisseur)
  "supplierFlow.quote_form_title": "Soumettre un devis",
  "supplierFlow.quote_form_desc":
    "Décrivez votre offre pour cette demande. L'acheteur sera notifié immédiatement.",
  "supplierFlow.quote_supplier_profile": "Profil fournisseur",
  "supplierFlow.quote_price": "Prix",
  "supplierFlow.quote_currency": "Devise",
  "supplierFlow.quote_delivery_time": "Délai de livraison",
  "supplierFlow.quote_delivery_placeholder": "Ex : 3-5 jours",
  "supplierFlow.quote_message": "Message",
  "supplierFlow.quote_message_placeholder":
    "Précisez les conditions, la disponibilité, la qualité…",
  "supplierFlow.quote_submit": "Envoyer mon devis",
  "supplierFlow.quote_submitting": "Envoi en cours…",
  "supplierFlow.quote_submitted_title": "Devis envoyé !",
  "supplierFlow.quote_submitted_desc":
    "Votre devis a été envoyé à l'acheteur, qui a été notifié.",
  "supplierFlow.quote_submit_error": "Erreur lors de l'envoi du devis",
  "supplierFlow.quote_profile_required": "Veuillez sélectionner un profil fournisseur",
  "supplierFlow.quote_price_invalid": "Le prix doit être supérieur à 0",
  "supplierFlow.quote_delivery_required": "Le délai de livraison est requis",
  "supplierFlow.quote_already_submitted":
    "Vous avez déjà envoyé un devis pour cette demande avec certains de vos profils.",
  "supplierFlow.quote_already_submitted_all":
    "Vous avez déjà envoyé un devis pour cette demande avec tous vos profils fournisseurs.",
  "supplierFlow.no_supplier_profile":
    "Vous devez avoir un profil fournisseur approuvé pour soumettre un devis.",
};

export default supplierFlow;
