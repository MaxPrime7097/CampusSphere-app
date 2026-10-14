/**
 * SSO Popup — opened in a small popup window from Sphera.
 *
 * Flow:
 *  1. If the user is already authenticated on CampusSphere → immediately
 *     sends tokens via postMessage to window.opener (Sphera) and closes.
 *  2. Otherwise, shows a compact login form.  After a successful login
 *     the tokens are sent and the popup closes itself.
 */
import { useState, useEffect } from "react";
import { Spinner as Loader2, Eye, EyeSlash as EyeOff } from "@phosphor-icons/react";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "@/lib/supabase";
import { supabaseSignIn, exchangeSupabaseToken } from "@/services/api";
import { sendSsoTokens, isAllowedSpheraOrigin, SPHERA_ORIGINS } from "@cs/sso";

function getOpenerOrigin(): string {
  try {
    if (document.referrer) {
      const origin = new URL(document.referrer).origin;
      if (isAllowedSpheraOrigin(origin)) return origin;
    }
  } catch { /* ignore */ }
  // Fallback: check query param
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("origin") || "";
  if (isAllowedSpheraOrigin(requested)) return requested;
  return SPHERA_ORIGINS[0];
}

function sendTokensAndClose(access: string, refresh: string | null) {
  const origin = getOpenerOrigin();
  if (window.opener && !window.opener.closed) {
    try {
      sendSsoTokens(window.opener, origin, { access, refresh });
      setTimeout(() => window.close(), 200);
      return;
    } catch (e) {
      console.warn("window.opener postMessage failed, falling back to direct redirect:", e);
    }
  }
  // Fallback if window.opener was severed by browser cross-origin OAuth navigation
  window.location.href = `${origin}/login?sso_access=${encodeURIComponent(access)}&sso_refresh=${encodeURIComponent(refresh || "")}`;
}

export function SSOPopup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const origin = getOpenerOrigin();
      const redirectTo = `${window.location.origin}/sso/popup?origin=${encodeURIComponent(origin)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err?.message || "Erreur de connexion avec Google");
      setGoogleLoading(false);
    }
  };

  // On mount: check if the user is already logged in or returning from Google OAuth
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      // 1. Déjà connecté sur CampusSphere ?
      let access = localStorage.getItem("access");
      let refresh = localStorage.getItem("refresh");

      if (access) {
        sendTokensAndClose(access, refresh);
        return;
      }

      // 2. Vérifier si une session Supabase existe (ex: retour d'OAuth Google)
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session?.access_token && !sessionError) {
          const resp = await exchangeSupabaseToken(session.access_token);
          access = resp?.data?.tokens?.accessToken || localStorage.getItem("access");
          refresh = resp?.data?.tokens?.refreshToken || localStorage.getItem("refresh");
          if (access) {
            sendTokensAndClose(access, refresh);
            return;
          }
        }
      } catch (err: any) {
        console.error("SSOPopup supabase exchange error:", err);
      }

      // 3. Si demandé explicitement via ?provider=google et qu'on ne revient pas déjà d'un callback OAuth
      const params = new URLSearchParams(window.location.search);
      const isOAuthReturn = window.location.hash.includes("access_token") || params.has("code");
      if (params.get("provider") === "google" && !isOAuthReturn) {
        handleGoogleLogin();
        return;
      }

      if (isMounted) {
        setChecking(false);
      }
    };

    checkSession();

    // Écoute de l'événement Supabase au cas où l'échange de hash URL est asynchrone
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.access_token) {
        try {
          const resp = await exchangeSupabaseToken(session.access_token);
          const access = resp?.data?.tokens?.accessToken || localStorage.getItem("access");
          const refresh = resp?.data?.tokens?.refreshToken || localStorage.getItem("refresh");
          if (access) {
            sendTokensAndClose(access, refresh);
          }
        } catch (err) {
          console.error("SSOPopup onAuthStateChange exchange error:", err);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await supabaseSignIn(email, password);
      if (!data.session) throw new Error("Session introuvable");

      await exchangeSupabaseToken(data.session.access_token);

      const access = localStorage.getItem("access");
      const refresh = localStorage.getItem("refresh");

      if (access) {
        sendTokensAndClose(access, refresh);
      } else {
        throw new Error("Tokens introuvables après connexion");
      }
    } catch (err: any) {
      setError(err?.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading state while we check existing session ────────────
  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Connexion en cours…</p>
      </div>
    );
  }

  // ─── Compact login form ───────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-6">
          <img src="/CS.svg" alt="CampusSphere" className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
            CampusSphere
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connecte-toi pour accéder à Sphera
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full bg-card hover:bg-accent text-card-foreground font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-3 transition-all border border-input shadow-sm active:scale-[0.99] disabled:opacity-60 mb-5 group cursor-pointer"
        >
          {googleLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-foreground" />
              <span className="text-sm">Redirection vers Google…</span>
            </>
          ) : (
            <>
              <FcGoogle className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" />
              <span className="text-sm">Continuer avec Google</span>
            </>
          )}
        </button>

        {/* Separator */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-background px-3 text-xs text-muted-foreground uppercase font-medium">
            ou
          </span>
          <div className="border-t border-border w-full" />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="email@universite.edu"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 pr-10 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connexion…
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Connexion sécurisée via CampusSphere
        </p>
      </div>
    </div>
  );
}
