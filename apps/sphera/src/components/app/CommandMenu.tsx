import React from 'react'
import { FileText, BrainCircuit, SquareStack, HelpCircle, AlignLeft, Sparkles, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface Command {
  trigger: string
  label: string
  icon: LucideIcon
  description: string
  category: 'tool' | 'action'
  toolType?: 'fiche' | 'quiz' | 'flashcards'
  template?: string
  prefix?: string
}

export const COMMANDS: Command[] = [
  {
    trigger: '@fiche',
    label: 'Fiche de révision',
    icon: FileText,
    description: 'Afficher ou générer ta fiche de révision',
    category: 'tool',
    toolType: 'fiche',
  },
  {
    trigger: '@quiz',
    label: 'Quiz interactif',
    icon: BrainCircuit,
    description: 'Afficher ou lancer ton quiz',
    category: 'tool',
    toolType: 'quiz',
  },
  {
    trigger: '@flashcards',
    label: 'Flashcards',
    icon: SquareStack,
    description: 'Afficher ou réviser tes flashcards',
    category: 'tool',
    toolType: 'flashcards',
  },
  {
    trigger: '@expliquer',
    label: 'Expliquer une notion',
    icon: HelpCircle,
    description: 'Explication pédagogique et détaillée pas à pas',
    category: 'action',
    template: '@expliquer ',
    prefix: 'Explique-moi de façon très claire, structurée et pédagogique : ',
  },
  {
    trigger: '@résumer',
    label: 'Résumer un point',
    icon: AlignLeft,
    description: 'Synthèse concise et percutante',
    category: 'action',
    template: '@résumer ',
    prefix: 'Fais-moi un résumé concis et percutant de : ',
  },
  {
    trigger: '@exemple',
    label: 'Exemple concret',
    icon: Sparkles,
    description: 'Cas pratique ou mise en situation d\'examen',
    category: 'action',
    template: '@exemple ',
    prefix: 'Donne-moi un exemple concret et parlant pour illustrer : ',
  },
]

interface CommandMenuProps {
  isVisible: boolean
  filter: string
  activeIndex: number
  onSelect: (command: Command) => void
  onClose: () => void
}

export function CommandMenu({ isVisible, filter, activeIndex, onSelect, onClose }: CommandMenuProps) {
  const { t } = useTranslation('study')
  if (!isVisible) return null

  const getTranslatedCommand = (cmd: Command): Command => {
    switch (cmd.trigger) {
      case '@fiche':
        return { ...cmd, label: t('modals.commandMenu.ficheLabel'), description: t('modals.commandMenu.ficheDesc') }
      case '@quiz':
        return { ...cmd, label: t('modals.commandMenu.quizLabel'), description: t('modals.commandMenu.quizDesc') }
      case '@flashcards':
        return { ...cmd, label: t('modals.commandMenu.flashcardsLabel'), description: t('modals.commandMenu.flashcardsDesc') }
      case '@expliquer':
        return { ...cmd, label: t('modals.commandMenu.explainLabel'), description: t('modals.commandMenu.explainDesc') }
      case '@résumer':
        return { ...cmd, label: t('modals.commandMenu.resumeLabel'), description: t('modals.commandMenu.resumeDesc') }
      case '@exemple':
        return { ...cmd, label: t('modals.commandMenu.exampleLabel'), description: t('modals.commandMenu.exampleDesc') }
      default:
        return cmd
    }
  }

  const translatedCommands = COMMANDS.map(getTranslatedCommand)
  const search = filter.toLowerCase().trim()
  const filtered = translatedCommands.filter(cmd =>
    cmd.trigger.toLowerCase().includes(search) ||
    cmd.label.toLowerCase().includes(search) ||
    cmd.description.toLowerCase().includes(search)
  )

  if (!filtered.length) return null

  return (
    <div className="absolute bottom-full left-0 w-80 mb-2 rounded-xl 
                    border border-sphera-border bg-sphera-surface-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] 
                    overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="px-3 py-2 border-b border-sphera-border/50 flex items-center justify-between">
        <p className="text-[10px] text-sphera-text-muted font-semibold uppercase tracking-wider">
          {t('modals.commandMenu.title')}
        </p>
        <span className="text-[10px] text-sphera-text-muted/60">
          {t('modals.commandMenu.shortcutHint')}
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto divide-y divide-sphera-border/20">
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
    </div>
  )
}
