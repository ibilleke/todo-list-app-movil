import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Task } from "../types/Task";

const TASKS_KEY = "@todolist/tasks";

export async function getTasks(): Promise<Task[]> {
  const raw = await AsyncStorage.getItem(TASKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

export async function saveTask(task: Task): Promise<void> {
  const tasks = await getTasks();
  const index = tasks.findIndex((t) => t.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export async function deleteTask(id: string): Promise<void> {
  const tasks = await getTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(filtered));
}
