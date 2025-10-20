import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useUnifiedAlert } from "@/contexts/UnifiedAlertContext";
import CustomHeader from "../../../src/components/CustomHeader";
import GlintCoin from "../../../src/components/GlintCoin";
import SalesPlanCard from "../../../src/components/workWithUs/SalesPlanCard";
import SalesPlanModal from "../../../src/components/workWithUs/SalesPlanModal";
import { fetchActiveSalesPlans } from "../../../src/api/salesPlans";
import { ISalesPlan } from "../../../src/interfaces/salesPlans";
import { useRouter } from "expo-router";

export default function SalesPlans() {
  const theme = useAppTheme();
  const { showAlert, showError } = useUnifiedAlert();
  const [salesPlans, setSalesPlans] = useState<ISalesPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ISalesPlan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadSalesPlans();
  }, []);

  const loadSalesPlans = async () => {
    try {
      setLoading(true);
      const plans = await fetchActiveSalesPlans();
      setSalesPlans(plans);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handlePlanPress = (plan: ISalesPlan) => {
    setSelectedPlan(plan);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedPlan(null);
  };

  const handleGetStarted = () => {
    router.push({
      pathname: "/WorkWithUs/createReferralCode",
    });
  };

  const renderHeader = () => (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface }]}
      showsVerticalScrollIndicator={false}
    >
      <CustomHeader />
      <View style={[styles.violetSection, { backgroundColor: theme.violet }]}>
        <LinearGradient
          colors={[
            theme.violet,
            theme.violetlight,
            theme.glassBg,
            theme.violetdark,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardBalanceLabel}>Total Balance</Text>
            {/* <Text style={styles.visaText}>VISA</Text> */}
          </View>
          <Text style={[styles.balanceAmount, { color: theme.textLight }]}>
            AED 9,99,990
          </Text>
        </LinearGradient>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.buttonText}>View More</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.withdrawalButton]}
          >
            <Text style={[styles.buttonText, styles.withdrawalButtonText]}>
              Withdrawal
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.whiteContentArea}>
        <View style={styles.plansHeader}>
          <Text style={[styles.plansTitle, { color: theme.text }]}>
            Available Sales Plans
          </Text>
          <Text style={[styles.plansSubtitle, { color: theme.textdim }]}>
            Choose a plan to start earning rewards
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.textdim }]}>
        No sales plans available at the moment
      </Text>
    </View>
  );

  const renderLoadingComponent = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.violet} />
      <Text style={[styles.loadingText, { color: theme.textdim }]}>
        Loading sales plans...
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        {renderHeader()}
        {renderLoadingComponent()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <FlatList
        data={salesPlans}
        renderItem={({ item }) => (
          <SalesPlanCard plan={item} onPress={handlePlanPress} />
        )}
        keyExtractor={(item) => item._id || item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.plansGrid}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
      />

      <TouchableOpacity
        style={styles.getStartedButton}
        onPress={handleGetStarted}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[theme.violet, theme.violetdark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          <Text style={styles.getStartedButtonText}>
            Generate Your Referral Code
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <SalesPlanModal
        visible={modalVisible}
        plan={selectedPlan}
        onClose={handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  gradientButton: {
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  getStartedButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,

    borderRadius: 12,
    alignItems: "flex-end",
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  violetSection: {
    justifyContent: "center",
    alignItems: "center",
    height: 250,
  },

  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    opacity: 0.9,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  whiteContentArea: {
    flex: 1,
    backgroundColor: "#ffffff",
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  balanceCard: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 25,
    marginHorizontal: 24,
    width: 300,
    alignContent: "center",
    alignItems: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardBalanceLabel: {
    fontSize: 16,
  },
  visaText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 22,
    marginTop: 10,
    fontWeight: "800",
  },
  cardDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#6B46C1",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
    marginHorizontal: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  withdrawalButton: {
    backgroundColor: "#6B46C1",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B46C1",
  },
  withdrawalButtonText: {
    color: "#FFFFFF",
  },
  plansHeader: {
    marginBottom: 24,
  },
  plansTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  plansSubtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  plansGrid: {
    paddingBottom: 20,
    // paddingHorizontal: 16,
  },
  row: {
    justifyContent: "space-around",
    paddingHorizontal: 8,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
