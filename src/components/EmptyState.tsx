import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, space } from "@/theme";
import { AppButton } from "./AppButton";
import { PixelLabel } from "./hud/PixelLabel";
import { PixelSprite, type SpriteMap } from "./hud/PixelSprite";

export function EmptyState({
  sprite,
  title,
  body,
  action,
}: {
  sprite: SpriteMap;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.slot}>
        <PixelSprite sprite={sprite} pixel={4} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.body}>{body}</Text>
      {action ? (
        <View style={styles.action}>
          <AppButton label={action.label} onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

export function SectionTitle({ children, trailing }: { children: string; trailing?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <PixelLabel size={8} color={colors.tertiary}>
        {children.toUpperCase()}
      </PixelLabel>
      <View style={styles.rule} />
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    gap: space.sm,
  },
  slot: {
    width: 76,
    height: 76,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 2,
    borderColor: colors.strokeStrong,
    marginBottom: space.sm,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  body: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 320,
  },
  action: {
    marginTop: space.md,
    alignSelf: "stretch",
    maxWidth: 360,
    width: "100%",
    alignItems: "stretch",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm + space.xs,
    marginTop: space.sm,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.stroke,
  },
});
