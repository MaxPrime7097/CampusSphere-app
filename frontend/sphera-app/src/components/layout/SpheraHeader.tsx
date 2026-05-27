import React from 'react'
import { Link } from 'react-router-dom'
import { useSpheraAuth } from '../../contexts/SpheraAuthContext'
import { LogOut } from 'lucide-react'

export function SpheraHeader() {
  const { user, isAuthenticated, logout } = useSpheraAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sphera-border bg-sphera-bg/80 backdrop-blur-xl">
      <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/sphera-logo-dark.png" alt="Sphera logo" className="h-8 md:h-10 w-auto" />
          <span className="font-display font-bold text-lg md:text-xl tracking-tight text-white">Sphera</span>
          <span className="text-[10px] font-bold text-sphera-green bg-sphera-green-glow px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
            Bêta
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
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
                  <LogOut/>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/pricing" className="text-sm font-medium text-sphera-text-muted hover:text-white transition-colors hidden sm:block">
                Tarifs
              </Link>
              <Link to="/blogs" className="text-sm font-medium text-sphera-text-muted hover:text-white transition-colors hidden sm:block">
                Blog
              </Link>
              <a href="https://campussphere.app" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sphera-text-muted hover:text-cs-orange transition-colors hidden sm:block">
                CampusSphere
              </a>
              <Link to="/login" className="text-sm font-medium text-white hover:text-sphera-green transition-colors">
                Se connecter
              </Link>
              <Link to="/app" className="sphera-primary-btn text-sm py-2 px-4 hidden sm:inline-flex">
                Essayer gratuitement
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
