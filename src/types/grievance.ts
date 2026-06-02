export type GrievanceStatus =
  | 'submitted'
  | 'in_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export interface Grievance {
  id: string;
  title: string;
  category: 'road' | 'garbage' | 'lighting' | 'drainage' | 'other';
  status: GrievanceStatus;
  latitude: number;
  longitude: number;
  image_url: string;
  resolved_image_url?: string;
  created_at: string;
  resolved_at?: string;
}
