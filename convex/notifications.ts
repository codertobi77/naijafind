import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

// Get all notifications for the current user
export const getNotifications = query({
  args: {
    limit: v.optional(v.number()),
    onlyUnread: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    let notifications;
    if (args.onlyUnread) {
      notifications = await ctx.db
        .query('notifications')
        .withIndex('userId_read', (q) => q.eq('userId', userId).eq('read', false))
        .order('desc')
        .take(args.limit ?? 50);
    } else {
      notifications = await ctx.db
        .query('notifications')
        .withIndex('userId', (q) => q.eq('userId', userId))
        .order('desc')
        .take(args.limit ?? 50);
    }

    return notifications;
  },
});

// Get unread notification count
export const getUnreadCount = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('userId_read', (q) => q.eq('userId', userId).eq('read', false))
      .collect();

    return notifications.length;
  },
});

// Create a notification (for internal use or admin)
export const createNotification = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.record(v.string(), v.any())),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error('Not authenticated');
    }

    // Check if user is admin or creating for themselves
    const currentUser = await ctx.db.get(currentUserId);
    if (currentUser?.userId !== args.userId && !currentUser?.is_admin) {
      throw new Error('Unauthorized to create notification for this user');
    }

    const notificationId = await ctx.db.insert('notifications', {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      read: false,
      actionUrl: args.actionUrl,
      createdAt: new Date().toISOString(),
    });

    return notificationId;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized to modify this notification');
    }

    await ctx.db.patch(args.notificationId, { read: true });
    return true;
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('userId_read', (q) => q.eq('userId', userId).eq('read', false))
      .collect();

    await Promise.all(
      notifications.map((n) => ctx.db.patch(n._id, { read: true }))
    );

    return notifications.length;
  },
});

// Delete notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Unauthorized to delete this notification');
    }

    await ctx.db.delete(args.notificationId);
    return true;
  },
});

// Auto-create notifications when events happen
export const createOrderNotification = mutation({
  args: {
    supplierUserId: v.string(),
    orderId: v.string(),
    orderNumber: v.string(),
    customerName: v.string(),
    totalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('notifications', {
      userId: args.supplierUserId,
      type: 'order',
      title: 'Nouvelle commande',
      message: `Commande ${args.orderNumber} de ${args.customerName} pour ₦${args.totalAmount.toLocaleString()}`,
      data: { orderId: args.orderId, orderNumber: args.orderNumber },
      read: false,
      actionUrl: `/dashboard?tab=orders`,
      createdAt: new Date().toISOString(),
    });
    return true;
  },
});

export const createReviewNotification = mutation({
  args: {
    supplierUserId: v.string(),
    reviewId: v.string(),
    reviewerName: v.string(),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('notifications', {
      userId: args.supplierUserId,
      type: 'review',
      title: 'Nouvel avis client',
      message: `${args.reviewerName} a laissé un avis de ${args.rating}/5 étoiles`,
      data: { reviewId: args.reviewId, rating: args.rating },
      read: false,
      actionUrl: `/dashboard?tab=reviews`,
      createdAt: new Date().toISOString(),
    });
    return true;
  },
});

export const createMessageNotification = mutation({
  args: {
    supplierUserId: v.string(),
    messageId: v.string(),
    senderName: v.string(),
    subject: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('notifications', {
      userId: args.supplierUserId,
      type: 'message',
      title: 'Nouveau message',
      message: `${args.senderName}: ${args.subject}`,
      data: { messageId: args.messageId },
      read: false,
      createdAt: new Date().toISOString(),
    });
    return true;
  },
});

// Admin: Send custom notification to any user
export const sendAdminNotification = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error('Not authenticated');
    }

    // Verify the current user is an admin
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser?.is_admin && currentUser?.user_type !== 'admin') {
      throw new Error('Unauthorized: Only admins can send notifications');
    }

    const notificationId = await ctx.db.insert('notifications', {
      userId: args.userId,
      type: args.type || 'system',
      title: args.title,
      message: args.message,
      data: { sentByAdmin: true, adminId: currentUserId },
      read: false,
      actionUrl: args.actionUrl,
      createdAt: new Date().toISOString(),
    });

    return notificationId;
  },
});

