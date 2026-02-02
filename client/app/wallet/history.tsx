// app/wallet/history.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/app/_layout";
import { useTheme } from "@/contexts/ThemeContext";
import { Theme } from "@/constants/Themes";
import { walletApi, WalletTransaction } from "@/services/api";
import { ToastService } from "@/utils/toastService";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Calendar,
  Filter,
  CreditCard,
  ShoppingBag,
} from "lucide-react-native";

export default function WalletHistoryScreen() {
  const { user, refreshAuth } = useAuth();
  const { currentTheme, themeName } = useTheme();
  const isDark = themeName === "dark";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [summary, setSummary] = useState({
    current_balance: 0,
    total_credited: 0,
    total_spent: 0,
  });
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const styles = createStyles(currentTheme, isDark);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    // Reset and reload when filter changes
    setPage(1);
    loadTransactions(1, true);
  }, [filterType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, transactionsData] = await Promise.all([
        walletApi.getSummary(),
        walletApi.getTransactions({ page: 1 }), // Load first page initially
      ]);

      setSummary(summaryData);
      setTransactions(transactionsData.data);
      setHasMore(transactionsData.current_page < transactionsData.last_page);
    } catch (error) {
      ToastService.showApiError(error, "Failed to load wallet history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTransactions = async (
    pageNum: number,
    shouldReset: boolean = false,
  ) => {
    if ((!hasMore && !shouldReset) || (loadingMore && !shouldReset)) return;

    try {
      if (!shouldReset) setLoadingMore(true);

      const params: any = { page: pageNum };
      if (filterType !== "all") params.type = filterType;

      const data = await walletApi.getTransactions(params);

      if (shouldReset) {
        setTransactions(data.data);
      } else {
        setTransactions((prev) => [...prev, ...data.data]);
      }

      setHasMore(data.current_page < data.last_page);
      setPage(pageNum);
    } catch (error) {
      ToastService.showApiError(error, "Failed to load transactions");
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAuth(); // Update user balance in context
    await loadData();
  };

  const loadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      loadTransactions(page + 1);
    }
  };

  const getTransactionIcon = (type: string, description: string) => {
    if (type === "credit") {
      if (description.toLowerCase().includes("refund"))
        return <ArrowDownLeft size={20} color={currentTheme.success} />;
      return <Wallet size={20} color={currentTheme.success} />;
    } else {
      if (description.toLowerCase().includes("order"))
        return <ShoppingBag size={20} color={currentTheme.error} />;
      return <ArrowUpRight size={20} color={currentTheme.error} />;
    }
  };

  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => {
    const isCredit = item.type === "credit";
    const date = new Date(item.created_at);

    return (
      <View style={styles.transactionCard}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isCredit
                ? `${currentTheme.success}20`
                : `${currentTheme.error}20`,
            },
          ]}
        >
          {getTransactionIcon(item.type, item.description)}
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>{item.description}</Text>
          <Text style={styles.transactionDate}>
            {date.toLocaleDateString()} •{" "}
            {date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amountText,
              { color: isCredit ? currentTheme.success : currentTheme.error },
            ]}
          >
            {isCredit ? "+" : "-"} KES {item.amount.toLocaleString()}
          </Text>
          <Text style={styles.balanceAfter}>
            Bal:{" "}
            {item.balance_after !== undefined && item.balance_after !== null
              ? item.balance_after.toLocaleString()
              : "N/A"}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={currentTheme.surface}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet History</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text
                style={[
                  styles.balanceValue,
                  {
                    color:
                      summary.current_balance >= 0
                        ? currentTheme.success
                        : currentTheme.error,
                  },
                ]}
              >
                KES {summary.current_balance.toLocaleString()}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Spent</Text>
                  <Text style={styles.statValue}>
                    KES {summary.total_spent.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Credited</Text>
                  <Text style={styles.statValue}>
                    KES {summary.total_credited.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Filters */}
            <View style={styles.filterContainer}>
              {(["all", "credit", "debit"] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterButton,
                    filterType === type && {
                      backgroundColor: currentTheme.primary,
                    },
                  ]}
                  onPress={() => setFilterType(type)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filterType === type && { color: "#ffffff" },
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Transactions</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Wallet size={48} color={currentTheme.textSecondary} />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              style={{ padding: 20 }}
              color={currentTheme.primary}
            />
          ) : (
            <View style={{ height: 40 }} />
          )
        }
      />
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 16,
      backgroundColor: theme.surface,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },
    listContainer: {
      paddingBottom: 40,
    },

    // Balance Card
    balanceCard: {
      margin: 20,
      padding: 24,
      backgroundColor: theme.surface,
      borderRadius: 16,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    balanceLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 8,
    },
    balanceValue: {
      fontSize: 32,
      fontWeight: "800",
      marginBottom: 24,
    },
    statsRow: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: theme.border,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },

    // Filters
    filterContainer: {
      flexDirection: "row",
      paddingHorizontal: 20,
      marginBottom: 24,
      gap: 12,
    },
    filterButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    filterText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginLeft: 20,
      marginBottom: 12,
    },

    // Transaction Item
    transactionCard: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 16,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    transactionDetails: {
      flex: 1,
    },
    transactionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    transactionDate: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    amountContainer: {
      alignItems: "flex-end",
    },
    amountText: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 4,
    },
    balanceAfter: {
      fontSize: 12,
      color: theme.textSecondary,
    },

    emptyState: {
      alignItems: "center",
      padding: 40,
    },
    emptyText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.textSecondary,
    },
  });
