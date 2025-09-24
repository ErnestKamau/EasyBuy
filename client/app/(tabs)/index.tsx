// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { User, authApi, productsApi, Product, Category, isAuthenticated } from '@/services/api';
import { ToastService } from '@/utils/toastService';
import { handleCommonErrors, getErrorMessage } from '@/utils/errorUtils';
import { 
  Leaf, 
  Coffee, 
  Nut, 
  ShoppingBag,
  Search,
  Heart,
  X,
  Plus
} from 'lucide-react-native';

// Get device dimensions for responsive design
const { width: screenWidth } = Dimensions.get('window');

// Icon mapping for categories
const categoryIcons: Record<string, any> = {
  'Khat': Leaf,
  'Beverages': Coffee,
  'Snacks': Nut,
  'Bags': ShoppingBag,
  'Accessories': ShoppingBag,
  // Add more mappings as needed
};

const categoryColors: Record<string, { color: string; bgColor: string }> = {
  'Khat': { color: '#22C55E', bgColor: '#DCFCE7' },
  'Beverages': { color: '#3B82F6', bgColor: '#DBEAFE' },
  'Snacks': { color: '#F59E0B', bgColor: '#FEF3C7' },
  'Bags': { color: '#8B5CF6', bgColor: '#F3E8FF' },
  'Accessories': { color: '#8B5CF6', bgColor: '#F3E8FF' },
  // Default fallback
  'default': { color: '#64748B', bgColor: '#F1F5F9' }
};

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  // FIXED: Check authentication first before loading data
  const checkAuthAndLoadData = async () => {
    try {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        console.log("User not authenticated, redirecting to auth");
        router.replace('/auth');
        return;
      }
      
      setAuthChecked(true);
      await loadInitialData();
    } catch (error) {
      console.log("Auth check failed:", error);
      router.replace('/auth');
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserData(),
        loadCategories(),
        loadProducts()
      ]);
    } catch (error) {
      console.log("Failed to load initial data:", error);
      
      // Use the new error handling utility
      const wasHandled = handleCommonErrors(
        error,
        () => router.replace('/auth'), // On unauthorized
        (message) => ToastService.showError('Connection Error', message) // On network errors
      );
      
      // Show generic error for other cases
      if (!wasHandled) {
        ToastService.showError('Error', 'Failed to load app data. Please try again.');
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
        // If getCurrentUser returns null, user might not be authenticated
        console.log("getCurrentUser returned null, checking auth status");
        const authenticated = await isAuthenticated();
        if (!authenticated) {
          router.replace('/auth');
        }
      }
    } catch (error) {
      console.log('Failed to load user data:', error);
      
      // Use the new error handling utility
      const wasHandled = handleCommonErrors(
        error,
        () => router.replace('/auth'), // On unauthorized
        (message) => console.log('User data error:', message) // On other errors
      );
      
      // If it wasn't a common error, log it but don't show a toast (this is background data loading)
      if (!wasHandled) {
        console.log('Unexpected user data error:', getErrorMessage(error));
      }
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await productsApi.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.log('Failed to load categories:', error);
      
      // Use the new error handling utility
      const wasHandled = handleCommonErrors(
        error,
        () => router.replace('/auth'), // On unauthorized
        (message) => ToastService.showError('Connection Error', message) // On network errors
      );
      
      // Show error toast for other errors
      if (!wasHandled) {
        ToastService.showError('Error', 'Failed to load categories');
      }
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await productsApi.getProducts();
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.log('Failed to load products:', error);
      
      // Use the new error handling utility
      const wasHandled = handleCommonErrors(
        error,
        () => router.replace('/auth'), // On unauthorized
        (message) => ToastService.showError('Connection Error', message) // On network errors
      );
      
      // Show error toast for other errors
      if (!wasHandled) {
        ToastService.showError('Error', 'Failed to load products');
      }
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
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
    setSearchQuery('');
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
          isSelected && styles.selectedCategoryItem
        ]}
        onPress={() => selectCategory(item.id)}
      >
        <View style={[
          styles.categoryIconSmall, 
          { backgroundColor: colors.bgColor },
          isSelected && { backgroundColor: colors.color }
        ]}>
          <IconComponent 
            size={24} 
            color={isSelected ? '#FFFFFF' : colors.color} 
          />
        </View>
        <Text style={[
          styles.categoryNameSmall,
          isSelected && styles.selectedCategoryName
        ]}>
          {item.name}
        </Text>
        <Text style={styles.categoryCount}>
          {item.products_count} items
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProductCard = ({ item }: { item: Product }) => {
    const hasDiscount = item.cost_price && item.sale_price > item.cost_price;
    const discountPercent = hasDiscount ? 
      Math.round(((item.sale_price - item.cost_price) / item.cost_price) * 100) : 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigateToProduct(item.id)}
      >
        <View style={styles.productImageContainer}>
          <Image 
            source={{ uri: item.image_url || 'https://via.placeholder.com/300x300' }} 
            style={styles.productImage} 
          />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
          <TouchableOpacity style={styles.favoriteButton}>
            <Heart size={16} color="#64748B" />
          </TouchableOpacity>
          {item.is_low_stock && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Low Stock</Text>
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category_name}</Text>
          
          {item.kilograms && (
            <Text style={styles.productWeight}>{item.kilograms}kg</Text>
          )}
          
          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>Ksh {item.sale_price}</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>Ksh {item.cost_price}</Text>
            )}
          </View>
          
          <View style={styles.productFooter}>
            <View style={styles.stockContainer}>
              <Text style={[
                styles.stockText,
                item.in_stock <= item.minimum_stock && styles.lowStockText
              ]}>
                {item.in_stock > 0 ? `${item.in_stock} in stock` : 'Out of stock'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.addToCartButton,
                item.in_stock === 0 && styles.disabledButton
              ]}
              disabled={item.in_stock === 0}
            >
              <Plus size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading screen while checking authentication
  if (loading || !authChecked) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          Hello, {user?.username || 'Guest'}!
        </Text>
        <Text style={styles.welcomeSubtext}>
          What would you like to buy today?
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748B" style={styles.searchIconStyle} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories Section */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id.toString()}
          key={categories.length} // Force re-render when categories change
          extraData={categories.length} // Force re-render when data changes
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesListContainer}
        />
      </View>

      {/* Products Section */}
      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Search Results (${filteredProducts.length})` : 
             selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name} (${filteredProducts.length})` :
             `All Products (${filteredProducts.length})`}
          </Text>
          {(searchQuery || selectedCategory) && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}>
              <Text style={styles.clearFiltersText}>Clear</Text>
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
            <Text style={styles.noResultsText}>
              {searchQuery ? 'No products found for your search' : 'No products available'}
            </Text>
            {searchQuery && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Admin Quick Access - Only show for admin users */}
      {user?.role === 'admin' && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Admin Panel</Text>
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => router.push('/admin' as any)}
          >
            <Text style={styles.adminButtonText}>Manage Products & Categories</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },

  // Welcome Section
  welcomeSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },

  // Search Bar
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIconStyle: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  clearButton: {
    padding: 4,
  },

  // Categories Section
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  categoriesListContainer: {
    paddingRight: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
    padding: 8,
    borderRadius: 12,
  },
  selectedCategoryItem: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  categoryIconSmall: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryNameSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  selectedCategoryName: {
    color: '#22C55E',
  },
  categoryCount: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },

  // Products Section
  productsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearFiltersText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  productsGrid: {
    gap: 12,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 18,
  },
  productCategory: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  productWeight: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockContainer: {
    flex: 1,
  },
  stockText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  lowStockText: {
    color: '#EF4444',
  },
  addToCartButton: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },

  // No Results
  noResults: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearSearchButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Admin Section
  adminSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  adminButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomSpacing: {
    height: 20,
  },
})