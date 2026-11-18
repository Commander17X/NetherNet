import {
  PressStart2P_400Regular,
  useFonts as usePressStart,
} from "@expo-google-fonts/press-start-2p";
import { VT323_400Regular, useFonts as useVt323 } from "@expo-google-fonts/vt323";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { tubnetColors } from "@/theme/tubnet";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [pressLoaded] = usePressStart({ PressStart2P_400Regular });
  const [vtLoaded] = useVt323({ VT323_400Regular });
  const loaded = pressLoaded && vtLoaded;

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: tubnetColors.bg },
          headerTintColor: tubnetColors.accent,
          headerTitleStyle: { fontFamily: "PressStart2P_400Regular", fontSize: 10 },
          contentStyle: { backgroundColor: tubnetColors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Servers" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="server/add" options={{ title: "Add server" }} />
        <Stack.Screen name="server/[id]" options={{ title: "Server" }} />
        <Stack.Screen name="server/[id]/edit" options={{ title: "Edit server" }} />
        <Stack.Screen
          name="join"
          options={{ title: "Join", presentation: "modal", headerShown: true }}
        />
      </Stack>
    </>
  );
}