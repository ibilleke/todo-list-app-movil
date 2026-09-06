import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import RegisterScreen from "../src/screens/RegisterScreen";
import type { RootStackParamList } from "../src/navigation/types";

const mockRegister = jest.fn();

jest.mock("../src/auth/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    login: jest.fn(),
    register: mockRegister,
    logout: jest.fn(),
  }),
}));

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

function buildProps(): Props {
  return {
    navigation: {
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    } as unknown as Props["navigation"],
    route: { key: "Register", name: "Register", params: undefined } as Props["route"],
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
      <RegisterScreen {...props} />
    </SafeAreaProvider>
  );
}

describe("<RegisterScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows an inline error and skips registration when passwords do not match", async () => {
    const props = buildProps();
    const { getByText, getByPlaceholderText } = await renderScreen(props);

    await fireEvent.changeText(getByPlaceholderText("correo@ejemplo.com"), "ignacio@example.com");
    await fireEvent.changeText(getByPlaceholderText("Mínimo 6 caracteres"), "123456");
    await fireEvent.changeText(getByPlaceholderText("Repetí la contraseña"), "654321");
    await fireEvent.press(getByText("Registrarme"));

    await waitFor(() => expect(getByText("Las contraseñas no coinciden")).toBeTruthy());
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("registers with the entered email and password when they match", async () => {
    mockRegister.mockResolvedValue(undefined);
    const props = buildProps();
    const { getByText, getByPlaceholderText } = await renderScreen(props);

    await fireEvent.changeText(getByPlaceholderText("correo@ejemplo.com"), "ignacio@example.com");
    await fireEvent.changeText(getByPlaceholderText("Mínimo 6 caracteres"), "123456");
    await fireEvent.changeText(getByPlaceholderText("Repetí la contraseña"), "123456");
    await fireEvent.press(getByText("Registrarme"));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith("ignacio@example.com", "123456"));
  });

  test("shows the storage error message when register rejects", async () => {
    mockRegister.mockRejectedValue(new Error("Ese correo ya está registrado"));
    const props = buildProps();
    const { getByText, getByPlaceholderText } = await renderScreen(props);

    await fireEvent.changeText(getByPlaceholderText("correo@ejemplo.com"), "ignacio@example.com");
    await fireEvent.changeText(getByPlaceholderText("Mínimo 6 caracteres"), "123456");
    await fireEvent.changeText(getByPlaceholderText("Repetí la contraseña"), "123456");
    await fireEvent.press(getByText("Registrarme"));

    await waitFor(() => expect(getByText("Ese correo ya está registrado")).toBeTruthy());
  });

  test("navigates to Login when the login link is pressed", async () => {
    const props = buildProps();
    const { getByText } = await renderScreen(props);

    await fireEvent.press(getByText(/¿Ya tenés cuenta\?/));

    expect(props.navigation.navigate).toHaveBeenCalledWith("Login");
  });
});
