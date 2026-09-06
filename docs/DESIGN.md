# Diseño (Frontend / UI-UX): To Do List

Dirección visual: **moderno y amigable** — violeta + coral sobre fondo cálido, bordes redondeados, espaciado generoso.

---

## 1. Navegación y pantallas

Librería: **React Navigation** (Stack Navigator). Un `AuthStack` (sin sesión) y un `MainStack` (con sesión), montados condicionalmente según haya un usuario de **Firebase Authentication** activo (`onAuthStateChanged`).

```
AuthStack (sin sesión)
├── LoginScreen (home si no hay sesión)
│     - Input correo electrónico, input contraseña (secureTextEntry)
│     - Botón "Ingresar"
│     - Link "Crear cuenta" → RegisterScreen
│
└── RegisterScreen
      - Input correo electrónico, input contraseña, input confirmar contraseña
      - Botón "Registrarme"
      - Link "Ya tengo cuenta" → LoginScreen

MainStack (con sesión)
├── TaskListScreen (home)
│     - Lista de tareas del usuario en sesión (FlatList)
│     - Botón "+" flotante (FAB) → TaskFormScreen, modo crear
│     - Botones "Importar de JSONPlaceholder" y "Sincronizar" en el header
│     - Ícono "Cerrar sesión" en el header
│     - Tap en tarea → TaskFormScreen, modo editar/ver
│
└── TaskFormScreen (crear + editar + ver, combinada)
      - Campos: título, descripción
      - Botón "Agregar foto" (expo-camera)
      - Botón "Usar ubicación actual" (expo-location)
      - Switch "Completada"
      - Botón "Guardar" / "Eliminar"
```

---

## 2. Paleta de colores y tipografía

| Uso | Color |
|---|---|
| Primario (botón +, acciones, header) | `#7C3AED` violeta |
| Acento secundario (badges, destacados) | `#FF6B6B` coral |
| Fondo | `#FFFBF5` crema cálido |
| Superficie / tarjeta | `#FFFFFF` |
| Texto principal | `#292524` (marrón oscuro, no negro puro) |
| Texto secundario | `#78716C` |
| Tarea completada (texto + tachado) | `#A8A29E` |
| Éxito / check | `#22C55E` |
| Error / eliminar | `#EF4444` |

**Tipografía**: system default (San Francisco en iOS, Roboto en Android) — sin fuente custom.
- Títulos de tarea: bold, 16–18px
- Body / descripción: regular, 14px
- Labels / secundario: regular, 12–13px, color texto secundario

**Forma**: `borderRadius: 12-16`, sombra suave en tarjetas (`elevation: 2` / `shadowOpacity: 0.08`), `padding: 16`.

---

## 3. Componentes UI clave

- **TaskCard** (tarjeta en TaskListScreen): checkbox de completada, título, thumbnail redondeado de foto si existe, ícono de ubicación si tiene GPS, ícono de nube si está sincronizada (`syncedAt`), texto tachado + `#A8A29E` si completada.
- **FAB**: botón flotante "+", color `#7C3AED`, esquina inferior derecha → abre TaskFormScreen en modo crear.
- **ImportButton** / **SyncButton**: íconos en el header de TaskListScreen (descarga = importar desde JSONPlaceholder, subida = sincronizar tareas locales pendientes vía `POST`).
- **AuthHero** (dentro de LoginScreen/RegisterScreen): franja violeta superior con 3 "chips" flotantes estilo `TaskCard` (checkbox + título corto, una marcada) que entran con una animación breve de aparición (respeta "reducir movimiento" del sistema), un anillo decorativo y el wordmark "To Do List" + tagline. Debajo, una hoja color crema con esquinas superiores redondeadas (`borderRadius: 32`) que se superpone al hero, contiene: heading ("Bienvenido de nuevo" / "Creá tu cuenta"), inputs con ícono (`person-outline` / `lock-closed-outline`), botón primario, mensaje de error corto inline bajo el form (no `Alert`), link secundario al otro flujo (login ↔ registro).
- **TaskForm** (dentro de TaskFormScreen):
  - Input título (obligatorio)
  - Textarea descripción (opcional)
  - Botón "Agregar foto" → abre cámara; si ya hay foto, muestra preview con opción de reemplazar
  - Botón "Usar ubicación actual" → si ya hay ubicación, muestra "Ubicación agregada ✓" en vez de coordenadas crudas
  - Switch "Completada"
  - Botón "Guardar" (primario) y "Eliminar" (`#FF6B6B`, solo visible en modo editar)

