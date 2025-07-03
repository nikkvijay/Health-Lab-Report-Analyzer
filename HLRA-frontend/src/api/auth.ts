// src/api/auth.ts
import { LoginCredentials, SignupCredentials } from "@/types/auth.types";

export const API_ENDPOINTS = {
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  GOOGLE_AUTH: "/auth/google",
  GITHUB_AUTH: "/auth/github",
  LOGOUT: "/auth/logout",
  ME: "/auth/me",
};

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    console.log("API login request:", credentials);
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${API_ENDPOINTS.LOGIN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      }
    );
    const responseData = await response.json();
    console.log("API login response:", {
      status: response.status,
      data: responseData,
    });
    if (!response.ok) {
      throw new Error(responseData.detail || "Login failed");
    }
    return responseData;
  },

  signup: async (credentials: SignupCredentials) => {
    console.log("API signup request:", credentials);
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${API_ENDPOINTS.SIGNUP}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      }
    );
    const responseData = await response.json();
    console.log("API signup response:", {
      status: response.status,
      data: responseData,
    });
    if (!response.ok) {
      throw new Error(responseData.detail || "Signup failed");
    }
    return responseData;
  },

  googleAuth: () => {
    console.log("Initiating Google OAuth");
    window.location.href = `${import.meta.env.VITE_API_URL}${
      API_ENDPOINTS.GOOGLE_AUTH
    }`;
  },

  githubAuth: () => {
    console.log("Initiating GitHub OAuth");
    window.location.href = `${import.meta.env.VITE_API_URL}${
      API_ENDPOINTS.GITHUB_AUTH
    }`;
  },
};
