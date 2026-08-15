import { Image, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Task } from "../types/Task";
import { colors, radius, shadow, spacing, typography } from "../theme/colors";

type Props = {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
};

export default function TaskCard({ task, onPress, onToggleComplete }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Pressable style={styles.checkbox} onPress={onToggleComplete} hitSlop={8}>
        <Ionicons
          name={task.completed ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={task.completed ? colors.success : colors.textSecondary}
        />
      </Pressable>
      {task.photoUri && <Image source={{ uri: task.photoUri }} style={styles.thumbnail} />}
      <Text style={task.completed ? styles.titleCompleted : styles.title} numberOfLines={1}>
        {task.title}
      </Text>
      {task.location && <Ionicons name="location" size={18} color={colors.textSecondary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  checkbox: {
    padding: spacing.xs,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
  },
  title: {
    ...typography.taskTitle,
    color: colors.textPrimary,
    flex: 1,
  },
  titleCompleted: {
    ...typography.taskTitle,
    color: colors.completed,
    textDecorationLine: "line-through",
    flex: 1,
  },
});
