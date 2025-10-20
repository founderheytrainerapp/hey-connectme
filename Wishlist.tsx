import { useAppTheme } from "@/hooks/useAppTheme";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import GlassBackground from "../../../../src/components/GlassBackground";
import NtHeader from "../../../../src/components/NtHeader";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

export default function Wishlist() {
  const {
    items,
    removeFromWishlist,
    isLoading,
    error,
    loadWishlist,
    setLoading,
    setError,
  } = useWishlistStore();
  const { addItem } = useCartStore();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [hasTriedLoading, setHasTriedLoading] = useState(false);
  const router = useRouter();
  const theme = useAppTheme();

  // Load wishlist when component mounts if items are empty
  useEffect(() => {
    if (items.length === 0 && !isLoading && !hasTriedLoading) {
      setHasTriedLoading(true);
      loadWishlist().catch(console.error);
    }
  }, [items.length, isLoading, hasTriedLoading]);

  // Pull to refresh functionality
  const { refreshing, onRefresh } = usePullToRefresh(async () => {
    if (!isLoading) {
      loadWishlist().catch(console.error);
    }
  });

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(items.map((item) => item.id));
  };

  const deselectAllItems = () => {
    setSelectedItems([]);
  };

  const addSelectedToCart = async () => {
    try {
      setLoading(true);
      for (const id of selectedItems) {
        const item = items.find((i) => i.id === id);
        if (item) {
          // Add to cart
          await addItem({
            ...item,
            quantity: 1,
            _id: item.id,
            productId: item.id,
            name: item.title,
          });

          // Remove from wishlist after successfully adding to cart
          await removeFromWishlist(item.id);
        }
      }
      setSelectedItems([]);
      setLoading(false);
    } catch (error) {
      console.error("Failed to add items to cart:", error);
      setError("Failed to add items to cart");
      setLoading(false);
    }
  };

  const removeSelectedItems = async () => {
    try {
      setLoading(true);
      for (const id of selectedItems) {
        await removeFromWishlist(id);
      }
      setSelectedItems([]);
      setLoading(false);
    } catch (error) {
      console.error("Failed to remove items from wishlist:", error);
      setError("Failed to remove items from wishlist");
      setLoading(false);
    }
  };

  const cancelSelection = () => {
    setSelectedItems([]);
  };

  const renderCurrency = (amount: number | string) => (
    <Text style={styles.currency}>
      <Text style={styles.currencySymbol}>AED </Text> {amount}
    </Text>
  );

  // Show error state only if there's an error and no items
  if (error && items.length === 0) {
    return (
      <GlassBackground>
        <NtHeader title="Wishlist" />
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Error loading wishlist: {error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.violet }]}
            onPress={() => {
              setHasTriedLoading(false);
              setError(null);
              loadWishlist().catch(console.error);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </GlassBackground>
    );
  }

  // Show empty state only if not loading and no items
  if (!isLoading && items.length === 0) {
    return (
      <GlassBackground>
        <NtHeader title="Wishlist" />
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Your wishlist is empty 😢</Text>
          <Text style={styles.emptySubtext}>
            Add items you love to your wishlist
          </Text>
          <TouchableOpacity
            style={[
              styles.continueShoppingBtn,
              { backgroundColor: theme.violet },
            ]}
            onPress={() => router.push("/(drawer)/(tabs)/product/")}
          >
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </GlassBackground>
    );
  }

  return (
    <GlassBackground>
      <View style={styles.container}>
        <NtHeader title="Wishlist" />

        {/* Selection Controls */}
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
              {selectedItems.length} of {items.length} selected
            </Text>
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <View
                style={[styles.itemWrapper, isSelected && styles.selectedItem]}
              >
                <View style={styles.card}>
                  {/* Checkbox for selecting */}
                  <TouchableOpacity
                    onPress={() => toggleSelect(item.id)}
                    style={styles.checkboxContainer}
                  >
                    <FontAwesome6
                      name={isSelected ? "square-check" : "square"}
                      size={20}
                      color={isSelected ? theme.violet : theme.subtext}
                    />
                  </TouchableOpacity>

                  {/* Image + navigate to product */}
                  <TouchableOpacity
                    onPress={() =>
                      router.push(`/(drawer)/(tabs)/product/${item.id}`)
                    }
                    style={styles.imageContainer}
                  >
                    <Image source={{ uri: item.image }} style={styles.image} />
                  </TouchableOpacity>

                  {/* Info + actions */}
                  <View style={styles.info}>
                    <Text numberOfLines={2} style={styles.title}>
                      {item.title}
                    </Text>
                    <Text style={styles.price}>
                      {renderCurrency(item.price)}
                    </Text>

                    <View style={styles.actions}>
                      {/* Add to cart */}
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            await addItem({
                              ...item,
                              quantity: 1,
                              _id: item.id,
                              productId: item.id,
                              name: item.title,
                            });
                            // Remove from wishlist after successfully adding to cart
                            await removeFromWishlist(item.id);
                          } catch (error) {
                            console.error("Failed to add item to cart:", error);
                          }
                        }}
                        style={[styles.actionButton, styles.addToCartButton]}
                      >
                        <FontAwesome6 name="cart-plus" size={16} color="#fff" />
                        <Text style={styles.addToCartText}>Add to Cart</Text>
                      </TouchableOpacity>

                      {/* Remove from wishlist */}
                      <TouchableOpacity
                        onPress={() => removeFromWishlist(item.id)}
                        style={[styles.actionButton, styles.removeButton]}
                      >
                        <FontAwesome6 name="trash" size={16} color="#ff4444" />
                        <Text style={[styles.actionText, { color: "#ff4444" }]}>
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.violet} />
                <Text style={styles.loadingText}>Loading wishlist...</Text>
              </View>
            ) : null
          }
        />

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <View style={styles.bulkActions}>
            <TouchableOpacity
              onPress={addSelectedToCart}
              style={[styles.bulkButton, styles.addToCartBulkButton]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome6 name="cart-plus" size={16} color="#fff" />
                  <Text style={styles.bulkText}>
                    Add to Cart ({selectedItems.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={removeSelectedItems}
              style={[styles.bulkButton, styles.removeBulkButton]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome6 name="trash" size={16} color="#fff" />
                  <Text style={styles.bulkText}>
                    Remove ({selectedItems.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={cancelSelection}
              style={[styles.bulkButton, styles.cancelButton]}
            >
              <Text style={[styles.bulkText, { color: theme.subtext }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </GlassBackground>
  );
}

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
    paddingHorizontal: 32,
  },
  empty: {
    fontSize: 18,
    color: "#666",
    fontFamily: "System",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80, // Space for bulk actions
  },
  itemWrapper: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  selectedItem: {
    backgroundColor: "#F0E6FF",
    borderRadius: 12,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  checkboxContainer: {
    paddingRight: 12,
    justifyContent: "center",
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 80,
    height: 80,
    resizeMode: "cover",
    borderRadius: 8,
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#8A2BE2",
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  addToCartButton: {
    backgroundColor: "#8A2BE2",
    flex: 1,
    justifyContent: "center",
  },
  addToCartText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "#FFE6E6",
    borderWidth: 1,
    borderColor: "#ff4444",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  currency: {
    fontWeight: "700",
    fontSize: 16,
  },
  currencySymbol: {
    fontSize: 12,
    color: "#888",
  },
  bulkActions: {
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
    flexDirection: "row",
    gap: 8,
  },
  bulkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  addToCartBulkButton: {
    backgroundColor: "#8A2BE2",
  },
  removeBulkButton: {
    backgroundColor: "#ff4444",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  bulkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
