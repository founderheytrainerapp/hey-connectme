import { Stack } from "expo-router";

export default function WorkWithUsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="salesTeam" />
      <Stack.Screen name="salesPlans" />
    </Stack>
  );
}
