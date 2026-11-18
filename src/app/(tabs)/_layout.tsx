import { Tabs } from "expo-router";

import { Hotbar } from "@/components/Hotbar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <Hotbar state={props.state} onSelect={props.navigateToTab} />}
    >
      <Tabs.Screen name="index" options={{ title: "Servers" }} />
      <Tabs.Screen name="add" options={{ title: "Add" }} />
      <Tabs.Screen name="favorites" options={{ title: "Favorites" }} />
      <Tabs.Screen name="settings" options={{ title: "Options" }} />
    </Tabs>
  );
}
