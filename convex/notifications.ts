import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import type { Doc } from './_generated/dataModel';

// Get all notifications for the current user
export const getNotifications = query({
  args: {
    limit: v.optional(v.number()),
    onlyUnread: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<Doc<'notifications'>[]> => {
    // Identité Clerk : userId au format tokenIdentifier,
    // comme toutes les écritures de notifications.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Auth pas encore prête (course au chargement) : liste vide, comme
      // getUnreadCount. La souscription repart dès que l'authentification arrive.
      return [];
    }

    const userId = identity.tokenIdentifier;

    let notifications;
    const limit = Math.min(args.limit ?? 50, 200);
    if (args.onlyUnread) {
      notifications = await ctx.db
        .query('notifications')
        .withIndex('userId_read', (q) => q.eq('userId', userId).eq('read', false))
        .order('desc')
        .take(limit);
    } else {
      notifications = await ctx.db
        .query('notifications')
        .withIndex('userId', (q) => q.eq('userId', userId))
        .order('desc')
        .take(limit);
    }

    return notifications;
  },
});

// Get unread notification count
export const getUnreadCount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const userId = identity.tokenIdentifier;

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('userId_read', (q) => q.eq('userId', userId).eq('read', false))
      .take(1000);

    // Return capped count - for accurate counts at scale, use a denormalized counter
    return notifications.length < 1000 ? notifications.length : 1000;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Look up current user by tokenIdentifier
    const currentUser = await ctx.db
      .query('users')
      .withIndex('tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .first();

    // Check if user is admin or creating for themselves
    if (args.userId !== identity.tokenIdentifier && !currentUser?.is_admin) {
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== identity.tokenIdentifier) {
      throw new Error('Unauthorized to modify this notification');
    }

    await ctx.db.patch(args.notificationId, { read: true });
    return true;
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('userId_read', (q) => q.eq('userId', identity.tokenIdentifier).eq('read', false))
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== identity.tokenIdentifier) {
      throw new Error('Unauthorized to delete this notification');
    }

    await ctx.db.delete(args.notificationId);
    return true;
  },
});

// Create a contact request notification when a customer wants to contact a supplier
export const createContactRequest = mutation({
  args: {
    supplierUserId: v.string(),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const currentUserId = identity.tokenIdentifier;

    // Create notification for supplier
    const notificationId = await ctx.db.insert('notifications', {
      userId: args.supplierUserId,
      type: 'contact_request',
      title: 'Nouvelle demande de contact',
      message: `${args.customerName} souhaite vous contacter${args.message ? `: "${args.message.substring(0, 100)}${args.message.length > 100 ? '...' : ''}"` : ''}`,
      data: {
        customerUserId: currentUserId,
        customerName: args.customerName,
        customerEmail: args.customerEmail,
        customerPhone: args.customerPhone,
        message: args.message,
      },
      read: false,
      actionUrl: '/dashboard?tab=notifications',
      createdAt: new Date().toISOString(),
    });

    return notificationId;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify the current user is an admin
    const currentUser = await ctx.db
      .query('users')
      .withIndex('tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .first();
    if (!currentUser?.is_admin && currentUser?.user_type !== 'admin') {
      throw new Error('Unauthorized: Only admins can send notifications');
    }

    const notificationId = await ctx.db.insert('notifications', {
      userId: args.userId,
      type: args.type || 'system',
      title: args.title,
      message: args.message,
      data: { sentByAdmin: true, adminId: identity.tokenIdentifier },
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Verify the current user is an admin
    const currentUser = await ctx.db
      .query('users')
      .withIndex('tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .first();
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
          data: { sentByAdmin: true, adminId: identity.tokenIdentifier, bulk: true },
          read: false,
          actionUrl: args.actionUrl,
          createdAt: new Date().toISOString(),
        })
      )
    );

    return notificationIds;
  },
});
