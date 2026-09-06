import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as authStorage from "../storage/authStorage";
import type { User } from "../types/User";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  register: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const userId = await authStorage.getSession();
      if (userId) {
        const users = await authStorage.getUsers();
        setUser(users.find((u) => u.id === userId) ?? null);
      }
      setIsLoading(false);
    })();
  }, []);

  const register = async (username: string, password: string) => {
    const created = await authStorage.registerUser(username, password);
    await authStorage.setSession(created.id);
    setUser(created);
  };

  const login = async (username: string, password: string) => {
    const found = await authStorage.loginUser(username, password);
    await authStorage.setSession(found.id);
    setUser(found);
  };

  const logout = async () => {
    await authStorage.clearSession();
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
