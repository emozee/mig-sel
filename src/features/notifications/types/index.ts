export type NotificationType =
  | 'report_submitted'
  | 'report_approved'
  | 'report_status'
  | 'report_rejected'
  | 'report_removed'
  | 'diamond_comment'
  | 'diamond_status'
  | 'announcement';

export interface AppNotification {
  id: number;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
}
