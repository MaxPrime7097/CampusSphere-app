import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Brain, LockKey, GraduationCap, ArrowRight, Sparkle } from "@phosphor-icons/react";

export function SocialProof() {
  const { t } = useTranslation('landing')

  const pillars = [
    {
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      title: t('socialProof.pillars.fidelity.title'),
      desc: t('socialProof.pillars.fidelity.desc')
    },
    {
      icon: Brain,
      color: 'text-sphera-green',
      bg: 'bg-sphera-green/10 border-sphera-green/20',
      title: t('socialProof.pillars.activeRecall.title'),
      desc: t('socialProof.pillars.activeRecall.desc')
    },
    {
      icon: LockKey,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      title: t('socialProof.pillars.privacy.title'),
      desc: t('socialProof.pillars.privacy.desc')
    },
    {
      icon: GraduationCap,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      title: t('socialProof.pillars.multidisciplinary.title'),
      desc: t('socialProof.pillars.multidisciplinary.desc')
    }
  ]

  return (
    <section className="py-20 md:py-28 bg-sphera-surface relative overflow-hidden border-t border-sphera-border">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[radial-gradient(circle,rgba(34,197,94,0.04)_0%,transparent_70%)] blur-3xl pointer-events-none -z-0" />

      <div className="container mx-auto max-w-5xl px-4 text-center relative z-10">
        
        <div className="inline-flex flex-col items-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-sphera-border bg-sphera-surface-2 text-xs text-sphera-green font-medium mb-3">
            <Sparkle className="w-3.5 h-3.5" />
            <span>Excellence académique</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            {t('socialProof.title')}
          </h2>
          <p className="text-sphera-text-muted text-base md:text-lg max-w-2xl leading-relaxed">
            {t('socialProof.subtitle')}
          </p>
        </div>

        {/* 4 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left mb-12">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <div 
                key={idx} 
                className="p-6 rounded-2xl bg-sphera-bg border border-sphera-border hover:border-sphera-border/80 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${pillar.bg}`}>
                    <Icon className={`w-5 h-5 ${pillar.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-sphera-green transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-sphera-text-muted leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Banner */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-sphera-surface-2 via-sphera-bg to-sphera-surface-2 border border-sphera-border flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h4 className="text-base font-semibold text-white mb-1">
              {t('socialProof.banner.title')}
            </h4>
            <p className="text-xs sm:text-sm text-sphera-text-muted">
              {t('socialProof.banner.desc')}
            </p>
          </div>
          <Link
            to="/app"
            className="sphera-primary-btn px-6 py-2.5 text-sm font-semibold shrink-0 inline-flex items-center gap-2 group"
          >
            <span>{t('socialProof.banner.cta')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  )
}
