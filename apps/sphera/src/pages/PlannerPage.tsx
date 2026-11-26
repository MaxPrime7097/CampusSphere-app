import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck,
  Plus,
  Trash,
  Sparkle,
  CheckCircle,
  Circle,
  ArrowsClockwise,
  Clock,
  BookOpen,
  Cards,
  Question,
  Sliders,
  LinkSimple,
  X,
  Spinner,
  PencilSimple,
  CalendarBlank,
  Check,
} from '@phosphor-icons/react'
import {
  createPlannerSubject,
  updatePlannerSubject,
  deletePlannerSubject,
  generatePlannerPlan,
  rebalancePlannerPlan,
  togglePlannerTask,
  type StudySubjectItem,
  type RevisionTaskItem,
} from '../services/spheraApi'
import {
  usePlannerSubjectsQuery,
  usePlannerPlanQuery,
  useSessionsQuery,
  invalidateSpheraPlanner,
  invalidateSpheraSessions,
} from '../hooks/useSpheraQueries'
import { encodeHashId } from '../lib/hashids'

const COLOR_SWATCHES = [
  '#22c55e',
  '#06b6d4',
  '#8b5cf6',
  '#f59e0b',
  '#f43f5e',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
]

const WEEKDAYS = [
  { id: 1, short: 'Lun' },
  { id: 2, short: 'Mar' },
  { id: 3, short: 'Mer' },
  { id: 4, short: 'Jeu' },
  { id: 5, short: 'Ven' },
  { id: 6, short: 'Sam' },
  { id: 0, short: 'Dim' },
]

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

function formatDayHeading(iso: string): string {
  try {
    const [y, m, d] = iso.split('-').map(Number)
    const label = new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    return label.charAt(0).toUpperCase() + label.slice(1)
  } catch {
    return iso
  }
}

function getActionIcon(actionType: string) {
  if (actionType === 'flashcards') return <Cards weight="duotone" className="w-3.5 h-3.5 text-orange-400" />
  if (actionType === 'quiz') return <Question weight="duotone" className="w-3.5 h-3.5 text-rose-400" />
  return <BookOpen weight="duotone" className="w-3.5 h-3.5 text-cyan-400" />
}

