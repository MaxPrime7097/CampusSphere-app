import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  CheckCircle,
  Circle,
  ArrowRight,
  Sparkle,
  Clock,
  ArrowsClockwise,
  BookOpen,
  Cards,
  Question,
  UploadSimple,
  Spinner,
} from '@phosphor-icons/react'
import {
  togglePlannerTask,
  rebalancePlannerPlan,
  type RevisionTaskItem,
} from '../../services/spheraApi'
import { usePlannerTodayQuery, invalidateSpheraPlanner } from '../../hooks/useSpheraQueries'
import { encodeHashId } from '../../lib/hashids'

const PHASE_META: Record<string, { label: string; className: string }> = {
  decouverte: {
    label: 'Comprendre',
    className: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
  },
  ancrage: {
    label: 'Ancrer',
    className: 'bg-orange-500/10 text-orange-300 border-orange-500/25',
  },
  validation: {
    label: 'Valider',
    className: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
  },
}

function getActionIcon(actionType: string) {
  if (actionType === 'flashcards') return <Cards weight="duotone" className="w-3.5 h-3.5 text-orange-400" />
  if (actionType === 'quiz') return <Question weight="duotone" className="w-3.5 h-3.5 text-rose-400" />
  return <BookOpen weight="duotone" className="w-3.5 h-3.5 text-cyan-400" />
}

function formatShortDate(iso: string): string {
  try {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return iso
  }
}

