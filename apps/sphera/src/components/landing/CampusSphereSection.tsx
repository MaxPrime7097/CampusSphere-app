import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight } from '@phosphor-icons/react'
import { Reveal } from '../public/SpheraMotion'

export function CampusSphereSection() {
  const { t } = useTranslation('landing')

  return (
    <section className="py-16 md:py-24 border-t border-sphera-border/70 bg-[#0f1114] relative overflow-hidden">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="rounded-3xl border border-cs-orange/30 bg-gradient-to-br from-[#161310] via-[#121316] to-[#111316] overflow-hidden relative">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cs-orange/15 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-12 items-center">
              <div className="md:col-span-8 p-8 sm:p-11 relative z-10">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-cs-orange mb-3">
                  {t('campusSphere.badge')}
                </p>

                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                  {t('campusSphere.title')}
                </h2>

                <p className="text-sm sm:text-base text-sphera-text-muted leading-relaxed mb-7 max-w-2xl">
                  {t('campusSphere.description')}
                </p>

                <a
                  href="https://campussphere.app/cs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-[#0A0A0A] font-semibold text-sm px-6 py-3 hover:bg-cs-orange hover:text-white transition-colors duration-200 group"
                >
                  <span>{t('campusSphere.cta')}</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>

              <div className="md:col-span-4 p-8 sm:p-10 flex items-center justify-center border-t md:border-t-0 md:border-l border-white/[0.06] bg-black/20">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-24 h-24 rounded-2xl bg-[#181614] border border-cs-orange/35 flex items-center justify-center shadow-[0_16px_40px_-14px_rgba(255,152,0,0.35)]">
                    <img
                      src="/CS.svg"
                      alt="CampusSphere"
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg text-white">CampusSphere</p>
                    <p className="font-mono text-[11px] text-cs-orange/90">campussphere.app/cs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
