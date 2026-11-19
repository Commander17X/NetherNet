import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { Screen, Wordmark } from "@/components/Screen";
import { markOnboardingSeen } from "@/lib/storage";
import { colors, radius, space } from "@/theme";

const STEPS: { title: string; body: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  {
    icon: "phone-portrait-outline",
    title: "Play happens in Bedrock",
    body: "NetherNet is the list. The official Bedrock app is where you play, with the touch controls you already know.",
  },
  {
    icon: "globe-outline",
    title: "Bedrock servers open directly",
    body: "Add a domain, or a domain and a port. One tap hands that address to Bedrock.",
  },
  {
    icon: "git-network-outline",
    title: "Java servers use your relay",
    body: "Run the small relay from this project, then paste its address in Settings. NetherNet asks it for a short session and opens Bedrock pointed there.",
  },
];

export function WelcomeGuide({ onContinue }: { onContinue: () => void }) {
  const width = useWindowDimensions().width;
  const wide = width >= 700;

  return (
    <Screen bottomInset>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.column, wide && styles.columnWide]}>
          <Image source={require("../../assets/images/icon.png")} style={styles.icon} accessibilityLabel="NetherNet app icon" />
          <Wordmark />
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>
            Welcome
          </Text>
          <Text style={styles.lead}>A server list for your phone. The game stays in Bedrock.</Text>
          <View style={[styles.list, wide && styles.listWide]}>
            {STEPS.map((step, index) => (
              <View
                key={step.title}
                accessible
                accessibilityLabel={`${index + 1}. ${step.title}. ${step.body}`}
                style={[styles.card, wide && styles.cardWide]}
              >
                <View style={styles.badge}>
                  <Ionicons name={step.icon} size={22} color={colors.accent} />
                </View>
                <Text style={styles.cardTitle}>{step.title}</Text>
                <Text style={styles.cardBody}>{step.body}</Text>
              </View>
            ))}
          </View>
          <AppButton label="Continue" onPress={onContinue} />
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
    padding: space.lg,
    paddingBottom: space.xl,
  },
  column: {
    width: "100%",
    maxWidth: 880,
    alignSelf: "center",
    gap: space.md,
  },
  columnWide: {
    paddingTop: space.lg,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 22,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  lead: {
    color: colors.secondary,
    fontSize: 17,
    lineHeight: 24,
  },
  list: {
    gap: space.sm + 4,
    marginVertical: space.sm,
  },
  listWide: {
    flexDirection: "row",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: space.md,
    gap: space.sm,
  },
  cardWide: {
    flex: 1,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.fill,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  cardBody: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
});
