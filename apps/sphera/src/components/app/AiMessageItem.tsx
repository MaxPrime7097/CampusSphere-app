import React, { useState, useEffect } from 'react'
import { Copy, Check, ThumbsUp, ThumbsDown, PencilSimple, ArrowCounterClockwise as RotateCcw, NotePencil, CaretDown, CaretUp, Sparkle, BookOpen } from "@phosphor-icons/react";
import { useTranslation } from 'react-i18next'
import { MarkdownRenderer } from './MarkdownRenderer'

interface AiMessageItemProps {
  question: string
  answer: string
  index?: number
  status?: string | null
  hasCourseContext?: boolean
  onEdit?: (index: number, newQuestion: string) => void
  onRegenerate?: (index: number) => void
  onCreateNote?: (question: string, answer: string) => void
  onSelectSuggestion?: (question: string) => void
  disabled?: boolean
}

const THINKING_STEPS_FREE = [
  'Réflexion en cours…',
  'Analyse de ta question…',
  'Structuration de la réponse…',
]

const THINKING_STEPS_COURSE = [
  'Lecture de ton cours…',
  'Analyse des passages clés…',
  'Rédaction de la réponse…',
]

export function AiMessageItem({ question, answer, index, status, hasCourseContext, onEdit, onRegenerate, onCreateNote, onSelectSuggestion, disabled }: AiMessageItemProps) {
  const { t } = useTranslation('study')
  const [copied, setCopied] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(question)
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false)
  const [thinkingStepIdx, setThinkingStepIdx] = useState(0)

  const isLoading = answer === '...'

  useEffect(() => {
    if (!isLoading) {
      setThinkingStepIdx(0)
      return
    }
    const interval = setInterval(() => {
      setThinkingStepIdx((prev) => (prev + 1) % 3)
    }, 2200)
    return () => clearInterval(interval)
  }, [isLoading])

  const isLongQuestion = React.useMemo(() => {
    if (!question) return false
    return question.length > 260 || question.split('\n').length > 4
  }, [question])

  const { cleanAnswer, suggestions } = React.useMemo(() => {
    if (!answer) return { cleanAnswer: '', suggestions: [] as string[] }
    const completeMatch = answer.match(/\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/i)
    // Strip complete block, incomplete streaming block ([SUGGESTIONS]...), or partial opening tag ([SUG...)
    let clean = answer.replace(/\[SUGGESTIONS\][\s\S]*?(?:\[\/SUGGESTIONS\]|$)/gi, '')
    clean = clean.replace(/\[(?:S(?:U(?:G(?:G(?:E(?:S(?:T(?:I(?:O(?:N(?:S)?)?)?)?)?)?)?)?)?)?)?$/i, '').trimEnd()
    if (!completeMatch) {
      return { cleanAnswer: clean, suggestions: [] as string[] }
    }
    const list = completeMatch[1]
      .split('\n')
      .map(s => s.trim().replace(/^[-*•\d.]+\s*/, ''))
      .filter(Boolean)
      .slice(0, 2)
    return { cleanAnswer: clean, suggestions: list }
  }, [answer])

  useEffect(() => {
    setEditText(question)
  }, [question])

  const [questionCopied, setQuestionCopied] = useState(false)

  const handleCopyQuestion = () => {
    navigator.clipboard.writeText(question)
    setQuestionCopied(true)
    setTimeout(() => setQuestionCopied(false), 2000)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanAnswer)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(prev => (prev === type ? null : type))
  }

  const handleSaveEdit = () => {
    const trimmed = editText.trim()
    if (!trimmed) return
    setIsEditing(false)
    if (trimmed !== question && onEdit && index !== undefined) {
      onEdit(index, trimmed)
    }
  }

  const isCourseThinking = status === 'reading_course' || Boolean(hasCourseContext)
  const thinkingSteps = isCourseThinking ? THINKING_STEPS_COURSE : THINKING_STEPS_FREE
  const currentThinkingLabel = thinkingSteps[thinkingStepIdx % thinkingSteps.length]

  return (
    <div className="flex flex-col gap-5 py-4 border-b border-sphera-border/30 last:border-b-0 animate-in fade-in duration-300">
      {/* 1. User Message: Aligned Right with edit and copy options */}
      <div className="flex justify-end w-full group">
        {isEditing ? (
          <div className="w-full max-w-[85%] sm:max-w-[75%] bg-sphera-surface-2 border border-sphera-green/50 rounded-2xl p-3 shadow-lg flex flex-col gap-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSaveEdit()
                } else if (e.key === 'Escape') {
                  setIsEditing(false)
                  setEditText(question)
                }
              }}
              rows={Math.min(5, Math.max(2, editText.split('\n').length))}
              className="w-full bg-sphera-surface/80 text-white text-sm rounded-xl p-2.5 border border-sphera-border focus:border-sphera-green focus:outline-none resize-none leading-relaxed"
              placeholder={t('aiMessage.editPlaceholder')}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setEditText(question)
                }}
                className="px-3 py-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors cursor-pointer"
              >
                {t('aiMessage.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editText.trim()}
                className="px-3 py-1.5 rounded-lg bg-sphera-green text-black font-medium hover:bg-green-400 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {t('aiMessage.send')}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center gap-1.5 max-w-[85%] sm:max-w-[75%]">
            <button
              type="button"
              onClick={handleCopyQuestion}
              title={questionCopied ? "Copié !" : "Copier la question"}
              aria-label="Copier la question"
              className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 shrink-0 cursor-pointer"
            >
              {questionCopied ? (
                <Check className="w-3.5 h-3.5 text-sphera-green" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            {onEdit && index !== undefined && !disabled && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title={t('aiMessage.editTooltip')}
                aria-label={t('aiMessage.editTooltip')}
                className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 shrink-0 cursor-pointer"
              >
                <PencilSimple className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="px-4 py-2.5 rounded-2xl rounded-tr-xs bg-sphera-surface-2 border border-sphera-border/70 text-white text-sm leading-relaxed shadow-sm">
              <p className={`whitespace-pre-wrap break-words ${isLongQuestion && !isQuestionExpanded ? 'line-clamp-4' : ''}`}>
                {question}
              </p>
              {isLongQuestion && (
                <button
                  type="button"
                  onClick={() => setIsQuestionExpanded((prev) => !prev)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-sphera-green hover:text-green-300 transition-colors cursor-pointer"
                >
                  {isQuestionExpanded ? (
                    <>
                      <CaretUp className="w-3 h-3" />
                      <span>Réduire</span>
                    </>
                  ) : (
                    <>
                      <CaretDown className="w-3 h-3" />
                      <span>Voir plus</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. AI Response: Full-width, NO bubble, NO avatar, beautiful modern typography */}
      <div className="w-full flex flex-col items-start pr-1 sm:pr-4">
        {isLoading ? (
          /* Modern ChatGPT/Claude-style Shimmering Thinking State */
          <div className="my-2 flex items-center gap-2.5 py-1 px-0.5 animate-in fade-in duration-200">
            <span className="relative flex h-5 w-5 items-center justify-center shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-sphera-green/20 animate-ping [animation-duration:2.2s]" />
              {isCourseThinking ? (
                <BookOpen weight="duotone" className="relative w-4 h-4 text-sphera-green" />
              ) : (
                <Sparkle weight="duotone" className="relative w-4 h-4 text-sphera-green" />
              )}
            </span>
            <span className="text-xs sm:text-[13px] font-medium sphera-shimmer-text tracking-[-0.01em]">
              {currentThinkingLabel}
            </span>
          </div>
        ) : (
          <div className="w-full space-y-3">
            <MarkdownRenderer content={cleanAnswer} className="text-white/95" />

            {/* Action Toolbar: Copy, Thumbs Up, Thumbs Down */}
            <div className="flex items-center gap-1 pt-2 text-sphera-text-muted">
              <button
                type="button"
                onClick={handleCopy}
                title={t('aiMessage.copy')}
                aria-label={t('aiMessage.copy')}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs hover:text-white hover:bg-sphera-surface-2 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-sphera-green" />
                    <span className="text-sphera-green text-[11px]">{t('aiMessage.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{t('aiMessage.copy')}</span>
                  </>
                )}
              </button>

              <span className="text-sphera-border px-1">•</span>

              <button
                type="button"
                onClick={() => handleFeedback('up')}
                title={t('aiMessage.helpful')}
                aria-label={t('aiMessage.helpful')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  feedback === 'up'
                    ? 'text-sphera-green bg-sphera-green/10'
                    : 'hover:text-white hover:bg-sphera-surface-2'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleFeedback('down')}
                title={t('aiMessage.improve')}
                aria-label={t('aiMessage.improve')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  feedback === 'down'
                    ? 'text-red-400 bg-red-400/10'
                    : 'hover:text-white hover:bg-sphera-surface-2'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>

              {onCreateNote && !isLoading && (
                <>
                  <span className="text-sphera-border px-1">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      onCreateNote(question, cleanAnswer)
                      setNoteSaved(true)
                      setTimeout(() => setNoteSaved(false), 2200)
                    }}
                    title="Enregistrer cette réponse dans mes notes"
                    aria-label="En créer une note"
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-sphera-text-muted hover:text-amber-300 hover:bg-amber-400/10 transition-colors active:scale-95 cursor-pointer"
                  >
                    {noteSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-400 text-[11px] font-medium">Note enregistrée !</span>
                      </>
                    ) : (
                      <>
                        <NotePencil className="w-3.5 h-3.5 text-amber-400/80" />
                        <span className="text-[11px] text-zinc-300 hover:text-white">En créer une note</span>
                      </>
                    )}
                  </button>
                </>
              )}

              {onRegenerate && index !== undefined && !disabled && (
                <>
                  <span className="text-sphera-border px-1">•</span>
                  <button
                    type="button"
                    onClick={() => onRegenerate(index)}
                    title={t('aiMessage.regenerate')}
                    aria-label={t('aiMessage.regenerate')}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">{t('aiMessage.regenerate')}</span>
                  </button>
                </>
              )}
            </div>

            {/* Rebound Follow-up Suggestions (No icons, clean text pills) */}
            {suggestions.length > 0 && onSelectSuggestion && !isLoading && (
              <div className="mt-4 pt-3 border-t border-sphera-border/50 flex flex-col gap-2">
                {suggestions.map((sug, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectSuggestion(sug)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl border border-sphera-border/70 hover:border-sphera-green/50 bg-sphera-surface-2/40 hover:bg-sphera-surface-2 text-xs text-sphera-text hover:text-white transition-all cursor-pointer leading-relaxed disabled:opacity-50"
                  >
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
