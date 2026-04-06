// app/product/[id].tsx - Original design without specifications and category
import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Product, productsApi } from "@/services/api";
import { ToastService } from "@/utils/toastService";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowLeft,
  Heart,
  Plus,
  Minus,
  ShoppingBag,
  Star,
} from "lucide-react-native";

const { width: screenWidth } = Dimensions.get("window");

const createProductDynamicStyles = (currentTheme: any, themeName: string) =>
  StyleSheet.create({
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
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 60,
      paddingBottom: 10,
      backgroundColor: currentTheme.background,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: currentTheme.text,
    },
    floatingButton: {
      width: 44,
      height: 44,
      backgroundColor: currentTheme.surface,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: themeName === "dark" ? 1 : 0,
      borderColor: themeName === "dark" ? currentTheme.border : "transparent",
    },
    heroSection: {
      backgroundColor: currentTheme.background,
      paddingBottom: 10,
      alignItems: "center",
    },
    imageContainer: {
      width: screenWidth * 0.85,
      height: screenWidth * 0.85,
      backgroundColor: currentTheme.surface,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 8,
      marginTop: 20,
      marginBottom: 20,
    },
    productImage: {
      width: "85%",
      height: "85%",
    },
    thumbnailList: {
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 20,
    },
    thumbnailContainer: {
      width: 64,
      height: 64,
      borderRadius: 12,
      backgroundColor: currentTheme.surface,
      padding: 4,
      borderWidth: 1,
      borderColor: currentTheme.border,
    },
    activeThumbnail: {
      borderColor: currentTheme.primary,
      borderWidth: 2,
    },
    thumbnailImage: {
      width: "100%",
      height: "100%",
      borderRadius: 8,
    },
    productCard: {
      backgroundColor: currentTheme.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 120,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.05,
      shadowRadius: 15,
      elevation: 10,
    },
    categoryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    categoryText: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      fontWeight: "500",
    },
    ratingBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    ratingText: {
      fontSize: 14,
      color: currentTheme.textSecondary,
      fontWeight: "600",
    },
    productName: {
      fontSize: 28,
      fontWeight: "800",
      color: currentTheme.text,
      marginBottom: 20,
      lineHeight: 34,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: currentTheme.text,
      marginBottom: 12,
    },
    descriptionText: {
      fontSize: 15,
      color: currentTheme.textSecondary,
      lineHeight: 24,
    },
    readMore: {
      color: currentTheme.primary,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
    selectionSection: {
      marginTop: 24,
      marginBottom: 24,
    },
    selectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: currentTheme.text,
      marginBottom: 16,
    },
    quantityContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.background,
      alignSelf: "flex-start",
      borderRadius: 30,
      padding: 4,
    },
    quantityButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: currentTheme.surface,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    quantityValue: {
      fontSize: 18,
      fontWeight: "700",
      color: currentTheme.text,
      marginHorizontal: 20,
      minWidth: 24,
      textAlign: "center",
    },
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: currentTheme.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 34,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -5 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 20,
    },
    priceContainer: {
      flex: 1,
    },
    totalLabel: {
      fontSize: 13,
      color: currentTheme.textSecondary,
      fontWeight: "500",
      marginBottom: 4,
    },
    totalAmount: {
      fontSize: 24,
      fontWeight: "800",
      color: currentTheme.text,
    },
    addToCartButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.primary,
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 30,
      gap: 10,
    },
    addToCartText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
    disabledButton: {
      opacity: 0.6,
    },
    descriptionCard: {
      marginBottom: 24,
    },
  });

