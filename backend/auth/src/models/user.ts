export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}
