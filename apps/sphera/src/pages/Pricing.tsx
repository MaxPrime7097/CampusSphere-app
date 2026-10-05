import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'
import { Sparkle as Sparkles, Check, Brain as BrainCircuit, FileText, Stack as SquareStack, ChatCircle as MessageSquare, Bell, Scan as ScanEye, NotePencil as FilePenLine } from "@phosphor-icons/react";

export default function Pricing() {
  const { t } = useTranslation('pricing')

  const featureCards = [
    { icon: FileText, label: t('features.items.sheets.title'), desc: t('features.items.sheets.description') },
    { icon: BrainCircuit, label: t('features.items.quiz.title'), desc: t('features.items.quiz.description') },
    { icon: SquareStack, label: t('features.items.flashcards.title'), desc: t('features.items.flashcards.description') },
    { icon: MessageSquare, label: t('features.items.qa.title'), desc: t('features.items.qa.description') },
    { icon: FilePenLine, label: t('features.items.annales.title'), desc: t('features.items.annales.description') },
    { icon: ScanEye, label: t('features.items.ocr.title'), desc: t('features.items.ocr.description') },
  ]

  const cardFeatures = t('card.features', { returnObjects: true }) as string[]

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
        <meta property="og:image" content="https://sphera.campussphere.app/sphera_logo.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('seo.twitterTitle')} />
        <meta name="twitter:description" content={t('seo.twitterDescription')} />
        <meta name="twitter:image" content="https://sphera.campussphere.app/sphera_logo.svg" />
      </Helmet>

      <SpheraHeader />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-sphera-green/5 blur-[150px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 max-w-5xl relative z-10">

          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-sphera-green/10 border border-sphera-green/20 text-sphera-green text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              {t('hero.badge')}
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
              {t('hero.titlePart1')}<br />
              <span className="text-sphera-green">{t('hero.titlePart2')}</span>
            </h1>
            <p className="text-xl text-sphera-text-muted max-w-2xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Big free card */}
          <div className="max-w-lg mx-auto mb-20">
            <div className="relative bg-sphera-surface rounded-3xl border border-sphera-green shadow-[0_0_60px_rgba(34,197,94,0.08)] p-10 text-center">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sphera-green text-black text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                {t('card.badge')}
              </div>

              <div className="mb-6">
                <span className="text-7xl font-black text-white">{t('card.price')}</span>
                <span className="block text-sphera-text-muted mt-1 text-sm">{t('card.pricePeriod')}</span>
              </div>

              <ul className="text-left space-y-3 mb-8">
                {Array.isArray(cardFeatures) && cardFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-sphera-green/15 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-sphera-green" />
                    </div>
                    <span className="text-white text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className="block w-full py-3.5 rounded-xl font-bold text-black bg-sphera-green hover:bg-green-400 transition-all text-sm shadow-[0_0_20px_rgba(34,197,94,0.25)]"
              >
                {t('card.cta')}
              </Link>
            </div>
          </div>

          {/* Features grid */}
          <div className="mb-20">
            <h2 className="text-2xl font-display font-bold text-white text-center mb-10">
              {t('features.title')}
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {featureCards.map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} className="bg-sphera-surface rounded-2xl border border-sphera-border p-6 hover:border-sphera-green/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-sphera-green/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-sphera-green" />
                    </div>
                    <h3 className="text-white font-semibold text-sm mb-1">{f.label}</h3>
                    <p className="text-sphera-text-muted text-xs leading-relaxed">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tally waitlist embed */}
          <div className="bg-sphera-surface rounded-3xl border border-sphera-border p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-sphera-green/10 flex items-center justify-center mx-auto mb-5">
              <Bell className="w-6 h-6 text-sphera-green" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-3">
              {t('waitlist.title')}
            </h2>
            <p className="text-sphera-text-muted text-sm max-w-md mx-auto mb-8 leading-relaxed">
              {t('waitlist.subtitle')}
            </p>

            <div className="w-full min-h-[140px] rounded-xl border border-dashed border-sphera-border flex items-center justify-center text-sphera-text-muted text-sm">
              <iframe
                src="https://tally.so/embed/vGdQbl?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                loading="lazy"
                width="90%"
                height="1000"
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                title="Sphera Premium Waitlist"
              />  
            </div>

            <p className="text-xs text-sphera-text-muted/50 mt-6">
              {t('waitlist.noSpam')}
            </p>
          </div>

        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
