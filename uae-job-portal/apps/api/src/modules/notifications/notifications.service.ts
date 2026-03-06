import prisma from '../../lib/prisma';

export class NotificationsService {
  async getNotifications(userId: string, page = 1, limit = 20) {
    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return { items, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markRead(userId: string, notificationId: string) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
    return { message: 'Marked as read' };
  }

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { message: 'All marked as read' };
  }

  async deleteNotification(userId: string, notificationId: string) {
    await prisma.notification.deleteMany({ where: { id: notificationId, userId } });
    return { message: 'Deleted' };
  }
}
