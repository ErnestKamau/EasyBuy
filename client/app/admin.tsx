// app/admin.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/app/_layout";
import {
  productsApi,
  Category,
  Product,
  ordersApi,
  Order,
  salesApi,
  Sale,
  SalesAnalytics,
  Payment,
} from "@/services/api";
import { ToastService } from "@/utils/toastService";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Package,
  Tag,
  AlertTriangle,
  Save,
  X,
  Clock,
  CheckCircle,
  XCircle,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Calendar,
  CreditCard,
} from "lucide-react-native";

export default function AdminScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(
    null
  );
  const [unpaidSales, setUnpaidSales] = useState<Sale[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<
    "categories" | "products" | "orders" | "sales" | "alerts"
  >("categories");

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    image_url: "",
    category: "",
    kilograms: "",
    sale_price: "",
    cost_price: "",
    in_stock: "",
    minimum_stock: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    method: "cash",
    amount: "",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    if (user?.role !== "admin") {
      ToastService.showError("Access Denied", "Admin access required");
      router.back();
      return;
    }
    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [
        categoriesData,
        productsData,
        lowStockData,
        ordersData,
        salesData,
        analyticsData,
        unpaidData,
      ] = await Promise.all([
        productsApi.getCategories(),
        productsApi.getProducts(),
        productsApi.getLowStockProducts(),
        ordersApi.getPendingOrders().catch(() => ({ orders: [], count: 0 })),
        salesApi.getSales().catch(() => []),
        salesApi.getAnalytics().catch(() => null),
        salesApi.getUnpaidSales().catch(() => ({ unpaid_sales: [], count: 0 })),
      ]);

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setLowStockProducts(
        Array.isArray(lowStockData?.products) ? lowStockData.products : []
      );
      setPendingOrders(
        Array.isArray(ordersData?.orders) ? ordersData.orders : []
      );
      setSales(Array.isArray(salesData) ? salesData : []);
      setSalesAnalytics(analyticsData);
      setUnpaidSales(
        Array.isArray(unpaidData?.unpaid_sales) ? unpaidData.unpaid_sales : []
      );
    } catch (error) {
      ToastService.showApiError(error, "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  // Category Management
  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "" });
    }
    setShowCategoryModal(true);
  };

  const saveCategoryForm = async () => {
    if (!categoryForm.name.trim()) {
      ToastService.showError("Validation Error", "Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        await productsApi.updateCategory(editingCategory.id, categoryForm.name);
        ToastService.showSuccess("Success", "Category updated successfully");
      } else {
        await productsApi.createCategory(categoryForm.name);
        ToastService.showSuccess("Success", "Category created successfully");
      }
      setShowCategoryModal(false);
      loadAdminData();
    } catch (error) {
      ToastService.showApiError(error, "Failed to save category");
    }
  };

  // Product Management
  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        image_url: product.image_url,
        category: product.category.toString(),
        kilograms: product.kilograms?.toString() || "",
        sale_price: product.sale_price.toString(),
        cost_price: product.cost_price.toString(),
        in_stock: product.in_stock.toString(),
        minimum_stock: product.minimum_stock.toString(),
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        image_url: "",
        category: "",
        kilograms: "",
        sale_price: "",
        cost_price: "",
        in_stock: "",
        minimum_stock: "",
      });
    }
    setShowProductModal(true);
  };

  const saveProductForm = async () => {
    // Validation
    if (
      !productForm.name.trim() ||
      !productForm.category ||
      !productForm.sale_price ||
      !productForm.cost_price
    ) {
      ToastService.showError(
        "Validation Error",
        "Please fill in all required fields"
      );
      return;
    }

    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        image_url: productForm.image_url,
        category: parseInt(productForm.category),
        kilograms: productForm.kilograms
          ? parseFloat(productForm.kilograms)
          : null,
        sale_price: parseFloat(productForm.sale_price),
        cost_price: parseFloat(productForm.cost_price),
        in_stock: parseInt(productForm.in_stock) || 0,
        minimum_stock: parseInt(productForm.minimum_stock) || 5,
        is_active: true,
      };

      if (editingProduct) {
        await productsApi.updateProduct(editingProduct.id, productData);
        ToastService.showSuccess("Success", "Product updated successfully");
      } else {
        await productsApi.createProduct(productData);
        ToastService.showSuccess("Success", "Product created successfully");
      }

      setShowProductModal(false);
      loadAdminData();
    } catch (error) {
      ToastService.showApiError(error, "Failed to save product");
    }
  };

  const deleteCategory = (category: Category) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            (async () => {
              try {
                await productsApi.deleteCategory(category.id);
                ToastService.showSuccess(
                  "Success",
                  "Category deleted successfully"
                );
                loadAdminData();
              } catch (error) {
                ToastService.showApiError(error, "Failed to delete category");
              }
            })();
          },
        },
      ]
    );
  };

  const deleteProduct = (product: Product) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            (async () => {
              try {
                await productsApi.deleteProduct(product.id);
                ToastService.showSuccess(
                  "Success",
                  "Product deleted successfully"
                );
                loadAdminData();
              } catch (error) {
                ToastService.showApiError(error, "Failed to delete product");
              }
            })();
          },
        },
      ]
    );
  };

  // Order Management
  const confirmOrder = async (order: Order) => {
    Alert.alert(
      "Confirm Order",
      `Confirm order #${order.id} from ${order.customer_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "default",
          onPress: () => {
            (async () => {
              try {
                await ordersApi.confirmOrder(order.id);
                ToastService.showSuccess(
                  "Success",
                  "Order confirmed and converted to sale"
                );
                loadAdminData();
              } catch (error) {
                ToastService.showApiError(error, "Failed to confirm order");
              }
            })();
          },
        },
      ]
    );
  };

  const cancelOrder = async (order: Order) => {
    Alert.alert(
      "Cancel Order",
      `Cancel order #${order.id} from ${order.customer_name}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Cancel Order",
          style: "destructive",
          onPress: () => {
            (async () => {
              try {
                await ordersApi.cancelOrder(order.id);
                ToastService.showSuccess("Success", "Order cancelled");
                loadAdminData();
              } catch (error) {
                ToastService.showApiError(error, "Failed to cancel order");
              }
            })();
          },
        },
      ]
    );
  };

  // Payment Management
  const openPaymentModal = (sale: Sale) => {
    setSelectedSale(sale);
    setPaymentForm({
      method: "cash",
      amount: sale.balance.toString(),
      reference: "",
      notes: "",
    });
    setShowPaymentModal(true);
  };

  const addPaymentToSale = async () => {
    if (!selectedSale || !paymentForm.amount) {
      ToastService.showError("Validation Error", "Amount is required");
      return;
    }

    try {
      const paymentData = {
        method: paymentForm.method,
        amount: parseFloat(paymentForm.amount),
        reference: paymentForm.reference,
        notes: paymentForm.notes,
      };

      await salesApi.addPayment(selectedSale.id, paymentData);
      ToastService.showSuccess("Success", "Payment added successfully");
      setShowPaymentModal(false);
      loadAdminData();
    } catch (error) {
      ToastService.showApiError(error, "Failed to add payment");
    }
  };

  const renderSaleItem = ({ item }: { item: Sale }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "fully-paid":
          return "#22C55E";
        case "partial":
          return "#F59E0B";
        case "overdue":
          return "#EF4444";
        default:
          return "#94A3B8";
      }
    };

    const getStatusBgColor = (status: string) => {
      switch (status) {
        case "fully-paid":
          return "#F0FDF4";
        case "partial":
          return "#FFFBEB";
        case "overdue":
          return "#FEF2F2";
        default:
          return "#F8FAFC";
      }
    };

    return (
      <View style={styles.salesCard}>
        <View style={styles.salesHeader}>
          <View style={styles.salesInfo}>
            <Text style={styles.saleNumber}>{item.sale_number}</Text>
            <Text style={styles.saleCustomer}>{item.customer_name}</Text>
            <Text style={styles.saleDate}>
              {new Date(item.made_on).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.salesAmount}>
            <Text style={styles.saleTotal}>
              Ksh {item.total_amount?.toLocaleString() || 0}
            </Text>
            <Text style={styles.saleProfit}>
              Profit: Ksh {item.profit_amount?.toLocaleString() || 0}
            </Text>
            <View
              style={[
                styles.paymentStatusBadge,
                { backgroundColor: getStatusBgColor(item.payment_status) },
              ]}
            >
              <Text
                style={[
                  styles.paymentStatusText,
                  { color: getStatusColor(item.payment_status) },
                ]}
              >
                {item.payment_status.replace("-", " ").toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentInfo}>
          <Text style={styles.paymentInfoText}>
            Paid: Ksh {item.total_paid?.toLocaleString() || 0} | Balance: Ksh{" "}
            {item.balance?.toLocaleString() || 0}
          </Text>
        </View>

        {!item.is_fully_paid && (
          <View style={styles.salesActions}>
            <TouchableOpacity
              style={styles.addPaymentButton}
              onPress={() => openPaymentModal(item)}
            >
              <CreditCard size={16} color="#3B82F6" />
              <Text style={styles.addPaymentButtonText}>Add Payment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Order #{item.id}</Text>
          <Text style={styles.orderCustomer}>{item.customer_name}</Text>
          <Text style={styles.orderDate}>
            {new Date(`${item.order_date}T${item.order_time}`).toLocaleString()}
          </Text>
        </View>
        <View style={styles.orderAmount}>
          <Text style={styles.orderTotal}>
            Ksh {item.total_amount?.toLocaleString() || 0}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === "pending" ? "#FEF3C7" : "#F0FDF4",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: item.status === "pending" ? "#D97706" : "#22C55E" },
              ]}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => confirmOrder(item)}
        >
          <CheckCircle size={16} color="#22C55E" />
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
        {item.payment_status === "PENDING" && (
          <TouchableOpacity
            style={styles.addPaymentButton}
            onPress={() =>
              (async () => {
                try {
                  const response = await ordersApi.initiatePayment(item.id);
                  if (response.success) {
                    ToastService.showSuccess("Success", "Payment request sent");
                  } else {
                    ToastService.showError(
                      "Payment Error",
                      response.message || "Failed to send payment request"
                    );
                  }
                  loadAdminData();
                } catch (error) {
                  ToastService.showApiError(
                    error,
                    "Failed to initiate payment"
                  );
                }
              })()
            }
          >
            <CreditCard size={16} color="#2563EB" />
            <Text style={styles.addPaymentButtonText}>Request MPesa</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => cancelOrder(item)}
        >
          <XCircle size={16} color="#EF4444" />
          <Text style={styles.orderCancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>{item.products_count} products</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openCategoryModal(item)}
        >
          <Edit size={16} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteCategory(item)}
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>
          {item.category_name} • Ksh {item.sale_price} • Stock: {item.in_stock}
        </Text>
        {item.is_low_stock && (
          <Text style={styles.lowStockIndicator}>⚠️ Low Stock</Text>
        )}
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openProductModal(item)}
        >
          <Edit size={16} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteProduct(item)}
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading admin panel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "categories" && styles.activeTab]}
          onPress={() => setActiveTab("categories")}
        >
          <Tag
            size={20}
            color={activeTab === "categories" ? "#FFFFFF" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "categories" && styles.activeTabText,
            ]}
          >
            Categories
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "products" && styles.activeTab]}
          onPress={() => setActiveTab("products")}
        >
          <Package
            size={20}
            color={activeTab === "products" ? "#FFFFFF" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "products" && styles.activeTabText,
            ]}
          >
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "orders" && styles.activeTab]}
          onPress={() => setActiveTab("orders")}
        >
          <ShoppingBag
            size={20}
            color={activeTab === "orders" ? "#FFFFFF" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "orders" && styles.activeTabText,
            ]}
          >
            Orders ({pendingOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "sales" && styles.activeTab]}
          onPress={() => setActiveTab("sales")}
        >
          <TrendingUp
            size={20}
            color={activeTab === "sales" ? "#FFFFFF" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "sales" && styles.activeTabText,
            ]}
          >
            Sales ({sales.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "alerts" && styles.activeTab]}
          onPress={() => setActiveTab("alerts")}
        >
          <AlertTriangle
            size={20}
            color={activeTab === "alerts" ? "#FFFFFF" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "alerts" && styles.activeTabText,
            ]}
          >
            Alerts ({lowStockProducts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "categories" && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Categories ({categories.length})
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openCategoryModal()}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id.toString()}
              key={categories.length} // Force re-render when categories change
              extraData={categories.length} // Force re-render when data changes
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {activeTab === "products" && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Products ({products.length})
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openProductModal()}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id.toString()}
              key={products.length} // Force re-render when products change
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {activeTab === "orders" && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Pending Orders ({pendingOrders.length})
              </Text>
            </View>
            {pendingOrders.length > 0 ? (
              <FlatList
                data={pendingOrders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id.toString()}
                key={pendingOrders.length}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noOrders}>
                <ShoppingBag size={48} color="#94A3B8" />
                <Text style={styles.noOrdersText}>No pending orders</Text>
                <Text style={styles.noOrdersSubtext}>
                  Orders will appear here when customers place them
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "sales" && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sales & Payments</Text>
            </View>

            {/* Analytics Cards */}
            {salesAnalytics && (
              <View style={styles.analyticsContainer}>
                <View style={styles.analyticsRow}>
                  <View style={styles.analyticsCard}>
                    <DollarSign size={24} color="#22C55E" />
                    <Text style={styles.analyticsValue}>
                      Ksh {salesAnalytics.total_revenue?.toLocaleString() || 0}
                    </Text>
                    <Text style={styles.analyticsLabel}>Total Revenue</Text>
                  </View>
                  <View style={styles.analyticsCard}>
                    <TrendingUp size={24} color="#3B82F6" />
                    <Text style={styles.analyticsValue}>
                      Ksh {salesAnalytics.total_profit?.toLocaleString() || 0}
                    </Text>
                    <Text style={styles.analyticsLabel}>Total Profit</Text>
                  </View>
                </View>
                <View style={styles.analyticsRow}>
                  <View style={styles.analyticsCard}>
                    <ShoppingBag size={24} color="#8B5CF6" />
                    <Text style={styles.analyticsValue}>
                      {salesAnalytics.total_sales}
                    </Text>
                    <Text style={styles.analyticsLabel}>Total Sales</Text>
                  </View>
                  <View style={styles.analyticsCard}>
                    <Calendar size={24} color="#F59E0B" />
                    <Text style={styles.analyticsValue}>
                      {salesAnalytics.profit_margin.toFixed(1)}%
                    </Text>
                    <Text style={styles.analyticsLabel}>Profit Margin</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Unpaid Sales Alert */}
            {unpaidSales.length > 0 && (
              <View style={styles.unpaidAlert}>
                <AlertTriangle size={20} color="#F59E0B" />
                <Text style={styles.unpaidAlertText}>
                  {unpaidSales.length} sale{unpaidSales.length !== 1 ? "s" : ""}{" "}
                  with outstanding payments
                </Text>
              </View>
            )}

            {/* Sales List */}
            {sales.length > 0 ? (
              <FlatList
                data={sales}
                renderItem={renderSaleItem}
                keyExtractor={(item) => item.id.toString()}
                key={sales.length}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noSales}>
                <TrendingUp size={48} color="#94A3B8" />
                <Text style={styles.noSalesText}>No sales yet</Text>
                <Text style={styles.noSalesSubtext}>
                  Sales will appear here when orders are confirmed
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "alerts" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
            {lowStockProducts.length > 0 ? (
              <FlatList
                data={lowStockProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id.toString()}
                key={lowStockProducts.length} // Force re-render when low stock products change
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noAlerts}>
                <AlertTriangle size={48} color="#22C55E" />
                <Text style={styles.noAlertsText}>No low stock alerts</Text>
                <Text style={styles.noAlertsSubtext}>
                  All products are well stocked
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.fieldLabel}>Category Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter category name"
                value={categoryForm.name}
                onChangeText={(text) => setCategoryForm({ name: text })}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveCategoryForm}
              >
                <Save size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Product Modal */}
      <Modal visible={showProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowProductModal(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.fieldLabel}>Product Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter product name"
                  value={productForm.name}
                  onChangeText={(text) =>
                    setProductForm({ ...productForm, name: text })
                  }
                />

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter product description"
                  value={productForm.description}
                  onChangeText={(text) =>
                    setProductForm({ ...productForm, description: text })
                  }
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.fieldLabel}>Image URL</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter image URL"
                  value={productForm.image_url}
                  onChangeText={(text) =>
                    setProductForm({ ...productForm, image_url: text })
                  }
                />

                <Text style={styles.fieldLabel}>Category *</Text>
                <View style={styles.pickerContainer}>
                  {Array.isArray(categories) && categories.length > 0 ? (
                    categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryOption,
                          productForm.category === category.id.toString() &&
                            styles.selectedCategoryOption,
                        ]}
                        onPress={() =>
                          setProductForm({
                            ...productForm,
                            category: category.id.toString(),
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.categoryOptionText,
                            productForm.category === category.id.toString() &&
                              styles.selectedCategoryOptionText,
                          ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noCategoriesText}>
                      No categories available. Please create categories first.
                    </Text>
                  )}
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.fieldLabel}>Weight (kg)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="0.0"
                      value={productForm.kilograms}
                      onChangeText={(text) =>
                        setProductForm({ ...productForm, kilograms: text })
                      }
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.formColumn}>
                    <Text style={styles.fieldLabel}>Sale Price *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="0.00"
                      value={productForm.sale_price}
                      onChangeText={(text) =>
                        setProductForm({ ...productForm, sale_price: text })
                      }
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.fieldLabel}>Cost Price *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="0.00"
                      value={productForm.cost_price}
                      onChangeText={(text) =>
                        setProductForm({ ...productForm, cost_price: text })
                      }
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.formColumn}>
                    <Text style={styles.fieldLabel}>In Stock</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="0"
                      value={productForm.in_stock}
                      onChangeText={(text) =>
                        setProductForm({ ...productForm, in_stock: text })
                      }
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Minimum Stock Level</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="5"
                  value={productForm.minimum_stock}
                  onChangeText={(text) =>
                    setProductForm({ ...productForm, minimum_stock: text })
                  }
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowProductModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveProductForm}
                >
                  <Save size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add Payment - {selectedSale?.sale_number}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.paymentSummary}>
                <Text style={styles.paymentSummaryTitle}>Sale Summary</Text>
                <Text style={styles.paymentSummaryText}>
                  Total: Ksh {selectedSale?.total_amount?.toLocaleString()}
                </Text>
                <Text style={styles.paymentSummaryText}>
                  Paid: Ksh {selectedSale?.total_paid?.toLocaleString()}
                </Text>
                <Text style={styles.paymentSummaryBalance}>
                  Balance: Ksh {selectedSale?.balance?.toLocaleString()}
                </Text>
              </View>

              <Text style={styles.fieldLabel}>Payment Method *</Text>
              <View style={styles.paymentMethodContainer}>
                {[
                  { value: "cash", label: "Cash" },
                  { value: "mpesa", label: "M-Pesa" },
                  { value: "card", label: "Card" },
                ].map((method) => (
                  <TouchableOpacity
                    key={method.value}
                    style={[
                      styles.paymentMethodOption,
                      paymentForm.method === method.value &&
                        styles.selectedPaymentMethodOption,
                    ]}
                    onPress={() =>
                      setPaymentForm({ ...paymentForm, method: method.value })
                    }
                  >
                    <Text
                      style={[
                        styles.paymentMethodOptionText,
                        paymentForm.method === method.value &&
                          styles.selectedPaymentMethodOptionText,
                      ]}
                    >
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Amount *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter payment amount"
                value={paymentForm.amount}
                onChangeText={(text) =>
                  setPaymentForm({ ...paymentForm, amount: text })
                }
                keyboardType="decimal-pad"
              />

              <Text style={styles.fieldLabel}>Reference (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Transaction ID, receipt number, etc."
                value={paymentForm.reference}
                onChangeText={(text) =>
                  setPaymentForm({ ...paymentForm, reference: text })
                }
              />

              <Text style={styles.fieldLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Additional notes about this payment"
                value={paymentForm.notes}
                onChangeText={(text) =>
                  setPaymentForm({ ...paymentForm, notes: text })
                }
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={addPaymentToSale}
              >
                <CreditCard size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Add Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748B",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: "#8B5CF6",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    backgroundColor: "#8B5CF6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  activeTabText: {
    color: "#FFFFFF",
  },

  // Content
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  addButton: {
    backgroundColor: "#22C55E",
    borderRadius: 8,
    padding: 12,
  },

  // Item Cards
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  lowStockIndicator: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
    marginTop: 4,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#DBEAFE",
    borderRadius: 8,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 8,
  },

  // No Alerts
  noAlerts: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  noAlertsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#22C55E",
    marginTop: 16,
    marginBottom: 8,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: "#64748B",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalScrollView: {
    flex: 1,
    width: "100%",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 16,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  closeButton: {
    padding: 4,
  },

  // Form
  formContainer: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1E293B",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  formColumn: {
    flex: 1,
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedCategoryOption: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  categoryOptionText: {
    fontSize: 14,
    color: "#64748B",
  },
  selectedCategoryOptionText: {
    color: "#FFFFFF",
  },
  noCategoriesText: {
    fontSize: 14,
    color: "#EF4444",
    fontStyle: "italic",
    textAlign: "center",
    padding: 16,
  },

  // Modal Actions
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22C55E",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Order Styles
  orderCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  orderCustomer: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: "#94A3B8",
  },
  orderAmount: {
    alignItems: "flex-end",
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#22C55E",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderActions: {
    flexDirection: "row",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  confirmButtonText: {
    fontSize: 14,
    color: "#22C55E",
    fontWeight: "600",
  },
  orderCancelButtonText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },

  // No Orders
  noOrders: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  noOrdersText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 16,
    marginBottom: 8,
  },
  noOrdersSubtext: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },

  // Sales Styles
  analyticsContainer: {
    marginBottom: 16,
  },
  analyticsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 8,
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  unpaidAlert: {
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  unpaidAlertText: {
    fontSize: 14,
    color: "#92400E",
    fontWeight: "500",
  },
  salesCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  salesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  salesInfo: {
    flex: 1,
  },
  saleNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  saleCustomer: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  saleDate: {
    fontSize: 12,
    color: "#94A3B8",
  },
  salesAmount: {
    alignItems: "flex-end",
  },
  saleTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#22C55E",
    marginBottom: 4,
  },
  saleProfit: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
    marginBottom: 8,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  paymentInfo: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    marginBottom: 12,
  },
  paymentInfoText: {
    fontSize: 14,
    color: "#64748B",
  },
  salesActions: {
    flexDirection: "row",
    gap: 12,
  },
  addPaymentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addPaymentButtonText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
  },
  noSales: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  noSalesText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 16,
    marginBottom: 8,
  },
  noSalesSubtext: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },

  // Payment Modal Styles
  paymentSummary: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  paymentSummaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  paymentSummaryText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  paymentSummaryBalance: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22C55E",
    marginTop: 4,
  },
  paymentMethodContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  paymentMethodOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedPaymentMethodOption: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  paymentMethodOptionText: {
    fontSize: 14,
    color: "#64748B",
  },
  selectedPaymentMethodOptionText: {
    color: "#FFFFFF",
  },
});
