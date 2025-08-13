import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "@/constant";
import { authAPI } from "./auth";
import {
  FileUploadResponse,
  LabReport,
  DashboardStats,
  TrendData,
  User,
  UserUpdate,
  ExportDataResponse,
  StarredReportResponse,
  APIResponse,
  FamilyProfile,
  FamilyProfileCreate,
  FamilyProfileUpdate,
  HealthInsight,
  PermissionCheckResponse,
  Notification,
  NotificationCreate,
  NotificationUpdate,
} from "../types";
// import SessionService from "@/hooks/sessionService";
// import { LoginResponse } from "@/types/auth";
// src/api/index.ts or similar
export const API_CLIENT = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

API_CLIENT.interceptors.request.use(
  function (config) {
    // Get token from cookies (same as AuthContext)
    const token = Cookies.get("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("⚠️ No access token found in cookies for API request");
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// Response interceptor to handle backend unavailability
API_CLIENT.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    // Check if backend is not available
    if (
      error.code === "ECONNREFUSED" ||
      error.message?.includes("Network Error") ||
      !error.response
    ) {
      console.warn("Backend server not available:", error.message);
      // Return mock data for development
      const mockResponse = {
        data: {
          message:
            "Backend server not available - using mock data for development",
          mock: true,
        },
        status: 503,
        statusText: "Service Unavailable",
      };
      return Promise.resolve(mockResponse);
    }
    return Promise.reject(error);
  }
);

// export const login = async (credentials: {
//   username: string;
//   password: string;
// }): Promise<LoginResponse> => {
//   try {
//     // Create initial session info
//     const sessionInfo = await SessionService.createSession("temp", "temp");

//     // Extract username and password from credentials
//     const { username, password } = credentials;

//     // Send the correct format
//     const response = await API_CLIENT.post("/auth/login", {
//       username: username, // Send as string
//       password: password, // Send as string
//       sessionInfo,
//     });

//     if (response.data.success) {
//       const { token, session } = response.data.data;

//       localStorage.setItem(SESSION_COOKIE_NAME, token);
//       localStorage.setItem(CURRENT_SESSION_NAME, JSON.stringify(session));

//       // Set up axios interceptor for token
//       API_CLIENT.defaults.headers.common["Authorization"] = `Bearer ${token}`;

//       return response.data;
//     } else {
//       throw new Error(response.data.message);
//     }
//   } catch (error) {
//     console.error("Login error:", error);
//     throw error;
//   }
// };

// export const logout = async () => {
//   try {
//     const session = SessionService.getCurrentSession();
//     if (session) {
//       await API_CLIENT.post("/auth/logout", { sessionId: session.id });
//     }
//     SessionService.clearSession();
//     delete API_CLIENT.defaults.headers.common["Authorization"];
//   } catch (error) {
//     console.error("Logout error:", error);
//     // Clear session anyway
//     SessionService.clearSession();
//     throw error;
//   }
// };

// // Session activity tracker
// let activityInterval: NodeJS.Timeout;

// export const startSessionTracking = () => {
//   // Update last active time every 5 minutes
//   activityInterval = setInterval(() => {
//     SessionService.updateLastActive();
//   }, 5 * 60 * 1000);

//   // Add event listeners for user activity
//   ["click", "keypress", "scroll", "mousemove"].forEach((event) => {
//     window.addEventListener(event, () => {
//       SessionService.updateLastActive();
//     });
//   });
// };

// export const getSessionInfo = async () => {
//   const response = await API_CLIENT.get(`auth/sessions`);
//   return response.data;
// };

// export const terminateSession = async (sessionId: string) => {
//   const response = await API_CLIENT.post(`auth/terminate-session`, {
//     sessionId,
//   });
//   return response.data;
// };

// export const changePassword = async (payload: any) => {
//   const response = await API_CLIENT.post(`auth/change-password`, payload);
//   return response.data;
// };

// export const getAllSessions = async () => {
//   const response = await API_CLIENT.get(`auth/all-sessions`);
//   return response.data;
// };

// export const stopSessionTracking = () => {
//   clearInterval(activityInterval);
// };

// export const getProfileDetails = async () => {
//   const response = await API_CLIENT.get(`auth/profile`);
//   return response.data;
// };

// export const updateAdminDetails = async (payload: any) => {
//   const response = await API_CLIENT.patch(`admin/update`, payload);
//   return response.data;
// };

// export const updateAdminPassword = async (payload: any) => {
//   const response = await API_CLIENT.patch(`auth/change-password`, payload);
//   return response.data;
// };

export const healthAPI = {
  uploadFile: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await API_CLIENT.post<FileUploadResponse>(
      "/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  getReports: async (profileId?: string): Promise<LabReport[]> => {
    const params = profileId ? `?profile_id=${profileId}` : "";
    const response = await API_CLIENT.get<LabReport[]>(`/reports${params}`);
    return response.data;
  },

  getReport: async (id: string): Promise<LabReport> => {
    const response = await API_CLIENT.get<LabReport>(`/reports/${id}`);
    return response.data;
  },

  extractData: async (fileId: string): Promise<APIResponse> => {
    const response = await API_CLIENT.post<APIResponse>("/extract", { fileId });
    return response.data;
  },

  // Stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await API_CLIENT.get<DashboardStats>("/stats/dashboard");
    return response.data;
  },

  // Reports management
  deleteReport: async (id: string): Promise<APIResponse> => {
    const response = await API_CLIENT.delete<APIResponse>(`/reports/${id}`);
    return response.data;
  },

  downloadReport: async (id: string): Promise<Blob> => {
    const response = await API_CLIENT.get(`/reports/${id}/download`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Trends (placeholder for now)
  getTrendData: async (
    parameter: string,
    dateRange: string
  ): Promise<TrendData[]> => {
    const response = await API_CLIENT.get<TrendData[]>(
      `/trends/${parameter}?date_range=${dateRange}`
    );
    return response.data;
  },

  // User Management
  getUserProfile: async (): Promise<User> => {
    // Use authAPI instance instead of API_CLIENT to ensure proper token handling
    const response = await authAPI.getCurrentUser();
    return response.data;
  },

  updateProfile: async (profileData: UserUpdate): Promise<User> => {
    // Use authAPI instance instead of API_CLIENT to ensure proper token handling
    const response = await authAPI.updateProfile(profileData);
    return response.data;
  },

  exportUserData: async (): Promise<ExportDataResponse> => {
    const response = await API_CLIENT.post<ExportDataResponse>(
      "/trends/export",
      {
        parameters: ["all"],
        date_range: "all",
      }
    );
    return response.data;
  },

  // Star functionality
  toggleReportStar: async (
    reportId: string,
    isStarred: boolean
  ): Promise<StarredReportResponse> => {
    const response = await API_CLIENT.post<StarredReportResponse>(
      `/reports/${reportId}/star`,
      {
        is_starred: isStarred,
      }
    );
    return response.data;
  },

  getStarredReports: async (): Promise<LabReport[]> => {
    const response = await API_CLIENT.get<LabReport[]>("/reports/starred");
    return response.data;
  },
};

export const familyProfileAPI = {
  // Create a new family profile
  createProfile: async (
    profileData: FamilyProfileCreate
  ): Promise<FamilyProfile> => {
    const response = await API_CLIENT.post<FamilyProfile>(
      "/family-profiles",
      profileData
    );
    return response.data;
  },

  // Get all family profiles for current user
  getProfiles: async (): Promise<FamilyProfile[]> => {
    const response = await API_CLIENT.get<{
      profiles: FamilyProfile[];
      total: number;
      active_profile_id?: string;
    }>("/family-profiles");
    return response.data.profiles || [];
  },

  // Get a specific family profile
  getProfile: async (profileId: string): Promise<FamilyProfile> => {
    const response = await API_CLIENT.get<FamilyProfile>(
      `/family-profiles/${profileId}`
    );
    return response.data;
  },

  // Update a family profile
  updateProfile: async (
    profileId: string,
    updateData: FamilyProfileUpdate
  ): Promise<FamilyProfile> => {
    const response = await API_CLIENT.put<FamilyProfile>(
      `/family-profiles/${profileId}`,
      updateData
    );
    return response.data;
  },

  // Delete a family profile
  deleteProfile: async (profileId: string): Promise<APIResponse> => {
    const response = await API_CLIENT.delete<APIResponse>(
      `/family-profiles/${profileId}`
    );
    return response.data;
  },

  // Set active profile
  setActiveProfile: async (profileId: string): Promise<APIResponse> => {
    const response = await API_CLIENT.post<APIResponse>(
      "/family-profiles/set-active",
      {
        profile_id: profileId,
      }
    );
    return response.data;
  },

  // Get current active profile
  getActiveProfile: async (): Promise<FamilyProfile | null> => {
    const response = await API_CLIENT.get<FamilyProfile | null>(
      "/family-profiles/active/current"
    );
    return response.data;
  },

  // Get health insights for a profile
  getHealthInsights: async (profileId: string): Promise<HealthInsight[]> => {
    const response = await API_CLIENT.get<HealthInsight[]>(
      `/family-profiles/${profileId}/health-insights`
    );
    return response.data;
  },

  // Check profile permission
  checkPermission: async (
    profileId: string,
    permission: string
  ): Promise<PermissionCheckResponse> => {
    const response = await API_CLIENT.get<PermissionCheckResponse>(
      `/family-profiles/${profileId}/permissions/${permission}`
    );
    return response.data;
  },

  // Initialize self profile (for first-time users)
  initializeSelfProfile: async (): Promise<FamilyProfile> => {
    const response = await API_CLIENT.post<FamilyProfile>(
      "/family-profiles/initialize-self"
    );
    return response.data;
  },
};

export const notificationAPI = {
  // Get notifications
  getNotifications: async (
    profileId?: string,
    unreadOnly?: boolean,
    limit?: number,
    offset?: number
  ): Promise<Notification[]> => {
    const params = new URLSearchParams();
    if (profileId) params.append("profile_id", profileId);
    if (unreadOnly) params.append("unread_only", "true");
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());

    const response = await API_CLIENT.get<Notification[]>(
      `/notifications?${params.toString()}`
    );
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (profileId?: string): Promise<{ count: number }> => {
    const params = profileId ? `?profile_id=${profileId}` : "";
    const response = await API_CLIENT.get<{ count: number }>(
      `/notifications/unread-count${params}`
    );
    return response.data;
  },

  // Get specific notification
  getNotification: async (notificationId: string): Promise<Notification> => {
    const response = await API_CLIENT.get<Notification>(
      `/notifications/${notificationId}`
    );
    return response.data;
  },

  // Mark as read
  markAsRead: async (notificationId: string): Promise<APIResponse> => {
    const response = await API_CLIENT.post<APIResponse>(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async (profileId?: string): Promise<APIResponse> => {
    const params = profileId ? `?profile_id=${profileId}` : "";
    const response = await API_CLIENT.post<APIResponse>(
      `/notifications/mark-all-read${params}`
    );
    return response.data;
  },

  // Update notification
  updateNotification: async (
    notificationId: string,
    updateData: NotificationUpdate
  ): Promise<Notification> => {
    const response = await API_CLIENT.patch<Notification>(
      `/notifications/${notificationId}`,
      updateData
    );
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<APIResponse> => {
    const response = await API_CLIENT.delete<APIResponse>(
      `/notifications/${notificationId}`
    );
    return response.data;
  },

  // Create notification (admin/system use)
  createNotification: async (
    notificationData: NotificationCreate
  ): Promise<Notification> => {
    const response = await API_CLIENT.post<Notification>(
      "/notifications",
      notificationData
    );
    return response.data;
  },
};
