import { fetchProductById, fetchRecommendedProducts } from "@/api/products";
import Quantitybtn from "@/components/Quantitybtn";
import RecommendedList from "@/components/RecommendedList";
import CustomAlertBox from "@/components/CustomAlertBox";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useNavigationBar } from "@/hooks/useNavigationBar";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import useHardwareBack from "@/hooks/useHardwareBack";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import GlassBackground from "../../src/components/GlassBackground";

const { height } = Dimensions.get("window");

type RecommendedItem = {
  _id: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
};

const ProductDetail = () => {
  useHardwareBack("/(drawer)/(tabs)/product");
  const params = useLocalSearchParams();
  const id = params.id as string;
  const theme = useAppTheme();
  const { hideNavigationBar, showNavigationBar } = useNavigationBar();
  const { visible, options, showSuccess, showError, showAlert, hideAlert } =
    useCustomAlert();
  const addItem = useCartStore((s) => s.addItem);
  const { addToWishlist, removeFromWishlist, isWishlisted } =
    useWishlistStore();
  const router = useRouter();

  // Defaults
  const DEFAULT_COLOR = "#000000";
  const colors = ["#000000", "#C62828", "#1565C0"];

  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [selectedColor, setSelectedColor] = useState<string | null>(
    DEFAULT_COLOR
  );
  const [recommendedItems, setRecommendedItems] = useState<RecommendedItem[]>(
    []
  );
  const [selectedRecommended, setSelectedRecommended] = useState<string[]>([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(id),
  });

  const category = product?.category;
  const excludeId = product?._id;
  const { data: recommendedProducts } = useQuery({
    queryKey: ["recommended", category, excludeId],
    queryFn: () => fetchRecommendedProducts(excludeId?.toString() ?? ""),
    enabled: !!category && !!excludeId,
  });

  useEffect(() => {
    if (recommendedProducts) {
      const initialRecommended = recommendedProducts.map((item: any) => ({
        ...item,
        quantity: 1,
      }));
      setRecommendedItems(initialRecommended);
    }
  }, [recommendedProducts]);

  // Initialize selected variants when product loads
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const initialVariants: Record<string, string> = {};
      product.variants.forEach((variant: any) => {
        if (variant.options && variant.options.length > 0) {
          initialVariants[variant.name] = variant.options[0];
        }
      });
      setSelectedVariants(initialVariants);
    }
  }, [product]);

  // Hide navigation bar when component mounts, show when unmounts
  useEffect(() => {
    hideNavigationBar();

    return () => {
      showNavigationBar();
    };
  }, [hideNavigationBar, showNavigationBar]);

  const isWishlistActive = product ? isWishlisted(product._id) : false;

  const toggleWishlist = async () => {
    if (!product) return;
    try {
      if (isWishlistActive) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist({
          id: product._id,
          title: product.title,
          price: product.price,
          image: product.image,
        });
      }
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
      // You could show a toast notification here
    }
  };

  const updateRecommendedQuantity = (recId: string, quantity: number) => {
    setRecommendedItems((prev) =>
      prev.map((item) =>
        item._id === recId ? { ...item, quantity: quantity } : item
      )
    );
  };

  const toggleRecommendedSelection = (recId: string) => {
    setSelectedRecommended((prev) =>
      prev.includes(recId)
        ? prev.filter((id) => id !== recId)
        : [...prev, recId]
    );
  };

  const calculateTotal = () => {
    const mainProductTotal = (product?.price || 0) * quantity;
    const selectedRecommendedTotal = recommendedItems
      .filter((item) => selectedRecommended.includes(item._id))
      .reduce((sum, item) => sum + item.quantity * item.price, 0);

    return (mainProductTotal + selectedRecommendedTotal).toFixed(2);
  };

  const handleAddToCart = async () => {
    if (!product || isAddingToCart) return;

    setIsAddingToCart(true);

    try {
      const finalColor = selectedColor ?? DEFAULT_COLOR;
      setSelectedColor(finalColor);

      // Create variant string for cart ID
      const variantString = Object.entries(selectedVariants)
        .map(([key, value]) => `${key}:${value}`)
        .join("-");

      // Add main product
      await addItem({
        _id: product._id,
        title: product.name,
        image: product.image || product.images?.[0],
        price: product.price,
        quantity: quantity,
        variant: variantString,
        productId: product._id,
        name: "",
      });

      // Add selected recommended items
      for (const item of recommendedItems.filter((item) =>
        selectedRecommended.includes(item._id)
      )) {
        await addItem({
          _id: product._id,
          variant: variantString,
          title: item.title,
          image: item.image || "",
          price: item.price,
          quantity: item.quantity,
          productId: product._id,
          name: "",
        });
      }

      // Show success feedback
      showSuccess(
        `Items added to cart successfully!\nTotal: AED ${calculateTotal()}`
      );
    } catch (error) {
      console.error("Failed to add items to cart:", error);
      showError("Failed to add items to cart. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || isAddingToCart) return;

    setIsAddingToCart(true);

    try {
      const finalColor = selectedColor ?? DEFAULT_COLOR;
      setSelectedColor(finalColor);

      // Create variant string for cart ID
      const variantString = Object.entries(selectedVariants)
        .map(([key, value]) => `${key}:${value}`)
        .join("-");

      // Add main product
      addItem({
        _id: `${product._id}-${variantString}-${finalColor}`,
        title: product.name,
        image: product.image || product.images?.[0],
        price: product.price,
        quantity: quantity,
        variant: variantString,
        productId: product._id,
        name: "",
      });

      // Add selected recommended items
      // recommendedItems
      //   .filter((item) => selectedRecommended.includes(item._id))
      //   .forEach((item) => {
      //     addItem({
      //       _id: `rec-${item._id}`,
      //       title: item.title,
      //       image: item.image || "",
      //       price: item.price,
      //       quantity: item.quantity,
      //     });
      //   });

      // Navigate to checkout page
      router.push({
        pathname: "/(drawer)/(tabs)/product/checkout",
        params: { fromProduct: "true" },
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading || !product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: theme.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <GlassBackground>
      <View style={[styles.container, { backgroundColor: theme.glassBg }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.headerButton, { backgroundColor: theme.white }]}
          >
            <Feather name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/product/MyCart")}
            style={[styles.headerButton, { backgroundColor: theme.white }]}
          >
            <Feather name="shopping-cart" size={24} color={theme.black} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Image */}
          <View style={styles.imageContainer}>
            {product.image || product.images?.[0] ? (
              <Image
                source={{ uri: product.image || product.images?.[0] }}
                style={styles.productImage}
                resizeMode="cover"
                onError={(error) => {}}
                onLoad={() => console.log("Image loaded successfully")}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Feather name="image" size={48} color={theme.textdim} />
                <Text
                  style={[styles.placeholderText, { color: theme.textdim }]}
                >
                  No Image Available
                </Text>
              </View>
            )}
          </View>

          {/* Product Details */}
          <View
            style={[styles.productDetails, { backgroundColor: theme.glassBg }]}
          >
            {/* Product Title and Price */}
            <View style={styles.titleRow}>
              <View style={styles.titleSection}>
                <Text style={[styles.productTitle, { color: theme.text }]}>
                  {product.name}
                </Text>
                <Text style={[styles.productPrice, { color: theme.violet }]}>
                  AED {product.price.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={toggleWishlist}
                style={styles.wishlistBtn}
              >
                <Feather
                  name={isWishlistActive ? "heart" : "heart"}
                  size={24}
                  color={isWishlistActive ? "#ff0000" : theme.textdim}
                  fill={isWishlistActive ? "#ff0000" : "none"}
                />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text style={[styles.productDescription, { color: theme.textdim }]}>
              {product.description}
            </Text>

            {/* Variants */}
            {product?.variants && product.variants.length > 0 && (
              <View style={styles.variantsSection}>
                {product.variants.map((variant: any) => (
                  <View
                    key={variant._id || variant.name}
                    style={styles.variantGroup}
                  >
                    <Text style={[styles.variantLabel, { color: theme.text }]}>
                      {variant.name}
                    </Text>
                    <View style={styles.variantOptions}>
                      {variant.options.map((option: string) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.variantOption,
                            {
                              backgroundColor:
                                selectedVariants[variant.name] === option
                                  ? theme.violet
                                  : theme.surface,
                              borderColor:
                                selectedVariants[variant.name] === option
                                  ? theme.violet
                                  : theme.textdim,
                            },
                          ]}
                          onPress={() =>
                            setSelectedVariants({
                              ...selectedVariants,
                              [variant.name]: option,
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.variantOptionText,
                              {
                                color:
                                  selectedVariants[variant.name] === option
                                    ? "#fff"
                                    : theme.text,
                              },
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Quantity Selector */}
            <View style={styles.quantitySection}>
              <Text style={[styles.quantityLabel, { color: theme.text }]}>
                Quantity
              </Text>
              <Quantitybtn quantity={quantity} setQuantity={setQuantity} />
            </View>

            {/* Specifications */}
            {product.specifications && product.specifications.length > 0 && (
              <View style={styles.specificationsSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Specifications
                </Text>
                {product.specifications.map((spec: string, index: number) => (
                  <Text
                    key={index}
                    style={[styles.specificationItem, { color: theme.textdim }]}
                  >
                    • {spec}
                  </Text>
                ))}
              </View>
            )}

            {/* Recommended Items */}
            <RecommendedList categoryId={product.category} />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: theme.surface }]}>
          <View style={styles.footerContainer}>
            {/* Price Display */}
            <View style={styles.priceContainer}>
              <Text style={[styles.priceLabel, { color: theme.textdim }]}>
                Total
              </Text>
              <Text style={[styles.priceAmount, { color: theme.text }]}>
                AED {calculateTotal()}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.cartButton,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.violet,
                    opacity: isAddingToCart ? 0.7 : 1,
                  },
                ]}
                onPress={handleAddToCart}
                disabled={isAddingToCart}
              >
                <Feather
                  name={isAddingToCart ? "loader" : "shopping-cart"}
                  size={20}
                  color={theme.violet}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.buyButton,
                  {
                    backgroundColor: theme.violet,
                    opacity: isAddingToCart ? 0.7 : 1,
                  },
                ]}
                onPress={handleBuyNow}
                disabled={isAddingToCart}
              >
                <Feather
                  name={isAddingToCart ? "loader" : "zap"}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.buyButtonText}>
                  {isAddingToCart ? "Processing..." : "Buy Now"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Custom Alert */}
      <CustomAlertBox
        visible={visible}
        title={options.title}
        message={options.message}
        buttons={options.buttons}
        onClose={hideAlert}
        type={options.type}
        showCloseButton={options.showCloseButton}
        animationType={options.animationType}
        blurBackground={options.blurBackground}
      />
    </GlassBackground>
  );
};
export default ProductDetail;
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerButton: {
    borderRadius: 50,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  imageContainer: {
    height: height * 0.5,
    width: "100%",
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: "hidden",
  },
  productImage: {
    height: "100%",
    width: "100%",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%",
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
  },
  productDetails: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 28,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: "bold",
  },
  wishlistBtn: {
    padding: 8,
  },
  productDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  variantsSection: {
    marginBottom: 24,
  },
  variantGroup: {
    marginBottom: 20,
  },
  variantLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  variantOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  variantOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 60,
    alignItems: "center",
  },
  variantOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  quantitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  specificationsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  specificationItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  selectorRowColor: {
    flexDirection: "column",
    gap: 10,
    position: "absolute",
    top: 140,
    left: 20,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  colorSelected: {
    borderWidth: 2,
    borderColor: "#000",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopWidth: 0.5,
    borderColor: "rgba(0,0,0,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 10,
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceContainer: {
    flex: 1,
    marginRight: 16,
    marginTop: -15,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 3,
    opacity: 0.6,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 110,
    justifyContent: "center",
    shadowColor: "#6c63ff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  buyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
    letterSpacing: 0.3,
  },
});
