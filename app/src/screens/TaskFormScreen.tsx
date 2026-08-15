import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View, Pressable } from "react-native";
import * as Crypto from "expo-crypto";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme/colors";
import { deleteTask, getTasks, saveTask } from "../storage/taskStorage";
import type { Task } from "../types/Task";

type Props = NativeStackScreenProps<RootStackParamList, "TaskForm">;

export default function TaskFormScreen({ navigation, route }: Props) {
  const taskId = route.params?.taskId;
  const [existingTask, setExistingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    (async () => {
      const found = (await getTasks()).find((t) => t.id === taskId) ?? null;
      if (found) {
        setExistingTask(found);
        setTitle(found.title);
        setDescription(found.description ?? "");
        setCompleted(found.completed);
      }
    })();
  }, [taskId]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert("Falta el título", "El título es obligatorio para guardar la tarea.");
      return;
    }
    const task: Task = existingTask
      ? {
          ...existingTask,
          title: trimmedTitle,
          description: description.trim() || undefined,
          completed,
        }
      : {
          id: Crypto.randomUUID(),
          title: trimmedTitle,
          description: description.trim() || undefined,
          completed,
          createdAt: new Date().toISOString(),
          source: "local",
        };
    await saveTask(task);
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!existingTask) return;
    Alert.alert("Eliminar tarea", "¿Seguro que querés eliminar esta tarea?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteTask(existingTask.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="¿Qué tenés que hacer?"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Detalles opcionales"
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={4}
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Completada</Text>
        <Switch
          value={completed}
          onValueChange={setCompleted}
          trackColor={{ true: colors.primary }}
        />
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Guardar</Text>
      </Pressable>

      {existingTask && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.textPrimary,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  saveButtonText: {
    ...typography.taskTitle,
    color: colors.surface,
  },
  deleteButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  deleteButtonText: {
    ...typography.taskTitle,
    color: colors.surface,
  },
});