// Admin: Send bulk notification to multiple users
export const sendBulkNotification = mutation({
  args: {
    userIds: v.array(v.string()),
    title: v.string(),
    message: v.string(),
    type: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error('Not authenticated');
    }

    // Verify the current user is an admin
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser?.is_admin && currentUser?.user_type !== 'admin') {
      throw new Error('Unauthorized: Only admins can send bulk notifications');
    }

    const notificationIds = await Promise.all(
      args.userIds.map((userId) =>
        ctx.db.insert('notifications', {
          userId,
          type: args.type || 'system',
          title: args.title,
          message: args.message,
          data: { sentByAdmin: true, adminId: currentUserId, bulk: true },
          read: false,
          actionUrl: args.actionUrl,
          createdAt: new Date().toISOString(),
        })
      )
    );

    return notificationIds;
  },
});

// Automatic: Account creation notification
export const createAccountWelcomeNotification = mutation({
  args: {
    userId: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('notifications', {
      userId: args.userId,
      type: 'system',
      title: 'Bienvenue sur Olufinja !',
      message: `Bonjour ${args.userName || ''}, votre compte a été créé avec succès. Complétez votre profil pour commencer.`,
      data: { type: 'welcome', isNewAccount: true },
      read: false,
      actionUrl: '/dashboard?tab=profile',
      createdAt: new Date().toISOString(),
    });
    return true;
  },
});

// Automatic: Supplier approved notification
export const createSupplierApprovedNotification = mutation({
  args: {
    userId: v.string(),
    supplierId: v.id('suppliers'),
    businessName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('notifications', {
      userId: args.userId,
      type: 'approval',
      title: 'Félicitations ! Votre profil est approuvé',
      message: `Votre entreprise "${args.businessName}" a été validée par notre équipe. Vous pouvez maintenant recevoir des commandes.`,
      data: { supplierId: args.supplierId, type: 'supplier_approved' },
      read: false,
      actionUrl: '/dashboard',
      createdAt: new Date().toISOString(),
    });
    return true;
  },
});

// Automatic: Supplier rejected notification
export const createSupplierRejectedNotification = mutation({
  args: {
    userId: v.string(),
    businessName: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('notifications', {
      userId: args.userId,
      type: 'system',
      title: 'Mise à jour de votre inscription',
      message: `Votre demande pour "${args.businessName}" n'a pas pu être approuvée${args.reason ? `: ${args.reason}` : '. Contactez-nous pour plus d\'informations.'}`,
      data: { type: 'supplier_rejected', reason: args.reason },
      read: false,
      actionUrl: '/contact',
      createdAt: new Date().toISOString(),
    });
    return true;
  },
});

// Automatic: Profile verification completed
export const createVerificationCompletedNotification = mutation({
  args: {
    userId: v.string(),
    supplierId: v.id('suppliers'),
    businessName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('notifications', {
      userId: args.userId,
      type: 'verification',
      title: 'Vérification complétée',
      message: `Votre entreprise "${args.businessName}" est maintenant vérifiée et approuvée.`,
      data: { supplierId: args.supplierId, type: 'verification_completed' },
      read: false,
      actionUrl: '/dashboard?tab=verification',
      createdAt: new Date().toISOString(),
    });
    return true;
  },
});

// Internal helper: Create notification (no auth required, for use by other mutations)
export const createNotificationInternal = async (
  ctx: any,
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, any>,
  actionUrl?: string
) => {
  return await ctx.db.insert('notifications', {
    userId,
    type,
    title,
    message,
    data,
    read: false,
    actionUrl,
    createdAt: new Date().toISOString(),
  });
};
