import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  Plus,
  LogOut,
  FileText,
  ExternalLink,
  Zap,
  FilePenLine,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Menu,
} from 'lucide-react'
import { useSpheraAuth } from '../../contexts/SpheraAuthContext'
import { getMyQuizSessions, getSessions, getAnnales } from '../../services/spheraApi'
import { QuotaIndicator } from '../app/QuotaIndicator'
import { SearchModal } from '../app/SearchModal'

export function SidebarLayout() {
  const { user, logout } = useSpheraAuth()
  const location = useLocation()
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [allSearchItems, setAllSearchItems] = useState<any[]>([])
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sphera_sidebar_collapsed') === 'true'
  })
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  const isLivePage = location.pathname.includes('/live')

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sphera_sidebar_collapsed', String(next))
      return next
    })
  }

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsSearchModalOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    Promise.all([
      getSessions().catch(() => ({ data: [] })),
      getAnnales().catch(() => ({ data: [] })),
      getMyQuizSessions().catch(() => ({ data: [] })),
    ]).then(([sessRes, annRes, quizRes]) => {
      const sess = (sessRes?.data || (Array.isArray(sessRes) ? sessRes : [])).map((s: any) => ({ ...s, _type: 'session' }))
      const ann = (annRes?.data || (Array.isArray(annRes) ? annRes : [])).map((a: any) => ({ ...a, _type: 'annale' }))
      const quiz = (quizRes?.data || (Array.isArray(quizRes) ? quizRes : [])).map((q: any) => ({ ...q, _type: 'quiz' }))

      // Combined items for search modal
      const combined = [...sess, ...ann, ...quiz].sort((a, b) => {
        const da = new Date(a.created_at || a.createdAt || 0).getTime()
        const db = new Date(b.created_at || b.createdAt || 0).getTime()
        return db - da
      })
      setAllSearchItems(combined)

      if (isLivePage) {
        setRecentSessions(quiz)
      } else {
        const standard = [...sess, ...ann].sort((a, b) => {
          const da = new Date(a.created_at || 0).getTime()
          const db = new Date(b.created_at || 0).getTime()
          return db - da
        })
        setRecentSessions(standard)
      }
    })
  }, [location.pathname, isLivePage])

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileDrawerOpen(false)
  }, [location.pathname, location.search])

  return (
    <div className="flex h-[100dvh] bg-sphera-bg overflow-hidden font-sans">
      {/* Mobile Top Header (Screens < md) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sphera-surface-2 border-b border-sphera-border px-4 flex items-center justify-between z-30">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img src="/sphera-logo-dark.png" alt="Sphera logo" className="h-7 w-auto" />
          <span className="font-display font-bold text-lg text-white tracking-tight">Sphera</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="p-2 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div
        className={`md:hidden fixed top-0 bottom-0 left-0 w-72 bg-sphera-surface-2 border-r border-sphera-border z-50 flex flex-col transition-transform duration-300 ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Drawer Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-sphera-border shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <img src="/sphera-logo-dark.png" alt="Sphera logo" className="h-7 w-auto" />
            <span className="font-display font-bold text-lg text-white tracking-tight">Sphera</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Drawer Content */}
        <div className="p-4 border-b border-sphera-border shrink-0 space-y-3">
          {/* Search Button */}
          <button
            type="button"
            onClick={() => {
              setMobileDrawerOpen(false)
              setIsSearchModalOpen(true)
            }}
            className="w-full bg-sphera-surface hover:bg-sphera-surface-2 border border-sphera-border rounded-xl px-3.5 py-2 text-xs text-sphera-text-muted hover:text-white transition-all flex items-center justify-between group shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-sphera-text-muted group-hover:text-sphera-green transition-colors" />
              <span>Rechercher...</span>
            </span>
            <kbd className="px-1.5 py-0.5 bg-sphera-bg border border-sphera-border rounded text-[9px] font-mono text-sphera-text-muted">
              ⌘K
            </kbd>
          </button>

          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 bg-sphera-green text-black font-semibold rounded-xl text-xs hover:bg-sphera-green-hover transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Générer une session</span>
          </Link>
          <Link
            to="/live"
            className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-lg border border-sphera-green/30 text-sphera-green hover:bg-sphera-green/10 transition-all text-xs font-medium sphera-live-pulse"
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>Sphera Live</span>
          </Link>
          <QuotaIndicator className="w-full justify-center" />
        </div>

        {/* Mobile Drawer Recents (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0 custom-scrollbar">
          <div className="px-2 mb-2 flex items-center justify-between text-[11px] font-semibold text-sphera-text-muted uppercase tracking-wider">
            <span>{isLivePage ? 'Quiz Récents' : 'Récents'}</span>
            {recentSessions.length > 0 && <span className="text-[10px] lowercase font-normal">{recentSessions.length}</span>}
          </div>

          <div className="space-y-1">
            {recentSessions.length === 0 ? (
              <div className="px-3 py-4 text-xs text-sphera-text-muted italic text-center">
                Aucun document
              </div>
            ) : (
              recentSessions.map(session => {
                const title = session.resource_title || session.title || session.source_filename || session.source_title || (session._type === 'annale' ? `Annale #${session.id}` : `Session #${session.id}`)
                if (isLivePage) {
                  return (
                    <Link
                      key={`quiz-m-${session.id}`}
                      to={`/live/host?code=${session.roomCode}&reset=1`}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors truncate ${
                        location.search.includes(`code=${session.roomCode}`)
                          ? 'bg-sphera-surface text-white'
                          : 'text-sphera-text-muted hover:bg-sphera-surface hover:text-white'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 shrink-0 text-sphera-green" />
                      <span className="truncate">{session.title || `Quiz #${session.roomCode}`}</span>
                    </Link>
                  )
                } else {
                  return (
                    <Link
                      key={`sess-m-${session._type}-${session.id}`}
                      to={`/${session._type === 'annale' ? 'annales' : 'sessions'}/${session.id}`}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors truncate ${
                        location.pathname === `/${session._type === 'annale' ? 'annales' : 'sessions'}/${session.id}`
                          ? 'bg-sphera-surface text-white'
                          : 'text-sphera-text-muted hover:bg-sphera-surface hover:text-white'
                      }`}
                    >
                      {session._type === 'annale' ? (
                        <FilePenLine className="w-3.5 h-3.5 shrink-0 text-orange-400" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                      )}
                      <span className="truncate">{title}</span>
                    </Link>
                  )
                }
              })
            )}
          </div>
        </div>

        {/* Mobile Drawer Footer */}
        <div className="p-3 border-t border-sphera-border bg-sphera-surface-2 shrink-0 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sphera-surface flex items-center justify-center text-xs font-bold border border-sphera-border text-white shrink-0">
              {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user?.first_name || user?.last_name
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                  : user?.username}
              </p>
              <button
                onClick={logout}
                className="text-[10px] text-sphera-text-muted hover:text-red-400 transition-colors flex items-center gap-1 mt-0.5"
              >
                <LogOut className="w-3 h-3" /> Déconnexion
              </button>
            </div>
          </div>
          <a
            href="https://campussphere.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-xs font-semibold text-white/90 bg-sphera-surface hover:bg-sphera-surface-2 border border-sphera-border py-1.5 px-3 rounded-lg transition-colors flex items-center justify-between group"
          >
            <span className="truncate">CampusSphere</span>
            <ExternalLink className="w-3 h-3 text-sphera-text-muted group-hover:text-white transition-colors" />
          </a>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`border-r border-sphera-border bg-sphera-surface-2 hidden md:flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header (Logo + Collapse Button) */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sphera-border shrink-0">
          {!isCollapsed ? (
            <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
              <img src="/sphera-logo-dark.png" alt="Sphera logo" className="h-8 w-auto shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-display font-bold text-lg text-white tracking-tight leading-none truncate">
                  Sphera
                </span>
                <span className="text-[10px] font-medium text-sphera-text-muted mt-1 opacity-70 truncate">
                  by CampusSphere
                </span>
              </div>
            </Link>
          ) : (
            <Link to="/dashboard" className="mx-auto" title="Sphera Dashboard">
              <img src="/sphera-logo-dark.png" alt="Sphera logo" className="h-7 w-auto" />
            </Link>
          )}

          <button
            type="button"
            onClick={toggleCollapse}
            className={`p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors ${
              isCollapsed ? 'hidden' : 'block'
            }`}
            title="Réduire la barre latérale"
            aria-label="Réduire la barre latérale"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsed Expand Trigger button */}
        {isCollapsed && (
          <div className="px-3 pt-3 flex justify-center shrink-0">
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors w-full flex justify-center"
              title="Agrandir la barre latérale"
              aria-label="Agrandir la barre latérale"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Section (Fixed): Search, Buttons, Quota */}
        <div className={`p-3 border-b border-sphera-border/50 shrink-0 ${isCollapsed ? 'space-y-2' : 'space-y-2.5'}`}>
          {!isCollapsed ? (
            <>
              {/* Search Button */}
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="w-full bg-sphera-surface hover:bg-sphera-surface-2 border border-sphera-border hover:border-sphera-green/50 rounded-xl px-3 py-2 text-xs text-sphera-text-muted hover:text-white transition-all flex items-center justify-between group shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-sphera-text-muted group-hover:text-sphera-green transition-colors" />
                  <span>Rechercher...</span>
                </span>
                <kbd className="inline-block px-1.5 py-0.5 bg-sphera-bg border border-sphera-border rounded text-[9px] font-mono text-sphera-text-muted group-hover:text-white">
                  ⌘K
                </kbd>
              </button>

              {/* Action Buttons (Compact height) */}
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-sphera-green text-black font-semibold rounded-xl text-xs hover:bg-sphera-green-hover transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Générer une session</span>
              </Link>

              <Link
                to="/live"
                className="flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg border border-sphera-green/30 text-sphera-green hover:bg-sphera-green/10 transition-all text-xs font-medium sphera-live-pulse"
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>Sphera Live</span>
              </Link>

              <QuotaIndicator className="w-full justify-center text-[11px] py-1.5" />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="w-10 h-10 rounded-xl bg-sphera-surface hover:bg-sphera-surface-2 border border-sphera-border flex items-center justify-center text-sphera-text-muted hover:text-white transition-colors"
                title="Rechercher (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
              </button>

              <Link
                to="/dashboard"
                className="w-10 h-10 rounded-xl bg-sphera-green hover:bg-sphera-green-hover text-black flex items-center justify-center shadow-sm transition-colors"
                title="Générer une session"
              >
                <Plus className="w-5 h-5" />
              </Link>

              <Link
                to="/live"
                className="w-10 h-10 rounded-xl border border-sphera-green/30 text-sphera-green hover:bg-sphera-green/10 flex items-center justify-center sphera-live-pulse transition-all"
                title="Sphera Live"
              >
                <Zap className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Middle Section (Récents): Independently Scrollable */}
        <div className="flex-1 overflow-y-auto px-2 py-3 min-h-0 custom-scrollbar">
          {!isCollapsed ? (
            <>
              <div className="px-2 mb-2 flex items-center justify-between text-[10px] font-semibold text-sphera-text-muted uppercase tracking-wider">
                <span>{isLivePage ? 'Quiz Récents' : 'Récents'}</span>
                {recentSessions.length > 0 && <span className="text-[10px] lowercase font-normal">{recentSessions.length}</span>}
              </div>

              <div className="space-y-1">
                {recentSessions.length === 0 ? (
                  <div className="px-2 py-4 text-xs text-sphera-text-muted italic text-center">
                    Aucun document
                  </div>
                ) : (
                  recentSessions.map(session => {
                    const title = session.resource_title || session.title || session.source_filename || session.source_title || (session._type === 'annale' ? `Annale #${session.id}` : `Session #${session.id}`)
                    if (isLivePage) {
                      return (
                        <Link
                          key={`quiz-${session.id}`}
                          to={`/live/host?code=${session.roomCode}&reset=1`}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${
                            location.search.includes(`code=${session.roomCode}`)
                              ? 'bg-sphera-surface text-white'
                              : 'text-sphera-text-muted hover:bg-sphera-surface hover:text-white'
                          }`}
                          title={session.title || `Quiz #${session.roomCode}`}
                        >
                          <Zap className="w-3.5 h-3.5 shrink-0 text-sphera-green" />
                          <span className="truncate">{session.title || `Quiz #${session.roomCode}`}</span>
                        </Link>
                      )
                    } else {
                      return (
                        <Link
                          key={`${session._type}-${session.id}`}
                          to={`/${session._type === 'annale' ? 'annales' : 'sessions'}/${session.id}`}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${
                            location.pathname === `/${session._type === 'annale' ? 'annales' : 'sessions'}/${session.id}`
                              ? 'bg-sphera-surface text-white'
                              : 'text-sphera-text-muted hover:bg-sphera-surface hover:text-white'
                          }`}
                          title={title}
                        >
                          {session._type === 'annale' ? (
                            <FilePenLine className="w-3.5 h-3.5 shrink-0 text-orange-400" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                          )}
                          <span className="truncate">{title}</span>
                        </Link>
                      )
                    }
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {recentSessions.slice(0, 10).map(session => {
                const isCurrent = isLivePage
                  ? location.search.includes(`code=${session.roomCode}`)
                  : location.pathname === `/${session._type === 'annale' ? 'annales' : 'sessions'}/${session.id}`
                const link = isLivePage
                  ? `/live/host?code=${session.roomCode}&reset=1`
                  : `/${session._type === 'annale' ? 'annales' : 'sessions'}/${session.id}`
                const title = session.resource_title || session.title || session.source_filename || session.source_title || `Doc #${session.id}`

                return (
                  <Link
                    key={`col-${session.id}`}
                    to={link}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      isCurrent ? 'bg-sphera-surface text-white' : 'text-sphera-text-muted hover:bg-sphera-surface hover:text-white'
                    }`}
                    title={title}
                  >
                    {isLivePage ? (
                      <Zap className="w-4 h-4 text-sphera-green" />
                    ) : session._type === 'annale' ? (
                      <FilePenLine className="w-4 h-4 text-orange-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-400" />
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom Section (Fixed): User Profile & Compact CampusSphere */}
        <div className="p-3 border-t border-sphera-border bg-sphera-surface-2 shrink-0 space-y-2">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sphera-surface flex items-center justify-center text-xs font-bold border border-sphera-border text-white shrink-0">
                  {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {user?.first_name || user?.last_name
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : user?.username}
                  </p>
                  <button
                    onClick={logout}
                    className="text-[10px] text-sphera-text-muted hover:text-red-400 transition-colors flex items-center gap-1 mt-0.5"
                  >
                    <LogOut className="w-3 h-3" /> Déconnexion
                  </button>
                </div>
              </div>

              {/* Compact CampusSphere Link */}
              <a
                href="https://campussphere.app"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-xs font-semibold text-white/90 bg-sphera-surface hover:bg-sphera-surface/80 border border-sphera-border py-1.5 px-3 rounded-lg transition-colors flex items-center justify-between group"
              >
                <span className="truncate">CampusSphere</span>
                <ExternalLink className="w-3 h-3 text-sphera-text-muted group-hover:text-white transition-colors" />
              </a>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-sphera-surface flex items-center justify-center text-xs font-bold border border-sphera-border text-white shrink-0"
                title={user?.username || 'Utilisateur'}
              >
                {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-sphera-text-muted hover:text-red-400 hover:bg-sphera-surface transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <a
                href="https://campussphere.app"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
                title="Ouvrir CampusSphere"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-sphera-bg relative pt-14 md:pt-0">
        <Outlet />
      </main>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        items={allSearchItems}
      />
    </div>
  )
}
