import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import type { User } from "../types/User";

function mapUser(firebaseUser: FirebaseUser): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? "",
    createdAt: firebaseUser.metadata.creationTime ?? new Date().toISOString(),
  };
}

function mapAuthError(error: unknown): Error {
  const code = error instanceof FirebaseError ? error.code : "";
  switch (code) {
    case "auth/invalid-email":
      return new Error("El correo no es válido");
    case "auth/email-already-in-use":
      return new Error("Ese correo ya está registrado");
    case "auth/weak-password":
      return new Error("La contraseña debe tener al menos 6 caracteres");
    case "auth/missing-password":
      return new Error("La contraseña es obligatoria");
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return new Error("Correo o contraseña incorrectos");
    case "auth/too-many-requests":
      return new Error("Demasiados intentos. Probá de nuevo más tarde");
    default:
      return error instanceof Error ? error : new Error("No se pudo completar la operación");
  }
}

export async function registerUser(email: string, password: string): Promise<User> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    return mapUser(credential.user);
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function loginUser(email: string, password: string): Promise<User> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return mapUser(credential.user);
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/** Suscribe a los cambios de sesión de Firebase; devuelve la función para desuscribirse. */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (firebaseUser) => {
    callback(firebaseUser ? mapUser(firebaseUser) : null);
  });
}
