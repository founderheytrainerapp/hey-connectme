import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../../src/contexts/UserContext";
import { getOrders } from "../../src/api/orders";
import { Order } from "../../src/interfaces/order";
import GlassBackground from "../../src/components/GlassBackground";
import { Ionicons } from "@expo/vector-icons";
import NtHeader from "../../src/components/NtHeader";
import CancelOrderModal from "../../src/components/orders/CancelOrderModal";
import OrderRatingModal from "../../src/components/orders/OrderRatingModal";

const MyOrder = () => {
  const router = useRouter();
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // const statusFilters = [
  //   { key: "all", label: "All Orders" },
  //   { key: "pending", label: "Pending" },
  //   { key: "confirmed", label: "Confirmed" },
  //   { key: "processing", label: "Processing" },
  //   { key: "shipped", label: "Shipped" },
  //   { key: "delivered", label: "Delivered" },
  //   { key: "cancelled", label: "Cancelled" },
  // ];

  const fetchOrders = useCallback(async (filter?: string) => {
    try {
      setError(null);
      const filters =
        filter && filter !== "all" ? { status: filter } : undefined;
      const response = await getOrders(filters);
      setOrders(response);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders. Please try again.");
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user?.isLoggedIn) {
      fetchOrders(selectedFilter);
    }
  }, [user?.isLoggedIn, selectedFilter, fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(selectedFilter);
  }, [fetchOrders, selectedFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "#10B981";
      case "cancelled":
        return "#EF4444";
      case "shipped":
        return "#3B82F6";
      case "processing":
        return "#F59E0B";
      case "confirmed":
        return "#8B5CF6";
      case "pending":
        return "#6B7280";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return "checkmark-circle";
      case "cancelled":
        return "close-circle";
      case "shipped":
        return "car";
      case "processing":
        return "time";
      case "confirmed":
        return "checkmark";
      case "pending":
        return "hourglass";
      default:
        return "help-circle";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toFixed(2)}`;
  };

  const handleCancelOrder = (order: Order) => {
    setSelectedOrder(order);
    setCancelModalVisible(true);
  };

  const handleRateOrder = (order: Order) => {
    setSelectedOrder(order);
    setRatingModalVisible(true);
  };

  const handleOrderCancelled = (updatedOrder: Order) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );
  };

  const handleRatingSubmitted = (updatedOrder: Order) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );
  };

  const canCancelOrder = (order: Order) => {
    return ["pending", "confirmed"].includes(order.status);
  };

  const canRateOrder = (order: Order) => {
    return order.status === "delivered" && !order.rating;
  };

  // const handleOrderPress = (order: Order) => {
  //   router.push({
  //     pathname: "/orders/[id]",
  //     params: { id: order._id },
  //   });
  // };

  const renderOrderItem = ({ item: order }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      // onPress={() => handleOrderPress(order)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{order._id.slice(-8)}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) + "20" },
          ]}
        >
          <Ionicons
            name={getStatusIcon(order.status) as any}
            size={16}
            color={getStatusColor(order.status)}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(order.status) }]}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.items && order.items.length > 0 ? (
          <>
            {order.items.slice(0, 2).map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            ))}
            {order.items.length > 2 && (
              <Text style={styles.moreItems}>
                +{order.items.length - 2} more item
                {order.items.length - 2 > 1 ? "s" : ""}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.moreItems}>No items found</Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>{formatCurrency(order.total)}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {canCancelOrder(order) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelOrder(order)}
          >
            <Ionicons name="close-circle" size={16} color="#EF4444" />
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        {canRateOrder(order) && (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => handleRateOrder(order)}
          >
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.rateButtonText}>Rate Order</Text>
          </TouchableOpacity>
        )}

        {order.rating && (
          <View style={styles.ratingDisplay}>
            <View style={styles.starsContainer}>
              {Array.from({ length: 5 }, (_, index) => (
                <Ionicons
                  key={index}
                  name={index < order.rating!.score ? "star" : "star-outline"}
                  size={14}
                  color="#F59E0B"
                />
              ))}
            </View>
            <Text style={styles.ratingText}>Rated</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Orders Found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === "all"
          ? "You haven't placed any orders yet."
          : `No ${selectedFilter} orders found.`}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <GlassBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </GlassBackground>
    );
  }

  if (error) {
    return (
      <GlassBackground>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchOrders(selectedFilter)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </GlassBackground>
    );
  }

  return (
    <GlassBackground>
      <View style={styles.container}>
        <NtHeader title="My Orders" />

        {/* <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.key &&
                    styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView> */}

        <FlatList
          data={orders || []}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />

        {/* Modals */}
        <CancelOrderModal
          visible={cancelModalVisible}
          order={selectedOrder}
          onClose={() => {
            setCancelModalVisible(false);
            setSelectedOrder(null);
          }}
          onOrderCancelled={handleOrderCancelled}
        />

        <OrderRatingModal
          visible={ratingModalVisible}
          order={selectedOrder}
          onClose={() => {
            setRatingModalVisible(false);
            setSelectedOrder(null);
          }}
          onRatingSubmitted={handleRatingSubmitted}
        />
      </View>
    </GlassBackground>
  );
};
export default MyOrder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  filterContainer: {
    backgroundColor: "#FFFFFF",
    // paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#3B82F6",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  ordersList: {
    padding: 20,
    paddingTop: 16,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  orderItems: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: "#6B7280",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  moreItems: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#EF4444",
    marginLeft: 4,
  },
  rateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#F59E0B",
    marginLeft: 4,
  },
  ratingDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
});
