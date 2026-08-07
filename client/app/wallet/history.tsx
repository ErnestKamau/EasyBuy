// app/wallet/history.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, RefreshControl, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useAppTheme } from "@/contexts/ThemeContext";
import { walletApi, WalletTransaction } from "@/services/api";
import { ToastService } from "@/utils/toastService";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ShoppingBag,
} from "lucide-react-native";
import { AppTheme } from "@/design";
import { Text, IconButton, Chip, EmptyState, SkeletonList, Spinner } from "@/components/ui";

export default function WalletHistoryScreen() {
  const { user, refreshAuth } = useAuth();
  const theme = useAppTheme();
  const isDark = theme.mode === "dark";

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

  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => (
    <TransactionRow transaction={item} theme={theme} />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.surface}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing[6],
            paddingTop: theme.spacing[11],
            paddingBottom: theme.spacing[5],
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <IconButton
          icon={<ArrowLeft size={theme.iconSize.lg} color={theme.colors.text} />}
          onPress={() => router.back()}
          accessibilityLabel="Back"
        />
        <Text variant="title">Wallet History</Text>
        <View style={{ width: theme.touchTarget }} />
      </View>

      {loading ? (
        <View style={{ padding: theme.spacing[6] }}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: theme.spacing[9] }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <>
              <BalanceCard summary={summary} theme={theme} />

              <View
                style={{
                  flexDirection: "row",
                  gap: theme.spacing[3],
                  paddingHorizontal: theme.spacing[6],
                  marginBottom: theme.spacing[6],
                }}
              >
                {(["all", "credit", "debit"] as const).map((type) => (
                  <Chip
                    key={type}
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                    selected={filterType === type}
                    onPress={() => setFilterType(type)}
                  />
                ))}
              </View>

              <Text
                variant="title"
                style={{ marginLeft: theme.spacing[6], marginBottom: theme.spacing[4] }}
              >
                Transactions
              </Text>
            </>
          }
          ListEmptyComponent={
            <EmptyState
              title="No transactions found"
              message="Your wallet activity will show up here"
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: theme.spacing[6] }}>
                <Spinner />
              </View>
            ) : (
              <View style={{ height: theme.spacing[9] }} />
            )
          }
        />
      )}
    </View>
  );
}

const BalanceCard = ({
  summary,
  theme,
}: {
  summary: { current_balance: number; total_credited: number; total_spent: number };
  theme: AppTheme;
}) => (
  <LinearGradient
    colors={[theme.colors.primary, theme.colors.secondary]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      margin: theme.spacing[6],
      padding: theme.spacing[7],
      borderRadius: theme.radius.xl,
      alignItems: "center",
      ...theme.getElevation("elv300"),
    }}
  >
    <Text variant="label" style={{ color: theme.colors.textOnPrimary, opacity: 0.8 }}>
      Current Balance
    </Text>
    <Text
      variant="display"
      style={{ color: theme.colors.textOnPrimary, marginTop: theme.spacing[2], marginBottom: theme.spacing[6] }}
    >
      KES {summary.current_balance.toLocaleString()}
    </Text>
    <View
      style={{
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: theme.spacing[4],
        borderTopWidth: StyleSheet.hairlineWidth * 2,
        borderTopColor: "rgba(255,255,255,0.25)",
      }}
    >
      <View style={{ flex: 1, alignItems: "center" }}>
        <Text variant="caption" style={{ color: theme.colors.textOnPrimary, opacity: 0.8 }}>
          Total Spent
        </Text>
        <Text variant="label" style={{ color: theme.colors.textOnPrimary, marginTop: theme.spacing[1] }}>
          KES {summary.total_spent.toLocaleString()}
        </Text>
      </View>
      <View style={{ width: StyleSheet.hairlineWidth * 2, height: 40, backgroundColor: "rgba(255,255,255,0.25)" }} />
      <View style={{ flex: 1, alignItems: "center" }}>
        <Text variant="caption" style={{ color: theme.colors.textOnPrimary, opacity: 0.8 }}>
          Total Credited
        </Text>
        <Text variant="label" style={{ color: theme.colors.textOnPrimary, marginTop: theme.spacing[1] }}>
          KES {summary.total_credited.toLocaleString()}
        </Text>
      </View>
    </View>
  </LinearGradient>
);

const TransactionRow = ({
  transaction,
  theme,
}: {
  transaction: WalletTransaction;
  theme: AppTheme;
}) => {
  const isCredit = transaction.type === "credit";
  const date = new Date(transaction.created_at);
  const isRefund = transaction.description.toLowerCase().includes("refund");
  const isOrderDebit = transaction.description.toLowerCase().includes("order");

  const Icon = isCredit
    ? isRefund
      ? ArrowDownLeft
      : Wallet
    : isOrderDebit
      ? ShoppingBag
      : ArrowUpRight;

  return (
    <View
      style={[
        styles.transactionRow,
        {
          marginHorizontal: theme.spacing[6],
          marginBottom: theme.spacing[3],
          padding: theme.spacing[4],
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surface,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          marginRight: theme.spacing[4],
          backgroundColor: isCredit ? theme.colors.successMuted : theme.colors.dangerMuted,
        }}
      >
        <Icon size={20} color={isCredit ? theme.colors.success : theme.colors.error} />
      </View>

      <View style={{ flex: 1 }}>
        <Text variant="body" numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text variant="caption" color="muted" style={{ marginTop: theme.spacing[1] }}>
          {date.toLocaleDateString()} •{" "}
          {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Text
          variant="label"
          style={{ color: isCredit ? theme.colors.success : theme.colors.error }}
        >
          {isCredit ? "+" : "-"} KES {transaction.amount.toLocaleString()}
        </Text>
        <Text variant="caption" color="muted" style={{ marginTop: theme.spacing[1] }}>
          Bal:{" "}
          {transaction.balance_after !== undefined && transaction.balance_after !== null
            ? transaction.balance_after.toLocaleString()
            : "N/A"}
        </Text>
      </View>
    </View>
  );
};

// Layout-only styles (no theme colors — token-driven values are applied inline)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
