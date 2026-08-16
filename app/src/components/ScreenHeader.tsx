import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../theme/colors";

type Props = {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
};

export default function ScreenHeader({ title, left, right }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      {left}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.taskTitle,
    fontSize: 20,
    color: colors.surface,
    flex: 1,
  },
});
