import * as Haptics from "expo-haptics";

export function tap(kind: "light" | "medium" | "success" = "light"): void {
  const run =
    kind === "success"
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(
          kind === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
        );
  void run.catch(() => undefined);
}
