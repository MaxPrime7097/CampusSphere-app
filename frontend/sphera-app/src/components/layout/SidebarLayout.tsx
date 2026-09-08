import React, { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Plus, LogOut, FileText, ExternalLink, Zap } from 'lucide-react'
import { useSpheraAuth } from '../../contexts/SpheraAuthContext'
import { getMyQuizSessions } from '../../services/spheraApi'

export function SidebarLayout() {
  const { user, logout } = useSpheraAuth()
  const location = useLocation()
  const [recentSessions, setRecentSessions] = useState<any[]>([])

  useEffect(() => {
    getMyQuizSessions().then((res) => {
      const sess = res?.data || (Array.isArray(res) ? res : [])
      const all = [...sess].sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime()
        const db = new Date(b.createdAt || 0).getTime()
        return db - da
      })
      setRecentSessions(all.slice(0, 5))
    }).catch(() => setRecentSessions([]))
  }, [location.pathname]) // Refresh when navigating

  return (
    <div className="flex h-screen bg-sphera-bg overflow-hidden font-sans">
      
      {/* Sidebar (Desktop) */}
      <aside className="w-64 border-r border-sphera-border bg-sphera-surface-2 flex flex-col hidden md:flex">
        
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-sphera-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src="/sphera-logo-dark.png" alt="Sphera logo" className="h-8 w-auto" />
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl text-white tracking-tight leading-none">Sphera</span>
              <span className="text-[10px] font-medium text-sphera-text-muted mt-1 opacity-70">
                by CampusSphere
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-6">
          
          <div className="space-y-1">
            <Link 
              to="/dashboard"
              className="flex items-center gap-3 w-full px-4 py-3 bg-sphera-green text-black font-semibold rounded-xl text-sm hover:bg-sphera-green-hover transition-colors shadow-[0_0_15px_rgba(34,197,94,0.15)]"
            >
              <Plus className="w-5 h-5" /> Générer une session
            </Link>
            <Link to="/live" className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg border border-sphera-green/30 text-sphera-green hover:bg-sphera-green/10 transition-all text-sm font-medium sphera-live-pulse">
              <Zap className="w-4 h-4" />
              Sphera Live
            </Link>
          </div>

          {/* Récents */}
          <div>
            <div className="px-3 mb-2 text-xs font-semibold text-sphera-text-muted uppercase tracking-wider">
              Quiz Récents
            </div>
            <div className="space-y-1">
              {recentSessions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-sphera-text-muted italic">Aucun quiz</div>
              ) : (
                recentSessions.map(session => (
                  <Link 
                    key={`quiz-${session.id}`}
                    to={`/live/host?code=${session.roomCode}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                      location.search.includes(`code=${session.roomCode}`) ? 'bg-sphera-surface text-white' : 'text-sphera-text-muted hover:bg-sphera-surface hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">{session.title || `Quiz #${session.id}`}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
          <div className="mt-auto pt-4 px-1">
            {user?.is_profile_complete ? (
              <a 
                href="https://campussphere.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full text-sm font-semibold text-white bg-sphera-surface border border-sphera-border py-2.5 rounded-xl hover:bg-sphera-surface-2 transition-colors flex items-center justify-center gap-2"
              >
                Ouvrir CampusSphere <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <div className="bg-gradient-to-br from-cs-orange/10 to-transparent border border-cs-orange p-4 rounded-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-cs-orange/5 group-hover:bg-cs-orange/10 transition-colors" />
                <div className="relative z-10 flex flex-col items-start gap-1.5">
                  <p className="text-sm text-white font-medium leading-tight">Rejoins la communauté CampusSphere. Le réseau social qui connecte les étudiants.</p>
                  <a 
                    href="https://campussphere.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 text-xs font-semibold text-black bg-cs-orange px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
                  >
                    Découvrir CampusSphere <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-sphera-border bg-sphera-surface-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sphera-surface flex items-center justify-center text-sm font-bold border border-sphera-border text-white shrink-0">
              {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.first_name || user?.last_name 
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim() 
                  : user?.username}
              </p>
              <button 
                onClick={logout}
                className="text-xs text-sphera-text-muted hover:text-red-400 transition-colors flex items-center gap-1 mt-0.5"
              >
                <LogOut className="w-3 h-3" /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-sphera-bg relative">
        <Outlet />
      </main>
    </div>
  )
}
