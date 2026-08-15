export type Task = {
  id: string; // uuid generado localmente
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
};
