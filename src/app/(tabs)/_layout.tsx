import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { TabBar } from "@/components/TabBar";
import { WelcomeGuide } from "@/app/welcome";
import { hasSeenOnboarding, markOnboardingSeen } from "@/lib/storage";
import { colors } from "@/theme";

export default function TabLayout() {
  const [gate, setGate] = useState<"loading" | "welcome" | "app">("loading");

  useEffect(() => {
    void hasSeenOnboarding().then((seen) => setGate(seen ? "app" : "welcome"));
  }, []);

  if (gate === "loading") {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (gate === "welcome") {
    return (
      <WelcomeGuide
        onContinue={() => {
          void markOnboardingSeen().then(() => setGate("app"));
        }}
      />
    );
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar state={props.state} onSelect={props.navigateToTab} />}
    >
      <Tabs.Screen name="index" options={{ title: "Servers" }} />
      <Tabs.Screen name="add" options={{ title: "Add" }} />
      <Tabs.Screen name="favorites" options={{ title: "Favorites" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
