import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "../../../src/contexts/UserContext";

const { width, height } = Dimensions.get("window");

export default function SalesTeam() {
  const theme = useAppTheme();
  const { user } = useUser();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleGetStarted = () => {
    if (!user?.isProfileComplete) {
      setShowProfileModal(true);
      return;
    }
    router.push("/WorkWithUs/salesPlans");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.violetSection, { backgroundColor: theme.violet }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Join Our Sales Team</Text>
          <Text style={styles.headerSubtitle}>
            Unlock your earning potential with our comprehensive sales program
          </Text>
        </View>
      </View>

      <View style={styles.whiteContentArea}>
        <View style={[styles.stepperCard, { backgroundColor: theme.white }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            How It Works
          </Text>

          <View style={styles.stepperContainer}>
            <View style={styles.stepperItem}>
              <View style={styles.stepperLeft}>
                <View
                  style={[styles.stepperDot, { backgroundColor: theme.violet }]}
                />
                <View
                  style={[
                    styles.stepperLine,
                    { backgroundColor: theme.violet },
                  ]}
                />
              </View>
              <View style={styles.stepperContent}>
                <Text style={[styles.stepperTitle, { color: theme.text }]}>
                  Generate Your Referral Code
                </Text>
                <Text
                  style={[styles.stepperDescription, { color: theme.textdim }]}
                >
                  Create your unique 6-digit code (e.g., NAME12)
                </Text>
              </View>
            </View>

            <View style={styles.stepperItem}>
              <View style={styles.stepperLeft}>
                <View
                  style={[styles.stepperDot, { backgroundColor: theme.violet }]}
                />
                <View
                  style={[
                    styles.stepperLine,
                    { backgroundColor: theme.violet },
                  ]}
                />
              </View>
              <View style={styles.stepperContent}>
                <Text style={[styles.stepperTitle, { color: theme.text }]}>
                  Complete Your Profile
                </Text>
                <Text
                  style={[styles.stepperDescription, { color: theme.textdim }]}
                >
                  Fill out your information, accept terms & conditions, and
                  explore available sales plans
                </Text>
              </View>
            </View>

            <View style={styles.stepperItem}>
              <View style={styles.stepperLeft}>
                <View
                  style={[styles.stepperDot, { backgroundColor: theme.violet }]}
                />
                <View
                  style={[
                    styles.stepperLine,
                    { backgroundColor: theme.violet },
                  ]}
                />
              </View>
              <View style={styles.stepperContent}>
                <Text style={[styles.stepperTitle, { color: theme.text }]}>
                  Start Earning
                </Text>
                <Text
                  style={[styles.stepperDescription, { color: theme.textdim }]}
                >
                  Earn based on sales plans with real money transfers via
                  Botim/Payby Wallet
                </Text>
              </View>
            </View>

            <View style={styles.stepperItem}>
              <View style={styles.stepperLeft}>
                <View
                  style={[styles.stepperDot, { backgroundColor: theme.violet }]}
                />
              </View>
              <View style={styles.stepperContent}>
                <Text style={[styles.stepperTitle, { color: theme.text }]}>
                  Withdraw Earnings
                </Text>
                <Text
                  style={[styles.stepperDescription, { color: theme.textdim }]}
                >
                  Minimum 500AED to Maximum 10K per request (7-day earning
                  requirement)
                </Text>
              </View>
            </View>

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
                <Text style={styles.getStartedButtonText}>Get Started Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showProfileModal && (
        <Modal
          visible={showProfileModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowProfileModal(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <View
              style={{
                backgroundColor: theme.surface,
                padding: 24,
                borderRadius: 20,
                width: "90%",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: theme.text,
                }}
              >
                Complete Your Profile
              </Text>
              <Text
                style={{
                  marginTop: 10,
                  textAlign: "center",
                  color: theme.subtext,
                  fontSize: 14,
                }}
              >
                You need to complete your profile before subscribing.
              </Text>

              <TouchableOpacity
                style={{
                  marginTop: 20,
                  paddingVertical: 12,
                  paddingHorizontal: 30,
                  borderRadius: 12,
                  backgroundColor: theme.violet,
                }}
                onPress={() => {
                  setShowProfileModal(false);
                  router.push("/screens/profile/EditProfile");
                }}
              >
                <Text style={{ color: theme.btntext, fontWeight: "bold" }}>
                  Complete Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowProfileModal(false)}
                style={{ marginTop: 10 }}
              >
                <Text style={{ color: theme.error, fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  violetSection: {
    height: "40%",
    justifyContent: "center",
    alignItems: "center",
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
  stepperCard: {
    borderRadius: 20,
    paddingVertical: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  stepperContainer: {
    paddingLeft: 12,
  },
  stepperItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  stepperLeft: {
    alignItems: "center",
    marginRight: 16,
    width: 20,
  },
  stepperDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  stepperContent: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 16,
  },
  stepperTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 20,
  },
  stepperDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  stepperLine: {
    width: 2,
    height: 70,
    // marginTop: 4,
  },

  getStartedButton: {
    marginTop: 20,
    borderRadius: 12,
    alignItems: "flex-end",
  },
  gradientButton: {
    paddingVertical: 12,
    // paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "50%",
  },
  getStartedButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
