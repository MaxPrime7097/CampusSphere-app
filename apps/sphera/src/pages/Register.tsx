import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@cs/i18n'
import { registerOnSphera, getCurrentUser, setTokens, clearTokens } from '../services/spheraApi'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import { SpheraAuthSidePanel } from '../components/auth/SpheraAuthSidePanel'
import { openSsoPopup } from '@cs/sso'
import { Eye, EyeSlash as EyeOff, Spinner as Loader2, User, Envelope as Mail, Lock, WarningCircle as AlertCircle } from "@phosphor-icons/react";

export default function Register() {
  const { t } = useTranslation('auth')
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
  const [ssoLoading, setSsoLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const navigate = useNavigate()
  const { setUser } = useSpheraAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // ─── Classic Manual Registration ─────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirm_password) {
      setError(t('register.passwordMismatch'))
      return
    }

    if (formData.password.length < 6) {
      setError(t('register.passwordTooShort'))
      return
    }

    setLoading(true)
    try {
      const res = await registerOnSphera(formData)
      if (res) {
        setUser(res)
        navigate('/dashboard')
      } else {
        navigate('/login?registered=true')
      }
    } catch (err: any) {
      setError(err.message || t('register.defaultError'))
    } finally {
      setLoading(false)
    }
  }

  // ─── 1-Click CampusSphere SSO ─────────────────────────────────
  const handleCampusSphereSSO = async () => {
    setSsoLoading(true)
    setError(null)

    try {
      const tokens = await openSsoPopup()
      if (!tokens) {
        setSsoLoading(false)
        return
      }

      setTokens(tokens.access, tokens.refresh || "")
      const user = await getCurrentUser()
      setUser(user)
      navigate("/dashboard")
    } catch {
      clearTokens()
      setError(t('register.ssoError'))
      setSsoLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sphera-bg grid lg:grid-cols-2 overflow-hidden font-sans selection:bg-sphera-green/30">
      
      {/* ── Left Column: Auth Form ──────────────────────────────── */}
      <div className="flex flex-col justify-between p-6 sm:p-12 overflow-y-auto relative z-10">
        
        {/* Top Header Bar: Logo + Sélecteur de langue */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto pt-2 pb-6 border-b border-sphera-border/40 mb-6">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img src="/sphera-logo-dark.png" alt="Sphera logo" className="h-9 w-auto group-hover:scale-105 transition-transform" />
            <span className="font-display font-bold text-2xl tracking-tight text-white">Sphera</span>
            <span className="text-[10px] font-bold text-sphera-green bg-sphera-green/10 border border-sphera-green/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Bêta
            </span>
          </Link>

            <LanguageSwitcher variant="toggle" />
        </div>

        {/* Center Form Body */}
        <div className="w-full max-w-md mx-auto my-auto py-2">
          
          {/* Form Title */}
          <div className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
              {t('register.title')}
            </h1>
            <p className="text-sphera-text-muted text-xs sm:text-sm">
              {t('register.subtitle')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── 1-Click CampusSphere SSO Button ─────────────────── */}
          <div className="space-y-2 mb-6">
            <button
              type="button"
              onClick={handleCampusSphereSSO}
              disabled={ssoLoading}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-70 group border border-slate-200"
            >
              {ssoLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-700" />
                  <span className="text-xs sm:text-sm font-semibold">{t('register.ssoLoading')}</span>
                </>
              ) : (
                <>
                  <img src="/CS.svg" alt="CampusSphere" className="h-5 w-5 object-contain" />
                  <span className="text-xs sm:text-sm font-semibold">{t('register.ssoButton')}</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-sphera-text-muted">
              {t('register.ssoHint')}
            </p>
          </div>

          {/* ── Separator ──────────────────────────────────────── */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sphera-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 bg-sphera-bg text-sphera-text-muted font-medium">
                {t('register.orManual')}
              </span>
            </div>
          </div>

          {/* ── Form Inputs ────────────────────────────────────── */}
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-sphera-text-muted mb-1">
                  {t('register.firstNameLabel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sphera-text-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full bg-sphera-surface border border-sphera-border rounded-xl pl-10 pr-3.5 py-2 text-white text-sm focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all placeholder:text-neutral-600"
                    placeholder={t('register.firstNamePlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sphera-text-muted mb-1">
                  {t('register.lastNameLabel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sphera-text-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full bg-sphera-surface border border-sphera-border rounded-xl pl-10 pr-3.5 py-2 text-white text-sm focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all placeholder:text-neutral-600"
                    placeholder={t('register.lastNamePlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-sphera-text-muted mb-1">
                {t('register.usernameLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sphera-text-muted text-xs font-mono font-bold">
                  @
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-sphera-surface border border-sphera-border rounded-xl pl-10 pr-3.5 py-2 text-white text-sm focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all placeholder:text-neutral-600"
                  placeholder={t('register.usernamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-sphera-text-muted mb-1">
                {t('register.emailLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sphera-text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-sphera-surface border border-sphera-border rounded-xl pl-10 pr-3.5 py-2 text-white text-sm focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all placeholder:text-neutral-600"
                  placeholder={t('register.emailPlaceholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-sphera-text-muted mb-1">
                  {t('register.passwordLabel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sphera-text-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-sphera-surface border border-sphera-border rounded-xl pl-10 pr-10 py-2 text-white text-sm focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all placeholder:text-neutral-600"
                    placeholder={t('register.passwordPlaceholder')}
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
                <label className="block text-xs font-semibold text-sphera-text-muted mb-1">
                  {t('register.confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sphera-text-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm_password"
                    required
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="w-full bg-sphera-surface border border-sphera-border rounded-xl pl-10 pr-10 py-2 text-white text-sm focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all placeholder:text-neutral-600"
                    placeholder={t('register.confirmPasswordPlaceholder')}
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="sphera-primary-btn w-full py-2.5 mt-2 flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-sphera-green/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('register.submittingButton')}
                </>
              ) : (
                t('register.submitButton')
              )}
            </button>
          </form>

          <p className="text-center text-xs text-sphera-text-muted mt-5">
            {t('register.alreadyRegistered')}{' '}
            <Link to="/login" className="text-sphera-green font-semibold hover:underline">
              {t('register.loginLink')}
            </Link>
          </p>
        </div>

        {/* Bottom Legal / Links */}
        <div className="text-center text-[11px] text-sphera-text-muted max-w-md mx-auto w-full pt-4 border-t border-sphera-border/40">
          {t('legalAgreement.byContinuing')}{' '}
          <Link to="/terms" className="text-sphera-text hover:underline">{t('legalAgreement.terms')}</Link>{' '}
          {t('legalAgreement.and')}{' '}
          <Link to="/privacy" className="text-sphera-text hover:underline">{t('legalAgreement.privacy')}</Link>
        </div>
      </div>

      {/* ── Right Column: CampusSphere-Inspired Auth Side Panel ─── */}
      <SpheraAuthSidePanel />

    </div>
  )
}
