import CartItem from "@/components/CartItem";
import RecommendedList from "@/components/RecommendedList";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useCartStore } from "@/store/cartStore";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useState, useCallback, useEffect } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useRouter, useLocalSearchParams } from "expo-router";
import GlassBackground from "../../../../src/components/GlassBackground";
import NtHeader from "../../../../src/components/NtHeader";

const MyCart = () => {
  const items = useCartStore((s) => s.items);
  const isLoading = useCartStore((s) => s.isLoading);
  const error = useCartStore((s) => s.error);
  const loadCart = useCartStore((s) => s.loadCart);
  const clearAllUpdatingItems = useCartStore((s) => s.clearAllUpdatingItems);
  const updatingItems = useCartStore((s) => s.updatingItems);
  const router = useRouter();
  const params = useLocalSearchParams();

  // Selection functions
  const selectAllItems = useCartStore((s) => s.selectAllItems);
  const deselectAllItems = useCartStore((s) => s.deselectAllItems);
  const getSelectedItems = useCartStore((s) => s.getSelectedItems);
  const getSelectedItemsTotal = useCartStore((s) => s.getSelectedItemsTotal);
  const selectedItems = useCartStore((s) => s.selectedItems);
  const [tick, setTick] = useState(0);
  const [hasTriedLoading, setHasTriedLoading] = useState(false);
  const [orderJustPlaced, setOrderJustPlaced] = useState(false);

  useEffect(() => {
    if (items.length > 0) {
      setHasTriedLoading(false);
      if (orderJustPlaced) {
        setOrderJustPlaced(false);
      }
    }
  }, [items.length, orderJustPlaced]);

  useEffect(() => {
    const checkForCompletedOrder = () => {
      if (params.orderCompleted === "true") {
        setOrderJustPlaced(true);
        return;
      }

      if (items.length === 0 && !isLoading) {
        setOrderJustPlaced(true);
      }
    };

    checkForCompletedOrder();
  }, [items.length, isLoading, params.orderCompleted]);

  useEffect(() => {
    if (items.length === 0 && !isLoading && !hasTriedLoading) {
      setHasTriedLoading(true);
      loadCart().catch(console.error);
    }
  }, [items.length, isLoading, hasTriedLoading]);
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    setTick((t) => t + 1);
    if (!isLoading) {
      loadCart().catch(console.error);
    }
  });

  const handlePlaceOrder = () => {
    const selectedItemsList = getSelectedItems();
    if (selectedItemsList.length === 0) {
      return;
    }

    setOrderJustPlaced(false);
    router.push({
      pathname: "/(drawer)/(tabs)/product/checkout",
      params: {
        fromCart: "true",
        selectedItems: JSON.stringify(
          selectedItemsList.map((item) => item._id)
        ),
      },
    });
  };

  const subtotal = getSelectedItemsTotal();
  const allItemsSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const vat = (subtotal - discount) * 0.05;
  const platformFee = 4;
  const total = Math.round(subtotal - discount + vat + platformFee);
  const youSave = Math.round(discount);
  const theme = useAppTheme();
  const renderCurrency = (amount: number | string) => (
    <Text style={styles.currency}>
      <Text style={styles.currencySymbol}>AED </Text> {amount}
    </Text>
  );
  const uniqueCategories: string[] = [
    ...new Set<string>(
      items
        .map((item) => item.category)
        .filter((c): c is string => typeof c === "string")
    ),
  ];

  if (error && items.length === 0) {
    return (
      <GlassBackground>
        <NtHeader title="My Cart" />
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Error loading cart: {error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.violet }]}
            onPress={() => {
              setHasTriedLoading(false);
              loadCart().catch(console.error);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </GlassBackground>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <GlassBackground>
        <NtHeader title="My Cart" />
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Your cart is empty 😢</Text>
        </View>
      </GlassBackground>
    );
  }

  return (
    <GlassBackground>
      <View style={[styles.container]}>
        <NtHeader title="My Cart" />

        {items.length > 0 && (
          <View style={styles.selectionControls}>
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={selectAllItems}
            >
              <Text style={styles.selectionButtonText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={deselectAllItems}
            >
              <Text style={styles.selectionButtonText}>Deselect All</Text>
            </TouchableOpacity>
            <Text style={styles.selectionCount}>
              {selectedItems.size} of {items.length} selected
            </Text>
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.productId}-${index}`}
          extraData={tick}
          renderItem={({ item }) => (
            <View style={styles.itemWrapper}>
              <CartItem item={item} />
            </View>
          )}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.violet} />
                <Text style={styles.loadingText}>Loading cart...</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionTitle}>PRICE DETAILS</Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Subtotal ({items.length} item{items.length > 1 ? "s" : ""})
                </Text>
                {renderCurrency(subtotal.toFixed(2))}
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Discount</Text>
                <Text style={styles.discountText}>
                  {" "}
                  {renderCurrency(discount.toFixed(2))}
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>VAT (5%)</Text>
                {renderCurrency(vat.toFixed(2))}
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Platform Fee</Text>
                {renderCurrency(platformFee.toFixed(2))}
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                {renderCurrency(total.toFixed(2))}
              </View>

              {youSave > 0 && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>
                    You save {renderCurrency(youSave.toFixed(2))}
                  </Text>
                </View>
              )}
            </View>
          }
          contentContainerStyle={styles.listContent}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
        {/* {uniqueCategories.map((catId, index) => (
          <RecommendedList
            key={`recommended-${catId}-${index}`} // Unique key for each category
            categoryId={catId}
            title="You may also like"
            theme={theme}
          />
        ))} */}

        <View style={styles.stickyFooter}>
          {orderJustPlaced && items.length === 0 && (
            <View style={styles.successMessage}>
              <Text style={styles.successText}>
                ✅ Your order has been placed successfully! Add more items to
                your cart to place another order.
              </Text>
              <TouchableOpacity
                style={[
                  styles.continueShoppingBtn,
                  { backgroundColor: theme.violet, marginTop: 12 },
                ]}
                onPress={() => router.push("/(drawer)/(tabs)/product/")}
              >
                <Text style={styles.continueShoppingText}>
                  Continue Shopping
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              {
                backgroundColor:
                  selectedItems.size === 0 ? "#ccc" : theme.violet,
              },
              isLoading && styles.disabledButton,
            ]}
            onPress={handlePlaceOrder}
            disabled={isLoading || selectedItems.size === 0}
          >
            {isLoading ? (
              <View style={styles.buttonLoadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.placeOrderText}>Updating...</Text>
              </View>
            ) : (
              <Text style={styles.placeOrderText}>
                {selectedItems.size === 0
                  ? orderJustPlaced
                    ? "Add Items to Place New Order"
                    : "Select Items to Order"
                  : `Place Order (${selectedItems.size} items)`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </GlassBackground>
  );
};

export default MyCart;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f7",
  },
  empty: {
    fontSize: 18,
    color: "#666",
    fontFamily: "System",
  },
  itemWrapper: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#000",
    position: "relative",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  itemCountBadge: {
    position: "absolute",
    right: 16,
    backgroundColor: "#ffb300",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  itemCountText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 12,
  },

  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80, // Space for sticky footer
  },

  summaryContainer: {
    backgroundColor: "#fff",
    padding: 24,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 22,
  },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 16,
    color: "#666",
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  priceLabel: {
    color: "#666",
    fontSize: 14,
  },
  currency: {
    fontWeight: "500",
    fontSize: 14,
  },
  currencySymbol: {
    fontSize: 12,
    color: "#888",
  },
  discountText: {
    color: "#34C759",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  totalLabel: {
    fontWeight: "700",
    fontSize: 16,
    color: "#000",
  },
  savingsBadge: {
    backgroundColor: "#34C75920",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  savingsText: {
    color: "#34C759",
    fontWeight: "600",
    fontSize: 13,
  },

  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 10,
  },
  placeOrderButton: {
    paddingVertical: 15,
    // marginHorizontal: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // Android shadow
    marginBottom: 10,
  },

  placeOrderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontFamily: "System",
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  selectionButton: {
    backgroundColor: "#8A2BE2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  selectionCount: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  successMessage: {
    backgroundColor: "#E8F5E8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  successText: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  continueShoppingBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  continueShoppingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
