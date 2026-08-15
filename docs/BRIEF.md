# Proyecto: To Do List

Aplicación móvil para registrar y visualizar una lista de tareas pendientes, con foto y ubicación opcionales por tarea.

## Resumen del stack

| Área | Decisión |
|---|---|
| Frontend | React Native + Expo Go, TypeScript |
| Expo SDK | 54 (fijo) |
| Plataforma objetivo | Android |
| Ubicación del código | `app/` (carpeta separada de `docs/`) |
| Android package | `com.ignac.todolist` |
| Backend | Ninguno — Node.js es solo tooling de desarrollo (Expo CLI, pnpm) |
| Persistencia | Local, `AsyncStorage` + `expo-file-system` (sin backend remoto por ahora) |
| API externa | JSONPlaceholder (importación + sincronización de tareas locales vía POST) |
| Testing | Jest + jest-expo |
| Roadmap | Migración a Firebase Firestore para sync remota real |

---

## Alcance del proyecto

### 1. Interacción con periféricos (cámara y GPS)
- Capturar imágenes con la cámara y adjuntarlas a una tarea — campo opcional (`photoUri`).
- Registrar la ubicación (GPS) donde se crea la tarea — campo opcional (`location`).
- **Permisos**: solicitud *lazy*, recién al tocar "agregar foto" / "usar ubicación" (nunca al abrir la app).
- Si el usuario rechaza el permiso en el momento, se cancela solo esa acción puntual — la tarea se crea igual, sin ese dato. Ningún permiso bloquea el flujo.

### 2. Integración con servicios web y APIs
- Importar tareas desde **JSONPlaceholder** (`jsonplaceholder.typicode.com/todos`) para poblar la lista inicial.
- Sincronizar tareas locales hacia **JSONPlaceholder** vía `POST /todos` — botón "Sincronizar" en el header, marca cada tarea con `syncedAt` al recibir `201`.
- ⚠️ JSONPlaceholder no persiste escrituras (POST/PUT/DELETE no se guardan server-side) → la sincronización demuestra la integración (llamada real, respuesta `201`), pero no sirve como almacenamiento remoto real.
- Por eso, toda tarea creada o editada (incluyendo foto/GPS) se guarda **localmente** en el dispositivo (`AsyncStorage`) como fuente de verdad — obligatorio, no opcional.
- Migración futura a **Firebase Firestore** para sincronización remota real y persistente — ver Roadmap.

### 3. Pruebas automatizadas
- Framework: **Jest** + preset **jest-expo**, mockeando `expo-camera` y `expo-location`.
- Cobertura mínima requerida: captura de imágenes y obtención de ubicación (GPS).
- Objetivo: asegurar fiabilidad de ambos componentes de hardware.

---

## Modelo de datos

```ts
type Task = {
  id: string;             // uuid generado localmente
  title: string;          // obligatorio
  description?: string;   // opcional
  completed: boolean;
  createdAt: string;      // ISO date, generada automáticamente
  photoUri?: string;      // path local del archivo (filesystem, NO base64 en AsyncStorage)
  location?: {
    latitude: number;
    longitude: number;
  };
  source: "local" | "jsonplaceholder"; // distingue tareas creadas vs importadas
  syncedAt?: string;      // ISO date de la última sincronización remota exitosa
};
```

---

## Tecnologías

**Core**
- React Native + Expo Go — **Expo SDK 54**
- TypeScript
- Node.js — solo herramientas de desarrollo (Expo CLI, pnpm), sin backend propio
- **Gestor de paquetes: pnpm** (obligatorio, no usar npm/yarn)

**Periféricos**
- `expo-camera` — captura de fotos
- `expo-location` — obtención de GPS

**UI y utilidades**
- `expo-crypto` — generación de `id` único por tarea (`randomUUID()`)
- `@expo/vector-icons` — íconos (ubicación, estado vacío), bundled con Expo

**Archivos e imágenes**
- `expo-file-system` — guardado de fotos en el dispositivo
- `expo-image-manipulator` — resize/compresión (máx. 1080px lado mayor, calidad 70%)

**Datos**
- `@react-native-async-storage/async-storage` — persistencia local (solo paths/URIs, no binarios)
- JSONPlaceholder — API externa de importación

**Testing**
- Jest + jest-expo

---

## Roadmap (fuera del alcance actual)

- **Firebase Firestore**: reemplaza a JSONPlaceholder como backend remoto real — persiste escrituras y habilita sincronización.
- **Autenticación de usuarios**: login básico para proteger tareas y soportar múltiples usuarios.
- **Sincronización en tiempo real** entre dispositivos, una vez migrado a Firestore.
