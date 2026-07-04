export type FeedStatus = 'pending' | 'in-progress' | 'resolved' | 'public';

export interface ActivityItem {
  id: number;
  grievanceId?: string;
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
  userRole?: string;
  status?: FeedStatus;
  latitude?: number;
  longitude?: number;
}

export interface FeedComment {
  id: string;
  feed_id: number;
  user_id: string;
  body: string;
  created_at: string;
  updated_at?: string;
  image_url?: string;
  user_name: string;
  user_initials: string;
  user_role?: string;
}

export interface ImpactGoal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  location: string;
}
