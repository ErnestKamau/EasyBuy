import Toast from 'react-native-toast-message'

export type ToastType = 'success' | 'error' |'info' | 'warning' ;

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

function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    (
      'response' in error ||
      'message' in error ||
      'name' in error
    )
  );
}


export class ToastService {

    private static readonly STATUS_MESSAGES: Record<number, string> = {
        400: 'Bad request. Please check your input.',
        401: 'Invalid credentials. Please check your username and password.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource was not found.',
        500: 'Server error occurred. Please try again later.',
        502: 'Server error occurred. Please try again later.',
        503: 'Server error occurred. Please try again later.',
        504: 'Server error occurred. Please try again later.',
    };

    static showSuccess(title: string, subtitle?: string) {
        Toast.show({
            type: 'success',
            text1: title,
            text2: subtitle,
            visibilityTime: 3000,
            autoHide: true,
            topOffset: 60,
            bottomOffset: 40,
        });
    }

    static showError(title: string, subtitle?: string) {
        Toast.show({
            type: 'error',
            text1: title,
            text2: subtitle,
            visibilityTime: 4000,
            autoHide: true,
            topOffset: 60,
            bottomOffset: 40,
        });
    }

    static showInfo(title: string, subtitle?: string) {
        Toast.show({
            type: 'info',
            text1: title,
            text2: subtitle,
            visibilityTime: 3000,
            autoHide: true,
            topOffset: 60,
            bottomOffset: 40,
        });
    }

    static showWarning(title: string, subtitle?: string) {
        Toast.show({
            type: 'warning',
            text1: title,
            text2: subtitle,
            visibilityTime: 3500,
            autoHide: true,
            topOffset: 60,
            bottomOffset: 40,
        });
    }

    static handleApiError(error: unknown): string {
        console.log('Full error object:', error);

        const nonApiErrorMessage = this.handleNonApiError(error);
        if (nonApiErrorMessage) {
            return nonApiErrorMessage;  // Exit early if we found a non-API error
        }

        return this.handleApiErrorResponse(error as ApiErrorResponse);
    }

    private static handleNonApiError(error: unknown): string | null {
        if (!isApiError(error)) {
            if (typeof error === 'string') {
                return error;
            }
            
            if (error instanceof Error) {
                return error.message || 'An unexpected error occurred';
            }
            
            return 'An unexpected error occurred. Please try again.';
        }
        
        // Return null means "this is an API error, handle it elsewhere"
        return null;
    }

    private static handleApiErrorResponse(error: ApiErrorResponse): string {
        const networkError = this.handleNetworkErrors(error);
        if (networkError) {
            return networkError;
        }

        const responseError = this.handleResponseErrors(error);
        if (responseError) {
            return responseError;
        }

        return error.message || 'An unexpected error occurred. Please try again.';
    }

    private static handleNetworkErrors(error: ApiErrorResponse): string | null {
        if (error.message === 'Network Error') {
            return 'Unable to connect to server. Please check your internet connection.';
        }

        if (error.message?.includes('timeout')) {
            return 'Request timed out. Please try again.';
        }

        return null;
    }

    private static handleResponseErrors(error: ApiErrorResponse): string | null {
        if (!error.response?.data) {
            return null;
        }

        const { data, status } = error.response;

        const specificError = this.getSpecificErrorMessage(data);
        if (specificError) {
            return specificError;
        }

        if (status !== undefined) {
            return this.getStatusCodeMessage(status, data);
        }

        return null
    }

    private static getSpecificErrorMessage(data: any): string | null {
        if (data.error) {
            return data.error;
        }

        if (data.detail) {
            return data.detail;
        }

        return null;
    }

    private static getStatusCodeMessage(status: number, data: any): string | null {
        if (status === 400 || status === 422) {
            return this.parseValidationErrors(data);
        }

        if (status >= 500) {
            // Check if it's a database constraint violation that we can parse
            const constraintError = this.parseDatabaseConstraintError(data);
            if (constraintError) {
                return constraintError;
            }
            return 'Server error occurred. Please try again later.';
        }

        // Use lookup table for other status codes (much faster than multiple ifs)
        return this.STATUS_MESSAGES[status] || null;
    }

    private static parseValidationErrors(data: any): string {
        const errors: string[] = [];
    
        // Handle Laravel validation errors structure
        if (data.errors) {
            for (const [fieldName, fieldErrors] of Object.entries(data.errors)) {
                if (Array.isArray(fieldErrors)) {
                    const humanFieldName = this.humanizeFieldName(fieldName);
                
                    fieldErrors.forEach((errorMsg: string) => {
                        errors.push(`${humanFieldName}: ${errorMsg}`);
                    });
                }
            }
        } else {
            // Handle direct field errors (fallback)
            for (const [fieldName, fieldErrors] of Object.entries(data)) {
                if (Array.isArray(fieldErrors)) {
                    const humanFieldName = this.humanizeFieldName(fieldName);
                
                    fieldErrors.forEach((errorMsg: string) => {
                        errors.push(`${humanFieldName}: ${errorMsg}`);
                    });
                } else if (typeof fieldErrors === 'string') {
                    // Single error message for a field
                    const humanFieldName = this.humanizeFieldName(fieldName);
                    errors.push(`${humanFieldName}: ${fieldErrors}`);
                }
            }
        }
        
        if (errors.length === 0 && data.message) {
            // If no field-specific errors, use the general message
            return data.message;
        }
        
        return errors.length > 3 
        ? `${errors.slice(0, 2).join('\n')} and ${errors.length - 2} more errors...`
        : errors.join('\n');
    }

    private static parseDatabaseConstraintError(data: any): string | null {
        // Check if error message contains database constraint violation info
        const errorMessage = data?.message || data?.error || '';
        
        if (typeof errorMessage === 'string') {
            // Check for duplicate entry patterns
            if (errorMessage.includes('Duplicate entry')) {
                if (errorMessage.includes('username') || errorMessage.includes('users_username_unique')) {
                    return 'This username is already taken. Please choose another one.';
                }
                if (errorMessage.includes('email') || errorMessage.includes('users_email_unique')) {
                    return 'This email address is already registered. Please use a different email or try logging in.';
                }
                if (errorMessage.includes('phone_number') || errorMessage.includes('users_phone_number_unique')) {
                    return 'This phone number is already registered. Please use a different phone number or try logging in.';
                }
                return 'This information is already registered. Please check your details and try again.';
            }
        }
        
        return null;
    }

    private static humanizeFieldName(fieldName: string): string {
        const fieldMap: Record<string, string> = {
            'username': 'Username',
            'email': 'Email',
            'password': 'Password',
            'password_confirm': 'Password confirmation',
            'password_confirmation': 'Password confirmation',
            'phone_number': 'Phone number',
            'first_name': 'First name',
            'last_name': 'Last name',
            'general': '',
        };
        
        const mapped = fieldMap[fieldName];
        if (mapped === '') {
            // For general errors, don't prefix with field name
            return '';
        }
        
        return mapped || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    static showApiError(error: unknown, customTitle?: string) {
        const errorMessage = this.handleApiError(error);
        this.showError(customTitle || 'Error', errorMessage);
    }

}