import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import { Reveal } from '../components/public/SpheraMotion'
import {
  Check,
  Brain,
  FileText,
  Waveform,
  GitFork,
  Stack,
  ChatCircle,
  Bell,
  Highlighter,
  NotePencil,
  Lightning as Zap,
  ArrowRight,
  ArrowUpRight,
  Sparkle,
} from '@phosphor-icons/react'

export default function Pricing() {
  const { t } = useTranslation('pricing')
  const { isAuthenticated } = useSpheraAuth()

  const featureCards = [
    { icon: FileText, label: t('features.items.sheets.title'), desc: t('features.items.sheets.description') },
    { icon: NotePencil, label: t('features.items.annales.title'), desc: t('features.items.annales.description') },
    { icon: Brain, label: t('features.items.quiz.title'), desc: t('features.items.quiz.description') },
    { icon: Stack, label: t('features.items.flashcards.title'), desc: t('features.items.flashcards.description') },
    { icon: ChatCircle, label: t('features.items.qa.title'), desc: t('features.items.qa.description') },
    { icon: Highlighter, label: t('features.items.reader.title'), desc: t('features.items.reader.description') },
    { icon: Waveform, label: t('features.items.audio.title'), desc: t('features.items.audio.description') },
    { icon: GitFork, label: t('features.items.mindmap.title'), desc: t('features.items.mindmap.description') },
    { icon: Zap, label: t('features.items.live.title'), desc: t('features.items.live.description') },
  ]

  const cardFeatures = t('card.features', { returnObjects: true }) as string[]
  const proFeatures = t('proCard.features', { returnObjects: true }) as string[]

  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>{t('seo.title')}</title>
        <meta name="description" content={t('seo.description')} />
        <link rel="canonical" href="https://sphera.campussphere.app/pricing" />
        <meta property="og:title" content={t('seo.ogTitle')} />
        <meta property="og:description" content={t('seo.ogDescription')} />
        <meta property="og:url" content="https://sphera.campussphere.app/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://sphera.campussphere.app/sphera_preview.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('seo.twitterTitle')} />
        <meta name="twitter:description" content={t('seo.twitterDescription')} />
        <meta name="twitter:image" content="https://sphera.campussphere.app/sphera_preview.webp" />
      </Helmet>

      <SpheraHeader />

      <main className="flex-1 pt-16 pb-24 md:pt-24 relative overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[780px] h-[420px] bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.1)_0%,transparent_70%)] blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
          {/* Editorial Hero */}
          <Reveal immediate className="text-center max-w-3xl mx-auto mb-16">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green mb-3">
              {t('hero.eyebrow')}
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-[-0.03em] text-white mb-5 leading-[1.06]">
              {t('hero.titlePart1')}{' '}
              <span className="text-sphera-green">{t('hero.titlePart2')}</span>
            </h1>
            <p className="text-base sm:text-lg text-sphera-text-muted max-w-2xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </Reveal>

          {/* 2-Column Plan Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto mb-24 items-stretch">
            {/* Beta Free Card */}
            <Reveal className="lg:col-span-7">
              <div className="h-full rounded-3xl bg-[#121714] border border-sphera-green/60 p-8 sm:p-10 flex flex-col justify-between shadow-[0_24px_70px_-28px_rgba(34,197,94,0.28)] relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <h2 className="font-display text-xl font-bold text-white">
                      {t('card.planName')}
                    </h2>
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-sphera-green/15 border border-sphera-green/35 text-sphera-green">
                      {t('card.badge')}
                    </span>
                  </div>

                  <div className="mb-6 pb-6 border-b border-sphera-border/80">
                    <span className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-white">
                      {t('card.price')}
                    </span>
                    <span className="block font-mono text-sphera-green/90 mt-2 text-xs sm:text-sm">
                      {t('card.pricePeriod')}
                    </span>
                  </div>

                  {/* Transparent Quota Scale */}
                  <div className="rounded-2xl border border-sphera-border bg-sphera-bg/80 p-4 mb-6 space-y-2 text-xs">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-sphera-text-muted mb-2">
                      {t('card.quotaTitle')}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sphera-text">{t('card.quotaFullLabel')}</span>
                      <span className="font-mono font-semibold text-white shrink-0">
                        {t('card.quotaFullCost')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sphera-text">{t('card.quotaTargetedLabel')}</span>
                      <span className="font-mono font-semibold text-sphera-green shrink-0">
                        {t('card.quotaTargetedCost')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-sphera-border/60">
                      <span className="text-sphera-text">{t('card.quotaFreeLabel')}</span>
                      <span className="font-mono font-semibold text-emerald-400 shrink-0">
                        {t('card.quotaFreeCost')}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {Array.isArray(cardFeatures) &&
                      cardFeatures.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-sphera-green/15 border border-sphera-green/30 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-sphera-green" weight="bold" />
                          </div>
                          <span className="text-sphera-text text-sm leading-relaxed">{f}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                <Link
                  to={isAuthenticated ? '/app' : '/register'}
                  className="sphera-primary-btn w-full py-3.5 text-sm inline-flex items-center justify-center gap-2 group"
                >
                  <span>{t('card.cta')}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>

            {/* Coming Soon Pro / Exam Pass Card */}
            <Reveal delay={100} className="lg:col-span-5">
              <div className="h-full rounded-3xl bg-sphera-surface border border-sphera-border p-8 sm:p-9 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <h2 className="font-display text-xl font-bold text-white">
                      {t('proCard.planName')}
                    </h2>
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-white/[0.05] border border-sphera-border text-sphera-text-muted">
                      {t('proCard.badge')}
                    </span>
                  </div>

                  <div className="mb-6 pb-6 border-b border-sphera-border/80">
                    <span className="font-display text-3xl font-bold text-white inline-flex items-center gap-2">
                      <Sparkle className="w-6 h-6 text-sphera-green" />
                      {t('proCard.priceLabel')}
                    </span>
                    <span className="block font-mono text-xs text-sphera-green/90 mt-2">
                      {t('proCard.pricePeriod')}
                    </span>
                  </div>

                  <p className="text-sm text-sphera-text-muted leading-relaxed mb-6">
                    {t('proCard.description')}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {Array.isArray(proFeatures) &&
                      proFeatures.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-sphera-green shrink-0 mt-0.5" />
                          <span className="text-sphera-text-muted text-sm leading-relaxed">{f}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                <a
                  href="#waitlist"
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white border border-sphera-border bg-sphera-bg hover:border-sphera-green/50 hover:bg-sphera-surface-2 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4 text-sphera-green" />
                  {t('proCard.cta')}
                </a>
              </div>
            </Reveal>
          </div>

          {/* Complete 9-Item Studio Grid */}
          <div className="mb-24">
            <Reveal className="max-w-2xl mb-10">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green mb-2.5">
                {t('features.eyebrow')}
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                {t('features.title')}
              </h2>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featureCards.map((f, i) => {
                const Icon = f.icon
                return (
                  <Reveal key={i} delay={(i % 3) * 50}>
                    <div className="sphera-panel-lift h-full bg-sphera-surface rounded-2xl border border-sphera-border p-6 hover:border-sphera-green/40">
                      <div className="w-10 h-10 rounded-xl bg-sphera-green/10 border border-sphera-green/20 flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5 text-sphera-green" />
                      </div>
                      <h3 className="font-display text-white font-bold text-base mb-1.5">
                        {f.label}
                      </h3>
                      <p className="text-sphera-text-muted text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>

          {/* Clean Waitlist Card */}
          <Reveal>
            <section
              id="waitlist"
              className="rounded-3xl bg-sphera-surface border border-sphera-border p-6 sm:p-10 max-w-3xl mx-auto scroll-mt-24"
            >
              <div className="text-center max-w-lg mx-auto mb-8">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green mb-2.5">
                  {t('waitlist.eyebrow')}
                </p>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
                  {t('waitlist.title')}
                </h2>
                <p className="text-sphera-text-muted text-sm leading-relaxed">
                  {t('waitlist.subtitle')}
                </p>
              </div>

              <div className="w-full rounded-2xl bg-[#111316] border border-sphera-border/80 overflow-hidden p-2 sm:p-4">
                <iframe
                  src="https://tally.so/embed/vGdQbl?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                  loading="lazy"
                  width="100%"
                  height="460"
                  frameBorder="0"
                  marginHeight={0}
                  marginWidth={0}
                  title="Sphera Premium Waitlist"
                  className="w-full rounded-xl"
                />
              </div>

              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-sphera-text-muted">
                <span>{t('waitlist.noSpam')}</span>
                <a
                  href="https://tally.so/r/vGdQbl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sphera-green hover:underline font-medium"
                >
                  {t('waitlist.openExternal')}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </section>
          </Reveal>
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
