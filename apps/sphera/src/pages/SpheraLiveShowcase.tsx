import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'
import { Lightning as Zap, Trophy, Clock, Sparkle as Sparkles, Play, SignIn as LogIn, ArrowRight, FileArrowUp as FileUp, GearSix as Settings2, FileCode, GraduationCap, GameController as Gamepad2, SpeakerHigh as Volume2, DeviceMobile as Smartphone, Flame, CheckCircle as CheckCircle2 } from "@phosphor-icons/react";

export default function SpheraLiveShowcase() {
  const { t } = useTranslation('showcase')

  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>{t('seo.title')}</title>
        <meta name="description" content={t('seo.description')} />
      </Helmet>

      <SpheraHeader />

      <main className="flex-1 overflow-hidden">
        {/* ── Hero Section ─────────────────────────────── */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden text-center">
          {/* Ambient Glows */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-[radial-gradient(circle,rgba(34,197,94,0.12)_0%,transparent_70%)] blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-10 right-10 w-72 h-72 bg-sphera-green/5 blur-3xl pointer-events-none -z-10" />

          <div className="container mx-auto max-w-5xl px-4 relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sphera-green/10 border border-sphera-green/30 text-sphera-green text-xs md:text-sm font-bold uppercase tracking-wider mb-8 shadow-lg shadow-sphera-green/10 animate-fade-in-up">
              <Zap className="w-4 h-4 fill-sphera-green" />
              {t('hero.badge')}
            </div>

            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 animate-fade-in-up">
              {t('hero.titlePart1')} <br />
              <span className="bg-gradient-to-r from-sphera-green via-emerald-400 to-green-300 bg-clip-text text-transparent">
                {t('hero.titlePart2')}
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-sphera-text-muted max-w-3xl mb-12 font-light leading-relaxed animate-fade-in-up">
              {t('hero.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center mb-16 animate-fade-in-up">
              <Link 
                to="/live" 
                className="sphera-primary-btn text-base md:text-lg px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2 group shadow-xl shadow-sphera-green/20"
              >
                <Play className="w-5 h-5 fill-black" />
                {t('hero.hostCta')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                to="/live/join" 
                className="btn btn-outline border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-white hover:border-sphera-green/50 text-base md:text-lg px-8 py-4 rounded-xl font-semibold w-full sm:w-auto flex items-center justify-center gap-2 transition-all"
              >
                <LogIn className="w-5 h-5 text-sphera-green" />
                {t('hero.joinCta')}
              </Link>
            </div>

            {/* Quick feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-sphera-text-muted border-t border-sphera-border/60 pt-8 w-full max-w-3xl">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sphera-green" /> {t('hero.pills.sso')}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sphera-green" /> {t('hero.pills.audio')}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sphera-green" /> {t('hero.pills.devices')}
              </span>
            </div>
          </div>
        </section>

        {/* ── Interactive Live Preview Card ────────────── */}
        <section className="py-12 relative max-w-5xl mx-auto px-4">
          <div className="relative rounded-3xl border border-sphera-green/30 bg-sphera-surface-2/90 backdrop-blur-xl p-6 sm:p-10 shadow-[0_0_80px_rgba(34,197,94,0.15)] overflow-hidden">
            
            {/* Header Simulation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-sphera-border">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-sphera-green/20 border border-sphera-green/40 flex items-center justify-center text-sphera-green">
                  <Zap className="w-7 h-7 fill-sphera-green" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-sphera-green uppercase tracking-wider">{t('mockup.waitingRoom')}</span>
                    <span className="w-2 h-2 rounded-full bg-sphera-green animate-ping" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">{t('mockup.quizTitle')}</h3>
                </div>
              </div>

              <div className="bg-sphera-bg border border-sphera-green/30 px-5 py-2.5 rounded-2xl text-left sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                <span className="text-[11px] text-sphera-text-muted uppercase font-mono tracking-wider">{t('mockup.joinCodeLabel')}</span>
                <span className="font-mono text-2xl font-black text-sphera-green tracking-[0.25em]">LIVE26</span>
              </div>
            </div>

            {/* Question Screen Mockup */}
            <div className="my-8 bg-sphera-bg rounded-2xl border border-sphera-border p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-mono uppercase text-sphera-text-muted tracking-widest font-bold">{t('mockup.questionLabel')}</span>
                <div className="flex items-center gap-2 bg-sphera-surface px-3 py-1 rounded-full border border-sphera-border">
                  <Clock className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-red-400">{t('mockup.timeRemaining')}</span>
                </div>
              </div>

              {/* Progress Timer bar */}
              <div className="w-full bg-sphera-surface h-2 rounded-full mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-sphera-green via-amber-400 to-red-500 h-full w-[35%] rounded-full transition-all" />
              </div>

              <h4 className="text-lg sm:text-2xl font-bold text-white mb-8 leading-snug">
                {t('mockup.sampleQuestion')}
              </h4>

              {/* 4 Answers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-sphera-surface border border-sphera-border text-white text-sm font-medium flex items-center gap-3 hover:border-sphera-green/40 transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 font-bold flex items-center justify-center text-xs">A</span>
                  <span>2015</span>
                </div>

                <div className="p-4 rounded-xl bg-sphera-green/15 border-2 border-sphera-green text-white text-sm font-bold flex items-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                  <span className="w-7 h-7 rounded-lg bg-sphera-green text-black font-bold flex items-center justify-center text-xs">B</span>
                  <span>2018</span>
                  <span className="ml-auto text-xs text-sphera-green font-mono uppercase font-bold">+ 1 240 pts</span>
                </div>

                <div className="p-4 rounded-xl bg-sphera-surface border border-sphera-border text-white text-sm font-medium flex items-center gap-3 hover:border-sphera-green/40 transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">C</span>
                  <span>2020</span>
                </div>

                <div className="p-4 rounded-xl bg-sphera-surface border border-sphera-border text-white text-sm font-medium flex items-center gap-3 hover:border-sphera-green/40 transition-colors">
                  <span className="w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-xs">D</span>
                  <span>2022</span>
                </div>
              </div>
            </div>

            {/* Bottom Podium / Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-sphera-surface border border-yellow-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold font-mono">1</div>
                <div>
                  <span className="text-xs text-sphera-text-muted block">{t('mockup.topScorer')}</span>
                  <span className="text-sm font-bold text-white">Alexandre (6 840 pts)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sphera-surface border border-sphera-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-500/20 text-slate-300 flex items-center justify-center font-bold font-mono">2</div>
                <div>
                  <span className="text-xs text-sphera-text-muted block">{t('mockup.secondPlace')}</span>
                  <span className="text-sm font-bold text-white">Sarah N. (6 210 pts)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-sphera-surface border border-sphera-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-700/20 text-amber-500 flex items-center justify-center font-bold font-mono">3</div>
                <div>
                  <span className="text-xs text-sphera-text-muted block">{t('mockup.thirdPlace')}</span>
                  <span className="text-sm font-bold text-white">Marc B. (5 980 pts)</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── 3 Ways to Create ─────────────────────────── */}
        <section className="py-24 relative">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
                {t('ways.title')}
              </h2>
              <p className="text-sphera-text-muted text-lg max-w-2xl mx-auto">
                {t('ways.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Option 1 */}
              <div className="sphera-card p-8 flex flex-col group hover:border-sphera-green/50 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-sphera-green/10 border border-sphera-green/30 flex items-center justify-center text-sphera-green mb-6 group-hover:scale-110 transition-transform">
                  <FileUp className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-display">{t('ways.way1.title')}</h3>
                <p className="text-sphera-text-muted text-sm leading-relaxed mb-6 flex-1">
                  {t('ways.way1.description')}
                </p>
                <div className="text-xs font-mono text-sphera-green bg-sphera-surface-2 p-3 rounded-xl border border-sphera-border">
                  {t('ways.way1.tag')}
                </div>
              </div>

              {/* Option 2 */}
              <div className="sphera-card p-8 flex flex-col group hover:border-sphera-green/50 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-sphera-surface-2 border border-sphera-border flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:border-sphera-green/40 transition-transform">
                  <Settings2 className="w-7 h-7 text-sphera-green" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-display">{t('ways.way2.title')}</h3>
                <p className="text-sphera-text-muted text-sm leading-relaxed mb-6 flex-1">
                  {t('ways.way2.description')}
                </p>
                <div className="text-xs font-mono text-sphera-green bg-sphera-surface-2 p-3 rounded-xl border border-sphera-border">
                  {t('ways.way2.tag')}
                </div>
              </div>

              {/* Option 3 */}
              <div className="sphera-card p-8 flex flex-col group hover:border-sphera-green/50 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-sphera-surface-2 border border-sphera-border flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:border-sphera-green/40 transition-transform">
                  <FileCode className="w-7 h-7 text-sphera-green" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-display">{t('ways.way3.title')}</h3>
                <p className="text-sphera-text-muted text-sm leading-relaxed mb-6 flex-1">
                  {t('ways.way3.description')}
                </p>
                <div className="text-xs font-mono text-sphera-green bg-sphera-surface-2 p-3 rounded-xl border border-sphera-border">
                  {t('ways.way3.tag')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Dual Use Cases: Study & Fun ──────────────── */}
        <section className="py-24 bg-sphera-surface/50 border-y border-sphera-border relative">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
                {t('universes.title')}
              </h2>
              <p className="text-sphera-text-muted text-lg max-w-2xl mx-auto">
                {t('universes.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Card 1: Study */}
              <div className="p-8 sm:p-10 rounded-3xl bg-sphera-surface-2 border border-sphera-border flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-sphera-green/10 blur-3xl pointer-events-none" />
                
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sphera-green/10 border border-sphera-green/20 text-sphera-green text-xs font-bold uppercase tracking-wider mb-6">
                    <GraduationCap className="w-4 h-4" /> {t('universes.study.badge')}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-display">
                    {t('universes.study.title')}
                  </h3>

                  <p className="text-sphera-text-muted text-base leading-relaxed mb-6">
                    {t('universes.study.description')}
                  </p>

                  <ul className="space-y-3 text-sm text-sphera-text mb-8">
                    <li className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sphera-green" />
                      {t('universes.study.item1')}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sphera-green" />
                      {t('universes.study.item2')}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sphera-green" />
                      {t('universes.study.item3')}
                    </li>
                  </ul>
                </div>

                <Link 
                  to="/live" 
                  className="inline-flex items-center gap-2 text-sphera-green font-bold text-sm hover:gap-3 transition-all"
                >
                  {t('universes.study.cta')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Card 2: Fun */}
              <div className="p-8 sm:p-10 rounded-3xl bg-sphera-surface-2 border border-sphera-border flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-3xl pointer-events-none" />
                
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-6">
                    <Gamepad2 className="w-4 h-4" /> {t('universes.fun.badge')}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-display">
                    {t('universes.fun.title')}
                  </h3>

                  <p className="text-sphera-text-muted text-base leading-relaxed mb-6">
                    {t('universes.fun.description')}
                  </p>

                  <ul className="space-y-3 text-sm text-sphera-text mb-8">
                    <li className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      {t('universes.fun.item1')}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      {t('universes.fun.item2')}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      {t('universes.fun.item3')}
                    </li>
                  </ul>
                </div>

                <Link 
                  to="/live" 
                  className="inline-flex items-center gap-2 text-purple-400 font-bold text-sm hover:gap-3 transition-all"
                >
                  {t('universes.fun.cta')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Key Features Grid ────────────────────────── */}
        <section className="py-24 relative">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
                {t('features.title')}
              </h2>
              <p className="text-sphera-text-muted text-lg max-w-2xl mx-auto">
                {t('features.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-colors">
                <Smartphone className="w-8 h-8 text-sphera-green mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">{t('features.f1Title')}</h4>
                <p className="text-sm text-sphera-text-muted">{t('features.f1Desc')}</p>
              </div>

              <div className="p-6 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-colors">
                <Volume2 className="w-8 h-8 text-sphera-green mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">{t('features.f2Title')}</h4>
                <p className="text-sm text-sphera-text-muted">{t('features.f2Desc')}</p>
              </div>

              <div className="p-6 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-colors">
                <Trophy className="w-8 h-8 text-sphera-green mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">{t('features.f3Title')}</h4>
                <p className="text-sm text-sphera-text-muted">{t('features.f3Desc')}</p>
              </div>

              <div className="p-6 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-colors">
                <Flame className="w-8 h-8 text-sphera-green mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">{t('features.f4Title')}</h4>
                <p className="text-sm text-sphera-text-muted">{t('features.f4Desc')}</p>
              </div>

              <div className="p-6 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-colors">
                <Zap className="w-8 h-8 text-sphera-green mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">{t('features.f5Title')}</h4>
                <p className="text-sm text-sphera-text-muted">{t('features.f5Desc')}</p>
              </div>

              <div className="p-6 rounded-2xl bg-sphera-surface border border-sphera-border hover:border-sphera-green/40 transition-colors">
                <Sparkles className="w-8 h-8 text-sphera-green mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">{t('features.f6Title')}</h4>
                <p className="text-sm text-sphera-text-muted">{t('features.f6Desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final Call to Action ─────────────────────── */}
        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <div className="p-10 md:p-16 rounded-3xl bg-gradient-to-b from-sphera-surface-2 to-sphera-surface border border-sphera-green/30 shadow-[0_0_80px_rgba(34,197,94,0.15)] relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sphera-green/10 blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 p-3 bg-sphera-green/10 rounded-full text-sphera-green mb-6">
                  <Zap className="w-6 h-6 fill-sphera-green" />
                </div>
                
                <h2 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-6">
                  {t('finalCta.title')}
                </h2>
                
                <p className="text-lg text-sphera-text-muted max-w-xl mx-auto mb-10">
                  {t('finalCta.subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link 
                    to="/live" 
                    className="sphera-primary-btn text-base px-8 py-3.5 w-full sm:w-auto flex items-center justify-center gap-2 group"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    {t('finalCta.cta')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link 
                    to="/blogs/10" 
                    className="btn btn-outline border-sphera-border text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 text-base px-8 py-3.5 rounded-xl font-medium w-full sm:w-auto transition-colors"
                  >
                    {t('finalCta.blogCta')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SpheraFooter />
    </div>
  )
}
