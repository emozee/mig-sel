export type ComplaintCategory = 'road' | 'garbage' | 'lighting' | 'drainage' | 'other';

export type ComplaintUrgency = 'low' | 'medium' | 'high';

export type ComplaintStatus = 'pending' | 'in-progress' | 'resolved';

export type Complaint = {
  id: string;
  created_at: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  image_url: string | null;
  latitude: number;
  longitude: number;
  reporter_id: string;
  location: string | null;
  resolved_image_url: string | null;
  urgency: ComplaintUrgency;
  resolved_at: string | null;
  parent_id: string | null;
  bonus_awarded: number;
  approved: boolean;
};
