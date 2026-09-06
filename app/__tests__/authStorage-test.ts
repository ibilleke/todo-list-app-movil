import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  loginUser,
  logoutUser,
  registerUser,
  subscribeToAuthState,
} from "../src/storage/authStorage";

jest.mock("../src/firebase/firebaseConfig", () => ({ auth: {} }));

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

function buildFirebaseUser(overrides: Partial<{ uid: string; email: string; creationTime: string }> = {}) {
  const { uid = "uid-1", email = "ignacio@example.com", creationTime = "2024-01-01T00:00:00.000Z" } =
    overrides;
  return { uid, email, metadata: { creationTime } };
}

describe("authStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("registerUser trims the email and maps the created Firebase user", async () => {
    const firebaseUser = buildFirebaseUser();
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: firebaseUser });

    const user = await registerUser("  ignacio@example.com  ", "123456");

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "ignacio@example.com",
      "123456"
    );
    expect(user).toEqual({
      uid: "uid-1",
      email: "ignacio@example.com",
      createdAt: "2024-01-01T00:00:00.000Z",
    });
  });

  test("registerUser translates auth/email-already-in-use to a Spanish message", async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(
      new FirebaseError("auth/email-already-in-use", "Firebase: email already in use")
    );

    await expect(registerUser("ignacio@example.com", "123456")).rejects.toThrow(
      "Ese correo ya está registrado"
    );
  });

  test("registerUser translates auth/weak-password to a Spanish message", async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(
      new FirebaseError("auth/weak-password", "Firebase: weak password")
    );

    await expect(registerUser("ignacio@example.com", "123")).rejects.toThrow(
      "La contraseña debe tener al menos 6 caracteres"
    );
  });

  test("loginUser maps the Firebase user returned by signInWithEmailAndPassword", async () => {
    const firebaseUser = buildFirebaseUser({ uid: "uid-2" });
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: firebaseUser });

    const user = await loginUser("ignacio@example.com", "123456");

    expect(user.uid).toBe("uid-2");
  });

  test("loginUser translates invalid credential errors without revealing which field failed", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(
      new FirebaseError("auth/invalid-credential", "Firebase: invalid credential")
    );

    await expect(loginUser("ignacio@example.com", "wrong")).rejects.toThrow(
      "Correo o contraseña incorrectos"
    );
  });

  test("loginUser falls back to the original error message for unmapped codes", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(
      new FirebaseError("auth/network-request-failed", "Firebase: network error")
    );

    await expect(loginUser("ignacio@example.com", "123456")).rejects.toThrow(
      "Firebase: network error"
    );
  });

  test("logoutUser signs out of Firebase", async () => {
    await logoutUser();

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  test("subscribeToAuthState maps the current Firebase user through the callback", () => {
    const callback = jest.fn();
    const unsubscribe = jest.fn();
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, listener) => {
      listener(buildFirebaseUser());
      return unsubscribe;
    });

    const result = subscribeToAuthState(callback);

    expect(callback).toHaveBeenCalledWith({
      uid: "uid-1",
      email: "ignacio@example.com",
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    expect(result).toBe(unsubscribe);
  });

  test("subscribeToAuthState notifies null when there is no Firebase user", () => {
    const callback = jest.fn();
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, listener) => {
      listener(null);
      return jest.fn();
    });

    subscribeToAuthState(callback);

    expect(callback).toHaveBeenCalledWith(null);
  });
});
