import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import LoginScreen from "../src/screens/LoginScreen";
import type { RootStackParamList } from "../src/navigation/types";

const mockLogin = jest.fn();

jest.mock("../src/auth/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    login: mockLogin,
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

function buildProps(): Props {
  return {
    navigation: {
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    } as unknown as Props["navigation"],
    route: { key: "Login", name: "Login", params: undefined } as Props["route"],
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
      <LoginScreen {...props} />
    </SafeAreaProvider>
  );
}

describe("<LoginScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("logs in with the entered email and password", async () => {
    mockLogin.mockResolvedValue(undefined);
    const props = buildProps();
    const { getByText, getByPlaceholderText } = await renderScreen(props);

    await fireEvent.changeText(getByPlaceholderText("correo@ejemplo.com"), "ignacio@example.com");
    await fireEvent.changeText(getByPlaceholderText("Contraseña"), "1234");
    await fireEvent.press(getByText("Ingresar"));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("ignacio@example.com", "1234"));
  });

  test("shows the storage error message when login rejects", async () => {
    mockLogin.mockRejectedValue(new Error("Correo o contraseña incorrectos"));
    const props = buildProps();
    const { getByText, getByPlaceholderText } = await renderScreen(props);

    await fireEvent.changeText(getByPlaceholderText("correo@ejemplo.com"), "ignacio@example.com");
    await fireEvent.changeText(getByPlaceholderText("Contraseña"), "wrong");
    await fireEvent.press(getByText("Ingresar"));

    await waitFor(() => expect(getByText("Correo o contraseña incorrectos")).toBeTruthy());
  });

  test("navigates to Register when the register link is pressed", async () => {
    const props = buildProps();
    const { getByText } = await renderScreen(props);

    await fireEvent.press(getByText(/¿No tenés cuenta\?/));

    expect(props.navigation.navigate).toHaveBeenCalledWith("Register");
  });
});
