// ==========================================
// NOTIFICATIONS — visuels par type (module partagé)
// ==========================================
// Source unique des icônes et couleurs par type de notification, partagée
// entre NotificationDropdown (header, dashboard, admin) et la page
// /notifications. Maps typées « au mieux » : le schéma Convex stocke `type`
// en string libre, on indexe donc par string avec un fallback visuel pour
// tout type imprévu.

import type { NotificationType } from '../hooks/useNotifications';

const notificationIcons: Record<string, string> = {
  order: 'ri-shopping-cart-line',
  review: 'ri-star-line',
  message: 'ri-mail-line',
  system: 'ri-information-line',
  verification: 'ri-shield-check-line',
  approval: 'ri-check-double-line',
  purchase_request: 'ri-file-list-3-line',
  purchase_request_update: 'ri-file-edit-line',
  new_quote: 'ri-price-tag-3-line',
  payment_success: 'ri-money-dollar-circle-line',
  subscription_expired: 'ri-alarm-warning-line',
  contact_request: 'ri-user-add-line',
};

const notificationColors: Record<string, string> = {
  order: 'bg-blue-100 text-blue-600',
  review: 'bg-yellow-100 text-yellow-600',
  message: 'bg-green-100 text-green-600',
  system: 'bg-gray-100 text-gray-600',
  verification: 'bg-purple-100 text-purple-600',
  approval: 'bg-green-100 text-green-600',
  purchase_request: 'bg-blue-100 text-blue-600',
  purchase_request_update: 'bg-indigo-100 text-indigo-600',
  new_quote: 'bg-emerald-100 text-emerald-600',
  payment_success: 'bg-green-100 text-green-600',
  subscription_expired: 'bg-orange-100 text-orange-600',
  contact_request: 'bg-teal-100 text-teal-600',
};

const FALLBACK_ICON = 'ri-notification-3-line';
const FALLBACK_COLOR = 'bg-gray-100 text-gray-600';

export function iconFor(type: NotificationType | string): string {
  return notificationIcons[type] ?? FALLBACK_ICON;
}

export function colorFor(type: NotificationType | string): string {
  return notificationColors[type] ?? FALLBACK_COLOR;
}
