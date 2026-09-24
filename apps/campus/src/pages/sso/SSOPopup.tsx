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
import { Loader2, Eye, EyeOff } from "lucide-react";
import { supabaseSignIn, exchangeSupabaseToken } from "@/services/api";

const ALLOWED_ORIGINS = [
  "https://sphera.campussphere.app",
  "http://localhost:5174",
  "http://localhost:4173",
];

function getOpenerOrigin(): string {
  try {
    if (document.referrer) {
      const origin = new URL(document.referrer).origin;
      if (ALLOWED_ORIGINS.includes(origin)) return origin;
    }
  } catch { /* ignore */ }
  // Fallback: check query param
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("origin") || "";
  if (ALLOWED_ORIGINS.includes(requested)) return requested;
  return ALLOWED_ORIGINS[0];
}

function sendTokensAndClose(access: string, refresh: string | null) {
  const origin = getOpenerOrigin();
  if (window.opener) {
    window.opener.postMessage(
      { type: "cs_sso", access, refresh },
      origin,
    );
    setTimeout(() => window.close(), 200);
  }
}

export function SSOPopup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // On mount: check if the user is already logged in on CampusSphere.
  useEffect(() => {
    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");

    if (access) {
      sendTokensAndClose(access, refresh);
    } else {
      setChecking(false);
    }
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