---

## 4. Flujo de autenticación

- `LoginScreen` es la pantalla inicial mientras no haya sesión activa; `onAuthStateChanged` (Firebase) restaura la sesión al abrir la app.
- **Registro**: valida que ambas contraseñas coincidan en el cliente; **Firebase Authentication** valida formato de correo, contraseña mínima (6 caracteres) y correo ya registrado. Al crear la cuenta con éxito, Firebase inicia sesión automáticamente y la app navega a `TaskListScreen`.
- **Login**: `signInWithEmailAndPassword` (Firebase) valida correo/contraseña contra el proyecto de Firebase; si coincide, navega a `TaskListScreen`.
- **Error** (correo inválido, contraseña débil, correo ya registrado, credenciales incorrectas): Firebase devuelve un código (`auth/...`) que la app traduce a un mensaje corto inline bajo el form, color `#EF4444`, sin `Alert`; el error de login nunca revela cuál de correo/contraseña falló ("Correo o contraseña incorrectos").
- La sesión persiste entre reinicios de la app (persistencia de Firebase sobre `AsyncStorage`) hasta "Cerrar sesión" explícito (ícono en el header de `TaskListScreen`), que llama a `signOut` y vuelve a `LoginScreen`.
- `TaskListScreen` solo muestra tareas con `userId` igual al `uid` de Firebase del usuario en sesión.

---

## 5. Flujo de permisos (cámara / GPS)

- Solicitud **lazy**: se pide el permiso recién al tocar "Agregar foto" o "Usar ubicación actual", nunca al abrir la app.
- **Concede** → se ejecuta la acción (abre cámara / captura coordenadas) y el resultado se guarda en el campo correspondiente.
- **Rechaza en el momento** → se cancela solo esa acción puntual: mensaje corto vía `Alert` nativo de React Native (sin librería extra), el formulario sigue editable sin ese dato.
- **Rechaza permanentemente** ("No preguntar de nuevo") → mismo mensaje corto, sin forzar ni redirigir a Settings (fuera de alcance actual).
- Ningún permiso bloquea guardar la tarea — `photoUri` y `location` son opcionales en el modelo de datos.

---

## 6. Estados de UI

- **Vacío** (sin tareas): ícono grande + "No tenés tareas todavía" + botones "Crear tu primera tarea" / "Importar tareas".
- **Cargando**: `ActivityIndicator` color `#7C3AED` durante importación inicial, sincronización o guardado de foto; no bloquea toda la pantalla salvo en el import/sync inicial.
- **Error** (falla de red al importar o sincronizar): mensaje corto + botón "Reintentar"; las tareas locales ya guardadas siguen visibles y usables — la app nunca se rompe por un fallo de red.
- **Auth — error de validación** (login/registro): mensaje corto inline bajo el form (ver sección 4), el form permanece editable, sin bloquear ni navegar.

---

## 7. Cifrado de datos sensibles

Cifrado **transparente**: no hay pantalla, switch ni configuración visible para el usuario — no hay nada que diseñar en la UI para esta feature, solo comportamiento a respetar en los estados existentes.

- Las tareas (`Task[]`, incluye título/descripción/ubicación) se cifran con **AES-256** (`crypto-js`) antes de guardarse en `AsyncStorage`; se descifran al leer. `TaskListScreen` y `TaskFormScreen` no cambian: siguen usando `getTasks`/`saveTask`/`deleteTask` tal cual, sin saber que hay cifrado debajo.
- La clave vive en `expo-secure-store` (Keychain/Keystore del dispositivo), nunca en `AsyncStorage` ni visible en la UI.
- **Fotos sin cifrar** (decisión documentada en `BRIEF.md`): el thumbnail de `TaskCard` sigue siendo una lectura directa del archivo JPEG (`Image source={{ uri: photoUri }}`), sin descifrado en cada render — evita el costo de cifrado síncrono en JS puro sobre binarios en una lista con scroll (`FlatList`).
- **Si la clave de cifrado se pierde** (dispositivo nuevo, storage seguro borrado): la app genera una clave nueva y las tareas cifradas previamente dejan de leerse. Esto se ve igual que el **estado Vacío** de la sección 6 ("No tenés tareas todavía") — no hay un mensaje de error distinto ni un `Alert`; es indistinguible de un usuario sin tareas todavía, comportamiento aceptado dado que no hay backend propio que resguarde la clave.
