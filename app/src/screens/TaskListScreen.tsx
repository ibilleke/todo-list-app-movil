import { useCallback, useLayoutEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View, FlatList, Pressable, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, shadow, spacing, typography } from "../theme/colors";
import { getTasks, saveTask } from "../storage/taskStorage";
import { fetchTodos } from "../api/jsonPlaceholder";
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
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

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

  const handleImport = async () => {
    setImportError(null);
    setIsImporting(true);
    try {
      const todos = await fetchTodos();
      const existing = await getTasks();
      const importedIds = new Set(
        existing.filter((t) => t.source === "jsonplaceholder").map((t) => t.id)
      );
      const newTasks: Task[] = todos
        .filter((todo) => !importedIds.has(`jsonplaceholder-${todo.id}`))
        .map((todo) => ({
          id: `jsonplaceholder-${todo.id}`,
          title: todo.title,
          completed: todo.completed,
          createdAt: new Date().toISOString(),
          source: "jsonplaceholder" as const,
        }));
      for (const task of newTasks) {
        await saveTask(task);
      }
      setTasks(await getTasks());
    } catch {
      setImportError("No se pudo importar. Revisá tu conexión.");
    } finally {
      setIsImporting(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isImporting ? (
          <ActivityIndicator color={colors.surface} style={styles.headerButton} />
        ) : (
          <Pressable style={styles.headerButton} onPress={handleImport} hitSlop={8}>
            <Ionicons name="cloud-download-outline" size={24} color={colors.surface} />
          </Pressable>
        ),
    });
  }, [navigation, isImporting]);

  return (
    <View style={styles.container}>
      {importError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{importError}</Text>
          <Pressable style={styles.retryButton} onPress={handleImport}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      )}
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
  headerButton: {
    marginRight: spacing.md,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    margin: spacing.md,
    marginBottom: 0,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    flex: 1,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  retryButtonText: {
    ...typography.label,
    color: colors.surface,
    fontWeight: "700",
  },
});
