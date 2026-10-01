import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flame, Trophy, Sparkle as Sparkles, BookOpen, Stack as Layers, Info } from "@phosphor-icons/react";
import type { SpheraStatsData } from '../../services/spheraApi'

interface ActivityStreakGridProps {
  stats: SpheraStatsData | null
  isLoading?: boolean
}

export const ActivityStreakGrid: React.FC<ActivityStreakGridProps> = ({ stats, isLoading }) => {
  const { t, i18n } = useTranslation('settings')
  const localeCode = i18n.language === 'en' ? 'en-US' : 'fr-FR'

  const getToolDisplayName = (toolKey: string): string => {
    switch (toolKey.toLowerCase()) {
      case 'fiche':
        return t('statsGrid.tools.fiche')
      case 'quiz':
        return t('statsGrid.tools.quiz')
      case 'flashcards':
        return t('statsGrid.tools.flashcards')
      case 'mindmap':
        return t('statsGrid.tools.mindmap')
      case 'audio':
        return t('statsGrid.tools.audio')
      default:
        return t('statsGrid.tools.quiz')
    }
  }

  // Generate 14 weeks of days ending today
  const { weeks, monthLabels } = useMemo(() => {
    const totalDays = 14 * 7
    const today = new Date()
    today.setHours(0, 0, 0, 0)

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
          label: firstDay.toLocaleDateString(localeCode, { month: 'short' }),
          colIndex: wIdx,
        })
      }
    })

    return { weeks: weekChunks, monthLabels: months }
  }, [stats, localeCode])

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
  const favoriteTool = getToolDisplayName(stats?.favorite_tool || 'quiz')

  return (
    <div className="space-y-6">
      {/* Top 4 Stats Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-sphera-text-muted">
            <span>{t('statsGrid.currentStreak')}</span>
            <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-amber-500 fill-amber-500/20' : 'text-sphera-text-muted'}`} />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-white tracking-tight">{currentStreak}</span>
            <span className="text-xs text-sphera-text-muted ml-1">{t('statsGrid.unitDay', { count: currentStreak })}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-sphera-text-muted">
            <span>{t('statsGrid.recordStreak')}</span>
            <Trophy className="w-4 h-4 text-sphera-green" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-white tracking-tight">{longestStreak}</span>
            <span className="text-xs text-sphera-text-muted ml-1">{t('statsGrid.unitDay', { count: longestStreak })}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-sphera-text-muted">
            <span>{t('statsGrid.totalSessions')}</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-white tracking-tight">{totalSessions}</span>
            <span className="text-xs text-sphera-text-muted ml-1">{t('statsGrid.unitCourse', { count: totalSessions })}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-sphera-text-muted">
            <span>{t('statsGrid.favoriteTool')}</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-xs font-semibold text-white tracking-tight truncate block">{favoriteTool}</span>
            <span className="text-[10px] text-sphera-text-muted">{t('statsGrid.mostUsed')}</span>
          </div>
        </div>
      </div>

      {/* Contribution Grid */}
      <div className="p-4 rounded-xl border border-sphera-border bg-sphera-surface">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sphera-green" />
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              {t('statsGrid.gridTitle')}
            </h4>
          </div>
          <span className="text-xs text-sphera-text-muted">
            {currentStreak > 0 
              ? t('statsGrid.consecutiveDays', { count: currentStreak }) 
              : t('statsGrid.startStreakToday')}
          </span>
        </div>

        {/* Scrollable grid container */}
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="min-w-[480px]">
            {/* Month labels */}
            <div className="flex gap-1.5 mb-1.5 pl-7 text-[10px] text-sphera-text-muted font-mono capitalize">
              {weeks.map((week, idx) => {
                const label = monthLabels.find(m => m.colIndex === idx)
                return (
                  <div key={`m-${idx}`} className="flex-1 truncate">
                    {label ? label.label : ''}
                  </div>
                )
              })}
            </div>

            {/* 7 Days of the week row-by-row */}
            <div className="flex gap-1.5 items-center">
              {/* Day of week abbreviations */}
              <div className="flex flex-col justify-between text-[9px] text-sphera-text-muted font-mono pr-1 select-none h-[112px] py-0.5">
                <span>{t('statsGrid.days.mon')}</span>
                <span>{t('statsGrid.days.wed')}</span>
                <span>{t('statsGrid.days.fri')}</span>
                <span>{t('statsGrid.days.sun')}</span>
              </div>

              {/* Flexbox Columns for all 14 weeks */}
              <div className="flex-1 flex gap-1.5">
                {weeks.map((week, wIdx) => (
                  <div key={`w-${wIdx}`} className="flex-1 flex flex-col gap-1.5">
                    {week.map((day) => {
                      let cellColor = 'bg-sphera-surface-2 border-sphera-border'
                      if (day.count === 1) cellColor = 'bg-emerald-500/30 border-emerald-500/50'
                      else if (day.count === 2) cellColor = 'bg-emerald-500/60 border-emerald-500/70'
                      else if (day.count >= 3) cellColor = 'bg-sphera-green border-sphera-green shadow-[0_0_6px_rgba(34,197,94,0.4)]'

                      const formattedDate = day.date.toLocaleDateString(localeCode, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })

                      return (
                        <div
                          key={day.dateStr}
                          title={t('statsGrid.dayTooltip', { count: day.count, date: formattedDate })}
                          className={`w-full aspect-square rounded-[3px] border transition-all duration-150 hover:scale-125 cursor-pointer ${cellColor}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Legend */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-sphera-border text-[11px] text-sphera-text-muted">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sphera-green" />
                {t('statsGrid.legendInfo')}
              </span>
              <div className="flex items-center gap-1.5">
                <span>{t('statsGrid.less')}</span>
                <span className="w-2.5 h-2.5 rounded-[2px] bg-sphera-surface-2 border border-sphera-border inline-block" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/30 border border-emerald-500/50 inline-block" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500/60 border border-emerald-500/70 inline-block" />
                <span className="w-2.5 h-2.5 rounded-[2px] bg-sphera-green border border-sphera-green inline-block" />
                <span>{t('statsGrid.more')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
