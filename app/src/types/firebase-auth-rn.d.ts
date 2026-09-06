import type { Persistence } from "firebase/auth";

// El paquete meta "firebase" no declara `getReactNativePersistence` para el subpath "firebase/auth"
// (su mapa de "exports" solo condiciona "react-native" en el paquete interno @firebase/auth, no en
// el wrapper). La función sí existe en tiempo de ejecución en el build para React Native — bug de
// tipos conocido: https://github.com/firebase/firebase-js-sdk/issues/9316
declare module "firebase/auth" {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
