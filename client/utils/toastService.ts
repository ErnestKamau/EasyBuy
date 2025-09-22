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

    private static parseValidationErrors(data: any): string {
        const errors: string[] = [];
    
        for (const [fieldName, fieldErrors] of Object.entries(data)) {
            if (Array.isArray(fieldErrors)) {
                const humanFieldName = this.humanizeFieldName(fieldName);
            
                fieldErrors.forEach((errorMsg: string) => {
                    errors.push(`${humanFieldName}: ${errorMsg}`);
                });
            }
        }
        
        return errors.length > 3 
        ? `${errors.slice(0, 2).join('\n')} and ${errors.length - 2} more errors...`
        : errors.join('\n');
    }

    private static humanizeFieldName(fieldName: string): string {
        const fieldMap: Record<string, string> = {
            'username': 'Username',
            'email': 'Email',
            'password': 'Password',
            'password_confirm': 'Password confirmation',
            'phone_number': 'Phone number',
            'first_name': 'First name',
            'last_name': 'Last name',
        };
        
        return fieldMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    static showApiError(error: unknown, customTitle?: string) {
        const errorMessage = this.handleApiError(error);
        this.showError(customTitle || 'Error', errorMessage);
    }

}