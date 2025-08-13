/**
 * Standardized date utilities for consistent date handling across the application
 * Uses ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ) as the standard
 */

export type DateInput = string | Date | number | null | undefined;

/**
 * Converts various date inputs to ISO string format
 */
export const toISOString = (date: DateInput): string | null => {
  if (!date) return null;
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toISOString();
  } catch (error) {
    console.warn('Invalid date provided to toISOString:', date);
    return null;
  }
};

/**
 * Converts date to local date string (YYYY-MM-DD) for date inputs
 */
export const toLocalDateString = (date: DateInput): string => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    // Format as YYYY-MM-DD for HTML date inputs
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Invalid date provided to toLocalDateString:', date);
    return '';
  }
};

/**
 * Formats date for display to users
 */
export const formatDisplayDate = (
  date: DateInput, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString(undefined, options);
  } catch (error) {
    console.warn('Invalid date provided to formatDisplayDate:', date);
    return '';
  }
};

/**
 * Formats datetime for display to users
 */
export const formatDisplayDateTime = (
  date: DateInput,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString(undefined, options);
  } catch (error) {
    console.warn('Invalid date provided to formatDisplayDateTime:', date);
    return '';
  }
};

/**
 * Calculates age based on date of birth
 */
export const calculateAge = (dateOfBirth: DateInput): number | null => {
  if (!dateOfBirth) return null;
  
  try {
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return Math.max(0, age);
  } catch (error) {
    console.warn('Invalid date provided to calculateAge:', dateOfBirth);
    return null;
  }
};

/**
 * Gets relative time string (e.g., "2 hours ago", "3 days ago")
 */
export const getRelativeTime = (date: DateInput): string => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
    ];
    
    for (const interval of intervals) {
      const count = Math.floor(diffInSeconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
      }
    }
    
    return 'just now';
  } catch (error) {
    console.warn('Invalid date provided to getRelativeTime:', date);
    return '';
  }
};

// Legacy functions for backward compatibility
export const formatDate = (date: DateInput): string => {
  return formatDisplayDate(date) || 'N/A';
};

export const formatDateTime = (date: DateInput): string => {
  return formatDisplayDateTime(date) || 'N/A';
};