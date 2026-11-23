import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Brain, ChatCircle, ArrowUpRight } from '@phosphor-icons/react'

export function SpheraAuthLanguageToggle() {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith('en') ? 'en' : 'fr'

  return (
    <div
      className="inline-flex items-center rounded-full border border-sphera-border bg-sphera-surface p-0.5 text-xs font-mono"
      role="group"
      aria-label="Language switcher"
    >
      {(['fr', 'en'] as const).map((lng) => {
        const active = current === lng
        return (
          <button
            key={lng}
            type="button"
            onClick={() => i18n.changeLanguage(lng)}
            className={`px-2.5 py-1 rounded-full font-semibold uppercase transition-all cursor-pointer ${
              active
                ? 'bg-sphera-green text-black shadow-sm'
                : 'text-sphera-text-muted hover:text-white'
            }`}
          >
            {lng}
          </button>
        )
      })}
    </div>
  )
}

export function SpheraAuthSidePanel() {
  const { t } = useTranslation('auth')
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const scenes = [
    {
      key: 'sheets',
      index: t('sidePanel.features.sheets.index'),
      badge: t('sidePanel.features.sheets.badge'),
      title: t('sidePanel.features.sheets.title'),
      description: t('sidePanel.features.sheets.description'),
      icon: BookOpen,
    },
    {
      key: 'quiz',
      index: t('sidePanel.features.quiz.index'),
      badge: t('sidePanel.features.quiz.badge'),
      title: t('sidePanel.features.quiz.title'),
      description: t('sidePanel.features.quiz.description'),
      icon: Brain,
    },
    {
      key: 'qa',
      index: t('sidePanel.features.qa.index'),
      badge: t('sidePanel.features.qa.badge'),
      title: t('sidePanel.features.qa.title'),
      description: t('sidePanel.features.qa.description'),
      icon: ChatCircle,
    },
  ]

  useEffect(() => {
    if (paused) return
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % scenes.length)
    }, 4200)
    return () => window.clearInterval(timer)
  }, [paused, scenes.length])

  const activeScene = scenes[activeIndex]
  const ActiveIcon = activeScene.icon

  return (
    <aside
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="hidden lg:flex relative h-full w-full flex-col justify-between p-10 xl:p-12 overflow-hidden border-l border-sphera-border bg-gradient-to-br from-[#0c0e10] via-[#101412] to-[#0a0c0b]"
    >
      {/* Subtle architectural grid & ambient radial light */}
      <div
        className="absolute inset-0 pointer-events-none opacity-45"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(circle at 50% 45%, black 20%, transparent 78%)',
        }}
      />
      <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] bg-[radial-gradient(circle,rgba(34,197,94,0.14)_0%,transparent_70%)] blur-3xl pointer-events-none" />

      {/* Top Bar: Ecosystem Link + Language Toggle */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        <a
          href="https://campussphere.app/cs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sphera-border bg-sphera-surface/70 backdrop-blur-md text-xs text-sphera-text-muted hover:border-cs-orange/50 hover:text-white transition-colors"
        >
          <img src="/CS.svg" alt="CampusSphere" className="w-4 h-4 object-contain" />
          <span>
            {t('sidePanel.poweredBy')}{' '}
            <strong className="text-white font-semibold">CampusSphere</strong>
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-cs-orange" />
        </a>

        <SpheraAuthLanguageToggle />
      </div>

      {/* Centerpiece: Clean Orbital Core + Rotating Active Card */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-8">
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
          {/* Smooth concentric orbital rings */}
          <div className="absolute inset-0 rounded-full border border-sphera-green/15 animate-[spin_28s_linear_infinite]">
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sphera-green shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
          </div>
          <div className="absolute inset-6 rounded-full border border-dashed border-sphera-green/20 animate-[spin_42s_linear_infinite_reverse]" />
          <div className="absolute inset-12 rounded-full bg-gradient-to-tr from-sphera-green/20 via-emerald-500/10 to-transparent border border-sphera-green/35 shadow-[0_0_50px_rgba(34,197,94,0.2)] flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-[#0d100e] border border-sphera-green/50 flex items-center justify-center">
              <img
                src="/sphera_logo.svg"
                alt={t('sidePanel.coreAlt')}
                className="w-11 h-11 object-contain"
              />
            </div>
          </div>

          {/* Subtle status chip */}
          <div className="absolute -bottom-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111513] border border-sphera-green/30 text-[11px] font-mono text-sphera-green">
            <span className="w-1.5 h-1.5 rounded-full bg-sphera-green" />
            {t('sidePanel.liveStatus')}
          </div>
        </div>

        {/* Active Synchronized Feature Card */}
        <div
          key={activeScene.key}
          className="w-full max-w-md rounded-2xl border border-sphera-green/30 bg-[#121614]/90 backdrop-blur-xl p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] transition-all duration-300"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-sphera-green/15 border border-sphera-green/35 text-sphera-green flex items-center justify-center shrink-0">
              <ActiveIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] text-sphera-green font-semibold">
                  {activeScene.index}
                </span>
                <span className="text-sphera-border">·</span>
                <span className="font-mono text-[11px] text-sphera-text-muted uppercase tracking-wider">
                  {activeScene.badge}
                </span>
              </div>
              <h4 className="font-display text-base font-bold text-white mb-1">
                {activeScene.title}
              </h4>
              <p className="text-xs text-sphera-text-muted leading-relaxed">
                {activeScene.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Editorial Pitch + Clickable 01/02/03 Pillars */}
      <div className="relative z-10 space-y-6">
        <div className="max-w-md">
          <h3 className="font-display text-2xl xl:text-3xl font-bold tracking-tight text-white mb-1.5">
            {t('sidePanel.brandPitch.title')}
          </h3>
          <p className="text-xs sm:text-sm text-sphera-text-muted leading-relaxed">
            {t('sidePanel.brandPitch.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-white/[0.08]">
          {scenes.map((scene, idx) => {
            const isActive = idx === activeIndex
            return (
              <button
                key={scene.key}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`text-left rounded-xl p-2.5 border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sphera-green/10 border-sphera-green/45'
                    : 'bg-white/[0.02] border-transparent hover:border-white/10'
                }`}
              >
                <span
                  className={`font-mono text-[10px] block mb-0.5 ${
                    isActive ? 'text-sphera-green font-bold' : 'text-sphera-text-muted'
                  }`}
                >
                  {scene.index}
                </span>
                <span
                  className={`text-xs font-semibold block truncate ${
                    isActive ? 'text-white' : 'text-sphera-text-muted'
                  }`}
                >
                  {scene.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
