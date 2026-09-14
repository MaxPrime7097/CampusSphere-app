import React from 'react'
import { FileText, BrainCircuit, Layers, HelpCircle, AlignLeft, Sparkles, X, type LucideIcon } from 'lucide-react'

export const COMMANDS = [
  {
    trigger: '@fiche',
    label: 'Fiche de révision',
    icon: FileText,
    description: 'Génère ou affiche ta fiche de révision',
    toolType: 'fiche' as const,
  },
  {
    trigger: '@quiz',
    label: 'Quiz interactif',
    icon: BrainCircuit,
    description: 'Génère ou affiche ton quiz interactif',
    toolType: 'quiz' as const,
  },
  {
    trigger: '@flashcards',
    label: 'Flashcards',
    icon: Layers,
    description: 'Génère ou affiche tes flashcards',
    toolType: 'flashcards' as const,
  },
]

export type Command = typeof COMMANDS[0]

interface CommandMenuProps {
  isVisible: boolean
  filter: string
  activeIndex: number
  onSelect: (command: Command) => void
  onClose: () => void
}

export function CommandMenu({ isVisible, filter, activeIndex, onSelect, onClose }: CommandMenuProps) {
  if (!isVisible) return null

  const search = filter.replace(/^@/, '').toLowerCase().trim()
  const filtered = COMMANDS.filter(cmd => {
    if (!search) return true
    return (
      cmd.trigger.toLowerCase().includes(search) ||
      cmd.label.toLowerCase().includes(search) ||
      cmd.description.toLowerCase().includes(search)
    )
  })

  return (
    <div className="absolute bottom-full left-0 w-72 mb-2 rounded-xl 
                    border border-sphera-border bg-sphera-surface-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] 
                    overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="px-3 py-2 border-b border-sphera-border/50 flex items-center justify-between bg-sphera-surface">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-sphera-text-muted font-semibold uppercase tracking-wider">
            Commandes Sphera
          </p>
          <span className="text-[10px] text-sphera-text-muted/60 hidden sm:inline">
            • ↑↓ Entrée
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors"
          title="Fermer (Échap)"
          aria-label="Fermer le menu"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {filtered.length === 0 ? (
        <div className="p-4 text-center text-xs text-sphera-text-muted">
          Aucune commande pour "{filter}"
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto divide-y divide-sphera-border/20 custom-scrollbar">
          {filtered.map((cmd, idx) => {
            const Icon = cmd.icon
            const isActive = idx === activeIndex
            return (
              <button
                key={cmd.trigger}
                onClick={() => { onSelect(cmd); onClose() }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${
                  isActive ? 'bg-sphera-surface' : 'hover:bg-sphera-surface/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive 
                    ? 'bg-sphera-green/20 text-sphera-green' 
                    : cmd.category === 'tool'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-sphera-surface text-sphera-text-muted'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{cmd.label}</p>
                  <p className="text-[11px] text-sphera-text-muted truncate">{cmd.description}</p>
                </div>
                <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded ${
                  cmd.category === 'tool'
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-sphera-green bg-sphera-green/10'
                }`}>
                  {cmd.trigger}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
