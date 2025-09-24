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
} from 'react-native';
import { router } from 'expo-router';
import { User, authApi } from '@/services/api';
import * as Location from 'expo-location';
// Import Lucide icons
import { 
  Leaf, 
  Coffee, 
  Nut, 
  ShoppingBag,
  Search,
  ShoppingCart,
  Package,
  Heart,
  HelpCircle,
  MapPin,
  X,
  Plus
} from 'lucide-react-native';

// Get device dimensions for responsive design
const { width: screenWidth } = Dimensions.get('window');

// Small categories for horizontal scroll (like the image you showed)
const categories = [
  {
    id: 1,
    name: 'Khat',
    icon: Leaf,
    color: '#22C55E',
    bgColor: '#DCFCE7',
  },
  {
    id: 2,
    name: 'Sodas',
    icon: Coffee,
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
  {
    id: 3,
    name: 'Snacks',
    icon: Nut,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  {
    id: 4,
    name: 'Bags',
    icon: ShoppingBag,
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
  },
];

// Sample products with real images (you'll replace with your actual product images)
const featuredProducts = [
  {
    id: 1,
    name: '1kg Fresh Khat',
    price: 400,
    originalPrice: 450,
    image: 'https://images.unsplash.com/photo-1574782900055-3aedde902c89?w=300&h=300&fit=crop',
    category: 'Khat',
    inStock: true,
    rating: 4.5,
    discount: 11
  },
  {
    id: 2,
    name: '0.5kg Premium Khat',
    price: 200,
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a8e?w=300&h=300&fit=crop',
    category: 'Khat',
    inStock: true,
    rating: 4.8
  },
  {
    id: 3,
    name: 'Coca Cola 500ml',
    price: 80,
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300&h=300&fit=crop',
    category: 'Beverages',
    inStock: true,
    rating: 4.2
  },
  {
    id: 4,
    name: 'Mixed Nuts 250g',
    price: 150,
    originalPrice: 180,
    image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=300&h=300&fit=crop',
    category: 'Snacks',
    inStock: true,
    rating: 4.6,
    discount: 17
  },
  {
    id: 5,
    name: 'Sprite 500ml',
    price: 80,
    image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=300&h=300&fit=crop',
    category: 'Beverages',
    inStock: true,
    rating: 4.1
  },
  {
    id: 6,
    name: 'Carrier Bags (Pack of 10)',
    price: 100,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop',
    category: 'Accessories',
    inStock: true,
    rating: 4.0
  }
];

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState('Getting location...');
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    getCurrentLocation();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.log('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get user's current location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentLocation('Location permission denied');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address && address.length > 0) {
        const { city, region, country } = address[0];
        setCurrentLocation(`${city}, ${region}`);
      } else {
        setCurrentLocation('Unknown location');
      }
    } catch (error) {
      console.log('Location error:', error);
      setCurrentLocation('Ruiru, Kiambu County'); // Fallback
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/search');
    }
  };

  const navigateToCategory = (categoryId: number, categoryName: string) => {
    router.push(`/categories?id=${categoryId}&name=${encodeURIComponent(categoryName)}`);
  };

  // const navigateToProduct = (productId: number) => {
  //   router.push(`/product/${productId}`);
  // };

  // Open location picker (you'll create this page)
  const openLocationPicker = () => {
    router.push('/location-picker' as any);
  };

  const renderCategoryItem = ({ item }: { item: any }) => {
    const IconComponent = item.icon;
    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => navigateToCategory(item.id, item.name)}
      >
        <View style={[styles.categoryIconSmall, { backgroundColor: item.bgColor }]}>
          <IconComponent size={24} color={item.color} />
        </View>
        <Text style={styles.categoryNameSmall}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderProductCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productCard}
      // onPress={() => navigateToProduct(item.id)}
    >
      <View style={styles.productImageContainer}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        {item.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discount}% OFF</Text>
          </View>
        )}
        <TouchableOpacity style={styles.favoriteButton}>
          <Heart size={16} color="#64748B" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>Ksh {item.price}</Text>
          {item.originalPrice && (
            <Text style={styles.originalPrice}>Ksh {item.originalPrice}</Text>
          )}
        </View>
        
        <View style={styles.productFooter}>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>★ {item.rating}</Text>
          </View>
          <TouchableOpacity style={styles.addToCartButton}>
            <Plus size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
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
    >
      {/* Location Header */}
      <View style={styles.locationHeader}>
        <View style={styles.locationRow}>
          <MapPin size={20} color="#22C55E" style={styles.locationIconStyle} />
          <View>
            <Text style={styles.deliverToText}>Deliver to</Text>
            <Text style={styles.locationText}>
              {locationLoading ? 'Getting location...' : currentLocation}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.changeLocationButton}
          onPress={openLocationPicker}
        >
          <Text style={styles.changeLocationText}>Change</Text>
        </TouchableOpacity>
      </View>

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
            placeholder="Search for khat, sodas, snacks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Small Categories Section (Horizontal Scroll) */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesListContainer}
        />
      </View>

      {/* Featured Products Section */}
      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          {/* <TouchableOpacity onPress={() => router.push('/products')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity> */}
        </View>
        
        <FlatList
          data={featuredProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productsGrid}
        />
      </View>

      {/* Bottom Spacing */}
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

  // Location Header
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingTop: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconStyle: {
    marginRight: 8,
  },
  deliverToText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  locationText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  changeLocationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  changeLocationText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
  },

  // Welcome Section
  welcomeSection: {
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
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  searchBar: {
    flex: 1,
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
  searchButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },

  // Small Categories Section
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
  seeAllText: {
    color: '#22C55E',
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  addToCartButton: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});