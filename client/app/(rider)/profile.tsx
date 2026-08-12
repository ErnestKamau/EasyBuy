import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Star, LogOut, Truck } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useRider } from '@/contexts/RiderContext';
import { deliveryApi, RiderProfile } from '@/services/api';
import { ToastService } from '@/utils/toastService';
import {
  Text,
  Surface,
  Button,
  Switch,
  Avatar,
  Spinner,
  KeyValueRow,
  Divider,
} from '@/components/ui';

export default function RiderProfileScreen() {
  const theme = useAppTheme();
  const { user, logout } = useAuth();
  const { isOnline, toggleOnline, locationAddress, currentLocation, fetchCurrentLocation } =
    useRider();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await deliveryApi.getRiderProfile();
      setProfile(data);
    } catch {
      ToastService.showError('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const rating = profile?.average_rating ?? 0;
  const ratingCount = profile?.rating_count ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingBottom: 120 }}>
        {loading && !profile ? (
          <Spinner size="large" />
        ) : (
          <>
            <Surface variant="elevated" padding={5} radius="lg" style={{ alignItems: 'center', marginBottom: theme.spacing[5] }}>
              <Avatar
                name={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`}
                size="xl"
              />
              <Text variant="h3" style={{ marginTop: theme.spacing[4] }}>
                {user?.first_name} {user?.last_name}
              </Text>
              <Text variant="bodySmall" color="secondary">
                {user?.email}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing[3] }}>
                <Star
                  size={18}
                  color={theme.colors.warning}
                  fill={rating > 0 ? theme.colors.warning : 'transparent'}
                />
                <Text variant="title">
                  {rating > 0 ? rating.toFixed(1) : '—'}
                </Text>
                <Text variant="caption" color="muted">
                  ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
                </Text>
              </View>
            </Surface>

            <Surface variant="elevated" padding={4} radius="lg" style={{ marginBottom: theme.spacing[5] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="label">Availability</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                  <Text
                    variant="caption"
                    style={{
                      color: isOnline ? theme.colors.success : theme.colors.textSecondary,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                  <Switch value={isOnline} onValueChange={toggleOnline} />
                </View>
              </View>
              <Divider style={{ marginVertical: theme.spacing[4] }} />
              <KeyValueRow label="Location" value={locationAddress || 'Not set'} />
              {currentLocation && (
                <KeyValueRow
                  label="Coords"
                  value={`${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`}
                />
              )}
              <Button
                title="Refresh location"
                variant="secondary"
                onPress={fetchCurrentLocation}
                style={{ marginTop: theme.spacing[3] }}
              />
            </Surface>

            <Surface variant="elevated" padding={4} radius="lg" style={{ marginBottom: theme.spacing[5] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], marginBottom: theme.spacing[3] }}>
                <Truck size={18} color={theme.colors.primary} />
                <Text variant="label">Vehicle</Text>
              </View>
              <KeyValueRow label="Type" value={profile?.vehicle_type || user?.vehicle_type || '—'} />
              <KeyValueRow label="Model" value={profile?.vehicle_model || user?.vehicle_model || '—'} />
              <KeyValueRow
                label="Plate"
                value={profile?.vehicle_registration || user?.vehicle_registration || '—'}
              />
            </Surface>

            <Button
              title="Log out"
              variant="danger"
              onPress={handleLogout}
              leftIcon={<LogOut size={18} color={theme.colors.textOnPrimary} />}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
