import React, { useState, useEffect, useRef } from 'react'
import {
  Brain,
  CalendarBlank,
  WarningCircle,
  Sparkle,
  Plus,
  X,
  CheckCircle,
  Spinner as Loader2,
} from '@phosphor-icons/react'
import {
  getChatLearningMemory,
  updateChatLearningMemory,
  type LearningMemorySnapshot,
} from '../../services/spheraApi'

interface LearningMemoryPopoverProps {
  onAskCoaching?: (prompt: string) => void
  onFeedback?: (message: string, type?: 'success' | 'error') => void
}

export function LearningMemoryPopover({ onAskCoaching, onFeedback }: LearningMemoryPopoverProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [memory, setMemory] = useState<LearningMemorySnapshot | null>(null)
  const [newNote, setNewNote] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchMemory = async () => {
    setLoading(true)
    try {
      const res = await getChatLearningMemory()
      if (res?.data) setMemory(res.data)
    } catch (err) {
      console.warn('[sphera-memory] Failed to load memory snapshot:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial lightweight fetch + cross-component sync when updated from Settings modal
  useEffect(() => {
    void fetchMemory()
    const onUpdated = () => {
      void fetchMemory()
    }
    window.addEventListener('sphera:memory-updated', onUpdated)
    return () => window.removeEventListener('sphera:memory-updated', onUpdated)
  }, [])

  // Refresh whenever opened so recent quiz/planner updates appear immediately
  useEffect(() => {
    if (open) {
      void fetchMemory()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const handleToggleEnabled = async () => {
    if (!memory || saving) return
    const nextEnabled = !memory.enabled
    setMemory({ ...memory, enabled: nextEnabled })
    setSaving(true)
    try {
      const res = await updateChatLearningMemory({ enabled: nextEnabled })
      if (res?.data) setMemory(res.data)
      onFeedback?.(
        nextEnabled ? 'Mémoire d’apprentissage activée.' : 'Mémoire d’apprentissage mise en pause.',
        'success',
      )
    } catch {
      setMemory({ ...memory, enabled: !nextEnabled })
      onFeedback?.('Impossible de mettre à jour la mémoire.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newNote.trim()
    if (!trimmed || !memory || saving) return
    if (memory.learningNotes.length >= 10) {
      onFeedback?.('Maximum 10 consignes mémorisées.', 'error')
      return
    }
    const nextNotes = [...memory.learningNotes, trimmed]
    setNewNote('')
    setMemory({ ...memory, learningNotes: nextNotes })
    setSaving(true)
    try {
      const res = await updateChatLearningMemory({ learningNotes: nextNotes })
      if (res?.data) setMemory(res.data)
    } catch {
      onFeedback?.("Erreur lors de l'enregistrement de la note.", 'error')
      void fetchMemory()
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveNote = async (idx: number) => {
    if (!memory || saving) return
    const nextNotes = memory.learningNotes.filter((_, i) => i !== idx)
    setMemory({ ...memory, learningNotes: nextNotes })
    setSaving(true)
    try {
      const res = await updateChatLearningMemory({ learningNotes: nextNotes })
      if (res?.data) setMemory(res.data)
    } catch {
      onFeedback?.('Impossible de supprimer cette consigne.', 'error')
      void fetchMemory()
    } finally {
      setSaving(false)
    }
  }

  const hasSignals = Boolean(
    memory &&
      (memory.upcomingExams.length > 0 ||
        memory.weakCourses.length > 0 ||
        memory.todayTasks.length > 0 ||
        memory.learningNotes.length > 0),
  )

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title={
          memory?.enabled === false
            ? 'Mémoire d’apprentissage en pause (cliquer pour gérer)'
            : 'Mémoire d’apprentissage adaptative — Sphera s’adapte à tes examens, lacunes et consignes'
        }
        className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
          open
            ? 'bg-sphera-green/15 border-sphera-green/45 text-white'
            : memory?.enabled === false
              ? 'bg-sphera-surface/60 border-sphera-border/60 text-sphera-text-muted hover:text-white'
              : 'bg-sphera-surface border-sphera-border text-white/90 hover:border-sphera-green/40 hover:text-white'
        }`}
      >
        <Brain
          weight={memory?.enabled !== false ? 'duotone' : 'regular'}
          className={`w-3.5 h-3.5 shrink-0 ${memory?.enabled !== false ? 'text-sphera-green' : 'text-sphera-text-muted'}`}
        />
        <span className="hidden sm:inline">Mémoire</span>
        {memory?.enabled !== false && hasSignals && (
          <span className="w-1.5 h-1.5 rounded-full bg-sphera-green shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-[340px] rounded-2xl border border-sphera-border bg-sphera-surface-2 shadow-2xl p-3.5 space-y-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header + Toggle */}
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-sphera-border/70">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Brain weight="duotone" className="w-4 h-4 text-sphera-green shrink-0" />
                <h3 className="text-xs font-bold text-white">Mémoire d&apos;apprentissage</h3>
              </div>
              <p className="text-[11px] text-sphera-text-muted mt-0.5 leading-snug">
                Sphera adapte ses explications à tes examens, tes lacunes et tes préférences.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={memory?.enabled ?? true}
              onClick={handleToggleEnabled}
              disabled={!memory || saving}
              title={memory?.enabled ? 'Désactiver la mémoire' : 'Activer la mémoire'}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                memory?.enabled !== false ? 'bg-sphera-green' : 'bg-sphera-border'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${
                  memory?.enabled !== false ? 'translate-x-4.5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {loading && !memory ? (
            <div className="flex items-center justify-center py-6 text-sphera-text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : memory ? (
            <div className={`space-y-3 ${!memory.enabled ? 'opacity-50' : ''}`}>
              {/* Synced automatic workspace signals */}
              <div className="space-y-2 max-h-44 overflow-y-auto pr-0.5 custom-scrollbar">
                {memory.upcomingExams.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sphera-text-muted flex items-center gap-1">
                      <CalendarBlank className="w-3 h-3 text-cyan-400" />
                      Prochains examens
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {memory.upcomingExams.map((exam) => (
                        <span
                          key={exam.id}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sphera-surface border border-sphera-border text-[11px] text-white/90"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: exam.color || '#22c55e' }}
                          />
                          <span className="truncate max-w-[140px]">{exam.name}</span>
                          <span className="text-[10px] font-semibold text-cyan-300">
                            {exam.daysUntil === 0 ? "Auj." : `J-${exam.daysUntil}`}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {memory.weakCourses.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sphera-text-muted flex items-center gap-1">
                      <WarningCircle className="w-3 h-3 text-amber-400" />
                      Notions à renforcer
                    </p>
                    <div className="space-y-1">
                      {memory.weakCourses.map((c) => (
                        <div
                          key={c.sessionId}
                          className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-sphera-surface border border-sphera-border/70 text-[11px]"
                        >
                          <span className="truncate text-white/90">{c.title}</span>
                          <span className="text-[10px] font-semibold text-amber-300 shrink-0">
                            {c.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {memory.todayTasks.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sphera-green/10 border border-sphera-green/25 text-[11px] text-sphera-green">
                    <CheckCircle weight="duotone" className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {memory.todayTasks.length} séance{memory.todayTasks.length > 1 ? 's' : ''} de révision prévue
                      {memory.todayTasks.length > 1 ? 's' : ''} aujourd&apos;hui
                    </span>
                  </div>
                )}

                {memory.upcomingExams.length === 0 &&
                  memory.weakCourses.length === 0 &&
                  memory.todayTasks.length === 0 && (
                    <p className="text-[11px] text-sphera-text-muted bg-sphera-surface/60 rounded-xl px-2.5 py-2 leading-relaxed">
                      Tes scores de quiz, flashcards et examens du planificateur s&apos;afficheront automatiquement ici.
                    </p>
                  )}
              </div>

              {/* Student-authored persistent memory notes */}
              <div className="space-y-1.5 pt-2 border-t border-sphera-border/70">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sphera-text-muted">
                  Mes consignes retenues ({memory.learningNotes.length}/10)
                </p>

                {memory.learningNotes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                    {memory.learningNotes.map((note, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sphera-surface border border-sphera-border text-[11px] text-white/90 max-w-full"
                      >
                        <span className="truncate">{note}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNote(idx)}
                          title="Oublier cette consigne"
                          className="text-sphera-text-muted hover:text-red-400 transition-colors cursor-pointer shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddNote} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    maxLength={140}
                    placeholder="Ex: Utilise des analogies visuelles..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-sphera-surface border border-sphera-border text-xs text-white placeholder-sphera-text-muted focus:outline-none focus:border-sphera-green"
                  />
                  <button
                    type="submit"
                    disabled={!newNote.trim() || saving || memory.learningNotes.length >= 10}
                    title="Ajouter une consigne"
                    className="p-1.5 rounded-lg bg-sphera-green text-black hover:bg-green-400 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* 1-click contextual coaching prompt */}
              {onAskCoaching &&
                memory.enabled &&
                (memory.upcomingExams.length > 0 ||
                  memory.weakCourses.length > 0 ||
                  memory.todayTasks.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      onAskCoaching(
                        'En te basant sur mes prochains examens, mes notions fragiles et mon planning du jour, que dois-je réviser en priorité aujourd’hui et comment m’organiser ?',
                      )
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sphera-green/12 hover:bg-sphera-green/20 border border-sphera-green/35 text-xs font-semibold text-sphera-green transition-colors cursor-pointer"
                  >
                    <Sparkle weight="duotone" className="w-3.5 h-3.5 shrink-0" />
                    <span>Que réviser en priorité aujourd&apos;hui ?</span>
                  </button>
                )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
