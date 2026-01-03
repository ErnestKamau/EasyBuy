// app/(tabs)/index.tsx - Theme-integrated version
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Dimensions,
  Image,
  FlatList,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import {
  User,
  authApi,
  productsApi,
  Product,
  Category,
  isAuthenticated,
} from "@/services/api";
import { ToastService } from "@/utils/toastService";
import { handleCommonErrors, getErrorMessage } from "@/utils/errorUtils";
import {
  Leaf,
  Coffee,
  Nut,
  ShoppingBag,
  Search,
  Heart,
  X,
  Plus,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useCart } from "@/contexts/CartContext";

const { width: screenWidth } = Dimensions.get("window");

const categoryIcons: Record<string, any> = {
  Khat: Leaf,
  Beverages: Coffee,
  Snacks: Nut,
  Bags: ShoppingBag,
  Accessories: ShoppingBag,
};

const categoryColors: Record<string, { color: string; bgColor: string }> = {
  Khat: { color: "#22C55E", bgColor: "#DCFCE7" },
  Beverages: { color: "#3B82F6", bgColor: "#DBEAFE" },
  Snacks: { color: "#F59E0B", bgColor: "#FEF3C7" },
  Bags: { color: "#8B5CF6", bgColor: "#F3E8FF" },
  Accessories: { color: "#8B5CF6", bgColor: "#F3E8FF" },
  default: { color: "#64748B", bgColor: "#F1F5F9" },
};

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const { currentTheme, themeName } = useTheme();
  const { addItem } = useCart();

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.background,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: currentTheme.textSecondary,
      fontWeight: "500",
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: "700",
      color: currentTheme.text,
      marginBottom: 4,
    },
    welcomeSubtext: {
      fontSize: 16,
      color: currentTheme.primary,
      fontWeight: "500",
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: currentTheme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: themeName === 'dark' ? 0.3 : 0.05,
      shadowRadius: 2,
      elevation: themeName === 'dark' ? 5 : 0,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: currentTheme.text,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: currentTheme.text,
      marginBottom: 12,
    },
    categoryNameSmall: {
      fontSize: 12,
      fontWeight: "600",
      color: currentTheme.text,
      textAlign: "center",
    },
    selectedCategoryName: {
      color: currentTheme.primary,
    },
    categoryCount: {
      fontSize: 10,
      color: currentTheme.textSecondary,
      textAlign: "center",
    },
    clearFiltersText: {
      color: currentTheme.error,
      fontSize: 14,
      fontWeight: "600",
    },
    productCard: {
      flex: 1,
      backgroundColor: currentTheme.surface,
      borderRadius: 12,
      marginHorizontal: 6,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: themeName === 'dark' ? 0.3 : 0.05,
      shadowRadius: 4,
      elevation: themeName === 'dark' ? 8 : 3,
      borderWidth: themeName === 'dark' ? 1 : 0,
      borderColor: themeName === 'dark' ? currentTheme.border : 'transparent',
    },
    productName: {
      fontSize: 14,
      fontWeight: "600",
      color: currentTheme.text,
      marginBottom: 4,
      lineHeight: 18,
    },
    productCategory: {
      fontSize: 12,
      color: currentTheme.textSecondary,
      marginBottom: 4,
    },
    productWeight: {
      fontSize: 12,
      color: currentTheme.primary,
      fontWeight: "600",
      marginBottom: 6,
    },
    currentPrice: {
      fontSize: 16,
      fontWeight: "700",
      color: currentTheme.primary,
      marginRight: 8,
    },
    originalPrice: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      textDecorationLine: "line-through",
    },
    stockText: {
      fontSize: 12,
      color: currentTheme.success,
      fontWeight: "600",
    },
    addToCartButton: {
      backgroundColor: currentTheme.primary,
      borderRadius: 16,
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    disabledButton: {
      backgroundColor: currentTheme.textSecondary,
    },
    noResultsText: {
      fontSize: 16,
      color: currentTheme.textSecondary,
      textAlign: "center",
      marginBottom: 16,
    },
    clearSearchButton: {
      backgroundColor: currentTheme.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    clearSearchText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
    adminButton: {
      backgroundColor: currentTheme.secondary,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: "center",
    },
    adminButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  const checkAuthAndLoadData = async () => {
    try {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        console.log("User not authenticated, redirecting to auth");
        router.replace("/auth");
        return;
      }

      setAuthChecked(true);
      await loadInitialData();
    } catch (error) {
      console.log("Auth check failed:", error);
      router.replace("/auth");
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadUserData(), loadCategories(), loadProducts()]);
    } catch (error) {
      console.log("Failed to load initial data:", error);

      const wasHandled = handleCommonErrors(
        error,
        () => router.replace("/auth"),
        (message) => ToastService.showError("Connection Error", message)
      );

      if (!wasHandled) {
        ToastService.showError(
          "Error",
          "Failed to load app data. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        console.log("getCurrentUser returned null, checking auth status");
        const authenticated = await isAuthenticated();
        if (!authenticated) {
          router.replace("/auth");
        }
      }
    } catch (error) {
      console.log("Failed to load user data:", error);

      const wasHandled = handleCommonErrors(
        error,
        () => router.replace("/auth"),
        (message) => console.log("User data error:", message)
      );

      if (!wasHandled) {
        console.log("Unexpected user data error:", getErrorMessage(error));
      }
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await productsApi.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.log("Failed to load categories:", error);

      const wasHandled = handleCommonErrors(
        error,
        () => router.replace("/auth"),
        (message) => ToastService.showError("Connection Error", message)
      );

      if (!wasHandled) {
        ToastService.showError("Error", "Failed to load categories");
      }
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await productsApi.getProducts();
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.log("Failed to load products:", error);

      const wasHandled = handleCommonErrors(
        error,
        () => router.replace("/auth"),
        (message) => ToastService.showError("Connection Error", message)
      );

      if (!wasHandled) {
        ToastService.showError("Error", "Failed to load products");
      }
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category_name.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const selectCategory = (categoryId: number) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const navigateToProduct = (productId: number) => {
    router.push(`/product/${productId}` as any);
  };

  const getIconForCategory = (categoryName: string) => {
    return categoryIcons[categoryName] || ShoppingBag;
  };

  const getColorsForCategory = (categoryName: string) => {
    return categoryColors[categoryName] || categoryColors.default;
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const IconComponent = getIconForCategory(item.name);
    const colors = getColorsForCategory(item.name);
    const isSelected = selectedCategory === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isSelected && {
            backgroundColor: themeName === 'dark' ? currentTheme.primary + '20' : '#F0FDF4',
            borderWidth: 1,
            borderColor: currentTheme.primary,
          },
        ]}
        onPress={() => selectCategory(item.id)}
      >
        <View
          style={[
            styles.categoryIconSmall,
            { backgroundColor: colors.bgColor },
            isSelected && { backgroundColor: colors.color },
          ]}
        >
          <IconComponent
            size={24}
            color={isSelected ? "#FFFFFF" : colors.color}
          />
        </View>
        <Text
          style={[
            dynamicStyles.categoryNameSmall,
            isSelected && dynamicStyles.selectedCategoryName,
          ]}
        >
          {item.name}
        </Text>
        <Text style={dynamicStyles.categoryCount}>{item.products_count} items</Text>
      </TouchableOpacity>
    );
  };

  const renderProductCard = ({ item }: { item: Product }) => {
    const hasDiscount = item.cost_price && item.sale_price > item.cost_price;
    const discountPercent = hasDiscount
      ? Math.round(
          ((item.sale_price - item.cost_price) / item.cost_price) * 100
        )
      : 0;

    return (
      <TouchableOpacity
        style={dynamicStyles.productCard}
        onPress={() => navigateToProduct(item.id)}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{
              uri: item.image_url || "https://via.placeholder.com/300x300",
            }}
            style={styles.productImage}
          />
          <TouchableOpacity style={[styles.favoriteButton, {
            backgroundColor: currentTheme.surface,
            shadowColor: '#000',
            shadowOpacity: themeName === 'dark' ? 0.3 : 0.1,
            elevation: themeName === 'dark' ? 4 : 2,
          }]}>
            <Heart size={16} color={currentTheme.textSecondary} />
          </TouchableOpacity>
          {item.is_low_stock && (
            <View style={[styles.lowStockBadge, { backgroundColor: currentTheme.warning }]}>
              <Text style={styles.lowStockText}>Low Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={dynamicStyles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={dynamicStyles.productCategory}>{item.category_name}</Text>

          {item.kilograms_in_stock && (
            <Text style={dynamicStyles.productWeight}>{item.kilograms_in_stock}kg in stock</Text>
          )}

          <View style={styles.priceRow}>
            <Text style={dynamicStyles.currentPrice}>Ksh {item.sale_price}</Text>
            {hasDiscount && (
              <Text style={dynamicStyles.originalPrice}>Ksh {item.cost_price}</Text>
            )}
          </View>

          <View style={styles.productFooter}>
            <View style={styles.stockContainer}>
              <Text
                style={[
                  dynamicStyles.stockText,
                  item.minimum_stock && item.in_stock <= item.minimum_stock && { color: currentTheme.error },
                ]}
              >
                {item.in_stock > 0
                  ? `${item.in_stock} in stock`
                  : "Out of stock"}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                dynamicStyles.addToCartButton,
                item.in_stock === 0 && dynamicStyles.disabledButton,
              ]}
              disabled={item.in_stock === 0}
              onPress={(e) => {
                e.stopPropagation();
                if (item.in_stock > 0) {
                  const weightToUse = item.kilograms_in_stock ? 0.5 : undefined;
                  const quantityToUse = item.kilograms_in_stock ? 1 : 1;
                  addItem(item, quantityToUse, weightToUse);
                  ToastService.showSuccess(
                    'Added to Cart',
                    `${item.name} added to cart`
                  );
                }
              }}
            >
              <Plus size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || !authChecked) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={dynamicStyles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={dynamicStyles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[currentTheme.primary]}
          tintColor={currentTheme.primary}
        />
      }
    >
      <View style={styles.welcomeSection}>
        <Text style={dynamicStyles.welcomeSubtext}>
          What would you like to buy today?
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={dynamicStyles.searchBar}>
          <Search size={20} color={currentTheme.textSecondary} style={styles.searchIconStyle} />
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={currentTheme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={18} color={currentTheme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.categoriesSection}>
        <Text style={dynamicStyles.sectionTitle}>Categories</Text>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id.toString()}
          key={categories.length}
          extraData={categories.length}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesListContainer}
        />
      </View>

      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
          <Text style={dynamicStyles.sectionTitle}>
            {(() => {
              if (searchQuery) {
                return `Search Results (${filteredProducts.length})`;
              }
              if (selectedCategory) {
                const categoryName = categories.find((c) => c.id === selectedCategory)?.name;
                return `${categoryName} (${filteredProducts.length})`;
              }
              return `All Products (${filteredProducts.length})`;
            })()}
          </Text>
          {(searchQuery || selectedCategory) && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSelectedCategory(null);
              }}
            >
              <Text style={dynamicStyles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredProducts.length > 0 ? (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductCard}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.productsGrid}
          />
        ) : (
          <View style={styles.noResults}>
            <Text style={dynamicStyles.noResultsText}>
              {searchQuery
                ? "No products found for your search"
                : "No products available"}
            </Text>
            {searchQuery && (
              <TouchableOpacity
                onPress={clearSearch}
                style={dynamicStyles.clearSearchButton}
              >
                <Text style={dynamicStyles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {user?.role === "admin" && (
        <View style={styles.adminSection}>
          <Text style={dynamicStyles.sectionTitle}>Admin Panel</Text>
          <TouchableOpacity
            style={dynamicStyles.adminButton}
            onPress={() => router.push("/admin" as any)}
          >
            <Text style={dynamicStyles.adminButtonText}>
              Manage Products & Categories
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

// Static styles that don't change with theme
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  welcomeSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchIconStyle: {
    marginRight: 12,
  },
  clearButton: {
    padding: 4,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesListContainer: {
    paddingRight: 16,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 16,
    width: 80,
    padding: 8,
    borderRadius: 12,
  },
  categoryIconSmall: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  productsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  productsGrid: {
    gap: 12,
  },
  productImageContainer: {
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  lowStockBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lowStockText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  productInfo: {
    padding: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockContainer: {
    flex: 1,
  },
  noResults: {
    padding: 32,
    alignItems: "center",
  },
  adminSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  bottomSpacing: {
    height: 20,
  },
});
