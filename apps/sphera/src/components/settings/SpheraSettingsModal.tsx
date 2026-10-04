import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { LanguageSwitcher } from '@cs/i18n'
import { useTranslation } from 'react-i18next'
import { X, User, Sliders, Sparkle as Sparkles, Stack as Layers, ChartPie as PieChart, SunHorizon as SunMoon, ArrowSquareOut as ExternalLink, Check, Spinner as Loader2, Question as HelpCircle, Clock, ChatCircle as MessageSquare, Globe, Gauge, Info } from "@phosphor-icons/react";
import {
  getSpheraPreferences,
  updateSpheraPreferences,
  getSpheraProfile,
  getSpheraStats,
  getQuota,
  type SpheraPreferencesData,
  type SpheraProfileData,
  type SpheraStatsData,
  type GenerationQuota,
} from '../../services/spheraApi'
import { applyTheme, getSavedTheme, type SpheraTheme } from '../../utils/theme'
import { formatStudyYear, formatFaculty, formatUniversity } from '../../utils/profileMetadata'
import { ActivityStreakGrid } from './ActivityStreakGrid'

interface SpheraSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'profile' | 'generation' | 'tools' | 'quota' | 'stats' | 'appearance'
}

type TabType = 'profile' | 'generation' | 'tools' | 'quota' | 'stats' | 'appearance'

