import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '@cs/i18n'
import { 
  ArrowRight, 
  FileText, 
  ArrowLeft, 
  MessageSquare, 
  Share2, 
  CheckCircle2, 
  List, 
  Maximize2 
} from 'lucide-react'

export function Hero() {
  const { t } = useTranslation('landing')

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle,rgba(34,197,94,0.06)_0%,transparent_70%)] blur-3xl -z-10 pointer-events-none" />
      
      <div className="container mx-auto max-w-5xl px-4 text-center flex flex-col items-center">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sphera-border bg-sphera-surface/50 backdrop-blur-md mb-8 animate-in" style={{ animationDelay: '0ms' }}>
          <span>{t('hero.poweredBy')}</span>
          <a href="https://campussphere.app" target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-cs-orange transition-colors">
            CampusSphere
          </a>
        </div>

        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 animate-in" style={{ animationDelay: '100ms' }}>
          {t('hero.titleLine1')} <br className="hidden md:block" />
          <span className="bg-gradient-to-br from-green-400 to-sphera-green bg-clip-text text-transparent">
            {t('hero.titleHighlight')}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-sphera-text-muted max-w-2xl mb-10 leading-relaxed font-light animate-in" style={{ animationDelay: '200ms' }}>
          {t('hero.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in" style={{ animationDelay: '300ms' }}>
          <Link to="/app" className="sphera-primary-btn text-lg px-8 py-3.5 w-full sm:w-auto flex items-center justify-center gap-2 group">
            {t('hero.ctaTryFree')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/login" className="btn btn-outline border-sphera-border text-white hover:bg-sphera-surface px-8 py-3.5 rounded-lg font-semibold w-full sm:w-auto">
            {t('hero.ctaLogin')}
          </Link>
        </div>

        {/* ── Authentic Sphera App Workspace Mockup ─────── */}
        <div className="mt-16 w-full max-w-5xl relative animate-in" style={{ animationDelay: '400ms' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-sphera-bg via-transparent to-transparent z-10 pointer-events-none" />
          
          <div className="rounded-2xl md:rounded-3xl border border-sphera-border bg-sphera-surface-2 p-2 sm:p-3 shadow-[0_0_60px_rgba(34,197,94,0.12)]">
            <div className="rounded-xl md:rounded-2xl overflow-hidden bg-sphera-bg border border-sphera-border/60 h-[480px] md:h-[540px] relative text-left flex flex-col">
              
              {/* Window Header Bar matching SessionDetail */}
              <div className="h-14 border-b border-sphera-border flex items-center justify-between px-4 bg-sphera-surface-2/90 backdrop-blur-md z-20">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Window control dots */}
                  <div className="flex gap-1.5 mr-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/60" />
                  </div>

                  <div className="p-1.5 text-sphera-text-muted hover:text-white rounded-md transition-colors hidden sm:block">
                    <ArrowLeft className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-sphera-green shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[200px] md:max-w-[280px]">
                      neurobiologie_chapitre1.pdf
                    </span>
                  </div>
                </div>

                {/* Workspace Tabs: Fiche, Quiz, Flashcards, Q&A */}
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 bg-sphera-bg p-1 rounded-lg border border-sphera-border/60">
                    <div className="px-3 py-1.5 rounded-md text-xs font-semibold bg-sphera-surface text-white shadow-sm">
                      Fiche
                    </div>
                    <div className="px-3 py-1.5 rounded-md text-xs font-semibold text-sphera-text-muted hidden sm:block">
                      Quiz
                    </div>
                    <div className="px-3 py-1.5 rounded-md text-xs font-semibold text-sphera-text-muted hidden md:block">
                      Flashcards
                    </div>
                    <div className="px-3 py-1.5 rounded-md text-xs font-semibold text-sphera-text-muted flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Q&A
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-sphera-border text-sphera-text-muted">
                    <Share2 className="w-4 h-4" />
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Workspace Body: Split Document View & Generated Results */}
              <div className="flex-1 relative flex overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />

                {/* ── Left Column: Original Document Viewer ── */}
                <div className="hidden md:flex w-[42%] border-r border-sphera-border bg-[#161618] relative z-10 p-5 flex-col overflow-hidden">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-sphera-border/60 text-[11px] text-sphera-text-muted font-mono">
                    <span>Page 1 sur 14</span>
                    <span className="bg-sphera-surface px-2 py-0.5 rounded text-white text-[10px]">100%</span>
                  </div>

                  {/* Academic Document Paper */}
                  <div className="flex-1 bg-sphera-surface/90 rounded-xl border border-sphera-border p-5 text-left text-xs space-y-3 shadow-inner relative overflow-hidden">
                    <div className="text-[10px] uppercase font-mono tracking-widest text-sphera-text-muted border-b border-sphera-border/60 pb-2">
                      Faculté des Sciences &bull; Neurophysiologie
                    </div>

                    <h5 className="font-bold text-white text-sm leading-snug">
                      Chapitre 1 : Les Mécanismes de la Transmission Synaptique
                    </h5>

                    <p className="text-sphera-text-muted leading-relaxed text-[11px]">
                      La communication inter-neuronale repose sur le transfert unidirectionnel d'informations électriques ou chimiques.
                    </p>

                    <div className="p-3 rounded-lg bg-sphera-bg border border-sphera-border text-sphera-text text-[11px] leading-relaxed">
                      L'onde de dépolarisation du potentiel d'action provoque l'ouverture immédiate des canaux calciques voltage-dépendants, entraînant l'exocytose des neurotransmetteurs stockés dans les vésicules présynaptiques.
                    </div>

                    <p className="text-sphera-text-muted leading-relaxed text-[11px]">
                      Les molécules diffusent ensuite dans la fente synaptique (20 à 40 nm) avant de se fixer sur leurs récepteurs cibles.
                    </p>
                  </div>
                </div>

                {/* ── Right Column: Generated Workspace Content ── */}
                <div className="flex-1 p-5 md:p-7 relative z-10 overflow-hidden flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Header line */}
                    <div className="flex items-center justify-between pb-3 border-b border-sphera-border/60">
                      <div>
                        <p className="text-xs text-sphera-green font-semibold">Fiche de révision</p>
                        <p className="text-[11px] text-sphera-text-muted">Généré le 10/09/2026 &bull; Analyse IA complète</p>
                      </div>
                      <span className="text-[11px] text-sphera-text-muted/60 font-mono hidden sm:inline-block">
                        sphera.campussphere.app
                      </span>
                    </div>

                    {/* Fiche Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                      Neurophysiologie : La Transmission Synaptique
                    </h3>

                    {/* Résumé Card */}
                    <div className="sphera-card p-4">
                      <h4 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Résumé
                      </h4>
                      <p className="text-sphera-text-muted text-xs leading-relaxed">
                        Synthèse concise des étapes de la transmission chimique : dépolarisation, ouverture des canaux Ca²⁺, exocytose vésiculaire et fixation sur les récepteurs post-synaptiques.
                      </p>
                    </div>

                    {/* Points clés Card */}
                    <div className="sphera-card p-4">
                      <h4 className="text-sphera-green text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Points clés
                      </h4>
                      <ul className="space-y-1.5 text-xs text-sphera-text-muted">
                        <li className="flex items-start gap-2">
                          <span className="text-sphera-green font-bold shrink-0">1.</span>
                          <span>Dépolarisation de la membrane présynaptique par le potentiel d'action.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sphera-green font-bold shrink-0">2.</span>
                          <span>Influx massif d'ions Ca²⁺ déclenchant la libération vésiculaire.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Définitions Card */}
                    <div className="sphera-card p-4 hidden sm:block">
                      <h4 className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <List className="w-3.5 h-3.5" /> Définition
                      </h4>
                      <div className="border border-sphera-border rounded-lg p-2.5 bg-sphera-bg/50 text-xs">
                        <span className="font-semibold text-white">Fente synaptique : </span>
                        <span className="text-sphera-text-muted">Espace extracellulaire de 20 à 40 nm entre neurones pré et post-synaptiques.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Fade */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-sphera-bg to-transparent z-20 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
