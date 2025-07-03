// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import type {
  User,
  AuthState,
  LoginCredentials,
  SignupCredentials,
} from "@/types/auth.types";
import { API_ENDPOINTS } from "@/api/auth";

interface AuthContextType extends AuthState {
  login: (provider: "google" | "github") => Promise<void>;
  loginWithEmail: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  handleOAuthCallback: (
    token: string,
    provider: "google" | "github"
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const userData = localStorage.getItem("user_data");

      console.log("Checking auth status:", {
        tokenExists: !!token,
        userDataExists: !!userData,
      });

      if (token && userData) {
        setAuthState({
          user: JSON.parse(userData),
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Auth status check failed:", error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: "Failed to verify authentication",
      });
    }
  };

  const login = async (provider: "google" | "github") => {
    try {
      console.log(`Initiating ${provider} login`);
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      if (provider === "google") {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}${API_ENDPOINTS.GOOGLE_AUTH}`
        );
        const data = await response.json();
        console.log("Google auth response:", data);
        window.location.href = data.auth_url;
      } else if (provider === "github") {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}${API_ENDPOINTS.GITHUB_AUTH}`
        );
        const data = await response.json();
        console.log("GitHub auth response:", data);
        window.location.href = data.auth_url;
      }
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || `Failed to initiate ${provider} login`,
      }));
    }
  };

  const handleOAuthCallback = useCallback(
    async (token: string, provider: "google" | "github") => {
      console.log(`Handling ${provider} OAuth callback with token:`, token);

      if (!token) {
        throw new Error("No token provided");
      }

      try {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Store token immediately
        localStorage.setItem("auth_token", token);

        // Fetch user profile
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include", // Important for CORS
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const userData = await response.json();

        // Store user data and update state
        localStorage.setItem("user_data", JSON.stringify(userData));

        // Update state only once
        setAuthState({
          user: userData,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } catch (error: any) {
        // Clear any stored data on error
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");

        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: error.message || "Authentication failed",
        });

        throw error;
      }
    },
    []
  );

  const loginWithEmail = async (credentials: LoginCredentials) => {
    try {
      console.log("Sending login request:", {
        url: `${import.meta.env.VITE_API_URL}${API_ENDPOINTS.LOGIN}`,
        credentials,
      });
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}${API_ENDPOINTS.LOGIN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        }
      );

      const data = await response.json();
      console.log("Login response:", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("user_data", JSON.stringify(data.user));

      setAuthState({
        user: data.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error: any) {
      console.error("Login error:", error.message, error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Invalid email or password",
      }));
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      console.log("Sending signup request:", { email, name });
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}${API_ENDPOINTS.SIGNUP}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        }
      );

      const data = await response.json();
      console.log("Signup response:", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.detail || "Signup failed");
      }

      localStorage.setItem("auth_token", data.access_token);
      localStorage.setItem("user_data", JSON.stringify(data.user));

      setAuthState({
        user: data.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error: any) {
      console.error("Signup error:", error.message, error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Signup failed",
      }));
    }
  };

  const logout = async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      const token = localStorage.getItem("auth_token");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/logout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });

      navigate("/auth", { replace: true });
    } catch (error: any) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Logout failed",
      }));
    }
  };

  const value = {
    ...authState,
    login,
    loginWithEmail,
    logout,
    signup,
    handleOAuthCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
