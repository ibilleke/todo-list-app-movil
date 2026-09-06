import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import CryptoJS from "crypto-js";

// Clave AES-256 generada una sola vez por instalación y guardada en el keychain/keystore
// del dispositivo (expo-secure-store), fuera de AsyncStorage. Nunca se hardcodea en el código.
const ENCRYPTION_KEY_STORE_KEY = "todolist_encryption_key";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Devuelve la clave de cifrado de este dispositivo, generándola la primera vez.
 *
 * Si `expo-secure-store` no tiene la clave (instalación nueva) o su lectura falla
 * (keystore no disponible todavía, storage seguro borrado, etc.), se genera y persiste
 * una clave nueva. Esto es esperado: cualquier dato cifrado con una clave anterior deja
 * de ser recuperable (ver `docs/BRIEF.md`, sección "Cifrado de datos sensibles").
 */
export async function getEncryptionKey(): Promise<string> {
  let existing: string | null = null;
  try {
    existing = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORE_KEY);
  } catch {
    existing = null;
  }
  if (existing) return existing;

  const randomBytes = await Crypto.getRandomBytesAsync(32); // 256 bits
  const key = bytesToHex(randomBytes);
  await SecureStore.setItemAsync(ENCRYPTION_KEY_STORE_KEY, key);
  return key;
}

/** Cifra `plainText` con AES-256-CBC; la clave es hexadecimal (32 bytes) y el IV es aleatorio por mensaje. */
export function encrypt(plainText: string, keyHex: string): string {
  const key = CryptoJS.enc.Hex.parse(keyHex);
  const iv = CryptoJS.lib.WordArray.random(16);
  const cipher = CryptoJS.AES.encrypt(plainText, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return `${iv.toString(CryptoJS.enc.Hex)}:${cipher.ciphertext.toString(CryptoJS.enc.Base64)}`;
}

/**
 * Descifra un payload generado por `encrypt`. Devuelve `null` (en vez de lanzar) cuando el
 * payload está corrupto o fue cifrado con una clave distinta a `keyHex` — el llamador decide
 * cómo degradar (ver `taskStorage.ts`).
 */
export function decrypt(payload: string, keyHex: string): string | null {
  const separatorIndex = payload.indexOf(":");
  if (separatorIndex < 0) return null;
  try {
    const ivHex = payload.slice(0, separatorIndex);
    const cipherBase64 = payload.slice(separatorIndex + 1);
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const ciphertext = CryptoJS.enc.Base64.parse(cipherBase64);
    const decrypted = CryptoJS.AES.decrypt({ ciphertext } as CryptoJS.lib.CipherParams, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const text = decrypted.toString(CryptoJS.enc.Utf8);
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}
