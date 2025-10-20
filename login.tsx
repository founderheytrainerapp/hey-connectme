import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { useUser } from "../src/contexts/UserContext";
import { useAppTheme } from "../src/hooks/useAppTheme";
import { validateAndFormatPhone } from "@/utils/phoneValidation";
import {
  checkIfPhoneExists,
  loginWithGoogle,
  loginWithPhone,
} from "../src/api/authentication";
import { usePathname } from "expo-router";

// Import your auth service
import authService from "@/services/authService";
import { DiagnosticsButton } from "../src/components/dev/DiagnosticsButton";
import { SocialSignIn } from "../src/components/auth/SocialSignin";
import { OTPModal } from "../src/components/auth/OTPModal";
import { saveUserToStorage } from "../src/storage/userStorage";
import { useUnifiedAlert } from "../src/contexts/UnifiedAlertContext";

export default function WelcomeScreen() {
  const theme = useAppTheme();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+971");
  const [otpCode, setOtpCode] = useState("");
  const [verificationId, setVerificationId] = useState<string>("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { user, setUser } = useUser();
  const pathname = usePathname();
  const { showValidationError, showError, showLoginSuccess, showLoginFailed } = useUnifiedAlert();

  // useEffect(() => {
  //   if (user?.isLoggedIn && pathname !== "/(drawer)/(tabs)") {
  //     router.replace("/(drawer)/(tabs)");
  //   }
  // }, [user?.isLoggedIn, pathname]);

  const handleLogin = async () => {
    try {
      if (!phone) {
        showValidationError("Please enter your phone number.");
        return;
      }

      const validation = validateAndFormatPhone(phone);
      if (!validation.isValid) {
        showValidationError("Invalid Phone Number");
        return;
      }
      const phoneExists = await checkIfPhoneExists(phone);
      if (!phoneExists) {
        if (!name) {
          showValidationError("Please enter your Name.");
          setIsGuest(true);
          return;
        }
        const user = await loginWithPhone(phone, name);
        setUser({ ...user, isLoggedIn: true });
        await saveUserToStorage({ ...user, isLoggedIn: true });

        router.replace("/(drawer)/(tabs)");
      } else {
        await handleSendOTP();
      }
    } catch (err: any) {
      console.error("Login/OTP initiation error:", err);
      if (err.code === "auth/invalid-phone-number") {
        showValidationError(
          "Invalid Phone Number,Please enter a valid phone number, including the country code (e.g., +1XXXXXXXXXX)."
        );
      } else if (err.code === "auth/too-many-requests") {
        showValidationError(
          "Too Many Requests, You have sent too many OTP requests. Please wait a moment and try again."
        );
      } else {
        showLoginFailed("Something went wrong.");
      }
    }
  };

  const handleSendOTP = async () => {
    if (!phone) {
      showValidationError("Please enter your phone number.");
      return;
    }

    const validation = validateAndFormatPhone(phone);
    if (!validation.isValid) {
      showValidationError("Invalid Phone Number");
      return;
    }

    setIsSending(true);
    try {
      const result = await authService.sendPhoneVerificationCode(
        validation.formatted
      );

      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId);
        setShowOtpInput(true);
        setResendCooldown(60); // 60 second cooldown
      }
    } catch (error: any) {
      console.error("OTP sending error:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!verificationId || !otpCode || otpCode.length !== 6) {
      showError("Please enter the 6-digit verification code");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await authService.verifyOTP(verificationId, otpCode);

      if (result.success && result.user) {
        const user = await loginWithPhone(
          phone,
          result.user?.displayName ?? name
        );
        setUser({ ...user, isLoggedIn: true });
        await saveUserToStorage({ ...user, isLoggedIn: true });

        router.replace("/(drawer)/(tabs)");

        setShowOtpInput(false);
      } else {
        showError(result.error || "Verification failed");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      showError(error.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };
  const handleGoogleSignIn = async () => {
    try {
      const result = await authService.signInWithGoogle();
      if (result.success && result.user) {
        const LoggedUser = await loginWithGoogle({
          user: result.user,
        });
        setUser({ ...LoggedUser, isLoggedIn: true });
        await saveUserToStorage({ ...LoggedUser, isLoggedIn: true });

        router.replace("/(drawer)/(tabs)");
      } else {
        showError(result.error || "Google sign-in failed");
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      showError(error.message || "Google sign-in failed");
    }
  };

  const handleResendOTP = async () => {
    setShowOtpInput(false);
    await handleSendOTP();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.loginbg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.innerContainer}>
            <Image
              source={require("../assets/images/login.jpg")}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />

            <Animated.View
              entering={FadeInUp.duration(600)}
              style={[
                styles.contentContainer,
                { backgroundColor: theme.loginbg, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.title, { color: theme.violet }]}>
                Join the Movement
              </Text>
              <Text style={[styles.subtitle, { color: theme.subtext }]}>
                Your fitness journey starts now.
              </Text>

              <View style={styles.inputContainer}>
                {isGuest && (
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.floatingLabel,
                        {
                          color: theme.text,
                          backgroundColor: theme.inputBg || "#fff",
                        },
                      ]}
                    >
                      Name
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: theme.border,
                          color: theme.text,
                          backgroundColor: theme.inputBg || "#fff",
                        },
                      ]}
                      placeholder="eg. Cio Den"
                      placeholderTextColor={theme.textdim}
                      value={name}
                      onChangeText={setName}
                      editable={!isSending && !isVerifying}
                    />
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Text
                    style={[
                      styles.floatingLabel,
                      {
                        color: theme.text,
                        backgroundColor: theme.inputBg || "#fff",
                      },
                    ]}
                  >
                    Phone
                  </Text>

                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: theme.border,
                        color: theme.text,
                        backgroundColor: theme.inputBg || "#fff",
                      },
                    ]}
                    placeholder="Phone Number"
                    placeholderTextColor={theme.textdim}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    editable={!isSending && !isVerifying}
                    autoComplete="tel"
                  />
                </View>

                {!showOtpInput ? (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        {
                          backgroundColor:
                            isSending || !phone
                              ? theme.violetlight
                              : theme.violet,
                          opacity: isSending || !phone ? 0.7 : 1,
                        },
                      ]}
                      onPress={handleLogin}
                      disabled={isSending || !phone}
                    >
                      {isSending ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          {isGuest ? "Explore as a Guest" : "Proceed"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : null}

                <OTPModal
                  visible={showOtpInput}
                  onClose={() => {
                    setShowOtpInput(false);
                    setOtpCode("");
                  }}
                  onResend={handleSendOTP}
                  isResending={isSending}
                  phoneNumber={phone}
                  onVerify={async () => {
                    const user = await loginWithPhone(phone, name);
                    setUser({ ...user, isLoggedIn: true });
                    await saveUserToStorage({ ...user, isLoggedIn: true });

                    router.replace("/(drawer)/(tabs)");
                    setShowOtpInput(false);
                  }}
                  isVerifying={false}
                />
              </View>

              {showOtpInput && (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOTP}
                  disabled={isSending || resendCooldown > 0}
                >
                  <Text
                    style={[
                      styles.resendText,
                      {
                        color:
                          resendCooldown > 0 ? theme.subtext : theme.violet,
                      },
                    ]}
                  >
                    {resendCooldown > 0
                      ? `Resend Code in ${resendCooldown}s`
                      : "Resend Code"}
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.dividerContainer}>
                <View
                  style={[styles.divider, { backgroundColor: theme.border }]}
                />
                <Text style={[styles.dividerText, { color: theme.subtext }]}>
                  or sign in with
                </Text>
                <View
                  style={[styles.divider, { backgroundColor: theme.border }]}
                />
              </View>

              <SocialSignIn
                onGooglePress={handleGoogleSignIn}
                // isLoading={isLoading}
              />

              {isGuest ? (
                <TouchableOpacity
                  style={styles.signInLink}
                  onPress={() => {
                    setIsGuest(false);
                  }}
                >
                  <Text style={[styles.signInText, { color: theme.subtext }]}>
                    Already a member?{" "}
                    <Text
                      style={[styles.signInTextBold, { color: theme.violet }]}
                    >
                      Sign In
                    </Text>
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.signInLink}
                  onPress={() => {
                    setIsGuest(true);
                  }}
                >
                  <Text style={[styles.signInText, { color: theme.subtext }]}>
                    Not a member?{" "}
                    <Text
                      style={[styles.signInTextBold, { color: theme.violet }]}
                    >
                      Explore as Guest
                    </Text>
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  innerContainer: { flex: 1, alignItems: "center" },
  heroImage: { width: "100%", height: "40%", minHeight: 250 },
  contentContainer: {
    flex: 1,
    width: "100%",
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, textAlign: "center", marginBottom: 24 },
  // inputContainer: { width: "100%", marginBottom: 16 },
  inputContainer: {
    marginBottom: 16,
    width: "100%",
    position: "relative",
  },
  floatingLabel: {
    position: "absolute",
    top: -10,
    left: 12,
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: "500",
    zIndex: 1,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  // input: {
  //   borderWidth: 1,
  //   padding: 13,
  //   borderRadius: 8,
  //   fontSize: 16,
  //   marginBottom: 16,
  // },
  otpContainer: { width: "100%", marginBottom: 16 },
  otpLabel: { fontSize: 14, textAlign: "center", marginBottom: 8 },
  otpInput: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    textAlign: "center",
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    minHeight: 52,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },

  googleButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  googleButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  resendButton: { marginTop: 15, alignItems: "center" },
  resendText: { fontSize: 14, fontWeight: "500" },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    // marginVertical: 16,
  },
  divider: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 12, fontSize: 14 },
  signInLink: {},
  signInText: { fontSize: 14 },
  signInTextBold: { fontWeight: "bold" },
  verifyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 12,
  },
  verifyButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});
