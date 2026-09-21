import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X,
  User,
  Sliders,
  Sparkles,
  Layers,
  PieChart,
  SunMoon,
  ExternalLink,
  Check,
  Loader2,
  HelpCircle,
  Clock,
  MessageSquare,
  Globe,
  Gauge,
} from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
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
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] bg-sphera-surface border border-sphera-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-sphera-border bg-sphera-surface-2/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sphera-green/10 border border-sphera-green/30 flex items-center justify-center text-sphera-green">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-white tracking-tight">
                  Paramètres Sphera
                </Dialog.Title>
                <Dialog.Description className="text-xs text-sphera-text-muted">
                  Personnalisez votre expérience d'étude, vos quotas et l'intelligence de vos cours
                </Dialog.Description>
              </div>
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

          {/* Navigation Bar / Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-sphera-border bg-sphera-surface shrink-0 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'profile'
                  ? 'bg-sphera-green/10 text-sphera-green border border-sphera-green/30 font-semibold'
                  : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Mon Profil
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('generation')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'generation'
                  ? 'bg-sphera-green/10 text-sphera-green border border-sphera-green/30 font-semibold'
                  : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Préférences IA
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tools')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'tools'
                  ? 'bg-sphera-green/10 text-sphera-green border border-sphera-green/30 font-semibold'
                  : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Outils (Quiz & Flashcards)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quota')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'quota'
                  ? 'bg-sphera-green/10 text-sphera-green border border-sphera-green/30 font-semibold'
                  : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              Usage & Quota
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'stats'
                  ? 'bg-sphera-green/10 text-sphera-green border border-sphera-green/30 font-semibold'
                  : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              Activité & Streak
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'appearance'
                  ? 'bg-sphera-green/10 text-sphera-green border border-sphera-green/30 font-semibold'
                  : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2'
              }`}
            >
              <SunMoon className="w-3.5 h-3.5" />
              Apparence
            </button>
          </div>

          {/* Modal Body / Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-sphera-text-muted">
                <Loader2 className="w-8 h-8 animate-spin text-sphera-green" />
                <span className="text-xs">Chargement de vos paramètres...</span>
              </div>
            ) : (
              <>
                {/* ── TAB 1: MON PROFIL (Lecture seule) ── */}
                {activeTab === 'profile' && (
                  <div className="space-y-6 animate-in fade-in duration-150">
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

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-white truncate">
                              {profile?.full_name || profile?.username || 'Étudiant'}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sphera-green/10 text-sphera-green border border-sphera-green/30 font-medium">
                              SSO Connecté
                            </span>
                          </div>

                          <p className="text-xs text-sphera-text-muted truncate">
                            {[profile?.faculty, profile?.study_year, profile?.university]
                              .filter(Boolean)
                              .join(' · ') || 'Profil académique CampusSphere'}
                          </p>

                          <div className="pt-2">
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
                )}

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
                      <div className="text-[11px] text-sphera-text-muted bg-sphera-surface p-2.5 rounded-lg border border-sphera-border/60">
                        {prefs?.default_language === 'fr' && (
                          <span>💡 <strong>Français forcé :</strong> Toutes les fiches, questions et réponses seront formulées en français, même si le cours source fourni est en anglais.</span>
                        )}
                        {prefs?.default_language === 'en' && (
                          <span>💡 <strong>English forced:</strong> All revision sheets, questions and Q&A answers will be generated strictly in English.</span>
                        )}
                        {(!prefs?.default_language || prefs?.default_language === 'auto') && (
                          <span>💡 <strong>Détection automatique :</strong> L'IA s'adapte à la langue de votre document ou de votre question. Si votre cours est en anglais, la synthèse sera rédigée en anglais.</span>
                        )}
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
                      <div className="text-[11px] text-sphera-text-muted bg-sphera-surface p-2.5 rounded-lg border border-sphera-border/60">
                        {prefs?.detail_level === 'court' && (
                          <span>💡 <strong>Concis :</strong> Va droit au but avec des listes à puces condensées. Idéal pour des révisions express de dernière minute avant un examen.</span>
                        )}
                        {prefs?.detail_level === 'detaille' && (
                          <span>💡 <strong>Détaillé :</strong> L'IA approfondit chaque notion, ajoute des démonstrations et des exemples concrets pour une compréhension exhaustive.</span>
                        )}
                        {(!prefs?.detail_level || prefs?.detail_level === 'standard') && (
                          <span>💡 <strong>Standard :</strong> Équilibre parfait entre clarté synthétique et explications indispensables pour vos cours universitaires.</span>
                        )}
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
                      <div className="text-[11px] text-sphera-text-muted bg-sphera-surface p-2.5 rounded-lg border border-sphera-border/60">
                        {prefs?.tone === 'formel' ? (
                          <span>💡 <strong>Académique :</strong> Formulations soutenues, vocabulaire rigoureux et posture académique digne d'un professeur d'amphithéâtre.</span>
                        ) : (
                          <span>💡 <strong>Bienveillant :</strong> Ton chaleureux, encourageant et dynamique, idéal pour dédramatiser les révisions complexes.</span>
                        )}
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
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
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
                            {num} Qs
                          </button>
                        ))}
                      </div>

                      {/* Mini explanation */}
                      <div className="text-[11px] text-sphera-text-muted bg-sphera-surface p-2.5 rounded-lg border border-sphera-border/60">
                        {prefs?.quiz_question_count ? (
                          <span>💡 <strong>Volume fixe :</strong> Sphera générera exactement {prefs.quiz_question_count} questions pour vos quiz. Note : un nombre élevé peut allonger légèrement le temps de réponse initial.</span>
                        ) : (
                          <span>💡 <strong>Mode automatique :</strong> Sphera évalue la densité du cours et génère automatiquement le nombre idéal (entre 20 et 30 questions) pour tester exhaustivement chaque chapitre.</span>
                        )}
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

                      <div className="grid grid-cols-4 gap-2">
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
                            {sec} s
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Setting Flashcards Count */}
                    <div className="p-5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-white">Nombre de Flashcards (Cartes mémoires)</h4>
                          <span className="text-xs font-semibold text-sphera-green">
                            {prefs?.flashcard_count ? `${prefs.flashcard_count} cartes` : 'Auto (recommandé)'}
                          </span>
                        </div>
                        <p className="text-xs text-sphera-text-muted mt-0.5">
                          Nombre de cartes mémoires recto/verso créées par paquet de révision
                        </p>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
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
                            {num} Cts
                          </button>
                        ))}
                      </div>

                      {/* Mini explanation */}
                      <div className="text-[11px] text-sphera-text-muted bg-sphera-surface p-2.5 rounded-lg border border-sphera-border/60">
                        {prefs?.flashcard_count ? (
                          <span>💡 <strong>Paquet ciblé :</strong> Sphera créera précisément {prefs.flashcard_count} fiches de mémorisation active couvrant les termes clés essentiels.</span>
                        ) : (
                          <span>💡 <strong>Mode automatique :</strong> L'IA ajuste le nombre de cartes (jusqu'à 30) pour couvrir toutes les définitions, théorèmes et formules du cours.</span>
                        )}
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
                          {quota?.used ?? 0} / {quota?.limit ?? 5} générations
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-3 rounded-full bg-sphera-surface overflow-hidden border border-sphera-border">
                        <div
                          className="h-full bg-sphera-green rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (((quota?.used ?? 0) / (quota?.limit ?? 5)) * 100))}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-sphera-text-muted pt-1">
                        <span>
                          {Math.max(0, (quota?.limit ?? 5) - (quota?.used ?? 0))} génération(s) restante(s)
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
                      <ul className="text-xs text-sphera-text-muted space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-sphera-green font-bold">•</span>
                          <span><strong>1 unité :</strong> Création d'une session complète à partir d'un cours (génération simultanée de la fiche, du quiz, des flashcards et de la carte mentale).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sphera-green font-bold">•</span>
                          <span><strong>0,5 unité :</strong> Réponses approfondies du Chat Q&A ou génération ciblée d'items depuis une sélection de texte surlignée.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sphera-green font-bold">•</span>
                          <span><strong>Gratuit :</strong> Consultation de vos cours, révision des flashcards, entraînements illimités sur les quiz générés et parties Sphera Live.</span>
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
                {activeTab === 'appearance' && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    <div className="p-5 rounded-xl border border-sphera-border bg-sphera-surface-2 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-white">Thème de l'interface</h4>
                        <p className="text-xs text-sphera-text-muted mt-0.5">
                          Personnalisez le contraste visuel de l'application selon vos préférences d'étude
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-1">
                        {[
                          { value: 'system', label: 'Système', desc: 'S\'adapte à l\'OS' },
                          { value: 'sombre', label: 'Sombre', desc: 'Mode nuit (défaut)' },
                          { value: 'clair', label: 'Clair', desc: 'Blanc doux reposant' },
                        ].map((t) => {
                          const currentTheme = prefs?.theme || getSavedTheme()
                          const isSelected = currentTheme === t.value

                          return (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => handleUpdatePreference({ theme: t.value as any })}
                              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-sphera-green/15 text-white border-sphera-green ring-1 ring-sphera-green'
                                  : 'bg-sphera-surface text-sphera-text-muted border-sphera-border hover:text-white hover:border-sphera-border/80'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-semibold text-xs text-white">{t.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-sphera-green" />}
                              </div>
                              <span className="text-[10px] text-sphera-text-muted mt-2">{t.desc}</span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Mini explanation */}
                      <div className="text-[11px] text-sphera-text-muted bg-sphera-surface p-2.5 rounded-lg border border-sphera-border/60">
                        {prefs?.theme === 'clair' ? (
                          <span>💡 <strong>Thème clair actif :</strong> Palette douce conçue pour éviter l'éblouissement tout en préservant le vert de marque `#22C55E` et les contrastes de lecture.</span>
                        ) : prefs?.theme === 'system' ? (
                          <span>💡 <strong>Mode système :</strong> Sphera détecte automatiquement les préférences de votre système d'exploitation et bascule en mode sombre ou clair en temps réel.</span>
                        ) : (
                          <span>💡 <strong>Thème sombre actif :</strong> Conçu pour maximiser la concentration et réduire la fatigue oculaire lors des sessions d'apprentissage prolongées.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
