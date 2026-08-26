import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginWithCS } from '../services/spheraApi'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const { setUser } = useSpheraAuth()

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
            className="sphera-primary-btn w-full mt-6"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-sphera-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-sphera-bg text-sphera-text-muted">Ou</span>
          </div>
        </div>

        <button
          onClick={() => {
            const isLocal = ["localhost", "127.0.0.1"].some((host) => window.location.hostname.includes(host));
            const csUrl = isLocal ? "http://localhost:5173" : "https://campussphere.app";
            window.location.href = `${csUrl}/login?next=/sphera/sso`;
          }}
          className="w-full bg-white text-black hover:bg-gray-200 font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          Se connecter avec CampusSphere
        </button>

        <p className="text-center text-sm text-sphera-text-muted mt-6">
          Pas encore de compte ? <Link to="/register" className="text-sphera-green hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
