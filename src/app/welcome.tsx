import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { Screen } from "@/components/Screen";
import { markOnboardingSeen } from "@/lib/storage";
import { colors, radius, space, usePixelFont } from "@/theme";

const STEPS = [
  {
    title: "You need the Bedrock app",
    body: "NetherNet is a server list, not the game. Join opens the official Bedrock app, which has the touch controls.",
  },
  {
    title: "Bedrock joins directly",
    body: "Add a hostname or a custom port. A plain domain uses the usual Bedrock port unless you type one.",
  },
  {
    title: "Java needs a relay you host",
    body: "The relay starts a short Geyser session, then the same Bedrock link points at it. Set the relay address in Settings before you join a Java server.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const pixel = usePixelFont();

  async function finish() {
    await markOnboardingSeen();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/");
  }

  return (
    <Screen bottomInset>
      <ScrollView contentContainerStyle={styles.content}>
        <Text maxFontSizeMultiplier={1.2} style={[styles.logo, { fontFamily: pixel }]}>
          NETHERNET
        </Text>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>
          Before you join
        </Text>
        <Text style={styles.lead}>Three things, then the server list.</Text>
        <View style={styles.list}>
          {STEPS.map((step, index) => (
            <View key={step.title} accessible accessibilityLabel={`${index + 1}. ${step.title}. ${step.body}`} style={styles.card}>
              <Text style={styles.index}>{index + 1}</Text>
              <View style={styles.copy}>
                <Text style={styles.cardTitle}>{step.title}</Text>
                <Text style={styles.cardBody}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>
        <AppButton label="Continue" onPress={() => void finish()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.md,
    paddingBottom: space.xl,
  },
  logo: {
    color: colors.accent,
    fontSize: 10,
    lineHeight: 16,
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
  card: {
    flexDirection: "row",
    gap: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: space.md,
  },
  index: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: "700",
    width: 24,
  },
  copy: {
    flex: 1,
    gap: 4,
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
