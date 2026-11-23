import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LanguageSwitcher } from '@cs/i18n'
import { useTranslation } from 'react-i18next'
import { useSpheraAuth } from '../../contexts/SpheraAuthContext'
import { SignOut as LogOut, List as Menu, X, Lightning as Zap, ArrowRight, ArrowUpRight } from '@phosphor-icons/react'
import { QuotaIndicator } from '../app/QuotaIndicator'

export function SpheraHeader() {
  const { t } = useTranslation('landing')
  const { user, isAuthenticated, logout } = useSpheraAuth()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem('sphera_live_banner_dismissed') === '1'
    } catch {
      return false
    }
  })

  const closeMenu = () => setMenuOpen(false)

  const dismissBanner = () => {
    setBannerDismissed(true)
    try {
      sessionStorage.setItem('sphera_live_banner_dismissed', '1')
    } catch {
      // ignore storage errors
    }
  }

  const showAnnouncement = pathname === '/' && !bannerDismissed

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      pathname === path || (path !== '/' && pathname.startsWith(path))
        ? 'text-white'
        : 'text-sphera-text-muted hover:text-white'
    }`

  return (
    <>
      {/* ── Non-sticky dismissible announcement bar (Landing only) ── */}
      {showAnnouncement && (
        <div className="w-full border-b border-sphera-green/20 bg-[#0f1712] px-4 py-2 text-center relative">
          <div className="container mx-auto max-w-7xl flex items-center justify-center pr-8">
            <Link
              to="/sphera-live"
              className="inline-flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-sphera-text hover:text-white transition-colors group"
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-sphera-green/15 border border-sphera-green/30 text-sphera-green font-semibold text-[10px] px-2 py-0.5 uppercase tracking-wider">
                <Zap className="w-3 h-3" weight="fill" /> {t('header.liveBannerNew')}
              </span>
              <span className="text-sphera-text/90">{t('header.liveBannerText')}</span>
              <span className="text-sphera-green font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                {t('header.liveBannerAction')} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label={t('header.dismissBanner')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-sphera-text-muted hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-50 w-full border-b border-sphera-border/80 bg-sphera-bg/90 backdrop-blur-xl">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" onClick={closeMenu} className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/sphera_logo.svg"
              alt="Sphera"
              className="h-8 w-auto transition-transform duration-200 group-hover:scale-105"
            />
            <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-white">
              Sphera
            </span>
            <span className="text-[10px] font-mono font-semibold text-sphera-green bg-sphera-green/10 border border-sphera-green/25 px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
              {t('header.beta')}
            </span>
          </Link>

          {/* Center Nav (Desktop) */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Navigation principale">
            <Link
              to="/sphera-live"
              className={`text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                pathname === '/sphera-live'
                  ? 'text-sphera-green'
                  : 'text-sphera-green/90 hover:text-sphera-green'
              }`}
            >
              <Zap className="w-3.5 h-3.5" weight="fill" />
              {t('header.spheraLive')}
            </Link>
            <Link to="/pricing" className={navLinkClass('/pricing')}>
              {t('header.pricing')}
            </Link>
            <Link to="/blogs" className={navLinkClass('/blogs')}>
              {t('header.blog')}
            </Link>
            <a
              href="https://campussphere.app/cs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-sphera-text-muted hover:text-cs-orange transition-colors inline-flex items-center gap-1"
            >
              {t('header.campusSphere')}
              <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 relative">
            <LanguageSwitcher variant="minimal" />

            {isAuthenticated && user ? (
              <div className="hidden md:flex items-center gap-4">
                <QuotaIndicator />
                <Link
                  to="/app"
                  className="sphera-primary-btn text-xs sm:text-sm py-2 px-4 inline-flex items-center gap-1.5"
                >
                  {t('header.dashboard')}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <div className="flex items-center gap-2.5 pl-3 border-l border-sphera-border">
                  <div className="w-8 h-8 rounded-full bg-sphera-surface-2 flex items-center justify-center text-xs font-bold border border-sphera-border text-white">
                    {user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="p-1.5 rounded-lg text-sphera-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title={t('header.logout')}
                    aria-label={t('header.logout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-sphera-text hover:text-white transition-colors"
                >
                  {t('header.login')}
                </Link>
                <Link
                  to="/register"
                  className="sphera-primary-btn text-sm py-2 px-4 inline-flex items-center gap-1.5"
                >
                  {t('header.tryFree')}
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex items-center justify-center rounded-xl border border-sphera-border bg-sphera-surface p-2 text-sphera-text-muted hover:text-white hover:border-sphera-green/40 transition-colors md:hidden"
              aria-label={t('header.openMenu')}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Mobile Drawer */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-3 w-72 overflow-hidden rounded-2xl border border-sphera-border bg-[#121417]/98 backdrop-blur-xl p-4 shadow-2xl shadow-black/60 md:hidden">
                <div className="space-y-1.5">
                  <Link
                    to="/sphera-live"
                    onClick={closeMenu}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-sphera-green hover:bg-sphera-surface-2 transition-colors"
                  >
                    <Zap className="w-4 h-4" weight="fill" /> {t('header.spheraLive')}
                  </Link>
                  <Link
                    to="/pricing"
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-2.5 text-sm font-medium text-sphera-text hover:bg-sphera-surface-2 transition-colors"
                  >
                    {t('header.pricing')}
                  </Link>
                  <Link
                    to="/blogs"
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-2.5 text-sm font-medium text-sphera-text hover:bg-sphera-surface-2 transition-colors"
                  >
                    {t('header.blog')}
                  </Link>
                  <a
                    href="https://campussphere.app/cs"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMenu}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-sphera-text-muted hover:bg-sphera-surface-2 hover:text-cs-orange transition-colors"
                  >
                    <span>{t('header.campusSphere')}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>

                <div className="mt-3 pt-3 border-t border-sphera-border space-y-2">
                  {isAuthenticated && user ? (
                    <>
                      <Link
                        to="/app"
                        onClick={closeMenu}
                        className="sphera-primary-btn w-full py-2.5 text-sm flex items-center justify-center gap-2"
                      >
                        {t('header.dashboard')}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout()
                          closeMenu()
                        }}
                        className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        {t('header.logout')}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={closeMenu}
                        className="block w-full text-center rounded-xl border border-sphera-border bg-sphera-surface px-3 py-2.5 text-sm font-semibold text-white hover:border-sphera-green/40 transition-colors"
                      >
                        {t('header.login')}
                      </Link>
                      <Link
                        to="/register"
                        onClick={closeMenu}
                        className="sphera-primary-btn block w-full text-center py-2.5 text-sm"
                      >
                        {t('header.tryFree')}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
