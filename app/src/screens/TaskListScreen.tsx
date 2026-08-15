import { useCallback, useState } from "react";
import { StyleSheet, View, FlatList, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, shadow, spacing } from "../theme/colors";
import { getTasks, saveTask } from "../storage/taskStorage";
import type { Task } from "../types/Task";
import TaskCard from "../components/TaskCard";

type Props = NativeStackScreenProps<RootStackParamList, "TaskList">;

const MOCK_TASKS: Task[] = [
  {
    id: "mock-1",
    title: "Comprar café",
    completed: false,
    createdAt: new Date().toISOString(),
    source: "local",
  },
  {
    id: "mock-2",
    title: "Terminar informe semanal",
    completed: false,
    createdAt: new Date().toISOString(),
    source: "local",
  },
  {
    id: "mock-3",
    title: "Llamar al dentista",
    completed: true,
    createdAt: new Date().toISOString(),
    source: "local",
  },
];

export default function TaskListScreen({ navigation }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        let stored = await getTasks();
        if (stored.length === 0) {
          for (const mock of MOCK_TASKS) {
            await saveTask(mock);
          }
          stored = await getTasks();
        }
        if (active) setTasks(stored);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const toggleComplete = async (task: Task) => {
    const updated = { ...task, completed: !task.completed };
    await saveTask(updated);
    setTasks((current) => current.map((t) => (t.id === updated.id ? updated : t)));
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => navigation.navigate("TaskForm", { taskId: item.id })}
            onToggleComplete={() => toggleComplete(item)}
          />
        )}
      />
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("TaskForm", {})}
        hitSlop={8}
      >
        <Ionicons name="add" size={28} color={colors.surface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.lg + 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
});
