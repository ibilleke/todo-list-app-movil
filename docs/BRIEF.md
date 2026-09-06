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
| Backend | Ninguno propio — **Firebase Authentication** (BaaS) para usuarios/sesión; Node.js es solo tooling de desarrollo (Expo CLI, pnpm) |
| Persistencia de tareas | Local, `AsyncStorage` + `expo-file-system` (sin backend remoto por ahora) |
| Autenticación | **Firebase Authentication** (email + contraseña), vía SDK JS (`firebase`), compatible con Expo Go |
| API externa | JSONPlaceholder (importación + sincronización de tareas locales vía POST) |
| Testing | Jest + jest-expo |
| Roadmap | Migración a Firebase Firestore para sync remota real de tareas |

---

## Alcance del proyecto

### 1. Interacción con periféricos (cámara y GPS)
- Capturar imágenes con la cámara y adjuntarlas a una tarea — campo opcional (`photoUri`).
- Registrar la ubicación (GPS) donde se crea la tarea — campo opcional (`location`).
- **Permisos**: solicitud *lazy*, recién al tocar "agregar foto" / "usar ubicación" (nunca al abrir la app).
- Si el usuario rechaza el permiso en el momento, se cancela solo esa acción puntual — la tarea se crea igual, sin ese dato. Ningún permiso bloquea el flujo.

### 2. Autenticación de usuarios
- Login y registro con **Firebase Authentication** (proveedor Correo/contraseña) — no hay tabla de usuarios propia ni contraseñas en el dispositivo.
- Alta de cuenta: correo + contraseña (mínimo 6 caracteres, requisito de Firebase). Firebase valida formato de correo, contraseña débil y correo duplicado; la app traduce esos errores a mensajes en español.
- `LoginScreen` es la pantalla inicial si no hay sesión activa; `onAuthStateChanged` restaura la sesión automáticamente al abrir la app (persistencia en `AsyncStorage` configurada en el SDK de Firebase) hasta cerrar sesión explícitamente (`signOut`).
- Cada tarea pertenece a un usuario (`Task.userId`, ahora el `uid` que entrega Firebase) — la lista de tareas se filtra por el usuario en sesión; tareas importadas de JSONPlaceholder también quedan asociadas al usuario que las importó.
- Multi-usuario real: cada cuenta vive en el proyecto de Firebase (no en el dispositivo), por lo que la sesión **sí** podría sincronizarse entre dispositivos a futuro (login con el mismo correo desde otro teléfono) — las tareas en sí siguen siendo locales por dispositivo hasta migrar a Firestore (ver Roadmap).

**¿Por qué Firebase Authentication y no Auth0?**
- **Compatibilidad con Expo Go**: el SDK JS de Firebase es JavaScript puro (sin módulos nativos), funciona en el flujo managed de Expo Go tal como venía el proyecto. El SDK oficial de Auth0 para React Native (`react-native-auth0`) requiere linking nativo — obligaría a un *development build* o eyectar, rompiendo el flujo de trabajo actual (Fase 0 del `PLAN.md`).
- **Un solo proveedor para todo el backend futuro**: el Roadmap ya preveía migrar las tareas a **Firebase Firestore**. Usar Firebase Authentication comparte el mismo proyecto/consola y permite que las reglas de seguridad de Firestore usen `request.auth.uid` de forma nativa, sin intercambiar tokens entre dos proveedores distintos.
- **Alcance del proyecto**: Auth0 apunta a escenarios enterprise/SSO (SAML, federación con proveedores corporativos) que exceden un login simple de correo/contraseña para una sola app.

### 3. Integración con servicios web y APIs
- Importar tareas desde **JSONPlaceholder** (`jsonplaceholder.typicode.com/todos`) para poblar la lista inicial.
- Sincronizar tareas locales hacia **JSONPlaceholder** vía `POST /todos` — botón "Sincronizar" en el header, marca cada tarea con `syncedAt` al recibir `201`.
- ⚠️ JSONPlaceholder no persiste escrituras (POST/PUT/DELETE no se guardan server-side) → la sincronización demuestra la integración (llamada real, respuesta `201`), pero no sirve como almacenamiento remoto real.
- Por eso, toda tarea creada o editada (incluyendo foto/GPS) se guarda **localmente** en el dispositivo (`AsyncStorage`) como fuente de verdad — obligatorio, no opcional.
- Migración futura a **Firebase Firestore** para sincronización remota real y persistente — ver Roadmap.

### 4. Pruebas automatizadas
- Framework: **Jest** + preset **jest-expo**, mockeando `expo-camera` y `expo-location`.
- Cobertura mínima requerida: captura de imágenes y obtención de ubicación (GPS).
- Objetivo: asegurar fiabilidad de ambos componentes de hardware.
- Flujo de autenticación: tests de `authStorage.ts` (mockeando `firebase/auth`) y `AuthContext.tsx` (mockeando `authStorage.ts`) cubriendo alta de usuario, rechazo de correo duplicado/contraseña débil, login inválido y restauración de sesión.

---

## Modelo de datos

