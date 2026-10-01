import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LanguageSwitcher } from '@cs/i18n'
import { useTranslation } from 'react-i18next'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import { logoutFromSphera } from '../services/spheraApi'

export function Navbar() {
  const { t } = useTranslation('navigation')
  const { user, isAuthenticated, logout } = useSpheraAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try { await logoutFromSphera() } catch {}
    logout()
    navigate('/')
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(13,13,15,0.85)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.25rem',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--brand), #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(34,197,94,0.35)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Sphera
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 600, color: 'var(--brand)',
            background: 'var(--brand-dim)', padding: '0.15rem 0.45rem', borderRadius: 4,
          }}>
            by CS
          </span>
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LanguageSwitcher variant="minimal" />

          {isAuthenticated && user ? (
            <>
              <Link to="/dashboard" className="btn btn-ghost btn-sm hide-mobile">
                {t('mySessions')}
              </Link>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-full)', padding: '0.3rem 0.75rem 0.3rem 0.3rem',
                    cursor: 'pointer', color: 'var(--text)',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: user.avatar
                      ? `url(${user.avatar}) center/cover`
                      : 'linear-gradient(135deg, var(--brand), #10b981)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.7rem', fontWeight: 700,
                  }}>
                    {!user.avatar && (user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                    {user.first_name || user.username}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {menuOpen && (
                  <div onClick={() => setMenuOpen(false)} style={{
                    position: 'fixed', inset: 0, zIndex: 49,
                  }} />
                )}
                {menuOpen && (
                  <div className="card animate-scale" style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: 200, zIndex: 50, padding: '0.5rem',
                  }}>
                    <Link
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      style={{ display: 'block', padding: '0.5rem 0.75rem', color: 'var(--text)', textDecoration: 'none', borderRadius: 8, fontSize: '0.875rem' }}
                    >
                      📚 {t('mySessions')}
                    </Link>
                    <a
                      href="https://campussphere.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      style={{ display: 'block', padding: '0.5rem 0.75rem', color: 'var(--text)', textDecoration: 'none', borderRadius: 8, fontSize: '0.875rem' }}
                    >
                      🌐 CampusSphere
                    </a>
                    <div className="divider" style={{ margin: '0.35rem 0' }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '0.5rem 0.75rem', color: 'var(--red)', background: 'none',
                        border: 'none', cursor: 'pointer', borderRadius: 8, fontSize: '0.875rem',
                      }}
                    >
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/app" className="btn btn-ghost btn-sm hide-mobile">
                {t('generator')}
              </Link>
              <a
                href="https://campussphere.app"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm hide-mobile"
              >
                CampusSphere
              </a>
              <Link to="/login" className="btn btn-primary btn-sm">
                {t('login')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
