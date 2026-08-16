import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View, FlatList, Pressable, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, shadow, spacing, typography } from "../theme/colors";
import { getTasks, saveTask } from "../storage/taskStorage";
import { fetchTodos, syncTask } from "../api/jsonPlaceholder";
import type { Task } from "../types/Task";
import TaskCard from "../components/TaskCard";
import ScreenHeader from "../components/ScreenHeader";
import { useAuth } from "../auth/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "TaskList">;

export default function TaskListScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const userId = user!.id; // TaskListScreen solo se monta dentro de MainNavigator (ver App.tsx), user siempre existe
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const stored = await getTasks(userId);
        if (active) {
          setTasks(stored);
          setIsLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [userId])
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
      const existing = await getTasks(userId);
      const importedIds = new Set(
        existing.filter((t) => t.source === "jsonplaceholder").map((t) => t.id)
      );
      const newTasks: Task[] = todos
        .filter((todo) => !importedIds.has(`${userId}:jsonplaceholder-${todo.id}`))
        .map((todo) => ({
          id: `${userId}:jsonplaceholder-${todo.id}`,
          userId,
          title: todo.title,
          completed: todo.completed,
          createdAt: new Date().toISOString(),
          source: "jsonplaceholder" as const,
        }));
      for (const task of newTasks) {
        await saveTask(task);
      }
      setTasks(await getTasks(userId));
    } catch {
      setImportError("No se pudo importar. Revisá tu conexión.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleSync = async () => {
    setSyncError(null);
    setIsSyncing(true);
    try {
      const current = await getTasks(userId);
      const pending = current.filter((t) => t.source === "local" && !t.syncedAt);
      for (const task of pending) {
        await syncTask(task);
        await saveTask({ ...task, syncedAt: new Date().toISOString() });
      }
      setTasks(await getTasks(userId));
    } catch {
      setSyncError("No se pudo sincronizar. Revisá tu conexión.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Mis tareas"
        right={
          <View style={styles.headerButtonRow}>
            {isSyncing ? (
              <ActivityIndicator color={colors.surface} style={styles.headerButton} />
            ) : (
              <Pressable style={styles.headerButton} onPress={handleSync} hitSlop={8}>
                <Ionicons name="cloud-upload-outline" size={24} color={colors.surface} />
              </Pressable>
            )}
            {isImporting ? (
              <ActivityIndicator color={colors.surface} style={styles.headerButton} />
            ) : (
              <Pressable style={styles.headerButton} onPress={handleImport} hitSlop={8}>
                <Ionicons name="cloud-download-outline" size={24} color={colors.surface} />
              </Pressable>
            )}
            <Pressable style={styles.headerButton} onPress={logout} hitSlop={8}>
              <Ionicons name="log-out-outline" size={24} color={colors.surface} />
            </Pressable>
          </View>
        }
      />
      {importError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{importError}</Text>
          <Pressable style={styles.retryButton} onPress={handleImport}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      )}
      {syncError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{syncError}</Text>
          <Pressable style={styles.retryButton} onPress={handleSync}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      )}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No tenés tareas todavía</Text>
          <Pressable
            style={styles.emptyPrimaryButton}
            onPress={() => navigation.navigate("TaskForm", {})}
          >
            <Text style={styles.emptyPrimaryButtonText}>Crear tu primera tarea</Text>
          </Pressable>
          <Pressable style={styles.emptySecondaryButton} onPress={handleImport}>
            <Text style={styles.emptySecondaryButtonText}>Importar tareas</Text>
          </Pressable>
        </View>
      ) : (
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
      )}
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
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.taskTitle,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptyPrimaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  emptyPrimaryButtonText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.surface,
  },
  emptySecondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  emptySecondaryButtonText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.primary,
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
  headerButtonRow: {
    flexDirection: "row",
    alignItems: "center",
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
