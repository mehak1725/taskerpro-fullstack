import { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, setAuthTokenGetter, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("nexus_token");
  });
  const [user, setUser] = useState<User | null>(null);
  
  // Set the token getter for custom-fetch whenever token changes
  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  const { data: meData, isLoading, isError } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token && !user,
      retry: false,
    }
  });

  useEffect(() => {
    if (meData) {
      setUser(meData);
    }
  }, [meData]);

  useEffect(() => {
    if (isError) {
      setToken(null);
      setUser(null);
      localStorage.removeItem("nexus_token");
    }
  }, [isError]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("nexus_token", newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("nexus_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading: isLoading && !!token && !user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
