import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme/colors";
import { useAuth } from "../auth/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setIsSubmitting(true);
    try {
      await register(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Crear cuenta</Text>

      <Text style={styles.label}>Usuario</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Usuario"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Mínimo 4 caracteres"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
      />

      <Text style={styles.label}>Confirmar contraseña</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Repetí la contraseña"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
      />

      {error && <Text style={styles.error}>{error}</Text>}

      {isSubmitting ? (
        <ActivityIndicator color={colors.primary} style={styles.primaryButton} />
      ) : (
        <Pressable style={styles.primaryButton} onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>Registrarme</Text>
        </Pressable>
      )}

      <Pressable onPress={() => navigation.navigate("Login")} hitSlop={8}>
        <Text style={styles.link}>Ya tengo cuenta</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.taskTitle,
    fontSize: 28,
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.xl,
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
  error: {
    ...typography.body,
    color: colors.error,
    marginTop: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  primaryButtonText: {
    ...typography.taskTitle,
    color: colors.surface,
  },
  link: {
    ...typography.body,
    color: colors.primary,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
