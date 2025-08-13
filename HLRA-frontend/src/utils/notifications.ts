import { toast } from 'sonner';

// Enhanced notification utility with consistent styling and behavior
export const notify = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
      className: 'healthcare-toast-success',
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000, // Longer duration for errors
      className: 'healthcare-toast-error',
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
      className: 'healthcare-toast-warning',
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
      className: 'healthcare-toast-info',
    });
  },

  loading: (message: string, description?: string) => {
    return toast.loading(message, {
      description,
      className: 'healthcare-toast-loading',
    });
  },

  // Healthcare-specific notifications
  fileUploaded: (filename: string) => {
    toast.success('File uploaded successfully!', {
      description: `${filename} is being processed`,
      duration: 4000,
    });
  },

  fileProcessed: (filename: string, parametersFound: number) => {
    toast.success('Lab report processed!', {
      description: `${filename} - Found ${parametersFound} parameters`,
      duration: 5000,
    });
  },

  fileProcessingFailed: (filename: string, error?: string) => {
    toast.error('Processing failed', {
      description: `Failed to process ${filename}${error ? `: ${error}` : ''}`,
      duration: 6000,
    });
  },

  healthAlert: (parameter: string, value: string, status: string) => {
    const isAbnormal = status === 'high' || status === 'low' || status === 'critical';
    
    if (isAbnormal) {
      toast.warning(`Health Alert: ${parameter}`, {
        description: `${parameter} is ${status} (${value})`,
        duration: 7000,
      });
    }
  },

  loginSuccess: (userName?: string) => {
    toast.success('Welcome back!', {
      description: userName ? `Hello ${userName}` : 'Login successful',
      duration: 3000,
    });
  },

  logoutSuccess: () => {
    toast.success('Logged out successfully', {
      description: 'See you next time!',
      duration: 3000,
    });
  },

  profileUpdated: () => {
    toast.success('Profile updated!', {
      description: 'Your changes have been saved',
      duration: 4000,
    });
  },

  dataExported: (type: string) => {
    toast.success(`${type} exported!`, {
      description: 'Download will start shortly',
      duration: 4000,
    });
  },

  // Dismiss all notifications
  dismissAll: () => {
    toast.dismiss();
  },

  // Promise-based notifications for async operations
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
      duration: 4000,
    });
  },
};

// Export individual methods for backward compatibility
export const {
  success: notifySuccess,
  error: notifyError,
  warning: notifyWarning,
  info: notifyInfo,
  loading: notifyLoading,
} = notify;