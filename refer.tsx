import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import RewardCard from "@/components/referal/RewardCard";
import useHeyCoins from "@/hooks/useHeyCoins";
import { Button } from "react-native";

export default function HeyCoinScreen() {
  const { total, fromSteps, fromReferrals, creditFromSteps, creditFromReferralPurchase } = useHeyCoins();

  // for demo/testing - provide some values to show until persisted state loads
  const totalCoins = total;
  const stepCoins = fromSteps;
  const referralCoins = fromReferrals;

  const rewards = [
    {
      id: 1,
      title: "Redeem 1 Session",
      description: "Use 500 HeyCoins for one session (pack value under 120)",
      heyCoins: 500,
      color: "#8C7BFF",
      barcodeValue: "RC1-500",
    },
    {
      id: 2,
      title: "1-Month Package",
      description: "Use 2500 HeyCoins for a 1-month plan (pack value under 1200)",
      heyCoins: 2500,
      color: "#FFB26B",
      barcodeValue: "RC2-2500",
    },
    {
      id: 3,
      title: "Jackpot: Mercedes-Benz C-Class Entry",
      description: "Entry @ 10000 HeyCoins — 100 participants, 1 winner",
      heyCoins: 10000,
      color: "#FF7E94",
      barcodeValue: "RC3-10000",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hey Cio Den</Text>
        <Text style={styles.subtitle}>Keep Walking, Invite Your Friends, Earn HeyCoins!</Text>

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceTitle}>Your HeyCoin Balance</Text>
          <Text style={styles.balanceValue}>{totalCoins}</Text>

          <View style={styles.coinRow}>
            <View style={styles.coinBox}>
              <Text style={styles.coinSub}>{stepCoins}</Text>
              <Text style={styles.coinLabel}>From Steps</Text>
            </View>
            <View style={styles.coinBox}>
              <Text style={styles.coinSub}>{referralCoins}</Text>
              <Text style={styles.coinLabel}>Referral Earnings</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.redeemTitle}>Redeem Your HeyCoins</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Button title="Simulate 1000 steps" onPress={() => creditFromSteps(1000)} />
        <Button title="Simulate referral purchase" onPress={() => creditFromReferralPurchase(1)} />
      </View>

      {rewards.map((item) => (
        <RewardCard
          key={item.id}
          title={item.title}
          description={item.description}
          heyCoins={item.heyCoins}
          // provide a gradientColors tuple; cast to satisfy the prop type
          gradientColors={[item.color, "#28ec1d93", "white"] as const}
          barcodeValue={item.barcodeValue}
          onRedeem={() => alert(`Redeemed: ${item.title}`)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F3FF",
    paddingHorizontal: 16,
  },
  header: {
    backgroundColor: "#7E57FF",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: "#E9E9FF",
    textAlign: "center",
    marginVertical: 10,
  },
  balanceContainer: {
    backgroundColor: "#917CFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  balanceTitle: {
    color: "#fff",
    fontWeight: "600",
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginVertical: 8,
  },
  coinRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  coinBox: {
    alignItems: "center",
  },
  coinSub: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  coinLabel: {
    color: "#fff",
    fontSize: 12,
  },
  redeemTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 16,
  },
});
