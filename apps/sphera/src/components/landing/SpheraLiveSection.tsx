import React from 'react'
import { Link } from 'react-router-dom'
import { Lightning as Zap, Users, Trophy, Clock, ArrowRight, Play, Sparkle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { Reveal } from '../public/SpheraMotion'

export function SpheraLiveSection() {
  const { t } = useTranslation('landing')

  const bullets = [
    { icon: Users, title: t('liveSection.bullet1Title'), desc: t('liveSection.bullet1Desc') },
    { icon: Clock, title: t('liveSection.bullet2Title'), desc: t('liveSection.bullet2Desc') },
    { icon: Trophy, title: t('liveSection.bullet3Title'), desc: t('liveSection.bullet3Desc') },
    { icon: Sparkle, title: t('liveSection.bullet4Title'), desc: t('liveSection.bullet4Desc') },
  ]

  return (
    <section className="py-20 md:py-28 border-t border-sphera-border/70 bg-[#0f1114] relative overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[560px] h-[560px] bg-[radial-gradient(circle,rgba(34,197,94,0.08)_0%,transparent_70%)] blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Narrative */}
          <Reveal className="lg:col-span-6 space-y-6">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green inline-flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" weight="fill" />
              {t('liveSection.badge')}
            </p>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.08]">
              {t('liveSection.titlePrefix')}{' '}
              <span className="text-sphera-green">{t('liveSection.titleHighlight')}</span>
              {t('liveSection.titleSuffix')}
            </h2>

            <p className="text-base md:text-lg text-sphera-text-muted leading-relaxed">
              {t('liveSection.description')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {bullets.map((b, idx) => {
                const Icon = b.icon
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-sphera-bg border border-sphera-border text-sphera-green shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{b.title}</h3>
                      <p className="text-xs text-sphera-text-muted leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              <Link
                to="/live"
                className="sphera-primary-btn text-sm px-6 py-3 inline-flex items-center gap-2 group"
              >
                <Play className="w-4 h-4" weight="fill" />
                <span>{t('liveSection.launchGame')}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/sphera-live"
                className="rounded-xl border border-sphera-border bg-sphera-bg hover:border-sphera-green/40 hover:bg-sphera-surface text-white text-sm px-6 py-3 font-semibold transition-colors"
              >
                {t('liveSection.learnMore')}
              </Link>
            </div>
          </Reveal>

          {/* Right Live Session Card */}
          <Reveal delay={120} className="lg:col-span-6">
            <div className="rounded-3xl border border-sphera-green/25 bg-[#121518] p-5 sm:p-6 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.85)]">
              {/* Room Header */}
              <div className="flex items-center justify-between gap-3 border-b border-sphera-border pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sphera-green/15 border border-sphera-green/35 flex items-center justify-center text-sphera-green">
                    <Zap className="w-5 h-5" weight="fill" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-sphera-green block">
                      {t('liveSection.mockup.waitingRoom')}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {t('liveSection.mockup.roomTitle')}
                    </h3>
                  </div>
                </div>

                <div className="bg-sphera-bg border border-sphera-border px-3 py-1.5 rounded-xl text-right">
                  <span className="text-[10px] text-sphera-text-muted block uppercase font-mono">
                    {t('liveSection.mockup.pinCode')}
                  </span>
                  <span className="font-mono text-sm sm:text-base font-bold text-sphera-green tracking-[0.2em]">
                    LIVE26
                  </span>
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-sphera-bg rounded-2xl border border-sphera-border p-4 sm:p-5 mb-4">
                <div className="flex items-center justify-between text-xs text-sphera-text-muted mb-3 font-mono">
                  <span>{t('liveSection.mockup.questionProgress')}</span>
                  <span className="text-sphera-green font-semibold">
                    {t('liveSection.mockup.timeRemaining')}
                  </span>
                </div>

                <p className="text-sm sm:text-base font-bold text-white mb-4 leading-snug">
                  {t('liveSection.mockup.sampleQuestion')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                  <div className="p-2.5 rounded-xl bg-sphera-surface border border-sphera-border text-sphera-text-muted flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-white/5 font-mono text-[10px] flex items-center justify-center">
                      A
                    </span>
                    {t('liveSection.mockup.optionA')}
                  </div>
                  <div className="p-2.5 rounded-xl bg-sphera-green/15 border border-sphera-green text-white font-semibold flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-sphera-green text-black font-mono font-bold text-[10px] flex items-center justify-center">
                      B
                    </span>
                    {t('liveSection.mockup.optionB')}
                  </div>
                  <div className="p-2.5 rounded-xl bg-sphera-surface border border-sphera-border text-sphera-text-muted flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-white/5 font-mono text-[10px] flex items-center justify-center">
                      C
                    </span>
                    {t('liveSection.mockup.optionC')}
                  </div>
                  <div className="p-2.5 rounded-xl bg-sphera-surface border border-sphera-border text-sphera-text-muted flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-white/5 font-mono text-[10px] flex items-center justify-center">
                      D
                    </span>
                    {t('liveSection.mockup.optionD')}
                  </div>
                </div>
              </div>

              {/* Compact Leaderboard */}
              <div className="bg-sphera-bg rounded-2xl border border-sphera-border p-4">
                <div className="flex items-center justify-between text-xs text-sphera-text-muted mb-3">
                  <span className="font-mono uppercase text-[11px] tracking-wider text-white flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" weight="fill" />
                    {t('liveSection.mockup.liveLeaderboard')}
                  </span>
                  <span className="font-mono text-[11px]">
                    {t('liveSection.mockup.connectedParticipants')}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { rank: '1', name: 'Nadia K.', pts: '3 420 pts', top: true },
                    { rank: '2', name: 'Boris M.', pts: '3 180 pts', top: false },
                    { rank: '3', name: 'Amina T.', pts: '2 950 pts', top: false },
                  ].map((row) => (
                    <div
                      key={row.rank}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border ${
                        row.top
                          ? 'bg-sphera-green/[0.08] border-sphera-green/35'
                          : 'bg-sphera-surface border-sphera-border/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-full font-mono font-bold text-[11px] flex items-center justify-center ${
                            row.top
                              ? 'bg-sphera-green text-black'
                              : 'bg-white/[0.06] text-sphera-text-muted'
                          }`}
                        >
                          {row.rank}
                        </span>
                        <span className="font-semibold text-white">{row.name}</span>
                      </div>
                      <span className="font-mono font-semibold text-sphera-green">{row.pts}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
