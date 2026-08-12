/**
 * Shared message intents — emails and in-app notifications use the same map.
 * Colors come from the theme; never hardcode hex here.
 */
import { AppTheme } from './themes';
import {
  Bell,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  Package,
  Truck,
  Star,
  Shield,
  RotateCcw,
  LucideIcon,
} from 'lucide-react-native';

export type MessageIntent =
  | 'success'
  | 'delivery'
  | 'security'
  | 'warning'
  | 'danger'
  | 'info'
  | 'brand';

export function getIntentColors(theme: AppTheme, intent: MessageIntent) {
  switch (intent) {
    case 'success':
      return { accent: theme.colors.success, muted: theme.colors.successMuted };
    case 'delivery':
      return { accent: theme.colors.info, muted: theme.colors.infoMuted };
    case 'security':
      return { accent: theme.colors.secondary, muted: theme.colors.primaryMuted };
    case 'warning':
      return { accent: theme.colors.warning, muted: theme.colors.warningMuted };
    case 'danger':
      return { accent: theme.colors.error, muted: theme.colors.dangerMuted };
    case 'info':
      return { accent: theme.colors.info, muted: theme.colors.infoMuted };
    case 'brand':
    default:
      return { accent: theme.colors.primary, muted: theme.colors.primaryMuted };
  }
}

const TYPE_INTENT: Record<string, MessageIntent> = {
  order_placed: 'brand',
  order_confirmed: 'success',
  order_cancelled: 'danger',
  payment_received: 'success',
  payment_received_admin: 'success',
  sale_fully_paid: 'success',
  refund_processed: 'info',
  debt_warning_2days: 'warning',
  debt_warning_admin_2days: 'warning',
  debt_overdue: 'danger',
  debt_overdue_admin: 'danger',
  low_stock_alert: 'warning',
  new_product_available: 'brand',
  delivery_assigned: 'delivery',
  delivery_accepted: 'delivery',
  package_on_the_way: 'delivery',
  driver_arrived: 'delivery',
  delivery_fulfilled: 'success',
  delivery_assignment_timeout: 'warning',
  delivery_needs_reassign: 'warning',
  driver_rated: 'brand',
};

const TYPE_ICON: Record<string, LucideIcon> = {
  order_placed: ShoppingBag,
  order_confirmed: ShoppingBag,
  order_cancelled: ShoppingBag,
  payment_received: CreditCard,
  payment_received_admin: CreditCard,
  sale_fully_paid: CreditCard,
  refund_processed: RotateCcw,
  debt_warning_2days: AlertTriangle,
  debt_warning_admin_2days: AlertTriangle,
  debt_overdue: AlertTriangle,
  debt_overdue_admin: AlertTriangle,
  low_stock_alert: Package,
  new_product_available: Package,
  delivery_assigned: Truck,
  delivery_accepted: Truck,
  package_on_the_way: Truck,
  driver_arrived: Truck,
  delivery_fulfilled: Truck,
  delivery_assignment_timeout: Truck,
  delivery_needs_reassign: Truck,
  driver_rated: Star,
};

export function getNotificationIntent(type: string): MessageIntent {
  return TYPE_INTENT[type] ?? 'brand';
}

export function getNotificationIcon(type: string): LucideIcon {
  if (type.includes('verif') || type.includes('password') || type.includes('security')) {
    return Shield;
  }
  return TYPE_ICON[type] ?? Bell;
}
