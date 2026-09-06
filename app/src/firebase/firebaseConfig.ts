import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Credenciales del proyecto de Firebase. Se leen de variables de entorno EXPO_PUBLIC_*
// (definidas en `app/.env`, no versionado) para que cada integrante use su propio proyecto
// de Firebase sin subir claves reales al repo. Ver `.env.example` para los pasos de setup.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
  // Persistencia en AsyncStorage: la sesión sobrevive a reinicios de la app.
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  // initializeAuth solo puede llamarse una vez por app (lanza si Fast Refresh vuelve a
  // ejecutar este módulo); en ese caso reutilizamos la instancia ya inicializada.
  auth = getAuth(app);
}

export { auth };
