import React, { useState, useEffect } from 'react'
import { Copy, Check, ThumbsUp, ThumbsDown, Pencil, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MarkdownRenderer } from './MarkdownRenderer'

interface AiMessageItemProps {
  question: string
  answer: string
  index?: number
  onEdit?: (index: number, newQuestion: string) => void
  onRegenerate?: (index: number) => void
  disabled?: boolean
}

export function AiMessageItem({ question, answer, index, onEdit, onRegenerate, disabled }: AiMessageItemProps) {
  const { t } = useTranslation('study')
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(question)

  useEffect(() => {
    setEditText(question)
  }, [question])

  const handleCopy = () => {
    navigator.clipboard.writeText(answer)
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

  const isLoading = answer === '...'

  return (
    <div className="flex flex-col gap-5 py-4 border-b border-sphera-border/30 last:border-b-0 animate-in fade-in duration-300">
      {/* 1. User Message: Aligned Right with edit option */}
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
                className="px-3 py-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
              >
                {t('aiMessage.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editText.trim()}
                className="px-3 py-1.5 rounded-lg bg-sphera-green text-black font-medium hover:bg-green-400 disabled:opacity-50 transition-colors"
              >
                {t('aiMessage.send')}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center gap-2 max-w-[85%] sm:max-w-[75%]">
            {onEdit && index !== undefined && !disabled && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title={t('aiMessage.editTooltip')}
                aria-label={t('aiMessage.editTooltip')}
                className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="px-4 py-2.5 rounded-2xl rounded-tr-xs bg-sphera-surface-2 border border-sphera-border/70 text-white text-sm leading-relaxed shadow-sm">
              <p className="whitespace-pre-wrap">{question}</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. AI Response: Full-width, NO bubble, NO avatar, beautiful modern typography */}
      <div className="w-full flex flex-col items-start pr-1 sm:pr-4">
        {isLoading ? (
          <div className="flex items-center gap-1.5 py-3 px-1 text-sphera-text-muted">
            <span className="w-2 h-2 rounded-full bg-sphera-green/80 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-sphera-green/80 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-sphera-green/80 animate-bounce [animation-delay:0.4s]" />
          </div>
        ) : (
          <div className="w-full space-y-3">
            <MarkdownRenderer content={answer} className="text-white/95" />

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
          </div>
        )}
      </div>
    </div>
  )
}
