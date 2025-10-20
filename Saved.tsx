// app/(tabs)/saved.tsx
import NtHeader from "@/components/NtHeader";
import PackageCard from "@/components/PackageCard";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useSavedStore } from "@/store/savedStore";
import { FlashList } from "@shopify/flash-list";
import React, { useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";

export default function Saved() {
  const theme = useAppTheme();
  const { savedItems, isLoading, error, loadSaved } = useSavedStore();

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.surface }}>
        <NtHeader title="Saved Packages" />
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={theme.violet} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading saved packages...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.surface }}>
        <NtHeader title="Saved Packages" />
        <View style={styles.emptyWrapper}>
          <Text style={[styles.empty, { color: theme.text }]}>
            Error loading saved packages: {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (savedItems.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.surface }}>
        <NtHeader title="Saved Packages" />
        <View style={styles.emptyWrapper}>
          <Text style={[styles.empty, { color: theme.text }]}>
            You haven't saved anything yet!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <NtHeader title="Saved Packages" />
      <FlashList
        data={savedItems}
        estimatedItemSize={250}
        renderItem={({ item }) => <PackageCard item={item} />}
        contentContainerStyle={{ paddingVertical: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    fontSize: 18,
    textAlign: "center",
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
});
