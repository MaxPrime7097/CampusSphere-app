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
  const [user, setUserState] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem("cs_user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const setUser = (u: UserProfile | null) => {
    setUserState(u);
    try {
      if (u) {
        localStorage.setItem("cs_user", JSON.stringify(u));
      } else {
        localStorage.removeItem("cs_user");
      }
    } catch {
      // ignore storage errors
    }
  };

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

      if (userData) {
        setUser(userData);
      }
    } catch (error: any) {
      console.warn("Auth initialization error:", error);
      // Fallback to Supabase session before giving up
      let recovered = false;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const exchangeRes = await exchangeSupabaseToken(session.access_token);
          const newToken = exchangeRes?.data?.tokens?.accessToken;
          if (newToken) {
            const userData = await getCurrentUser(newToken);
            if (userData) {
              setUser(userData);
              recovered = true;
            }
          }
        }
      } catch {
        // ignore
      }

      if (!recovered) {
        // ONLY clear user if the backend explicitly returned a 401 or 403 authentication error!
        // Transient network errors, server restarts, offline mode must NOT log the user out!
        const status = Number(error?.status || error?.statusCode);
        const isAuthError = status === 401 || status === 403;
        if (isAuthError) {
          setUser(null);
          clearTokens();
        }
      }
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
      }
      // Note: do NOT clear tokens on Supabase "SIGNED_OUT" event!
      // Supabase emits SIGNED_OUT when background timers or tab suspend causes its own
      // 1-hour session to lapse, even though CampusSphere's backend JWT tokens (7-day / 90-day)
      // are still completely valid. Only explicit user logout should destroy the session.
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
