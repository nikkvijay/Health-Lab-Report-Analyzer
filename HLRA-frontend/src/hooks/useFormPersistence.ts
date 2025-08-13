import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface FormPersistenceOptions {
  key: string;
  clearOnSubmit?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface PersistedFormData {
  data: any;
  timestamp: number;
  version: string;
}

export function useFormPersistence<T extends Record<string, any>>(
  initialData: T,
  options: FormPersistenceOptions
) {
  const {
    key,
    clearOnSubmit = true,
    autoSave = true,
    autoSaveDelay = 1000
  } = options;
  
  const [formData, setFormData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const storageKey = `form_persistence_${key}`;
  const version = '1.0';

  // Load persisted data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: PersistedFormData = JSON.parse(saved);
        
        // Check version compatibility
        if (parsed.version === version) {
          const savedDate = new Date(parsed.timestamp);
          const hoursSinceLastSave = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
          
          // Only restore if saved within last 24 hours
          if (hoursSinceLastSave < 24) {
            setFormData({ ...initialData, ...parsed.data });
            setLastSaved(savedDate);
            setHasUnsavedChanges(true);
            
            toast.info('Form data restored', {
              description: `Restored your previous work from ${savedDate.toLocaleTimeString()}`,
              action: {
                label: 'Clear',
                onClick: () => clearPersistedData()
              }
            });
          } else {
            // Clear old data
            localStorage.removeItem(storageKey);
          }
        }
      }
    } catch (error) {
      console.error('Error loading persisted form data:', error);
      localStorage.removeItem(storageKey);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, version]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || isLoading) return;

    const timeoutId = setTimeout(() => {
      saveToStorage();
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [formData, autoSave, autoSaveDelay, isLoading]);

  const saveToStorage = useCallback(() => {
    try {
      const dataToSave: PersistedFormData = {
        data: formData,
        timestamp: Date.now(),
        version
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving form data:', error);
      toast.error('Failed to save form data');
    }
  }, [formData, storageKey, version]);

  const clearPersistedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setLastSaved(null);
      setHasUnsavedChanges(false);
      toast.success('Form data cleared');
    } catch (error) {
      console.error('Error clearing persisted data:', error);
    }
  }, [storageKey]);

  const updateFormData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setFormData(prev => {
      const newData = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      setHasUnsavedChanges(true);
      return newData;
    });
  }, []);

  const handleSubmitSuccess = useCallback(() => {
    if (clearOnSubmit) {
      clearPersistedData();
    }
  }, [clearOnSubmit, clearPersistedData]);

  const handleNetworkError = useCallback((error: any) => {
    // Save form data when network error occurs
    saveToStorage();
    
    toast.error('Network error occurred', {
      description: 'Your form data has been saved and will be restored when you return.',
      duration: 5000,
    });
  }, [saveToStorage]);

  return {
    formData,
    updateFormData,
    isLoading,
    lastSaved,
    hasUnsavedChanges,
    saveToStorage,
    clearPersistedData,
    handleSubmitSuccess,
    handleNetworkError,
    setFormData,
  };
}

// Hook for handling network-aware form submissions
export function useNetworkAwareSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitWithRetry = useCallback(async (
    submitFn: () => Promise<any>,
    options?: {
      maxRetries?: number;
      retryDelay?: number;
      onNetworkError?: (error: any) => void;
      onSuccess?: () => void;
    }
  ) => {
    const { 
      maxRetries = 3, 
      retryDelay = 1000,
      onNetworkError,
      onSuccess
    } = options || {};
    
    setIsSubmitting(true);
    setSubmitError(null);

    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await submitFn();
        setIsSubmitting(false);
        onSuccess?.();
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a network error
        const isNetworkError = !error.response || error.code === 'ECONNREFUSED' || error.message?.includes('Network Error');
        
        if (isNetworkError) {
          onNetworkError?.(error);
          
          if (attempt < maxRetries) {
            toast.info(`Connection failed. Retrying... (${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            continue;
          } else {
            setSubmitError('Network connection failed. Please check your connection and try again.');
          }
        } else {
          // Non-network error, don't retry
          setSubmitError(error.response?.data?.detail || error.message || 'An error occurred');
          break;
        }
      }
    }
    
    setIsSubmitting(false);
    throw lastError;
  }, []);

  return {
    submitWithRetry,
    isSubmitting,
    submitError,
    clearError: () => setSubmitError(null)
  };
}