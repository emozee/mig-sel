export type UserProfile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  points: number;
  role: string | null;
  username_edit_count: number;
};

export type LeaderboardEntry = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  points: number;
  rank: number;
};
