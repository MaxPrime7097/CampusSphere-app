import React from 'react'
import { useTranslation } from 'react-i18next'
import { UploadSimple, SlidersHorizontal, BookOpenText } from '@phosphor-icons/react'
import { Reveal } from '../public/SpheraMotion'

export function HowItWorks() {
  const { t } = useTranslation('landing')

  const steps = [
    {
      index: '01',
      icon: UploadSimple,
      title: t('howItWorks.step1Title'),
      desc: t('howItWorks.step1Desc'),
      meta: t('howItWorks.step1Meta'),
    },
    {
      index: '02',
      icon: SlidersHorizontal,
      title: t('howItWorks.step2Title'),
      desc: t('howItWorks.step2Desc'),
      meta: t('howItWorks.step2Meta'),
    },
    {
      index: '03',
      icon: BookOpenText,
      title: t('howItWorks.step3Title'),
      desc: t('howItWorks.step3Desc'),
      meta: t('howItWorks.step3Meta'),
    },
  ]

  return (
    <section className="py-20 md:py-28 border-t border-sphera-border/70 bg-[#0f1114] relative">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green mb-3">
            {t('howItWorks.eyebrow')}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            {t('howItWorks.title')}
          </h2>
          <p className="text-sphera-text-muted text-base md:text-lg leading-relaxed">
            {t('howItWorks.subtitle')}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <Reveal key={step.index} delay={idx * 90}>
                <div className="sphera-panel-lift h-full rounded-2xl border border-sphera-border bg-sphera-bg p-7 flex flex-col justify-between group hover:border-sphera-green/40">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-11 h-11 rounded-xl bg-sphera-green/10 border border-sphera-green/20 flex items-center justify-center text-sphera-green transition-transform duration-300 group-hover:scale-105">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-semibold text-sphera-text-muted">
                        {step.index}
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-white mb-2.5">
                      {step.title}
                    </h3>
                    <p className="text-sm text-sphera-text-muted leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-sphera-border/60">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-sphera-green/90">
                      {step.meta}
                    </span>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
