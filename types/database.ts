export interface Registrant {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  department: string | null;
  title: string | null;
  privacy_agreed: boolean;
  privacy_agreed_at: string | null;
  profile_public_agreed: boolean;
  profile_public_agreed_at: string | null;
  marketing_agreed: boolean;
  marketing_agreed_at: string | null;
  marketing_channel: "Both" | "Email" | "Phone" | "Not applicable";
  created_at: string;
  updated_at: string;
}

export interface LoginLog {
  id: string;
  registrant_id: string;
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface WatchLog {
  id: string;
  registrant_id: string;
  first_access_at: string | null;
  last_access_at: string | null;
  total_watch_seconds: number;
  ip_address: string | null;
  user_agent: string | null;
  device_type: "desktop" | "mobile" | "tablet" | "unknown" | null;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: "super_admin" | "manager";
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventSettings {
  id: number;
  event_name: string;
  event_date: string | null;
  stream_url: string | null;
  video_open_at: string | null;
  video_close_at: string | null;
  survey_url: string | null;
  material_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  updated_at: string;
}
