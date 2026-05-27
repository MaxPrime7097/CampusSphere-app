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
      <div className="flex items-center gap-2 px-4 pb-3">
        <Sparkles className="w-3.5 h-3.5 text-sphera-green/50 animate-pulse" />
        <span className="text-xs text-sphera-text-muted/50">Sphera prépare des suggestions...</span>
      </div>
    )
  }

  if (!suggestions.length) return null

  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-sphera-green" />
        <p className="text-xs text-sphera-text-muted font-medium">Sphera te suggère</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            className="text-xs px-3 py-1.5 rounded-full border border-sphera-green/30 
                       text-sphera-green hover:bg-sphera-green/10 hover:border-sphera-green/60
                       transition-all duration-200 text-left cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
