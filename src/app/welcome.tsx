import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/AppButton";
import { CubeMark, DirtBand, GrassGround, Wordmark } from "@/components/blocks/Blocks";
import { GlassPanel } from "@/components/hud/GlassPanel";
import { PixelLabel } from "@/components/hud/PixelLabel";
import { Screen } from "@/components/Screen";
import { markOnboardingSeen } from "@/lib/storage";
import { colors, space } from "@/theme";

const STEPS: { title: string; body: string; icon: keyof typeof Ionicons.glyphMap; tint: string }[] = [
  {
    icon: "game-controller-outline",
    tint: colors.accent,
    title: "You play in Bedrock",
    body: "NetherNet is your lobby. The game itself runs in Minecraft for iPhone and iPad, with the touch controls you know.",
  },
  {
    icon: "flash-outline",
    tint: "#5AC8FF",
    title: "Bedrock servers open directly",
    body: "Add a domain, an IP, or any custom port. One tap hands it to Minecraft.",
  },
  {
    icon: "git-network-outline",
    tint: colors.xp,
    title: "Java servers go through your relay",
    body: "Run the small open-source relay, paste its address in Settings, and any Java server becomes joinable.",
  },
];

export function WelcomeGuide({ onContinue }: { onContinue: () => void }) {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const insets = useSafeAreaInsets();

  return (
    <Screen bottomInset band={false}>
      <DirtBand height={wide ? 400 : 300} />
      <GrassGround height={insets.bottom} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.column, wide && styles.columnWide]}>
          <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
            <CubeMark size={wide ? 112 : 84} />
            <Wordmark height={26} />
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={1.3}
              style={[styles.title, wide && styles.titleWide]}
            >
              Every server.{"\n"}One tap away.
            </Text>
            <Text style={styles.lead}>A live lobby for Java and Bedrock servers, built for your phone.</Text>
          </Animated.View>

          <View style={[styles.list, wide && styles.listWide]}>
            {STEPS.map((step, index) => (
              <Animated.View
                key={step.title}
                entering={FadeInDown.delay(140 + index * 90).duration(380)}
                style={wide ? styles.cardWide : undefined}
              >
                <GlassPanel style={styles.card}>
                  <View
                    accessible
                    accessibilityLabel={`Step ${index + 1}. ${step.title}. ${step.body}`}
                    style={[styles.cardInner, wide && styles.cardInnerWide]}
                  >
                    <View style={[styles.badge, { borderColor: `${step.tint}66`, backgroundColor: `${step.tint}1A` }]}>
                      <Ionicons name={step.icon} size={22} color={step.tint} />
                    </View>
                    <View style={styles.cardCopy}>
                      <View style={styles.cardHead}>
                        <Text style={styles.cardTitle}>{step.title}</Text>
                        <PixelLabel size={8} color={colors.tertiary}>
                          {`0${index + 1}`}
                        </PixelLabel>
                      </View>
                      <Text style={styles.cardBody}>{step.body}</Text>
                    </View>
                  </View>
                </GlassPanel>
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={FadeInDown.delay(460).duration(380)} style={styles.footer}>
            <AppButton label="Enter the lobby" icon="arrow-forward" onPress={onContinue} />
            <Text style={styles.legal}>
              Not an official Minecraft product. Not associated with Mojang or Microsoft.
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </Screen>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  async function finish() {
    await markOnboardingSeen();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/");
  }

  return <WelcomeGuide onContinue={() => void finish()} />;
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: space.lg,
    paddingBottom: space.xxl,
  },
  column: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    gap: space.lg,
  },
  columnWide: {
    maxWidth: 980,
  },
  hero: {
    alignItems: "center",
    gap: space.sm + space.xs,
    marginBottom: space.lg,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -1.4,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  titleWide: {
    fontSize: 52,
    lineHeight: 58,
  },
  lead: {
    color: colors.secondary,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 380,
  },
  list: {
    gap: space.sm + space.xs,
  },
  listWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  cardWide: {
    flex: 1,
  },
  cardInnerWide: {
    flexDirection: "column",
  },
  card: {
    flexGrow: 1,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: space.md,
    gap: space.md,
  },
  cardCopy: {
    flex: 1,
    gap: space.xs,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  cardBody: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  footer: {
    gap: space.md,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  legal: {
    color: colors.tertiary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
});
