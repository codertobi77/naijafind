import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Notification } from '../../hooks/useNotifications';
import type { Id } from '@convex/_generated/dataModel';
// Icônes/couleurs par type : source unique partagée avec la page /notifications
import { iconFor, colorFor } from '../../lib/notificationVisuals';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onMarkRead: (id: Id<'notifications'>) => void;
  onMarkAllRead: () => void;
  onDelete: (id: Id<'notifications'>) => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}: NotificationDropdownProps) {
  const { t } = useTranslation();
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

    if (diffMins < 1) return t('notifications.just_now');
    if (diffMins < 60) return t('notifications.minutes_ago', { count: diffMins });
    if (diffHours < 24) return t('notifications.hours_ago', { count: diffHours });
    if (diffDays === 1) return t('notifications.yesterday');
    return t('notifications.days_ago', { count: diffDays });
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
        aria-label={t('notifications.title')}
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
              <h3 className="font-semibold text-gray-900">{t('notifications.title')}</h3>
              <p className="text-xs text-gray-500">
                {unreadCount > 0
                  ? t('notifications.unread_count', { count: unreadCount })
                  : t('notifications.none_unread')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors"
                >
                  {t('notifications.mark_all_read')}
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
                <p className="text-sm font-medium text-gray-900">{t('notifications.empty_title')}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t('notifications.dropdown_empty')}
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
                        aria-label={t('btn.delete')}
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
                {t('notifications.view_all')}
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
