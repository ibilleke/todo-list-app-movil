import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../src/auth/AuthContext";
import * as authStorage from "../src/storage/authStorage";
import type { User } from "../src/types/User";

jest.mock("../src/storage/authStorage", () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  subscribeToAuthState: jest.fn(),
}));

const mockedAuthStorage = authStorage as jest.Mocked<typeof authStorage>;

function buildUser(overrides: Partial<User> = {}): User {
  return {
    uid: "user-1",
    email: "ignacio@example.com",
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  const unsubscribe = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    mockedAuthStorage.subscribeToAuthState.mockImplementation((callback) => {
      callback(null);
      return unsubscribe;
    });
  });

  test("useAuth throws when used outside an AuthProvider", async () => {
    const { result } = await renderHook(() => {
      try {
        return useAuth();
      } catch (err) {
        return err;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toBe(
      "useAuth debe usarse dentro de un AuthProvider"
    );
  });

  test("resolves with no user when Firebase reports no session", async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test("restores the session user Firebase reports on mount", async () => {
    const stored = buildUser();
    mockedAuthStorage.subscribeToAuthState.mockImplementation((callback) => {
      callback(stored);
      return unsubscribe;
    });

    const { result } = await renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toEqual(stored);
  });

  test("unsubscribes from Firebase auth state changes on unmount", async () => {
    const { unmount } = await renderHook(() => useAuth(), { wrapper });

    await unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  test("register exposes the created user", async () => {
    const created = buildUser({ uid: "new-user", email: "nuevo@example.com" });
    mockedAuthStorage.registerUser.mockResolvedValue(created);

    const { result } = await renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register("nuevo@example.com", "123456");
    });

    expect(mockedAuthStorage.registerUser).toHaveBeenCalledWith("nuevo@example.com", "123456");
    expect(result.current.user).toEqual(created);
  });

  test("login sets the returned user on success", async () => {
    const found = buildUser();
    mockedAuthStorage.loginUser.mockResolvedValue(found);

    const { result } = await renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("ignacio@example.com", "123456");
    });

    expect(result.current.user).toEqual(found);
  });

  test("login rejects with the storage error and leaves the user unauthenticated", async () => {
    mockedAuthStorage.loginUser.mockRejectedValue(new Error("Correo o contraseña incorrectos"));

    const { result } = await renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.login("ignacio@example.com", "wrong");
      })
    ).rejects.toThrow("Correo o contraseña incorrectos");

    expect(result.current.user).toBeNull();
  });

  test("logout clears the current user", async () => {
    const found = buildUser();
    mockedAuthStorage.loginUser.mockResolvedValue(found);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login("ignacio@example.com", "123456");
    });
    expect(result.current.user).toEqual(found);

    await act(async () => {
      await result.current.logout();
    });

    expect(mockedAuthStorage.logoutUser).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
  });
});
