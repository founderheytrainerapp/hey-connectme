import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useUser } from "@/contexts/UserContext";
import userReferralService from "@/services/userReferralService";
import NtHeader from "../../../src/components/NtHeader";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { CreateUserReferralRequest } from "../../../src/interfaces/userSalesPlan";

const { width, height } = Dimensions.get("window");

export default function CreateReferralCode() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useUser();
  const { showError } = useCustomAlert();

  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [isCodeValid, setIsCodeValid] = useState(false);

  // useEffect(() => {
  //   const defaultCode = generateDefaultCode();
  //   setReferralCode(defaultCode);
  // }, []);

  // const generateDefaultCode = () => {
  //   const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  //   let result = "";
  //   for (let i = 0; i < 6; i++) {
  //     result += chars.charAt(Math.floor(Math.random() * chars.length));
  //   }
  //   return result;
  // };

  const validateReferralCode = (code: string) => {
    if (code.length !== 6) {
      return false;
    }

    const alphanumericRegex = /^[A-Z0-9]+$/;
    return alphanumericRegex.test(code);
  };

  const checkCodeAvailability = async (code: string) => {
    if (!validateReferralCode(code)) {
      setCodeError("Code must be exactly 6 alphanumeric characters");
      setIsCodeValid(false);
      return;
    }

    setIsCheckingCode(true);
    setCodeError("");

    try {
      const response = await userReferralService.checkReferralCodeAvailability(
        code
      );

      if (response.available) {
        setCodeError("");
        setIsCodeValid(true);
      } else {
        setCodeError("Code already exists. Please choose a different one.");
        setIsCodeValid(false);
      }
    } catch (error) {
      setCodeError("Error checking code availability. Please try again.");
      setIsCodeValid(false);
    } finally {
      setIsCheckingCode(false);
    }
  };

  const handleCodeChange = (text: string) => {
    const upperText = text.toUpperCase();
    setReferralCode(upperText);

    setCodeError("");
    setIsCodeValid(false);

    if (upperText.length === 6) {
      const timeoutId = setTimeout(() => {
        checkCodeAvailability(upperText);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  };

  const handleProceed = async () => {
    if (!user || !isCodeValid) {
      showError("Please ensure all fields are valid");
      return;
    }

    setIsLoading(true);

    try {
      const request: CreateUserReferralRequest = {
        referralCode: referralCode,
      };

      const response = await userReferralService.createUserReferral(request);

      if (response.success && response.data) {
        router.replace({
          pathname: "/WorkWithUs/referralCodeSuccess",
          params: { userReferral: JSON.stringify(response.data) },
        });
      } else {
        showError(response.error || "Failed to create referral code");
      }
    } catch (error) {
      showError("Failed to create referral code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <NtHeader />

      <View style={styles.card}>
        <View style={styles.greetingSection}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>
          </View>
          <Text style={[styles.greeting, { color: theme.text }]}>
            Hey {user?.name || "User"},
          </Text>
        </View>

        <View style={styles.decorativeLine} />

        <View style={styles.instructionsContainer}>
          <Text style={[styles.instructionText, { color: theme.violet }]}>
            Enter your required custom Referral
          </Text>
          <Text style={[styles.instructionText, { color: theme.violet }]}>
            Code (Any 6 Digits - Not Used)
          </Text>
          <Text style={[styles.instructionText, { color: theme.violet }]}>
            for generating your personalized
          </Text>
          <Text style={[styles.instructionText, { color: theme.violet }]}>
            Ref.No, QR Code & Link,
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: codeError
                  ? "#FF6B6B"
                  : isCodeValid
                  ? "#10B981"
                  : "#E5E7EB",
                backgroundColor: theme.surface,
              },
            ]}
            value={referralCode}
            onChangeText={handleCodeChange}
            placeholder="Enter any 6-digit code"
            placeholderTextColor="#9CA3AF"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            textAlign="center"
          />

          {isCheckingCode && (
            <View style={styles.checkingIndicator}>
              <ActivityIndicator size="small" color={theme.violet} />
            </View>
          )}

          {codeError && <Text style={styles.errorText}>{codeError}</Text>}

          {isCodeValid && !codeError && (
            <Text style={styles.successText}>✓ Code is available</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.proceedButton,
            {
              backgroundColor: isCodeValid ? "#FCD34D" : "#D1D5DB",
            },
          ]}
          onPress={handleProceed}
          disabled={!isCodeValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.violet} />
          ) : (
            <Text style={[styles.proceedButtonText, { color: theme.violet }]}>
              Proceed
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingHorizontal: 20,
    // paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    minHeight: height * 0.6,
  },
  greetingSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
  },
  decorativeLine: {
    height: 2,
    backgroundColor: "#E5E7EB",
    borderRadius: 1,
    marginBottom: 24,
  },
  instructionsContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 4,
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 2,
  },
  checkingIndicator: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
  successText: {
    color: "#10B981",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
  },
  proceedButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
