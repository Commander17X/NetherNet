import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { colors, FontReadyContext } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PressStart2P_400Regular: require("@expo-google-fonts/press-start-2p/400Regular/PressStart2P_400Regular.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <FontReadyContext.Provider value={loaded}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: "fade",
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="server/[id]" />
          <Stack.Screen
            name="join/[id]"
            options={{
              presentation: "formSheet",
              sheetGrabberVisible: true,
              sheetAllowedDetents: [0.72, 1],
              contentStyle: { backgroundColor: colors.bg },
            }}
          />
          <Stack.Screen name="edit/[id]" />
        </Stack>
      </FontReadyContext.Provider>
    </GestureHandlerRootView>
  );
}
