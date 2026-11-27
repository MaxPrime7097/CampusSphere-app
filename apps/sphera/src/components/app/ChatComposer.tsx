import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Plus,
  Paperclip,
  At,
  Globe,
  Sparkle,
  Compass,
  Exam,
  Lightning,
  CaretDown,
  CaretRight,
  ArrowLeft,
  ArrowUp,
  Square,
  Check,
  X,
  BookOpen,
  ChatCircle,
  MagnifyingGlass,
  FilePdf,
  Spinner as Loader2,
} from '@phosphor-icons/react'
import {
  getChatCapabilities,
  uploadChatAttachment,
  type ChatAttachment,
  type ChatMode,
} from '../../services/spheraApi'
import { usePlannerSubjectsQuery, useSessionsQuery } from '../../hooks/useSpheraQueries'

export type ChatContextSelection =
  | { type: 'session'; id: number; label: string }
  | { type: 'subject'; id: number; label: string; color: string }
  | null

export interface PendingChatAttachment {
  tempId: string
  name: string
  type: 'image' | 'pdf'
  previewUrl?: string
  uploading: boolean
  uploaded?: ChatAttachment
}

export const MAX_CHAT_ATTACHMENTS = 3
export const MAX_ATTACHMENT_BYTES = 12 * 1024 * 1024

export const CHAT_MODES: Array<{
  id: ChatMode
  label: string
  badge: string
  tagline: string
  description: string
  placeholder: string
  icon: typeof Sparkle
  accentClass: string
}> = [
  {
    id: 'tutor',
    label: 'Tuteur',
    badge: 'Par défaut',
    tagline: 'Explications claires pas à pas',
    description: 'Je t’explique simplement avec des exemples concrets et des analogies.',
    placeholder: "Demande n'importe quoi, ou colle une photo (Ctrl+V)...",
    icon: Sparkle,
    accentClass: 'text-sphera-green',
  },
  {
    id: 'socratic',
    label: 'Socrate',
    badge: 'Actif',
    tagline: 'Trouver par toi-même',
    description: 'Je ne donne pas la réponse directe : je te guide étape par étape par petites questions.',
    placeholder: 'Écris un concept ou un exercice : je vais te guider par questions...',
    icon: Compass,
    accentClass: 'text-amber-400',
  },
  {
    id: 'exam',
    label: 'Examen',
    badge: 'Partiel',
    tagline: 'S’entraîner en conditions réelles',
    description: 'Je te pose des questions pièges type partiel puis je corrige et note ta réponse.',
    placeholder: 'Indique le sujet sur lequel tu veux être interrogé comme au partiel...',
    icon: Exam,
    accentClass: 'text-rose-400',
  },
  {
    id: 'express',
    label: 'Express',
    badge: '30 sec',
    tagline: 'L’essentiel sans blabla',
    description: 'Réponse ultra-synthétique : points clés, formules et définitions à retenir.',
    placeholder: 'Pose ta question pour une réponse éclair en points clés...',
    icon: Lightning,
    accentClass: 'text-cyan-400',
  },
]

