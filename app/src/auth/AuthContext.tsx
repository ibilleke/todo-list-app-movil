import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as authStorage from "../storage/authStorage";
import type { User } from "../types/User";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged persiste la sesión entre reinicios (AsyncStorage vía firebaseConfig)
    // y también dispara al montar con el usuario ya logueado, si lo hay.
    const unsubscribe = authStorage.subscribeToAuthState((current) => {
      setUser(current);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const register = async (email: string, password: string) => {
    const created = await authStorage.registerUser(email, password);
    setUser(created);
  };

  const login = async (email: string, password: string) => {
    const found = await authStorage.loginUser(email, password);
    setUser(found);
  };

  const logout = async () => {
    await authStorage.logoutUser();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isLoading, register, login, logout }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
