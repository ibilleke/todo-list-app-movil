import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";
import { authStyles } from "../theme/authStyles";
import { useAuth } from "../auth/AuthContext";
import AuthHero from "../components/AuthHero";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
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
      await register(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={authStyles.screen}>
      <KeyboardAvoidingView
        style={authStyles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHero />
          <View style={authStyles.sheet}>
            <Text style={authStyles.heading} testID="register-heading">Creá tu cuenta</Text>
            <Text style={authStyles.subheading}>Guardá tus tareas en este dispositivo.</Text>

            <Text style={authStyles.label}>Correo electrónico</Text>
            <View style={authStyles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
              <TextInput
                testID="register-email-input"
                style={authStyles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <Text style={authStyles.label}>Contraseña</Text>
            <View style={authStyles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
              <TextInput
                testID="register-password-input"
                style={authStyles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            <Text style={authStyles.label}>Confirmar contraseña</Text>
            <View style={authStyles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
              <TextInput
                testID="register-confirm-password-input"
                style={authStyles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repetí la contraseña"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            {error && <Text style={authStyles.error} testID="register-error-text">{error}</Text>}

            {isSubmitting ? (
              <ActivityIndicator color={colors.primary} style={authStyles.primaryButton} />
            ) : (
              <Pressable style={authStyles.primaryButton} onPress={handleSubmit} testID="register-submit-button">
                <Text style={authStyles.primaryButtonText}>Registrarme</Text>
              </Pressable>
            )}

            <Pressable onPress={() => navigation.navigate("Login")} hitSlop={8} testID="register-login-link">
              <Text style={authStyles.link}>
                ¿Ya tenés cuenta? <Text style={authStyles.linkStrong}>Ingresá</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
