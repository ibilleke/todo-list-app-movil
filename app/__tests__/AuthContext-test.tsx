import React from "react";
import { act, renderHook } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../src/auth/AuthContext";
import * as authStorage from "../src/storage/authStorage";
import type { User } from "../src/types/User";

jest.mock("../src/storage/authStorage", () => ({
  getUsers: jest.fn(),
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  getSession: jest.fn(),
  setSession: jest.fn(),
  clearSession: jest.fn(),
}));

const mockedAuthStorage = authStorage as jest.Mocked<typeof authStorage>;

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    username: "Ignacio",
    passwordHash: "hash",
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedAuthStorage.getSession.mockResolvedValue(null);
    mockedAuthStorage.getUsers.mockResolvedValue([]);
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

  test("resolves with no user when there is no stored session", async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test("restores the session user on mount when a session exists", async () => {
    const stored = buildUser();
    mockedAuthStorage.getSession.mockResolvedValue(stored.id);
    mockedAuthStorage.getUsers.mockResolvedValue([stored]);

    const { result } = await renderHook(() => useAuth(), { wrapper });

    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toEqual(stored);
  });

  test("register persists the session and exposes the created user", async () => {
    const created = buildUser({ id: "new-user", username: "Nuevo" });
    mockedAuthStorage.registerUser.mockResolvedValue(created);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.register("Nuevo", "1234");
    });

    expect(mockedAuthStorage.registerUser).toHaveBeenCalledWith("Nuevo", "1234");
    expect(mockedAuthStorage.setSession).toHaveBeenCalledWith("new-user");
    expect(result.current.user).toEqual(created);
  });

  test("login sets the returned user on success", async () => {
    const found = buildUser();
    mockedAuthStorage.loginUser.mockResolvedValue(found);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.login("Ignacio", "1234");
    });

    expect(mockedAuthStorage.setSession).toHaveBeenCalledWith(found.id);
    expect(result.current.user).toEqual(found);
  });

  test("login rejects with the storage error and leaves the user unauthenticated", async () => {
    mockedAuthStorage.loginUser.mockRejectedValue(new Error("Usuario o contraseña incorrectos"));

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await expect(
      act(async () => {
        await result.current.login("Ignacio", "wrong");
      })
    ).rejects.toThrow("Usuario o contraseña incorrectos");

    expect(result.current.user).toBeNull();
    expect(mockedAuthStorage.setSession).not.toHaveBeenCalled();
  });

  test("logout clears the session and the current user", async () => {
    const found = buildUser();
    mockedAuthStorage.loginUser.mockResolvedValue(found);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    await act(async () => {
      await result.current.login("Ignacio", "1234");
    });
    expect(result.current.user).toEqual(found);

    await act(async () => {
      await result.current.logout();
    });

    expect(mockedAuthStorage.clearSession).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
  });
});
