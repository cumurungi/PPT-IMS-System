import prisma from './prisma';
import { NotificationType } from '@prisma/client';

type SermonNotification = {
  title: string;
  body: string;
  entityId: string;
};

export async function notifyAllActiveUsers(notification: SermonNotification) {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  if (!users.length) return;

  await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      type: NotificationType.WORKFLOW_ALERT,
      title: notification.title,
      body: notification.body,
      entityType: 'Sermon',
      entityId: notification.entityId,
    })),
  });
}
