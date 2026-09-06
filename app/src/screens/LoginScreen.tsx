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

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Correo o contraseña incorrectos");
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
            <Text style={authStyles.heading} testID="login-heading">Bienvenido de nuevo</Text>
            <Text style={authStyles.subheading}>Ingresá para ver tus tareas.</Text>

            <Text style={authStyles.label}>Correo electrónico</Text>
            <View style={authStyles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
              <TextInput
                testID="login-email-input"
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
                testID="login-password-input"
                style={authStyles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            {error && <Text style={authStyles.error} testID="login-error-text">{error}</Text>}

            {isSubmitting ? (
              <ActivityIndicator color={colors.primary} style={authStyles.primaryButton} />
            ) : (
              <Pressable style={authStyles.primaryButton} onPress={handleSubmit} testID="login-submit-button">
                <Text style={authStyles.primaryButtonText}>Ingresar</Text>
              </Pressable>
            )}

            <Pressable onPress={() => navigation.navigate("Register")} hitSlop={8} testID="login-register-link">
              <Text style={authStyles.link}>
                ¿No tenés cuenta? <Text style={authStyles.linkStrong}>Creá una</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
