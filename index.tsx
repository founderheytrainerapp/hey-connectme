import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useUser } from "@/contexts/UserContext";

const { width, height } = Dimensions.get("window");
const CURRENT_PROMO_VERSION = "v1";

// Local promo images
const promoImages = [
  require("../../assets/images/promo/p1.png"),
  require("../../assets/images/promo/p2.png"),
  require("../../assets/images/promo/p3.png"),
];

export default function PromoScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finishPromo = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    await AsyncStorage.setItem("promoVersion", CURRENT_PROMO_VERSION);

    if (user?.isLoggedIn) {
      router.replace("/(drawer)/(tabs)");
    } else {
      router.replace("/login");
    }
  };

  const animateSlide = () => {
    scaleAnim.setValue(1);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 2500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    animateSlide();

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev === promoImages.length - 1) {
          // Stop interval and auto-finish after 1s
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => finishPromo(), 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Animate zoom + fade on index change
  useEffect(() => {
    animateSlide();
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={promoImages[currentIndex]}
        style={[
          styles.image,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
        resizeMode="cover"
      />

      {currentIndex < promoImages.length - 1 && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.button} onPress={finishPromo}>
            <Text style={styles.buttonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.dotsContainer}>
        {promoImages.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, { opacity: currentIndex === index ? 1 : 0.3 }]}
          />
        ))}
      </View>

      {currentIndex === promoImages.length - 1 && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.button} onPress={finishPromo}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  image: { width: width, height: height },
  controls: { position: "absolute", top: 60, right: 20 },
  button: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  dotsContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    marginHorizontal: 5,
  },
});
