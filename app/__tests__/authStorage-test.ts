import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUsers, loginUser, registerUser } from "../src/storage/authStorage";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-crypto", () => {
  let counter = 0;
  return {
    randomUUID: () => `uuid-${++counter}`,
    digestStringAsync: async (_algorithm: string, data: string) => `sha256:${data}`,
    CryptoDigestAlgorithm: { SHA256: "SHA256" },
  };
});

describe("authStorage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("registerUser creates a user with a hashed password", async () => {
    const user = await registerUser("Ignacio", "1234");

    expect(user.username).toBe("Ignacio");
    expect(user.passwordHash).toBe("sha256:1234");
    expect(user.passwordHash).not.toBe("1234");

    const stored = await getUsers();
    expect(stored).toHaveLength(1);
  });

  test("registerUser rejects a duplicate username (case-insensitive)", async () => {
    await registerUser("Ignacio", "1234");

    await expect(registerUser("ignacio", "5678")).rejects.toThrow("Ese usuario ya existe");
  });

  test("registerUser rejects a password shorter than 4 characters", async () => {
    await expect(registerUser("nuevo", "123")).rejects.toThrow(
      "La contraseña debe tener al menos 4 caracteres"
    );
  });

  test("loginUser resolves with the user on matching credentials", async () => {
    await registerUser("Ignacio", "1234");

    const user = await loginUser("ignacio", "1234");
    expect(user.username).toBe("Ignacio");
  });

  test("loginUser rejects an incorrect password", async () => {
    await registerUser("Ignacio", "1234");

    await expect(loginUser("Ignacio", "wrong")).rejects.toThrow("Usuario o contraseña incorrectos");
  });

  test("loginUser rejects a nonexistent username", async () => {
    await expect(loginUser("ghost", "1234")).rejects.toThrow("Usuario o contraseña incorrectos");
  });
});
