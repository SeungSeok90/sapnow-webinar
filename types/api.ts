export interface ApiResponse<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RegisterRequest {
  name: string;
  company: string;
  email: string;
  phone: string;
  department?: string;
  title?: string;
  privacy_agreed: boolean;
  marketing_agreed: boolean;
}

export interface LoginRequest {
  email: string;
  phoneLast4: string;
}

export interface HeartbeatRequest {
  elapsedSeconds: number;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface DashboardStats {
  totalRegistrants: number;
  todayRegistrants: number;
  loginCount: number;
  videoAccessCount: number;
  viewerCount: number;
  validViewerCount: number;
  nonAccessCount: number;
  viewRate: number;
}

export interface RegistrantsQuery {
  search?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface ViewersQuery {
  search?: string;
  status?: "none" | "accessed" | "viewer" | "valid_viewer";
  page?: number;
  limit?: number;
}

export type ViewStatus = "none" | "accessed" | "viewer" | "valid_viewer";

export interface ViewerRow {
  registrant_id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  first_access_at: string | null;
  last_access_at: string | null;
  total_watch_seconds: number;
  status: ViewStatus;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
