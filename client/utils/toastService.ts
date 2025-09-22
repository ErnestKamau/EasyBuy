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


export class ToastService {

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

    static ShowError(title: string, subtitle?: string) {
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

    static handleApiError(error: ApiErrorResponse): string {
        console.log('Full error object:', error);

        if (error.message === 'Network Error') {
            return 'Unable to connect to server. Please check your internet connection';
        }

        if (error.message?.includes('timeout')) {
            return 'Request timed out. Please try again.';
        }

        if (error.response?.data) {
            const { data, status } = error.response;
            if (data.error) {
                return data.error;
            }
            if (data.detail) {
                return data.detail;
            }
            if (status === 400) {
                return this.parseValidationErrors(data);
            }
            if (status === 401) {
                return 'Invalid credentials. Please check your username and password.';
            }
            if (status === 403) {
                return 'You do not have permission to perform this action.';
            }
            // Not found errors (status 404)
            if (status === 404) {
                return 'The requested resource was Not found.';
            }
            if (status && status >= 500) {
                return 'Server error occurred. Please try again later.';
            }
        }

        // Generic axios error message
        if (error.message) {
            return error.message;
        }

        return 'An unexpected error occurred. Please try again.';
    }

    /*** Django often returns validation errors as: { field_name: ["Error message"] }*/
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





}