// app/admin.tsx
import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/app/_layout";
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
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
  paymentsApi,
  api,
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
  Menu,
  Home,
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
  const [debts, setDebts] = useState<Sale[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<
    "categories" | "products" | "orders" | "debts" | "alerts"
  >("orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(sidebarAnimation, {
      toValue: sidebarOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen, sidebarAnimation]);
  
  const sidebarTranslateX = sidebarAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-280, 0],
  });
  
  const overlayOpacity = sidebarAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    image_url: "",
    image_uri: null as string | null,
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
    phone_number: "",
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
        debtsData,
      ] = await Promise.all([
        productsApi.getCategories(),
        productsApi.getProducts(),
        productsApi.getLowStockProducts(),
        ordersApi.getPendingOrders().catch(() => []),
        salesApi.getSales().catch(() => []),
        salesApi.getAnalytics().catch(() => null),
        salesApi.getUnpaidSales().catch(() => ({ data: [], count: 0 })),
        salesApi.getDebts().catch(() => ({ data: [], count: 0 })),
      ]);

      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setLowStockProducts(Array.isArray(lowStockData) ? lowStockData : []);
      setPendingOrders(Array.isArray(ordersData) ? ordersData : []);
      setSales(Array.isArray(salesData) ? salesData : []);
      setSalesAnalytics(analyticsData);
      setUnpaidSales(Array.isArray(unpaidData?.data) ? unpaidData.data : []);
      setDebts(Array.isArray(debtsData?.data) ? debtsData.data : []);
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
        image_uri: null,
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
        image_uri: null,
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

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      ToastService.showError('Permission Denied', 'We need camera roll permissions to add images');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProductForm({
        ...productForm,
        image_uri: result.assets[0].uri,
        image_url: result.assets[0].uri, // For now, use local URI. In production, upload to server
      });
    }
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
    const paymentStatus = order.payment_status || 'pending';
    const isDebt = paymentStatus === 'debt';
    
    Alert.alert(
      "Confirm Order",
      `Confirm order ${order.order_number || `#${order.id}`}?\n\nPayment Status: ${paymentStatus === 'paid' ? 'Paid' : paymentStatus === 'debt' ? 'Debt' : paymentStatus === 'failed' ? 'Failed' : 'Pending'}\nAmount: KES ${order.total_amount?.toLocaleString() || 0}\n\n${isDebt ? 'This will mark the order as debt with 7 days payment deadline.' : 'This will create a sale and update stock.'}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "default",
          onPress: () => {
            (async () => {
              try {
                // Update order status to confirmed - this will automatically create a sale
                await ordersApi.updateOrder(order.id, {
                  order_status: 'confirmed',
                });
                
                ToastService.showSuccess(
                  "Success",
                  isDebt 
                    ? "Order confirmed and marked as debt (7 days)" 
                    : "Order confirmed and sale created"
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
    const customerName = order.user 
      ? `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim() || order.user.username
      : 'Customer';
    Alert.alert(
      "Cancel Order",
      `Cancel order ${order.order_number || `#${order.id}`} from ${customerName}?`,
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
      phone_number: sale.customer_phone || "",
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

    if (paymentForm.method === "mpesa" && !paymentForm.phone_number) {
      ToastService.showError("Validation Error", "Phone number is required for M-Pesa payments");
      return;
    }

    try {
      const paymentData: {
        payment_method: 'mpesa' | 'cash' | 'card';
        amount: number;
        phone_number?: string;
        reference?: string;
        notes?: string;
      } = {
        payment_method: paymentForm.method as 'mpesa' | 'cash' | 'card',
        amount: parseFloat(paymentForm.amount),
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
      };

      if (paymentForm.method === "mpesa") {
        paymentData.phone_number = paymentForm.phone_number;
      }

      const response = await paymentsApi.addPayment(selectedSale.id, paymentData);
      
      // If M-Pesa payment, initiate STK push
      if (paymentForm.method === "mpesa" && response.data) {
        const { mpesaApi } = await import("@/services/api");
        try {
          const stkResponse = await mpesaApi.initiateStkPush(
            selectedSale.id,
            paymentForm.phone_number,
            parseFloat(paymentForm.amount)
          );
          if (stkResponse.success) {
            ToastService.showSuccess("Success", "M-Pesa payment request sent to customer's phone");
          } else {
            ToastService.showError("M-Pesa Error", stkResponse.message || "Failed to initiate M-Pesa payment");
          }
        } catch (mpesaError) {
          ToastService.showApiError(mpesaError, "Payment created but M-Pesa request failed");
        }
      } else {
        ToastService.showSuccess("Success", "Payment added successfully");
      }
      
      setShowPaymentModal(false);
      loadAdminData();
    } catch (error) {
      ToastService.showApiError(error, "Failed to add payment");
    }
  };

  const renderDebtItem = ({ item }: { item: Sale }) => {
    const daysRemaining = item.days_remaining ?? 0;
    const isOverdue = item.is_overdue || daysRemaining < 0;
    const isNearDue = item.is_near_due || (daysRemaining > 0 && daysRemaining <= 2);
    const dueDate = item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A';
    
    return (
      <View style={styles.debtCard}>
        <View style={styles.debtHeader}>
          <View style={styles.debtInfo}>
            <Text style={styles.debtCustomer}>{item.customer_name}</Text>
            <Text style={styles.debtPhone}>{item.customer_phone}</Text>
            <Text style={styles.debtSaleNumber}>{item.sale_number}</Text>
          </View>
          <View style={styles.debtAmount}>
            <Text style={styles.debtTotal}>
              Ksh {item.balance?.toLocaleString() || item.total_amount?.toLocaleString() || 0}
            </Text>
            {isOverdue ? (
              <View style={[styles.debtStatusBadge, { backgroundColor: '#FEF2F2' }]}>
                <Text style={[styles.debtStatusText, { color: '#EF4444' }]}>
                  OVERDUE
                </Text>
              </View>
            ) : isNearDue ? (
              <View style={[styles.debtStatusBadge, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.debtStatusText, { color: '#F59E0B' }]}>
                  DUE SOON
                </Text>
              </View>
            ) : (
              <View style={[styles.debtStatusBadge, { backgroundColor: '#F0FDF4' }]}>
                <Text style={[styles.debtStatusText, { color: '#22C55E' }]}>
                  ACTIVE
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.debtDetails}>
          <View style={styles.debtDetailRow}>
            <Text style={styles.debtDetailLabel}>Total Amount:</Text>
            <Text style={styles.debtDetailValue}>
              Ksh {item.total_amount?.toLocaleString() || 0}
            </Text>
          </View>
          <View style={styles.debtDetailRow}>
            <Text style={styles.debtDetailLabel}>Paid:</Text>
            <Text style={styles.debtDetailValue}>
              Ksh {item.total_paid?.toLocaleString() || 0}
            </Text>
          </View>
          <View style={styles.debtDetailRow}>
            <Text style={styles.debtDetailLabel}>Balance:</Text>
            <Text style={[styles.debtDetailValue, { color: '#EF4444', fontWeight: '700' }]}>
              Ksh {item.balance?.toLocaleString() || 0}
            </Text>
          </View>
          <View style={styles.debtDetailRow}>
            <Text style={styles.debtDetailLabel}>Due Date:</Text>
            <Text style={[styles.debtDetailValue, isOverdue && { color: '#EF4444', fontWeight: '700' }]}>
              {dueDate}
            </Text>
          </View>
          <View style={styles.debtDetailRow}>
            <Text style={styles.debtDetailLabel}>Days Remaining:</Text>
            <Text style={[styles.debtDetailValue, isOverdue && { color: '#EF4444' }, isNearDue && !isOverdue && { color: '#F59E0B' }]}>
              {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
            </Text>
          </View>
          <View style={styles.debtDetailRow}>
            <Text style={styles.debtDetailLabel}>Created:</Text>
            <Text style={styles.debtDetailValue}>
              {new Date(item.made_on).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {!item.is_fully_paid && (
          <View style={styles.debtActions}>
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

  const renderSaleItem = ({ item }: { item: Sale }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "fully-paid":
          return "#22C55E";
        case "partial-payment":
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
        case "partial-payment":
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

  const renderOrderItem = ({ item }: { item: Order }) => {
    const customerName = item.user 
      ? `${item.user.first_name || ''} ${item.user.last_name || ''}`.trim() || item.user.username
      : 'Customer';
    const paymentStatus = item.payment_status === 'cash' ? 'Cash' 
      : item.payment_status === 'mpesa' ? 'M-Pesa' 
      : item.payment_status === 'debt' ? 'Debt' 
      : item.payment_status === 'paid' ? 'Paid'
      : item.payment_status || 'Pending';
    
    return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>Order {item.order_number || `#${item.id}`}</Text>
          <Text style={styles.orderCustomer}>{customerName}</Text>
          <Text style={styles.orderDate}>
            {new Date(`${item.order_date}T${item.order_time || '00:00:00'}`).toLocaleString()}
          </Text>
          <View style={styles.orderDetailsRow}>
            <Text style={styles.orderDetailLabel}>Payment Status:</Text>
            <Text style={styles.orderDetailValue}>{paymentStatus}</Text>
          </View>
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
                  item.order_status === "pending" ? "#FEF3C7" : "#F0FDF4",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: item.order_status === "pending" ? "#D97706" : "#22C55E" },
              ]}
            >
              {item.order_status.charAt(0).toUpperCase() + item.order_status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {item.items && item.items.length > 0 && (
        <View style={styles.orderItemsSection}>
          <Text style={styles.orderItemsTitle}>Items:</Text>
          {item.items.map((orderItem) => (
            <Text key={orderItem.id} style={styles.orderItemText}>
              {orderItem.product?.name || 'Product'} x {orderItem.quantity} {orderItem.kilogram ? `(${orderItem.kilogram}kg)` : ''} - KES {orderItem.subtotal?.toLocaleString() || 0}
            </Text>
          ))}
        </View>
      )}

      {item.order_status === "pending" && (
        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => confirmOrder(item)}
          >
            <CheckCircle size={16} color="#22C55E" />
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => cancelOrder(item)}
          >
            <XCircle size={16} color="#EF4444" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    );
  };

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

  const menuItems = [
    { id: "orders", label: "Orders", icon: ShoppingBag, count: pendingOrders.length, color: "#3B82F6" },
    { id: "debts", label: "Debts", icon: AlertTriangle, count: debts.length, color: "#EF4444" },
    { id: "products", label: "Products", icon: Package, count: products.length, color: "#22C55E" },
    { id: "categories", label: "Categories", icon: Tag, count: categories.length, color: "#8B5CF6" },
    { id: "alerts", label: "Low Stock", icon: AlertTriangle, count: lowStockProducts.length, color: "#F59E0B" },
  ];

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <Animated.View 
        style={[
          styles.sidebar, 
          {
            transform: [{ translateX: sidebarTranslateX }],
            shadowOpacity: sidebarOpen ? 0.2 : 0,
            elevation: sidebarOpen ? 8 : 0,
          }
        ]}
      >
        <View style={styles.sidebarHeader}>
          <View style={styles.sidebarLogo}>
            <Home size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.sidebarTitle}>EasyBuy</Text>
          <Text style={styles.sidebarSubtitle}>Admin Panel</Text>
        </View>

        <ScrollView style={styles.sidebarMenu} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => {
                  setActiveTab(item.id as any);
                  setSidebarOpen(false);
                }}
              >
                <View style={[styles.menuIcon, isActive && { backgroundColor: `${item.color}20` }]}>
                  <Icon size={20} color={isActive ? item.color : "#94A3B8"} />
                </View>
                <Text style={[styles.menuLabel, isActive && { color: item.color, fontWeight: '700' }]}>
                  {item.label}
                </Text>
                {item.count > 0 && (
                  <View style={[styles.badge, { backgroundColor: isActive ? item.color : "#E2E8F0" }]}>
                    <Text style={[styles.badgeText, { color: isActive ? "#FFFFFF" : "#64748B" }]}>
                      {item.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <TouchableOpacity
            style={styles.sidebarBackButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color="#64748B" />
            <Text style={styles.sidebarBackText}>Back to App</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
            }
          ]}
          pointerEvents="auto"
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSidebarOpen(false)}
          />
        </Animated.View>
      )}

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.topBarContent}>
            <Text style={styles.topBarTitle}>
              {menuItems.find(m => m.id === activeTab)?.label || "Admin Panel"}
            </Text>
            {activeTab === "orders" && (
              <Text style={styles.topBarSubtitle}>
                {pendingOrders.length} pending {pendingOrders.length === 1 ? 'order' : 'orders'}
              </Text>
            )}
            {activeTab === "debts" && (
              <Text style={styles.topBarSubtitle}>
                {debts.length} active {debts.length === 1 ? 'debt' : 'debts'}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.backButtonTop}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            {categories.map((item) => (
              <View key={item.id}>
                {renderCategoryItem({ item })}
              </View>
            ))}
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
            {products.map((item) => (
              <View key={item.id}>
                {renderProductItem({ item })}
              </View>
            ))}
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
              pendingOrders.map((item) => (
                <View key={item.id}>
                  {renderOrderItem({ item })}
                </View>
              ))
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

        {activeTab === "debts" && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Debt Tracking ({debts.length})</Text>
            </View>
            {debts.length > 0 ? (
              debts.map((item) => (
                <View key={item.id}>
                  {renderDebtItem({ item })}
                </View>
              ))
            ) : (
              <View style={styles.noSales}>
                <AlertTriangle size={48} color="#22C55E" />
                <Text style={styles.noSalesText}>No debts</Text>
                <Text style={styles.noSalesSubtext}>
                  All customers have paid their debts
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "alerts" && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((item) => (
                <View key={item.id}>
                  {renderProductItem({ item })}
                </View>
              ))
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
      </ScrollView>
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

                <Text style={styles.fieldLabel}>Product Image</Text>
                <View style={styles.imagePickerContainer}>
                  {productForm.image_uri || productForm.image_url ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: productForm.image_uri || productForm.image_url }}
                        style={styles.imagePreview}
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setProductForm({ ...productForm, image_uri: null, image_url: '' })}
                      >
                        <X size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={pickImage}
                  >
                    <Text style={styles.imagePickerButtonText}>
                      {productForm.image_uri || productForm.image_url ? 'Change Image' : 'Pick Image from Gallery'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.imagePickerHint}>
                    Or enter image URL manually:
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter image URL"
                    value={productForm.image_url && !productForm.image_uri ? productForm.image_url : ''}
                    onChangeText={(text) =>
                      setProductForm({ ...productForm, image_url: text, image_uri: null })
                    }
                  />
                </View>

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

              {paymentForm.method === "mpesa" && (
                <>
                  <Text style={styles.fieldLabel}>Phone Number *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="254712345678"
                    value={paymentForm.phone_number}
                    onChangeText={(text) =>
                      setPaymentForm({ ...paymentForm, phone_number: text })
                    }
                    keyboardType="phone-pad"
                  />
                </>
              )}

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

  // Sidebar
  sidebar: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowRadius: 8,
    elevation: 8,
  },
  sidebarHeader: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#6366F1",
    borderBottomWidth: 1,
    borderBottomColor: "#4F46E5",
  },
  sidebarLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  sidebarSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  sidebarMenu: {
    flex: 1,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
  },
  menuItemActive: {
    backgroundColor: "#F3F4F6",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#F1F5F9",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  sidebarBackButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    gap: 8,
  },
  sidebarBackText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
  },

  // Main Content
  mainContent: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  topBarContent: {
    flex: 1,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  topBarSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  backButtonTop: {
    padding: 8,
    marginLeft: 12,
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
    padding: 20,
  },
  tabContent: {
    paddingBottom: 20,
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
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
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

  // Order Details Styles
  orderDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  orderDetailLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  orderDetailValue: {
    fontSize: 12,
    color: "#1E293B",
    fontWeight: "600",
  },
  orderItemsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  orderItemsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  orderItemText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 8,
    marginBottom: 4,
  },

  // Debt Card Styles
  debtCard: {
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
  debtHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  debtInfo: {
    flex: 1,
  },
  debtCustomer: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  debtPhone: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  debtSaleNumber: {
    fontSize: 12,
    color: "#94A3B8",
  },
  debtAmount: {
    alignItems: "flex-end",
  },
  debtTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#EF4444",
    marginBottom: 8,
  },
  debtStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  debtStatusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  debtDetails: {
    marginBottom: 12,
  },
  debtDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  debtDetailLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  debtDetailValue: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
  },
  debtActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },

  // Image Picker Styles
  imagePickerContainer: {
    marginBottom: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 12,
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  imagePickerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePickerHint: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    marginTop: 4,
  },
});
