# Plan de implementación: To Do List

Basado en `BRIEF.md` y `DESIGN.md`. Cada fase entrega algo corriendo y verificable en el dispositivo/emulador Android antes de pasar a la siguiente. No saltar fases.

**Regla transversal**: antes de instalar cualquier dependencia nueva (React Navigation, AsyncStorage, `expo-camera`, `expo-location`, `expo-file-system`, `expo-image-manipulator`, `expo-crypto`, `jest-expo`, etc.), leer su documentación oficial primero — confirmar compatibilidad con **Expo SDK 54**, API actual (puede diferir de lo asumido en este plan) y pasos de configuración nativa (permisos en `app.json`, plugins de config). No instalar a ciegas por costumbre/memoria.

**Control de versiones**: al cerrar cada fase (o cualquier avance importante), commit + push a GitHub. Commits con mensaje claro estilo convencional (`feat:`, `fix:`, `docs:`, `chore:`), autor humano (`Ignacio Billeke`), sin menciones a IA/herramientas de IA ni trailers tipo `Co-authored-by` generados automáticamente.

---

## Fase 0 — Setup del proyecto

1. Crear carpeta `app/` dentro de `Examen2AppMovil/` (separada de `docs/`).
2. Crear proyecto Expo (TypeScript, **SDK 54 fijo**): `pnpm create expo-app app --template blank-typescript` desde `Examen2AppMovil/`.
3. Pinnear SDK 54: en `app/package.json` fijar `"expo": "~54.0.0"`, correr `pnpm install`, luego `npx expo install --fix` (alinea `react-native`, `react` y demás paquetes `expo-*` a las versiones exactas de SDK 54).
4. Configurar `app.json`: `name`/`slug` = `todolist`, `android.package` = `com.ignac.todolist`.
5. Confirmar que corre en Android con la versión correcta de Expo Go (SDK 54): `cd app && pnpm start` → abrir en Expo Go / emulador.
6. Instalar dependencias base: React Navigation (`@react-navigation/native`, `@react-navigation/native-stack`) + peer deps (`react-native-screens`, `react-native-safe-area-context`).
7. Configurar estructura de carpetas dentro de `app/`: `src/screens`, `src/components`, `src/types`, `src/storage`, `src/api`, `src/theme`.

**Entregable**: app en blanco corriendo en Android vía Expo Go (SDK 54), con identidad (`app.json`) configurada.

---

## Fase 1 — Fundaciones: tipos, tema, navegación vacía

1. Crear `src/types/Task.ts` con el tipo `Task` (según Modelo de datos del BRIEF).
2. Crear `src/theme/colors.ts` con la paleta de `DESIGN.md` (violeta/coral/crema) y constantes de tipografía/espaciado.
3. Armar `Stack Navigator` con las 2 pantallas vacías: `TaskListScreen`, `TaskFormScreen`.
4. Verificar navegación: tocar un botón de prueba en `TaskListScreen` navega a `TaskFormScreen` y vuelve.

**Entregable**: navegación entre 2 pantallas placeholder, con colores del tema aplicados al header.

---

## Fase 2 — Persistencia local (AsyncStorage) con datos mock

1. Instalar `@react-native-async-storage/async-storage`.
2. Crear `src/storage/taskStorage.ts` con funciones: `getTasks()`, `saveTask(task)`, `deleteTask(id)`.
3. En `TaskListScreen`, cargar tareas desde storage con `FlatList` (sin UI final todavía, solo `Text` con el título).
4. Insertar 2-3 tareas de prueba manualmente (hardcodeadas) para verificar que se guardan y leen correctamente entre reinicios de la app.

**Entregable**: cerrar y reabrir la app conserva las tareas de prueba.

---

## Fase 3 — CRUD básico de tareas (sin cámara/GPS todavía)

1. Instalar `expo-crypto`. `TaskFormScreen`: inputs de título + descripción, switch "Completada", botón "Guardar".
2. Guardar nueva tarea en `AsyncStorage` vía `taskStorage.ts` (id generado con `Crypto.randomUUID()` de `expo-crypto`), volver a `TaskListScreen`.
3. Modo editar: tap en tarea de la lista abre `TaskFormScreen` con los datos cargados; "Guardar" actualiza; botón "Eliminar" (solo visible editando) borra y vuelve.
4. Aplicar `TaskCard` básico (checkbox + título + tachado si completada) según `DESIGN.md`.

