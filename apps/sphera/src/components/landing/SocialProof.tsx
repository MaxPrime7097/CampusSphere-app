import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Brain, LockKey, GraduationCap, ArrowRight } from '@phosphor-icons/react'
import { useSpheraAuth } from '../../contexts/SpheraAuthContext'
import { Reveal } from '../public/SpheraMotion'

export function SocialProof() {
  const { t } = useTranslation('landing')
  const { isAuthenticated } = useSpheraAuth()

  const pillars = [
    {
      icon: ShieldCheck,
      title: t('socialProof.pillars.fidelity.title'),
      desc: t('socialProof.pillars.fidelity.desc'),
    },
    {
      icon: Brain,
      title: t('socialProof.pillars.activeRecall.title'),
      desc: t('socialProof.pillars.activeRecall.desc'),
    },
    {
      icon: LockKey,
      title: t('socialProof.pillars.privacy.title'),
      desc: t('socialProof.pillars.privacy.desc'),
    },
    {
      icon: GraduationCap,
      title: t('socialProof.pillars.multidisciplinary.title'),
      desc: t('socialProof.pillars.multidisciplinary.desc'),
    },
  ]

  return (
    <section className="py-20 md:py-28 border-t border-sphera-border/70 relative overflow-hidden">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <Reveal className="max-w-2xl mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green mb-3">
            {t('socialProof.eyebrow')}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            {t('socialProof.title')}
          </h2>
          <p className="text-sphera-text-muted text-base md:text-lg leading-relaxed">
            {t('socialProof.subtitle')}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <Reveal key={idx} delay={idx * 70}>
                <div className="sphera-panel-lift h-full p-6 sm:p-7 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 group">
                  <div className="w-10 h-10 rounded-xl bg-sphera-green/10 border border-sphera-green/20 flex items-center justify-center mb-4 text-sphera-green">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white mb-2 group-hover:text-sphera-green transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-sphera-text-muted leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </Reveal>
            )
          })}
        </div>

        {/* Bottom CTA Strip */}
        <Reveal delay={160}>
          <div className="p-7 sm:p-9 rounded-3xl bg-gradient-to-r from-[#121915] via-[#111417] to-[#121915] border border-sphera-green/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-1.5">
                {t('socialProof.banner.title')}
              </h3>
              <p className="text-sm text-sphera-text-muted">
                {t('socialProof.banner.desc')}
              </p>
            </div>
            <Link
              to={isAuthenticated ? '/app' : '/register'}
              className="sphera-primary-btn px-6 py-3 text-sm shrink-0 inline-flex items-center gap-2 group"
            >
              <span>{t('socialProof.banner.cta')}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
