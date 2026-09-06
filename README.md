# To Do List — App Móvil

Aplicación móvil (React Native + Expo) para registrar y visualizar tareas pendientes, con foto y ubicación GPS opcionales por tarea, login con Firebase Authentication y sincronización con una API externa.

## Stack

| Área | Decisión |
|---|---|
| Frontend | React Native + Expo Go, TypeScript |
| Expo SDK | 54 |
| Plataforma objetivo | Android |
| Código | `app/` |
| Android package | `com.ignac.todolist` |
| Backend | Ninguno propio — **Firebase Authentication** (BaaS) para usuarios/sesión; Node.js solo como tooling (Expo CLI, pnpm) |
| Persistencia | Local: `AsyncStorage` + `expo-file-system` |
| API externa | JSONPlaceholder (import + sync de tareas vía POST) |
| Gestor de paquetes | pnpm (obligatorio) |
| Testing | Jest + jest-expo (unitarios/componentes); Appium + WebdriverIO (E2E Android) |

## Funcionalidades

### Autenticación (Firebase Authentication)
- Registro y login con correo + contraseña vía **Firebase Authentication** — sin contraseñas ni tabla de usuarios en el dispositivo.
- La sesión persiste entre reinicios (`onAuthStateChanged` + persistencia de Firebase sobre `AsyncStorage`) hasta cerrar sesión explícitamente.
- Cada tarea pertenece a su usuario (`Task.userId` = `uid` de Firebase).
- Setup del proyecto de Firebase: ver sección "Configuración de Firebase" más abajo.

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
- Jest + jest-expo, con mocks de `expo-camera`, `expo-location` y `firebase/auth`.
- Cobertura de: captura de imágenes, obtención de ubicación GPS, guardado sin permisos, eliminación de tareas, storage/tareas, flujo de autenticación (Firebase Auth mockeado), integración con JSONPlaceholder.
- E2E con Appium + WebdriverIO sobre APK Android real (UIAutomator2): smoke test de Login, navegación Login↔Register y validación de contraseñas de Register. Setup completo, prerrequisitos (Android SDK, emulador) y cómo correrlas: `docs/APPIUM.md`.
- Evidencia manual de permisos (cámara y GPS) en emulador Android: documentada en `INFORME_PROYECTO.docx` (Escritorio).

## Modelo de datos

```ts
type User = {
  uid: string;              // uid de Firebase Authentication
  email: string;
  createdAt: string;        // ISO date (metadata.creationTime de Firebase)
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
├── docs/                      # Brief, diseño, plan y setup de Appium
│   ├── BRIEF.md
│   ├── DESIGN.md
│   ├── PLAN.md
│   └── APPIUM.md
└── app/                       # Código fuente Expo/React Native
    ├── App.tsx                # Entry point, providers y stack raíz
    ├── index.ts
    ├── .env.example           # Plantilla de credenciales de Firebase (copiar a .env)
    ├── src/
    │   ├── api/                 # Cliente JSONPlaceholder
    │   ├── auth/                # AuthContext (sesión de Firebase)
    │   ├── components/          # AuthHero, ScreenHeader, TaskCard
    │   ├── firebase/             # firebaseConfig.ts (init + persistencia)
    │   ├── navigation/           # Tipos de navegación
    │   ├── screens/              # Login, Register, TaskList, TaskForm
    │   ├── storage/              # authStorage (Firebase Auth), taskStorage (AsyncStorage)
    │   ├── theme/                # Colores y estilos
    │   └── types/                # Task, User
    ├── __tests__/               # Tests Jest (unitarios/componentes)
    └── e2e/                     # Tests Appium + WebdriverIO (E2E Android)
        ├── wdio.conf.ts
        └── specs/
```

## Requisitos previos

- Node.js
- pnpm (`npm i -g pnpm`)
- Expo Go instalada en un dispositivo Android (o emulador Android)
- Una cuenta de Google para crear un proyecto de Firebase (gratis, ver sección siguiente)

## Configuración de Firebase

