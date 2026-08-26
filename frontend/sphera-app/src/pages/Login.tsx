import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginWithCS, getCurrentUser, setTokens, clearTokens } from '../services/spheraApi'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

// ─── Known CampusSphere origins (for postMessage security) ──────
const CS_ORIGINS = [
  "https://campussphere.app",
  "https://www.campussphere.app",
  "http://localhost:5173",
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ssoLoading, setSsoLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const { setUser } = useSpheraAuth()

  // ─── Classic email/password login ─────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await loginWithCS(email, password)
      setUser(res)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  // ─── Popup SSO (Google-style) ─────────────────────────────────
  const handleCampusSphereSSO = () => {
    setSsoLoading(true)
    setError(null)

    const isLocal = ["localhost", "127.0.0.1"].some(h => window.location.hostname.includes(h))
    const myOrigin = window.location.origin
    const popupUrl = isLocal
      ? `http://localhost:5173/sso/popup?origin=${encodeURIComponent(myOrigin)}`
      : `https://campussphere.app/sso/popup?origin=${encodeURIComponent(myOrigin)}`

    // Center the popup on screen
    const w = 420, h = 520
    const left = window.screenX + (window.outerWidth - w) / 2
    const top = window.screenY + (window.outerHeight - h) / 2

    const popup = window.open(
      popupUrl,
      "cs_sso_popup",
      `width=${w},height=${h},left=${left},top=${top},resizable=no,scrollbars=no`,
    )

    // Listen for tokens from the popup
    const handler = async (e: MessageEvent) => {
      if (!CS_ORIGINS.includes(e.origin)) return
      if (e.data?.type !== "cs_sso" || !e.data.access) return

      window.removeEventListener("message", handler)
      clearInterval(checkClosed)

      // Store tokens and fetch user profile
      setTokens(e.data.access, e.data.refresh || "")
      try {
        const user = await getCurrentUser()
        setUser(user)
        navigate("/dashboard")
      } catch {
        clearTokens()
        setError("La connexion SSO a échoué. Réessaie.")
        setSsoLoading(false)
      }
    }

    window.addEventListener("message", handler)

    // Clean up if the popup is closed without completing auth
    const checkClosed = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkClosed)
        window.removeEventListener("message", handler)
        setSsoLoading(false)
      }
    }, 500)
  }

  // ─── UI ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-sphera-bg flex flex-col items-center justify-center p-4">
      <Link to="/" className="flex items-center gap-3 mb-8">
        <img src="/sphera-logo-dark.png" alt="Sphera logo" className="h-10 w-auto" />
        <span className="font-display font-bold text-3xl tracking-tight text-white">Sphera</span>
      </Link>

      <div className="sphera-card w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sphera-green to-transparent" />
        
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            Bon retour parmi nous
          </h1>
          <p className="text-sphera-text-muted text-sm">
            Connecte-toi avec ton compte CampusSphere
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* ── CampusSphere SSO Button (primary action) ─────────── */}
        <button
          onClick={handleCampusSphereSSO}
          disabled={ssoLoading}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-white/5 disabled:opacity-70 mb-6"
        >
          {ssoLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Connexion en cours…
            </>
          ) : (
            <>
              <img src="/sphera-logo-dark.png" alt="" className="h-5 w-5" />
              Se connecter avec CampusSphere
            </>
          )}
        </button>

        {/* ── Separator ──────────────────────────────────────── */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-sphera-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-[var(--sphera-card-bg,#1a1a2e)] text-sphera-text-muted">
              ou avec ton email
            </span>
          </div>
        </div>

        {/* ── Email / Password form ──────────────────────────── */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sphera-text-muted mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-sphera-bg border border-sphera-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all"
              placeholder="etudiant@iuc.edu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sphera-text-muted mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-sphera-bg border border-sphera-border rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sphera-text-muted hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="sphera-primary-btn w-full mt-2"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-sphera-text-muted mt-6">
          Pas encore de compte ? <Link to="/register" className="text-sphera-green hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
