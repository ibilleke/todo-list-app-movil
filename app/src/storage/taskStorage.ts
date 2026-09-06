import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Task } from "../types/Task";
import { decrypt, encrypt, getEncryptionKey } from "./encryption";

const TASKS_KEY = "@todolist/tasks";

async function getAllTasks(): Promise<Task[]> {
  const raw = await AsyncStorage.getItem(TASKS_KEY);
  if (!raw) return [];
  const key = await getEncryptionKey();
  const decrypted = decrypt(raw, key);
  if (!decrypted) return [];
  try {
    return JSON.parse(decrypted) as Task[];
  } catch {
    return [];
  }
}

async function persistTasks(tasks: Task[]): Promise<void> {
  const key = await getEncryptionKey();
  await AsyncStorage.setItem(TASKS_KEY, encrypt(JSON.stringify(tasks), key));
}

export async function getTasks(userId: string): Promise<Task[]> {
  const tasks = await getAllTasks();
  return tasks.filter((t) => t.userId === userId);
}

export async function saveTask(task: Task): Promise<void> {
  const tasks = await getAllTasks();
  const index = tasks.findIndex((t) => t.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }
  await persistTasks(tasks);
}

export async function deleteTask(id: string): Promise<void> {
  const tasks = await getAllTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  await persistTasks(filtered);
}
