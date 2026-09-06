import path from "node:path";

// Ruta al APK debug generado por `pnpm e2e:prebuild` + `gradlew assembleDebug`
// (ver docs/APPIUM.md). Sobreescribible con la variable de entorno ANDROID_APP_PATH,
// util para apuntar a un build ya empaquetado (ej. en CI).
const DEFAULT_APK_PATH = path.resolve(
  __dirname,
  "../android/app/build/outputs/apk/debug/app-debug.apk"
);

export const config: WebdriverIO.Config = {
  runner: "local",
  // WDIO v9 usa `tsx` (no ts-node) para compilar specs/config TypeScript on the fly.
  tsConfigPath: path.resolve(__dirname, "tsconfig.json"),

  specs: ["./specs/**/*.e2e.ts"],
  maxInstances: 1,

  capabilities: [
    {
      platformName: "Android",
      "appium:automationName": "UiAutomator2",
      "appium:deviceName": process.env.ANDROID_DEVICE_NAME ?? "Android Emulator",
      "appium:app": process.env.ANDROID_APP_PATH ?? DEFAULT_APK_PATH,
      "appium:appPackage": "com.ignac.todolist",
      "appium:appActivity": ".MainActivity",
      "appium:autoGrantPermissions": true,
      // noReset (default false) borra el estado de la app entre sesiones: cada spec
      // arranca sin sesión de Firebase persistida, siempre en LoginScreen.
      "appium:newCommandTimeout": 240,
    },
  ],

  logLevel: "warn",
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: [
    [
      "appium",
      {
        // Reutiliza el binario de `appium` instalado como devDependency; no requiere
        // tenerlo corriendo aparte. Poner en false y correr `pnpm e2e:appium` manualmente
        // si se prefiere un servidor Appium ya levantado (ej. contra un dispositivo remoto).
        args: { relaxedSecurity: true },
      },
    ],
  ],

  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 120000,
  },
};
