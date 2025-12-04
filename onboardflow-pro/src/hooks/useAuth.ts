import { useState, useEffect } from "react";
import { User, getAuthState, fetchUserData } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      console.log("🔍 useAuth - Loading user data...");
      
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        console.log("🔍 useAuth - No token found");
        setIsLoading(false);
        return;
      }
      
      // Fetch fresh user data from backend
      const result = await fetchUserData();
      
      if (result.success && result.user) {
        console.log("🔍 useAuth - User loaded:", result.user);
        setUser(result.user);
      } else {
        console.log("🔍 useAuth - Failed to load user:", result.error);
        setUser(null);
      }
      
      setIsLoading(false);
    };
    
    loadUser();
  }, []);

  const refreshUser = async () => {
    console.log("🔄 Refreshing user data...");
    const result = await fetchUserData();
    if (result.success && result.user) {
      setUser(result.user);
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    refreshUser,
  };
}