import React, { useState } from 'react'
import {
  ChatCircle,
  PaperPlaneTilt,
  Plus,
  Trash,
  ClockCounterClockwise,
  Sparkle,
} from "@phosphor-icons/react"
import type { ChatThreadItem } from '../../services/spheraApi'

interface ChatThreadBarProps {
  threads: ChatThreadItem[]
  activeThreadId?: number | null
  onSelectThread: (threadId: number) => void
  onCreateThread: (title: string) => void
  onSendMessage: (threadId: number, question: string) => void
  onDeleteThread?: (threadId: number) => void
  isSending?: boolean
}

export function ChatThreadBar({
  threads,
  activeThreadId,
  onSelectThread,
  onCreateThread,
  onSendMessage,
  onDeleteThread,
  isSending = false,
}: ChatThreadBarProps) {
  const [question, setQuestion] = useState('')
  const [showThreadMenu, setShowThreadMenu] = useState(false)
  const [showNewThreadModal, setShowNewThreadModal] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState('')

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0]

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || isSending) return

    if (activeThread) {
      onSendMessage(activeThread.id, trimmed)
      setQuestion('')
    } else {
      // Auto create a thread if none exists
      onCreateThread('Discussion générale')
    }
  }

  const handleCreateThreadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newThreadTitle.trim()) {
      onCreateThread(newThreadTitle.trim())
      setNewThreadTitle('')
      setShowNewThreadModal(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-2 p-3 bg-sphera-surface-2/95 border-t border-sphera-border backdrop-blur-md">
      {/* 1. Thread context selector ("Discuter dans: • Chapitre 1 [+]") */}
      <div className="flex items-center justify-between gap-2 max-w-4xl mx-auto w-full text-xs">
        <div className="relative flex items-center gap-1.5 min-w-0">
          <span className="text-sphera-text-muted shrink-0 text-[11px]">Discuter dans :</span>

          {activeThread ? (
            <button
              type="button"
              onClick={() => setShowThreadMenu(!showThreadMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-white font-medium max-w-[240px] truncate transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sphera-green shrink-0" />
              <span className="truncate">{activeThread.title}</span>
            </button>
          ) : (
            <span className="text-sphera-text-muted italic text-[11px]">Discussion générale</span>
          )}

          {/* New Thread Button (+) */}
          <button
            type="button"
            onClick={() => setShowNewThreadModal(true)}
            title="Créer un nouveau sujet de discussion"
            className="p-1 rounded-lg border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-sphera-text-muted hover:text-white transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Thread Dropdown Menu */}
          {showThreadMenu && threads.length > 0 && (
            <div className="absolute left-0 bottom-full mb-1.5 w-64 p-1 rounded-xl border border-sphera-border bg-sphera-surface-2 shadow-2xl z-40 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase text-sphera-text-muted tracking-wider">
                Fils de discussion
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                {threads.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelectThread(t.id)
                      setShowThreadMenu(false)
                    }}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      t.id === activeThread?.id
                        ? 'bg-sphera-surface text-sphera-green font-medium'
                        : 'text-white/90 hover:bg-sphera-surface/80'
                    }`}
                  >
                    <span className="truncate">{t.title}</span>
                    {onDeleteThread && threads.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteThread(t.id)
                        }}
                        className="text-sphera-text-muted hover:text-red-400 p-0.5 rounded opacity-60 hover:opacity-100"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowNewThreadModal(true)}
            title="Historique des conversations"
            className="p-1 rounded-lg text-sphera-text-muted hover:text-white transition-colors"
          >
            <ClockCounterClockwise className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Chat Input Form */}
      <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto w-full">
        <div className="relative flex-1">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pose n'importe quelle question sur ce cours..."
            disabled={isSending}
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-sphera-border bg-sphera-surface/90 text-sm text-white placeholder:text-sphera-text-muted focus:outline-none focus:border-sphera-green transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!question.trim() || isSending}
            aria-label="Envoyer"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-sphera-green text-black font-semibold hover:bg-green-400 disabled:opacity-30 disabled:hover:bg-sphera-green transition-all"
          >
            <PaperPlaneTilt weight="fill" className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* 3. New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-sphera-border bg-sphera-surface-2 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <ChatCircle weight="duotone" className="w-5 h-5 text-sphera-green" />
              <h3 className="text-sm font-semibold text-white">
                Nouveau sujet de discussion
              </h3>
            </div>

            <form onSubmit={handleCreateThreadSubmit} className="space-y-3">
              <input
                type="text"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                placeholder="Ex: Questions Chapitre 2, Prépa partiel..."
                autoFocus
                className="w-full px-3 py-2 text-xs rounded-xl border border-sphera-border bg-sphera-surface text-white placeholder:text-sphera-text-muted focus:outline-none focus:border-sphera-green"
              />

              <div className="flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-3 py-1.5 rounded-lg text-sphera-text-muted hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newThreadTitle.trim()}
                  className="px-3 py-1.5 rounded-lg bg-sphera-green text-black font-semibold hover:bg-green-400 disabled:opacity-50 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
