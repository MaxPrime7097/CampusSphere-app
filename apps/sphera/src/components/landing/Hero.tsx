import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Lightning as Zap, FilePdf, CheckCircle, ShieldCheck } from '@phosphor-icons/react'
import { useSpheraAuth } from '../../contexts/SpheraAuthContext'
import { Reveal } from '../public/SpheraMotion'

export function Hero() {
  const { t } = useTranslation('landing')
  const { isAuthenticated } = useSpheraAuth()

  return (
    <section className="relative pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Subtle architectural grid + restrained emerald top glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 75% 60% at 50% 15%, black 15%, transparent 80%)',
        }}
      />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[760px] h-[420px] bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.12)_0%,transparent_70%)] blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal immediate>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold tracking-[-0.03em] leading-[1.04] text-white mb-6">
              {t('hero.titleLine1')}{' '}
              <span className="bg-gradient-to-r from-sphera-green via-emerald-300 to-green-400 bg-clip-text text-transparent">
                {t('hero.titleHighlight')}
              </span>
            </h1>
          </Reveal>

          <Reveal immediate delay={80}>
            <p className="text-base sm:text-lg md:text-xl text-sphera-text-muted max-w-2xl mx-auto leading-relaxed mb-9">
              {t('hero.subtitle')}
            </p>
          </Reveal>

          <Reveal immediate delay={140}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to={isAuthenticated ? '/app' : '/register'}
                className="sphera-primary-btn text-base px-7 py-3.5 w-full sm:w-auto inline-flex items-center justify-center gap-2 group"
              >
                <span>{isAuthenticated ? t('hero.ctaOpenApp') : t('hero.ctaTryFree')}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                to="/sphera-live"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 hover:border-sphera-green/40 px-7 py-3.5 text-base font-semibold text-white transition-all"
              >
                <Zap className="w-4 h-4 text-sphera-green" weight="fill" />
                <span>{t('hero.ctaLive')}</span>
              </Link>
            </div>
          </Reveal>

          {/* Quiet factual trust row (no pill clutter) */}
          <Reveal immediate delay={200}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-sphera-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <FilePdf className="w-4 h-4 text-sphera-green" />
                {t('hero.proofFormats')}
              </span>
              <span className="hidden sm:inline text-sphera-border">·</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-sphera-green" />
                {t('hero.proofBeta')}
              </span>
              <span className="hidden sm:inline text-sphera-border">·</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sphera-green" />
                {t('hero.proofSso')}
              </span>
            </div>
          </Reveal>
        </div>

        {/* ── Real Sphera Studio Workspace Frame ── */}
        <Reveal delay={240} className="mt-12 md:mt-16 max-w-5xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-px rounded-2xl md:rounded-[26px] bg-gradient-to-b from-sphera-green/35 via-white/10 to-transparent opacity-80 pointer-events-none" />
            <div className="relative rounded-2xl md:rounded-[25px] bg-[#121417] p-1.5 sm:p-2 shadow-[0_32px_90px_-24px_rgba(0,0,0,0.85),0_0_60px_-20px_rgba(34,197,94,0.2)]">
              {/* Minimal Window Chrome */}
              <div className="h-10 sm:h-11 px-3.5 sm:px-4 flex items-center justify-between border-b border-white/[0.06] bg-[#0e1013] rounded-t-xl md:rounded-t-[19px]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-sphera-text-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-sphera-green" />
                    sphera.campussphere.app
                  </div>
                </div>
                <span className="font-mono text-[11px] text-sphera-green/90">
                  {t('hero.windowBadge')}
                </span>
              </div>

              {/* Screenshot */}
              <div className="relative overflow-hidden rounded-b-xl md:rounded-b-[19px] bg-[#0d0e10]">
                <img
                  src="/sphera_preview.webp"
                  alt={t('hero.previewAlt')}
                  className="w-full h-auto object-cover block select-none transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
