import { AxiosError } from 'axios';
import { toast } from 'sonner';

// Standard error types for the application
export interface AppError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

export interface ValidationError extends AppError {
  code: 'VALIDATION_ERROR';
  field?: string;
}

export interface NetworkError extends AppError {
  code: 'NETWORK_ERROR';
  originalError?: any;
}

export interface AuthError extends AppError {
  code: 'AUTH_ERROR';
  type: 'UNAUTHORIZED' | 'FORBIDDEN' | 'TOKEN_EXPIRED' | 'INVALID_CREDENTIALS';
}

export interface ServerError extends AppError {
  code: 'SERVER_ERROR';
  statusCode: number;
}

export type StandardError = ValidationError | NetworkError | AuthError | ServerError;

// Error classification utility
export class ErrorHandler {
  static classify(error: unknown): StandardError {
    // Handle Axios errors
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error);
    }
    
    // Handle standard errors
    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        details: error
      };
    }
    
    // Handle string errors
    if (typeof error === 'string') {
      return {
        code: 'UNKNOWN_ERROR',
        message: error
      };
    }
    
    // Handle unknown errors
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      details: error
    };
  }
  
  static isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError)?.isAxiosError === true;
  }
  
  static handleAxiosError(error: AxiosError): StandardError {
    const response = error.response;
    const status = response?.status;
    const data = response?.data as any;
    
    // Network/connection errors
    if (!response || error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to server. Please check your internet connection and try again.',
        originalError: error,
        statusCode: 0
      };
    }
    
    // Authentication errors
    if (status === 401) {
      return {
        code: 'AUTH_ERROR',
        type: 'UNAUTHORIZED',
        message: data?.detail || 'Authentication failed. Please log in again.',
        statusCode: status
      };
    }
    
    if (status === 403) {
      return {
        code: 'AUTH_ERROR',
        type: 'FORBIDDEN',
        message: data?.detail || 'You do not have permission to perform this action.',
        statusCode: status
      };
    }
    
    // Validation errors
    if (status === 400 || status === 422) {
      return {
        code: 'VALIDATION_ERROR',
        message: data?.detail || data?.message || 'Invalid data provided. Please check your input.',
        details: data,
        statusCode: status,
        field: data?.field
      };
    }
    
    // Server errors
    if (status && status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: 'Server error occurred. Please try again later.',
        statusCode: status,
        details: data
      };
    }
    
    // Other HTTP errors
    return {
      code: 'UNKNOWN_ERROR',
      message: data?.detail || data?.message || `Request failed with status ${status}`,
      statusCode: status,
      details: data
    };
  }
  
  // User-friendly error messages
  static getUserMessage(error: StandardError): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Connection problem. Please check your internet and try again.';
      
      case 'AUTH_ERROR':
        switch (error.type) {
          case 'UNAUTHORIZED':
            return 'Please log in to continue.';
          case 'FORBIDDEN':
            return 'You don\'t have permission for this action.';
          case 'TOKEN_EXPIRED':
            return 'Your session has expired. Please log in again.';
          case 'INVALID_CREDENTIALS':
            return 'Invalid email or password.';
          default:
            return 'Authentication error occurred.';
        }
      
      case 'VALIDATION_ERROR':
        return error.message || 'Please check your input and try again.';
      
      case 'SERVER_ERROR':
        return 'Server is having issues. Please try again in a few minutes.';
      
      default:
        return error.message || 'Something went wrong. Please try again.';
    }
  }
  
  // Toast notification helper
  static showError(error: StandardError, options: { 
    showToast?: boolean; 
    customMessage?: string;
    duration?: number;
  } = {}) {
    const { showToast = true, customMessage, duration = 5000 } = options;
    
    if (showToast) {
      const message = customMessage || this.getUserMessage(error);
      
      if (error.code === 'NETWORK_ERROR') {
        toast.error(message, { 
          duration,
          description: 'Check your connection and try again'
        });
      } else if (error.code === 'AUTH_ERROR') {
        toast.error(message, {
          duration,
          description: 'You may need to log in again'
        });
      } else {
        toast.error(message, { duration });
      }
    }
  }
  
  // Logging helper
  static logError(error: StandardError, context?: string) {
    const logData = {
      code: error.code,
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
      statusCode: error.statusCode,
      details: error.details
    };
    
    if (error.code === 'NETWORK_ERROR' || error.code === 'SERVER_ERROR') {
      console.error('🚨 Critical Error:', logData);
    } else {
      console.warn('⚠️ Application Error:', logData);
    }
  }
}

// Convenience functions for common error handling patterns
export const handleApiError = (error: unknown, context?: string, options?: {
  showToast?: boolean;
  customMessage?: string;
  rethrow?: boolean;
}) => {
  const standardError = ErrorHandler.classify(error);
  const { showToast = true, customMessage, rethrow = false } = options || {};
  
  ErrorHandler.logError(standardError, context);
  ErrorHandler.showError(standardError, { showToast, customMessage });
  
  if (rethrow) {
    throw standardError;
  }
  
  return standardError;
};

// Async wrapper with standardized error handling
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, context);
      return null;
    }
  };
};

// React hook for form error handling
export const useErrorHandler = () => {
  const handleError = (error: unknown, context?: string) => {
    return handleApiError(error, context);
  };
  
  const handleApiCall = async <T>(
    apiCall: () => Promise<T>,
    context?: string,
    options?: { showToast?: boolean; customMessage?: string }
  ): Promise<T | null> => {
    try {
      return await apiCall();
    } catch (error) {
      handleApiError(error, context, options);
      return null;
    }
  };
  
  return { handleError, handleApiCall };
};

// Type guards for error checking
export const isNetworkError = (error: StandardError): error is NetworkError => {
  return error.code === 'NETWORK_ERROR';
};

export const isAuthError = (error: StandardError): error is AuthError => {
  return error.code === 'AUTH_ERROR';
};

export const isValidationError = (error: StandardError): error is ValidationError => {
  return error.code === 'VALIDATION_ERROR';
};

export const isServerError = (error: StandardError): error is ServerError => {
  return error.code === 'SERVER_ERROR';
};