import React from 'react'
import { FileText, BrainCircuit, CheckCircle2, Layers, GitFork, Headphones, MessageSquare } from 'lucide-react'

export type ToolType = 'fiche' | 'quiz' | 'flashcards' | 'annale' | 'mindmap' | 'audio'

interface ToolSelectorProps {
  selectedTools: ToolType[];
  onToolSelect: (tools: ToolType[]) => void;
}

export function ToolSelector({ selectedTools, onToolSelect }: ToolSelectorProps) {
  const tools: { id: ToolType; title: string; desc: string; icon: React.ReactNode; colorClass: string }[] = [
    {
      id: 'fiche',
      title: "Fiche de révision",
      desc: "Points clés, définitions, formules",
      icon: <FileText className="w-5 h-5" />,
      colorClass: "text-blue-400"
    },
    {
      id: 'quiz',
      title: "Quiz interactif",
      desc: "QCM avec timer et score",
      icon: <BrainCircuit className="w-5 h-5" />,
      colorClass: "text-purple-400"
    },
    {
      id: 'flashcards' as ToolType,
      title: "Flashcards",
      desc: "Cartes recto/verso pour mémoriser",
      icon: <Layers className="w-5 h-5" />,
      colorClass: "text-green-400"
    },
    {
      id: 'mindmap' as ToolType,
      title: "Carte mentale",
      desc: "Arborescence visuelle des concepts clés",
      icon: <GitFork className="w-5 h-5" />,
      colorClass: "text-emerald-400"
    },
    {
      id: 'audio' as ToolType,
      title: "Résumé audio",
      desc: "Dialogue podcast pour réviser",
      icon: <Headphones className="w-5 h-5" />,
      colorClass: "text-teal-400"
    }
  ]

  const toggleTool = (toolId: ToolType) => {
    if (selectedTools.includes(toolId)) {
      onToolSelect(selectedTools.filter(id => id !== toolId))
    } else {
      onToolSelect([...selectedTools, toolId])
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-white font-medium text-lg">Choisir les outils à générer</h3>
        {selectedTools.length > 0 ? (
          <button
            type="button"
            onClick={() => onToolSelect([])}
            className="text-xs text-sphera-text-muted hover:text-white transition-colors"
          >
            Tout désélectionner (Q&A direct)
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onToolSelect(['fiche'])}
            className="text-xs text-sphera-green hover:underline transition-colors"
          >
            Sélectionner Fiche
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((tool) => {
          const isSelected = selectedTools.includes(tool.id)
          return (
            <button
              key={tool.id}
              onClick={() => toggleTool(tool.id)}
              className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 relative ${
                isSelected 
                  ? 'bg-sphera-green/10 border-sphera-green shadow-[0_0_15px_rgba(34,197,94,0.15)] -translate-y-0.5' 
                  : 'bg-sphera-surface border-sphera-border hover:bg-sphera-surface-2 hover:border-sphera-border/80'
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 text-sphera-green">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              <div className={`mb-3 p-2 rounded-lg bg-sphera-bg inline-block ${isSelected ? tool.colorClass : 'text-sphera-text-muted'}`}>
                {tool.icon}
              </div>
              <h4 className={`font-semibold text-sm mb-1 ${isSelected ? 'text-white' : 'text-sphera-text-muted'}`}>
                {tool.title}
              </h4>
              <p className="text-xs text-sphera-text-muted/80 leading-relaxed">
                {tool.desc}
              </p>
            </button>
          )
        })}
      </div>

      {selectedTools.length === 0 && (
        <div className="p-3.5 rounded-xl bg-sphera-surface border border-sphera-green/30 text-xs text-sphera-text-muted flex items-center gap-3 animate-in fade-in duration-300">
          <div className="w-8 h-8 rounded-lg bg-sphera-green/10 flex items-center justify-center shrink-0 text-sphera-green">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="text-white font-medium mb-0.5">Mode Q&A direct sélectionné</div>
            <span>La session sera créée immédiatement sans générer de fiches ni quiz (0 quota consommé). Vous pourrez les générer à la demande plus tard !</span>
          </div>
        </div>
      )}
    </div>
  )
}
