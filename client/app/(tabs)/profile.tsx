// app/(tabs)/profile.tsx - Updated with Theme Integration
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/app/_layout";
import { useTheme } from "@/contexts/ThemeContext"; // Import theme hook
import { ToastService } from "@/utils/toastService";
import {
  User,
  Settings,
  LogOut,
  Palette,
  Shield,
  Bell,
  HelpCircle,
  Info,
  ChevronRight,
  Wallet,
} from "lucide-react-native";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { currentTheme, themeName } = useTheme(); // Use theme system

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            ToastService.showSuccess(
              "Signed Out",
              "You have been signed out successfully",
            );
          } catch (error) {
            ToastService.showError("Error", "Failed to sign out");
          }
        },
      },
    ]);
  };

  const navigateToThemeSelector = () => {
    router.push("/theme-selector");
  };

  const navigateToSettings = () => {
    router.push("/settings");
  };

  const menuItems = [
    {
      icon: Palette,
      title: "Theme",
      subtitle: `Current: ${themeName.charAt(0).toUpperCase() + themeName.slice(1)}`,
      onPress: navigateToThemeSelector,
      color: currentTheme.primary,
    },
    {
      icon: Settings,
      title: "Settings",
      subtitle: "App preferences and configuration",
      onPress: navigateToSettings,
      color: currentTheme.textSecondary,
    },
    {
      icon: Bell,
      title: "Notifications",
      subtitle: "Manage notification preferences",
      onPress: () => router.push("/modal"),
      color: currentTheme.accent,
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      subtitle: "Manage your privacy settings",
      onPress: () =>
        ToastService.showInfo(
          "Coming Soon",
          "Privacy settings will be available soon",
        ),
      color: currentTheme.info,
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      subtitle: "Get help or contact support",
      onPress: () => router.push("/help-support"),
      color: currentTheme.secondary,
    },
    {
      icon: Info,
      title: "About",
      subtitle: "App version and information",
      onPress: () => router.push("/about"),
      color: currentTheme.textSecondary,
    },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <StatusBar
        barStyle={
          themeName === "dark" || themeName === "luxe"
            ? "light-content"
            : "dark-content"
        }
        backgroundColor={currentTheme.surface}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View
          style={[
            styles.profileHeader,
            { backgroundColor: currentTheme.surface },
          ]}
        >
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: currentTheme.primary },
            ]}
          >
            <User size={32} color="#FFFFFF" />
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: currentTheme.text }]}>
              {user?.username || "Guest User"}
            </Text>
            <Text
              style={[styles.userEmail, { color: currentTheme.textSecondary }]}
            >
              {user?.email || "guest@example.com"}
            </Text>
            {user?.role === "admin" && (
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: currentTheme.accent },
                ]}
              >
                <Shield size={12} color="#FFFFFF" />
                <Text style={styles.roleText}>Admin</Text>
              </View>
            )}
          </View>
        </View>

        {/* Wallet Section */}
        <TouchableOpacity
          style={[
            styles.walletSection,
            { backgroundColor: currentTheme.surface },
          ]}
          onPress={() => router.push("/wallet/history" as any)}
        >
          <View style={styles.walletContent}>
            <View
              style={[
                styles.walletIcon,
                {
                  backgroundColor:
                    user && user.wallet_balance > 0
                      ? `${currentTheme.success}20`
                      : user && user.wallet_balance < 0
                        ? `${currentTheme.error}20`
                        : `${currentTheme.textSecondary}20`,
                },
              ]}
            >
              <Wallet
                size={20}
                color={
                  user && user.wallet_balance > 0
                    ? currentTheme.success
                    : user && user.wallet_balance < 0
                      ? currentTheme.error
                      : currentTheme.textSecondary
                }
              />
            </View>
            <View style={styles.walletInfo}>
              <Text style={[styles.walletTitle, { color: currentTheme.text }]}>
                Wallet Balance
              </Text>
              {user ? (
                (() => {
                  const balance = Number(user.wallet_balance);
                  return balance > 0 ? (
                    <Text
                      style={[
                        styles.walletBalance,
                        { color: currentTheme.success },
                      ]}
                    >
                      Credit: KES {balance.toFixed(2)}
                    </Text>
                  ) : balance < 0 ? (
                    <View>
                      <Text
                        style={[
                          styles.walletBalance,
                          { color: currentTheme.error },
                        ]}
                      >
                        Debt: KES {Math.abs(balance).toFixed(2)}
                      </Text>
                      <Text
                        style={[
                          styles.walletSubtitle,
                          { color: currentTheme.textSecondary },
                        ]}
                      >
                        Must use M-Pesa/Card for next order
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.walletBalance,
                        { color: currentTheme.textSecondary },
                      ]}
                    >
                      KES 0.00
                    </Text>
                  );
                })()
              ) : (
                <Text
                  style={[
                    styles.walletBalance,
                    { color: currentTheme.textSecondary },
                  ]}
                >
                  No wallet data
                </Text>
              )}
            </View>
          </View>
          <ChevronRight size={20} color={currentTheme.textSecondary} />
        </TouchableOpacity>

        {/* Admin Panel Access */}
        {user?.role === "admin" && (
          <TouchableOpacity
            style={[
              styles.adminPanel,
              { backgroundColor: currentTheme.surface },
            ]}
            onPress={() => router.push("/admin")}
          >
            <View style={styles.adminPanelContent}>
              <View
                style={[
                  styles.adminIcon,
                  { backgroundColor: currentTheme.primary },
                ]}
              >
                <Settings size={20} color="#FFFFFF" />
              </View>
              <View style={styles.adminInfo}>
                <Text style={[styles.adminTitle, { color: currentTheme.text }]}>
                  Admin Panel
                </Text>
                <Text
                  style={[
                    styles.adminSubtitle,
                    { color: currentTheme.textSecondary },
                  ]}
                >
                  Manage products, categories, and orders
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={currentTheme.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            Preferences
          </Text>

          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                { backgroundColor: currentTheme.surface },
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemContent}>
                <View
                  style={[
                    styles.menuIcon,
                    { backgroundColor: `${item.color}15` },
                  ]}
                >
                  <item.icon size={20} color={item.color} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text
                    style={[styles.menuItemTitle, { color: currentTheme.text }]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.menuItemSubtitle,
                      { color: currentTheme.textSecondary },
                    ]}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={currentTheme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: currentTheme.error },
            ]}
            onPress={handleLogout}
          >
            <LogOut size={20} color="#FFFFFF" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Profile Header
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Wallet Section
  walletSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  walletContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  walletInfo: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  walletSubtitle: {
    fontSize: 12,
    fontStyle: "italic",
  },

  // Admin Panel
  adminPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  adminPanelContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  adminIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  adminInfo: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  adminSubtitle: {
    fontSize: 14,
  },

  // Menu Section
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Logout Section
  logoutSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  bottomSpacing: {
    height: 20,
  },
});
