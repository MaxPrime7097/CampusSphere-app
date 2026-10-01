import React, { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@cs/i18n'
import { loginWithCS, getCurrentUser, setTokens, clearTokens } from '../services/spheraApi'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import { SpheraAuthSidePanel } from '../components/auth/SpheraAuthSidePanel'
import { openSsoPopup } from '@cs/sso'
import { Eye, EyeSlash as EyeOff, Spinner as Loader2, Envelope as Mail, Lock, CheckCircle as CheckCircle2, WarningCircle as AlertCircle } from "@phosphor-icons/react";

export default function Login() {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ssoLoading, setSsoLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { setUser } = useSpheraAuth()

  const isRegisteredSuccess = new URLSearchParams(location.search).get('registered') === 'true'

  // ─── Classic email/password login ─────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await loginWithCS(email, password)
      setUser(res)
      if (rememberMe) {
        localStorage.setItem("sphera_remember_email", email)
      }
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || t('login.defaultError'))
    } finally {
      setLoading(false)
    }
  }

  // ─── Popup SSO (Google-style) ─────────────────────────────────
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
      setError(t('login.ssoError'))
      setSsoLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sphera-bg grid lg:grid-cols-2 overflow-hidden font-sans selection:bg-sphera-green/30">
      
      {/* ── Left Column: Auth Form ──────────────────────────────── */}
      <div className="flex flex-col justify-between p-6 sm:p-12 overflow-y-auto relative z-10">
        
        {/* Top Header Bar: Logo + Sélecteur de langue */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto pt-2 pb-6 border-b border-sphera-border/40 mb-8">
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
          <div className="mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
              {t('login.title')}
            </h1>
            <p className="text-sphera-text-muted text-xs sm:text-sm">
              {t('login.subtitle')}
            </p>
          </div>

          {/* Success message from registration */}
          {isRegisteredSuccess && (
            <div className="mb-6 p-3.5 rounded-xl bg-sphera-green/10 border border-sphera-green/30 text-sphera-green text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{t('login.registeredSuccess')}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── CampusSphere SSO Button (Primary Action) ─────────── */}
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
                  <span className="text-xs sm:text-sm font-semibold">{t('login.ssoLoading')}</span>
                </>
              ) : (
                <>
                  <img src="/CS.svg" alt="CampusSphere" className="h-5 w-5 object-contain" />
                  <span className="text-xs sm:text-sm font-semibold">{t('login.ssoButton')}</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-sphera-text-muted">
              {t('login.ssoHint')}
            </p>
          </div>

          {/* ── Separator ──────────────────────────────────────── */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sphera-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 bg-sphera-bg text-sphera-text-muted font-medium">
                {t('login.orCredentials')}
              </span>
            </div>
          </div>

          {/* ── Email / Password Form ──────────────────────────── */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-sphera-text-muted mb-1.5">
                {t('login.emailLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sphera-text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-sphera-surface border border-sphera-border rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all placeholder:text-neutral-600"
                  placeholder={t('login.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-sphera-text-muted">
                  {t('login.passwordLabel')}
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sphera-text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-sphera-surface border border-sphera-border rounded-xl pl-10 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-sphera-green focus:ring-1 focus:ring-sphera-green transition-all placeholder:text-neutral-600"
                  placeholder={t('login.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-sphera-text-muted hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-sphera-text-muted select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-sphera-border bg-sphera-surface text-sphera-green focus:ring-sphera-green"
                />
                {t('login.rememberMe')}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="sphera-primary-btn w-full py-3 mt-2 flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-sphera-green/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('login.submittingButton')}
                </>
              ) : (
                t('login.submitButton')
              )}
            </button>
          </form>

          <p className="text-center text-xs text-sphera-text-muted mt-6">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-sphera-green font-semibold hover:underline">
              {t('login.registerLink')}
            </Link>
          </p>
        </div>

        {/* Bottom Legal / Links */}
        <div className="text-center text-[11px] text-sphera-text-muted max-w-md mx-auto w-full pt-6 border-t border-sphera-border/40">
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
