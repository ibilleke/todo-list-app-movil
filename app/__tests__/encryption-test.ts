import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { decrypt, encrypt, getEncryptionKey } from "../src/storage/encryption";

const mockSecureStoreData = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureStoreData.get(key) ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStoreData.set(key, value);
    return Promise.resolve();
  }),
}));

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn((size: number) =>
    Promise.resolve(Uint8Array.from({ length: size }, (_, i) => i % 256))
  ),
}));

describe("encryption", () => {
  beforeEach(() => {
    mockSecureStoreData.clear();
    jest.clearAllMocks();
  });

  test("getEncryptionKey generates a 256-bit key and persists it via SecureStore", async () => {
    const key = await getEncryptionKey();

    expect(key).toHaveLength(64); // 32 bytes en hex
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("todolist_encryption_key", key);
  });

  test("getEncryptionKey reuses the persisted key instead of generating a new one", async () => {
    const first = await getEncryptionKey();
    const second = await getEncryptionKey();

    expect(second).toBe(first);
    expect(Crypto.getRandomBytesAsync).toHaveBeenCalledTimes(1);
  });

  test("getEncryptionKey generates a new key when SecureStore access throws", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error("keystore unavailable"));

    const key = await getEncryptionKey();

    expect(key).toHaveLength(64);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("todolist_encryption_key", key);
  });

  test("encrypt/decrypt roundtrips a UTF-8 string", () => {
    const key = "a".repeat(64);
    const payload = encrypt("Comprar café ☕ y llamar a mamá", key);

    expect(decrypt(payload, key)).toBe("Comprar café ☕ y llamar a mamá");
  });

  test("encrypt output never contains the plaintext", () => {
    const key = "b".repeat(64);
    const payload = encrypt("secreto-reconocible", key);

    expect(payload).not.toContain("secreto-reconocible");
  });

  test("encrypt uses a random IV so the same plaintext produces different ciphertext each time", () => {
    const key = "c".repeat(64);
    const first = encrypt("misma tarea", key);
    const second = encrypt("misma tarea", key);

    expect(first).not.toBe(second);
  });

  test("decrypt returns null when the payload was encrypted with a different key", () => {
    const payload = encrypt("dato sensible", "d".repeat(64));

    expect(decrypt(payload, "e".repeat(64))).toBeNull();
  });

  test("decrypt returns null for malformed payloads instead of throwing", () => {
    expect(decrypt("not-a-valid-payload", "f".repeat(64))).toBeNull();
    expect(decrypt("", "f".repeat(64))).toBeNull();
  });
});
