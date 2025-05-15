export interface Video {
  id: string;
  title: string;
  description: string;
  category_id: string;
  image_url: string;
  video_url: string;
  is_trending: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}
