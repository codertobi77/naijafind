import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConvexAuth } from 'convex/react';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/base';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification } from '../../hooks/useNotifications';
// Icônes/couleurs par type : source unique partagée avec NotificationDropdown
import { iconFor, colorFor } from '../../lib/notificationVisuals';

/**
 * Page « Toutes les notifications » (/notifications) :
 * liste complète paginée (« Charger plus »), tout marquer comme lu,
 * suppression individuelle, navigation vers l'action associée.
 *
 * La lecture se fait via le hook useNotifications (getNotifications) ;
 * le backend borne `limit` à 200 — au-delà, le bouton « Charger plus »
 * disparaît (les plus anciennes restent visibles dans le dashboard Convex).
 */
const PAGE_SIZE = 50;
const MAX_LIMIT = 200;

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const [limit, setLimit] = useState(PAGE_SIZE);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(limit);

  const canLoadMore = !loading && notifications.length === limit && limit < MAX_LIMIT;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      void markAsRead(notification._id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const formatTime = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.just_now');
    if (diffMins < 60) return t('notifications.minutes_ago', { count: diffMins });
    if (diffHours < 24) return t('notifications.hours_ago', { count: diffHours });
    if (diffDays === 1) return t('notifications.yesterday');
    return t('notifications.days_ago', { count: diffDays });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('notifications.page_title')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {t('notifications.page_subtitle')}
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <i className="ri-arrow-left-line" />
            {t('notifications.back_dashboard')}
          </Link>
        </div>

        {authLoading || loading ? (
          <div className="flex h-64 items-center justify-center">
            <i className="ri-loader-4-line animate-spin text-3xl text-green-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-16 text-center">
            <div className="mb-3 rounded-full bg-gray-100 p-3">
              <i className="ri-notification-off-line text-3xl text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-900">
              {t('notifications.empty_title')}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {t('notifications.empty_message')}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                {t('notifications.unread_count', { count: unreadCount })}
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-green-600 transition-colors hover:bg-green-50"
                >
                  {t('notifications.mark_all_read')}
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`group flex items-start gap-4 p-4 transition-colors hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="flex flex-1 items-start gap-4 text-left"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorFor(
                        notification.type
                      )}`}
                    >
                      <i className={`${iconFor(notification.type)} text-lg`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="line-clamp-1 text-sm font-medium text-gray-900">
                          {notification.title}
                        </span>
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatTime(notification.createdAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </span>
                      {notification.actionUrl && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          {t('notifications.view_details')}
                          <i className="ri-arrow-right-line" />
                        </span>
                      )}
                    </span>
                  </button>

                  <div className="flex flex-col items-center gap-2">
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden />
                    )}
                    <button
                      type="button"
                      onClick={() => void deleteNotification(notification._id)}
                      className="rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label={t('btn.delete')}
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {canLoadMore && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setLimit((prev) => Math.min(prev + PAGE_SIZE, MAX_LIMIT))}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <i className="ri-add-line" />
                  {t('notifications.load_more')}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