La app usa **Firebase Authentication** (correo + contraseña) vía el SDK JS de Firebase (`firebase`), compatible con Expo Go — no hace falta un *development build* ni `@react-native-firebase/*`. Cada integrante del equipo usa su propio proyecto de Firebase; las credenciales nunca se suben al repo.

1. Entrá a la [consola de Firebase](https://console.firebase.google.com/) y creá un proyecto (o reutilizá uno existente).
2. En **Authentication → Sign-in method**, habilitá el proveedor **Correo electrónico/contraseña**.
3. En **Configuración del proyecto → Tus apps**, agregá una app **Web** (ícono `</>`) — no hace falta registrar Android/iOS nativo, el SDK JS alcanza.
4. Copiá los valores del objeto `firebaseConfig` que te muestra la consola.
5. Copiá `app/.env.example` a `app/.env` y pegá ahí tus valores (`EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, etc.). `app/.env` está en `.gitignore`: nunca se versiona.

## Instalación y ejecución

```bash
cd app
pnpm install
pnpm start        # abre Metro / Expo Dev Tools, escanear QR con Expo Go
pnpm android       # abre directo en emulador/dispositivo Android
```

## Testing

Unitarios/componentes (Jest):

```bash
cd app
pnpm test
```

E2E (Appium + WebdriverIO, requiere Android SDK + emulador/dispositivo — ver `docs/APPIUM.md`):

```bash
cd app
pnpm e2e:prebuild && cd android && ./gradlew assembleDebug && cd ..
pnpm e2e
```

## Diseño

Dirección visual moderna y amigable: violeta (`#7C3AED`) + coral (`#FF6B6B`) sobre fondo crema cálido (`#FFFBF5`), bordes redondeados y espaciado generoso. Detalle completo de paleta, componentes y flujos en `docs/DESIGN.md`.

## Roadmap

- Migración de tareas a **Firebase Firestore** como backend remoto real (reemplaza JSONPlaceholder, persiste escrituras) y habilita sincronización multi-dispositivo real.
- Sincronización en tiempo real entre dispositivos, una vez migrado a Firestore.
- Proveedores adicionales de Firebase Authentication (Google, Apple) además de correo/contraseña.

## Capturas de pantalla

Evidencia visual generada en emulador Android (Pixel 7, API 34). Imágenes completas en `C:/tmp/imagenes proyecto/`. **Nota**: las capturas de Login/Registro son previas a la migración a Firebase Authentication — el campo "Usuario" de esas imágenes hoy es "Correo electrónico".

| Pantalla | Captura |
|---|---|
| Login | ![Login](C:/tmp/imagenes%20proyecto/01_login.png) |
| Registro | ![Registro](C:/tmp/imagenes%20proyecto/02_registro.png) |
| Lista de tareas vacía | ![Lista vacía](C:/tmp/imagenes%20proyecto/03_lista_tareas_vacia.png) |
| Nueva tarea (formulario) | ![Formulario nueva tarea](C:/tmp/imagenes%20proyecto/04_nueva_tarea_form.png) |
| Nueva tarea completada | ![Nueva tarea completada](C:/tmp/imagenes%20proyecto/05_nueva_tarea_completada.png) |
| Lista con tarea creada | ![Lista con tarea](C:/tmp/imagenes%20proyecto/06_lista_con_tarea.png) |
| Lista importada desde JSONPlaceholder | ![Lista importada](C:/tmp/imagenes%20proyecto/07_lista_importada.png) |
| Editar / eliminar tarea | ![Editar tarea](C:/tmp/imagenes%20proyecto/08_editar_tarea.png) |
| Login con credenciales incorrectas | ![Login error](C:/tmp/imagenes%20proyecto/09_login_error.png) |
| Ícono de la app (task switcher) | ![Ícono app](C:/tmp/imagenes%20proyecto/10_icono_app.png) |

## Documentación adicional

- `docs/BRIEF.md` — alcance, stack y modelo de datos completo.
- `docs/DESIGN.md` — UI/UX, paleta, componentes, flujos de auth y permisos.
- `docs/PLAN.md` — plan de implementación.
- `INFORME_PROYECTO.docx` (Escritorio, fuera del repo) — informe completo del proyecto, incluye evidencia de permisos cámara/ubicación.
</content>