export function TodayWidget() {
  const navigate = useNavigate()
  const { data: today, isLoading } = usePlannerTodayQuery()
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [isRebalancing, setIsRebalancing] = useState(false)

  if (isLoading && !today) {
    return null
  }

  if (!today) return null

  const handleToggle = async (task: RevisionTaskItem) => {
    if (togglingId === task.id) return
    setTogglingId(task.id)
    try {
      await togglePlannerTask(task.id, !task.isDone)
      invalidateSpheraPlanner()
    } catch (err) {
      console.error('[planner] Failed to toggle task:', err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleRebalance = async () => {
    if (isRebalancing) return
    setIsRebalancing(true)
    try {
      await rebalancePlannerPlan()
      invalidateSpheraPlanner()
    } catch (err) {
      console.error('[planner] Failed to rebalance plan:', err)
    } finally {
      setIsRebalancing(false)
    }
  }

  const handleGoToTask = (task: RevisionTaskItem) => {
    if (task.sessionId) {
      const hash = encodeHashId(task.sessionId) || task.sessionId
      const targetTool = task.actionType === 'relecture' ? 'fiche' : task.actionType
      navigate(`/sessions/${hash}?tool=${encodeURIComponent(targetTool)}`)
    } else {
      navigate('/plan')
    }
  }

  // State A: No active plan yet — sleek, non-intrusive 1-row banner
  if (!today.hasPlan) {
    return (
      <div className="max-w-2xl mx-auto mb-6 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border border-sphera-green/25 bg-gradient-to-r from-sphera-green/8 via-sphera-surface-2/80 to-sphera-surface-2/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sphera-green/15 border border-sphera-green/30 flex items-center justify-center shrink-0">
              <CalendarCheck weight="duotone" className="w-5 h-5 text-sphera-green" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-white">
                Organise tes révisions jusqu’à tes partiels
              </p>
              <p className="text-[11px] sm:text-xs text-sphera-text-muted">
                Déclare tes matières et dates d’examen : Sphera planifie chaque jour fiche, flashcards et quiz.
              </p>
            </div>
          </div>

          <Link
            to="/plan"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-sphera-green hover:bg-sphera-green-hover text-black font-semibold text-xs transition-colors shrink-0"
          >
            <span>Créer mon plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  // State B: Active revision plan — proactive "Aujourd'hui" widget
  const doneToday = today.tasks.filter((t) => t.isDone).length
  const totalToday = today.tasks.length
  const allDoneToday = totalToday > 0 && doneToday === totalToday

  return (
    <div className="max-w-2xl mx-auto mb-8 px-4 sm:px-0">
      <div className="rounded-2xl border border-sphera-green/30 bg-gradient-to-b from-sphera-green/[0.06] to-sphera-surface-2/80 p-4 sm:p-5 space-y-3.5 shadow-sm">
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkle weight="duotone" className="w-4 h-4 text-sphera-green shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-sphera-green">
              Programme du jour
            </span>
            {totalToday > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sphera-surface border border-sphera-border text-white/85">
                {doneToday}/{totalToday} fait{doneToday > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <Link
            to="/plan"
            className="inline-flex items-center gap-1 text-xs font-semibold text-sphera-text-muted hover:text-sphera-green transition-colors"
          >
            <span>Voir mon plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Upcoming exam countdown pills */}
        {today.upcomingExams.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {today.upcomingExams.map((exam) => {
              const isUrgent = exam.daysUntilExam <= 3
              return (
                <span
                  key={exam.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                    isUrgent
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-sphera-surface/80 border-sphera-border/70 text-white/80'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: exam.color || '#22c55e' }}
                  />
                  <span className="truncate max-w-[140px]">{exam.name}</span>
                  <span className="font-bold">
                    {exam.daysUntilExam === 0 ? "Aujourd'hui" : `J-${exam.daysUntilExam}`}
                  </span>
                </span>
              )
            })}
          </div>
        )}

        {/* Guilt-free rebalance prompt if missed tasks from earlier days */}
        {today.overdueCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs">
            <span className="text-amber-200/90">
              {today.overdueCount} séance{today.overdueCount > 1 ? 's' : ''} des jours précédents en attente.
            </span>
            <button
              type="button"
              onClick={handleRebalance}
              disabled={isRebalancing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <ArrowsClockwise className={`w-3.5 h-3.5 ${isRebalancing ? 'animate-spin' : ''}`} />
              <span>{isRebalancing ? 'Rééquilibrage...' : 'Rééquilibrer'}</span>
            </button>
          </div>
        )}

        {/* Today's Tasks */}
        {totalToday === 0 ? (
          <div className="px-3.5 py-3 rounded-xl bg-sphera-surface/70 border border-sphera-border/60 text-xs text-sphera-text-muted flex items-center justify-between gap-2">
            <span>
              Journée légère — aucune séance prévue aujourd’hui
              {today.nextStudyDate ? ` (prochaine séance : ${formatShortDate(today.nextStudyDate)})` : ''}.
            </span>
            <Link to="/plan" className="text-sphera-green font-semibold hover:underline shrink-0">
              Ajuster
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {today.tasks.map((task) => {
              const phase = PHASE_META[task.phase] || PHASE_META.decouverte
              return (
                <div
                  key={task.id}
                  className={`flex items-start sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                    task.isDone
                      ? 'bg-sphera-surface/40 border-sphera-border/40 opacity-75'
                      : 'bg-sphera-surface/90 border-sphera-border/80 hover:border-sphera-green/35'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggle(task)}
                      disabled={togglingId === task.id}
                      className="mt-0.5 text-sphera-text-muted hover:text-sphera-green transition-colors shrink-0 cursor-pointer"
                      aria-label={task.isDone ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
                    >
                      {togglingId === task.id ? (
                        <Spinner className="w-4 h-4 animate-spin text-sphera-green" />
                      ) : task.isDone ? (
                        <CheckCircle weight="fill" className="w-4 h-4 text-sphera-green" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {task.subject && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/85">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: task.subject.color || '#22c55e' }}
                            />
                            <span>{task.subject.name}</span>
                          </span>
                        )}
                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold border ${phase.className}`}>
                          {phase.label}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-sphera-text-muted">
                          <Clock className="w-3 h-3" />
                          ~{task.estimatedMinutes} min
                        </span>
                        {task.sessionId && (
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[10px] font-medium ${
                              task.isReady
                                ? 'bg-sphera-green/10 text-sphera-green'
                                : 'bg-sphera-surface-2 text-sphera-text-muted'
                            }`}
                          >
                            {task.isReady ? 'Prêt · Gratuit' : 'À générer'}
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs sm:text-sm font-medium leading-snug ${
                          task.isDone ? 'line-through text-sphera-text-muted' : 'text-white'
                        }`}
                      >
                        {task.label}
                      </p>
                    </div>
                  </div>

                  {!task.isDone && (
                    <button
                      type="button"
                      onClick={() => handleGoToTask(task)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sphera-surface-2 hover:bg-sphera-green hover:text-black border border-sphera-border hover:border-sphera-green text-xs font-semibold text-white transition-all shrink-0 cursor-pointer"
                    >
                      {task.sessionId ? getActionIcon(task.actionType) : <UploadSimple className="w-3.5 h-3.5" />}
                      <span>{task.sessionId ? 'Y aller' : 'Lier'}</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {allDoneToday && (
          <div className="text-center text-xs font-semibold text-sphera-green pt-1">
            Bravo, tu as bouclé ton programme du jour !
          </div>
        )}
      </div>
    </div>
  )
}