```ts
type User = {
  uid: string;             // uid de Firebase Authentication
  email: string;           // correo con el que se registró/inició sesión
  createdAt: string;       // ISO date, provista por Firebase (metadata.creationTime)
};

type Task = {
  id: string;              // uuid generado localmente
  userId: string;          // dueño de la tarea (User.uid de Firebase Authentication), obligatorio
  title: string;           // obligatorio
  description?: string;    // opcional
  completed: boolean;
  createdAt: string;       // ISO date, generada automáticamente
  photoUri?: string;       // path local del archivo (filesystem, NO base64 en AsyncStorage)
  location?: {
    latitude: number;
    longitude: number;
  };
  source: "local" | "jsonplaceholder"; // distingue tareas creadas vs importadas
  syncedAt?: string;       // ISO date de la última sincronización remota exitosa
};
```

Firebase Authentication guarda usuarios y sesión (no `AsyncStorage`); `AsyncStorage` solo persiste el token de sesión que administra internamente el SDK de Firebase (`getReactNativePersistence`) y las tareas (`Task[]`).

---

## Cifrado de datos sensibles

Las tareas se guardan **cifradas en reposo** (*at rest*) en `AsyncStorage`. Las fotos quedan **fuera de alcance** (ver justificación abajo).

**Qué se cifra**
- El blob completo de tareas (`Task[]`, incluye título, descripción y ubicación) bajo la clave `@todolist/tasks` de `AsyncStorage`. `taskStorage.ts` cifra antes de escribir y descifra al leer — transparente para el resto de la app (`getTasks`/`saveTask`/`deleteTask` mantienen la misma firma).

**Qué NO se cifra (fuera de alcance)**
- Las fotos (`Task.photoUri`): el archivo JPEG queda en texto plano en el filesystem del dispositivo (`expo-file-system`). Cifrar imágenes completas con `crypto-js` (AES puro en JS, sin aceleración por hardware, sin *streaming*) bloquearía el hilo de JS de forma proporcional al tamaño del archivo en cada guardado **y en cada render** de un thumbnail en `TaskCard` dentro del `FlatList` de `TaskListScreen` — esto degrada el scroll/la fluidez que ya exige la sección "Estados de UI" de `DESIGN.md`. Con fotos ya redimensionadas a máx. 1080px/calidad 70% (~100–500 KB), el costo por foto es tolerable una vez, pero no repetido en cada render de lista. Se documenta como limitación conocida en vez de implementarlo a medias.

**Algoritmo y formato**
- **AES-256-CBC** vía `crypto-js`. Cada mensaje usa un **IV aleatorio de 16 bytes** (nunca reutilizado); el payload persistido es `ivHex:cifradoBase64` (el IV no es secreto, viaja junto al cifrado).
- Implementación: `src/storage/encryption.ts` (`encrypt`/`decrypt`/`getEncryptionKey`).

**Dónde vive la clave**
- Clave de 256 bits generada una sola vez por instalación con `expo-crypto.getRandomBytesAsync(32)`.
- Se guarda con **`expo-secure-store`** — Keychain en iOS, Keystore/`EncryptedSharedPreferences` en Android —, **nunca** en `AsyncStorage` ni hardcodeada en el código. Se reutiliza en cada sesión leyéndola de ahí.

**Pérdida de la clave (dispositivo nuevo / storage seguro borrado)**
- Si `expo-secure-store` no tiene la clave (o su lectura falla), `getEncryptionKey()` genera y persiste una clave nueva automáticamente — la app sigue funcionando.
- Cualquier tarea cifrada con una clave anterior queda **irrecuperable**: `decrypt()` devuelve `null` ante una clave equivocada y `taskStorage.ts` lo trata igual que un `AsyncStorage` corrupto (lista vacía, sin crashear). **Esto es comportamiento esperado**, no un bug: no hay respaldo de la clave fuera del dispositivo (no hay backend propio que la custodie).

**Fuera de alcance**
- Cifrado de fotos (ver arriba).
- Rotación de claves y migración de datos cifrados con una clave vieja a una nueva.
- Cifrado en tránsito adicional (ya cubierto por HTTPS en Firebase Authentication y JSONPlaceholder).

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
- `expo-crypto` — generación de `id` único para tareas (`randomUUID()`) y de la clave AES (`getRandomBytesAsync`)
- `@expo/vector-icons` — íconos (ubicación, estado vacío), bundled con Expo

**Archivos e imágenes**
- `expo-file-system` — guardado de fotos en el dispositivo
- `expo-image-manipulator` — resize/compresión (máx. 1080px lado mayor, calidad 70%)

**Datos y seguridad**
- `firebase` (SDK JS modular) — Firebase Authentication (email/contraseña), persistencia de sesión vía `getReactNativePersistence` + `AsyncStorage`
- `@react-native-async-storage/async-storage` — persistencia local de tareas cifradas y sesión de Firebase
- `crypto-js` — cifrado AES-256-CBC de las tareas en reposo (JS puro, sin módulos nativos, compatible con Expo Go)
- `expo-secure-store` — guarda la clave de cifrado en el keychain/keystore del dispositivo, fuera de `AsyncStorage`
- JSONPlaceholder — API externa de importación

**Testing**
- Jest + jest-expo

---

## Roadmap (fuera del alcance actual)

- **Firebase Firestore**: reemplaza a JSONPlaceholder como backend remoto real de tareas — persiste escrituras y habilita sincronización multi-dispositivo real (hoy las tareas siguen siendo locales por dispositivo aunque la cuenta ya es de Firebase).
- **Sincronización en tiempo real** entre dispositivos, una vez migrado a Firestore.
- Proveedores adicionales de Firebase Authentication (Google, Apple) más allá de correo/contraseña.
- Cifrado de fotos y rotación de claves de cifrado (ver "Cifrado de datos sensibles").
