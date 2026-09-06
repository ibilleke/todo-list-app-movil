import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import TaskListScreen from "../src/screens/TaskListScreen";
import { getTasks, saveTask } from "../src/storage/taskStorage";
import { fetchTodos, syncTask } from "../src/api/jsonPlaceholder";
import type { RootStackParamList } from "../src/navigation/types";
import type { Task } from "../src/types/Task";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    const { useEffect } = require("react");
    useEffect(() => callback(), []);
  },
}));

jest.mock("../src/api/jsonPlaceholder", () => ({
  fetchTodos: jest.fn(),
  syncTask: jest.fn(),
}));

const mockSecureStoreData = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureStoreData.get(key) ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStoreData.set(key, value);
    return Promise.resolve();
  }),
}));

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: (size: number) =>
    Promise.resolve(Uint8Array.from({ length: size }, (_, i) => i % 256)),
}));

const mockLogout = jest.fn();

jest.mock("../src/auth/AuthContext", () => ({
  useAuth: () => ({
    user: {
      uid: "test-user",
      email: "tester@example.com",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    isLoading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: mockLogout,
  }),
}));

type Props = NativeStackScreenProps<RootStackParamList, "TaskList">;

function buildProps(): Props {
  return {
    navigation: {
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    } as unknown as Props["navigation"],
    route: { key: "TaskList", name: "TaskList", params: undefined } as Props["route"],
  };
}

function renderScreen(props: Props) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <TaskListScreen {...props} />
    </SafeAreaProvider>
  );
}

function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    userId: "test-user",
    title: "Comprar café",
    completed: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    source: "local",
    ...overrides,
  };
}

describe("<TaskListScreen />", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockSecureStoreData.clear();
  });

  test("shows the empty state and navigates to TaskForm from the call-to-action", async () => {
    const props = buildProps();
    const { getByText } = await renderScreen(props);

    await waitFor(() => expect(getByText("No tenés tareas todavía")).toBeTruthy());

    await fireEvent.press(getByText("Crear tu primera tarea"));

    expect(props.navigation.navigate).toHaveBeenCalledWith("TaskForm", {});
  });

  test("toggling a task's checkbox persists the new completed state", async () => {
    await saveTask(buildTask({ completed: false }));

    const props = buildProps();
    const { getByTestId } = await renderScreen(props);

    await waitFor(() => expect(getByTestId("task-card-task-1")).toBeTruthy());

    await fireEvent.press(getByTestId("task-toggle-task-1"));

    await waitFor(async () => {
      const stored = await getTasks("test-user");
      expect(stored[0].completed).toBe(true);
    });
  });

  test("importing skips todos already imported on a previous run", async () => {
    (fetchTodos as jest.Mock).mockResolvedValue([
      { userId: 1, id: 1, title: "Delectus aut autem", completed: false },
      { userId: 1, id: 2, title: "Quis ut nam facilis", completed: true },
    ]);

    const props = buildProps();
    const { getByTestId, getByText } = await renderScreen(props);
    await waitFor(() => expect(getByText("No tenés tareas todavía")).toBeTruthy());

    await fireEvent.press(getByTestId("import-button"));
    await waitFor(() => expect(getByText("Delectus aut autem")).toBeTruthy());

    let stored = await getTasks("test-user");
    expect(stored).toHaveLength(2);

    (fetchTodos as jest.Mock).mockResolvedValue([
      { userId: 1, id: 1, title: "Delectus aut autem", completed: false },
      { userId: 1, id: 2, title: "Quis ut nam facilis", completed: true },
      { userId: 1, id: 3, title: "Fugiat veniam minus", completed: false },
    ]);

    await fireEvent.press(getByTestId("import-button"));
    await waitFor(() => expect(getByText("Fugiat veniam minus")).toBeTruthy());

    stored = await getTasks("test-user");
    expect(stored).toHaveLength(3);
  });

  test("shows a retry banner when import fails", async () => {
    (fetchTodos as jest.Mock).mockRejectedValue(new Error("network down"));

    const props = buildProps();
    const { getByTestId, getByText } = await renderScreen(props);
    await waitFor(() => expect(getByText("No tenés tareas todavía")).toBeTruthy());

    await fireEvent.press(getByTestId("import-button"));

    await waitFor(() =>
      expect(getByText("No se pudo importar. Revisá tu conexión.")).toBeTruthy()
    );
    expect(getByText("Reintentar")).toBeTruthy();
  });

  test("sync uploads pending local tasks and marks them as synced", async () => {
    await saveTask(buildTask({ source: "local" }));
    (syncTask as jest.Mock).mockResolvedValue(undefined);

    const props = buildProps();
    const { getByTestId } = await renderScreen(props);
    await waitFor(() => expect(getByTestId("task-card-task-1")).toBeTruthy());

    await fireEvent.press(getByTestId("sync-button"));

    await waitFor(async () => {
      const stored = await getTasks("test-user");
      expect(stored[0].syncedAt).toBeDefined();
    });
    expect(syncTask).toHaveBeenCalledWith(expect.objectContaining({ id: "task-1" }));
  });

  test("logout button calls the auth context logout", async () => {
    const props = buildProps();
    const { getByTestId, getByText } = await renderScreen(props);
    await waitFor(() => expect(getByText("No tenés tareas todavía")).toBeTruthy());

    await fireEvent.press(getByTestId("logout-button"));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
