  export type FileStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "complete"
  | "error";

export interface FileUploadState {
  file: File | null;
  progress: number;
  status: FileStatus;
  error: string | null;
}

export interface HealthParameter {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  reference_range?: string;
  referenceRange?: string; // For backward compatibility
  status: "normal" | "high" | "low" | "critical";
  category?: "blood" | "urine" | "lipid" | "liver" | "kidney" | "hormone" | "vitamin";
  extracted_text?: string;
  date?: Date;
}

export interface LabReport {
  id: string;
  user_id?: string;
  profile_id?: string;
  filename?: string;
  fileName?: string; // For backward compatibility
  original_filename: string;
  file_path?: string;
  uploadDate?: Date; // For backward compatibility
  upload_date: string | Date;
  processing_status: "uploading" | "processing" | "completed" | "failed";
  parameters: HealthParameter[];
  raw_text?: string;
  error_message?: string;
  file_size?: number;
  file_type?: string;
  is_starred?: boolean;
  insights?: string[];
  fileUrl?: string;
  file_url?: string;
  status?: string;
}

export interface TrendDataPoint {
  date: string | Date;
  value: number | string;
  status: "normal" | "high" | "low" | "critical";
}

export interface TrendData {
  parameter_name: string;
  data_points: TrendDataPoint[];
  trend_direction?: "improving" | "declining" | "stable";
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  phone?: string;
  address?: string;
  bio?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// Family Profile Types
export interface FamilyProfile {
  id: string;
  user_id: string;
  name: string;
  relationship: 'self' | 'family';
  relationship_label?: string;
  date_of_birth?: string;
  gender?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FamilyProfileCreate {
  name: string;
  relationship: 'self' | 'family';
  relationship_label?: string;
  date_of_birth?: string;
  gender?: string;
}

export interface FamilyProfileUpdate {
  name?: string;
  relationship_label?: string;
  date_of_birth?: string;
  gender?: string;
  is_active?: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  profile_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'health_alert' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

export interface NotificationCreate {
  profile_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'health_alert' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'critical';
  expires_at?: string;
}

export interface NotificationUpdate {
  is_read?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

// Dashboard Stats Types
export interface DashboardStats {
  total_reports: number;
  this_month: number;
  avg_processing: string;
  health_alerts: number;
  success?: boolean;
}

// File Upload Types
export interface FileUploadResponse {
  id: string;
  file_id: string;
  filename: string;
  original_filename: string;
  status: string;
  message: string;
  upload_date: string | Date;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  parameters_count: number;
  file_url?: string;
}

// Health Insights Types
export interface HealthInsight {
  id: string;
  profile_id: string;
  insight_type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

// Starred Reports Types
export interface StarredReportResponse {
  success: boolean;
  is_starred: boolean;
}

// User Profile Update Types
export interface UserUpdate {
  full_name?: string;
  phone?: string;
  address?: string;
  bio?: string;
}

// Permission Check Types
export interface PermissionCheckResponse {
  has_permission: boolean;
  permission_name: string;
}

// Export Data Types
export interface ExportDataResponse {
  export_url: string;
  expires_at: string;
}
