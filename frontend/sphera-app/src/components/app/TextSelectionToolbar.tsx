import React from 'react'
import { Sparkles, FileText, Lightbulb, BrainCircuit, Columns } from 'lucide-react'

export type SelectionActionType = 'expliquer' | 'resumer' | 'exemple' | 'quiz' | 'flashcards'

interface TextSelectionToolbarProps {
  coords: { x: number; y: number }
  selectedText: string
  onAction: (action: SelectionActionType, text: string) => void
  onClose: () => void
}

export function TextSelectionToolbar({ coords, selectedText, onAction, onClose }: TextSelectionToolbarProps) {
  if (!selectedText.trim()) return null

  // Ensure toolbar stays within screen bounds
  const left = Math.max(160, Math.min(window.innerWidth - 160, coords.x))
  const top = Math.max(70, coords.y - 10)

  const actions: { id: SelectionActionType; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'expliquer',
      label: 'Expliquer',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      color: 'hover:text-sphera-green hover:bg-sphera-green/10',
    },
    {
      id: 'resumer',
      label: 'Résumer',
      icon: <FileText className="w-3.5 h-3.5" />,
      color: 'hover:text-blue-400 hover:bg-blue-400/10',
    },
    {
      id: 'exemple',
      label: 'Exemple',
      icon: <Lightbulb className="w-3.5 h-3.5" />,
      color: 'hover:text-amber-400 hover:bg-amber-400/10',
    },
    {
      id: 'quiz',
      label: 'Quiz',
      icon: <BrainCircuit className="w-3.5 h-3.5" />,
      color: 'hover:text-purple-400 hover:bg-purple-400/10',
    },
    {
      id: 'flashcards',
      label: 'Flashcard',
      icon: <Columns className="w-3.5 h-3.5" />,
      color: 'hover:text-emerald-400 hover:bg-emerald-400/10',
    },
  ]

  const handleActionClick = (e: React.MouseEvent, actionId: SelectionActionType) => {
    e.preventDefault()
    e.stopPropagation()
    onAction(actionId, selectedText)
  }

  return (
    <div
      style={{ left: `${left}px`, top: `${top}px` }}
      className="fixed z-50 transform -translate-x-1/2 -translate-y-full mb-2 bg-[#1A1A1A]/95 border border-sphera-border shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-md rounded-full px-1.5 py-1 flex items-center gap-0.5 animate-in fade-in zoom-in-95 duration-150 select-none"
      onMouseDown={e => e.stopPropagation()}
    >
      {actions.map(action => (
        <button
          key={action.id}
          type="button"
          onClick={e => handleActionClick(e, action.id)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-sphera-text-muted hover:text-white transition-all ${action.color}`}
          title={`${action.label} ce passage`}
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  )
}
