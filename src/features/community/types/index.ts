export type FeedStatus = 'pending' | 'in-progress' | 'resolved';

export interface ActivityItem {
  id: number;
  userName: string;
  userInitials: string;
  action: string;
  location: string;
  timestamp: Date;
  upvoteCount: number;
  commentCount: number;
  isUpvoted: boolean;
  image_url?: string;
  userId?: string;
  avatarUrl?: string;
  status?: FeedStatus;
}

export interface FeedComment {
  id: string;
  feed_id: number;
  user_id: string;
  body: string;
  created_at: string;
  user_name: string;
  user_initials: string;
}

export interface ImpactGoal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  location: string;
}
