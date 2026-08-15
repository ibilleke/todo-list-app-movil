import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Crypto from "expo-crypto";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Directory, File, Paths } from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
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
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>(
    undefined
  );
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!taskId) return;
    (async () => {
      const found = (await getTasks()).find((t) => t.id === taskId) ?? null;
      if (found) {
        setExistingTask(found);
        setTitle(found.title);
        setDescription(found.description ?? "");
        setCompleted(found.completed);
        setPhotoUri(found.photoUri);
        setLocation(found.location);
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
          photoUri,
          location,
        }
      : {
          id: Crypto.randomUUID(),
          title: trimmedTitle,
          description: description.trim() || undefined,
          completed,
          createdAt: new Date().toISOString(),
          source: "local",
          photoUri,
          location,
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

  const handleAddPhoto = async () => {
    let currentPermission = permission;
    if (!currentPermission?.granted) {
      currentPermission = await requestPermission();
    }
    if (!currentPermission?.granted) {
      Alert.alert(
        "Permiso de cámara denegado",
        "No se pudo acceder a la cámara. Podés guardar la tarea sin foto."
      );
      return;
    }
    setShowCamera(true);
  };

  const handleCapture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
    setShowCamera(false);
    if (!photo) return;
    setIsProcessingPhoto(true);
    try {
      const isLandscape = photo.width >= photo.height;
      const manipulated = await ImageManipulator.manipulate(photo.uri)
        .resize(isLandscape ? { width: 1080 } : { height: 1080 })
        .renderAsync();
      const saved = await manipulated.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
      const photosDir = new Directory(Paths.document, "photos");
      if (!photosDir.exists) photosDir.create();
      const savedFile = new File(saved.uri);
      await savedFile.move(photosDir);
      setPhotoUri(savedFile.uri);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleUseLocation = async () => {
    let currentPermission = locationPermission;
    if (!currentPermission?.granted) {
      currentPermission = await requestLocationPermission();
    }
    if (!currentPermission?.granted) {
      Alert.alert(
        "Permiso de ubicación denegado",
        "No se pudo acceder a la ubicación. Podés guardar la tarea sin ella."
      );
      return;
    }
    setIsFetchingLocation(true);
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } finally {
      setIsFetchingLocation(false);
    }
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

      <Text style={styles.label}>Foto</Text>
      {photoUri && <Image source={{ uri: photoUri }} style={styles.photoPreview} />}
      {isProcessingPhoto ? (
        <ActivityIndicator color={colors.primary} style={styles.photoButton} />
      ) : (
        <Pressable style={styles.photoButton} onPress={handleAddPhoto}>
          <Ionicons name="camera" size={18} color={colors.primary} />
          <Text style={styles.photoButtonText}>
            {photoUri ? "Reemplazar foto" : "Agregar foto"}
          </Text>
        </Pressable>
      )}

      <Text style={styles.label}>Ubicación</Text>
      {isFetchingLocation ? (
        <ActivityIndicator color={colors.primary} style={styles.photoButton} />
      ) : (
        <Pressable style={styles.photoButton} onPress={handleUseLocation}>
          <Ionicons
            name={location ? "checkmark-circle" : "location"}
            size={18}
            color={location ? colors.success : colors.primary}
          />
          <Text style={[styles.photoButtonText, location && styles.locationAddedText]}>
            {location ? "Ubicación agregada ✓" : "Usar ubicación actual"}
          </Text>
        </Pressable>
      )}

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

      <Modal visible={showCamera} animationType="slide">
        {showCamera && (
          <View style={styles.cameraContainer}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
            <View style={styles.cameraControls}>
              <Pressable style={styles.cameraCancelButton} onPress={() => setShowCamera(false)}>
                <Ionicons name="close" size={28} color={colors.surface} />
              </Pressable>
              <Pressable style={styles.captureButton} onPress={handleCapture}>
                <View style={styles.captureButtonInner} />
              </Pressable>
              <View style={styles.cameraCancelButton} />
            </View>
          </View>
        )}
      </Modal>
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
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  photoButtonText: {
    ...typography.body,
    color: colors.primary,
  },
  photoPreview: {
    width: "100%",
    height: 180,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  cameraCancelButton: {
    width: 44,
    height: 44,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
  },
  locationAddedText: {
    color: colors.success,
  },
});
