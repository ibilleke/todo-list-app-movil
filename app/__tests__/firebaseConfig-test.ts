import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () => ({}));

const mockApp = { name: "[DEFAULT]" };
const mockGetApps = jest.fn();
const mockGetApp = jest.fn(() => mockApp);
const mockInitializeApp = jest.fn(() => mockApp);

jest.mock("firebase/app", () => ({
  getApps: mockGetApps,
  getApp: mockGetApp,
  initializeApp: mockInitializeApp,
}));

const mockPersistence = { kind: "async-storage-persistence" };
const mockInitializeAuth = jest.fn();
const mockGetAuth = jest.fn();
const mockGetReactNativePersistence = jest.fn(() => mockPersistence);

jest.mock("firebase/auth", () => ({
  initializeAuth: mockInitializeAuth,
  getAuth: mockGetAuth,
  getReactNativePersistence: mockGetReactNativePersistence,
}));

describe("firebaseConfig", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("initializes a new Firebase app and Auth with AsyncStorage persistence when none exists yet", async () => {
    mockGetApps.mockReturnValue([]);
    const fakeAuth = { name: "auth-instance" };
    mockInitializeAuth.mockReturnValue(fakeAuth);

    // require() intencional (no import estático): firebaseConfig.ts corre lógica a nivel de
    // módulo (side effects en el import), necesitamos una evaluación fresca por test tras
    // jest.resetModules() — jest-runtime en este proyecto corre en modo CommonJS.
    const { auth } = require("../src/firebase/firebaseConfig");

    expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    expect(mockGetApp).not.toHaveBeenCalled();
    expect(mockGetReactNativePersistence).toHaveBeenCalledWith(AsyncStorage);
    expect(mockInitializeAuth).toHaveBeenCalledWith(mockApp, { persistence: mockPersistence });
    expect(auth).toBe(fakeAuth);
  });

  test("reuses the existing Firebase app instance instead of initializing a new one", async () => {
    mockGetApps.mockReturnValue([mockApp]);
    mockInitializeAuth.mockReturnValue({});

    // Ídem: require() para forzar una evaluación fresca del módulo (ver test anterior).
    require("../src/firebase/firebaseConfig");

    expect(mockGetApp).toHaveBeenCalledTimes(1);
    expect(mockInitializeApp).not.toHaveBeenCalled();
  });

  test("falls back to getAuth when initializeAuth throws (Fast Refresh re-invocation)", async () => {
    mockGetApps.mockReturnValue([]);
    mockInitializeAuth.mockImplementation(() => {
      throw new Error("Auth already initialized");
    });
    const fakeExistingAuth = { name: "existing-auth" };
    mockGetAuth.mockReturnValue(fakeExistingAuth);

    // Ídem: require() para forzar una evaluación fresca del módulo (ver primer test).
    const { auth } = require("../src/firebase/firebaseConfig");

    expect(mockGetAuth).toHaveBeenCalledWith(mockApp);
    expect(auth).toBe(fakeExistingAuth);
  });
});
