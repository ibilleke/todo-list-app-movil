import { useEffect, useMemo } from "react";
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../theme/colors";

type Chip = {
  label: string;
  done: boolean;
  top: number;
  left?: number;
  right?: number;
  rotate: string;
};

const CHIPS: Chip[] = [
  { label: "Comprar pan", done: true, top: 4, left: 20, rotate: "-6deg" },
  { label: "Diseñar login", done: false, top: 58, right: 12, rotate: "5deg" },
  { label: "Llamar a mamá", done: false, top: 122, left: 52, rotate: "-3deg" },
];

export default function AuthHero() {
  const insets = useSafeAreaInsets();
  const animations = useMemo(() => CHIPS.map(() => new Animated.Value(0)), []);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (reduceMotion) {
        animations.forEach((value) => value.setValue(1));
        return;
      }
      Animated.stagger(
        110,
        animations.map((value) =>
          Animated.spring(value, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 })
        )
      ).start();
    });
    return () => {
      cancelled = true;
    };
  }, [animations]);

  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.ring} pointerEvents="none" />
      <View style={styles.chipLayer} pointerEvents="none">
        {CHIPS.map((chip, index) => {
          const anim = animations[index];
          return (
            <Animated.View
              key={chip.label}
              style={[
                styles.chip,
                {
                  top: chip.top,
                  left: chip.left,
                  right: chip.right,
                  opacity: anim,
                  transform: [
                    { rotate: chip.rotate },
                    {
                      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
                    },
                    { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                  ],
                },
              ]}
            >
              <Ionicons
                name={chip.done ? "checkmark-circle" : "ellipse-outline"}
                size={16}
                color={chip.done ? colors.success : colors.textSecondary}
              />
              <Text style={[styles.chipText, chip.done && styles.chipTextDone]} numberOfLines={1}>
                {chip.label}
              </Text>
            </Animated.View>
          );
        })}
      </View>
      <View style={styles.wordmarkBlock}>
        <Text style={styles.wordmark}>To Do List</Text>
        <Text style={styles.tagline}>Tus pendientes, en un solo lugar.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + spacing.md,
    overflow: "hidden",
  },
  ring: {
    position: "absolute",
    top: -60,
    right: -70,
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 18,
    borderColor: `${colors.surface}1F`,
  },
  chipLayer: {
    height: 172,
  },
  chip: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    maxWidth: 190,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  chipText: {
    ...typography.label,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  chipTextDone: {
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  wordmarkBlock: {
    marginTop: spacing.sm,
  },
  wordmark: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.surface,
  },
  tagline: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "500",
    color: `${colors.surface}D9`,
  },
});