export const SpheraSettingsModal: React.FC<SpheraSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const { t } = useTranslation('settings')
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  const NAV_ITEMS: { id: TabType; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
    { id: 'profile', label: t('nav.profile.label'), icon: User, desc: t('nav.profile.desc') },
    { id: 'generation', label: t('nav.generation.label'), icon: Sparkles, desc: t('nav.generation.desc') },
    { id: 'tools', label: t('nav.tools.label'), icon: Layers, desc: t('nav.tools.desc') },
    { id: 'quota', label: t('nav.quota.label'), icon: PieChart, desc: t('nav.quota.desc') },
    { id: 'stats', label: t('nav.stats.label'), icon: Gauge, desc: t('nav.stats.desc') },
    { id: 'appearance', label: t('nav.appearance.label'), icon: SunMoon, desc: t('nav.appearance.desc') },
  ]

  const TAB_CONFIG: Record<TabType, { title: string; desc: string }> = {
    profile: {
      title: t('tabs.profile.title'),
      desc: t('tabs.profile.desc'),
    },
    generation: {
      title: t('tabs.generation.title'),
      desc: t('tabs.generation.desc'),
    },
    tools: {
      title: t('tabs.tools.title'),
      desc: t('tabs.tools.desc'),
    },
    quota: {
      title: t('tabs.quota.title'),
      desc: t('tabs.quota.desc'),
    },
    stats: {
      title: t('tabs.stats.title'),
      desc: t('tabs.stats.desc'),
    },
    appearance: {
      title: t('tabs.appearance.title'),
      desc: t('tabs.appearance.desc'),
    },
  }
  const [prefs, setPrefs] = useState<SpheraPreferencesData | null>(null)
  const [profile, setProfile] = useState<SpheraProfileData | null>(null)
  const [stats, setStats] = useState<SpheraStatsData | null>(null)
  const [quota, setQuota] = useState<GenerationQuota | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Sync tab with initialTab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
      loadData()
    }
  }, [isOpen, initialTab])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [prefsRes, profRes, statsRes, quotaRes] = await Promise.allSettled([
        getSpheraPreferences(),
        getSpheraProfile(),
        getSpheraStats(),
        getQuota(),
      ])

      if (prefsRes.status === 'fulfilled' && prefsRes.value.data) {
        setPrefs(prefsRes.value.data)
        if (prefsRes.value.data.theme === 'clair' || prefsRes.value.data.theme === 'sombre') {
          applyTheme(prefsRes.value.data.theme)
        }
      }
      if (profRes.status === 'fulfilled' && profRes.value.data) {
        setProfile(profRes.value.data)
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        setStats(statsRes.value.data)
      }
      if (quotaRes.status === 'fulfilled' && quotaRes.value.data) {
        setQuota(quotaRes.value.data)
      }
    } catch (err) {
      console.warn('[sphera-settings] Error loading settings data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePreference = async (updates: Partial<SpheraPreferencesData>) => {
    // Optimistic state update
    setPrefs((prev) => (prev ? { ...prev, ...updates } : null))
    setIsSaving(true)
    setSaveSuccess(false)

    // If theme changed, apply immediately
    if (updates.theme) {
      applyTheme(updates.theme as SpheraTheme)
    }

    try {
      const res = await updateSpheraPreferences(updates)
      if (res.data) {
        setPrefs(res.data)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err) {
      console.error('[sphera-settings] Failed to save preference update:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[92vh] md:h-[82vh] max-h-[760px] bg-sphera-surface border border-sphera-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
          {/* ── DESKTOP SIDEBAR (md+) ── */}
          <div className="hidden md:flex md:w-64 flex-col border-r border-sphera-border bg-sphera-surface-2 shrink-0 p-4 justify-between select-none">
            <div className="space-y-4">
              {/* Modal Brand Header */}
              <div className="flex items-center gap-2.5 px-2 py-1">
                <div className="w-8 h-8 rounded-lg bg-sphera-green/10 border border-sphera-green/30 flex items-center justify-center text-sphera-green shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <Dialog.Title className="text-sm font-semibold text-white tracking-tight leading-tight">
                    Paramètres
                  </Dialog.Title>
                  <Dialog.Description className="text-[10px] text-sphera-text-muted truncate">
                    Configuration Sphera
                  </Dialog.Description>
                </div>
              </div>

              {/* Vertical Navigation Items */}
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeTab === item.id
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left group ${
                        isActive
                          ? 'bg-sphera-green/15 text-sphera-green border border-sphera-green/30 font-semibold shadow-sm'
                          : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface border border-transparent'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-sphera-green' : 'text-sphera-text-muted group-hover:text-white'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{item.label}</div>
                        <div
                          className={`text-[10px] truncate font-normal ${
                            isActive ? 'text-sphera-green/75' : 'text-sphera-text-muted/75'
                          }`}
                        >
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Desktop Sidebar Footer */}
            <div className="pt-3 border-t border-sphera-border/70 text-[11px] text-sphera-text-muted flex items-center justify-between px-2">
              <span className="font-mono text-[10px]">Sphera v2.1</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sphera-surface border border-sphera-border text-sphera-green font-medium">
                Connecté
              </span>
            </div>
          </div>

          {/* ── MOBILE HEADER & HORIZONTAL TABS (< md) ── */}
          <div className="md:hidden shrink-0 border-b border-sphera-border bg-sphera-surface-2">
            <div className="flex items-center justify-between px-4 py-3 border-b border-sphera-border/60">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sphera-green" />
                <span className="text-sm font-semibold text-white">Paramètres Sphera</span>
              </div>
              <div className="flex items-center gap-2">
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-sphera-green" />}
                {saveSuccess && <Check className="w-3.5 h-3.5 text-sphera-green" />}
                <Dialog.Close asChild>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 text-sphera-text-muted hover:text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Scrollable pill tabs */}
            <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-sphera-green/15 text-sphera-green border border-sphera-green/30 font-semibold'
                        : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── RIGHT MAIN CONTENT PANE ── */}
          <div className="flex-1 flex flex-col min-w-0 bg-sphera-surface overflow-hidden">
            {/* Desktop Content Header */}
            <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-sphera-border bg-sphera-surface-2/40 shrink-0">
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  {TAB_CONFIG[activeTab].title}
                </h3>
                <p className="text-xs text-sphera-text-muted mt-0.5">
                  {TAB_CONFIG[activeTab].desc}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {isSaving && (
                  <span className="flex items-center gap-1.5 text-xs text-sphera-text-muted animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sphera-green" />
                    Sauvegarde...
                  </span>
                )}
                {saveSuccess && (
                  <span className="flex items-center gap-1 text-xs text-sphera-green font-medium">
                    <Check className="w-3.5 h-3.5" /> Enregistré
                  </span>
                )}
                <Dialog.Close asChild>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-sphera-text-muted hover:text-white rounded-lg hover:bg-sphera-surface transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar">
              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-sphera-text-muted">
                  <Loader2 className="w-8 h-8 animate-spin text-sphera-green" />
                  <span className="text-xs">Chargement de vos paramètres...</span>
                </div>
              ) : (
                <>
                  {/* ── TAB 1: MON PROFIL (Lecture seule) ── */}
                  {activeTab === 'profile' && (() => {
                    const displayYear = formatStudyYear(profile?.study_year)
                    const displayFaculty = formatFaculty(profile?.faculty)
                    const displayUniversity = formatUniversity(profile?.university)

                    return (
                      <div className="space-y-6 animate-in fade-in duration-150">
                        {/* Profile Header Card */}
                        <div className="p-5 rounded-xl border border-sphera-border bg-sphera-surface-2">
                          <div className="flex items-start gap-4">
                            {profile?.avatar ? (
                              <img
                                src={profile.avatar}
                                alt={profile.full_name || 'Avatar'}
                                className="w-16 h-16 rounded-full object-cover border-2 border-sphera-border shrink-0 shadow-md"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-sphera-surface border-2 border-sphera-border flex items-center justify-center text-lg font-bold text-white shrink-0">
                                {profile?.first_name?.[0]?.toUpperCase() || profile?.username?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}

                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-semibold text-white truncate">
                                  {profile?.full_name || profile?.username || 'Étudiant'}
                                </h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sphera-green/10 text-sphera-green border border-sphera-green/30 font-medium">
                                  SSO Connecté
                                </span>
                              </div>

                              <p className="text-xs text-sphera-text-muted font-medium truncate">
                                {[displayYear, displayFaculty].filter(Boolean).join(' · ') || 'Profil académique CampusSphere'}
                              </p>

                              {displayUniversity && (
                                <p className="text-xs text-sphera-text-muted/80 truncate">
                                  {displayUniversity}
                                </p>
                              )}

                              <div className="pt-1.5">
                                <a
                                  href={profile?.edit_url || 'https://campussphere.app/settings/profile'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-sphera-green hover:underline group"
                                >
                                  <span>Modifier sur CampusSphere</span>
                                  <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Academic Cards (Humanized Values, No Slugs) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-sphera-text-muted tracking-wider">
                              Niveau d'études
                            </span>
                            <p className="text-xs font-semibold text-white">
                              {displayYear || 'Non renseigné'}
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-sphera-text-muted tracking-wider">
                              Filière / Spécialité
                            </span>
                            <p className="text-xs font-semibold text-white truncate" title={displayFaculty}>
                              {displayFaculty || 'Non renseignée'}
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-1">
                            <span className="text-[10px] uppercase font-semibold text-sphera-text-muted tracking-wider">
                              Établissement
                            </span>
                            <p className="text-xs font-semibold text-white truncate" title={displayUniversity}>
                              {displayUniversity || 'Non renseigné'}
                            </p>
                          </div>
                        </div>

                        {/* Source of Truth Information */}
                        <div className="p-4 rounded-xl border border-sphera-border/60 bg-sphera-surface-2/40 text-xs text-sphera-text-muted space-y-2">
                          <div className="flex items-center gap-2 font-medium text-white">
                            <HelpCircle className="w-4 h-4 text-sphera-green" />
                            <span>Source de vérité du profil</span>
                          </div>
                          <p>
                            Sphera utilise les données de votre profil CampusSphere (photo, nom, filière et université) en lecture seule afin d'adapter automatiquement le niveau de difficulté des synthèses et Q&A sans jamais dupliquer vos informations.
                          </p>
                        </div>
                      </div>
                    )
                  })()}

                {/* ── TAB 2: PRÉFÉRENCES DE GÉNÉRATION ── */}
                {activeTab === 'generation' && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    {/* Setting 1: Langue par défaut */}
                    <div className="p-5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-sphera-green" />
                            <h4 className="text-sm font-medium text-white">Langue par défaut</h4>
                          </div>
                          <p className="text-xs text-sphera-text-muted mt-0.5">
                            Contrôle la langue dans laquelle l'IA rédige ses réponses et fiches de cours
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {[
                          { value: 'auto', label: 'Automatique (Défaut)' },
                          { value: 'fr', label: 'Français' },
                          { value: 'en', label: 'English' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleUpdatePreference({ default_language: opt.value as any })}
                            className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                              (prefs?.default_language || 'auto') === opt.value
                                ? 'bg-sphera-green/15 text-sphera-green border-sphera-green font-semibold'
                                : 'bg-sphera-surface text-sphera-text-muted border-sphera-border hover:text-white hover:border-sphera-border/80'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Mini explanation */}
                      <div className="flex items-start gap-2 text-[11px] text-sphera-text-muted bg-sphera-surface p-2.5 rounded-lg border border-sphera-border/60">
                        <Info className="w-4 h-4 text-sphera-green shrink-0 mt-0.5" />
                        <div>
                          {prefs?.default_language === 'fr' && (
                            <span><strong>Français forcé :</strong> Toutes les fiches, questions et réponses seront formulées en français, même si le cours source fourni est en anglais.</span>
                          )}
                          {prefs?.default_language === 'en' && (
                            <span><strong>English forced :</strong> All revision sheets, questions and Q&A answers will be generated strictly in English.</span>
                          )}
                          {(!prefs?.default_language || prefs?.default_language === 'auto') && (
                            <span><strong>Détection automatique :</strong> L'IA s'adapte à la langue de votre document ou de votre question. Si votre cours est en anglais, la synthèse sera rédigée en anglais.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Setting 2: Niveau de détail */}
                    <div className="p-5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-white">Niveau de détail</h4>
                        <p className="text-xs text-sphera-text-muted mt-0.5">
                          Longueur et profondeur des explications pédagogiques
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {[
                          { value: 'court', label: 'Court (Concis)' },
                          { value: 'standard', label: 'Standard (Défaut)' },
                          { value: 'detaille', label: 'Approfondi (Détaillé)' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleUpdatePreference({ detail_level: opt.value as any })}
                            className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                              (prefs?.detail_level || 'standard') === opt.value
                                ? 'bg-sphera-green/15 text-sphera-green border-sphera-green font-semibold'
                                : 'bg-sphera-surface text-sphera-text-muted border-sphera-border hover:text-white hover:border-sphera-border/80'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Mini explanation */}
                      <div className="flex items-start gap-2 text-[11px] text-sphera-text-muted bg-sphera-surface p-2.5 rounded-lg border border-sphera-border/60">
                        <Info className="w-4 h-4 text-sphera-green shrink-0 mt-0.5" />
                        <div>
                          {prefs?.detail_level === 'court' && (
                            <span><strong>Concis :</strong> Va droit au but avec des listes à puces condensées. Idéal pour des révisions express de dernière minute avant un examen.</span>
                          )}
                          {prefs?.detail_level === 'detaille' && (
                            <span><strong>Détaillé :</strong> L'IA approfondit chaque notion, ajoute des démonstrations et des exemples concrets pour une compréhension exhaustive.</span>
                          )}
                          {(!prefs?.detail_level || prefs?.detail_level === 'standard') && (
                            <span><strong>Standard :</strong> Équilibre parfait entre clarté synthétique et explications indispensables pour vos cours universitaires.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Setting 3: Tonalité */}
                    <div className="p-5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-white">Tonalité du tuteur IA</h4>
                        <p className="text-xs text-sphera-text-muted mt-0.5">
                          Le style de communication employé par Sphera dans le chat et les retours
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {[
                          { value: 'decontracte', label: 'Pédagogique & Complice (Défaut)' },
                          { value: 'formel', label: 'Académique & Formel' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleUpdatePreference({ tone: opt.value as any })}
                            className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                              (prefs?.tone || 'decontracte') === opt.value
                                ? 'bg-sphera-green/15 text-sphera-green border-sphera-green font-semibold'
                                : 'bg-sphera-surface text-sphera-text-muted border-sphera-border hover:text-white hover:border-sphera-border/80'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Mini explanation */}
                      <div className="flex items-start gap-2 text-[11px] text-sphera-text-muted bg-sphera-surface p-2.5 rounded-lg border border-sphera-border/60">
                        <Info className="w-4 h-4 text-sphera-green shrink-0 mt-0.5" />
                        <div>
                          {prefs?.tone === 'formel' ? (
                            <span><strong>Académique :</strong> Formulations soutenues, vocabulaire rigoureux et posture académique digne d'un professeur d'amphithéâtre.</span>
                          ) : (
                            <span><strong>Bienveillant :</strong> Ton chaleureux, encourageant et dynamique, idéal pour dédramatiser les révisions complexes.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: PARAMÈTRES PAR OUTIL (Quiz & Flashcards) ── */}
                {activeTab === 'tools' && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    {/* Setting Quiz Questions Count */}
                    <div className="p-5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-white">Nombre de questions (Quiz)</h4>
                          <span className="text-xs font-semibold text-sphera-green">
                            {prefs?.quiz_question_count ? `${prefs.quiz_question_count} questions` : 'Auto (recommandé)'}
                          </span>
                        </div>
                        <p className="text-xs text-sphera-text-muted mt-0.5">
                          Quantité de questions à choix multiples produites pour chaque cours
                        </p>
                      </div>

                      {/* Presets Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdatePreference({ quiz_question_count: null })}
                          className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                            prefs?.quiz_question_count === null || prefs?.quiz_question_count === undefined
                              ? 'bg-sphera-green/15 text-sphera-green border-sphera-green font-semibold'
                              : 'bg-sphera-surface text-sphera-text-muted border-sphera-border hover:text-white'
                          }`}
                        >
                          Auto
                        </button>
                        {[5, 10, 15, 20, 30].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleUpdatePreference({ quiz_question_count: num })}
                            className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                              prefs?.quiz_question_count === num
                                ? 'bg-sphera-green/15 text-sphera-green border-sphera-green font-semibold'
                                : 'bg-sphera-surface text-sphera-text-muted border-sphera-border hover:text-white'
                            }`}
                          >
                            {num} questions
                          </button>
                        ))}
                      </div>

                      {/* Mini explanation */}
                      <div className="flex items-start gap-2 text-[11px] text-sphera-text-muted bg-sphera-surface p-2.5 rounded-lg border border-sphera-border/60">
                        <Info className="w-4 h-4 text-sphera-green shrink-0 mt-0.5" />
                        <div>
                          {prefs?.quiz_question_count ? (
                            <span><strong>Volume fixe :</strong> Sphera générera exactement {prefs.quiz_question_count} questions pour vos quiz. Note : un nombre élevé peut allonger légèrement le temps de réponse initial.</span>
                          ) : (
                            <span><strong>Mode automatique :</strong> Sphera évalue la densité du cours et génère automatiquement le nombre idéal (entre 20 et 30 questions) pour tester exhaustivement chaque chapitre.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Setting Quiz Time Limit */}
                    <div className="p-5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-white">Temps par question (Quiz)</h4>
                          <span className="text-xs font-semibold text-sphera-green">
                            {prefs?.quiz_time_limit || 15} secondes
                          </span>
                        </div>
                        <p className="text-xs text-sphera-text-muted mt-0.5">
                          Temps de réflexion par défaut pour les sessions d'entraînement chronométrées
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[10, 15, 20, 30].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => handleUpdatePreference({ quiz_time_limit: sec })}
                            className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-all flex items-center justify-center gap-1.5 ${
                              (prefs?.quiz_time_limit || 15) === sec
                                ? 'bg-sphera-green/15 text-sphera-green border-sphera-green font-semibold'
                                : 'bg-sphera-surface text-sphera-text-muted border-sphera-border hover:text-white'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {sec} secondes
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Setting Flashcards Count */}
                    <div className="p-5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-white">Nombre de Flashcards</h4>
                          <span className="text-xs font-semibold text-sphera-green">
                            {prefs?.flashcard_count ? `${prefs.flashcard_count} cartes` : 'Auto (recommandé)'}
                          </span>
                        </div>
                        <p className="text-xs text-sphera-text-muted mt-0.5">
                          Nombre de flashcards recto/verso créées par paquet de révision
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdatePreference({ flashcard_count: null })}
                          className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                            prefs?.flashcard_count === null || prefs?.flashcard_count === undefined
                              ? 'bg-sphera-green/15 text-sphera-green border-sphera-green font-semibold'
                              : 'bg-sphera-surface text-sphera-text-muted border-sphera-border hover:text-white'
                          }`}
                        >
                          Auto
                        </button>
                        {[5, 10, 15, 20, 30].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleUpdatePreference({ flashcard_count: num })}
                            className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                              prefs?.flashcard_count === num
                                ? 'bg-sphera-green/15 text-sphera-green border-sphera-green font-semibold'
                                : 'bg-sphera-surface text-sphera-text-muted border-sphera-border hover:text-white'
                            }`}
                          >
                            {num} cartes
                          </button>
                        ))}
                      </div>

                      {/* Mini explanation */}
                      <div className="flex items-start gap-2 text-[11px] text-sphera-text-muted bg-sphera-surface p-2.5 rounded-lg border border-sphera-border/60">
                        <Info className="w-4 h-4 text-sphera-green shrink-0 mt-0.5" />
                        <div>
                          {prefs?.flashcard_count ? (
                            <span><strong>Paquet ciblé :</strong> Sphera créera précisément {prefs.flashcard_count} fiches de mémorisation active couvrant les termes clés essentiels.</span>
                          ) : (
                            <span><strong>Mode automatique :</strong> L'IA ajuste le nombre de cartes (jusqu'à 30) pour couvrir toutes les définitions, théorèmes et formules du cours.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: USAGE & QUOTA (Vue détaillée) ── */}
                {activeTab === 'quota' && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="p-5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white">Consommation hebdomadaire</h4>
                        <span className="text-sm font-bold text-sphera-green">
                          {Number(quota?.used ?? 0).toFixed((quota?.used ?? 0) % 1 === 0 ? 0 : 1)} / {quota?.limit ?? 10} générations
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-3 rounded-full bg-sphera-surface overflow-hidden border border-sphera-border">
                        <div
                          className="h-full bg-sphera-green rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (((quota?.used ?? 0) / (quota?.limit ?? 10)) * 100))}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-sphera-text-muted pt-1">
                        <span>
                          {Math.max(0, (quota?.limit ?? 10) - (quota?.used ?? 0)).toFixed((((quota?.limit ?? 10) - (quota?.used ?? 0)) % 1 === 0) ? 0 : 1)} génération(s) restante(s)
                        </span>
                        <span>
                          {quota?.resetsOn
                            ? `Renouvellement le ${new Date(quota.resetsOn).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                              })}`
                            : 'Renouvellement chaque lundi matin'}
                        </span>
                      </div>
                    </div>

                    {/* Quota Rules Card */}
                    <div className="p-5 rounded-xl border border-sphera-border bg-sphera-surface space-y-3">
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                        Règles de décompte du quota
                      </h4>
                      <ul className="text-xs text-sphera-text-muted space-y-2.5">
                        <li className="flex items-start gap-2">
                          <span className="text-sphera-green font-bold">•</span>
                          <span><strong>1 unité :</strong> Création d'une session complète sur l'ensemble d'un cours (fiche, quiz, flashcards, podcast deep dive).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span><strong>0,5 unité :</strong> Génération ciblée par chapitre (Quiz ou Flashcards par bloc), régénération de fiche ou outil sur texte sélectionné.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span><strong>100% Gratuit (0 quota) :</strong> Assistant Chat Q&A en direct, création de notes personnelles, consultation des fiches et entraînements quiz.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* ── TAB 5: ACTIVITÉ & STREAK (Style GitHub) ── */}
                {activeTab === 'stats' && (
                  <div className="animate-in fade-in duration-150">
                    <ActivityStreakGrid stats={stats} />
                  </div>
                )}

                {/* ── TAB 6: APPARENCE & THÈME ── */}
                {activeTab === 'appearance' && (() => {
                  const activeTheme = (prefs?.theme === 'clair' || (!prefs?.theme && getSavedTheme() === 'clair')) ? 'clair' : 'sombre'

                  return (
                    <div className="space-y-6 animate-in fade-in duration-150">
                      {/* Setting 0: Langue de l'interface */}
                      <div className="p-5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-sphera-green" />
                              <h4 className="text-sm font-medium text-white">{t('appearance.interfaceLanguageTitle')}</h4>
                            </div>
                            <p className="text-xs text-sphera-text-muted mt-0.5">
                              {t('appearance.interfaceLanguageDesc')}
                            </p>
                          </div>
                          <LanguageSwitcher variant="dropdown" />
                        </div>
                      </div>

                      <div className="p-5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-white">{t('appearance.themeTitle')}</h4>
                          <p className="text-xs text-sphera-text-muted mt-0.5">
                            {t('appearance.themeDesc')}
                          </p>
                        </div>

                        {/* 2 Interactive Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Option 1: Mode Sombre Studio */}
                          <button
                            type="button"
                            onClick={() => handleUpdatePreference({ theme: 'sombre' })}
                            className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 group ${
                              activeTheme === 'sombre'
                                ? 'bg-sphera-green/10 border-sphera-green shadow-sm ring-1 ring-sphera-green/30'
                                : 'bg-sphera-surface border-sphera-border hover:border-sphera-border/80 hover:bg-sphera-surface/80'
                            }`}
                          >
                            <div className="space-y-2">
                              {/* Mini Preview Mock */}
                              <div className="w-full h-20 rounded-lg p-2.5 bg-[#0D0E10] border border-[#222222] flex flex-col justify-between select-none pointer-events-none">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                                    <div className="w-12 h-1.5 rounded bg-[#222222]" />
                                  </div>
                                  <div className="w-6 h-1.5 rounded bg-[#1F1F1F]" />
                                </div>
                                <div className="p-2 rounded bg-[#111111] border border-[#222222] flex items-center justify-between">
                                  <div className="space-y-1">
                                    <div className="w-16 h-1.5 rounded bg-[#F5F5F5]/90" />
                                    <div className="w-10 h-1 rounded bg-[#888888]/60" />
                                  </div>
                                  <div className="w-3.5 h-3.5 rounded bg-[#22C55E]/20 flex items-center justify-center text-[8px] text-[#22C55E]">✓</div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-white">{t('appearance.darkTheme')}</span>
                                  {activeTheme === 'sombre' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sphera-green/20 text-sphera-green font-medium">
                                      {t('appearance.activeBadge')}
                                    </span>
                                  )}
                                </div>
                                {activeTheme === 'sombre' && <Check className="w-4 h-4 text-sphera-green shrink-0" />}
                              </div>

                              <p className="text-xs text-sphera-text-muted">
                                {t('appearance.darkThemeDesc')}
                              </p>
                            </div>

                            {/* Color chips */}
                            <div className="flex items-center gap-1.5 pt-1 border-t border-sphera-border/60">
                              <span className="text-[10px] text-sphera-text-muted mr-1">Palette :</span>
                              <div className="w-3.5 h-3.5 rounded-full bg-[#0D0E10] border border-[#333]" title="Fond #0D0E10" />
                              <div className="w-3.5 h-3.5 rounded-full bg-[#111111] border border-[#333]" title="Surface #111111" />
                              <div className="w-3.5 h-3.5 rounded-full bg-[#222222] border border-[#444]" title="Bordure #222222" />
                              <div className="w-3.5 h-3.5 rounded-full bg-[#22C55E]" title="Primaire #22C55E" />
                            </div>
                          </button>

                          {/* Option 2: Mode Clair Nature */}
                          <button
                            type="button"
                            onClick={() => handleUpdatePreference({ theme: 'clair' })}
                            className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 group ${
                              activeTheme === 'clair'
                                ? 'bg-sphera-green/10 border-sphera-green shadow-sm ring-1 ring-sphera-green/30'
                                : 'bg-sphera-surface border-sphera-border hover:border-sphera-border/80 hover:bg-sphera-surface/80'
                            }`}
                          >
                            <div className="space-y-2">
                              {/* Mini Preview Mock */}
                              <div className="w-full h-20 rounded-lg p-2.5 bg-[#F4FBF7] border border-[#DCEDE2] flex flex-col justify-between select-none pointer-events-none">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                                    <div className="w-12 h-1.5 rounded bg-[#DCEDE2]" />
                                  </div>
                                  <div className="w-6 h-1.5 rounded bg-[#EAF5EE]" />
                                </div>
                                <div className="p-2 rounded bg-[#FFFFFF] border border-[#DCEDE2] shadow-sm flex items-center justify-between">
                                  <div className="space-y-1">
                                    <div className="w-16 h-1.5 rounded bg-[#17301F]" />
                                    <div className="w-10 h-1 rounded bg-[#66806F]" />
                                  </div>
                                  <div className="w-3.5 h-3.5 rounded bg-[#22C55E]/20 flex items-center justify-center text-[8px] text-[#22C55E]">✓</div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-white">{t('appearance.lightTheme')}</span>
                                  {activeTheme === 'clair' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sphera-green/20 text-sphera-green font-medium">
                                      {t('appearance.activeBadge')}
                                    </span>
                                  )}
                                </div>
                                {activeTheme === 'clair' && <Check className="w-4 h-4 text-sphera-green shrink-0" />}
                              </div>

                              <p className="text-xs text-sphera-text-muted">
                                {t('appearance.lightThemeDesc')}
                              </p>
                            </div>

                            {/* Color chips */}
                            <div className="flex items-center gap-1.5 pt-1 border-t border-sphera-border/60">
                              <span className="text-[10px] text-sphera-text-muted mr-1">Palette :</span>
                              <div className="w-3.5 h-3.5 rounded-full bg-[#F4FBF7] border border-[#DCEDE2]" title="Fond #F4FBF7" />
                              <div className="w-3.5 h-3.5 rounded-full bg-[#FFFFFF] border border-[#DCEDE2]" title="Surface #FFFFFF" />
                              <div className="w-3.5 h-3.5 rounded-full bg-[#DCEDE2] border border-[#BBDBC6]" title="Bordure #DCEDE2" />
                              <div className="w-3.5 h-3.5 rounded-full bg-[#17301F]" title="Texte #17301F" />
                              <div className="w-3.5 h-3.5 rounded-full bg-[#22C55E]" title="Primaire #22C55E" />
                            </div>
                          </button>
                        </div>

                        {/* Mini explanation */}
                        <div className="flex items-start gap-2 text-[11px] text-sphera-text-muted bg-sphera-surface p-3 rounded-lg border border-sphera-border/60">
                          <Info className="w-4 h-4 text-sphera-green shrink-0 mt-0.5" />
                          <div>
                            {activeTheme === 'clair' ? (
                              <span>
                                <strong>Mode Clair Nature actif :</strong> Conçu avec un fond sauge reposant (<code className="text-[10px] px-1 py-0.5 rounded bg-sphera-surface-2 border border-sphera-border/60">#F4FBF7</code>), des cartes blanches pures (<code className="text-[10px] px-1 py-0.5 rounded bg-sphera-surface-2 border border-sphera-border/60">#FFFFFF</code>), des bordures pastel (<code className="text-[10px] px-1 py-0.5 rounded bg-sphera-surface-2 border border-sphera-border/60">#DCEDE2</code>) et une typographie forêt sombre (<code className="text-[10px] px-1 py-0.5 rounded bg-sphera-surface-2 border border-sphera-border/60">#17301F</code>) pour éliminer toute fatigue oculaire en plein jour.
                              </span>
                            ) : (
                              <span>
                                <strong>Mode Sombre Studio actif :</strong> Idéal pour les révisions nocturnes et les environnements peu éclairés. Fond noir carbone (<code className="text-[10px] px-1 py-0.5 rounded bg-sphera-surface-2 border border-sphera-border/60">#0D0E10</code>) avec contraste optimisé sur les accents émeraude (<code className="text-[10px] px-1 py-0.5 rounded bg-sphera-surface-2 border border-sphera-border/60">#22C55E</code>).
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        </div>
      </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
