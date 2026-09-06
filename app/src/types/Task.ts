// Este tipo se persiste cifrado en su totalidad (AES-256-CBC) dentro de AsyncStorage —
// ver src/storage/encryption.ts y src/storage/taskStorage.ts. El campo `photoUri` apunta
// a un archivo JPEG en el filesystem que NO se cifra (ver docs/BRIEF.md, "Cifrado de
// datos sensibles").
export type Task = {
  id: string; // uuid generado localmente
  userId: string; // dueño de la tarea (User.uid de Firebase Authentication), obligatorio
  title: string; // obligatorio
  description?: string; // opcional
  completed: boolean;
  createdAt: string; // ISO date, generada automáticamente
  photoUri?: string; // path local del archivo (filesystem, NO base64 en AsyncStorage)
  location?: {
    latitude: number;
    longitude: number;
  };
  source: "local" | "jsonplaceholder"; // distingue tareas creadas vs importadas
  syncedAt?: string; // ISO date de la última sincronización remota exitosa (POST a JSONPlaceholder)
};