**Entregable**: crear, editar, marcar completada y eliminar una tarea funciona end-to-end, persistido.

---

## Fase 4 — Cámara (expo-camera + expo-file-system + expo-image-manipulator)

1. Instalar `expo-camera`, `expo-file-system`, `expo-image-manipulator`.
2. Botón "Agregar foto" en `TaskFormScreen`: pide permiso *lazy*, abre cámara.
3. Al capturar: comprimir/resize con `expo-image-manipulator` (máx. 1080px, calidad 70%), guardar archivo con `expo-file-system`, setear `photoUri` en el form.
4. Si el permiso se rechaza: mostrar mensaje corto vía `Alert` nativo, no bloquear el guardado de la tarea (según flujo de permisos del `DESIGN.md`).
5. Mostrar thumbnail en `TaskCard` si la tarea tiene `photoUri`.

**Entregable**: crear una tarea con foto, verla como thumbnail en la lista, persistida entre reinicios.

---

## Fase 5 — Ubicación (expo-location)

1. Instalar `expo-location`.
2. Botón "Usar ubicación actual" en `TaskFormScreen`: pide permiso *lazy*, obtiene coordenadas, setea `location`.
3. Si ya hay ubicación, mostrar "Ubicación agregada ✓" en vez de coordenadas crudas.
4. Rechazo de permiso: mismo comportamiento que cámara (no bloquea).
5. Ícono de ubicación en `TaskCard` si la tarea tiene `location`.

**Entregable**: crear una tarea con foto + ubicación, ambas opcionales e independientes entre sí.

---

## Fase 6 — Importación desde JSONPlaceholder

1. Crear `src/api/jsonPlaceholder.ts` con función `fetchTodos()` (`GET https://jsonplaceholder.typicode.com/todos`).
2. Botón "Importar de JSONPlaceholder" en el header de `TaskListScreen`.
3. Mapear respuesta a `Task` (`source: "jsonplaceholder"`, sin foto/ubicación), guardar en `AsyncStorage`, evitar duplicados en reimportaciones (por ejemplo filtrando por id ya importado).
4. Manejar error de red: mensaje corto + botón "Reintentar" (según `DESIGN.md`), sin romper la lista existente.

**Entregable**: importar tareas de la API puebla la lista junto a las tareas locales, sin duplicar en múltiples imports.

---

## Fase 7 — Estados de UI y pulido visual

1. Estado vacío en `TaskListScreen` (sin tareas): ícono + texto + CTA "Crear tu primera tarea" / "Importar tareas".
2. Estado de carga (`ActivityIndicator`) durante import inicial y guardado de foto.
3. Aplicar paleta/tipografía/bordes redondeados/sombras de `DESIGN.md` en todos los componentes (`TaskCard`, `FAB`, botones del form).
4. Revisar consistencia visual completa contra `DESIGN.md`.

**Entregable**: app visualmente terminada, coherente con la dirección "moderno y amigable".

---

## Fase 8 — Testing (Jest + jest-expo)

1. Instalar y configurar `jest-expo` como preset de Jest.
2. Mock de `expo-camera`: test que verifica que al capturar foto se llama a la función de compresión/guardado y se setea `photoUri`.
3. Mock de `expo-location`: test que verifica que al pedir ubicación se setea `location` con coordenadas mockeadas.
4. Test de manejo de permiso rechazado: verificar que la tarea se puede guardar igual sin `photoUri`/`location`.
5. Correr suite completa: `pnpm test`.

**Entregable**: suite de tests verde cubriendo cámara y GPS (mockeados), cumple requisito 3 del BRIEF.

---

## Fase 9 — Revisión final contra BRIEF y DESIGN

1. Checklist manual: cada punto de "Alcance del proyecto" en `BRIEF.md` cumplido.
2. Checklist manual: cada sección de `DESIGN.md` (pantallas, paleta, componentes, permisos, estados) reflejada en la app real.
3. Probar en dispositivo/emulador Android limpio (sin datos previos) el flujo completo: abrir app vacía → importar → crear tarea con foto+GPS → editar → completar → eliminar.

**Entregable**: app lista para entrega del examen.

---

## Fuera de alcance (Roadmap, no implementar ahora)

- Migración a Firebase Firestore.
- Autenticación de usuarios.
- Sincronización en tiempo real entre dispositivos.
