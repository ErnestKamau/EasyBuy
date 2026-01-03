// app/product/[id].tsx - Original design without specifications and category
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Product, productsApi } from '@/services/api';
import { ToastService } from '@/utils/toastService';
import { useCart } from '@/contexts/CartContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  ArrowLeft,
  Heart,
  Share,
  Plus,
  Minus,
  ShoppingCart,
  Shield,
  Truck,
  Star,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

const createProductDynamicStyles = (currentTheme: any, themeName: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: currentTheme.textSecondary,
  },
  errorText: {
    fontSize: 18,
    color: currentTheme.error,
    marginBottom: 16,
  },
  floatingButton: {
    width: 40,
    height: 40,
    backgroundColor: themeName === 'dark' 
      ? currentTheme.surface + 'E6' 
      : 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: themeName === 'dark' ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: themeName === 'dark' ? 6 : 3,
    borderWidth: themeName === 'dark' ? 1 : 0,
    borderColor: themeName === 'dark' ? currentTheme.border : 'transparent',
  },
  heroSection: {
    backgroundColor: themeName === 'dark' ? currentTheme.surface : '#F8FAFC',
    paddingBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: currentTheme.surface,
    marginHorizontal: 20,
    marginTop: 80,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: themeName === 'dark' ? 0.4 : 0.1,
    shadowRadius: 12,
    elevation: themeName === 'dark' ? 10 : 5,
    borderWidth: themeName === 'dark' ? 1 : 0,
    borderColor: themeName === 'dark' ? currentTheme.border : 'transparent',
  },
  productCard: {
    backgroundColor: currentTheme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
    marginTop: -20,
    borderWidth: themeName === 'dark' ? 1 : 0,
    borderColor: themeName === 'dark' ? currentTheme.border : 'transparent',
  },
  productName: {
    fontSize: 26,
    fontWeight: '800',
    color: currentTheme.text,
    marginBottom: 12,
    lineHeight: 32,
  },
  ratingText: {
    fontSize: 14,
    color: currentTheme.textSecondary,
    fontWeight: '500',
  },
  modernCurrentPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: currentTheme.text,
    marginRight: 12,
  },
  modernOriginalPrice: {
    fontSize: 20,
    color: currentTheme.textSecondary,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  savingsContainer: {
    backgroundColor: currentTheme.error + '20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  savingsText: {
    fontSize: 12,
    color: currentTheme.error,
    fontWeight: '600',
  },
  featureItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentTheme.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: currentTheme.textSecondary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: currentTheme.text,
    marginBottom: 12,
  },
  modernDescription: {
    fontSize: 15,
    color: currentTheme.textSecondary,
    lineHeight: 22,
  },
  stockBadge: {
    backgroundColor: currentTheme.warning + '20',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stockBadgeText: {
    color: currentTheme.warning,
    fontSize: 12,
    fontWeight: '600',
  },
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
  descriptionCard: {
    marginBottom: 24,
  },
  bottomBar: {
    backgroundColor: currentTheme.surface,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: currentTheme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: themeName === 'dark' ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: themeName === 'dark' ? 15 : 10,
  },
  quantityLabel: {
    fontSize: 16,
    color: currentTheme.textSecondary,
    fontWeight: '600',
    marginRight: 16,
  },
  modernQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentTheme.background,
    borderRadius: 12,
    padding: 2,
  },
  modernQuantityButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: currentTheme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: themeName === 'dark' ? 0.2 : 0.05,
    shadowRadius: 2,
    elevation: themeName === 'dark' ? 3 : 1,
    borderWidth: themeName === 'dark' ? 1 : 0,
    borderColor: themeName === 'dark' ? currentTheme.border : 'transparent',
  },
  disabledQuantityButton: {
    backgroundColor: currentTheme.background,
    shadowOpacity: 0,
    elevation: 0,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: currentTheme.text,
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: currentTheme.textSecondary,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: currentTheme.text,
  },
  modernAddToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentTheme.primary,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    gap: 8,
    shadowColor: currentTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledCartButton: {
    backgroundColor: currentTheme.textSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  modernAddToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

const useProductActions = (product: Product | null, quantity: number, selectedWeight: number, addItem: any) => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.in_stock || 0)) {
      return newQuantity;
    }
    return quantity;
  };

  const addToCart = async () => {
    if (!product) return;
    
    if (product.in_stock === 0) {
      ToastService.showError('Out of Stock', 'This product is currently unavailable');
      return;
    }

    try {
      const weightToUse = product.kilograms_in_stock ? selectedWeight : undefined;
      const quantityToUse = product.kilograms_in_stock ? 1 : quantity;
      
      addItem(product, quantityToUse, weightToUse);
      
      const weightText = weightToUse ? ` (${formatWeightAsFraction(selectedWeight)})` : '';
      const quantityText = product.kilograms_in_stock ? '' : `${quantity}x `;
      
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
    ToastService.showInfo('Share', 'Share functionality would be implemented here');
  };

  return { isFavorite, handleQuantityChange, addToCart, toggleFavorite, shareProduct };
};

