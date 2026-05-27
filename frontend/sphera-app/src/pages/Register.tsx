import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerOnSphera } from '../services/spheraApi'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import { Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const navigate = useNavigate()
  const { setUser } = useSpheraAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirm_password) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    setLoading(true)
    try {
      const res = await registerOnSphera(formData)
      // login(res.user, res.tokens)
      // The API register saves tokens in localStorage automatically if successful
      if (res) {
        setUser(res)
        navigate('/dashboard')
      } else {
        // Fallback if the backend requires manual login after registration
        navigate('/login?registered=true')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte')
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
            Créer un compte
          </h1>
          <p className="text-sphera-text-muted text-sm">
            Rejoins Sphera et booste tes révisions
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-sphera-text-muted mb-1.5">Nom</label>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="w-full bg-sphera-bg border border-sphera-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sphera-text-muted mb-1.5">Prénom</label>
              <input
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="w-full bg-sphera-bg border border-sphera-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all"
                placeholder="Dupont"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-sphera-text-muted mb-1.5">Pseudo</label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-sphera-bg border border-sphera-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all"
              placeholder="jean237"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-sphera-text-muted mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-sphera-bg border border-sphera-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all"
              placeholder="jean@iuc.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sphera-text-muted mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
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

          <div>
            <label className="block text-sm font-medium text-sphera-text-muted mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                required
                value={formData.confirm_password}
                onChange={handleChange}
                className="w-full bg-sphera-bg border border-sphera-border rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sphera-text-muted hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="sphera-primary-btn w-full mt-6"
          >
            {loading ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>
        
        <p className="text-center text-sm text-sphera-text-muted mt-6">
          Déjà un compte ? <Link to="/login" className="text-sphera-green hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
