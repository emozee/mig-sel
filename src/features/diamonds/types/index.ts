export type DiamondStatus = 'pending' | 'accepted' | 'rejected';

export interface Diamond {
  id: number;
  userId: string;
  body: string;
  imageUrls: string[];
  createdAt: string;
  linkedGrievanceId?: string;
  status: DiamondStatus;
  directSolveAwarded: boolean;
}

export interface CreateDiamondInput {
  body: string;
  files: File[];
  linkedGrievanceId?: string;
  collaboratorIds?: string[];
}

export interface DiamondCollaborator {
  id: number;
  diamondId: number;
  userId: string;
  userName: string;
  userInitials: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface DiamondCollaboratorSummary {
  userId: string;
  userName: string;
  userInitials: string;
  avatarUrl?: string;
  role?: string;
}

export interface DiamondComment {
  id: string;
  diamondId: number;
  userId: string;
  body: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  userName: string;
  userInitials: string;
  avatarUrl?: string;
  userRole?: string;
}

export interface DiamondFeedItem {
  id: number;
  userId: string;
  body: string;
  imageUrls: string[];
  createdAt: string;
  userName: string;
  userInitials: string;
  avatarUrl?: string;
  userRole?: string;
  linkedGrievanceId?: string;
  linkedGrievanceTitle?: string;
  linkedGrievanceImage?: string;
  linkedGrievanceLat?: number;
  linkedGrievanceLng?: number;
  status: DiamondStatus;
  directSolve: boolean;
  collaborators: DiamondCollaboratorSummary[];
  upvoteCount: number;
  commentCount: number;
  isUpvoted: boolean;
  shareCount: number;
  isShared: boolean;
}

export interface PendingDiamondReview {
  id: number;
  userId: string;
  body: string;
  imageUrls: string[];
  linkedGrievanceId?: string;
  createdAt: string;
  userName: string;
  userAvatar?: string;
  collaboratorCount: number;
  grievanceTitle: string;
}
