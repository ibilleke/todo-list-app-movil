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

    await fireEvent.changeText(getByPlaceholderText("Usuario"), "Ignacio");
    await fireEvent.changeText(getByPlaceholderText("Mínimo 4 caracteres"), "1234");
    await fireEvent.changeText(getByPlaceholderText("Repetí la contraseña"), "5678");
    await fireEvent.press(getByText("Registrarme"));

    await waitFor(() => expect(getByText("Las contraseñas no coinciden")).toBeTruthy());
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("registers with the entered username and password when they match", async () => {
    mockRegister.mockResolvedValue(undefined);
    const props = buildProps();
    const { getByText, getByPlaceholderText } = await renderScreen(props);

    await fireEvent.changeText(getByPlaceholderText("Usuario"), "Ignacio");
    await fireEvent.changeText(getByPlaceholderText("Mínimo 4 caracteres"), "1234");
    await fireEvent.changeText(getByPlaceholderText("Repetí la contraseña"), "1234");
    await fireEvent.press(getByText("Registrarme"));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith("Ignacio", "1234"));
  });

  test("shows the storage error message when register rejects", async () => {
    mockRegister.mockRejectedValue(new Error("Ese usuario ya existe"));
    const props = buildProps();
    const { getByText, getByPlaceholderText } = await renderScreen(props);

    await fireEvent.changeText(getByPlaceholderText("Usuario"), "Ignacio");
    await fireEvent.changeText(getByPlaceholderText("Mínimo 4 caracteres"), "1234");
    await fireEvent.changeText(getByPlaceholderText("Repetí la contraseña"), "1234");
    await fireEvent.press(getByText("Registrarme"));

    await waitFor(() => expect(getByText("Ese usuario ya existe")).toBeTruthy());
  });

  test("navigates to Login when the login link is pressed", async () => {
    const props = buildProps();
    const { getByText } = await renderScreen(props);

    await fireEvent.press(getByText(/¿Ya tenés cuenta\?/));

    expect(props.navigation.navigate).toHaveBeenCalledWith("Login");
  });
});