/** Downscale very large photos (> 1.2 MB or > 1800px) on the client so uploads & vision stay fast & sharp. */
export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  if (file.size <= 1.2 * 1024 * 1024) return file
  try {
    const bitmap = await createImageBitmap(file)
    const maxDim = 1800
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.86),
    )
    if (!blob || blob.size >= file.size) return file
    const cleanName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], cleanName, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (payload: {
    text: string
    mode: ChatMode
    context: ChatContextSelection
    webSearch: boolean
    attachments: ChatAttachment[]
  }) => void
  onStop?: () => void
  isSending?: boolean
  mode: ChatMode
  onModeChange: (mode: ChatMode) => void
  context: ChatContextSelection
  onContextChange: (context: ChatContextSelection) => void
  webSearch: boolean
  onWebSearchChange: (enabled: boolean) => void
  pendingAttachments: PendingChatAttachment[]
  onPendingAttachmentsChange: React.Dispatch<React.SetStateAction<PendingChatAttachment[]>>
  onNotify?: (message: string, type?: 'success' | 'error') => void
  /** Direction menus open: 'top' for ChatPage pinned bottom bar, 'bottom' for Dashboard hero bar */
  menuPlacement?: 'top' | 'bottom'
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isSending = false,
  mode,
  onModeChange,
  context,
  onContextChange,
  webSearch,
  onWebSearchChange,
  pendingAttachments,
  onPendingAttachmentsChange,
  onNotify,
  menuPlacement = 'top',
  textareaRef: externalTextareaRef,
}: ChatComposerProps) {
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = externalTextareaRef ?? internalTextareaRef
  const fileInputRef = useRef<HTMLInputElement>(null)
  const plusMenuRef = useRef<HTMLDivElement>(null)
  const modeMenuRef = useRef<HTMLDivElement>(null)

  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [plusView, setPlusView] = useState<'main' | 'context'>('main')
  const [contextSearch, setContextSearch] = useState('')
  const [modeMenuOpen, setModeMenuOpen] = useState(false)
  const [webSearchAvailable, setWebSearchAvailable] = useState<boolean | null>(null)

  const { data: rawSessions = [] } = useSessionsQuery()
  const { data: plannerSubjects = [] } = usePlannerSubjectsQuery()

  useEffect(() => {
    let mounted = true
    getChatCapabilities()
      .then((res) => {
        if (mounted && typeof res?.data?.webSearch === 'boolean') {
          setWebSearchAvailable(res.data.webSearch)
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  const availableCourses = useMemo(() => {
    return (rawSessions || [])
      .filter(
        (s: any) =>
          s.source_filename !== 'Discussion libre' &&
          s.source_filename !== '__sphera_standalone_chat__' &&
          s.sourceFilename !== '__sphera_standalone_chat__',
      )
      .map((s: any) => ({
        id: Number(s.id),
        title: s.resource_title || s.source_filename || `Cours #${s.id}`,
      }))
  }, [rawSessions])

  useEffect(() => {
    if (!plusMenuOpen && !modeMenuOpen) return
    const handleOutside = (e: MouseEvent) => {
      if (plusMenuOpen && plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false)
        setPlusView('main')
      }
      if (modeMenuOpen && modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setModeMenuOpen(false)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlusMenuOpen(false)
        setPlusView('main')
        setModeMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [plusMenuOpen, modeMenuOpen])

  const handleAddFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    if (files.length === 0) return

    const remainingSlots = MAX_CHAT_ATTACHMENTS - pendingAttachments.length
    if (remainingSlots <= 0) {
      onNotify?.(`Maximum ${MAX_CHAT_ATTACHMENTS} pièces jointes par message.`, 'error')
      return
    }

    for (const rawFile of files.slice(0, remainingSlots)) {
      const isImage = rawFile.type.startsWith('image/')
      const isPdf = rawFile.type === 'application/pdf' || /\.pdf$/i.test(rawFile.name)
      if (!isImage && !isPdf) {
        onNotify?.(`Format non supporté : ${rawFile.name} (images ou PDF uniquement).`, 'error')
        continue
      }
      if (rawFile.size > MAX_ATTACHMENT_BYTES) {
        onNotify?.(`${rawFile.name} dépasse la limite de 12 Mo.`, 'error')
        continue
      }

      const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const previewUrl = isImage ? URL.createObjectURL(rawFile) : undefined

      onPendingAttachmentsChange((prev) => [
        ...prev,
        {
          tempId,
          name: rawFile.name || (isImage ? 'capture.png' : 'document.pdf'),
          type: isPdf ? 'pdf' : 'image',
          previewUrl,
          uploading: true,
        },
      ])

      try {
        const prepared = isImage ? await compressImageIfNeeded(rawFile) : rawFile
        const res = await uploadChatAttachment(prepared)
        const uploaded = res?.data
        if (!uploaded) throw new Error('Upload invalide')
        onPendingAttachmentsChange((prev) =>
          prev.map((item) =>
            item.tempId === tempId
              ? { ...item, uploading: false, uploaded, name: uploaded.name }
              : item,
          ),
        )
        if (uploaded.type === 'pdf' && uploaded.hasText === false) {
          onNotify?.(
            'PDF scanné détecté (peu de texte extractible) — une capture d’écran donnera un meilleur résultat.',
            'error',
          )
        }
      } catch (err: any) {
        console.error('Erreur upload pièce jointe:', err)
        onPendingAttachmentsChange((prev) => prev.filter((item) => item.tempId !== tempId))
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        onNotify?.(err?.message || "Impossible d'envoyer la pièce jointe.", 'error')
      }
    }
  }

  const handleRemovePendingAttachment = (tempId: string) => {
    onPendingAttachmentsChange((prev) => {
      const target = prev.find((p) => p.tempId === tempId)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.tempId !== tempId)
    })
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    const pastedFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === 'file') {
        const f = item.getAsFile()
        if (f && (f.type.startsWith('image/') || f.type === 'application/pdf')) {
          pastedFiles.push(f)
        }
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault()
      void handleAddFiles(pastedFiles)
    }
  }

  const isUploadingAttachments = pendingAttachments.some((a) => a.uploading)
  const readyAttachments = useMemo(
    () => pendingAttachments.map((a) => a.uploaded).filter((a): a is ChatAttachment => Boolean(a)),
    [pendingAttachments],
  )

  const currentModeObj = CHAT_MODES.find((m) => m.id === mode) ?? CHAT_MODES[0]
  const CurrentModeIcon = currentModeObj.icon

  const triggerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = value.trim()
    if ((!trimmed && readyAttachments.length === 0) || isSending || isUploadingAttachments) return
    setPlusMenuOpen(false)
    setModeMenuOpen(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    onSubmit({
      text: trimmed,
      mode,
      context,
      webSearch,
      attachments: readyAttachments,
    })
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      triggerSubmit()
    }
  }

  const hasActiveChips = Boolean(context || webSearch || pendingAttachments.length > 0)
  const popoverVerticalClass =
    menuPlacement === 'top'
      ? 'bottom-full mb-2.5 slide-in-from-bottom-2'
      : 'top-full mt-2.5 slide-in-from-top-2'

  return (
    <div className="w-full relative">
      {/* Active Context / Forced Web / Pending Attachments Chips (shown ONLY when active!) */}
      {hasActiveChips && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2 px-1 animate-in fade-in duration-150">
          {context && (
            <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-sphera-green/12 border border-sphera-green/40 text-[11px] font-medium text-white max-w-[240px]">
              {context.type === 'subject' ? (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: context.color || '#22c55e' }}
                />
              ) : (
                <At className="w-3.5 h-3.5 text-sphera-green shrink-0" />
              )}
              <span className="truncate">{context.label}</span>
              <button
                type="button"
                onClick={() => onContextChange(null)}
                title="Revenir en discussion libre"
                aria-label="Retirer le contexte"
                className="p-0.5 rounded-full text-sphera-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {webSearch && (
            <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-sky-500/15 border border-sky-400/45 text-[11px] font-medium text-sky-300">
              <Globe weight="duotone" className="w-3.5 h-3.5 shrink-0" />
              <span>Web forcé</span>
              <button
                type="button"
                onClick={() => onWebSearchChange(false)}
                title="Repasser en recherche Web automatique"
                aria-label="Désactiver la recherche Web forcée"
                className="p-0.5 rounded-full text-sky-300/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {pendingAttachments.map((att) => (
            <div
              key={att.tempId}
              className="relative flex items-center gap-2 rounded-xl border border-sphera-border bg-sphera-surface-2/95 p-1 pr-2 shadow-sm"
            >
              {att.type === 'image' && att.previewUrl ? (
                <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-sphera-bg shrink-0">
                  <img src={att.previewUrl} alt={att.name} className="w-full h-full object-cover" />
                  {att.uploading && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 text-sphera-green animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-rose-500/12 border border-rose-400/25 flex items-center justify-center shrink-0">
                  {att.uploading ? (
                    <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                  ) : (
                    <FilePdf weight="duotone" className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </div>
              )}
              <span className="text-[11px] font-medium text-white truncate max-w-[120px]">{att.name}</span>
              <button
                type="button"
                onClick={() => handleRemovePendingAttachment(att.tempId)}
                title="Retirer cette pièce jointe"
                aria-label="Retirer cette pièce jointe"
                className="p-0.5 rounded-full text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            void handleAddFiles(e.target.files)
            e.target.value = ''
          }
        }}
      />

      {/* Unified Rounded Pill Composer */}
      <form
        onSubmit={triggerSubmit}
        className="relative flex items-center gap-1.5 sm:gap-2 bg-sphera-surface-2/95 hover:bg-sphera-surface-2 border border-sphera-border hover:border-sphera-border/90 focus-within:border-sphera-green/60 rounded-[26px] p-1.5 pl-2 shadow-2xl backdrop-blur-xl transition-all"
      >
        {/* 1. Unified '+' Actions Menu (Attachments, @ Context, Web Search) */}
        <div ref={plusMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setModeMenuOpen(false)
              setPlusView('main')
              setContextSearch('')
              setPlusMenuOpen((prev) => !prev)
            }}
            disabled={isSending}
            title="Ajouter un fichier, relier un cours (@) ou activer la recherche Web"
            aria-label="Ouvrir le menu d'options"
            aria-expanded={plusMenuOpen}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 ${
              plusMenuOpen
                ? 'bg-sphera-green/15 text-sphera-green rotate-45'
                : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface'
            }`}
          >
            <Plus weight="bold" className="w-4 h-4" />
          </button>

          {plusMenuOpen && (
            <div
              className={`absolute left-0 ${popoverVerticalClass} w-[min(19.5rem,calc(100vw-2rem))] rounded-2xl border border-sphera-border bg-sphera-surface-2 shadow-2xl p-2 z-50 animate-in fade-in duration-150`}
            >
              {plusView === 'main' ? (
                <div className="space-y-1">
                  {/* Action 1: Paperclip — Photos & PDF */}
                  <button
                    type="button"
                    disabled={pendingAttachments.length >= MAX_CHAT_ATTACHMENTS}
                    onClick={() => {
                      setPlusMenuOpen(false)
                      fileInputRef.current?.click()
                    }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-sphera-surface text-left transition-colors cursor-pointer disabled:opacity-45"
                  >
                    <span className="w-8 h-8 rounded-lg bg-sphera-surface border border-sphera-border flex items-center justify-center text-white shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white">Ajouter photos &amp; fichiers</p>
                      <p className="text-[11px] text-sphera-text-muted truncate">
                        Photo d&apos;exo, schéma ou PDF (ou Ctrl+V)
                      </p>
                    </div>
                  </button>

                  {/* Action 2: @ — Contexte de cours / matière */}
                  <button
                    type="button"
                    onClick={() => {
                      setPlusView('context')
                      setContextSearch('')
                    }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-sphera-surface text-left transition-colors cursor-pointer"
                  >
                    <span
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                        context
                          ? 'bg-sphera-green/15 border-sphera-green/40 text-sphera-green'
                          : 'bg-sphera-surface border-sphera-border text-white'
                      }`}
                    >
                      <At className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white">Contexte de cours</p>
                      <p className="text-[11px] text-sphera-text-muted truncate">
                        {context ? `Actif : ${context.label}` : 'Discussion libre (hors cours)'}
                      </p>
                    </div>
                    <CaretRight className="w-3.5 h-3.5 text-sphera-text-muted shrink-0" />
                  </button>

                  {/* Action 3: Globe — Recherche Web */}
                  <button
                    type="button"
                    onClick={() => {
                      if (webSearchAvailable === false && !webSearch) {
                        onNotify?.(
                          'Recherche Web indisponible : configure TAVILY_API_KEY côté serveur.',
                          'error',
                        )
                        return
                      }
                      onWebSearchChange(!webSearch)
                      setPlusMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-sphera-surface text-left transition-colors cursor-pointer"
                  >
                    <span
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                        webSearch
                          ? 'bg-sky-500/15 border-sky-400/45 text-sky-300'
                          : 'bg-sphera-surface border-sphera-border text-sky-300/90'
                      }`}
                    >
                      <Globe weight={webSearch ? 'duotone' : 'regular'} className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-white">Recherche sur le web</p>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                            webSearch
                              ? 'bg-sky-500/20 text-sky-300'
                              : webSearchAvailable === false
                                ? 'bg-sphera-surface text-sphera-text-muted'
                                : 'bg-sphera-surface text-sphera-text-muted'
                          }`}
                        >
                          {webSearch ? 'Forcé' : webSearchAvailable === false ? 'Off' : 'Auto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-sphera-text-muted truncate">
                        {webSearch
                          ? 'Forcée sur chaque message (cliquer pour Auto)'
                          : 'S’active seule si besoin • cliquer pour forcer'}
                      </p>
                    </div>
                  </button>
                </div>
              ) : (
                /* Sub-view: Searchable @ Course / Subject Picker */
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 pb-1 border-b border-sphera-border/60">
                    <button
                      type="button"
                      onClick={() => setPlusView('main')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-sphera-green transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Contexte de cours</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlusMenuOpen(false)
                        setPlusView('main')
                      }}
                      className="text-sphera-text-muted hover:text-white cursor-pointer"
                      aria-label="Fermer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {availableCourses.length + plannerSubjects.length > 5 && (
                    <div className="relative">
                      <MagnifyingGlass className="w-3.5 h-3.5 text-sphera-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={contextSearch}
                        onChange={(e) => setContextSearch(e.target.value)}
                        placeholder="Rechercher un cours ou une matière..."
                        className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-sphera-surface border border-sphera-border text-xs text-white placeholder-sphera-text-muted focus:outline-none focus:border-sphera-green"
                      />
                    </div>
                  )}

                  <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        onContextChange(null)
                        setPlusMenuOpen(false)
                        setPlusView('main')
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        !context
                          ? 'bg-sphera-green/15 text-white font-semibold'
                          : 'text-white/80 hover:bg-sphera-surface'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <ChatCircle weight="duotone" className="w-3.5 h-3.5 text-sphera-green shrink-0" />
                        <span>Discussion libre (hors cours)</span>
                      </span>
                      {!context && <Check className="w-3.5 h-3.5 text-sphera-green shrink-0" />}
                    </button>

                    {plannerSubjects.length > 0 && (
                      <>
                        <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-sphera-text-muted">
                          Mes matières
                        </div>
                        {plannerSubjects
                          .filter(
                            (s) =>
                              !contextSearch.trim() ||
                              s.name.toLowerCase().includes(contextSearch.toLowerCase()),
                          )
                          .map((s) => {
                            const isSelected = context?.type === 'subject' && context.id === s.id
                            return (
                              <button
                                key={`subj-${s.id}`}
                                type="button"
                                onClick={() => {
                                  onContextChange({
                                    type: 'subject',
                                    id: s.id,
                                    label: s.name,
                                    color: s.color,
                                  })
                                  setPlusMenuOpen(false)
                                  setPlusView('main')
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-sphera-green/15 text-white font-semibold'
                                    : 'text-white/85 hover:bg-sphera-surface'
                                }`}
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: s.color || '#22c55e' }}
                                  />
                                  <span className="truncate">{s.name}</span>
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-sphera-green shrink-0" />}
                              </button>
                            )
                          })}
                      </>
                    )}

                    {availableCourses.length > 0 && (
                      <>
                        <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-sphera-text-muted">
                          Mes cours
                        </div>
                        {availableCourses
                          .filter(
                            (c) =>
                              !contextSearch.trim() ||
                              c.title.toLowerCase().includes(contextSearch.toLowerCase()),
                          )
                          .slice(0, 15)
                          .map((c) => {
                            const isSelected = context?.type === 'session' && context.id === c.id
                            return (
                              <button
                                key={`sess-${c.id}`}
                                type="button"
                                onClick={() => {
                                  onContextChange({ type: 'session', id: c.id, label: c.title })
                                  setPlusMenuOpen(false)
                                  setPlusView('main')
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-sphera-green/15 text-white font-semibold'
                                    : 'text-white/85 hover:bg-sphera-surface'
                                }`}
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                  <span className="truncate">{c.title}</span>
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-sphera-green shrink-0" />}
                              </button>
                            )
                          })}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Textarea with Dynamic Mode-Aware Placeholder */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={1}
          placeholder={
            pendingAttachments.length > 0
              ? 'Pose une question sur ta pièce jointe (ou envoie directement)...'
              : currentModeObj.placeholder
          }
          className="flex-1 min-w-0 bg-transparent border-0 text-xs sm:text-sm text-white placeholder-sphera-text-muted outline-none focus:ring-0 resize-none max-h-32 py-1.5 px-1 leading-relaxed"
        />

        {/* 3. Single Pedagogical Mode Selector Pill (Option B) */}
        <div ref={modeMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setPlusMenuOpen(false)
              setPlusView('main')
              setModeMenuOpen((prev) => !prev)
            }}
            disabled={isSending}
            title={`Méthode d'apprentissage : ${currentModeObj.label} — ${currentModeObj.tagline}`}
            aria-label={`Méthode d'apprentissage : ${currentModeObj.label}`}
            aria-expanded={modeMenuOpen}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] sm:text-xs font-medium border transition-all cursor-pointer disabled:opacity-40 ${
              mode !== 'tutor' || modeMenuOpen
                ? 'bg-sphera-surface border-sphera-green/45 text-white'
                : 'bg-sphera-surface/70 border-sphera-border/70 text-sphera-text-muted hover:text-white hover:border-sphera-border'
            }`}
          >
            <CurrentModeIcon weight="duotone" className={`w-3.5 h-3.5 shrink-0 ${currentModeObj.accentClass}`} />
            <span className="hidden xs:inline sm:inline">{currentModeObj.label}</span>
            <CaretDown className="w-3 h-3 text-sphera-text-muted shrink-0" />
          </button>

          {modeMenuOpen && (
            <div
              className={`absolute right-0 ${popoverVerticalClass} w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-sphera-border bg-sphera-surface-2 shadow-2xl p-2.5 z-50 animate-in fade-in duration-150`}
            >
              <div className="px-2 pb-2 mb-1.5 border-b border-sphera-border/60">
                <p className="text-xs font-bold text-white">Méthode d&apos;apprentissage</p>
                <p className="text-[11px] text-sphera-text-muted mt-0.5">
                  Choisis comment Sphera t&apos;accompagne dans cette discussion.
                </p>
              </div>
              <div className="space-y-1">
                {CHAT_MODES.map((m) => {
                  const Icon = m.icon
                  const isSelected = mode === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onModeChange(m.id)
                        setModeMenuOpen(false)
                        textareaRef.current?.focus()
                      }}
                      className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sphera-green/12 border-sphera-green/40'
                          : 'bg-transparent border-transparent hover:bg-sphera-surface'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-lg bg-sphera-surface border border-sphera-border flex items-center justify-center shrink-0 mt-0.5">
                        <Icon weight="duotone" className={`w-4 h-4 ${m.accentClass}`} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white">{m.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sphera-surface border border-sphera-border/70 text-sphera-text-muted">
                              {m.badge}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sphera-green shrink-0" />}
                        </div>
                        <p className="text-[11px] font-medium text-white/85 mt-0.5">{m.tagline}</p>
                        <p className="text-[11px] text-sphera-text-muted leading-snug mt-0.5">
                          {m.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. Primary Send / Stop Action */}
        {isSending && onStop ? (
          <button
            type="button"
            onClick={onStop}
            title="Arrêter la réponse"
            aria-label="Arrêter la réponse"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sphera-green hover:bg-green-400 text-black flex items-center justify-center shrink-0 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={(!value.trim() && readyAttachments.length === 0) || isUploadingAttachments || isSending}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sphera-green hover:bg-green-400 disabled:opacity-40 text-black flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md shadow-sphera-green/20 cursor-pointer"
            title="Envoyer"
            aria-label="Envoyer"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <ArrowUp className="w-4 h-4 font-bold" />
            )}
          </button>
        )}
      </form>
    </div>
  )
}
