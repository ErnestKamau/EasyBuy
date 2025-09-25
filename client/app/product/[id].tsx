// app/product/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Product, productsApi } from '@/services/api';
import { ToastService } from '@/utils/toastService';
import { useCart } from '@/contexts/CartContext';
import { 
  ArrowLeft,
  Heart,
  Share,
  Plus,
  Minus,
  ShoppingCart,
  Package,
  Info,
  Star,
  Shield,
  Truck
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState<number>(0.5); // Default weight for weight-based products
  const [isFavorite, setIsFavorite] = useState(false);
  const { addItem, getItemCount, state } = useCart();

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await productsApi.getProduct(Number(id));
      setProduct(productData);
    } catch (error) {
      ToastService.showApiError(error, 'Failed to load product');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.in_stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  const addToCart = async () => {
    if (!product) return;
    
    if (product.in_stock === 0) {
      ToastService.showError('Out of Stock', 'This product is currently unavailable');
      return;
    }

    try {
      // For weight-based products, use selected weight; for regular products, use quantity
      const weightToUse = product.kilograms ? selectedWeight : undefined;
      const quantityToUse = product.kilograms ? 1 : quantity; // Weight-based products always use quantity 1
      
      addItem(product, quantityToUse, weightToUse);
      
      const weightText = weightToUse ? ` (${weightToUse}kg)` : '';
      const quantityText = product.kilograms ? '' : `${quantity}x `;
      
      ToastService.showSuccess(
        'Added to Cart', 
        `${quantityText}${product.name}${weightText} added to cart`
      );
    } catch (error) {
      ToastService.showError('Error', 'Failed to add item to cart');
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    ToastService.showInfo(
      isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
      isFavorite ? 'Product removed from your favorites' : 'Product added to your favorites'
    );
  };

  const shareProduct = () => {
    // Share functionality would go here
    ToastService.showInfo('Share', 'Share functionality would be implemented here');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasDiscount = product.cost_price && product.sale_price > product.cost_price;
  const discountPercent = hasDiscount ? 
    Math.round(((product.sale_price - product.cost_price) / product.cost_price) * 100) : 0;
  
  // Calculate total price based on product type
  const totalPrice = product.kilograms 
    ? (product.sale_price / (product.kilograms || 1)) * selectedWeight  // Price per kg * selected weight
    : product.sale_price * quantity; // Regular price * quantity

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Floating Header */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.floatingButton}>
          <ArrowLeft size={20} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={shareProduct} style={styles.floatingButton}>
            <Share size={18} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFavorite} style={styles.floatingButton}>
            <Heart 
              size={18} 
              color={isFavorite ? "#EF4444" : "#1E293B"}
              fill={isFavorite ? "#EF4444" : "none"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={styles.heroSection}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: product.image_url || 'https://via.placeholder.com/400x400' }}
              style={styles.productImage}
              resizeMode="cover"
            />
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discountPercent}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* Product Info Card */}
        <View style={styles.productCard}>
          {/* Product Header */}
          <View style={styles.productHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{product.category_name}</Text>
            </View>
            {product.is_low_stock && (
              <View style={styles.stockBadge}>
                <Text style={styles.stockBadgeText}>Limited Stock</Text>
              </View>
            )}
          </View>

          <Text style={styles.productName}>{product.name}</Text>
          
          {/* Rating Section - Mock for now */}
          <View style={styles.ratingSection}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={16} color="#FCD34D" fill="#FCD34D" />
              ))}
            </View>
            <Text style={styles.ratingText}>(4.8 • 124 reviews)</Text>
          </View>

          {/* Price Section */}
          <View style={styles.modernPriceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.modernCurrentPrice}>Ksh {product.sale_price.toLocaleString()}</Text>
              {hasDiscount && (
                <Text style={styles.modernOriginalPrice}>Ksh {product.cost_price?.toLocaleString()}</Text>
              )}
            </View>
            {hasDiscount && (
              <View style={styles.savingsContainer}>
                <Text style={styles.savingsText}>
                  Save Ksh {((product.cost_price || 0) - product.sale_price).toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <View style={styles.featureItem}>
              <Shield size={16} color="#22C55E" />
              <Text style={styles.featureText}>Quality Guaranteed</Text>
            </View>
            <View style={styles.featureItem}>
              <Truck size={16} color="#22C55E" />
              <Text style={styles.featureText}>Fast Delivery</Text>
            </View>
            {product.kilograms && (
              <View style={styles.featureItem}>
                <Package size={16} color="#22C55E" />
                <Text style={styles.featureText}>{product.kilograms}kg</Text>
              </View>
            )}
          </View>

          {/* Stock Status */}
          <View style={styles.modernStockSection}>
            <View style={[
              styles.stockIndicator,
              {
                backgroundColor: product.in_stock === 0 ? '#FEF2F2' : 
                                product.is_low_stock ? '#FFFBEB' : '#F0FDF4'
              }
            ]}>
              <View style={[
                styles.stockDot,
                {
                  backgroundColor: product.in_stock === 0 ? '#EF4444' : 
                                  product.is_low_stock ? '#F59E0B' : '#22C55E'
                }
              ]} />
              <Text style={[
                styles.stockText,
                {
                  color: product.in_stock === 0 ? '#EF4444' : 
                         product.is_low_stock ? '#F59E0B' : '#22C55E'
                }
              ]}>
                {product.in_stock === 0 ? 'Out of Stock' :
                 product.is_low_stock ? `Only ${product.in_stock} left` :
                 `${product.in_stock} in stock`}
              </Text>
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>About this product</Text>
              <Text style={styles.modernDescription}>{product.description}</Text>
            </View>
          )}

          {/* Specifications */}
          <View style={styles.specsCard}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Category</Text>
                <Text style={styles.specValue}>{product.category_name}</Text>
              </View>
              {product.kilograms && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Weight</Text>
                  <Text style={styles.specValue}>{product.kilograms}kg</Text>
                </View>
              )}
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>SKU</Text>
                <Text style={styles.specValue}>#{product.id}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Stock</Text>
                <Text style={styles.specValue}>{product.in_stock} units</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modern Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {product.kilograms ? (
          /* Weight Selection for Kilogram-based Products */
          <View style={styles.weightContainer}>
            <Text style={styles.quantityLabel}>Weight (kg)</Text>
            <View style={styles.weightControls}>
              <TouchableOpacity 
                style={[styles.modernQuantityButton, selectedWeight <= 0.5 && styles.disabledQuantityButton]}
                onPress={() => setSelectedWeight(Math.max(0.5, selectedWeight - 0.25))}
                disabled={selectedWeight <= 0.5}
              >
                <Minus size={14} color={selectedWeight <= 0.5 ? "#94A3B8" : "#64748B"} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{selectedWeight}kg</Text>
              <TouchableOpacity 
                style={styles.modernQuantityButton}
                onPress={() => setSelectedWeight(selectedWeight + 0.25)}
              >
                <Plus size={14} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Quantity Selection for Regular Products */
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Qty</Text>
            <View style={styles.modernQuantityControls}>
              <TouchableOpacity 
                style={[styles.modernQuantityButton, quantity <= 1 && styles.disabledQuantityButton]}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus size={14} color={quantity <= 1 ? "#94A3B8" : "#64748B"} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity 
                style={[styles.modernQuantityButton, quantity >= product.in_stock && styles.disabledQuantityButton]}
                onPress={() => handleQuantityChange(1)}
                disabled={quantity >= product.in_stock}
              >
                <Plus size={14} color={quantity >= product.in_stock ? "#94A3B8" : "#64748B"} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.actionContainer}>
          <View style={styles.priceContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>Ksh {totalPrice.toLocaleString()}</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.modernAddToCartButton,
              product.in_stock === 0 && styles.disabledCartButton
            ]}
            onPress={addToCart}
            disabled={product.in_stock === 0}
          >
            <ShoppingCart size={18} color="#FFFFFF" />
            <Text style={styles.modernAddToCartText}>
              {product.in_stock === 0 ? 'Unavailable' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Floating Header
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  floatingButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },

  // Content
  scrollContainer: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#F8FAFC',
    paddingBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 80,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  productImage: {
    width: screenWidth - 40,
    height: screenWidth - 40,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#EF4444',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Product Card
  productCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
    marginTop: -20,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryBadgeText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
  },
  stockBadge: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stockBadgeText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  productName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 32,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Modern Price Section
  modernPriceSection: {
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  modernCurrentPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginRight: 12,
  },
  modernOriginalPrice: {
    fontSize: 20,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  savingsContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  savingsText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },

  // Features Section
  featuresSection: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  featureItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },

  // Modern Stock Section
  modernStockSection: {
    marginBottom: 24,
  },
  stockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Description Card
  descriptionCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modernDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },

  // Specs Card
  specsCard: {
    marginBottom: 24,
  },
  specGrid: {
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  specLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  specValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },

  // Modern Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 2,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginRight: 16,
  },
  modernQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 2,
  },
  modernQuantityButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  disabledQuantityButton: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  priceContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  modernAddToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledCartButton: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  modernAddToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
