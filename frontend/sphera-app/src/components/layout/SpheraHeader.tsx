import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSpheraAuth } from '../../contexts/SpheraAuthContext'
import { LogOut, Menu, X, Zap, ArrowRight } from 'lucide-react'
import { QuotaIndicator } from '../app/QuotaIndicator'

export function SpheraHeader() {
  const { user, isAuthenticated, logout } = useSpheraAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sphera-border bg-sphera-bg/95 backdrop-blur-xl">
      {/* ── Top Announcement Banner for Sphera Live ── */}
      <div className="w-full bg-gradient-to-r from-sphera-green/10 via-sphera-green/20 to-sphera-green/10 border-b border-sphera-green/20 py-2 px-4 text-center">
        <Link 
          to="/sphera-live" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-white hover:text-sphera-green transition-colors group"
        >
          <span className="inline-flex items-center gap-1 bg-sphera-green text-black font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-sphera-green/40">
            <Zap className="w-3 h-3 fill-black" /> Nouveau
          </span>
          <span className="font-medium text-sphera-text">
            Sphera Live : Découvrez le quiz multijoueur en temps réel !
          </span>
          <span className="text-sphera-green font-semibold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Explorer <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>

      <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/sphera-logo-dark.png" alt="Sphera logo" className="h-8 md:h-10 w-auto" />
          <span className="font-display font-bold text-lg md:text-xl tracking-tight text-white">Sphera</span>
          <span className="text-[10px] font-bold text-sphera-green bg-sphera-green-glow px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
            Bêta
          </span>
        </Link>

        <div className="flex items-center gap-4 relative">
          {isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-4">
              <QuotaIndicator />
              <Link to="/dashboard" className="text-sm font-medium text-sphera-text-muted hover:text-white transition-colors">
                Dashboard
              </Link>
              <div className="flex items-center gap-3 pl-4 border-l border-sphera-border">
                <div className="w-8 h-8 rounded-full bg-sphera-surface-2 flex items-center justify-center text-sm font-bold border border-sphera-border text-white">
                  {user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-5">
              <Link 
                to="/sphera-live" 
                className="text-sm font-medium text-sphera-green hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-sphera-green" /> Sphera Live
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-sphera-text-muted hover:text-white transition-colors">
                Tarifs
              </Link>
              <Link to="/blogs" className="text-sm font-medium text-sphera-text-muted hover:text-white transition-colors">
                Blog
              </Link>
              <a href="https://campussphere.app" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sphera-text-muted hover:text-cs-orange transition-colors">
                CampusSphere
              </a>
              <Link to="/login" className="text-sm font-medium text-white hover:text-sphera-green transition-colors">
                Se connecter
              </Link>
              <Link to="/register" className="sphera-primary-btn text-sm py-2 px-4">
                Essayer gratuitement
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex items-center justify-center rounded-full border border-sphera-border bg-sphera-surface-2 p-2 text-sphera-text-muted hover:text-white transition-colors sm:hidden"
            aria-label="Ouvrir le menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-3xl border border-sphera-border bg-sphera-bg p-4 shadow-2xl shadow-black/20 sm:hidden">
              {isAuthenticated && user ? (
                <div className="space-y-3">
                  <Link
                    to="/sphera-live"
                    onClick={closeMenu}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-sphera-green hover:bg-sphera-surface transition-colors"
                  >
                    <Zap className="w-4 h-4 fill-sphera-green" /> Sphera Live
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-sphera-text-muted hover:bg-sphera-surface hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      closeMenu()
                    }}
                    className="w-full rounded-xl bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-400 transition-colors"
                  >
                    Se déconnecter
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/sphera-live"
                    onClick={closeMenu}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-sphera-green hover:bg-sphera-surface transition-colors"
                  >
                    <Zap className="w-4 h-4 fill-sphera-green" /> Sphera Live
                  </Link>
                  <Link
                    to="/pricing"
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-sphera-text-muted hover:bg-sphera-surface hover:text-white transition-colors"
                  >
                    Tarifs
                  </Link>
                  <Link
                    to="/blogs"
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-sphera-text-muted hover:bg-sphera-surface hover:text-white transition-colors"
                  >
                    Blog
                  </Link>
                  <a
                    href="https://campussphere.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-sphera-text-muted hover:bg-sphera-surface hover:text-white transition-colors"
                  >
                    CampusSphere
                  </a>
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-white hover:bg-sphera-green transition-colors"
                  >
                    Se connecter
                  </Link>
                  <Link
                    to="/app"
                    onClick={closeMenu}
                    className="block rounded-xl bg-sphera-primary px-3 py-2 text-sm font-medium text-white hover:bg-sphera-green transition-colors"
                  >
                    Essayer gratuitement
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
