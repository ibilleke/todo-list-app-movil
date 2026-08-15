import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { ImageManipulator } from "expo-image-manipulator";
import { File } from "expo-file-system";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import TaskFormScreen from "../src/screens/TaskFormScreen";
import { getTasks } from "../src/storage/taskStorage";
import type { RootStackParamList } from "../src/navigation/types";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const mockTakePictureAsync = jest.fn();

jest.mock("expo-camera", () => {
  const ReactActual = require("react");
  const { View } = require("react-native");
  const CameraView = ReactActual.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
    ReactActual.useImperativeHandle(ref, () => ({
      takePictureAsync: (...args: unknown[]) => mockTakePictureAsync(...args),
    }));
    return ReactActual.createElement(View, { testID: "camera-view" });
  });
  return {
    CameraView,
    useCameraPermissions: jest.fn(),
  };
});

const mockGetCurrentPositionAsync = jest.fn();

jest.mock("expo-location", () => ({
  useForegroundPermissions: jest.fn(),
  getCurrentPositionAsync: (...args: unknown[]) => mockGetCurrentPositionAsync(...args),
  Accuracy: { Balanced: 3 },
}));

jest.mock("expo-image-manipulator", () => {
  const resize = jest.fn();
  const renderAsync = jest.fn();
  const saveAsync = jest.fn();
  const manipulate = jest.fn(() => ({ resize }));
  resize.mockReturnValue({ renderAsync });
  renderAsync.mockResolvedValue({ saveAsync });
  saveAsync.mockResolvedValue({ uri: "file://compressed-photo.jpg" });
  return {
    ImageManipulator: { manipulate },
    SaveFormat: { JPEG: "jpeg" },
  };
});

jest.mock("expo-file-system", () => {
  class Directory {
    exists = false;
    constructor(..._args: unknown[]) {}
    create() {}
  }
  class FileImpl {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
    move(_destination: unknown): Promise<void> {
      return Promise.resolve();
    }
  }
  return { Directory, File: FileImpl, Paths: { document: "file://documents/" } };
});

jest.mock("expo-crypto", () => ({
  randomUUID: () => "fixed-uuid",
}));

type Props = NativeStackScreenProps<RootStackParamList, "TaskForm">;

function buildProps(): Props {
  return {
    navigation: {
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    } as unknown as Props["navigation"],
    route: { key: "TaskForm", name: "TaskForm", params: {} } as Props["route"],
  };
}

describe("<TaskFormScreen />", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  test("capturing a photo compresses it, persists the file and sets photoUri", async () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([{ granted: true }, jest.fn()]);
    (Location.useForegroundPermissions as jest.Mock).mockReturnValue([{ granted: true }, jest.fn()]);
    const moveSpy = jest.spyOn(File.prototype, "move").mockImplementation(() => Promise.resolve());
    mockTakePictureAsync.mockResolvedValue({ uri: "file://raw-photo.jpg", width: 1200, height: 900 });

    const props = buildProps();
    const { getByText, getByTestId, queryByText } = await render(<TaskFormScreen {...props} />);

    await fireEvent.press(getByText("Agregar foto"));
    await waitFor(() => expect(getByTestId("capture-button")).toBeTruthy());

    await fireEvent.press(getByTestId("capture-button"));
    await waitFor(() => expect(queryByText("Reemplazar foto")).toBeTruthy());

    expect(ImageManipulator.manipulate).toHaveBeenCalledWith("file://raw-photo.jpg");
    expect(moveSpy).toHaveBeenCalledTimes(1);
  });

  test("using current location sets coordinates from the mocked GPS response", async () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([{ granted: true }, jest.fn()]);
    const requestLocationPermission = jest.fn();
    (Location.useForegroundPermissions as jest.Mock).mockReturnValue([
      { granted: true },
      requestLocationPermission,
    ]);
    mockGetCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: -33.45, longitude: -70.66 },
    });

    const props = buildProps();
    const { getByText, queryByText } = await render(<TaskFormScreen {...props} />);

    await fireEvent.press(getByText("Usar ubicación actual"));
    await waitFor(() => expect(queryByText("Ubicación agregada ✓")).toBeTruthy());

    expect(mockGetCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: Location.Accuracy.Balanced });
    expect(requestLocationPermission).not.toHaveBeenCalled();
  });

  test("saving succeeds without photo or location when both permissions are denied", async () => {
    const requestPermission = jest.fn().mockResolvedValue({ granted: false });
    const requestLocationPermission = jest.fn().mockResolvedValue({ granted: false });
    (useCameraPermissions as jest.Mock).mockReturnValue([{ granted: false }, requestPermission]);
    (Location.useForegroundPermissions as jest.Mock).mockReturnValue([
      { granted: false },
      requestLocationPermission,
    ]);
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    const props = buildProps();
    const { getByText, getByPlaceholderText } = await render(<TaskFormScreen {...props} />);

    await fireEvent.press(getByText("Agregar foto"));
    expect(alertSpy).toHaveBeenCalledWith("Permiso de cámara denegado", expect.any(String));

    await fireEvent.press(getByText("Usar ubicación actual"));
    expect(alertSpy).toHaveBeenCalledWith("Permiso de ubicación denegado", expect.any(String));

    await fireEvent.changeText(getByPlaceholderText("¿Qué tenés que hacer?"), "Tarea sin permisos");
    await fireEvent.press(getByText("Guardar"));

    await waitFor(() => expect(props.navigation.goBack).toHaveBeenCalledTimes(1));
    const stored = await getTasks();
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe("Tarea sin permisos");
    expect(stored[0].photoUri).toBeUndefined();
    expect(stored[0].location).toBeUndefined();
  });
});
