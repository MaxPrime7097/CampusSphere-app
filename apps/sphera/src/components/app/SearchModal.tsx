import React, { useState, useEffect, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass as Search, X, FileText, Brain as BrainCircuit, NotePencil as FilePenLine, Lightning as Zap, Calendar, ArrowRight, Stack as SquareStack } from "@phosphor-icons/react";
import { useTranslation } from 'react-i18next'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  items: any[]
}

export function SearchModal({ isOpen, onClose, items }: SearchModalProps) {
  const { t, i18n } = useTranslation('study')
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) setQuery('')
  }, [isOpen])

  const filteredItems = useMemo(() => {
    const term = query.toLowerCase().trim()
    if (!term) return items

    return items.filter((item) => {
      const searchTarget = [
        item.resource_title,
        item.title,
        item.source_filename,
        item.source_title,
        item.roomCode,
        `session #${item.id}`,
        `#${item.id}`,
        item._type === 'annale' ? 'annale' : 'session',
        ...(Array.isArray(item.tool_types) ? item.tool_types : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchTarget.includes(term)
    })
  }, [items, query])

  const getItemIcon = (item: any) => {
    if (item.roomCode) return <Zap className="w-4 h-4 text-sphera-green" />
    if (item._type === 'annale') return <FilePenLine className="w-4 h-4 text-orange-400" />
    const primaryTool = item.tool_types?.[0]
    if (primaryTool === 'quiz') return <BrainCircuit className="w-4 h-4 text-purple-400" />
    if (primaryTool === 'flashcards') return <SquareStack className="w-4 h-4 text-sphera-green" />
    return <FileText className="w-4 h-4 text-blue-400" />
  }

  const handleSelect = (item: any) => {
    onClose()
    if (item.roomCode) {
      navigate(`/live/host?code=${item.roomCode}&reset=1`)
    } else if (item._type === 'annale') {
      navigate(`/annales/${item.id}`)
    } else {
      navigate(`/sessions/${item.id}`)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-20 sm:top-28 left-1/2 -translate-x-1/2 w-[92vw] max-w-2xl bg-sphera-surface-2 border border-sphera-border rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[75vh]">
          {/* Search Header Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-sphera-border bg-sphera-surface">
            <Search className="w-5 h-5 text-sphera-text-muted shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('modals.search.placeholder')}
              className="flex-1 bg-transparent border-none text-sm text-white placeholder-sphera-text-muted outline-none focus:ring-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors"
                title={t('modals.search.clear')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <Dialog.Close className="p-1 text-sphera-text-muted hover:text-white transition-colors rounded-lg bg-sphera-surface-2/60 hover:bg-sphera-border ml-1">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {/* Search Results List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar min-h-[160px]">
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-sphera-text-muted uppercase tracking-wider">
              <span>{query ? t('modals.search.matchingResults') : t('modals.search.allDiscussions')}</span>
              <span className="text-[10px] font-normal lowercase">{t('modals.search.docsCount', { count: filteredItems.length })}</span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <FileText className="w-10 h-10 text-sphera-text-muted/40 mb-3" />
                <p className="text-white text-sm font-medium mb-1">
                  {query ? t('modals.search.noResults', { query }) : t('modals.search.noDocs')}
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const title = item.resource_title || item.title || item.source_filename || item.source_title || (item._type === 'annale' ? `Annale #${item.id}` : `Session #${item.id}`)
                const subtitle = item.source_filename && item.resource_title && item.source_filename !== item.resource_title
                  ? item.source_filename
                  : null
                const dateLocale = i18n.language === 'en' ? 'en-US' : 'fr-FR'
                const dateStr = item.created_at || item.createdAt
                  ? new Date(item.created_at || item.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })
                  : null

                return (
                  <button
                    key={`${item._type || 'sess'}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-sphera-surface transition-all group text-left border border-transparent hover:border-sphera-border"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-sphera-surface-2 border border-sphera-border flex items-center justify-center shrink-0 group-hover:border-sphera-green/40 transition-colors">
                        {getItemIcon(item)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-sphera-green transition-colors">
                          {title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-sphera-text-muted">
                          {subtitle && <span className="truncate max-w-[200px]">{subtitle}</span>}
                          {subtitle && dateStr && <span>•</span>}
                          {dateStr && (
                            <span className="flex items-center gap-1 shrink-0">
                              <Calendar className="w-3 h-3" /> {dateStr}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-sphera-surface border border-sphera-border text-sphera-text-muted group-hover:text-white">
                        {item.roomCode ? 'Quiz Live' : item._type === 'annale' ? 'Annale' : 'Session'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-sphera-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-4 py-2.5 border-t border-sphera-border bg-sphera-surface flex items-center justify-between text-xs text-sphera-text-muted">
            <span className="flex items-center gap-1.5">
              <span>{t('modals.search.escToClose')}</span>
            </span>
            <span>Sphera Assistant</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
