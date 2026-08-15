import { useCallback, useState } from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme/colors";
import { getTasks, saveTask } from "../storage/taskStorage";
import type { Task } from "../types/Task";

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

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Text
            style={item.completed ? styles.itemCompleted : styles.item}
            onPress={() => navigation.navigate("TaskForm", { taskId: item.id })}
          >
            {item.title}
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  item: {
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  itemCompleted: {
    ...typography.body,
    color: colors.completed,
    textDecorationLine: "line-through",
    paddingVertical: spacing.sm,
  },
});
