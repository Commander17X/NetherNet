import { Tabs, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { TabBar } from "@/components/TabBar";
import { hasSeenOnboarding } from "@/lib/storage";

export default function TabLayout() {
  const router = useRouter();
  const asked = useRef(false);

  useEffect(() => {
    void hasSeenOnboarding().then((seen) => {
      if (!seen && !asked.current) {
        asked.current = true;
        router.push("/welcome");
      }
    });
  }, [router]);

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
