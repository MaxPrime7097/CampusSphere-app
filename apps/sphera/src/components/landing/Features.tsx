import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  NotePencil,
  Brain,
  Stack,
  Highlighter,
  Waveform,
  GitFork,
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  Sparkle,
  Play,
  Pause,
} from '@phosphor-icons/react'
import { Reveal } from '../public/SpheraMotion'

type ToolKey = 'sheets' | 'annales' | 'quiz' | 'flashcards' | 'tutor'

export function Features() {
  const { t } = useTranslation('landing')
  const [activeTool, setActiveTool] = useState<ToolKey>('sheets')
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | null>(null)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [examMode, setExamMode] = useState<'complete' | 'rapid'>('complete')
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const flagshipTools: {
    key: ToolKey
    title: string
    desc: string
    icon: React.ComponentType<{ className?: string }>
  }[] = [
    {
      key: 'sheets',
      title: t('features.sheetsTitle'),
      desc: t('features.sheetsDesc'),
      icon: FileText,
    },
    {
      key: 'annales',
      title: t('features.annalesTitle'),
      desc: t('features.annalesDesc'),
      icon: NotePencil,
    },
    {
      key: 'quiz',
      title: t('features.quizTitle'),
      desc: t('features.quizDesc'),
      icon: Brain,
    },
    {
      key: 'flashcards',
      title: t('features.flashcardsTitle'),
      desc: t('features.flashcardsDesc'),
      icon: Stack,
    },
    {
      key: 'tutor',
      title: t('features.tutorTitle'),
      desc: t('features.tutorDesc'),
      icon: Highlighter,
    },
  ]

  const quizOptions: { id: 'A' | 'B' | 'C'; label: string; correct?: boolean }[] = [
    { id: 'A', label: t('features.preview.quizOptA') },
    { id: 'B', label: t('features.preview.quizOptB'), correct: true },
    { id: 'C', label: t('features.preview.quizOptC') },
  ]

  const tutorActions = t('features.preview.tutorActions', { returnObjects: true }) as string[]
  const mapNodes = t('features.extras.mapNodes', { returnObjects: true }) as string[]
  const waveBars = [34, 66, 48, 88, 56, 74, 42, 92, 64, 50, 80, 44, 70, 86]

  return (
    <section className="py-20 md:py-28 border-t border-sphera-border/70 relative overflow-hidden">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green mb-3">
            {t('features.eyebrow')}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
            {t('features.title')}
          </h2>
          <p className="text-sphera-text-muted text-base md:text-lg leading-relaxed">
            {t('features.subtitle')}
          </p>
        </Reveal>

        {/* ── 5 Flagship Tools Interactive Studio ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-20">
          {/* Left: 5 Flagship Tools */}
          <Reveal className="lg:col-span-5 space-y-2.5">
            {flagshipTools.map((tool, index) => {
              const Icon = tool.icon
              const isActive = activeTool === tool.key
              return (
                <button
                  key={tool.key}
                  type="button"
                  onClick={() => setActiveTool(tool.key)}
                  className={`w-full text-left rounded-2xl border p-4 sm:p-5 transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#141916] border-sphera-green/60 shadow-[0_12px_36px_-18px_rgba(34,197,94,0.35)]'
                      : 'bg-sphera-surface/60 border-sphera-border hover:border-sphera-border/80 hover:bg-sphera-surface'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-sphera-green text-black border-sphera-green'
                        : 'bg-sphera-surface-2 text-sphera-green border-sphera-border'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h3
                        className={`font-display text-sm sm:text-base font-bold transition-colors ${
                          isActive ? 'text-white' : 'text-sphera-text'
                        }`}
                      >
                        {tool.title}
                      </h3>
                      <span className="font-mono text-[10px] text-sphera-text-muted">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-sphera-text-muted leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                </button>
              )
            })}
          </Reveal>

          {/* Right: Live Interactive Preview Stage */}
          <Reveal delay={120} className="lg:col-span-7 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-sphera-border bg-[#111316] p-5 sm:p-8 min-h-[440px] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-sphera-green/10 blur-3xl pointer-events-none" />

              {/* 1. Course Summaries (Fiches de cours) */}
              {activeTool === 'sheets' && (
                <div className="relative z-10 space-y-5">
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-sphera-border/80">
                    <span className="font-mono text-xs text-sphera-text-muted">
                      {t('features.preview.sheetHeader')}
                    </span>
                    <span className="font-mono text-[11px] text-sphera-green bg-sphera-green/10 border border-sphera-green/25 px-2.5 py-0.5 rounded-full">
                      {t('features.preview.sheetTag')}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-display text-xl font-bold text-white mb-4">
                      {t('features.preview.sheetConceptTitle')}
                    </h4>

                    <div className="rounded-xl border border-sphera-green/30 bg-sphera-green/[0.06] px-5 py-4 mb-5 flex items-center justify-between">
                      <span className="font-mono text-xl sm:text-2xl font-bold text-sphera-green tracking-wide">
                        {t('features.preview.sheetFormula')}
                      </span>
                      <Sparkle className="w-5 h-5 text-sphera-green/70" />
                    </div>

                    <ul className="space-y-3 text-sm text-sphera-text/90 mb-6">
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-sphera-green mt-2 shrink-0" />
                        <span>{t('features.preview.sheetPoint1')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-sphera-green mt-2 shrink-0" />
                        <span>{t('features.preview.sheetPoint2')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-sphera-green mt-2 shrink-0" />
                        <span>{t('features.preview.sheetPoint3')}</span>
                      </li>
                    </ul>

                    <div className="inline-flex items-center gap-2 rounded-xl border border-sphera-border bg-sphera-bg px-3.5 py-2 text-xs font-mono text-sphera-green">
                      <Sparkle className="w-3.5 h-3.5" weight="fill" />
                      {t('features.preview.sheetChapterAction')}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Exam Paper Solutions (Corrigés d'examens) */}
              {activeTool === 'annales' && (
                <div className="relative z-10 space-y-5">
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-sphera-border/80">
                    <span className="font-mono text-xs text-sphera-text-muted">
                      {t('features.preview.examHeader')}
                    </span>
                    <div className="inline-flex rounded-lg border border-sphera-border bg-sphera-bg p-0.5 text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={() => setExamMode('complete')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          examMode === 'complete'
                            ? 'bg-sphera-green text-black font-semibold'
                            : 'text-sphera-text-muted hover:text-white'
                        }`}
                      >
                        {t('features.preview.examModeComplete')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamMode('rapid')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          examMode === 'rapid'
                            ? 'bg-sphera-green text-black font-semibold'
                            : 'text-sphera-text-muted hover:text-white'
                        }`}
                      >
                        {t('features.preview.examModeRapid')}
                      </button>
                    </div>
                  </div>

                  <h4 className="font-display text-xl font-bold text-white">
                    {t('features.preview.examExercise')}
                  </h4>

                  {examMode === 'complete' ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-sphera-border bg-sphera-bg p-4">
                        <p className="font-mono text-[11px] text-sphera-green mb-1">
                          {t('features.preview.examStep1Label')}
                        </p>
                        <p className="text-sm text-sphera-text/90">
                          {t('features.preview.examStep1Text')}
                        </p>
                      </div>
                      <div className="rounded-xl border border-sphera-border bg-sphera-bg p-4">
                        <p className="font-mono text-[11px] text-sphera-green mb-1">
                          {t('features.preview.examStep2Label')}
                        </p>
                        <p className="text-sm text-sphera-text/90 font-mono">
                          {t('features.preview.examStep2Text')}
                        </p>
                      </div>
                      <div className="rounded-xl border border-sphera-green/25 bg-sphera-green/[0.06] px-4 py-3 text-xs text-emerald-200/90">
                        {t('features.preview.examTip')}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-sphera-green/35 bg-sphera-green/[0.08] p-5 text-sm text-white leading-relaxed font-medium">
                      {t('features.preview.examRapidAnswer')}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Practice Quizzes (Quiz d'entraînement) */}
              {activeTool === 'quiz' && (
                <div className="relative z-10 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-sphera-border/80">
                    <span className="font-mono text-xs text-sphera-text-muted">
                      {t('features.preview.quizHeader')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-sphera-text-muted bg-sphera-bg border border-sphera-border px-2 py-0.5 rounded-full">
                        {t('features.preview.quizScope')}
                      </span>
                      <span className="font-mono text-xs text-sphera-green">
                        {t('features.preview.quizProgress')}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-display text-lg sm:text-xl font-bold text-white leading-snug">
                    {t('features.preview.quizQuestion')}
                  </h4>

                  <div className="space-y-2.5">
                    {quizOptions.map((opt) => {
                      const isPicked = selectedAnswer === opt.id
                      const showResult = selectedAnswer !== null
                      let style =
                        'border-sphera-border bg-sphera-bg hover:border-sphera-green/50 text-sphera-text'
                      if (showResult && opt.correct) {
                        style = 'border-sphera-green bg-sphera-green/15 text-white'
                      } else if (showResult && isPicked && !opt.correct) {
                        style = 'border-red-500/70 bg-red-500/10 text-red-200'
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedAnswer(opt.id)}
                          className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between gap-3 transition-all cursor-pointer ${style}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-md bg-white/[0.06] font-mono text-xs flex items-center justify-center shrink-0">
                              {opt.id}
                            </span>
                            <span>{opt.label}</span>
                          </div>
                          {showResult && opt.correct && (
                            <CheckCircle className="w-5 h-5 text-sphera-green shrink-0" weight="fill" />
                          )}
                          {showResult && isPicked && !opt.correct && (
                            <XCircle className="w-5 h-5 text-red-400 shrink-0" weight="fill" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {selectedAnswer ? (
                    <div
                      className={`rounded-xl border p-3.5 text-xs sm:text-sm leading-relaxed ${
                        selectedAnswer === 'B'
                          ? 'border-sphera-green/35 bg-sphera-green/10 text-emerald-100'
                          : 'border-amber-500/35 bg-amber-500/10 text-amber-100'
                      }`}
                    >
                      {selectedAnswer === 'B'
                        ? t('features.preview.quizFeedbackCorrect')
                        : t('features.preview.quizFeedbackWrong')}
                    </div>
                  ) : (
                    <p className="font-mono text-xs text-sphera-text-muted">
                      {t('features.preview.quizHint')}
                    </p>
                  )}
                </div>
              )}

              {/* 4. Memory Cards (Cartes mémoire) */}
              {activeTool === 'flashcards' && (
                <div className="relative z-10 flex flex-col justify-between flex-1 space-y-5">
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-sphera-border/80">
                    <span className="font-mono text-xs text-sphera-text-muted">
                      {t('features.preview.cardHeader')}
                    </span>
                    <span className="font-mono text-[11px] text-sphera-green">
                      {cardFlipped
                        ? t('features.preview.cardBackLabel')
                        : t('features.preview.cardFrontLabel')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCardFlipped((prev) => !prev)}
                    className={`w-full flex-1 min-h-[250px] rounded-2xl border p-6 sm:p-8 text-left flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                      cardFlipped
                        ? 'border-sphera-green/60 bg-[#121e16]'
                        : 'border-sphera-border bg-sphera-bg hover:border-sphera-green/40'
                    }`}
                  >
                    <span className="font-mono text-[11px] uppercase tracking-wider text-sphera-green">
                      {cardFlipped
                        ? t('features.preview.cardBackLabel')
                        : t('features.preview.cardFrontLabel')}
                    </span>

                    <p className="font-display text-lg sm:text-2xl font-bold text-white leading-snug my-4">
                      {cardFlipped
                        ? t('features.preview.cardBack')
                        : t('features.preview.cardFront')}
                    </p>

                    <span className="inline-flex items-center gap-2 text-xs font-mono text-sphera-text-muted">
                      <ArrowsClockwise className="w-4 h-4 text-sphera-green" />
                      {t('features.preview.cardFlipHint')}
                    </span>
                  </button>
                </div>
              )}

              {/* 5. AI Course Tutor & Highlight (Tuteur IA & surlignage) */}
              {activeTool === 'tutor' && (
                <div className="relative z-10 space-y-5">
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-sphera-border/80">
                    <span className="font-mono text-xs text-sphera-text-muted">
                      {t('features.preview.tutorHeader')}
                    </span>
                    <span className="font-mono text-[11px] text-sphera-green bg-sphera-green/10 border border-sphera-green/25 px-2.5 py-0.5 rounded-full">
                      {t('features.preview.tutorBadge')}
                    </span>
                  </div>

                  {/* Highlighted Excerpt */}
                  <div className="rounded-2xl border border-sphera-border bg-sphera-bg p-4 space-y-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-sphera-text-muted">
                      {t('features.preview.tutorHighlightedLabel')}
                    </p>
                    <p className="text-sm text-white leading-relaxed border-l-2 border-sphera-green pl-3 bg-sphera-green/[0.07] py-2 pr-3 rounded-r-lg">
                      {t('features.preview.tutorHighlightedText')}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Array.isArray(tutorActions) &&
                        tutorActions.map((act, idx) => (
                          <span
                            key={idx}
                            className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border ${
                              idx === 0
                                ? 'bg-sphera-green text-black border-sphera-green font-semibold'
                                : 'bg-sphera-surface border-sphera-border text-sphera-text-muted'
                            }`}
                          >
                            {act}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* AI Reply */}
                  <div className="rounded-2xl border border-sphera-green/30 bg-[#121814] p-4 sm:p-5 space-y-2">
                    <div className="flex items-center gap-2 font-mono text-[11px] text-sphera-green">
                      <Sparkle className="w-3.5 h-3.5" weight="fill" />
                      <span>{t('features.preview.tutorReplyLabel')}</span>
                    </div>
                    <p className="text-sm text-sphera-text/95 leading-relaxed">
                      {t('features.preview.tutorReplyText')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {/* ── Complementary Formats ("Et pour réviser autrement") ── */}
        <Reveal className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green mb-2">
            {t('features.moreEyebrow')}
          </p>
          <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {t('features.moreTitle')}
          </h3>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Audio Lessons (Cours en audio) */}
          <Reveal>
            <div className="sphera-panel-lift h-full rounded-2xl border border-sphera-border bg-sphera-surface/80 p-6 flex flex-col justify-between hover:border-sphera-green/40">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sphera-green/10 border border-sphera-green/20 flex items-center justify-center text-sphera-green">
                    <Waveform className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-sphera-green bg-sphera-green/10 border border-sphera-green/25 px-2.5 py-0.5 rounded-full">
                    {t('features.extras.audioBadge')}
                  </span>
                </div>
                <h4 className="font-display text-lg font-bold text-white mb-2">
                  {t('features.extras.audioTitle')}
                </h4>
                <p className="text-xs sm:text-sm text-sphera-text-muted leading-relaxed mb-5">
                  {t('features.extras.audioDesc')}
                </p>
              </div>

              {/* Mini Interactive Audio Preview */}
              <div className="rounded-xl border border-sphera-border bg-sphera-bg p-3.5 space-y-2.5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlayingAudio((p) => !p)}
                    aria-label={
                      isPlayingAudio ? t('features.extras.audioPause') : t('features.extras.audioPlay')
                    }
                    className="w-8 h-8 rounded-full bg-sphera-green text-black flex items-center justify-center shrink-0 hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-3.5 h-3.5" weight="fill" />
                    ) : (
                      <Play className="w-3.5 h-3.5 ml-0.5" weight="fill" />
                    )}
                  </button>
                  <div className="flex-1 flex items-end gap-1 h-6">
                    {waveBars.map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full ${
                          isPlayingAudio
                            ? i % 2 === 0
                              ? 'bg-sphera-green animate-pulse'
                              : 'bg-emerald-400/75'
                            : i < 5
                            ? 'bg-sphera-green/80'
                            : 'bg-white/15'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-sphera-text-muted italic line-clamp-2">
                  {t('features.extras.audioLine')}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Card 2: Visual Course Map (Schéma du cours) */}
          <Reveal delay={70}>
            <div className="sphera-panel-lift h-full rounded-2xl border border-sphera-border bg-sphera-surface/80 p-6 flex flex-col justify-between hover:border-sphera-green/40">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sphera-green/10 border border-sphera-green/20 flex items-center justify-center text-sphera-green">
                    <GitFork className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-sphera-green bg-sphera-green/10 border border-sphera-green/25 px-2.5 py-0.5 rounded-full">
                    {t('features.extras.mapBadge')}
                  </span>
                </div>
                <h4 className="font-display text-lg font-bold text-white mb-2">
                  {t('features.extras.mapTitle')}
                </h4>
                <p className="text-xs sm:text-sm text-sphera-text-muted leading-relaxed mb-5">
                  {t('features.extras.mapDesc')}
                </p>
              </div>

              {/* Mini Visual Diagram Preview */}
              <div className="rounded-xl border border-sphera-border bg-sphera-bg p-3.5 flex flex-col items-center gap-2.5">
                <span className="px-3 py-1 rounded-lg bg-sphera-green text-black font-display font-bold text-[11px]">
                  {t('features.extras.mapRoot')}
                </span>
                <div className="w-px h-2.5 bg-sphera-green/45 -my-1.5" />
                <div className="grid grid-cols-3 gap-1.5 w-full">
                  {Array.isArray(mapNodes) &&
                    mapNodes.map((node, idx) => (
                      <span
                        key={idx}
                        className="text-center text-[10px] font-medium text-sphera-text bg-sphera-surface border border-sphera-green/25 rounded-md py-1 px-1.5 truncate"
                      >
                        {node}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Card 3: Notes, Tracking & Comfort */}
          <Reveal delay={140}>
            <div className="sphera-panel-lift h-full rounded-2xl border border-sphera-border bg-sphera-surface/80 p-6 flex flex-col justify-between hover:border-sphera-green/40">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-sphera-green/10 border border-sphera-green/20 flex items-center justify-center text-sphera-green">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-sphera-green bg-sphera-green/10 border border-sphera-green/25 px-2.5 py-0.5 rounded-full">
                    {t('features.extras.comfortBadge')}
                  </span>
                </div>
                <h4 className="font-display text-lg font-bold text-white mb-2">
                  {t('features.extras.comfortTitle')}
                </h4>
                <p className="text-xs sm:text-sm text-sphera-text-muted leading-relaxed">
                  {t('features.extras.comfortDesc')}
                </p>
              </div>

              {/* Mini 14-week Streak Dots Visual */}
              <div className="mt-5 rounded-xl border border-sphera-border bg-sphera-bg p-3.5">
                <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
                  {[
                    0, 1, 2, 1, 0, 2, 3, 2, 1, 3, 2, 3, 3, 2,
                    1, 2, 3, 0, 1, 2, 2, 3, 2, 1, 3, 2, 3, 3,
                  ].map((lvl, idx) => (
                    <span
                      key={idx}
                      className={`h-2.5 rounded-[3px] ${
                        lvl === 0
                          ? 'bg-white/[0.06]'
                          : lvl === 1
                          ? 'bg-sphera-green/25'
                          : lvl === 2
                          ? 'bg-sphera-green/55'
                          : 'bg-sphera-green'
                      }`}
                    />
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
