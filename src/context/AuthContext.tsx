import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthUser, getUser, onAuthStateChange } from "@/lib/auth";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

// Export the provider as a named export
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    getUser().then((user) => {
      setUser(user);
      setIsLoading(false);
    });

    // Listen for auth changes
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the hook as a named export
export const useAuth = () => {
  return useContext(AuthContext);
};

// No need to re-export AuthContext