const useProductActions = (
  product: Product | null,
  quantity: number,
  selectedWeight: number,
  addItem: any,
) => {
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
      ToastService.showError(
        "Out of Stock",
        "This product is currently unavailable",
      );
      return;
    }

    // Check if quantity or weight is selected
    const weightToUse = product.kilograms_in_stock ? selectedWeight : undefined;
    const quantityToUse = product.kilograms_in_stock ? 1 : quantity;

    if (product.kilograms_in_stock && selectedWeight === 0) {
      ToastService.showWarning(
        "Selection Required",
        "Please add kilogram amount to proceed",
      );
      return;
    }

    if (!product.kilograms_in_stock && quantity === 0) {
      ToastService.showWarning(
        "Selection Required",
        "Please add quantity to proceed",
      );
      return;
    }

    try {
      addItem(product, quantityToUse, weightToUse);

      const weightText = weightToUse
        ? ` (${formatWeightAsFraction(selectedWeight)})`
        : "";
      const quantityText = product.kilograms_in_stock ? "" : `${quantity}x `;

      ToastService.showSuccess(
        "Added to Cart",
        `${quantityText}${product.name}${weightText} added to cart`,
      );
    } catch (error) {
      ToastService.showError("Error", "Failed to add item to cart");
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    ToastService.showInfo(
      isFavorite ? "Removed from Favorites" : "Added to Favorites",
      isFavorite
        ? "Product removed from your favorites"
        : "Product added to your favorites",
    );
  };

  const shareProduct = () => {
    ToastService.showInfo(
      "Share",
      "Share functionality would be implemented here",
    );
  };

  return {
    isFavorite,
    handleQuantityChange,
    addToCart,
    toggleFavorite,
    shareProduct,
  };
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { addItem } = useCart();
  const { currentTheme, themeName } = useTheme();

  const dynamicStyles = createProductDynamicStyles(currentTheme, themeName);
  const productActions = useProductActions(
    product,
    quantity,
    selectedWeight,
    addItem,
  );
  const {
    isFavorite,
    handleQuantityChange,
    addToCart,
    toggleFavorite,
  } = productActions;

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
      ToastService.showApiError(error, "Failed to load product");
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
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: currentTheme.background },
        ]}
      >
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={dynamicStyles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: currentTheme.background },
        ]}
      >
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

  const totalPrice = product.kilograms_in_stock
    ? product.sale_price * selectedWeight // sale_price is price per kg
    : product.sale_price * quantity;

  return (
    <View style={dynamicStyles.container}>
      <StatusBar
        barStyle={themeName === "dark" ? "light-content" : "dark-content"}
        backgroundColor={currentTheme.background}
      />

      <View style={dynamicStyles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={dynamicStyles.floatingButton}
        >
          <ArrowLeft size={20} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Product Details</Text>
        <TouchableOpacity
          onPress={toggleFavorite}
          style={dynamicStyles.floatingButton}
        >
          <Heart
            size={20}
            color={isFavorite ? currentTheme.error : currentTheme.text}
            fill={isFavorite ? currentTheme.error : "none"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={dynamicStyles.heroSection}>
          <View style={dynamicStyles.imageContainer}>
            <Image
              source={{
                uri: product.image_url || "https://via.placeholder.com/400x400",
              }}
              style={dynamicStyles.productImage}
              resizeMode="contain"
            />
          </View>

          {/* Mock Thumbnail List */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={dynamicStyles.thumbnailList}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity
                key={i}
                style={[
                  dynamicStyles.thumbnailContainer,
                  i === 1 && dynamicStyles.activeThumbnail,
                ]}
              >
                <Image
                  source={{
                    uri: product.image_url || "https://via.placeholder.com/400x400",
                  }}
                  style={dynamicStyles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={dynamicStyles.productCard}>
          <View style={dynamicStyles.categoryRow}>
            <Text style={dynamicStyles.categoryText}>
              {product.category_name || "General"}
            </Text>
            <View style={dynamicStyles.ratingBadge}>
              <Star size={16} color="#FFB800" fill="#FFB800" />
              <Text style={dynamicStyles.ratingText}>4.5</Text>
            </View>
          </View>

          <Text style={dynamicStyles.productName}>{product.name}</Text>

          <View style={dynamicStyles.descriptionCard}>
            <Text style={dynamicStyles.sectionTitle}>Product Details</Text>
            <Text
              style={dynamicStyles.descriptionText}
              numberOfLines={isDescriptionExpanded ? undefined : 3}
            >
              {product.description || "No description available for this product."}
            </Text>
            {product.description && product.description.length > 100 && (
              <TouchableOpacity
                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              >
                <Text style={dynamicStyles.readMore}>
                  {isDescriptionExpanded ? " Read less" : " Read more"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={dynamicStyles.selectionSection}>
            <Text style={dynamicStyles.selectionTitle}>
              {product.kilograms_in_stock ? "Select Weight" : "Quantity"}
            </Text>
            <View style={dynamicStyles.quantityContainer}>
              <TouchableOpacity
                style={[
                  dynamicStyles.quantityButton,
                  (product.kilograms_in_stock ? selectedWeight <= 0 : quantity <= 1) &&
                    dynamicStyles.disabledButton,
                ]}
                onPress={() =>
                  product.kilograms_in_stock
                    ? handleWeightChange(false)
                    : updateQuantity(-1)
                }
                disabled={
                  product.kilograms_in_stock ? selectedWeight <= 0 : quantity <= 1
                }
              >
                <Minus
                  size={18}
                  color={currentTheme.text}
                />
              </TouchableOpacity>
              <Text style={dynamicStyles.quantityValue}>
                {product.kilograms_in_stock
                  ? formatWeightAsFraction(selectedWeight)
                  : quantity}
              </Text>
              <TouchableOpacity
                style={[
                  dynamicStyles.quantityButton,
                  (product.kilograms_in_stock
                    ? selectedWeight >= product.in_stock
                    : quantity >= product.in_stock) && dynamicStyles.disabledButton,
                ]}
                onPress={() =>
                  product.kilograms_in_stock
                    ? handleWeightChange(true)
                    : updateQuantity(1)
                }
                disabled={
                  product.kilograms_in_stock
                    ? selectedWeight >= product.in_stock
                    : quantity >= product.in_stock
                }
              >
                <Plus
                  size={18}
                  color={currentTheme.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={dynamicStyles.bottomBar}>
        <View style={dynamicStyles.priceContainer}>
          <Text style={dynamicStyles.totalLabel}>Total Price</Text>
          <Text style={dynamicStyles.totalAmount}>
            Ksh {totalPrice.toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            dynamicStyles.addToCartButton,
            product.in_stock === 0 && dynamicStyles.disabledButton,
          ]}
          onPress={addToCart}
          disabled={product.in_stock === 0}
        >
          <ShoppingBag size={20} color="#FFFFFF" />
          <Text style={dynamicStyles.addToCartText}>
            {product.in_stock === 0 ? "Out of Stock" : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  scrollContainer: {
    flex: 1,
  },
});
