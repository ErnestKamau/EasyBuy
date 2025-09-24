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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Product, productsApi } from '@/services/api';
import { ToastService } from '@/utils/toastService';
import { 
  ArrowLeft,
  Heart,
  Share,
  Plus,
  Minus,
  ShoppingCart,
  Package,
  Info
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

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

  const addToCart = () => {
    if (!product) return;
    
    if (product.in_stock === 0) {
      ToastService.showError('Out of Stock', 'This product is currently unavailable');
      return;
    }

    // Here you would typically add to cart logic
    ToastService.showSuccess('Added to Cart', `${quantity}x ${product.name} added to cart`);
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
  const totalPrice = product.sale_price * quantity;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={shareProduct} style={styles.headerButton}>
            <Share size={20} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFavorite} style={styles.headerButton}>
            <Heart 
              size={20} 
              color={isFavorite ? "#EF4444" : "#1E293B"}
              fill={isFavorite ? "#EF4444" : "none"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.image_url || 'https://via.placeholder.com/400x400' }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
          {product.is_low_stock && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Low Stock</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.categoryName}>{product.category_name}</Text>
          
          {product.kilograms && (
            <View style={styles.weightContainer}>
              <Package size={16} color="#22C55E" />
              <Text style={styles.weightText}>{product.kilograms}kg</Text>
            </View>
          )}

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>Ksh {product.sale_price}</Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>Ksh {product.cost_price}</Text>
              )}
            </View>
            {hasDiscount && (
              <Text style={styles.savingsText}>
                You save Ksh {(product.cost_price - product.sale_price).toFixed(2)}
              </Text>
            )}
          </View>

          {/* Stock Status */}
          <View style={styles.stockSection}>
            <View style={styles.stockRow}>
              <Text style={styles.stockLabel}>Availability:</Text>
              <Text style={[
                styles.stockStatus,
                product.in_stock === 0 ? styles.outOfStock : 
                product.is_low_stock ? styles.lowStock : styles.inStock
              ]}>
                {product.in_stock === 0 ? 'Out of Stock' :
                 product.is_low_stock ? `Low Stock (${product.in_stock} left)` :
                 `In Stock (${product.in_stock} available)`}
              </Text>
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.descriptionSection}>
              <View style={styles.sectionHeader}>
                <Info size={18} color="#1E293B" />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Product Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{product.category_name}</Text>
            </View>
            {product.kilograms && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Weight:</Text>
                <Text style={styles.detailValue}>{product.kilograms}kg</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stock Level:</Text>
              <Text style={styles.detailValue}>{product.in_stock} units</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Product ID:</Text>
              <Text style={styles.detailValue}>#{product.id}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <View style={styles.quantitySection}>
          <Text style={styles.quantityLabel}>Quantity:</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity 
              style={[styles.quantityButton, quantity <= 1 && styles.disabledQuantityButton]}
              onPress={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <Minus size={16} color={quantity <= 1 ? "#94A3B8" : "#1E293B"} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity 
              style={[styles.quantityButton, quantity >= product.in_stock && styles.disabledQuantityButton]}
              onPress={() => handleQuantityChange(1)}
              disabled={quantity >= product.in_stock}
            >
              <Plus size={16} color={quantity >= product.in_stock ? "#94A3B8" : "#1E293B"} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <View style={styles.totalPriceContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>Ksh {totalPrice.toFixed(2)}</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.addToCartButton,
              product.in_stock === 0 && styles.disabledButton
            ]}
            onPress={addToCart}
            disabled={product.in_stock === 0}
          >
            <ShoppingCart size={20} color="#FFFFFF" />
            <Text style={styles.addToCartText}>
              {product.in_stock === 0 ? 'Out of Stock' : 'Add to Cart'}
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
    backgroundColor: '#F8FAFC',
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  // Content
  scrollContainer: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  productImage: {
    width: screenWidth,
    height: screenWidth,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  lowStockBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lowStockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Product Info
  productInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '600',
    marginBottom: 12,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  weightText: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '600',
  },

  // Price Section
  priceSection: {
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#22C55E',
    marginRight: 12,
  },
  originalPrice: {
    fontSize: 20,
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  savingsText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },

  // Stock Section
  stockSection: {
    marginBottom: 20,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 16,
    color: '#64748B',
    marginRight: 8,
  },
  stockStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  inStock: {
    color: '#22C55E',
  },
  lowStock: {
    color: '#F59E0B',
  },
  outOfStock: {
    color: '#EF4444',
  },

  // Description
  descriptionSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
  },

  // Details Section
  detailsSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 16,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },

  // Bottom Actions
  bottomActions: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    marginRight: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledQuantityButton: {
    backgroundColor: '#F8FAFC',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginHorizontal: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  totalPriceContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});