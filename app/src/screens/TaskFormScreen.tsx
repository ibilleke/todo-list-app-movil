import { StyleSheet, Text, View, Button } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "TaskForm">;

export default function TaskFormScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Formulario de tarea</Text>
      <Button title="Volver" color={colors.primary} onPress={() => navigation.goBack()} />
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
