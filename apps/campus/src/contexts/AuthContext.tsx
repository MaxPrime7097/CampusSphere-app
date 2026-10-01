import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logoutUser as apiLogout, supabaseSignOut, exchangeSupabaseToken } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { getAccessToken, setTokens, clearTokens } from "@/services/api/client";
import type { UserProfile } from "@/types";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: UserProfile, tokens: { access: string; refresh: string }) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    let token = getAccessToken();

    // 1. If no local token, attempt to recover from Supabase session
    if (!token) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const exchangeRes = await exchangeSupabaseToken(session.access_token);
          if (exchangeRes?.data?.tokens?.accessToken) {
            token = exchangeRes.data.tokens.accessToken;
          }
        }
      } catch (err) {
        console.error("Supabase session restore error:", err);
      }
    }

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // 2. Fetch current user with token
    try {
      let userData = await getCurrentUser(token);

      // If backend rejected token, attempt auto-recovery via Supabase session
      if (!userData) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const exchangeRes = await exchangeSupabaseToken(session.access_token);
            const newToken = exchangeRes?.data?.tokens?.accessToken;
            if (newToken) {
              userData = await getCurrentUser(newToken);
            }
          }
        } catch {
          // ignore
        }
      }

      setUser(userData);
    } catch (error) {
      console.error("Auth initialization error:", error);
      // Fallback to Supabase session before giving up
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const exchangeRes = await exchangeSupabaseToken(session.access_token);
          const newToken = exchangeRes?.data?.tokens?.accessToken;
          if (newToken) {
            const userData = await getCurrentUser(newToken);
            setUser(userData);
            return;
          }
        }
      } catch {
        // ignore
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // Keep session active on Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.access_token) {
          try {
            await exchangeSupabaseToken(session.access_token);
            const userData = await getCurrentUser();
            if (userData) setUser(userData);
          } catch (e) {
            console.error("Auth state change error:", e);
          }
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        clearTokens();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = (userData: any, tokens: { access: string; refresh: string }) => {
    setTokens(tokens.access, tokens.refresh);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await Promise.allSettled([
        apiLogout(),
        supabaseSignOut(),
      ]);
    } finally {
      setUser(null);
      clearTokens();
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout,
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
