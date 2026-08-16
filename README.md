# To Do List — App Móvil

Aplicación móvil (React Native + Expo) para registrar y visualizar tareas pendientes, con foto y ubicación GPS opcionales por tarea, login local y sincronización con una API externa.

## Stack

| Área | Decisión |
|---|---|
| Frontend | React Native + Expo Go, TypeScript |
| Expo SDK | 54 |
| Plataforma objetivo | Android |
| Código | `app/` |
| Android package | `com.ignac.todolist` |
| Backend | Ninguno — Node.js solo como tooling (Expo CLI, pnpm) |
| Persistencia | Local: `AsyncStorage` + `expo-file-system` |
| API externa | JSONPlaceholder (import + sync de tareas vía POST) |
| Gestor de paquetes | pnpm (obligatorio) |
| Testing | Jest + jest-expo |

## Funcionalidades

### Autenticación local
- Registro y login sin backend propio. Usuario único (case-insensitive) + contraseña hasheada con SHA-256 (`expo-crypto`).
- Sesión (`currentUserId`) persiste en `AsyncStorage` entre reinicios hasta cerrar sesión.
- Soporta múltiples cuentas en el mismo dispositivo; cada tarea pertenece a su usuario (`Task.userId`).

### Tareas
- CRUD de tareas: título (obligatorio), descripción, foto, ubicación, estado completada.
- Foto opcional vía `expo-camera`, redimensionada/comprimida con `expo-image-manipulator` (máx. 1080px, calidad 70%) y guardada en el filesystem del dispositivo (`expo-file-system`); solo se persiste el path/URI en `AsyncStorage`, nunca el binario.
- Ubicación opcional vía `expo-location` (GPS).
- Permisos de cámara/ubicación pedidos de forma **lazy** (solo al usarlos, nunca al abrir la app); si el usuario rechaza, la tarea se guarda igual sin ese dato.

### Integración con API externa
- Importa tareas iniciales desde `jsonplaceholder.typicode.com/todos`.
- Sincroniza tareas locales hacia JSONPlaceholder vía `POST /todos`; cada tarea sincronizada exitosamente (`201`) queda marcada con `syncedAt`.
- JSONPlaceholder no persiste escrituras server-side, por lo que la fuente de verdad real es siempre el almacenamiento local (`AsyncStorage`).

### Pruebas automatizadas
- Jest + jest-expo, con mocks de `expo-camera` y `expo-location`.
- Cobertura de: captura de imágenes, obtención de ubicación GPS, storage de autenticación, integración con JSONPlaceholder.

## Modelo de datos

```ts
type User = {
  id: string;
  username: string;
  passwordHash: string;    // SHA-256, nunca texto plano
  createdAt: string;
};

type Task = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  photoUri?: string;
  location?: { latitude: number; longitude: number };
  source: "local" | "jsonplaceholder";
  syncedAt?: string;
};
```

## Pantallas y navegación

React Navigation (Stack). Montaje condicional según haya sesión activa:

```
AuthStack (sin sesión)
├── LoginScreen
└── RegisterScreen

MainStack (con sesión)
├── TaskListScreen   — lista de tareas del usuario, importar/sincronizar, cerrar sesión
└── TaskFormScreen   — crear / editar / ver tarea (foto, ubicación, completada)
```

## Estructura del proyecto

```
Examen2AppMovil/
├── docs/                      # Brief, diseño y plan del proyecto
│   ├── BRIEF.md
│   ├── DESIGN.md
│   └── PLAN.md
└── app/                       # Código fuente Expo/React Native
    ├── App.tsx                # Entry point, providers y stack raíz
    ├── index.ts
    ├── src/
    │   ├── api/                 # Cliente JSONPlaceholder
    │   ├── auth/                # AuthContext (sesión)
    │   ├── components/          # AuthHero, ScreenHeader, TaskCard
    │   ├── navigation/           # Tipos de navegación
    │   ├── screens/              # Login, Register, TaskList, TaskForm
    │   ├── storage/              # authStorage, taskStorage (AsyncStorage)
    │   ├── theme/                # Colores y estilos
    │   └── types/                # Task, User
    └── __tests__/               # Tests Jest
```

## Requisitos previos

- Node.js
- pnpm (`npm i -g pnpm`)
- Expo Go instalada en un dispositivo Android (o emulador Android)

## Instalación y ejecución

```bash
cd app
pnpm install
pnpm start        # abre Metro / Expo Dev Tools, escanear QR con Expo Go
pnpm android       # abre directo en emulador/dispositivo Android
```

## Testing

```bash
cd app
pnpm test
```

## Diseño

Dirección visual moderna y amigable: violeta (`#7C3AED`) + coral (`#FF6B6B`) sobre fondo crema cálido (`#FFFBF5`), bordes redondeados y espaciado generoso. Detalle completo de paleta, componentes y flujos en `docs/DESIGN.md`.

## Roadmap

- Migración a **Firebase Firestore** como backend remoto real (reemplaza JSONPlaceholder, persiste escrituras).
- Migración de auth local a **Firebase Authentication** con sincronización multi-dispositivo.
- Sincronización en tiempo real entre dispositivos.

## Documentación adicional

- `docs/BRIEF.md` — alcance, stack y modelo de datos completo.
- `docs/DESIGN.md` — UI/UX, paleta, componentes, flujos de auth y permisos.
- `docs/PLAN.md` — plan de implementación.
</content>
