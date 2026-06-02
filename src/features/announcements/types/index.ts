export type AnnouncementType = 'announcement' | 'important_notice';

export type Announcement = {
  id: number;
  title: string;
  body: string;
  type: AnnouncementType;
  author_id: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type AnnouncementWithAuthor = Announcement & {
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};
