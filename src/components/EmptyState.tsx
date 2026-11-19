import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, space } from "@/theme";
import { AppButton } from "./AppButton";

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={28} color={colors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {action ? (
        <View style={styles.action}>
          <AppButton label={action.label} onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    gap: space.sm,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.fill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.xs,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  body: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  action: {
    marginTop: space.sm,
    alignSelf: "stretch",
  },
  section: {
    color: colors.tertiary,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: space.sm,
    marginBottom: space.sm,
  },
});
