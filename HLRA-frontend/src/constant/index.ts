// API Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Session Management
export const SESSION_COOKIE_NAME = "hlra_session_token";
export const CURRENT_SESSION_NAME = "hlra_current_session";

// App Configuration
export const APP_NAME =
  import.meta.env.VITE_APP_NAME || "Health Report Analyzer";
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

// Public App URL (for shared links)
// Priority: 1. VITE_PUBLIC_APP_URL env var, 2. Current origin
const getPublicAppUrl = () => {
  const envUrl = import.meta.env.VITE_PUBLIC_APP_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, ''); // Remove trailing slash
  }
  
  // Fallback to current origin (works in browser)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // SSR fallback (should not happen in Vite, but just in case)
  return 'http://localhost:3000';
};

export const PUBLIC_APP_URL = getPublicAppUrl();
