import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import { User, AuthTokens, AuthState, LoginCredentials, RegisterCredentials } from '../types';
import { authAPI } from '../api/auth';
import { toast } from 'sonner';
import { authCircuitBreaker } from '../utils/authGuard';
import { ErrorHandler, handleApiError, isNetworkError } from '../utils/errorHandler';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Circuit breaker to prevent infinite loops
  const refreshAttempts = useRef(0);
  const lastRefreshAttempt = useRef<number>(0);
  const circuitBroken = useRef(false);
  const MAX_REFRESH_ATTEMPTS = 3;
  const REFRESH_COOLDOWN = 5000; // 5 seconds
  const CIRCUIT_RESET_TIME = 30000; // 30 seconds

  const setTokens = (tokens: AuthTokens | null) => {
    if (tokens) {
      // Set cookies with secure configuration
      const isProduction = import.meta.env.PROD;
      const cookieOptions = {
        sameSite: 'Strict' as const,
        secure: isProduction || window.location.protocol === 'https:',
        httpOnly: false, // Need access from JS for API calls
      };
      
      Cookies.set('access_token', tokens.access_token, { 
        ...cookieOptions,
        expires: 1, // 1 day
      });
      Cookies.set('refresh_token', tokens.refresh_token, { 
        ...cookieOptions,
        expires: 7, // 7 days
      });
      authAPI.setAuthToken(tokens.access_token);
      
    } else {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      authAPI.removeAuthToken();
    }
    
    setAuthState(prev => ({ ...prev, tokens }));
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const response = await authAPI.login(credentials);
      const tokens = response.data;
      
      setTokens(tokens);
      
      const userResponse = await authAPI.getCurrentUser();
      const user = userResponse.data;
      
      setAuthState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
      });
      
      toast.success('Login successful!');
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      const standardError = handleApiError(error, 'Login', { rethrow: true });
      throw standardError;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await authAPI.register(credentials);
      
      // Auto-login after successful registration
      await login({
        email: credentials.email,
        password: credentials.password,
      });
      
      toast.success('Registration successful!');
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      const standardError = handleApiError(error, 'Registration', { rethrow: true });
      throw standardError;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      clearAllAuthData();
      setAuthState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      // Reset circuit breaker
      refreshAttempts.current = 0;
      circuitBroken.current = false;
      
      toast.success('Logged out successfully');
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    // Global circuit breaker check
    if (authCircuitBreaker.isBroken()) {
      console.warn('🚫 Global auth circuit breaker active - blocking all auth attempts');
      return false;
    }
    
    const now = Date.now();
    
    // Local circuit breaker: if broken, check if we should reset
    if (circuitBroken.current) {
      if (now - lastRefreshAttempt.current > CIRCUIT_RESET_TIME) {
        circuitBroken.current = false;
        refreshAttempts.current = 0;
      } else {
        console.warn('🚫 Local circuit breaker active - blocking refresh attempts');
        return false;
      }
    }
    
    // Check if we're in cooldown period
    if (now - lastRefreshAttempt.current < REFRESH_COOLDOWN) {
      console.warn('🚫 Refresh token cooldown active, skipping attempt');
      return false;
    }
    
    // Check if we've exceeded max attempts
    if (refreshAttempts.current >= MAX_REFRESH_ATTEMPTS) {
      console.error('🚨 CIRCUIT BREAKER TRIGGERED - Too many refresh failures');
      circuitBroken.current = true;
      setTokens(null);
      setAuthState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      });
      toast.error('Authentication session expired. Please log in again.');
      return false;
    }
    
    try {
      const refreshTokenValue = Cookies.get('refresh_token');
      if (!refreshTokenValue) {
        console.warn('No refresh token available - logging out');
        await logout();
        return false;
      }

      lastRefreshAttempt.current = now;
      refreshAttempts.current += 1;
      

      const response = await authAPI.refreshToken(refreshTokenValue);
      const tokens = response.data;
      
      setTokens(tokens);
      
      // Reset circuit breaker on success
      refreshAttempts.current = 0;
      circuitBroken.current = false;
      return true;
      
    } catch (error: any) {
      const standardError = ErrorHandler.classify(error);
      console.warn(`❌ Token refresh failed (${refreshAttempts.current}/${MAX_REFRESH_ATTEMPTS}):`, ErrorHandler.getUserMessage(standardError));
      
      // If we've reached max attempts, break the circuit GLOBALLY
      if (refreshAttempts.current >= MAX_REFRESH_ATTEMPTS) {
        console.error('🚨 GLOBAL CIRCUIT BREAKER TRIGGERED - Max refresh attempts exceeded');
        
        // Break both local and global circuits
        circuitBroken.current = true;
        authCircuitBreaker.break();
        
        // Clear all auth data
        clearAllAuthData();
        setAuthState({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
        
        toast.error('Session expired. Please log in again.');
      }
      
      return false;
    }
  };

  const clearAllAuthData = () => {
    // Clear all cookies
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    
    // Clear localStorage items that might interfere - BUT PRESERVE PROFILE DATA
    try {
      localStorage.removeItem('diagnosticdeck_notifications');
      localStorage.removeItem('form_persistence_new_profile');
      localStorage.removeItem('form_persistence_edit_profile');

      // Clear only specific auth-related items, NOT profile data
      Object.keys(localStorage).forEach(key => {
        // Only clear auth-specific keys, preserve profile data
        if (
          (key.includes('auth') || key.includes('token') || key.includes('session')) &&
          !key.includes('family_profiles') && // Preserve family profile data
          !key.includes('diagnosticdeck_family_profiles') // Preserve family profile data
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Error clearing localStorage:', e);
    }
    
    // Clear API token
    authAPI.removeAuthToken();
  };

  const initializeAuth = async () => {
    const accessToken = Cookies.get('access_token');
    const refreshTokenCookie = Cookies.get('refresh_token');
    
    // If no tokens, clear everything to be safe
    if (!accessToken || !refreshTokenCookie) {
      clearAllAuthData();
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      authAPI.setAuthToken(accessToken);
      const response = await authAPI.getCurrentUser();
      const user = response.data;
      
      setAuthState({
        user,
        tokens: {
          access_token: accessToken,
          refresh_token: refreshTokenCookie,
          token_type: 'bearer',
          expires_in: 1800,
        },
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Reset circuit breaker on successful init
      refreshAttempts.current = 0;
      circuitBroken.current = false;
      
    } catch (error: any) {
      const standardError = ErrorHandler.classify(error);
      
      // Check if it's a network/server error  
      if (isNetworkError(standardError)) {
        // Backend is not available - create mock user for development
        console.warn('Backend server not available, using mock authentication for development');
        setAuthState({
          user: {
            id: 'mock-user-id',
            full_name: 'Development User',
            email: 'dev@example.com',
            is_active: true,
            is_verified: true,
            created_at: new Date().toISOString(),
          },
          tokens: {
            access_token: accessToken,
            refresh_token: refreshTokenCookie,
            token_type: 'bearer',
            expires_in: 1800,
          },
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }

      // Token is invalid - clear everything and force clean state
      console.error('🚨 Authentication failed - clearing all auth data');
      clearAllAuthData();
      
      setAuthState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      // Break the circuit immediately to prevent refresh loops
      circuitBroken.current = true;
      refreshAttempts.current = MAX_REFRESH_ATTEMPTS;
      
      toast.error('Your session has expired. Please log in again.');
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};