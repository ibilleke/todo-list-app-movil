# E2E con Appium + WebdriverIO

Pruebas end-to-end sobre la app Android real (APK debug), además de los tests de componente/unitarios con Jest (`app/__tests__`). Corren en un emulador/dispositivo Android real vía UIAutomator2, no en Expo Go: manejan la app empaquetada con su propio proceso, permisos y ciclo de vida.

## Stack

| Pieza | Rol |
|---|---|
| Appium 2 (`appium`) | Servidor que traduce comandos WebDriver a interacciones nativas Android |
| `appium-uiautomator2-driver` | Driver Android de Appium (requiere API ≥ 21) |
| WebdriverIO (`@wdio/cli`, `@wdio/local-runner`, `@wdio/mocha-framework`) | Test runner + cliente WebDriver |
| `@wdio/appium-service` | Levanta y apaga Appium automáticamente al correr `pnpm e2e` |
| Mocha (`ui: "bdd"`) | Framework de specs (`describe`/`it`) |

Config: `app/e2e/wdio.conf.ts`. Specs: `app/e2e/specs/*.e2e.ts`.

## Prerrequisitos

1. Android SDK instalado con `ANDROID_HOME` (o `ANDROID_SDK_ROOT`) exportado y `platform-tools`/`emulator` en el `PATH`. Sin esto, UIAutomator2 rechaza la sesión con `Neither ANDROID_HOME nor ANDROID_SDK_ROOT environment variable was exported`.
2. Un emulador Android corriendo (`emulator -avd <nombre>`) o un dispositivo físico con depuración USB habilitada (`adb devices` debe listarlo).
3. JDK 17 (requerido por Gradle para compilar el proyecto Android nativo).
4. Driver UIAutomator2 registrado en Appium (una sola vez):
   ```bash
   cd app
   pnpm exec appium driver install uiautomator2
   ```

## Build del APK

Los tests corren contra un build nativo standalone (no Expo Go), para poder fijar `appPackage`/`appActivity` y aislar el estado de la app (`noReset` por defecto limpia `AsyncStorage`/sesión de Firebase entre specs).

```bash
cd app
pnpm e2e:prebuild            # expo prebuild --platform android (genera app/android/)
cd android
./gradlew assembleDebug      # Windows: gradlew.bat assembleDebug
```

Genera `app/android/app/build/outputs/apk/debug/app-debug.apk`, la ruta por defecto que lee `e2e/wdio.conf.ts`. Para usar otra ruta (ej. un APK de CI ya empaquetado):

```bash
ANDROID_APP_PATH=/ruta/a/app-debug.apk pnpm e2e
```

## Ejecutar los tests

```bash
cd app
pnpm e2e
```

`@wdio/appium-service` levanta Appium (`--relaxed-security`) al inicio y lo apaga al terminar; no hace falta correr `appium` aparte. Si preferís un servidor Appium externo ya corriendo (ej. contra un dispositivo remoto), usá `pnpm e2e:appium` en otra terminal y ajustá `hostname`/`port` en `wdio.conf.ts`.

Variables de entorno soportadas:

| Variable | Default | Uso |
|---|---|---|
| `ANDROID_APP_PATH` | `android/app/build/outputs/apk/debug/app-debug.apk` | Ruta al APK a instalar |
| `ANDROID_DEVICE_NAME` | `Android Emulator` | Nombre del dispositivo/AVD para la capability `appium:deviceName` |

## Convención de `testID`

Los elementos interactivos usan `testID` (React Native lo mapea a `content-desc` en Android), localizables con el selector de accesibilidad `~testID` de WebdriverIO:

- Login: `login-heading`, `login-email-input`, `login-password-input`, `login-submit-button`, `login-error-text`, `login-register-link`.
- Register: `register-heading`, `register-email-input`, `register-password-input`, `register-confirm-password-input`, `register-submit-button`, `register-error-text`, `register-login-link`.
- Lista de tareas: `sync-button`, `import-button`, `logout-button`, `fab-add-task`, `empty-create-task-button`, `task-card-<id>`, `task-toggle-<id>`.
- Formulario de tarea: `task-title-input`, `task-description-input`, `task-save-button`, `task-delete-button`, `capture-button`.

## Specs incluidas (`app/e2e/specs/`)

1. **`login-screen.e2e.ts`** — smoke test: la app arranca en Login con email, contraseña y botón de ingreso visibles; y al enviar credenciales inválidas aparece el banner de error sin abandonar Login.
2. **`auth-navigation.e2e.ts`** — navegación Login → Register → Login vía los links de cada pantalla, verificando que cada heading y sus inputs queden visibles.
3. **`register-validation.e2e.ts`** — validación cliente de Register: contraseña y confirmación distintas muestran `"Las contraseñas no coinciden"` sin llamar a Firebase (no requiere backend real ni credenciales válidas).

Las tres corren sin necesitar un proyecto de Firebase configurado: sólo ejercitan Login/Register, que son alcanzables sin sesión. `noReset` (default de Appium) resetea `AsyncStorage` entre specs, así que cada uno arranca siempre en `LoginScreen`.

## Extender la suite

Para cubrir el flujo de tareas (crear/editar/eliminar, cámara, ubicación) hace falta una cuenta de Firebase de pruebas real: agregar credenciales de un usuario de test como variables de entorno, loguear en un `before` con los `testID` de Login, y localizar los elementos ya expuestos en `TaskListScreen`/`TaskFormScreen` (`fab-add-task`, `task-title-input`, `task-save-button`, `task-card-<id>`, etc.).
