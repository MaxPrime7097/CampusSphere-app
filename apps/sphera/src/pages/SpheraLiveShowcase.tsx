import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'
import { Reveal } from '../components/public/SpheraMotion'
import {
  Lightning as Zap,
  Trophy,
  Clock,
  Sparkle as Sparkles,
  Play,
  SignIn as LogIn,
  ArrowRight,
  FileArrowUp as FileUp,
  GearSix as Settings2,
  FileCode,
  GraduationCap,
  GameController as Gamepad2,
  SpeakerHigh as Volume2,
  DeviceMobile as Smartphone,
  Flame,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react'

export default function SpheraLiveShowcase() {
  const { t } = useTranslation('showcase')
  const [pickedOption, setPickedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null)

  const demoOptions: { id: 'A' | 'B' | 'C' | 'D'; label: string; correct?: boolean }[] = [
    { id: 'A', label: '2015' },
    { id: 'B', label: '2018', correct: true },
    { id: 'C', label: '2020' },
    { id: 'D', label: '2022' },
  ]

  const featureItems = [
    { icon: Smartphone, title: t('features.f1Title'), desc: t('features.f1Desc') },
    { icon: Volume2, title: t('features.f2Title'), desc: t('features.f2Desc') },
    { icon: Trophy, title: t('features.f3Title'), desc: t('features.f3Desc') },
    { icon: Flame, title: t('features.f4Title'), desc: t('features.f4Desc') },
    { icon: Zap, title: t('features.f5Title'), desc: t('features.f5Desc') },
    { icon: Sparkles, title: t('features.f6Title'), desc: t('features.f6Desc') },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>{t('seo.title')}</title>
        <meta name="description" content={t('seo.description')} />
        <link rel="canonical" href="https://sphera.campussphere.app/sphera-live" />
        <meta property="og:title" content={t('seo.title')} />
        <meta property="og:description" content={t('seo.description')} />
        <meta property="og:image" content="https://sphera.campussphere.app/sphera_preview.webp" />
      </Helmet>

      <SpheraHeader />

      <main className="flex-1 overflow-hidden">
        {/* ── Hero Section ─────────────────────────────── */}
        <section className="relative pt-16 pb-16 md:pt-24 md:pb-24 overflow-hidden text-center">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[780px] h-[440px] bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.12)_0%,transparent_70%)] blur-3xl pointer-events-none" />

          <div className="container mx-auto max-w-5xl px-4 sm:px-6 relative z-10 flex flex-col items-center">
            <Reveal immediate>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green mb-4 inline-flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" weight="fill" />
                {t('hero.eyebrow')}
              </p>
            </Reveal>

            <Reveal immediate delay={60}>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-bold text-white tracking-[-0.03em] leading-[1.06] mb-6">
                {t('hero.titlePart1')}{' '}
                <span className="bg-gradient-to-r from-sphera-green via-emerald-300 to-green-400 bg-clip-text text-transparent">
                  {t('hero.titlePart2')}
                </span>
              </h1>
            </Reveal>

            <Reveal immediate delay={120}>
              <p className="text-base sm:text-lg md:text-xl text-sphera-text-muted max-w-2xl mb-10 leading-relaxed">
                {t('hero.subtitle')}
              </p>
            </Reveal>

            <Reveal immediate delay={180} className="w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-center gap-3.5 justify-center mb-10">
                <Link
                  to="/live"
                  className="sphera-primary-btn text-base px-7 py-3.5 w-full sm:w-auto inline-flex items-center justify-center gap-2 group"
                >
                  <Play className="w-4 h-4" weight="fill" />
                  <span>{t('hero.hostCta')}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/live/join"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 hover:border-sphera-green/40 px-7 py-3.5 text-base font-semibold text-white transition-all"
                >
                  <LogIn className="w-4 h-4 text-sphera-green" />
                  <span>{t('hero.joinCta')}</span>
                </Link>
              </div>
            </Reveal>

            <Reveal immediate delay={220}>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-sphera-text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-sphera-green" /> {t('hero.pills.sso')}
                </span>
                <span className="hidden sm:inline text-sphera-border">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-sphera-green" /> {t('hero.pills.audio')}
                </span>
                <span className="hidden sm:inline text-sphera-border">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-sphera-green" /> {t('hero.pills.devices')}
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Interactive Live Preview Card ────────────── */}
        <section className="pb-20 relative max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="relative rounded-3xl border border-sphera-green/30 bg-[#121518] p-5 sm:p-9 shadow-[0_28px_80px_-24px_rgba(0,0,0,0.85)] overflow-hidden">
              {/* Header Simulation */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-sphera-border">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-sphera-green/15 border border-sphera-green/35 flex items-center justify-center text-sphera-green">
                    <Zap className="w-6 h-6" weight="fill" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold text-sphera-green uppercase tracking-wider">
                        {t('mockup.waitingRoom')}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-sphera-green" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-white">
                      {t('mockup.quizTitle')}
                    </h2>
                  </div>
                </div>

                <div className="bg-sphera-bg border border-sphera-green/30 px-4 py-2 rounded-2xl text-left sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                  <span className="text-[10px] text-sphera-text-muted uppercase font-mono tracking-wider">
                    {t('mockup.joinCodeLabel')}
                  </span>
                  <span className="font-mono text-xl font-bold text-sphera-green tracking-[0.22em]">
                    LIVE26
                  </span>
                </div>
              </div>

              {/* Interactive Question Screen */}
              <div className="my-7 bg-sphera-bg rounded-2xl border border-sphera-border p-5 sm:p-7">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-mono uppercase text-sphera-text-muted tracking-wider font-semibold">
                    {t('mockup.questionLabel')}
                  </span>
                  <div className="flex items-center gap-1.5 bg-sphera-surface px-3 py-1 rounded-full border border-sphera-border">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-mono font-semibold text-amber-300">
                      {t('mockup.timeRemaining')}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-sphera-surface h-1.5 rounded-full mb-6 overflow-hidden">
                  <div className="bg-gradient-to-r from-sphera-green to-amber-400 h-full w-[42%] rounded-full" />
                </div>

                <h3 className="font-display text-lg sm:text-2xl font-bold text-white mb-6 leading-snug">
                  {t('mockup.sampleQuestion')}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {demoOptions.map((opt) => {
                    const isPicked = pickedOption === opt.id
                    const hasAnswered = pickedOption !== null
                    let btnStyle =
                      'bg-sphera-surface border-sphera-border text-white hover:border-sphera-green/50'
                    if (hasAnswered && opt.correct) {
                      btnStyle = 'bg-sphera-green/15 border-sphera-green text-white font-bold'
                    } else if (hasAnswered && isPicked && !opt.correct) {
                      btnStyle = 'bg-red-500/10 border-red-500/70 text-red-200'
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPickedOption(opt.id)}
                        className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between gap-3 transition-all text-left cursor-pointer ${btnStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-white/[0.06] font-mono font-bold flex items-center justify-center text-xs">
                            {opt.id}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                        {hasAnswered && opt.correct && (
                          <CheckCircle className="w-5 h-5 text-sphera-green shrink-0" weight="fill" />
                        )}
                        {hasAnswered && isPicked && !opt.correct && (
                          <XCircle className="w-5 h-5 text-red-400 shrink-0" weight="fill" />
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4">
                  {pickedOption ? (
                    <p
                      className={`text-xs sm:text-sm font-medium ${
                        pickedOption === 'B' ? 'text-sphera-green' : 'text-amber-300'
                      }`}
                    >
                      {pickedOption === 'B'
                        ? t('mockup.correctFeedback')
                        : t('mockup.wrongFeedback')}
                    </p>
                  ) : (
                    <p className="font-mono text-xs text-sphera-text-muted">{t('mockup.tryHint')}</p>
                  )}
                </div>
              </div>

              {/* Podium Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {[
                  { rank: '1', label: t('mockup.topScorer'), name: 'Nadia K. · 6 840 pts', top: true },
                  { rank: '2', label: t('mockup.secondPlace'), name: 'Boris M. · 6 210 pts', top: false },
                  { rank: '3', label: t('mockup.thirdPlace'), name: 'Amina T. · 5 980 pts', top: false },
                ].map((item) => (
                  <div
                    key={item.rank}
                    className={`p-4 rounded-2xl border flex items-center gap-3 ${
                      item.top
                        ? 'bg-sphera-green/[0.08] border-sphera-green/35'
                        : 'bg-sphera-surface border-sphera-border'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-sm ${
                        item.top
                          ? 'bg-sphera-green text-black'
                          : 'bg-white/[0.06] text-sphera-text-muted'
                      }`}
                    >
                      {item.rank}
                    </div>
                    <div>
                      <span className="text-[11px] font-mono text-sphera-text-muted block">
                        {item.label}
                      </span>
                      <span className="text-sm font-bold text-white">{item.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── 3 Ways to Create ─────────────────────────── */}
        <section className="py-20 md:py-28 border-t border-sphera-border/70 bg-[#0f1114]">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="max-w-2xl mb-14">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green mb-3">
                {t('ways.eyebrow')}
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                {t('ways.title')}
              </h2>
              <p className="text-sphera-text-muted text-base md:text-lg">{t('ways.subtitle')}</p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: FileUp,
                  title: t('ways.way1.title'),
                  desc: t('ways.way1.description'),
                  tag: t('ways.way1.tag'),
                },
                {
                  icon: Settings2,
                  title: t('ways.way2.title'),
                  desc: t('ways.way2.description'),
                  tag: t('ways.way2.tag'),
                },
                {
                  icon: FileCode,
                  title: t('ways.way3.title'),
                  desc: t('ways.way3.description'),
                  tag: t('ways.way3.tag'),
                },
              ].map((way, idx) => {
                const Icon = way.icon
                return (
                  <Reveal key={idx} delay={idx * 80}>
                    <div className="sphera-panel-lift h-full rounded-2xl border border-sphera-border bg-sphera-bg p-7 flex flex-col justify-between hover:border-sphera-green/45">
                      <div>
                        <div className="w-11 h-11 rounded-xl bg-sphera-green/10 border border-sphera-green/25 flex items-center justify-center text-sphera-green mb-5">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-display text-xl font-bold text-white mb-2.5">
                          {way.title}
                        </h3>
                        <p className="text-sm text-sphera-text-muted leading-relaxed mb-6">
                          {way.desc}
                        </p>
                      </div>
                      <div className="text-xs font-mono text-sphera-green bg-sphera-surface px-3.5 py-2.5 rounded-xl border border-sphera-border/80">
                        {way.tag}
                      </div>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Dual Use Cases: Study & Fun ──────────────── */}
        <section className="py-20 md:py-28 border-t border-sphera-border/70">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="max-w-2xl mb-14">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green mb-3">
                {t('universes.eyebrow')}
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                {t('universes.title')}
              </h2>
              <p className="text-sphera-text-muted text-base md:text-lg">
                {t('universes.subtitle')}
              </p>
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Study */}
              <Reveal>
                <div className="h-full p-8 sm:p-10 rounded-3xl bg-[#121714] border border-sphera-green/30 flex flex-col justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-sphera-green inline-flex items-center gap-2 mb-4">
                      <GraduationCap className="w-4 h-4" />
                      {t('universes.study.badge')}
                    </p>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
                      {t('universes.study.title')}
                    </h3>
                    <p className="text-sphera-text-muted text-sm sm:text-base leading-relaxed mb-6">
                      {t('universes.study.description')}
                    </p>
                    <ul className="space-y-3 text-sm text-sphera-text mb-8">
                      {[t('universes.study.item1'), t('universes.study.item2'), t('universes.study.item3')].map(
                        (item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-sphera-green mt-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                  <Link
                    to="/live"
                    className="inline-flex items-center gap-2 text-sphera-green font-semibold text-sm hover:gap-3 transition-all"
                  >
                    {t('universes.study.cta')} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </Reveal>

              {/* Fun */}
              <Reveal delay={100}>
                <div className="h-full p-8 sm:p-10 rounded-3xl bg-sphera-surface border border-sphera-border flex flex-col justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-emerald-300 inline-flex items-center gap-2 mb-4">
                      <Gamepad2 className="w-4 h-4" />
                      {t('universes.fun.badge')}
                    </p>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
                      {t('universes.fun.title')}
                    </h3>
                    <p className="text-sphera-text-muted text-sm sm:text-base leading-relaxed mb-6">
                      {t('universes.fun.description')}
                    </p>
                    <ul className="space-y-3 text-sm text-sphera-text mb-8">
                      {[t('universes.fun.item1'), t('universes.fun.item2'), t('universes.fun.item3')].map(
                        (item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                  <Link
                    to="/live"
                    className="inline-flex items-center gap-2 text-white hover:text-sphera-green font-semibold text-sm hover:gap-3 transition-all"
                  >
                    {t('universes.fun.cta')} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Key Features Grid ────────────────────────── */}
        <section className="py-20 md:py-28 border-t border-sphera-border/70 bg-[#0f1114]">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal className="max-w-2xl mb-14">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green mb-3">
                {t('features.eyebrow')}
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                {t('features.title')}
              </h2>
              <p className="text-sphera-text-muted text-base md:text-lg">
                {t('features.subtitle')}
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featureItems.map((feat, idx) => {
                const Icon = feat.icon
                return (
                  <Reveal key={idx} delay={idx * 50}>
                    <div className="sphera-panel-lift h-full p-6 rounded-2xl bg-sphera-bg border border-sphera-border hover:border-sphera-green/40">
                      <div className="w-10 h-10 rounded-xl bg-sphera-green/10 border border-sphera-green/20 flex items-center justify-center text-sphera-green mb-4">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-display text-lg font-bold text-white mb-2">
                        {feat.title}
                      </h3>
                      <p className="text-sm text-sphera-text-muted leading-relaxed">{feat.desc}</p>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Final Call to Action ─────────────────────── */}
        <section className="py-20 border-t border-sphera-border/70">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <Reveal>
              <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-[#131915] to-sphera-surface border border-sphera-green/30">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
                  {t('finalCta.title')}
                </h2>
                <p className="text-base sm:text-lg text-sphera-text-muted max-w-xl mx-auto mb-9">
                  {t('finalCta.subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                  <Link
                    to="/live"
                    className="sphera-primary-btn text-base px-7 py-3.5 w-full sm:w-auto inline-flex items-center justify-center gap-2 group"
                  >
                    <Play className="w-4 h-4" weight="fill" />
                    <span>{t('finalCta.cta')}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    to="/blogs/sphera-live-quiz-multijoueur-en-direct"
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-sphera-border bg-sphera-bg hover:border-sphera-green/40 text-sphera-text hover:text-white text-base px-7 py-3.5 font-semibold transition-colors"
                  >
                    {t('finalCta.blogCta')}
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SpheraFooter />
    </div>
  )
}
