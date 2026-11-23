import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Sparkle, Square, X, Copy, Check, Note, ArrowClockwise } from '@phosphor-icons/react'
import { streamAskQuestion } from '../../services/spheraApi'
import { MarkdownRenderer } from './MarkdownRenderer'
import { normalizeAiResponse } from '../../utils/normalizeAiResponse'

export function stripSuggestionsBlock(raw: string): string {
  if (!raw) return ''
  // Remove complete [SUGGESTIONS]...[/SUGGESTIONS] block
  let cleaned = raw.replace(/\[SUGGESTIONS\][\s\S]*?(?:\[\/SUGGESTIONS\]|$)/gi, '')
  // Also trim any partial opening tag being streamed at the very end (e.g. "[SUG", "[SUGGEST")
  cleaned = cleaned.replace(/\[(?:S(?:U(?:G(?:G(?:E(?:S(?:T(?:I(?:O(?:N(?:S)?)?)?)?)?)?)?)?)?)?)?$/i, '')
  return cleaned.trimEnd()
}

export interface InlineAskEntry {
  prompt: string
  answer: string
  isStreaming: boolean
  error: string | null
  title?: string
}

export function useInlineSpheraAsk({
  sessionId,
  sessionType = 'session',
}: {
  sessionId?: string | number | null
  sessionType?: 'session' | 'annale'
}) {
  const [entries, setEntries] = useState<Record<string, InlineAskEntry>>({})
  const controllersRef = useRef<Record<string, AbortController>>({})

  useEffect(() => {
    return () => {
      Object.values(controllersRef.current).forEach((c) => c.abort())
      controllersRef.current = {}
    }
  }, [])

  const stop = useCallback((key: string) => {
    const ctrl = controllersRef.current[key]
    if (ctrl) {
      ctrl.abort()
      delete controllersRef.current[key]
    }
    setEntries((prev) => {
      const existing = prev[key]
      if (!existing) return prev
      return {
        ...prev,
        [key]: { ...existing, isStreaming: false },
      }
    })
  }, [])

  const close = useCallback((key: string) => {
    const ctrl = controllersRef.current[key]
    if (ctrl) {
      ctrl.abort()
      delete controllersRef.current[key]
    }
    setEntries((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const ask = useCallback(
    async (key: string, prompt: string, title?: string) => {
      if (!sessionId) return false

      // Abort previous stream for this key if any
      if (controllersRef.current[key]) {
        controllersRef.current[key].abort()
      }
      const controller = new AbortController()
      controllersRef.current[key] = controller

      setEntries((prev) => ({
        ...prev,
        [key]: {
          prompt,
          answer: '',
          isStreaming: true,
          error: null,
          title,
        },
      }))

      let streamedText = ''
      try {
        const res = await streamAskQuestion(
          sessionId,
          prompt,
          sessionType,
          (token) => {
            streamedText += token
            const cleanStream = stripSuggestionsBlock(streamedText)
            setEntries((prev) => {
              const cur = prev[key]
              if (!cur) return prev
              return {
                ...prev,
                [key]: { ...cur, answer: cleanStream, isStreaming: true, error: null },
              }
            })
          },
          controller.signal,
          { ephemeral: true }
        )

        const finalAnswer = stripSuggestionsBlock(normalizeAiResponse(streamedText || res?.fullText || ''))
        setEntries((prev) => {
          const cur = prev[key]
          if (!cur) return prev
          return {
            ...prev,
            [key]: { ...cur, answer: finalAnswer, isStreaming: false, error: null },
          }
        })
        return true
      } catch (err: any) {
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          setEntries((prev) => {
            const cur = prev[key]
            if (!cur) return prev
            return {
              ...prev,
              [key]: { ...cur, isStreaming: false },
            }
          })
          return true
        }
        setEntries((prev) => {
          const cur = prev[key]
          if (!cur) return prev
          return {
            ...prev,
            [key]: {
              ...cur,
              isStreaming: false,
              error: err?.message || "Impossible de joindre Sphera pour le moment.",
            },
          }
        })
        return false
      } finally {
        if (controllersRef.current[key] === controller) {
          delete controllersRef.current[key]
        }
      }
    },
    [sessionId, sessionType]
  )

  return { entries, ask, stop, close }
}

export function InlineSpheraAnswerCard({
  entry,
  onStop,
  onClose,
  onRetry,
  onSaveNote,
}: {
  entry: InlineAskEntry
  onStop: () => void
  onClose: () => void
  onRetry?: () => void
  onSaveNote?: (title: string, text: string) => Promise<void> | void
}) {
  const [copied, setCopied] = useState(false)
  const [savedNote, setSavedNote] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll gently to anchor the top of the card into view when opened
    if (cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [entry.prompt])

  const handleCopy = () => {
    if (!entry.answer) return
    navigator.clipboard.writeText(entry.answer).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const handleSaveNote = async () => {
    if (!onSaveNote || !entry.answer || savingNote) return
    setSavingNote(true)
    try {
      const noteTitle = entry.title || 'Explication Sphera'
      await onSaveNote(noteTitle, entry.answer)
      setSavedNote(true)
      setTimeout(() => setSavedNote(false), 2500)
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <div
      ref={cardRef}
      className="mt-3 rounded-xl border border-sphera-green/35 bg-sphera-surface-2/90 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2 border-b border-sphera-border/60 bg-sphera-green/5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-sphera-green/15 border border-sphera-green/30 flex items-center justify-center shrink-0">
            <Sparkle weight="fill" className="w-3 h-3 text-sphera-green" />
          </div>
          <span className="text-xs font-semibold text-white truncate">
            {entry.title || 'Explication de Sphera'}
          </span>
          {entry.isStreaming && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sphera-green">
              <span className="w-1.5 h-1.5 rounded-full bg-sphera-green animate-pulse" />
              En direct
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {entry.isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sphera-green text-black font-semibold text-[11px] hover:bg-green-400 transition-colors cursor-pointer"
              title="Arrêter la génération"
            >
              <Square weight="fill" className="w-2.5 h-2.5" />
              <span>Stop</span>
            </button>
          ) : (
            <>
              {entry.answer && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors cursor-pointer"
                  title="Copier l'explication"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-sphera-green" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
              {entry.answer && onSaveNote && (
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-sphera-text-muted hover:text-yellow-400 hover:bg-sphera-surface transition-colors cursor-pointer disabled:opacity-50"
                  title="Enregistrer en note"
                >
                  {savedNote ? (
                    <>
                      <Check className="w-3 h-3 text-sphera-green" />
                      <span className="text-sphera-green">Enregistré</span>
                    </>
                  ) : (
                    <>
                      <Note className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Note</span>
                    </>
                  )}
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 text-sm text-white/90 leading-relaxed">
        {entry.error ? (
          <div className="flex items-center justify-between gap-3 text-xs text-red-400">
            <span>{entry.error}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-medium transition-colors shrink-0 cursor-pointer"
              >
                <ArrowClockwise className="w-3 h-3" />
                <span>Réessayer</span>
              </button>
            )}
          </div>
        ) : !entry.answer && entry.isStreaming ? (
          <div className="flex items-center gap-2 py-1 text-xs text-sphera-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sphera-green animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-sphera-green animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-sphera-green animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <span>Sphera analyse la question…</span>
          </div>
        ) : (
          <MarkdownRenderer content={entry.answer} className="text-sm text-white/90 leading-relaxed" />
        )}
      </div>
    </div>
  )
}
