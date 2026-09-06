import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import type { User } from "../types/User";

const USERS_KEY = "@todolist/users";
const SESSION_KEY = "@todolist/session";
const MIN_PASSWORD_LENGTH = 4;


export async function getUsers(): Promise<User[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

export async function registerUser(username: string, password: string): Promise<User> {
  const trimmed = username.trim();
  if (!trimmed) {
    throw new Error("El usuario es obligatorio");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }
  const users = await getUsers();
  const exists = users.some((u) => u.username.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    throw new Error("Ese usuario ya existe");
  }
  const user: User = {
    id: Crypto.randomUUID(),
    username: trimmed,
    passwordHash: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  return user;
}

export async function loginUser(username: string, password: string): Promise<User> {
  const trimmed = username.trim();
  const passwordHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
  const users = await getUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === trimmed.toLowerCase() && u.passwordHash === passwordHash
  );
  if (!user) {
    throw new Error("Usuario o contraseña incorrectos");
  }
  return user;
}

export async function getSession(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_KEY);
}

export async function setSession(userId: string): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, userId);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
