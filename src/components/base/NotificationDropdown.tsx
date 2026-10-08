import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Notification, NotificationType } from '../../hooks/useNotifications';
import type { Id } from '@convex/_generated/dataModel';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onMarkRead: (id: Id<'notifications'>) => void;
  onMarkAllRead: () => void;
  onDelete: (id: Id<'notifications'>) => void;
}

// Maps typées « au mieux » : le schéma Convex stocke `type` en string libre,
// on indexe donc par string avec un fallback visuel pour tout type imprévu.
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

const iconFor = (type: NotificationType | string) => notificationIcons[type] ?? FALLBACK_ICON;
const colorFor = (type: NotificationType | string) => notificationColors[type] ?? FALLBACK_COLOR;

export function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} jours`;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkRead(notification._id);
    }
    if (notification.actionUrl) {
      // Navigation SPA (recharge complète avant : window.location.href)
      navigate(notification.actionUrl);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <i className="ri-notification-line text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">
                {unreadCount > 0
                  ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                  : 'Aucune notification non lue'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors"
                >
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="mb-3 rounded-full bg-gray-100 p-3">
                  <i className="ri-notification-off-line text-2xl text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">Aucune notification</p>
                <p className="text-xs text-gray-500 mt-1">
                  Vous n\'avez pas encore de notifications
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`group relative flex items-start gap-3 p-4 transition-colors hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        colorFor(notification.type)
                      }`}
                    >
                      <i className={`${iconFor(notification.type)} text-lg`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>

                    {/* Unread indicator & Actions */}
                    <div className="flex flex-col items-center gap-2">
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(notification._id);
                        }}
                        className="rounded p-1 text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        aria-label="Supprimer"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="flex w-full items-center justify-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
              >
                Voir toutes les notifications
                <i className="ri-arrow-right-line" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
