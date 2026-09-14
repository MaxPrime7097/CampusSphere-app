import React, { useEffect, useState } from 'react'
import { getSuggestions } from '../../services/spheraApi'
import { Sparkles } from 'lucide-react'

interface QuestionSuggestionsProps {
  sessionId: string | number
  onSelect: (question: string) => void
}

export function QuestionSuggestions({ sessionId, onSelect }: QuestionSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    getSuggestions(sessionId).then(list => {
      if (!cancelled) {
        setSuggestions(list)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-sphera-text-muted/60">
        <Sparkles className="w-3 h-3 text-sphera-green/60 animate-pulse shrink-0" />
        <span className="truncate">Sphera prépare des suggestions...</span>
      </div>
    )
  }

  if (!suggestions.length) return null

  return (
    <div className="w-full flex items-center gap-2 overflow-x-auto py-1 px-1 custom-scrollbar no-scrollbar scroll-smooth">
      <div className="flex items-center gap-1 text-[11px] font-semibold text-sphera-text-muted uppercase tracking-wider shrink-0 mr-1 select-none">
        <Sparkles className="w-3 h-3 text-sphera-green" />
        <span className="hidden sm:inline">Suggestions :</span>
      </div>
      {suggestions.map((q, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            onSelect(q)
            setSuggestions(prev => prev.filter((_, idx) => idx !== i))
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
