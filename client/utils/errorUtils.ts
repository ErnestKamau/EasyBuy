// utils/errorUtils.ts

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
      detail?: string;
      [key: string]: any;
    };
    status?: number;
  };
  message?: string;
  name?: string;
}

/**
 * Type guard to check if an error is an API error with response property
 */
export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'message' in error || 'name' in error)
  );
}

/**
 * Check if an error is a 401 (Unauthorized) error
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (!isApiError(error)) {
    return false;
  }
  
  // Check status code directly
  if (error.response?.status === 401) {
    return true;
  }
  
  // Check error message content
  const errorMessage = error.message?.toLowerCase() || '';
  const detailMessage = error.response?.data?.detail?.toLowerCase() || '';
  const errorContent = error.response?.data?.error?.toLowerCase() || '';
  
  return (
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('401') ||
    detailMessage.includes('unauthorized') ||
    detailMessage.includes('credentials') ||
    errorContent.includes('unauthorized') ||
    errorContent.includes('credentials')
  );
}

/**
 * Check if an error is a network/connection error
 */
export function isNetworkError(error: unknown): boolean {
  if (!isApiError(error)) {
    return false;
  }
  
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('network error') ||
    message.includes('timeout') ||
    message.includes('connection')
  );
}

/**
 * Get a human-readable error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (isApiError(error)) {
    // Try to get specific API error messages
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    
    if (error.message) {
      return error.message;
    }
  }
  
  return 'An unexpected error occurred';
}

/**
 * Handles common error scenarios for API calls
 * Returns true if the error was handled (e.g., redirected to auth)
 */
export function handleCommonErrors(
  error: unknown, 
  onUnauthorized: () => void,
  onError?: (message: string) => void
): boolean {
  if (isUnauthorizedError(error)) {
    console.log('Unauthorized error detected, redirecting to auth');
    onUnauthorized();
    return true;
  }
  
  if (isNetworkError(error)) {
    const message = 'Network error. Please check your connection and try again.';
    console.log('Network error detected:', getErrorMessage(error));
    onError?.(message);
    return true;
  }
  
  // Not a handled error
  return false;
}