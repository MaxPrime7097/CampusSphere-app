import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Plus, SignOut as LogOut, FileText, ArrowSquareOut as ExternalLink, Lightning as Zap, NotePencil as FilePenLine, CaretLeft as ChevronLeft, CaretRight as ChevronRight, MagnifyingGlass as Search, X, List as Menu, Sliders, Question as HelpCircle, DotsThreeVertical as MoreVertical, BookOpen, Exam } from "@phosphor-icons/react";
import { useTranslation } from 'react-i18next'
import { useSpheraAuth } from '../../contexts/SpheraAuthContext'
import { getMyQuizSessions, getSessions, getAnnales } from '../../services/spheraApi'
import { QuotaIndicator } from '../app/QuotaIndicator'
import { SearchModal } from '../app/SearchModal'
import { SpheraSettingsModal } from '../settings/SpheraSettingsModal'
import { useSessionsQuery, useAnnalesQuery, useQuizSessionsQuery, invalidateSpheraSessions } from '../../hooks/useSpheraQueries'

interface UserProfileMenuProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: () => void
  user: any
  logout: () => void
  className?: string
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  user,
  logout,
  className = '',
}) => {
  const { t } = useTranslation('navigation')
  if (!isOpen) return null

  return (
    <>
      {/* Invisible backdrop to dismiss on click outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className={`z-50 bg-sphera-surface border border-sphera-border rounded-2xl shadow-2xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150 ${className}`}
        role="dialog"
        aria-label={t('sidebar.userMenuAria')}
      >
        {/* User identity & Close */}
        <div className="flex items-center justify-between pb-2 border-b border-sphera-border">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-sphera-border shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-sphera-surface-2 flex items-center justify-center text-xs font-bold border border-sphera-border text-white shrink-0">
                {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.first_name || user?.last_name
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                  : user?.username}
              </p>
              <p className="text-[10px] text-sphera-text-muted truncate">
                @{user?.username || 'etudiant'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors"
            title={t('sidebar.close')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Actions list */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              onClose()
              onOpenSettings()
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-white hover:bg-sphera-surface-2 hover:text-sphera-green transition-colors text-left group"
          >
            <div className="w-6 h-6 rounded-lg bg-sphera-green/10 text-sphera-green flex items-center justify-center shrink-0">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 truncate">
              <div className="font-semibold">{t('sidebar.settingsTitle')}</div>
              <div className="text-[10px] text-sphera-text-muted truncate">{t('sidebar.settingsDesc')}</div>
            </div>
          </button>

          <a
            href="https://campussphere.app"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-white hover:bg-sphera-surface-2 transition-colors text-left group"
          >
            <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 truncate">
              <div className="font-semibold">{t('sidebar.campusSphereTitle')}</div>
              <div className="text-[10px] text-sphera-text-muted truncate">{t('sidebar.campusSphereDesc')}</div>
            </div>
          </a>

          <a
            href="https://campussphere.app/contact"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-white hover:bg-sphera-surface-2 transition-colors text-left group"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 truncate">
              <div className="font-semibold">{t('sidebar.helpTitle')}</div>
              <div className="text-[10px] text-sphera-text-muted truncate">{t('sidebar.helpDesc')}</div>
            </div>
          </a>
        </div>

        {/* Logout */}
        <div className="pt-1.5 border-t border-sphera-border">
          <button
            type="button"
            onClick={() => {
              onClose()
              logout()
            }}
            className="w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('sidebar.logout')}</span>
          </button>
        </div>
      </div>
    </>
  )
}

export function SidebarLayout() {
  const { t } = useTranslation('navigation')
  const { user, logout } = useSpheraAuth()
  const location = useLocation()
  const isLivePage = location.pathname.includes('/live')

  const { data: rawSessions = [], isLoading: isLoadingSessions } = useSessionsQuery()
  const { data: rawAnnales = [], isLoading: isLoadingAnnales } = useAnnalesQuery()
  const { data: rawQuiz = [], isLoading: isLoadingQuiz } = useQuizSessionsQuery()

  const isLoadingRecent = isLivePage ? isLoadingQuiz : (isLoadingSessions || isLoadingAnnales)

  const { recentSessions, allSearchItems } = React.useMemo(() => {
    const sess = (rawSessions || []).map((s: any) => ({ ...s, _type: 'session' }))
    const ann = (rawAnnales || []).map((a: any) => ({ ...a, _type: 'annale' }))
    const quiz = (rawQuiz || []).map((q: any) => ({ ...q, _type: 'quiz' }))

    const combined = [...sess, ...ann, ...quiz].sort((a, b) => {
      const da = new Date(a.created_at || a.createdAt || 0).getTime()
      const db = new Date(b.created_at || b.createdAt || 0).getTime()
      return db - da
    })

    const standard = [...sess, ...ann].sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime()
      const db = new Date(b.created_at || 0).getTime()
      return db - da
    })

    return {
      recentSessions: isLivePage ? quiz : standard,
      allSearchItems: combined,
    }
  }, [rawSessions, rawAnnales, rawQuiz, isLivePage])

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sphera_sidebar_collapsed') === 'true'
  })
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

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

  // Listen to session events and invalidate TanStack Query
  useEffect(() => {
    const handleRefresh = () => {
      invalidateSpheraSessions()
    }
    window.addEventListener('sphera:session-created', handleRefresh)
    window.addEventListener('sphera:session-deleted', handleRefresh)

    return () => {
      window.removeEventListener('sphera:session-created', handleRefresh)
      window.removeEventListener('sphera:session-deleted', handleRefresh)
    }
  }, [])


  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileDrawerOpen(false)
  }, [location.pathname, location.search])

  const isSessionPage =
    location.pathname.startsWith('/sessions/') ||
    location.pathname.startsWith('/annales/') ||
    location.pathname.startsWith('/create')

  return (
    <div className="flex h-[100dvh] bg-sphera-bg overflow-hidden font-sans">
      {/* Mobile Top Header (Screens < md) - Hidden inside sessions so we don't have 3 stacked headers */}
      {!isSessionPage && (
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sphera-surface-2 border-b border-sphera-border px-4 flex items-center justify-between z-30">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <img src="/sphera_logo.svg" alt="Sphera logo" className="h-7 w-auto dark-logo" />
            <img src="/sphera_logo.svg" alt="Sphera logo" className="h-7 w-auto light-logo" />
            <span className="font-display font-bold text-lg text-white tracking-tight">Sphera</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
            aria-label={t('sidebar.openMenu')}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      )}

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
            <img src="/sphera_logo.svg" alt="Sphera logo" className="h-7 w-auto dark-logo" />
            <img src="/sphera_logo.svg" alt="Sphera logo" className="h-7 w-auto light-logo" />
            <span className="font-display font-bold text-lg text-white tracking-tight">Sphera</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
            aria-label={t('sidebar.closeMenu')}
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
              <span>{t('sidebar.searchPlaceholder')}</span>
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
            <span>{t('sidebar.generateSession')}</span>
          </Link>
          <Link
            to="/live"
            className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-lg border border-sphera-green/30 text-sphera-green hover:bg-sphera-green/10 transition-all text-xs font-medium sphera-live-pulse"
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>{t('sidebar.spheraLive')}</span>
          </Link>
          <QuotaIndicator className="w-full justify-center" align="left" />
        </div>

        {/* Mobile Drawer Recents (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0 custom-scrollbar">
          <div className="px-2 mb-2 flex items-center justify-between text-[11px] font-semibold text-sphera-text-muted uppercase tracking-wider">
            <span>{isLivePage ? t('sidebar.recentQuiz') : t('sidebar.recentSessions')}</span>
            {recentSessions.length > 0 && <span className="text-[10px] lowercase font-normal">{recentSessions.length}</span>}
          </div>

          <div className="space-y-1">
            {isLoadingRecent && recentSessions.length === 0 ? (
              <div className="space-y-2 px-1 py-1">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-sphera-surface/30 animate-pulse">
                    <div className="w-4 h-4 rounded bg-sphera-surface-2 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-sphera-surface-2 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="px-3 py-4 text-xs text-sphera-text-muted italic text-center">
                {t('sidebar.noDocuments')}
              </div>
            ) : (
              recentSessions.map(session => {
                const title = session.resource_title || session.title || session.source_filename || session.source_title || (session._type === 'annale' ? t('sidebar.annaleItem', { id: session.id }) : t('sidebar.sessionItem', { id: session.id }))
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
                      <span className="truncate">{session.title || t('sidebar.quizItem', { code: session.roomCode })}</span>
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
                        <Exam className="w-3.5 h-3.5 shrink-0 text-orange-400" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5 shrink-0 text-sphera-green" />
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
        <div className="p-3 border-t border-sphera-border bg-sphera-surface-2 shrink-0 relative">
          <UserProfileMenu
            isOpen={isUserMenuOpen}
            onClose={() => setIsUserMenuOpen(false)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            user={user}
            logout={logout}
            className="absolute bottom-full left-3 right-3 mb-2"
          />
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(prev => !prev)}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-all text-left group"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover border border-sphera-border shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-sphera-surface-2 flex items-center justify-center text-xs font-bold border border-sphera-border text-white shrink-0 group-hover:border-sphera-green/50 transition-colors">
                {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate group-hover:text-sphera-green transition-colors">
                {user?.first_name || user?.last_name
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                  : user?.username}
              </p>
              <p className="text-[10px] text-sphera-text-muted truncate">
                {t('sidebar.accountSettings')}
              </p>
            </div>
            <MoreVertical className="w-4 h-4 text-sphera-text-muted group-hover:text-white shrink-0" />
          </button>
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
              <img src="/sphera_logo.svg" alt="Sphera logo" className="h-8 w-auto shrink-0 dark-logo" />
              <img src="/sphera_logo.svg" alt="Sphera logo" className="h-8 w-auto shrink-0 light-logo" />
              <div className="flex flex-col min-w-0">
                <span className="font-display font-bold text-lg text-white tracking-tight leading-none truncate">
                  Sphera
                </span>
                <span className="text-[10px] font-medium text-sphera-text-muted mt-1 opacity-70 truncate">
                  {t('byCs')}
                </span>
              </div>
            </Link>
          ) : (
            <Link to="/dashboard" className="mx-auto" title="Sphera Dashboard">
              <img src="/sphera_logo.svg" alt="Sphera logo" className="h-7 w-auto dark-logo" />
              <img src="/sphera_logo.svg" alt="Sphera logo" className="h-7 w-auto light-logo" />
            </Link>
          )}

          <button
            type="button"
            onClick={toggleCollapse}
            className={`p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors ${
              isCollapsed ? 'hidden' : 'block'
            }`}
            title={t('sidebar.collapse')}
            aria-label={t('sidebar.collapse')}
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
              title={t('sidebar.expand')}
              aria-label={t('sidebar.expand')}
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
                  <span>{t('sidebar.searchPlaceholder')}</span>
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
                <span>{t('sidebar.generateSession')}</span>
              </Link>

              <Link
                to="/live"
                className="flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg border border-sphera-green/30 text-sphera-green hover:bg-sphera-green/10 transition-all text-xs font-medium sphera-live-pulse"
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>{t('sidebar.spheraLive')}</span>
              </Link>

              <QuotaIndicator className="w-full" align="left" />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="w-10 h-10 rounded-xl bg-sphera-surface hover:bg-sphera-surface-2 border border-sphera-border flex items-center justify-center text-sphera-text-muted hover:text-white transition-colors"
                title={t('sidebar.searchTooltip')}
              >
                <Search className="w-4 h-4" />
              </button>

              <Link
                to="/dashboard"
                className="w-10 h-10 rounded-xl bg-sphera-green hover:bg-sphera-green-hover text-black flex items-center justify-center shadow-sm transition-colors"
                title={t('sidebar.generateSession')}
              >
                <Plus className="w-5 h-5" />
              </Link>

              <Link
                to="/live"
                className="w-10 h-10 rounded-xl border border-sphera-green/30 text-sphera-green hover:bg-sphera-green/10 flex items-center justify-center sphera-live-pulse transition-all"
                title={t('sidebar.spheraLive')}
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
                <span>{isLivePage ? t('sidebar.recentQuiz') : t('sidebar.recentSessions')}</span>
                {recentSessions.length > 0 && <span className="text-[10px] lowercase font-normal">{recentSessions.length}</span>}
              </div>

              <div className="space-y-1">
                {isLoadingRecent && recentSessions.length === 0 ? (
                  <div className="space-y-2 px-1 py-1">
                    {[1, 2, 3, 4, 5].map(idx => (
                      <div key={idx} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-sphera-surface/30 animate-pulse">
                        <div className="w-3.5 h-3.5 rounded bg-sphera-surface-2 shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="h-3 bg-sphera-surface-2 rounded w-4/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentSessions.length === 0 ? (
                  <div className="px-2 py-4 text-xs text-sphera-text-muted italic text-center">
                    {t('sidebar.noDocuments')}
                  </div>
                ) : (
                  recentSessions.map(session => {
                    const title = session.resource_title || session.title || session.source_filename || session.source_title || (session._type === 'annale' ? t('sidebar.annaleItem', { id: session.id }) : t('sidebar.sessionItem', { id: session.id }))
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
                          title={session.title || t('sidebar.quizItem', { code: session.roomCode })}
                        >
                          <Zap className="w-3.5 h-3.5 shrink-0 text-sphera-green" />
                          <span className="truncate">{session.title || t('sidebar.quizItem', { code: session.roomCode })}</span>
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
                            <Exam className="w-3.5 h-3.5 shrink-0 text-orange-400" />
                          ) : (
                            <BookOpen className="w-3.5 h-3.5 shrink-0 text-sphera-green" />
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
              {isLoadingRecent && recentSessions.length === 0 ? (
                [1, 2, 3, 4].map(idx => (
                  <div key={idx} className="w-9 h-9 rounded-lg bg-sphera-surface/40 animate-pulse" />
                ))
              ) : (
                recentSessions.slice(0, 10).map(session => {
                  const isCurrent = isLivePage
                    ? location.search.includes(`code=${session.roomCode}`)
                    : location.pathname === `/${session._type === 'annale' ? 'annales' : 'sessions'}/${session.id}`
                  const link = isLivePage
                    ? `/live/host?code=${session.roomCode}&reset=1`
                    : `/${session._type === 'annale' ? 'annales' : 'sessions'}/${session.id}`
                  const title = session.resource_title || session.title || session.source_filename || session.source_title || t('sidebar.docItem', { id: session.id })

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
                        <Exam className="w-4 h-4 text-orange-400" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-sphera-green" />
                      )}
                    </Link>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Bottom Section (Fixed): User Profile Interactive Trigger */}
        <div className="p-3 border-t border-sphera-border bg-sphera-surface-2 shrink-0 relative">
          <UserProfileMenu
            isOpen={isUserMenuOpen}
            onClose={() => setIsUserMenuOpen(false)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            user={user}
            logout={logout}
            className={isCollapsed ? 'fixed bottom-4 left-20 w-64' : 'absolute bottom-full left-3 right-3 mb-2'}
          />
          {!isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 hover:bg-sphera-surface/90 transition-all text-left group"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-sphera-border shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-sphera-surface-2 flex items-center justify-center text-xs font-bold border border-sphera-border text-white shrink-0 group-hover:border-sphera-green/50 transition-colors">
                  {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate group-hover:text-sphera-green transition-colors">
                  {user?.first_name || user?.last_name
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : user?.username}
                </p>
                <p className="text-[10px] text-sphera-text-muted truncate">
                  {t('sidebar.accountSettings')}
                </p>
              </div>
              <MoreVertical className="w-4 h-4 text-sphera-text-muted group-hover:text-white shrink-0" />
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:ring-2 hover:ring-sphera-green/40"
                title={t('sidebar.myAccount')}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-9 h-9 rounded-full object-cover border border-sphera-border shadow-sm"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-sphera-surface flex items-center justify-center text-xs font-bold border border-sphera-border text-white">
                    {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 ${isSessionPage ? 'h-full flex flex-col min-h-0 overflow-hidden pt-0' : 'overflow-y-auto pt-14 md:pt-0'} bg-sphera-bg relative`}>
        <Outlet />
      </main>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        items={allSearchItems}
      />

      {/* Sphera Settings Modal */}
      <SpheraSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  )
}
