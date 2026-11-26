import React, { useEffect, useRef, useState } from 'react'
import {
  Tag,
  Check,
  Plus,
  X,
  CaretDown,
  Spinner,
} from '@phosphor-icons/react'
import {
  createPlannerSubject,
  linkSessionToSubject,
  type StudySubjectItem,
} from '../../services/spheraApi'
import {
  usePlannerSubjectsQuery,
  invalidateSpheraPlanner,
  invalidateSpheraSessions,
} from '../../hooks/useSpheraQueries'

interface SubjectPickerPillProps {
  /** Currently linked subject ID (controlled or synced with session). */
  value?: number | null
  /** If provided, changes persist directly to backend for this session. */
  sessionId?: string | number | null
  sessionType?: 'session' | 'annale'
  /** Optional callback when selection changes (used in CreateSession or parent state sync). */
  onChange?: (subjectId: number | null, subject: StudySubjectItem | null) => void
  /** Compact variant for top toolbars. */
  compact?: boolean
  align?: 'left' | 'right'
}

export function SubjectPickerPill({
  value = null,
  sessionId,
  sessionType = 'session',
  onChange,
  compact = false,
  align = 'left',
}: SubjectPickerPillProps) {
  const { data: subjects = [] } = usePlannerSubjectsQuery()
  const [selectedId, setSelectedId] = useState<number | null>(value ?? null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Quick inline creation inside popover
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newExamDate, setNewExamDate] = useState('')
  const [creating, setCreating] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedId(value ?? null)
  }, [value])

  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowCreate(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const activeSubject = subjects.find((s) => s.id === selectedId) || null

  const applySelection = async (nextId: number | null, subjectObj: StudySubjectItem | null) => {
    setSelectedId(nextId)
    onChange?.(nextId, subjectObj)
    setOpen(false)
    setShowCreate(false)

    if (sessionId) {
      setSaving(true)
      try {
        await linkSessionToSubject(sessionId, nextId, sessionType)
        invalidateSpheraPlanner()
        invalidateSpheraSessions()
      } catch (err) {
        console.error('[SubjectPickerPill] linkSessionToSubject failed:', err)
      } finally {
        setSaving(false)
      }
    }
  }

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed || creating) return
    setCreating(true)
    try {
      const res = await createPlannerSubject({
        name: trimmed,
        examDate: newExamDate || null,
        weight: 3,
      })
      const created = res?.data
      invalidateSpheraPlanner()
      setNewName('')
      setNewExamDate('')
      if (created?.id) {
        await applySelection(created.id, {
          id: created.id,
          name: created.name,
          examDate: created.examDate ?? null,
          daysUntilExam: null,
          weight: created.weight ?? 3,
          color: created.color || '#22c55e',
          createdAt: created.createdAt || new Date().toISOString(),
          sessionsCount: sessionId ? 1 : 0,
          sessions: [],
          progress: { done: 0, total: 0, pct: 0 },
        })
      }
    } catch (err) {
      console.error('[SubjectPickerPill] createPlannerSubject failed:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={saving}
        className={`inline-flex items-center gap-1.5 rounded-lg border transition-colors cursor-pointer ${
          compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        } ${
          activeSubject
            ? 'bg-sphera-surface border-sphera-border text-white hover:border-sphera-green/40'
            : 'bg-sphera-surface/70 border-sphera-border/70 text-sphera-text-muted hover:text-white hover:border-sphera-border'
        }`}
        title={activeSubject ? `Matière : ${activeSubject.name}` : 'Rattacher ce cours à une matière'}
      >
        {saving ? (
          <Spinner className="w-3 h-3 animate-spin text-sphera-green shrink-0" />
        ) : activeSubject ? (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: activeSubject.color || '#22c55e' }}
          />
        ) : (
          <Tag weight="duotone" className="w-3.5 h-3.5 text-sphera-green shrink-0" />
        )}
        <span className="truncate max-w-[130px] font-medium">
          {activeSubject ? activeSubject.name : compact ? 'Matière' : 'Rattacher à une matière'}
        </span>
        {activeSubject?.daysUntilExam !== null &&
          activeSubject?.daysUntilExam !== undefined &&
          activeSubject.daysUntilExam >= 0 && (
            <span className="text-[10px] font-bold text-sphera-green shrink-0">
              {activeSubject.daysUntilExam === 0 ? "Auj." : `J-${activeSubject.daysUntilExam}`}
            </span>
          )}
        <CaretDown className="w-3 h-3 opacity-60 shrink-0" />
      </button>

      {open && (
        <div
          className={`absolute top-full mt-1.5 z-50 w-64 rounded-xl border border-sphera-border bg-sphera-surface-2 shadow-2xl p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-sphera-text-muted">
            <span>Matière du cours</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="max-h-44 overflow-y-auto space-y-0.5 custom-scrollbar">
            {activeSubject && (
              <button
                type="button"
                onClick={() => applySelection(null, null)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors cursor-pointer"
              >
                <span>Aucune matière</span>
              </button>
            )}

            {subjects.length === 0 ? (
              <div className="px-2.5 py-2 text-[11px] text-sphera-text-muted">
                Aucune matière créée pour l’instant.
              </div>
            ) : (
              subjects.map((s) => {
                const isSelected = s.id === selectedId
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => applySelection(s.id, s)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sphera-green/15 text-white font-semibold'
                        : 'text-white/85 hover:bg-sphera-surface'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color || '#22c55e' }}
                      />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {s.daysUntilExam !== null && s.daysUntilExam >= 0 && (
                        <span className="text-[10px] text-sphera-text-muted">
                          {s.daysUntilExam === 0 ? "Auj." : `J-${s.daysUntilExam}`}
                        </span>
                      )}
                      {isSelected && <Check weight="bold" className="w-3.5 h-3.5 text-sphera-green" />}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          <div className="pt-1.5 border-t border-sphera-border/60">
            {!showCreate ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sphera-green hover:bg-sphera-green/10 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouvelle matière</span>
              </button>
            ) : (
              <form onSubmit={handleQuickCreate} className="space-y-2 p-1">
                <input
                  type="text"
                  autoFocus
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Algorithmique"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-sphera-surface border border-sphera-border text-xs text-white placeholder-sphera-text-muted focus:outline-none focus:border-sphera-green"
                />
                <input
                  type="date"
                  value={newExamDate}
                  onChange={(e) => setNewExamDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-sphera-surface border border-sphera-border text-[11px] text-white focus:outline-none focus:border-sphera-green"
                  title="Date d'examen (optionnel)"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-1.5 rounded-lg text-[11px] text-sphera-text-muted hover:text-white bg-sphera-surface border border-sphera-border cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!newName.trim() || creating}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-bold bg-sphera-green text-black hover:bg-sphera-green-hover disabled:opacity-40 cursor-pointer"
                  >
                    {creating ? '...' : 'Créer & lier'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
