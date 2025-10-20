import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import * as Clipboard from "expo-clipboard";
import LottieView from "lottie-react-native";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { IUserReferral } from "../../../src/interfaces/userSalesPlan";

const celebrationAnimation = require("@/assets/lottie/celebration.json");

const { width, height } = Dimensions.get("window");

export default function ReferralCodeSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userReferral = Array.isArray(params.userReferral)
    ? params.userReferral[0]
    : params.userReferral;
  const theme = useAppTheme();
  const { showSuccess, showError } = useCustomAlert();

  const [salesPlanData, setSalesPlanData] =
    React.useState<IUserReferral | null>(null);

  React.useEffect(() => {
    if (
      userReferral &&
      typeof userReferral === "string" &&
      userReferral.length > 0
    ) {
      try {
        const parsed = JSON.parse(userReferral) as IUserReferral;
        setSalesPlanData(parsed);
      } catch (error) {
        router.back();
      }
    }
  }, [userReferral]);

  const handleGoBack = () => {
    router.push("/WorkWithUs/salesPlans");
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(salesPlanData?.referralCode || "");
      showSuccess("Referral code copied to clipboard!", "Copied!");
    } catch (error) {
      showError("Failed to copy code");
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(salesPlanData?.referralLink || "");
      showSuccess("Referral link copied to clipboard!", "Copied!");
    } catch (error) {
      showError("Failed to copy link");
    }
  };

  if (!salesPlanData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={handleGoBack}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <LottieView
            source={celebrationAnimation}
            autoPlay
            loop={false}
            style={styles.celebrationAnimation}
          />
          <Text style={styles.celebrationText}>
            Yay! You've Created Your Referral Code!
          </Text>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.planHeader}>
            <View style={styles.planInfo}>
              <Text style={styles.planSubtitle}>Referral Program</Text>
            </View>
          </View>

          <View style={styles.planDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, { color: "#10B981" }]}>
                {salesPlanData.status.charAt(0).toUpperCase() +
                  salesPlanData.status.slice(1)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Users Connected</Text>
              <Text style={styles.detailValue}>
                {salesPlanData.usersConnected}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.qrSection}>
            <View style={styles.qrCodeContainer}>
              <View style={styles.qrCodePlaceholder}>
                <Image
                  source={{ uri: salesPlanData.qrCodeUrl }}
                  style={{ width: 120, height: 120, borderRadius: 8 }}
                />
              </View>
            </View>

            <Text style={styles.referralCode}>
              {salesPlanData.referralCode}
            </Text>
          </View>

          {/* Action Buttons */}
          {/* <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.copyCodeButton}
              onPress={handleCopyCode}
            >
              <Text style={styles.copyCodeButtonText}>Copy Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.copyLinkButton}
              onPress={handleCopyLink}
            >
              <Text style={styles.copyLinkButtonText}>Copy Link</Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#666666",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingText: {
    color: "#666666",
    fontSize: 18,
    textAlign: "center",
    marginTop: 100,
  },

  // Header Section
  headerSection: {
    backgroundColor: "#FFFFFF",
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: "center",
    position: "relative",
  },
  celebrationAnimation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  celebrationText: {
    fontSize: 18,
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 40,
  },

  // Main Card
  mainCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  planLogo: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  logoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFD93D",
    marginRight: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  planDetails: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E5E5",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginBottom: 24,
  },
  qrSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  qrCodeContainer: {
    marginBottom: 16,
  },
  qrCodePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  qrCodeText: {
    fontSize: 12,
    color: "#999999",
    fontWeight: "500",
  },
  referralCode: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4A90E2",
    letterSpacing: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  copyCodeButton: {
    flex: 1,
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  copyCodeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  copyLinkButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4A90E2",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  copyLinkButtonText: {
    color: "#4A90E2",
    fontSize: 14,
    fontWeight: "600",
  },

  // Bottom Section
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "#4A90E2",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "#4A90E2",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
