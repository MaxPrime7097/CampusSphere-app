import React, { useEffect, useState } from 'react'
import { getSuggestions } from '../../services/spheraApi'
import { Sparkle as Sparkles } from "@phosphor-icons/react";
import { useTranslation } from 'react-i18next'

interface QuestionSuggestionsProps {
  sessionId: string | number
  onSelect: (question: string) => void
  askedQuestions?: string[]
}

export function QuestionSuggestions({ sessionId, onSelect, askedQuestions = [] }: QuestionSuggestionsProps) {
  const { t } = useTranslation('study')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [consumedLocally, setConsumedLocally] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    getSuggestions(sessionId).then(list => {
      if (!cancelled) {
        setSuggestions(list || [])
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [sessionId])

  const normalize = (str: string) => str.trim().toLowerCase().replace(/[?.,!]/g, '')
  const askedSet = new Set([
    ...askedQuestions.map(normalize),
    ...consumedLocally.map(normalize),
  ])

  const availableSuggestions = suggestions.filter(q => !askedSet.has(normalize(q)))

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-sphera-text-muted/60">
        <Sparkles className="w-3 h-3 text-sphera-green/60 animate-pulse shrink-0" />
        <span className="truncate">{t('suggestions.preparing')}</span>
      </div>
    )
  }

  if (!availableSuggestions.length) return null

  return (
    <div className="w-full flex items-center gap-2 overflow-x-auto py-1 px-1 no-scrollbar scroll-smooth">
      <div className="flex items-center gap-1 text-[11px] font-semibold text-sphera-text-muted uppercase tracking-wider shrink-0 mr-1 select-none">
        <Sparkles className="w-3 h-3 text-sphera-green" />
        <span className="hidden sm:inline">{t('suggestions.label')}</span>
      </div>
      {availableSuggestions.map((q, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            setConsumedLocally(prev => [...prev, q])
            onSelect(q)
          }}
          className="text-xs px-3 py-1 rounded-full bg-sphera-surface hover:bg-sphera-surface-2 border border-sphera-border hover:border-sphera-green/50 text-sphera-text-muted hover:text-white transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5 active:scale-95"
          title={q}
        >
          <span>{q}</span>
        </button>
      ))}
    </div>
  )
}
