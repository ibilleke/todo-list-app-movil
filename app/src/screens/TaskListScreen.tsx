import { StyleSheet, Text, View, Button } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "TaskList">;

export default function TaskListScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tus tareas</Text>
      <Button
        title="Ir a crear tarea"
        color={colors.primary}
        onPress={() => navigation.navigate("TaskForm", {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  title: {
    ...typography.taskTitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
});
