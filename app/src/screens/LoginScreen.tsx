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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Usuario o contraseña incorrectos");
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
            <Text style={authStyles.heading}>Bienvenido de nuevo</Text>
            <Text style={authStyles.subheading}>Ingresá para ver tus tareas.</Text>

            <Text style={authStyles.label}>Usuario</Text>
            <View style={authStyles.inputRow}>
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={authStyles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Usuario"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={authStyles.label}>Contraseña</Text>
            <View style={authStyles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={authStyles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            {error && <Text style={authStyles.error}>{error}</Text>}

            {isSubmitting ? (
              <ActivityIndicator color={colors.primary} style={authStyles.primaryButton} />
            ) : (
              <Pressable style={authStyles.primaryButton} onPress={handleSubmit}>
                <Text style={authStyles.primaryButtonText}>Ingresar</Text>
              </Pressable>
            )}

            <Pressable onPress={() => navigation.navigate("Register")} hitSlop={8}>
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
