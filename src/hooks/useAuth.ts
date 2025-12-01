// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import { User, getAuthState } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage
    const authState = getAuthState();
    
    console.log("🔍 useAuth - Auth state:", authState);
    
    setUser(authState.user);
    setIsLoading(false);
  }, []);

  // Function to refresh user data
  const refreshUser = () => {
    const authState = getAuthState();
    console.log("🔄 Refreshing user data:", authState.user);
    setUser(authState.user);
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    refreshUser,
  };
}