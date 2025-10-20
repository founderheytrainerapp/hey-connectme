// File: screens/ProfilePage.tsx

import { useUser } from "@/contexts/UserContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  StatusBar,
} from "react-native";
import GlassBackground from "../../src/components/GlassBackground";

export default function ProfilePage() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const theme = useAppTheme();

  if (!user) return <Text style={{ padding: 20 }}>Loading...</Text>;

  const logout = () => {
    setUser(null);
    router.replace("/login");
  };

  const menuItems: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
    screen: string;
  }[] = [
    { icon: "bag-check", label: "Orders", screen: "screens/profile/MyOrder" },
    { icon: "cart", label: "Cart", screen: "screens/profile/MyCart" },
    {
      icon: "location",
      label: "Address",
      screen: "screens/profile/AddressPage",
    },
    { icon: "card", label: "Payments", screen: "screens/profile/Payments" },
    { icon: "log-out", label: "Log Out", screen: "" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.violet} />

      {/* Violet top section */}
      <View style={[styles.violetSection, { backgroundColor: theme.violet }]} />

      {/* Avatar spanning both sections */}
      <View style={styles.avatarContainer}>
        <Image
          source={
            user?.profileImage
              ? { uri: user?.profileImage }
              : require("@/assets/images/profile-icon.png")
          }
          style={styles.avatar}
        />
      </View>

      {/* White content area */}
      <View style={styles.whiteContentArea}>
        {/* User info */}
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.violet }]}
          onPress={() => router.push("/screens/profile/EditProfile")}
        >
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map(({ icon, label, screen }, index) => (
            <TouchableOpacity
              key={label}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={() => {
                if (label === "Log Out") {
                  logout();
                  router.replace("/login" as any);
                } else {
                  router.push(screen as any);
                }
              }}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons
                  name={icon}
                  size={20}
                  color={label === "Log Out" ? "#e74c3c" : theme.text}
                />
              </View>
              <Text
                style={[
                  styles.menuText,
                  { color: label === "Log Out" ? "#e74c3c" : theme.text },
                ]}
              >
                {label}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.text}
                style={styles.chevron}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Version info */}
      <View style={styles.versionContainer}>
        <Text style={styles.version}>App Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  violetSection: {
    height: "30%",
  },
  whiteContentArea: {
    flex: 1,
    backgroundColor: "#ffffff",
    marginTop: -55,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 55, // Increased to account for avatar
    alignItems: "center",
  },
  avatarContainer: {
    position: "absolute",
    top: "16%", // Moved higher up
    left: "50%",
    marginLeft: -50, // Half of avatar width to center it
    zIndex: 10,
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    borderWidth: 4,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
    textAlign: "center",
  },
  email: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 20,
    textAlign: "center",
  },
  editButton: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  editText: {
    fontWeight: "500",
    fontSize: 14,
    color: "#ffffff",
  },
  menuContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    // borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#333333",
  },
  chevron: {
    marginLeft: "auto",
  },
  versionContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: "center",
  },
  version: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
  },
});
