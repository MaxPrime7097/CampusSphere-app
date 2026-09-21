import React, { useMemo } from 'react'
import { Flame, Trophy, Sparkles, BookOpen, Layers } from 'lucide-react'
import type { SpheraStatsData } from '../../services/spheraApi'

interface ActivityStreakGridProps {
  stats: SpheraStatsData | null
  isLoading?: boolean
}

export const ActivityStreakGrid: React.FC<ActivityStreakGridProps> = ({ stats, isLoading }) => {
  // Generate 14 weeks of days ending today
  const { weeks, monthLabels } = useMemo(() => {
    const totalDays = 14 * 7
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find day of week (0 = Sun, 1 = Mon ... 6 = Sat)
    const todayDay = today.getDay()
    // Align so current week ends on today or Sunday
    const days: { dateStr: string; date: Date; count: number }[] = []

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const count = stats?.activity_grid?.[dateStr] || 0
      days.push({ dateStr, date: d, count })
    }

    // Split into weeks of 7 days
    const weekChunks: { dateStr: string; date: Date; count: number }[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weekChunks.push(days.slice(i, i + 7))
    }

    // Month labels for header
    const months: { label: string; colIndex: number }[] = []
    let lastMonth = -1
    weekChunks.forEach((week, wIdx) => {
      const firstDay = week[0]?.date
      if (firstDay && firstDay.getMonth() !== lastMonth) {
        lastMonth = firstDay.getMonth()
        months.push({
          label: firstDay.toLocaleDateString('fr-FR', { month: 'short' }),
          colIndex: wIdx,
        })
      }
    })

    return { weeks: weekChunks, monthLabels: months }
  }, [stats])

  if (isLoading) {
    return (
      <div className="p-6 rounded-xl border border-sphera-border bg-sphera-surface animate-pulse space-y-4">
        <div className="h-4 bg-sphera-surface-2 rounded w-1/3" />
        <div className="h-24 bg-sphera-surface-2 rounded" />
      </div>
    )
  }

  const currentStreak = stats?.current_streak ?? 0
  const longestStreak = stats?.longest_streak ?? 0
  const totalSessions = stats?.total_sessions ?? 0
  const favoriteTool = stats?.favorite_tool ? stats.favorite_tool.toUpperCase() : 'QUIZ'

  return (
    <div className="space-y-6">
      {/* Top 4 Stats Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-sphera-text-muted">
            <span>Streak actuel</span>
            <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-amber-500 fill-amber-500/20' : 'text-sphera-text-muted'}`} />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-white tracking-tight">{currentStreak}</span>
            <span className="text-xs text-sphera-text-muted ml-1">jour{currentStreak > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-sphera-text-muted">
            <span>Record personnel</span>
            <Trophy className="w-4 h-4 text-sphera-green" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-white tracking-tight">{longestStreak}</span>
            <span className="text-xs text-sphera-text-muted ml-1">jour{longestStreak > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-sphera-text-muted">
            <span>Sessions totales</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-white tracking-tight">{totalSessions}</span>
            <span className="text-xs text-sphera-text-muted ml-1">cours</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-sphera-text-muted">
            <span>Outil favori</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-sm font-semibold text-white tracking-tight truncate block">{favoriteTool}</span>
            <span className="text-[10px] text-sphera-text-muted">le plus généré</span>
          </div>
        </div>
      </div>

      {/* GitHub-style Contribution Grid */}
      <div className="p-4 rounded-xl border border-sphera-border bg-sphera-surface">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sphera-green" />
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Grille d'activité & révisions (14 dernières semaines)
            </h4>
          </div>
          <span className="text-xs text-sphera-text-muted">
            {currentStreak > 0 ? `${currentStreak} j d'affilée en cours` : 'Réviser aujourd\'hui pour démarrer un streak'}
          </span>
        </div>

        {/* Month labels */}
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="min-w-[420px]">
            <div className="grid grid-cols-14 gap-1.5 mb-1.5 pl-6 text-[10px] text-sphera-text-muted font-mono capitalize">
              {weeks.map((week, idx) => {
                const label = monthLabels.find(m => m.colIndex === idx)
                return (
                  <div key={`m-${idx}`} className="truncate">
                    {label ? label.label : ''}
                  </div>
                )
              })}
            </div>

            {/* 7 Days of the week row-by-row */}
            <div className="flex gap-1.5">
              {/* Day of week abbreviations */}
              <div className="flex flex-col justify-between text-[9px] text-sphera-text-muted font-mono pr-1 select-none py-0.5">
                <span>Lun</span>
                <span>Mer</span>
                <span>Ven</span>
                <span>Dim</span>
              </div>

              {/* Grid Columns */}
              <div className="flex-1 grid grid-cols-14 gap-1.5">
                {weeks.map((week, wIdx) => (
                  <div key={`w-${wIdx}`} className="flex flex-col gap-1.5">
                    {week.map((day) => {
                      let cellColor = 'bg-sphera-surface-2 border-sphera-border/50'
                      if (day.count === 1) cellColor = 'bg-emerald-500/30 border-emerald-500/40 text-emerald-300'
                      else if (day.count === 2) cellColor = 'bg-emerald-500/60 border-emerald-500/70 text-emerald-100'
                      else if (day.count >= 3) cellColor = 'bg-sphera-green border-sphera-green text-black font-bold shadow-[0_0_6px_rgba(34,197,94,0.35)]'

                      const formattedDate = day.date.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })

                      return (
                        <div
                          key={day.dateStr}
                          title={`${day.count} session${day.count > 1 ? 's' : ''} le ${formattedDate}`}
                          className={`w-full aspect-square rounded-[3px] border transition-all duration-150 hover:scale-125 cursor-pointer ${cellColor}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Legend */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-sphera-border/60 text-[11px] text-sphera-text-muted">
              <span>Chaque carré représente une journée d'entraînement ou de génération.</span>
              <div className="flex items-center gap-1.5">
                <span>Moins</span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-sphera-surface-2 border border-sphera-border/50 inline-block" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/30 border border-emerald-500/40 inline-block" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/60 border border-emerald-500/70 inline-block" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-sphera-green border border-sphera-green inline-block" />
                <span>Plus</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
