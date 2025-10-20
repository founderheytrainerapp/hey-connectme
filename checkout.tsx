import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useCartStore } from "@/store/cartStore";
import { useUser } from "@/contexts/UserContext";
import { useAddressStore, Address } from "@/store/addressStore";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import useHardwareBack from "@/hooks/useHardwareBack";
import SavedCardsList from "@/components/payments/SavedCardsList";
import instance from "@/utils/axios";
import NtHeader from "../../../../src/components/NtHeader";
import GlassBackground from "../../../../src/components/GlassBackground";
import { useUnifiedAlert } from "../../../../src/contexts/UnifiedAlertContext";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

const CheckoutPage = () => {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, updateUser } = useUser();
  const { showValidationError, showError, showOrderPlaced } = useUnifiedAlert();
  const { confirmPayment, confirmSetupIntent } = useStripe();
  const { items, clearCart, removeItem, getSelectedItems } = useCartStore();

  const handleBackPress = () => {
    if (params.fromProduct) {
      router.back();
    } else {
      router.push("/(drawer)/(tabs)/product/MyCart");
    }
  };

  const {
    addresses,
    selectedAddress,
    selectAddress,
    addAddress,
    loadAddresses,
  } = useAddressStore();

  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phoneNumber: "",
    country: "United Arab Emirates",
    addressLine: "",
    buildingName: "",
    city: "",
    area: "",
    nearestLandmark: "",
    zip: "",
    addressType: "home" as "home" | "office",
    deliveryInstructions: "",
  });
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "new" | "saved" | null
  >(null);
  const [selectedCard, setSelectedCard] = useState<PaymentMethod | null>(null);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [isCardValid, setIsCardValid] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const itemsToCalculate = params.fromProduct
    ? items.filter(
        (item) =>
          item._id?.startsWith("rec-") ||
          (item._id?.includes("-") && item._id?.split("-").length >= 3)
      )
    : params.fromCart === "true" && params.selectedItems
    ? getSelectedItems()
    : items;

  const subtotal = itemsToCalculate.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = itemsToCalculate.reduce(
    (sum, item) => sum + (item.discount || 0),
    0
  );
  const vat = (subtotal - discount) * 0.05;
  const platformFee = 4;
  const total = subtotal - discount + vat + platformFee;

  useEffect(() => {
    loadAddresses();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, [])
  );

  const handleCardChange = (card: any) => {
    setCardDetails(card);
    setIsCardValid(card?.complete || false);
  };

  const handleCardSelect = (card: any) => {
    const convertedCard: PaymentMethod = {
      id: card.id,
      brand: card.card.brand,
      last4: card.card.last4,
      exp_month: card.card.exp_month,
      exp_year: card.card.exp_year,
    };
    setSelectedCard(convertedCard);
    setSelectedPaymentMethod("saved");
    setIsCardValid(true);
  };

  const handleSelectSavedAddress = (address: Address) => {
    selectAddress(address);
    setShowAddressForm(false);
  };

  const handleAddNewAddress = async () => {
    if (
      !newAddress.fullName.trim() ||
      !newAddress.phoneNumber.trim() ||
      !newAddress.addressLine.trim() ||
      !newAddress.city.trim()
      // !newAddress.zip.trim()
    ) {
      showValidationError("Please fill in all required fields (Name, Phone, Address, City, ZIP)");
      return;
    }

    try {
      if (saveNewAddress) {
        await addAddress(newAddress);

        try {
          const response = await instance.get("/addresses/self");
          const addresses = response.data.data;
          useAddressStore.setState({ addresses });

          const newlyCreatedAddress = addresses.find(
            (addr: Address) =>
              addr.fullName === newAddress.fullName &&
              addr.phoneNumber === newAddress.phoneNumber &&
              addr.addressLine === newAddress.addressLine &&
              addr.city === newAddress.city
          );

          if (newlyCreatedAddress) {
            selectAddress(newlyCreatedAddress);
          } else {
            const tempAddress: Address = { ...newAddress };
            selectAddress(tempAddress);
          }
        } catch (error) {
          const tempAddress: Address = { ...newAddress };
          selectAddress(tempAddress);
        }
      } else {
        const tempAddress: Address = { ...newAddress };
        selectAddress(tempAddress);
      }

      setShowAddressForm(false);

      setNewAddress({
        fullName: "",
        phoneNumber: "",
        country: "United Arab Emirates",
        addressLine: "",
        buildingName: "",
        city: "",
        area: "",
        nearestLandmark: "",
        zip: "",
        addressType: "home",
        deliveryInstructions: "",
      });
      setSaveNewAddress(false);
      setShowAddressForm(false);
    } catch (error) {}
  };

  const validateForm = () => {
    if (!selectedAddress) {
      showError("Please select or add a delivery address");
      return false;
    }

    if (selectedPaymentMethod === "new" && !isCardValid) {
      showError("Please enter valid card details");
      return false;
    }

    if (selectedPaymentMethod === "saved" && !selectedCard) {
      showError("Please select a saved card");
      return false;
    }

    if (!selectedPaymentMethod) {
      showError("Please select a payment method");
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      let addressId = selectedAddress?._id;
      if (saveNewAddress) {
        try {
          await addAddress(newAddress);
          addressId = "temp";
        } catch (error) {
          console.error("Failed to save address:", error);
        }
      }

      const orderItems = itemsToCalculate.map((item) => {
        let productId;
        if (item._id?.startsWith("rec-")) {
          productId = item._id.replace("rec-", "");
        } else {
          productId = item._id?.split("-")[0] ?? "";
        }
        return {
          productId: String(productId),
          name: item.title,
          quantity: item.quantity,
          price: item.price,
        };
      });

      const orderPayload = {
        items: orderItems,
        address: selectedAddress,
        total: total,
        subtotal: subtotal,
        vat: vat,
        platformFee: platformFee,
        discount: discount,
      };

      const orderResponse = await instance.post("/orders", orderPayload);
      const orderId = orderResponse.data._id;

      let paymentMethodId = null;

      if (selectedPaymentMethod === "saved" && selectedCard) {
        paymentMethodId = selectedCard.id;
      } else if (selectedPaymentMethod === "new" && cardDetails?.complete) {
        try {
          let customerId = user?.stripeCustomerId;

          if (!customerId) {
            const customerResponse = await instance.post(
              "/stripe/create-customer",
              {
                email: user?.email,
                name: user?.name,
                phone: user?.phone,
              }
            );
            customerId = customerResponse.data.customerId;
            updateUser({ stripeCustomerId: customerId });
          }

          const setupResponse = await instance.post("/stripe/setup-intent", {
            customerId: customerId,
          });

          const { setupIntent, error: setupError } = await confirmSetupIntent(
            setupResponse.data.clientSecret,
            {
              paymentMethodType: "Card",
              paymentMethodData: {
                billingDetails: {
                  name: user?.name || "Customer",
                  email: user?.email,
                },
              },
            }
          );

          if (setupError) {
            throw new Error(setupError.message);
          }

          paymentMethodId = setupIntent.paymentMethod?.id;
        } catch (error) {
          console.error("Payment setup failed:", error);
          throw new Error("Payment setup failed. Please try again.");
        }
      }
      if (paymentMethodId) {
        try {
          if (selectedPaymentMethod === "saved" && selectedCard) {
            let customerId = user?.stripeCustomerId;

            if (!customerId) {
              throw new Error(
                "No customer ID found. Please use a new card instead."
              );
            }

            const paymentResponse = await instance.post(
              "/stripe/charge-saved-card",
              {
                customerId: customerId,
                paymentMethodId: paymentMethodId,
                amount: Math.round(total * 100),
                currency: "aed",
              }
            );

            if (paymentResponse.data.status !== "succeeded") {
              throw new Error("Payment was not successful");
            }
          } else {
            const paymentResponse = await instance.post(
              "/stripe/create-payment-intent",
              {
                orderId: orderId,
                paymentMethodId: paymentMethodId,
                amount: Math.round(total * 100),
              }
            );

            const { paymentIntent, error: paymentError } = await confirmPayment(
              paymentResponse.data.clientSecret,
              {
                paymentMethodType: "Card",
                paymentMethodData: {
                  billingDetails: {
                    name: user?.name || "Customer",
                    email: user?.email,
                  },
                },
              }
            );

            if (paymentError) {
              throw new Error(paymentError.message);
            }

            if (paymentIntent.status !== "Succeeded") {
              throw new Error("Payment was not successful");
            }
          }
        } catch (error) {
          console.error("Payment processing failed:", error);
          throw new Error("Payment processing failed. Please try again.");
        }
      }

      if (params.fromProduct) {
        itemsToCalculate.forEach((item) => {
          if (item._id) {
            removeItem(item._id);
          }
        });
      } else if (params.fromCart === "true") {
        itemsToCalculate.forEach((item) => {
          if (item._id) {
            removeItem(item._id);
          }
        });
      } else {
        clearCart();
      }
      setRefreshTrigger((prev) => prev + 1);

      showOrderPlaced();
      
      if (params.fromProduct) {
        router.back();
      } else {
        router.replace({
          pathname: "/(drawer)/(tabs)/product/MyCart",
          params: { orderCompleted: "true" },
        });
      }
    } catch (error) {
      console.error("Order placement failed:", error);
      showError(
        error instanceof Error
          ? error.message
          : "There was an error processing your order. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Checkout
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="shopping-cart" size={48} color={theme.textdim} />
          <Text style={[styles.emptyText, { color: theme.textdim }]}>
            Your cart is empty
          </Text>
          <TouchableOpacity
            style={[
              styles.continueShoppingBtn,
              { backgroundColor: theme.violet },
            ]}
            onPress={() =>
              router.replace({
                pathname: "/(drawer)/(tabs)/product/MyCart",
                params: { orderCompleted: "true" },
              })
            }
          >
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <GlassBackground>
      <View style={[styles.container, { backgroundColor: theme.glassBg }]}>
        <NtHeader title="Checkout" />
        {/* <Stack.Screen options={{ headerShown: false }} /> */}

        {/* Header */}
        {/* <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Checkout
        </Text>
        <View style={{ width: 24 }} />
      </View> */}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Order Summary with Detailed Breakdown */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Order Summary
              </Text>

              {/* Items List */}
              {itemsToCalculate.map((item) => (
                <View key={item._id} style={styles.orderItem}>
                  <View style={styles.itemDetails}>
                    <Text style={[styles.itemName, { color: theme.text }]}>
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.itemQuantity, { color: theme.textdim }]}
                    >
                      Qty: {item.quantity}
                    </Text>
                  </View>
                  <Text style={[styles.itemPrice, { color: theme.text }]}>
                    AED {(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Price Breakdown */}
              <View style={styles.priceBreakdown}>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: theme.textdim }]}>
                    Subtotal
                  </Text>
                  <Text style={[styles.priceValue, { color: theme.text }]}>
                    AED {subtotal.toFixed(2)}
                  </Text>
                </View>

                {discount > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { color: "#34C759" }]}>
                      Discount
                    </Text>
                    <Text style={[styles.priceValue, { color: "#34C759" }]}>
                      -AED {discount.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: theme.textdim }]}>
                    VAT (5%)
                  </Text>
                  <Text style={[styles.priceValue, { color: theme.text }]}>
                    AED {vat.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: theme.textdim }]}>
                    Platform Fee
                  </Text>
                  <Text style={[styles.priceValue, { color: theme.text }]}>
                    AED {platformFee.toFixed(2)}
                  </Text>
                </View>

                <View style={[styles.divider, { marginVertical: 8 }]} />

                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: theme.text }]}>
                    Total
                  </Text>
                  <Text style={[styles.totalAmount, { color: theme.violet }]}>
                    AED {total.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Delivery Address Section */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Delivery Address
                </Text>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: theme.violet }]}
                  onPress={() => setShowAddressForm(!showAddressForm)}
                >
                  {showAddressForm && (
                    <Feather name="minus" size={16} color="white" />
                  )}
                  {!showAddressForm && (
                    <Feather name="plus" size={16} color="white" />
                  )}
                  <Text style={styles.addButtonText}>
                    {showAddressForm ? "Cancel" : "Add New"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Saved Addresses */}
              {!showAddressForm && addresses.length > 0 && (
                <View style={styles.savedAddresses}>
                  {addresses.map((address, index) => (
                    <TouchableOpacity
                      key={`${address._id}${index}`}
                      style={[
                        styles.addressOption,
                        {
                          backgroundColor:
                            selectedAddress?._id === address._id
                              ? theme.violet + "20"
                              : theme.cardBg,
                          borderColor:
                            selectedAddress?._id === address._id
                              ? theme.violet
                              : theme.border,
                        },
                      ]}
                      onPress={() => handleSelectSavedAddress(address)}
                    >
                      <View style={styles.addressContent}>
                        <Text
                          style={[styles.addressText, { color: theme.text }]}
                        >
                          {address.fullName}
                        </Text>
                        <Text
                          style={[
                            styles.addressSubText,
                            { color: theme.textdim },
                          ]}
                        >
                          {address.phoneNumber}
                        </Text>
                        <Text
                          style={[
                            styles.addressSubText,
                            { color: theme.textdim },
                          ]}
                        >
                          {address.addressLine}
                          {address.buildingName && `, ${address.buildingName}`}
                        </Text>
                        <Text
                          style={[
                            styles.addressSubText,
                            { color: theme.textdim },
                          ]}
                        >
                          {address.city}, {address.zip}
                        </Text>
                        {address.nearestLandmark && (
                          <Text
                            style={[
                              styles.addressSubText,
                              { color: theme.textdim },
                            ]}
                          >
                            Near: {address.nearestLandmark}
                          </Text>
                        )}
                      </View>
                      {selectedAddress?._id === address._id && (
                        <Feather name="check" size={20} color={theme.violet} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Address Form */}
              {showAddressForm && (
                <View style={styles.addressForm}>
                  {/* Full Name */}
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="Full Name (First and Last name) *"
                    placeholderTextColor={theme.textdim}
                    value={newAddress.fullName}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, fullName: text })
                    }
                  />

                  {/* Phone Number */}
                  <View style={styles.phoneContainer}>
                    <View
                      style={[
                        styles.countryCodeContainer,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.countryCode, { color: theme.text }]}>
                        🇦🇪 +971
                      </Text>
                    </View>
                    <TextInput
                      style={[
                        styles.input,
                        styles.phoneInput,
                        {
                          backgroundColor: theme.surface,

                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      placeholder="Mobile number *"
                      placeholderTextColor={theme.textdim}
                      value={newAddress.phoneNumber}
                      onChangeText={(text) =>
                        setNewAddress({ ...newAddress, phoneNumber: text })
                      }
                      keyboardType="phone-pad"
                    />
                  </View>

                  {/* Street Address */}
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,

                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="Street name *"
                    placeholderTextColor={theme.textdim}
                    value={newAddress.addressLine}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, addressLine: text })
                    }
                  />

                  {/* Building Name */}
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,

                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="Building name/no (optional)"
                    placeholderTextColor={theme.textdim}
                    value={newAddress.buildingName}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, buildingName: text })
                    }
                  />

                  {/* City and ZIP */}
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputHalf,
                        {
                          backgroundColor: theme.surface,

                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      placeholder="City *"
                      placeholderTextColor={theme.textdim}
                      value={newAddress.city}
                      onChangeText={(text) =>
                        setNewAddress({ ...newAddress, city: text })
                      }
                    />
                    <TextInput
                      style={[
                        styles.input,
                        styles.inputHalf,
                        {
                          backgroundColor: theme.surface,

                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      placeholder="ZIP Code *"
                      placeholderTextColor={theme.textdim}
                      value={newAddress.zip}
                      onChangeText={(text) =>
                        setNewAddress({ ...newAddress, zip: text })
                      }
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Nearest Landmark */}
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surface,

                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="Nearest landmark (optional)"
                    placeholderTextColor={theme.textdim}
                    value={newAddress.nearestLandmark}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, nearestLandmark: text })
                    }
                  />

                  {/* Address Type */}
                  <View style={styles.addressTypeContainer}>
                    <Text
                      style={[styles.addressTypeLabel, { color: theme.text }]}
                    >
                      Address type
                    </Text>
                    <View style={styles.addressTypeOptions}>
                      <TouchableOpacity
                        style={[
                          styles.addressTypeOption,
                          {
                            backgroundColor:
                              newAddress.addressType === "home"
                                ? theme.violet + "20"
                                : theme.bg,
                            borderColor:
                              newAddress.addressType === "home"
                                ? theme.violet
                                : theme.border,
                          },
                        ]}
                        onPress={() =>
                          setNewAddress({ ...newAddress, addressType: "home" })
                        }
                      >
                        <View
                          style={[
                            styles.radioButton,
                            {
                              borderColor:
                                newAddress.addressType === "home"
                                  ? theme.violet
                                  : theme.border,
                            },
                          ]}
                        >
                          {newAddress.addressType === "home" && (
                            <View
                              style={[
                                styles.radioButtonInner,
                                { backgroundColor: theme.violet },
                              ]}
                            />
                          )}
                        </View>
                        <View style={styles.addressTypeTextContainer}>
                          <Text
                            style={[
                              styles.addressTypeText,
                              { color: theme.text },
                            ]}
                          >
                            Home
                          </Text>
                          <Text
                            style={[
                              styles.addressTypeSubText,
                              { color: theme.textdim },
                            ]}
                          >
                            7am-9pm, all days
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.addressTypeOption,
                          {
                            backgroundColor:
                              newAddress.addressType === "office"
                                ? theme.violet + "20"
                                : theme.bg,
                            borderColor:
                              newAddress.addressType === "office"
                                ? theme.violet
                                : theme.border,
                          },
                        ]}
                        onPress={() =>
                          setNewAddress({
                            ...newAddress,
                            addressType: "office",
                          })
                        }
                      >
                        <View
                          style={[
                            styles.radioButton,
                            {
                              borderColor:
                                newAddress.addressType === "office"
                                  ? theme.violet
                                  : theme.border,
                            },
                          ]}
                        >
                          {newAddress.addressType === "office" && (
                            <View
                              style={[
                                styles.radioButtonInner,
                                { backgroundColor: theme.violet },
                              ]}
                            />
                          )}
                        </View>
                        <View style={styles.addressTypeTextContainer}>
                          <Text
                            style={[
                              styles.addressTypeText,
                              { color: theme.text },
                            ]}
                          >
                            Office
                          </Text>
                          <Text
                            style={[
                              styles.addressTypeSubText,
                              { color: theme.textdim },
                            ]}
                          >
                            9am-6pm, Weekdays
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Delivery Instructions */}
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        backgroundColor: theme.surface,

                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="Add delivery instructions (optional)"
                    placeholderTextColor={theme.textdim}
                    value={newAddress.deliveryInstructions}
                    onChangeText={(text) =>
                      setNewAddress({
                        ...newAddress,
                        deliveryInstructions: text,
                      })
                    }
                    multiline
                    numberOfLines={3}
                  />

                  {/* Save Address Checkbox */}
                  <TouchableOpacity
                    style={styles.saveAddressOption}
                    onPress={() => setSaveNewAddress(!saveNewAddress)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: saveNewAddress
                            ? theme.violet
                            : "transparent",
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      {saveNewAddress && (
                        <Feather name="check" size={12} color="white" />
                      )}
                    </View>
                    <Text
                      style={[styles.saveAddressText, { color: theme.text }]}
                    >
                      Save this address for future orders
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.saveAddressBtn,
                      { backgroundColor: theme.violet },
                    ]}
                    onPress={handleAddNewAddress}
                  >
                    <Text style={styles.saveAddressBtnText}>
                      Use This Address
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* No Saved Addresses */}
              {!showAddressForm && addresses.length === 0 && (
                <View style={styles.noAddresses}>
                  <Feather name="map-pin" size={32} color={theme.textdim} />
                  <Text
                    style={[styles.noAddressesText, { color: theme.textdim }]}
                  >
                    No saved addresses
                  </Text>
                  <Text
                    style={[
                      styles.noAddressesSubText,
                      { color: theme.textdim },
                    ]}
                  >
                    Add an address to get started
                  </Text>
                </View>
              )}
            </View>

            {/* Payment Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: theme.surface, marginBottom: 20 },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Payment Method
              </Text>

              {/* Saved Cards */}
              <SavedCardsList
                onCardSelect={handleCardSelect}
                selectedCardId={selectedCard?.id}
                mode="selection"
                refreshTrigger={refreshTrigger}
              />

              {/* New Card Option */}
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  {
                    backgroundColor:
                      selectedPaymentMethod === "new"
                        ? theme.violet + "20"
                        : theme.bg,
                    borderColor:
                      selectedPaymentMethod === "new"
                        ? theme.violet
                        : theme.border,
                  },
                ]}
                onPress={() => {
                  setSelectedPaymentMethod("new");
                  setSelectedCard(null);
                }}
              >
                <View style={styles.paymentOptionContent}>
                  <Feather name="plus" size={20} color={theme.violet} />
                  <Text
                    style={[styles.paymentOptionText, { color: theme.text }]}
                  >
                    Add new card
                  </Text>
                </View>
                {selectedPaymentMethod === "new" && (
                  <Feather name="check" size={20} color={theme.violet} />
                )}
              </TouchableOpacity>

              {/* Card Details */}
              {selectedPaymentMethod === "new" && (
                <View style={styles.cardDetailsContainer}>
                  <CardField
                    postalCodeEnabled={false}
                    onCardChange={handleCardChange}
                    style={styles.cardField}
                    cardStyle={{
                      backgroundColor: theme.surface || "#FFFFFF",
                      textColor: theme.text || "#000000",
                      placeholderColor: theme.inputPlaceholder || "#9CA3AF",
                      cursorColor: theme.text || "#000000",

                      borderColor: theme.border,
                      borderWidth: 1,
                      borderRadius: 8,
                    }}
                  />

                  <TouchableOpacity
                    style={styles.saveCardOption}
                    onPress={() => setSaveCard(!saveCard)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: saveCard
                            ? theme.violet
                            : "transparent",
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      {saveCard && (
                        <Feather name="check" size={12} color="white" />
                      )}
                    </View>
                    <Text style={[styles.saveCardText, { color: theme.text }]}>
                      Save card for future payments
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { backgroundColor: theme.surface, borderTopColor: theme.border },
            ]}
          >
            <View style={styles.footerContent}>
              <View style={styles.totalSection}>
                <Text
                  style={[styles.footerTotalLabel, { color: theme.textdim }]}
                >
                  Total
                </Text>
                <Text style={[styles.footerTotalAmount, { color: theme.text }]}>
                  AED {total.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.placeOrderBtn,
                  {
                    backgroundColor: theme.violet,
                    opacity: isProcessing ? 0.7 : 1,
                  },
                ]}
                onPress={handlePlaceOrder}
                disabled={isProcessing}
              >
                <Text style={styles.placeOrderText}>
                  {isProcessing ? "Processing..." : "Place Order"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </GlassBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemDetails: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  priceBreakdown: {
    marginTop: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  savedAddresses: {
    gap: 12,
  },
  addressOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addressContent: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  addressSubText: {
    fontSize: 12,
  },
  addressForm: {
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  saveAddressOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  saveAddressText: {
    fontSize: 14,
    flex: 1,
  },
  saveAddressBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveAddressBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  phoneContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  countryCodeContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    // paddingVertical: 12,
    justifyContent: "center",
    minWidth: 80,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: "500",
  },
  phoneInput: {
    flex: 1,
  },
  phoneNote: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: "italic",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  addressTypeContainer: {
    marginBottom: 16,
  },
  addressTypeLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  addressTypeOptions: {
    gap: 12,
  },
  addressTypeOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  addressTypeTextContainer: {
    flex: 1,
  },
  addressTypeText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  addressTypeSubText: {
    fontSize: 12,
  },
  noAddresses: {
    alignItems: "center",
    paddingVertical: 12,
  },
  noAddressesText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 4,
  },
  noAddressesSubText: {
    fontSize: 14,
  },
  paymentOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  cardDetailsContainer: {
    marginTop: 12,
  },
  cardField: {
    height: 50,
    marginBottom: 16,
  },
  saveCardOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saveCardText: {
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalSection: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  footerTotalAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  placeOrderBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  placeOrderText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  continueShoppingBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueShoppingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CheckoutPage;
