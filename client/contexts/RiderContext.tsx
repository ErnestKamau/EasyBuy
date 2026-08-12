import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { deliveryApi } from '@/services/api';
import { ToastService } from '@/utils/toastService';

type RiderContextValue = {
  isOnline: boolean;
  currentLocation: { latitude: number; longitude: number } | null;
  locationAddress: string;
  isFetchingLocation: boolean;
  activeOrderId: number | null;
  setActiveOrderId: (id: number | null) => void;
  toggleOnline: (value: boolean) => void;
  fetchCurrentLocation: () => Promise<void>;
};

const RiderContext = createContext<RiderContextValue | null>(null);

export function RiderProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(false);
  const [locationSubscription, setLocationSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const activeOrderIdRef = useRef<number | null>(null);

  useEffect(() => {
    activeOrderIdRef.current = activeOrderId;
  }, [activeOrderId]);

  const pushLocation = async (
    latitude: number,
    longitude: number,
    extras?: { heading?: number; speed?: number }
  ) => {
    await deliveryApi.updateLocation(latitude, longitude, {
      heading: extras?.heading,
      speed: extras?.speed,
      orderId: activeOrderIdRef.current,
    });
  };

  const fetchCurrentLocation = useCallback(async () => {
    try {
      setIsFetchingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        ToastService.showError('Permission Denied', 'Location access is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude, heading, speed } = location.coords;
      setCurrentLocation({ latitude, longitude });
      await pushLocation(latitude, longitude, {
        heading: heading ?? 0,
        speed: speed ?? 0,
      });

      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address) {
        const formatted = `${address.name || ''}, ${address.street || ''}, ${address.city || ''}`;
        setLocationAddress(formatted.replace(/^, /, ''));
      }
    } catch (error) {
      console.error('Failed to fetch location:', error);
      ToastService.showError('Error', 'Failed to update location');
    } finally {
      setIsFetchingLocation(false);
    }
  }, []);

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      ToastService.showError('Permission Denied', 'Location access is required for tracking');
      return;
    }

    try {
      await fetchCurrentLocation();
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        async (location) => {
          const { latitude, longitude, heading, speed } = location.coords;
          setCurrentLocation({ latitude, longitude });
          pushLocation(latitude, longitude, {
            heading: heading ?? 0,
            speed: speed ?? 0,
          }).catch(console.error);
        }
      );
      setLocationSubscription(sub);
      setIsOnline(true);
      await deliveryApi.setOnlineStatus(true);
    } catch {
      ToastService.showError('Error', 'Failed to start location tracking');
    }
  };

  const stopTracking = async () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsOnline(false);
    try {
      await deliveryApi.setOnlineStatus(false);
    } catch {
      // ignore
    }
  };

  const toggleOnline = (value: boolean) => {
    if (value) startTracking();
    else stopTracking();
  };

  useEffect(() => {
    return () => {
      locationSubscription?.remove();
    };
  }, [locationSubscription]);

  return (
    <RiderContext.Provider
      value={{
        isOnline,
        currentLocation,
        locationAddress,
        isFetchingLocation,
        activeOrderId,
        setActiveOrderId,
        toggleOnline,
        fetchCurrentLocation,
      }}
    >
      {children}
    </RiderContext.Provider>
  );
}

export function useRider() {
  const ctx = useContext(RiderContext);
  if (!ctx) throw new Error('useRider must be used within RiderProvider');
  return ctx;
}