// Weight increment function: 0 → 0.5kg → 1kg → 1.5kg → 2kg → 2.5kg...
const getNextWeight = (currentWeight: number, increment: boolean): number => {
  if (increment) {
    if (currentWeight === 0) return 0.5;
    return currentWeight + 0.5;
  } else {
    if (currentWeight <= 0.5) return 0;
    return currentWeight - 0.5;
  }
};

// Format weight as fraction: 1/2KG, 1KG, 1 1/2KG, 2KG...
const formatWeightAsFraction = (weight: number): string => {
  if (weight === 0) return "0KG";
  
  const wholePart = Math.floor(weight);
  const decimalPart = weight - wholePart;
  
  if (decimalPart === 0) {
    return `${wholePart}KG`;
  } else if (decimalPart === 0.5) {
    if (wholePart === 0) {
      return "1/2KG";
    } else {
      return `${wholePart} 1/2KG`;
    }
  } else {
    // Fallback for other decimal values (shouldn't happen with our increment logic)
    return `${weight}KG`;
  }
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState<number>(0);
  const { addItem } = useCart();
  const { currentTheme, themeName } = useTheme();

  const dynamicStyles = createProductDynamicStyles(currentTheme, themeName);
  const productActions = useProductActions(product, quantity, selectedWeight, addItem);
  const { isFavorite, handleQuantityChange, addToCart, toggleFavorite, shareProduct } = productActions;

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
      if (productData.kilograms_in_stock) {
        setSelectedWeight(0);
      }
    } catch (error) {
      ToastService.showApiError(error, 'Failed to load product');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (change: number) => {
    const newQuantity = handleQuantityChange(change);
    setQuantity(newQuantity);
  };

  const handleWeightChange = (increment: boolean) => {
    if (!product || !product.kilograms_in_stock) return;
    const newWeight = getNextWeight(selectedWeight, increment);
    const maxWeight = product.in_stock;
    if (newWeight <= maxWeight && newWeight >= 0) {
      setSelectedWeight(newWeight);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={dynamicStyles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.background }]}>
        <Text style={dynamicStyles.errorText}>Product not found</Text>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: currentTheme.primary }]} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasDiscount = product.cost_price && product.sale_price < product.cost_price;
  const discountPercent = hasDiscount ? 
    Math.round(((product.cost_price - product.sale_price) / product.cost_price) * 100) : 0;
  
  const totalPrice = product.kilograms_in_stock 
    ? (product.sale_price * selectedWeight) // sale_price is price per kg
    : product.sale_price * quantity;

  return (
    <View style={dynamicStyles.container}>
      <StatusBar 
        barStyle={themeName === 'dark' ? "light-content" : "dark-content"} 
        backgroundColor={currentTheme.background} 
      />
      
      <View style={styles.floatingHeader}>
        <TouchableOpacity onPress={() => router.back()} style={dynamicStyles.floatingButton}>
          <ArrowLeft size={20} color={currentTheme.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={shareProduct} style={dynamicStyles.floatingButton}>
            <Share size={18} color={currentTheme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFavorite} style={dynamicStyles.floatingButton}>
            <Heart 
              size={18} 
              color={isFavorite ? currentTheme.error : currentTheme.text}
              fill={isFavorite ? currentTheme.error : "none"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.heroSection}>
          <View style={dynamicStyles.imageContainer}>
            <Image 
              source={{ uri: product.image_url || 'https://via.placeholder.com/400x400' }}
              style={styles.productImage}
              resizeMode="cover"
            />
            {hasDiscount && (
              <View style={[styles.discountBadge, { backgroundColor: currentTheme.error }]}>
                <Text style={styles.discountText}>-{discountPercent}%</Text>
              </View>
            )}
          </View>
        </View>

        <View style={dynamicStyles.productCard}>
          {product.is_low_stock && (
            <View style={dynamicStyles.stockBadge}>
              <Text style={dynamicStyles.stockBadgeText}>Limited Stock</Text>
            </View>
          )}

          <Text style={dynamicStyles.productName}>{product.name}</Text>
          
          <View style={styles.ratingSection}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={16} color={currentTheme.warning} fill={currentTheme.warning} />
              ))}
            </View>
            <Text style={dynamicStyles.ratingText}>(4.8 • 124 reviews)</Text>
          </View>

          <View style={styles.modernPriceSection}>
            <View style={styles.priceRow}>
              <Text style={dynamicStyles.modernCurrentPrice}>Ksh {product.sale_price.toLocaleString()}</Text>
              {hasDiscount && (
                <Text style={dynamicStyles.modernOriginalPrice}>Ksh {product.cost_price?.toLocaleString()}</Text>
              )}
            </View>
            {hasDiscount && (
              <View style={dynamicStyles.savingsContainer}>
                <Text style={dynamicStyles.savingsText}>
                  Save Ksh {((product.cost_price || 0) - product.sale_price).toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.featuresSection}>
            <View style={dynamicStyles.featureItem}>
              <Shield size={16} color={currentTheme.success} />
              <Text style={dynamicStyles.featureText}>Quality Guaranteed</Text>
            </View>
            <View style={dynamicStyles.featureItem}>
              <Truck size={16} color={currentTheme.success} />
              <Text style={dynamicStyles.featureText}>Fast Delivery</Text>
            </View>
            {product.kilograms_in_stock && (
              <View style={dynamicStyles.featureItem}>
                <ShoppingCart size={16} color={currentTheme.success} />
                <Text style={dynamicStyles.featureText}>Weight-based</Text>
              </View>
            )}
          </View>

          <View style={styles.modernStockSection}>
            <View style={[
              styles.stockIndicator,
              {
                backgroundColor: product.in_stock === 0 
                  ? currentTheme.error + '20' 
                  : product.is_low_stock 
                    ? currentTheme.warning + '20' 
                    : currentTheme.success + '20'
              }
            ]}>
              <View style={[
                styles.stockDot,
                {
                  backgroundColor: (() => {
                    if (product.in_stock === 0) return currentTheme.error;
                    if (product.is_low_stock) return currentTheme.warning;
                    return currentTheme.success;
                  })()
                }
              ]} />
              <Text style={[
                styles.stockText,
                {
                  color: (() => {
                    if (product.in_stock === 0) return currentTheme.error;
                    if (product.is_low_stock) return currentTheme.warning;
                    return currentTheme.success;
                  })()
                }
              ]}>
                {(() => {
                  if (product.in_stock === 0) return 'Out of Stock';
                  if (product.is_low_stock) return `Only ${product.in_stock} left`;
                  return `${product.in_stock} in stock`;
                })()}
              </Text>
            </View>
          </View>

          {product.description && (
            <View style={styles.descriptionCard}>
              <Text style={dynamicStyles.sectionTitle}>About this product</Text>
              <Text style={dynamicStyles.modernDescription}>{product.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={dynamicStyles.bottomBar}>
        {product.kilograms_in_stock ? (
          <View style={styles.weightContainer}>
            <Text style={dynamicStyles.quantityLabel}>Weight</Text>
            <View style={dynamicStyles.modernQuantityControls}>
              <TouchableOpacity 
                style={[
                  dynamicStyles.modernQuantityButton, 
                  selectedWeight <= 0 && dynamicStyles.disabledQuantityButton
                ]}
                onPress={() => handleWeightChange(false)}
                disabled={selectedWeight <= 0}
              >
                <Minus size={14} color={selectedWeight <= 0 ? currentTheme.textSecondary : currentTheme.text} />
              </TouchableOpacity>
              <Text style={dynamicStyles.quantityValue}>{formatWeightAsFraction(selectedWeight)}</Text>
              <TouchableOpacity 
                style={[
                  dynamicStyles.modernQuantityButton,
                  selectedWeight >= product.in_stock && dynamicStyles.disabledQuantityButton
                ]}
                onPress={() => handleWeightChange(true)}
                disabled={selectedWeight >= product.in_stock}
              >
                <Plus size={14} color={selectedWeight >= product.in_stock ? currentTheme.textSecondary : currentTheme.text} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.quantityContainer}>
            <Text style={dynamicStyles.quantityLabel}>Qty</Text>
            <View style={dynamicStyles.modernQuantityControls}>
              <TouchableOpacity 
                style={[
                  dynamicStyles.modernQuantityButton, 
                  quantity <= 1 && dynamicStyles.disabledQuantityButton
                ]}
                onPress={() => updateQuantity(-1)}
                disabled={quantity <= 1}
              >
                <Minus size={14} color={quantity <= 1 ? currentTheme.textSecondary : currentTheme.text} />
              </TouchableOpacity>
              <Text style={dynamicStyles.quantityValue}>{quantity}</Text>
              <TouchableOpacity 
                style={[
                  dynamicStyles.modernQuantityButton, 
                  quantity >= product.in_stock && dynamicStyles.disabledQuantityButton
                ]}
                onPress={() => updateQuantity(1)}
                disabled={quantity >= product.in_stock}
              >
                <Plus size={14} color={quantity >= product.in_stock ? currentTheme.textSecondary : currentTheme.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.actionContainer}>
          <View style={styles.priceContainer}>
            <Text style={dynamicStyles.totalLabel}>Total</Text>
            <Text style={dynamicStyles.totalAmount}>Ksh {totalPrice.toLocaleString()}</Text>
          </View>
          <TouchableOpacity 
            style={[
              dynamicStyles.modernAddToCartButton,
              product.in_stock === 0 && dynamicStyles.disabledCartButton
            ]}
            onPress={addToCart}
            disabled={product.in_stock === 0}
          >
            <ShoppingCart size={18} color="#FFFFFF" />
            <Text style={dynamicStyles.modernAddToCartText}>
              {product.in_stock === 0 ? 'Unavailable' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  scrollContainer: {
    flex: 1,
  },
  productImage: {
    width: screenWidth - 40,
    height: screenWidth - 40,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  modernPriceSection: {
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  featuresSection: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
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
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  priceContainer: {
    flex: 1,
  },
});