export default function PlannerPage() {
  const navigate = useNavigate()
  const { data: subjects = [], isLoading: isLoadingSubjects } = usePlannerSubjectsQuery()
  const { data: plan, isLoading: isLoadingPlan } = usePlannerPlanQuery()
  const { data: rawSessions = [] } = useSessionsQuery()

  const availableSessions = useMemo(() => {
    return (rawSessions || [])
      .filter(
        (s: any) =>
          s.source_filename !== 'Discussion libre' &&
          s.source_filename !== '__sphera_standalone_chat__',
      )
      .map((s: any) => ({
        id: Number(s.id),
        title: s.resource_title || s.source_filename || `Cours #${s.id}`,
        subjectId: s.subject_id ?? null,
      }))
  }, [rawSessions])

  const [activeTab, setActiveTab] = useState<'calendar' | 'subjects'>('calendar')
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<number | 'all'>('all')
  const [onlyPending, setOnlyPending] = useState(false)

  // Plan settings
  const [dailyLoad, setDailyLoad] = useState<number>(plan?.dailyLoad ?? 2)
  const [restDays, setRestDays] = useState<number[]>(Array.isArray(plan?.restDays) ? plan!.restDays : [])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRebalancing, setIsRebalancing] = useState(false)
  const [togglingTaskId, setTogglingTaskId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Subject Add / Edit Form
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null)
  const [subjName, setSubjName] = useState('')
  const [subjExamDate, setSubjExamDate] = useState('')
  const [subjWeight, setSubjWeight] = useState(3)
  const [subjColor, setSubjColor] = useState(COLOR_SWATCHES[0])
  const [subjSessionIds, setSubjSessionIds] = useState<number[]>([])
  const [isSavingSubject, setIsSavingSubject] = useState(false)

  // Automatically show subjects setup tab when user has no plan yet
  const effectiveTab = !plan && !isLoadingPlan ? 'subjects' : activeTab

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type })
    setTimeout(() => setFeedback(null), 3500)
  }

  const resetSubjectForm = () => {
    setEditingSubjectId(null)
    setSubjName('')
    setSubjExamDate('')
    setSubjWeight(3)
    setSubjColor(COLOR_SWATCHES[subjects.length % COLOR_SWATCHES.length])
    setSubjSessionIds([])
  }

  const startEditSubject = (s: StudySubjectItem) => {
    setEditingSubjectId(s.id)
    setSubjName(s.name)
    setSubjExamDate(s.examDate || '')
    setSubjWeight(s.weight)
    setSubjColor(s.color || COLOR_SWATCHES[0])
    setSubjSessionIds(s.sessions.map((sess) => sess.id))
    setActiveTab('subjects')
  }

  const toggleSessionSelection = (id: number) => {
    setSubjSessionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjName.trim() || isSavingSubject) return
    setIsSavingSubject(true)
    try {
      if (editingSubjectId) {
        await updatePlannerSubject(editingSubjectId, {
          name: subjName.trim(),
          examDate: subjExamDate || null,
          weight: subjWeight,
          color: subjColor,
          sessionIds: subjSessionIds,
        })
        showToast('Matière mise à jour !')
      } else {
        await createPlannerSubject({
          name: subjName.trim(),
          examDate: subjExamDate || null,
          weight: subjWeight,
          color: subjColor,
          sessionIds: subjSessionIds,
        })
        showToast('Matière ajoutée !')
      }
      resetSubjectForm()
      invalidateSpheraPlanner()
      invalidateSpheraSessions()
    } catch (err: any) {
      showToast(err?.message || 'Erreur lors de la sauvegarde.', 'error')
    } finally {
      setIsSavingSubject(false)
    }
  }

  const handleDeleteSubject = async (id: number) => {
    try {
      await deletePlannerSubject(id)
      if (editingSubjectId === id) resetSubjectForm()
      invalidateSpheraPlanner()
      invalidateSpheraSessions()
      showToast('Matière supprimée.')
    } catch (err: any) {
      showToast(err?.message || 'Impossible de supprimer cette matière.', 'error')
    }
  }

  const handleGeneratePlan = async () => {
    if (subjects.length === 0 || isGenerating) return
    setIsGenerating(true)
    try {
      await generatePlannerPlan({ dailyLoad, restDays })
      invalidateSpheraPlanner()
      setActiveTab('calendar')
      showToast('Ton plan de révision est prêt !')
    } catch (err: any) {
      showToast(err?.message || 'Erreur lors de la génération du plan.', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRebalance = async (overrideLoad?: number, overrideRestDays?: number[]) => {
    if (!plan || isRebalancing) return
    setIsRebalancing(true)
    try {
      await rebalancePlannerPlan({
        dailyLoad: overrideLoad ?? dailyLoad,
        restDays: overrideRestDays ?? restDays,
      })
      invalidateSpheraPlanner()
      showToast('Plan rééquilibré à partir d’aujourd’hui !')
    } catch (err: any) {
      showToast(err?.message || 'Erreur lors du rééquilibrage.', 'error')
    } finally {
      setIsRebalancing(false)
    }
  }

  const handleToggleTask = async (task: RevisionTaskItem) => {
    if (togglingTaskId === task.id) return
    setTogglingTaskId(task.id)
    try {
      await togglePlannerTask(task.id, !task.isDone)
      invalidateSpheraPlanner()
    } finally {
      setTogglingTaskId(null)
    }
  }

  const toggleRestDay = (dayId: number) => {
    setRestDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : prev.length < 5 ? [...prev, dayId] : prev,
    )
  }

  const filteredDays = useMemo(() => {
    if (!plan) return []
    return plan.days
      .map((day) => {
        const tasks = day.tasks.filter((t) => {
          if (selectedSubjectFilter !== 'all' && t.subjectId !== selectedSubjectFilter) return false
          if (onlyPending && t.isDone) return false
          return true
        })
        return { ...day, tasks }
      })
      .filter((day) => day.tasks.length > 0)
  }, [plan, selectedSubjectFilter, onlyPending])

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-16">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Feedback toast */}
        {feedback && (
          <div
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
              feedback.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-sphera-green/10 border-sphera-green/30 text-sphera-green'
            }`}
          >
            <span>{feedback.text}</span>
            <button type="button" onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-sphera-border/60">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sphera-green/15 border border-sphera-green/30 flex items-center justify-center shrink-0 mt-0.5">
              <CalendarCheck weight="duotone" className="w-5 h-5 text-sphera-green" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight">
                Planificateur de Révision
              </h1>
              <p className="text-xs sm:text-sm text-sphera-text-muted mt-0.5">
                {plan
                  ? `Plan actif du ${formatDayHeading(plan.startDate)} au ${formatDayHeading(plan.endDate)} · ${plan.completedTasks}/${plan.totalTasks} séances (${plan.completionPct}%)`
                  : 'Organise tes matières, dates de partiels et cours pour un planning jour par jour.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {plan && (
              <button
                type="button"
                onClick={() => handleRebalance()}
                disabled={isRebalancing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
                title="Redistribuer proprement les tâches restantes à partir d'aujourd'hui"
              >
                <ArrowsClockwise className={`w-3.5 h-3.5 text-sphera-green ${isRebalancing ? 'animate-spin' : ''}`} />
                <span>{isRebalancing ? 'Rééquilibrage...' : 'Rééquilibrer'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab(effectiveTab === 'calendar' ? 'subjects' : 'calendar')}
              disabled={!plan}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sphera-green hover:bg-sphera-green-hover disabled:opacity-40 text-black font-semibold text-xs transition-colors cursor-pointer"
            >
              {effectiveTab === 'calendar' ? (
                <>
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Gérer mes matières</span>
                </>
              ) : (
                <>
                  <CalendarBlank className="w-3.5 h-3.5" />
                  <span>Voir le calendrier</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        {plan && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-sphera-surface-2/70 border border-sphera-border/70 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                effectiveTab === 'calendar'
                  ? 'bg-sphera-surface text-white border border-sphera-border shadow-sm'
                  : 'text-sphera-text-muted hover:text-white border border-transparent'
              }`}
            >
              Calendrier ({plan.days.length} j)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('subjects')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                effectiveTab === 'subjects'
                  ? 'bg-sphera-surface text-white border border-sphera-border shadow-sm'
                  : 'text-sphera-text-muted hover:text-white border border-transparent'
              }`}
            >
              Mes matières & rythme ({subjects.length})
            </button>
          </div>
        )}

        {/* ─── TAB 1: SUBJECTS & RYTHME SETUP ──────────────────── */}
        {effectiveTab === 'subjects' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Add / Edit Subject Form */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleSaveSubject}
                className="rounded-2xl border border-sphera-border bg-sphera-surface/90 p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">
                    {editingSubjectId ? 'Modifier la matière' : 'Ajouter une matière'}
                  </h2>
                  {editingSubjectId && (
                    <button
                      type="button"
                      onClick={resetSubjectForm}
                      className="text-xs text-sphera-text-muted hover:text-white cursor-pointer"
                    >
                      Annuler
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-sphera-text-muted">Nom de la matière *</label>
                  <input
                    type="text"
                    required
                    value={subjName}
                    onChange={(e) => setSubjName(e.target.value)}
                    placeholder="Ex: Algorithmique, Droit civil, Thermodynamique..."
                    className="w-full px-3.5 py-2 rounded-xl bg-sphera-surface-2 border border-sphera-border text-sm text-white placeholder-sphera-text-muted focus:outline-none focus:border-sphera-green"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-sphera-text-muted">Date d’examen (optionnel)</label>
                    <input
                      type="date"
                      value={subjExamDate}
                      onChange={(e) => setSubjExamDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-sphera-surface-2 border border-sphera-border text-xs text-white focus:outline-none focus:border-sphera-green"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-sphera-text-muted">
                      Priorité ({subjWeight}/5)
                    </label>
                    <div className="flex items-center gap-1 pt-1.5">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSubjWeight(lvl)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            subjWeight >= lvl
                              ? 'bg-sphera-green/20 border-sphera-green/50 text-sphera-green'
                              : 'bg-sphera-surface-2 border-sphera-border text-sphera-text-muted'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color swatches */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-sphera-text-muted">Couleur</label>
                  <div className="flex items-center gap-2">
                    {COLOR_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSubjColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                          subjColor === c ? 'ring-2 ring-white scale-110' : 'opacity-75 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {subjColor === c && <Check weight="bold" className="w-3 h-3 text-black" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Link existing StudySessions */}
                {availableSessions.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-sphera-text-muted flex items-center gap-1.5">
                      <LinkSimple className="w-3.5 h-3.5 text-sphera-green" />
                      <span>Rattacher des cours existants (optionnel)</span>
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {availableSessions.map((sess) => {
                        const checked = subjSessionIds.includes(sess.id)
                        return (
                          <button
                            key={sess.id}
                            type="button"
                            onClick={() => toggleSessionSelection(sess.id)}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs border transition-colors cursor-pointer ${
                              checked
                                ? 'bg-sphera-green/10 border-sphera-green/35 text-white'
                                : 'bg-sphera-surface-2/60 border-sphera-border/60 text-sphera-text-muted hover:text-white'
                            }`}
                          >
                            {checked ? (
                              <CheckCircle weight="fill" className="w-3.5 h-3.5 text-sphera-green shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="truncate">{sess.title}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!subjName.trim() || isSavingSubject}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sphera-surface-2 hover:bg-sphera-green hover:text-black border border-sphera-border hover:border-sphera-green text-white font-semibold text-xs transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isSavingSubject ? <Spinner className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{editingSubjectId ? 'Enregistrer les modifications' : 'Ajouter la matière'}</span>
                </button>
              </form>
            </div>

            {/* Right: Subjects List + Rythme + Generate CTA */}
            <div className="lg:col-span-7 space-y-5">
              {/* Subjects list */}
              <div className="rounded-2xl border border-sphera-border bg-sphera-surface/90 p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">
                    Tes matières ({subjects.length})
                  </h2>
                  {isLoadingSubjects && <Spinner className="w-4 h-4 animate-spin text-sphera-green" />}
                </div>

                {subjects.length === 0 ? (
                  <div className="py-8 text-center text-xs text-sphera-text-muted border border-dashed border-sphera-border rounded-xl px-4">
                    Commence par ajouter 1 à 6 matières à gauche (même une seule matière suffit pour lancer ton plan !).
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {subjects.map((s) => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-xl bg-sphera-surface-2/60 border border-sphera-border/70 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: s.color || '#22c55e' }}
                            />
                            <span className="text-sm font-bold text-white truncate">{s.name}</span>
                            {s.examDate && s.daysUntilExam !== null && s.daysUntilExam >= 0 && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s.daysUntilExam <= 3
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                    : 'bg-sphera-surface text-white/80 border border-sphera-border'
                                }`}
                              >
                                {s.daysUntilExam === 0 ? "Examen aujourd'hui" : `Examen dans ${s.daysUntilExam}j`}
                              </span>
                            )}
                            <span className="text-[11px] text-sphera-text-muted">Priorité {s.weight}/5</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-sphera-text-muted">
                            <span>
                              {s.sessionsCount === 0
                                ? 'Aucun cours rattaché'
                                : `${s.sessionsCount} cours rattaché${s.sessionsCount > 1 ? 's' : ''}`}
                            </span>
                            {s.progress.total > 0 && (
                              <>
                                <span>·</span>
                                <span className="text-sphera-green font-semibold">
                                  {s.progress.done}/{s.progress.total} séances ({s.progress.pct}%)
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditSubject(s)}
                            className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors cursor-pointer"
                            title="Modifier & lier des cours"
                          >
                            <PencilSimple className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(s.id)}
                            className="p-1.5 rounded-lg text-sphera-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Supprimer la matière"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rhythm & Generate Plan Box */}
              <div className="rounded-2xl border border-sphera-green/30 bg-gradient-to-br from-sphera-green/[0.06] to-sphera-surface/95 p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkle weight="duotone" className="w-4 h-4 text-sphera-green" />
                    <span>Rythme de révision</span>
                  </h3>
                  <p className="text-xs text-sphera-text-muted">
                    Sphera répartit automatiquement Fiche → Flashcards → Quiz en équilibrant tes dates d’examen.
                  </p>
                </div>

                {/* Daily Load */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 1, label: 'Léger', sub: '1 séance / j (~20 min)' },
                    { value: 2, label: 'Normal', sub: '2 séances / j (~45 min)' },
                    { value: 3, label: 'Intensif', sub: '3 séances / j (~1h15)' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDailyLoad(opt.value)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        dailyLoad === opt.value
                          ? 'bg-sphera-green/15 border-sphera-green text-white'
                          : 'bg-sphera-surface-2/60 border-sphera-border text-sphera-text-muted hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{opt.sub}</div>
                    </button>
                  ))}
                </div>

                {/* Rest days */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-sphera-text-muted">
                    Jours de repos optionnels (ignorés la veille d’un partiel)
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {WEEKDAYS.map((day) => {
                      const isOff = restDays.includes(day.id)
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleRestDay(day.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            isOff
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : 'bg-sphera-surface-2/70 border-sphera-border text-sphera-text-muted hover:text-white'
                          }`}
                        >
                          {day.short}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={subjects.length === 0 || isGenerating}
                  onClick={handleGeneratePlan}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sphera-green hover:bg-sphera-green-hover disabled:opacity-40 text-black font-bold text-sm transition-all shadow-sm cursor-pointer"
                >
                  {isGenerating ? (
                    <Spinner className="w-4 h-4 animate-spin" />
                  ) : (
                    <CalendarCheck weight="bold" className="w-4 h-4" />
                  )}
                  <span>
                    {isGenerating
                      ? 'Construction du plan...'
                      : plan
                        ? 'Régénérer mon plan de révision'
                        : 'Générer mon plan de révision'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: FULL DAY-BY-DAY CALENDAR ─────────────────── */}
        {effectiveTab === 'calendar' && plan && (
          <div className="space-y-5">
            {/* Progress Bar + Filters */}
            <div className="rounded-2xl border border-sphera-border bg-sphera-surface/90 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Progression globale du plan</span>
                <span className="font-bold text-sphera-green">
                  {plan.completedTasks}/{plan.totalTasks} séances ({plan.completionPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-sphera-surface-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${plan.completionPct}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedSubjectFilter('all')}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      selectedSubjectFilter === 'all'
                        ? 'bg-sphera-green text-black'
                        : 'bg-sphera-surface-2 text-sphera-text-muted hover:text-white border border-sphera-border'
                    }`}
                  >
                    Toutes
                  </button>
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSubjectFilter(s.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        selectedSubjectFilter === s.id
                          ? 'bg-sphera-surface-2 text-white border border-sphera-green'
                          : 'bg-sphera-surface-2/60 text-sphera-text-muted hover:text-white border border-sphera-border'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color || '#22c55e' }}
                      />
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-sphera-text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyPending}
                    onChange={(e) => setOnlyPending(e.target.checked)}
                    className="rounded border-sphera-border accent-sphera-green"
                  />
                  <span>À faire uniquement</span>
                </label>
              </div>
            </div>

            {/* Day cards */}
            <div className="space-y-3.5">
              {filteredDays.length === 0 ? (
                <div className="p-8 text-center text-sm text-sphera-text-muted rounded-2xl border border-dashed border-sphera-border">
                  Aucune séance à afficher avec ces filtres.
                </div>
              ) : (
                filteredDays.map((day) => (
                  <div
                    key={day.date}
                    className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                      day.isToday
                        ? 'border-sphera-green/45 bg-gradient-to-b from-sphera-green/[0.06] to-sphera-surface/95'
                        : 'border-sphera-border bg-sphera-surface/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-sphera-border/40">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{formatDayHeading(day.date)}</span>
                        {day.isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sphera-green text-black">
                            Aujourd’hui
                          </span>
                        )}
                        {day.isPast && day.doneCount < day.totalCount && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            En attente
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-sphera-text-muted font-medium">
                        {day.doneCount}/{day.totalCount} fait{day.doneCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {day.tasks.map((task) => {
                        const phase = PHASE_META[task.phase] || PHASE_META.decouverte
                        return (
                          <div
                            key={task.id}
                            className={`flex items-start sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                              task.isDone
                                ? 'bg-sphera-surface-2/30 border-sphera-border/40 opacity-70'
                                : 'bg-sphera-surface-2/65 border-sphera-border/70 hover:border-sphera-green/35'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleToggleTask(task)}
                                disabled={togglingTaskId === task.id}
                                className="mt-0.5 text-sphera-text-muted hover:text-sphera-green transition-colors shrink-0 cursor-pointer"
                              >
                                {togglingTaskId === task.id ? (
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
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/90">
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
                                          : 'bg-sphera-surface text-sphera-text-muted'
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

                            {!task.isDone && task.sessionId && (
                              <button
                                type="button"
                                onClick={() => {
                                  const hash = encodeHashId(task.sessionId!) || task.sessionId!
                                  const targetTool = task.actionType === 'relecture' ? 'fiche' : task.actionType
                                  navigate(`/sessions/${hash}?tool=${encodeURIComponent(targetTool)}`)
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sphera-surface hover:bg-sphera-green hover:text-black border border-sphera-border hover:border-sphera-green text-xs font-semibold text-white transition-all shrink-0 cursor-pointer"
                              >
                                {getActionIcon(task.actionType)}
                                <span>Y aller</span>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
