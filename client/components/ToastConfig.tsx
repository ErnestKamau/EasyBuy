// components/ToastConfig.tsx - Enhanced with Lottie animations (with fallback)
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  AlertTriangle 
} from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeOutUp,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Calculate responsive dimensions
const TOAST_WIDTH = SCREEN_WIDTH - 32; // 16px padding on each side
const TOAST_MIN_HEIGHT = 80; // Minimum height for visibility

// Lottie Animation Component with auto-play and fallback
const AnimatedIcon = ({ 
  source, 
  size = 56, 
  fallbackIcon: FallbackIcon,
  fallbackColor 
}: { 
  source?: any; 
  size?: number;
  fallbackIcon?: any;
  fallbackColor?: string;
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    animationRef.current?.play();
  }, []);

  // Use Lottie if source exists, otherwise use fallback icon
  if (source) {
    try {
      return (
        <LottieView
          ref={animationRef}
          source={source}
          style={{ width: size, height: size }}
          autoPlay
          loop={false}
        />
      );
    } catch (error) {
      // Fallback to icon if Lottie fails
      if (FallbackIcon) {
        return <FallbackIcon size={size * 0.5} color={fallbackColor || "#FFFFFF"} strokeWidth={2.5} />;
      }
    }
  }

  // Default fallback
  if (FallbackIcon) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <FallbackIcon size={size * 0.5} color={fallbackColor || "#FFFFFF"} strokeWidth={2.5} />
      </View>
    );
  }

  return null;
};

export const toastConfig = {
  /*
    SUCCESS TOAST
    Green theme with animated checkmark
  */
  success: (props: any) => (
    <Animated.View 
      entering={FadeInDown.springify().damping(15)}
      exiting={FadeOutUp.springify()}
      style={styles.toastContainer}
    >
      <View style={[styles.toast, styles.successToast]}>
        {/* Lottie Animated Icon with fallback */}
        <View style={styles.iconContainer}>
          <AnimatedIcon 
            source={require('@/assets/lottie/success.json')}
            size={56}
            fallbackIcon={CheckCircle}
            fallbackColor="#FFFFFF"
          />
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          <Text style={[styles.title, styles.successTitle]} numberOfLines={2}>
            {props.text1}
          </Text>
          {props.text2 && (
            <Text style={[styles.message, styles.successMessage]} numberOfLines={3}>
              {props.text2}
            </Text>
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, styles.successProgressBar]} />
        </View>
      </View>
    </Animated.View>
  ),

  /*
    ERROR TOAST
    Red theme with animated X icon
  */
  error: (props: any) => (
    <Animated.View 
      entering={FadeInDown.springify().damping(15)}
      exiting={FadeOutUp.springify()}
      style={styles.toastContainer}
    >
      <View style={[styles.toast, styles.errorToast]}>
        <View style={styles.iconContainer}>
          <AnimatedIcon 
            source={require('@/assets/lottie/error.json')}
            size={56}
            fallbackIcon={XCircle}
            fallbackColor="#FFFFFF"
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.title, styles.errorTitle]} numberOfLines={2}>
            {props.text1}
          </Text>
          {props.text2 && (
            <Text style={[styles.message, styles.errorMessage]} numberOfLines={3}>
              {props.text2}
            </Text>
          )}
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, styles.errorProgressBar]} />
        </View>
      </View>
    </Animated.View>
  ),

  /*
    INFO TOAST
    Blue theme with animated info icon
  */
  info: (props: any) => (
    <Animated.View 
      entering={FadeInDown.springify().damping(15)}
      exiting={FadeOutUp.springify()}
      style={styles.toastContainer}
    >
      <View style={[styles.toast, styles.infoToast]}>
        <View style={styles.iconContainer}>
          <AnimatedIcon 
            source={require('@/assets/lottie/info.json')}
            size={56}
            fallbackIcon={AlertCircle}
            fallbackColor="#FFFFFF"
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.title, styles.infoTitle]} numberOfLines={2}>
            {props.text1}
          </Text>
          {props.text2 && (
            <Text style={[styles.message, styles.infoMessage]} numberOfLines={3}>
              {props.text2}
            </Text>
          )}
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, styles.infoProgressBar]} />
        </View>
      </View>
    </Animated.View>
  ),

  /*
    WARNING TOAST
    Orange/amber theme with animated warning icon
  */
  warning: (props: any) => (
    <Animated.View 
      entering={FadeInDown.springify().damping(15)}
      exiting={FadeOutUp.springify()}
      style={styles.toastContainer}
    >
      <View style={[styles.toast, styles.warningToast]}>
        <View style={styles.iconContainer}>
          <AnimatedIcon 
            source={require('@/assets/lottie/warning.json')}
            size={56}
            fallbackIcon={AlertTriangle}
            fallbackColor="#FFFFFF"
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.title, styles.warningTitle]} numberOfLines={2}>
            {props.text1}
          </Text>
          {props.text2 && (
            <Text style={[styles.message, styles.warningMessage]} numberOfLines={3}>
              {props.text2}
            </Text>
          )}
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, styles.warningProgressBar]} />
        </View>
      </View>
    </Animated.View>
  ),
};

const styles = StyleSheet.create({
  // Container that holds the toast
  toastContainer: {
    width: TOAST_WIDTH,
    alignSelf: 'center',
    marginTop: Platform.OS === 'ios' ? 50 : 20,
  },

  // Base toast styling - shared by all types
  toast: {
    width: '100%',
    minHeight: TOAST_MIN_HEIGHT,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    // Border for definition
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },

  // Icon container - holds the Lottie animation
  iconContainer: {
    marginRight: 14,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content area - holds title and message
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },

  // Title text styling
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 22,
    letterSpacing: 0.2,
  },

  // Message text styling
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    opacity: 0.9,
    letterSpacing: 0.1,
  },

  // Progress bar container at bottom
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },

  // Animated progress bar
  progressBar: {
    height: '100%',
    width: '100%',
  },

  // SUCCESS VARIANTS
  successToast: {
    backgroundColor: '#F0FDF4', // Light green tint
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  successTitle: {
    color: '#166534',
  },
  successMessage: {
    color: '#15803D',
  },
  successProgressBar: {
    backgroundColor: '#22C55E',
  },

  // ERROR VARIANTS
  errorToast: {
    backgroundColor: '#FEF2F2', // Light red tint
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorTitle: {
    color: '#991B1B',
  },
  errorMessage: {
    color: '#B91C1C',
  },
  errorProgressBar: {
    backgroundColor: '#EF4444',
  },

  // INFO VARIANTS
  infoToast: {
    backgroundColor: '#EFF6FF', // Light blue tint
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    color: '#1E40AF',
  },
  infoMessage: {
    color: '#1D4ED8',
  },
  infoProgressBar: {
    backgroundColor: '#3B82F6',
  },

  // WARNING VARIANTS
  warningToast: {
    backgroundColor: '#FFFBEB', // Light amber tint
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningTitle: {
    color: '#92400E',
  },
  warningMessage: {
    color: '#B45309',
  },
  warningProgressBar: {
    backgroundColor: '#F59E0B',
  },
});
