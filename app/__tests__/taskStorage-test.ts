import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteTask, getTasks, saveTask } from "../src/storage/taskStorage";
import type { Task } from "../src/types/Task";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    userId: "user-1",
    title: "Comprar café",
    completed: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    source: "local",
    ...overrides,
  };
}

describe("taskStorage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("getTasks returns an empty list when nothing is stored", async () => {
    await expect(getTasks("user-1")).resolves.toEqual([]);
  });

  test("getTasks only returns tasks belonging to the given userId", async () => {
    await saveTask(buildTask({ id: "task-1", userId: "user-1" }));
    await saveTask(buildTask({ id: "task-2", userId: "user-2" }));

    const tasks = await getTasks("user-1");

    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe("task-1");
  });

  test("saveTask appends a new task", async () => {
    await saveTask(buildTask({ id: "task-1" }));
    await saveTask(buildTask({ id: "task-2", title: "Lavar el auto" }));

    const tasks = await getTasks("user-1");
    expect(tasks.map((t) => t.id)).toEqual(["task-1", "task-2"]);
  });

  test("saveTask updates an existing task in place instead of duplicating it", async () => {
    await saveTask(buildTask({ id: "task-1", title: "Original" }));
    await saveTask(buildTask({ id: "task-1", title: "Actualizada", completed: true }));

    const tasks = await getTasks("user-1");
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Actualizada");
    expect(tasks[0].completed).toBe(true);
  });

  test("deleteTask removes only the matching task", async () => {
    await saveTask(buildTask({ id: "task-1" }));
    await saveTask(buildTask({ id: "task-2", title: "Otra tarea" }));

    await deleteTask("task-1");

    const tasks = await getTasks("user-1");
    expect(tasks.map((t) => t.id)).toEqual(["task-2"]);
  });

  test("getTasks recovers from corrupted storage instead of throwing", async () => {
    await AsyncStorage.setItem("@todolist/tasks", "{not-json");

    await expect(getTasks("user-1")).resolves.toEqual([]);
  });
});
