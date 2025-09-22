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
            type: 'error',
            text1: title,
            text2: subtitle,
            visibilityTime: 3500,
            autoHide: true,
            topOffset: 60,
            bottomOffset: 40,
        });
    }





}