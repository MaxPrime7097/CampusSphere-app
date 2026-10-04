import React, { useState } from 'react'
import {
  Cards,
  Question,
  Waveform,
  GitFork,
  Note,
  DotsThreeVertical,
  Trash,
  PencilSimple,
  Sparkle,
  Plus,
} from "@phosphor-icons/react"
import type { ArtefactItem } from '../../services/spheraApi'

interface ArtefactListProps {
  artefacts: ArtefactItem[]
  activeArtefactId?: number | null
  onSelectArtefact: (artefact: ArtefactItem) => void
  onDeleteArtefact: (id: number) => void
  onRenameArtefact: (id: number, newTitle: string) => void
  onNewNote?: () => void
}

export function ArtefactList({
  artefacts,
  activeArtefactId,
  onSelectArtefact,
  onDeleteArtefact,
  onRenameArtefact,
  onNewNote,
}: ArtefactListProps) {
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const getArtefactIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Question weight="duotone" className="w-4 h-4 text-rose-400" />
      case 'flashcards':
        return <Cards weight="duotone" className="w-4 h-4 text-orange-400" />
      case 'audio':
        return <Waveform weight="duotone" className="w-4 h-4 text-purple-400" />
      case 'mindmap':
        return <GitFork weight="duotone" className="w-4 h-4 text-emerald-400" />
      case 'note':
        return <Note weight="duotone" className="w-4 h-4 text-yellow-400" />
      default:
        return <Sparkle weight="duotone" className="w-4 h-4 text-sphera-green" />
    }
  }

  const getArtefactBadgeBg = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'bg-rose-500/10 border-rose-500/20'
      case 'flashcards':
        return 'bg-orange-500/10 border-orange-500/20'
      case 'audio':
        return 'bg-purple-500/10 border-purple-500/20'
      case 'mindmap':
        return 'bg-emerald-500/10 border-emerald-500/20'
      case 'note':
        return 'bg-yellow-500/10 border-yellow-500/20'
      default:
        return 'bg-sphera-surface-2 border-sphera-border'
    }
  }

  const handleStartRename = (art: ArtefactItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpenId(null)
    setEditingId(art.id)
    setEditTitle(art.title)
  }

  const handleSaveRename = (artId: number, e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault()
    if (editTitle.trim()) {
      onRenameArtefact(artId, editTitle.trim())
    }
    setEditingId(null)
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Mes ensembles
          </span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-sphera-surface-2 text-sphera-text-muted border border-sphera-border">
            {artefacts.length}
          </span>
        </div>
        {onNewNote && (
          <button
            type="button"
            onClick={onNewNote}
            className="flex items-center gap-1 text-[11px] text-sphera-text-muted hover:text-white transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Note</span>
          </button>
        )}
      </div>

      {artefacts.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-sphera-border bg-sphera-surface/50 text-center">
          <p className="text-xs text-sphera-text-muted">Aucun artefact généré pour l'instant.</p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Clique sur un outil ci-dessus pour créer ton premier quiz ou jeu de cartes.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-0.5 custom-scrollbar">
          {artefacts.map((art) => {
            const isActive = activeArtefactId === art.id
            const isEditing = editingId === art.id

            return (
              <div
                key={art.id}
                onClick={() => onSelectArtefact(art)}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sphera-surface-2 border-sphera-green/50 shadow-sm'
                    : 'bg-sphera-surface/80 border-sphera-border hover:bg-sphera-surface-2/80 hover:border-sphera-border/90'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${getArtefactBadgeBg(
                      art.type
                    )}`}
                  >
                    {getArtefactIcon(art.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => setEditingId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(art.id, e)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-xs bg-sphera-surface border border-sphera-green rounded px-1.5 py-0.5 text-white focus:outline-none"
                      />
                    ) : (
                      <>
                        <p
                          className={`text-xs font-medium truncate ${
                            isActive ? 'text-white' : 'text-white/90'
                          }`}
                        >
                          {art.title}
                        </p>
                        {art.subtitle && (
                          <p className="text-[10px] text-sphera-text-muted truncate mt-0.5">
                            {art.subtitle}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Actions contextuelles menu dots */}
                <div className="relative shrink-0 ml-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId(menuOpenId === art.id ? null : art.id)
                    }}
                    className="p-1 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors opacity-70 group-hover:opacity-100"
                  >
                    <DotsThreeVertical weight="bold" className="w-3.5 h-3.5" />
                  </button>

                  {menuOpenId === art.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1 w-32 p-1 rounded-lg border border-sphera-border bg-sphera-surface-2 shadow-xl z-30 text-xs animate-in fade-in zoom-in-95 duration-150"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(art, e)}
                        className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded text-left text-white/90 hover:bg-sphera-surface transition-colors"
                      >
                        <PencilSimple className="w-3.5 h-3.5" />
                        <span>Renommer</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpenId(null)
                          onDeleteArtefact(art.id)
                        }}
                        className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded text-left text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
