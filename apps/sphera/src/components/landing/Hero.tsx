import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from "@phosphor-icons/react";

export function Hero() {
  const { t } = useTranslation('landing')

  return (
    <section className="relative pt-8 pb-16 md:pt-10 md:pb-24 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle,rgba(34,197,94,0.06)_0%,transparent_70%)] blur-3xl -z-10 pointer-events-none" />
      
      <div className="container mx-auto max-w-5xl px-4 text-center flex flex-col items-center">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sphera-border bg-sphera-surface/50 backdrop-blur-md mb-6 animate-in" style={{ animationDelay: '0ms' }}>
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
        <div className="mt-12 md:mt-16 w-full max-w-5xl relative animate-in" style={{ animationDelay: '400ms' }}>
          {/* Ambient Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-sphera-green/20 via-emerald-500/10 to-teal-500/20 rounded-3xl blur-2xl opacity-60 pointer-events-none" />
          
          <div className="relative rounded-2xl md:rounded-3xl border border-sphera-border/80 bg-sphera-surface-2/90 p-2 sm:p-2.5 shadow-[0_25px_80px_rgba(0,0,0,0.7),0_0_50px_rgba(34,197,94,0.12)] backdrop-blur-xl">
            {/* Window Header Bar */}
            <div className="h-10 sm:h-11 border-b border-sphera-border/70 flex items-center justify-between px-3 sm:px-4 bg-[#141416]/90 rounded-t-xl md:rounded-t-2xl">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* macOS control dots */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sphera-surface text-[11px] text-sphera-text-muted border border-sphera-border/60 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-sphera-green animate-pulse" />
                  sphera.campussphere.app
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-sphera-green bg-sphera-green/10 border border-sphera-green/20 px-2.5 py-0.5 rounded-full">
                  Studio Workspace
                </span>
              </div>
            </div>

            {/* Window Content: Real Sphera Screenshot */}
            <div className="relative overflow-hidden rounded-b-xl md:rounded-b-2xl bg-[#0d0e10]">
              <img
                src="/sphera_preview.png"
                alt="Sphera Workspace - Interface d'étude active avec documents et outils IA"
                className="w-full h-auto object-cover block select-none"
                loading="eager"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
