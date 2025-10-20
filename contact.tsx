// ContactPage.tsx

import { useAppTheme } from "@/hooks/useAppTheme";
import { useUser } from "@/contexts/UserContext";
import { createContactMessage } from "@/api/contact-messages";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Linking,
} from "react-native";
import { useUnifiedAlert } from "../../src/contexts/UnifiedAlertContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const ContactPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const theme = useAppTheme();
  const { user } = useUser();
  const { showError, showSuccess } = useUnifiedAlert();

  // Pre-fill user data if logged in
  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!name.trim() || !email.trim() || !message.trim()) {
      showError("Please fill out all required fields.");
      return;
    }

    if (!validateEmail(email)) {
      showError("Please enter a valid email address.");
      return;
    }

    if (message.trim().length < 10) {
      showError("Please enter a message with at least 10 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createContactMessage({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim() || undefined,
        message: message.trim(),
        userId: user?._id,
      });

      showSuccess(
        "Your message has been sent successfully! We'll get back to you soon."
      );

      // Reset form
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Error sending contact message:", error);
      showError("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppPress = () => {
    const whatsappUrl = "https://wa.me/971557504705";
    Linking.openURL(whatsappUrl).catch((err) => {
      console.error("Error opening WhatsApp:", err);
      showError("Unable to open WhatsApp. Please try again.");
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.violet} />

      {/* Violet top section */}
      <View style={[styles.violetSection, { backgroundColor: theme.violet }]}>
        <View style={styles.headerContent}>
          <FontAwesome name="envelope" size={32} color="white" />
          <Text style={styles.headerTitle}>Get in Touch</Text>
          <Text style={styles.headerSubtitle}>
            We'd love to hear from you. Send us a message and we'll respond as
            soon as possible.
          </Text>
        </View>
      </View>

      {/* White content area */}
      <View style={styles.whiteContentArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Contact Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter subject (optional)"
                placeholderTextColor="#999"
                value={subject}
                onChangeText={setSubject}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="Enter your message"
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: theme.violet,
                opacity: isSubmitting ? 0.7 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <FontAwesome name="paper-plane" size={16} color="white" />
                <Text style={styles.submitButtonText}>Send Message</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Contact Info */}
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Reach Us</Text>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleWhatsAppPress}
            >
              <View style={styles.contactIconContainer}>
                <FontAwesome name="whatsapp" size={16} color={theme.violet} />
              </View>
              <Text style={styles.contactText}>WhatsApp Hey Trainer App</Text>
            </TouchableOpacity>

            <View style={styles.contactItem}>
              <View style={styles.contactIconContainer}>
                <FontAwesome name="phone" size={16} color={theme.violet} />
              </View>
              <Text style={styles.contactText}>+971 557504705</Text>
            </View>

            <View style={styles.contactItem}>
              <View style={styles.contactIconContainer}>
                <FontAwesome name="envelope" size={16} color={theme.violet} />
              </View>
              <Text style={styles.contactText}>support@heytrainer.ae</Text>
            </View>

            <View style={styles.contactItem}>
              <View style={styles.contactIconContainer}>
                <FontAwesome name="clock-o" size={16} color={theme.violet} />
              </View>
              <Text style={styles.contactText}>
                Mon - Sun: 9:00 AM - 10:00 PM
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  violetSection: {
    height: "30%",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 15,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
    textAlign: "center",
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
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    // backgroundColor: "#ffffff",
    // borderRadius: 20,
    // padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  inputGroup: { marginBottom: 10 },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
    color: "#333333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#333333",
  },
  messageInput: {
    height: 120,
    textAlignVertical: "top",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 30,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  contactInfo: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contactText: {
    fontSize: 14,
    color: "#333333",
    flex: 1,
  },
});

export default ContactPage;
