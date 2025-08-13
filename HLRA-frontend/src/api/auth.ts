import axios from 'axios';
import { LoginCredentials, RegisterCredentials, AuthTokens, User, UserUpdate } from '../types';
import { API_BASE_URL } from '@/constant';

class AuthAPI {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${API_BASE_URL}/api/v1/auth`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // NOTE: Token refresh is now handled by AuthContext only
    // This interceptor was causing duplicate refresh loops
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Just pass through errors - let AuthContext handle refresh
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  async login(credentials: LoginCredentials) {
    return this.axiosInstance.post<AuthTokens>('/login', credentials);
  }

  async register(credentials: RegisterCredentials) {
    return this.axiosInstance.post<User>('/register', credentials);
  }

  async logout() {
    return this.axiosInstance.post('/logout');
  }

  async refreshToken(refreshToken: string) {
    return this.axiosInstance.post<AuthTokens>('/refresh', {
      refresh_token: refreshToken,
    });
  }

  async getCurrentUser() {
    return this.axiosInstance.get<User>('/me');
  }

  async verifyToken() {
    return this.axiosInstance.get('/verify-token');
  }

  async updateProfile(profileData: UserUpdate) {
    return this.axiosInstance.put<User>('/profile', profileData);
  }
}

export const authAPI = new AuthAPI();