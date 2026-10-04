import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Brain as BrainCircuit, List, CheckCircle as CheckCircle2, Question as HelpCircle, Dot as CircleSmall, Lightbulb, CaretDown as ChevronDown, CaretRight as ChevronRight, Timer, Trophy, XCircle, ArrowCounterClockwise as RotateCcw, ArrowClockwise as RotateCw, ArrowCounterClockwise as RefreshCcw, Code as Code2, Calculator, AlignLeft, Target, BookOpen, BookmarkSimple as BookMarked, Medal as Award, Stack as Layers, Lightning as Zap, GitFork, Waveform as AudioLines, Play, Pause, SpeakerHigh as Volume2, SpeakerSimpleHigh, SpeakerSimpleSlash, Download, Crosshair as LocateFixed, Sparkle as Sparkles, ArrowsOut as Maximize2, ArrowsIn as Minimize2, Eye, Check, Copy, MagnifyingGlass as Search, CaretUpDown as ChevronsUpDown, Funnel as Filter, X, CaretUp as ChevronUp, Scales, ChatCircle } from "@phosphor-icons/react";
import ReactFlow, { Background, Controls, Position, type Node, type Edge, type ReactFlowInstance } from 'reactflow'
import 'reactflow/dist/style.css'
import DownloadPDFButton from '../shared/DownloadPDFButton'
import { useDownloadPDF } from '../../hooks/useDownloadPDF'
import { usePodcastPlayer, podcastStore, getPodcastVoiceData } from '../../utils/podcastPlayerStore'

const formatText = (text: any) => {
  if (!text || typeof text !== 'string') return text;
  
  const formatLine = (line: string) => {
    return line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      return part.replace(/\*\*/g, '');
    });
  };

  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let i = 0;
  
  while (i < lines.length) {
    if (lines[i].trim().startsWith('|') && lines[i].includes('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      
      result.push(
        <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-xl border border-sphera-border bg-sphera-surface">
          <table className="w-full text-sm text-left">
            <thead className="bg-sphera-surface-2 border-b border-sphera-border text-xs uppercase text-sphera-text-muted">
              <tr>
                {tableLines[0].split('|').filter((cell, idx, arr) => !(cell.trim() === '' && (idx === 0 || idx === arr.length - 1))).map((cell, idx) => (
                  <th key={idx} className="px-4 py-3 font-semibold text-white/90">{formatLine(cell.trim())}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableLines.slice(1).map((row, rowIdx) => {
                if (row.replace(/[-|:\s]/g, '').length === 0) return null;
                return (
                  <tr key={rowIdx} className="border-b border-sphera-border/50 hover:bg-sphera-surface-2/50 transition-colors last:border-0">
                    {row.split('|').filter((cell, colIdx, arr) => !(cell.trim() === '' && (colIdx === 0 || colIdx === arr.length - 1))).map((cell, colIdx) => (
                      <td key={colIdx} className="px-4 py-3 text-white/80">{formatLine(cell.trim())}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    } else {
      result.push(
        <React.Fragment key={`line-${i}`}>
          {formatLine(lines[i])}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      );
      i++;
    }
  }
  
  return result;
};

export function FicheView({ content, sourceName }: { content: any; sourceName?: string }) {
  const { t, i18n } = useTranslation('study')
  const f = content?.fiche || content || {}
  const [openDef, setOpenDef] = useState<number | null>(null)
  const { isDownloading, generateFiche } = useDownloadPDF()

  return (
    <div className="flex flex-col gap-6">
      {/* Download button */}
      <div className="flex justify-end">
        <DownloadPDFButton
          onDownload={() => generateFiche(content, sourceName)}
          isDownloading={isDownloading}
          label={t('resultViews.ficheDownload')}
        />
      </div>

      {/* Captured zone */}
      <div className="flex flex-col gap-6 p-4 rounded-2xl bg-sphera-bg">
        {/* PDF Header */}
        <div className="flex items-center justify-between pb-4 border-b border-sphera-border">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-sphera-green font-semibold">{t('resultViews.ficheTitle')}</p>
              <p className="text-xs text-sphera-text-muted">
                {t('resultViews.generatedOn', { date: new Date().toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR') })}
              </p>
            </div>
          </div>
          <a
            href="https://sphera.campussphere.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sphera-text-muted/60 hover:text-sphera-green transition-colors underline-offset-2 hover:underline"
          >
            sphera.campussphere.app
          </a>
        </div>

        {f.titre && <h2 className="text-xl font-bold text-white">{f.titre}</h2>}

        {f?.resume && (
          <div className="sphera-card p-6">
            <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> {t('resultViews.summary')}
            </h3>
            <div className="text-sphera-text-muted leading-relaxed">{formatText(f.resume)}</div>
          </div>
        )}
        {Array.isArray(f?.points_cles) && f.points_cles.length > 0 && (
          <div className="sphera-card p-6">
            <h3 className="text-sphera-green text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {t('resultViews.keyPoints')}
            </h3>
            <ul className="flex flex-col gap-2">
              {f.points_cles.map((p: string, i: number) => (
                <li key={i} className="flex gap-3 text-sphera-text-muted leading-relaxed">
                  <span className="text-sphera-green font-bold">{i + 1}.</span> <div>{formatText(p)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {Array.isArray(f?.definitions) && f.definitions.length > 0 && (
          <div className="sphera-card p-6">
            <h3 className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <List className="w-4 h-4" /> {t('resultViews.definitions')}
            </h3>
            <div className="flex flex-col gap-3">
              {f.definitions.map((d: any, i: number) => (
                <div key={i} className="border border-sphera-border rounded-xl overflow-hidden bg-sphera-bg/50">
                  <button
                    onClick={() => setOpenDef(openDef === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-sphera-surface transition-colors"
                  >
                    <span className="font-semibold text-white">{formatText(d.terme)}</span>
                    <ChevronDown className={`w-4 h-4 text-sphera-text-muted transition-transform ${openDef === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openDef === i && (
                    <div className="px-4 pb-4 pt-1 text-sm text-sphera-text-muted leading-relaxed border-t border-sphera-border bg-sphera-surface/30">
                      {formatText(d.definition)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {Array.isArray(f?.formules) && f.formules.length > 0 && (
          <div className="sphera-card p-6">
            <h3 className="text-pink-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4" /> {t('resultViews.formulesTitle')}
            </h3>
            <ul className="flex flex-col gap-3">
              {f.formules.map((p: string, i: number) => (
                <li key={i} className="flex gap-3 text-sphera-text-muted leading-relaxed bg-pink-400/5 p-4 rounded-xl border border-pink-400/10">
                  <span className="text-pink-400 font-bold mt-0.5"><CircleSmall className="w-4 h-4" /></span> <div>{formatText(p)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {Array.isArray(f?.a_retenir) && f.a_retenir.length > 0 && (
          <div className="sphera-card p-6">
            <h3 className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> {t('resultViews.toRemember')}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {f.a_retenir.map((p: string, i: number) => (
                <li key={i} className="bg-yellow-400/10 text-yellow-400 text-sm px-4 py-2 rounded-xl border border-yellow-400/20 leading-relaxed flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span>{formatText(p)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

const TIMER_SECONDS = 30

export function QuizView({
  content,
  sessionId,
  artefactId,
  onAskQuestion,
  onPause,
}: {
  content: any
  sessionId?: string | number
  artefactId?: string | number
  onAskQuestion?: (prompt: string) => void
  onPause?: () => void
}) {
  const { t } = useTranslation('study')
  const qData = content?.quiz || content || {}
  const questions = Array.isArray(qData.questions) ? qData.questions : []

  const storageKey = useMemo(
    () => `sphera_quiz_prog_${sessionId || 'local'}_${artefactId || 'main'}`,
    [sessionId, artefactId]
  )

  const [savedProgress, setSavedProgress] = useState<{
    currentIndex: number
    score: number
    answers: Array<{ selected: string | null; correct: boolean }>
  } | null>(() => {
    try {
      const raw = localStorage.getItem(`sphera_quiz_prog_${sessionId || 'local'}_${artefactId || 'main'}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed.currentIndex === 'number' && parsed.currentIndex > 0 && Array.isArray(parsed.answers)) {
          return parsed
        }
      }
    } catch {
      // ignore
    }
    return null
  })

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [timerActive, setTimerActive] = useState(true)
  const [answers, setAnswers] = useState<Array<{ selected: string | null; correct: boolean }>>([])
  const [showExplanation, setShowExplanation] = useState(false)

  // Save progress automatically
  useEffect(() => {
    if (currentIndex > 0 && !finished && answers.length > 0) {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            currentIndex,
            score,
            answers,
            timestamp: Date.now(),
          })
        )
      } catch {}
    }
  }, [currentIndex, score, answers, finished, storageKey])

  // Clear saved progress on finish
  useEffect(() => {
    if (finished) {
      try {
        localStorage.removeItem(storageKey)
      } catch {}
    }
  }, [finished, storageKey])

  if (!questions.length) return <p className="text-sphera-text-muted">{t('resultViews.emptyQuiz')}</p>

  const total = questions.length
  const currentQuestion = questions[currentIndex]

  const handleResumeSaved = () => {
    if (!savedProgress) return
    setCurrentIndex(savedProgress.currentIndex)
    setScore(savedProgress.score)
    setAnswers(savedProgress.answers)
    setSelectedOption(null)
    setShowExplanation(false)
    setTimeLeft(TIMER_SECONDS)
    setTimerActive(true)
    setSavedProgress(null)
  }

  const handleDismissSaved = () => {
    try {
      localStorage.removeItem(storageKey)
    } catch {}
    setSavedProgress(null)
  }

  const handlePause = () => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          currentIndex,
          score,
          answers,
          timestamp: Date.now(),
        })
      )
    } catch {}
    if (onPause) {
      onPause()
    }
  }

  const handleTimeout = useCallback(() => {
    if (selectedOption !== null) return;
    setSelectedOption("__timeout__");
    setTimerActive(false);
    setShowExplanation(true);
    setAnswers(prev => [...prev, { selected: null, correct: false }]);
  }, [selectedOption])

  useEffect(() => {
    if (!timerActive || finished) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, timerActive, finished, handleTimeout])

  const handleSelect = (optionLetter: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionLetter);
    setTimerActive(false);
    setShowExplanation(true);
    const isCorrect = optionLetter === currentQuestion.bonne_reponse;
    if (isCorrect) setScore(s => s + 1);
    setAnswers(prev => [...prev, { selected: optionLetter, correct: isCorrect }]);
  }

  const handleNext = () => {
    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setTimeLeft(TIMER_SECONDS);
      setTimerActive(true);
    }
  }

  const handleRestart = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setSavedProgress(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setFinished(false);
    setTimeLeft(TIMER_SECONDS);
    setTimerActive(true);
    setAnswers([]);
    setShowExplanation(false);
  }

  const timerPercent = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor = timeLeft > 15 ? "bg-sphera-green" : timeLeft > 7 ? "bg-yellow-500" : "bg-red-500";

  if (finished) {
    const pct = Math.round((score / total) * 100);
    
    let message = t('resultViews.quizMessageKeepGoing');
    if (pct === 100) { message = t('resultViews.quizMessagePerfect'); }
    else if (pct >= 80) { message = t('resultViews.quizMessageGreat'); }
    else if (pct >= 60) { message = t('resultViews.quizMessageGood'); }

    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-8 animate-in fade-in">
        <div className="text-center p-8 bg-sphera-surface-2 rounded-2xl border border-sphera-border">
          <div className="w-16 h-16 rounded-2xl bg-sphera-green/15 text-sphera-green flex items-center justify-center mx-auto mb-4 border border-sphera-green/30">
            <Trophy className="w-8 h-8" />
          </div>
          <p className="text-xl text-white font-bold mb-2">{message}</p>
          <p className="text-3xl font-bold text-white mb-2">
            {score} <span className="text-sphera-text-muted font-normal text-xl">/ {total}</span>
          </p>
          <p className="text-sphera-text-muted">{t('resultViews.successRate', { pct })}</p>
          <div className="h-2 w-full bg-sphera-bg rounded-full overflow-hidden mt-6">
            <div className="h-full bg-sphera-green transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-white mb-4">{t('resultViews.recapTitle')}</h3>
          {answers.map((ans, i) => (
            <div key={i} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-4 border text-sm ${ans.correct ? "border-sphera-green/30 bg-sphera-green/5" : "border-red-500/30 bg-red-500/5"}`}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {ans.correct ? <CheckCircle2 className="h-5 w-5 text-sphera-green flex-shrink-0" /> : <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />}
                <div className="flex-1 text-white leading-relaxed">
                  <span className="font-bold mr-2">Q{i + 1}.</span> {formatText(questions[i]?.question)}
                </div>
                {!ans.correct && (
                  <span className="px-2 py-1 rounded bg-sphera-green/20 text-sphera-green text-xs font-bold border border-sphera-green/30 flex-shrink-0">
                    {questions[i]?.bonne_reponse}
                  </span>
                )}
              </div>
              {onAskQuestion && (
                <button
                  type="button"
                  onClick={() => {
                    const qObj = questions[i]
                    const qText = qObj?.question || ''
                    const rightAns = `${qObj?.bonne_reponse} - ${qObj?.options?.find((o: string) => o.startsWith(qObj?.bonne_reponse)) || ''}`
                    const myAns = ans.selected || 'Non répondue'
                    const expl = qObj?.explication || ''
                    const prompt = `Concernant la question ${i + 1} du quiz :\n"${qText}"\n\nJ'ai répondu : "${myAns}" (Bonne réponse : "${rightAns}")\nExplication : "${expl}"\n\nPeux-tu m'expliquer ce concept plus en détail avec des exemples simples ?`
                    onAskQuestion(prompt)
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-xs text-sphera-text-muted hover:text-sphera-green transition-colors shrink-0 self-end sm:self-center"
                  title="Poser une question à Sphera sur cette question"
                >
                  <ChatCircle className="w-3.5 h-3.5 text-sphera-green" />
                  <span>Demander à Sphera</span>
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={handleRestart} className="sphera-primary-btn w-full justify-center py-3 mt-4">
          <RotateCcw className="h-4 w-4 mr-2" /> {t('resultViews.quizRestartBtn')}
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-8">
      {/* Saved Progress Banner */}
      {savedProgress && (
        <div className="p-4 rounded-xl border border-sphera-green/40 bg-sphera-green/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sphera-green/20 text-sphera-green flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Progression précédente détectée</p>
              <p className="text-[11px] text-sphera-text-muted">
                Question {savedProgress.currentIndex + 1} sur {total} • Score : {savedProgress.score} pt{savedProgress.score > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDismissSaved}
              className="px-3 py-1.5 rounded-lg border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-xs text-sphera-text-muted hover:text-white transition-colors"
            >
              Recommencer
            </button>
            <button
              type="button"
              onClick={handleResumeSaved}
              className="px-3 py-1.5 rounded-lg bg-sphera-green text-black font-semibold text-xs hover:bg-green-400 transition-colors shadow-xs"
            >
              Reprendre
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-sphera-text-muted font-medium">
          Question <span className="text-white font-bold">{currentIndex + 1}</span> / {total}
        </span>
        <div className="flex items-center gap-2">
          {currentIndex > 0 && onPause && (
            <button
              type="button"
              onClick={handlePause}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-[11px] text-sphera-text-muted hover:text-white transition-colors"
              title="Sauvegarder et continuer plus tard"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Continuer plus tard</span>
            </button>
          )}
          <div className="bg-sphera-surface px-3 py-1.5 rounded-full border border-sphera-border flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-white font-semibold">{t('resultViews.points', { count: score })}</span>
          </div>
        </div>
      </div>

      <div className="h-1.5 w-full bg-sphera-bg rounded-full overflow-hidden">
        <div className="h-full bg-sphera-green transition-all" style={{ width: `${((currentIndex) / total) * 100}%` }} />
      </div>

      {/* Timer */}
      <div className="flex items-center gap-3">
        <Timer className={`h-4 w-4 flex-shrink-0 ${timeLeft <= 7 ? "text-red-500 animate-pulse" : "text-sphera-text-muted"}`} />
        <div className="flex-1 h-2 bg-sphera-bg rounded-full overflow-hidden border border-sphera-border/50">
          <div className={`h-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPercent}%` }} />
        </div>
        <span className={`text-xs font-mono w-8 text-right ${timeLeft <= 7 ? "text-red-500 font-bold" : "text-sphera-text-muted"}`}>
          {timeLeft}s
        </span>
      </div>

      {/* Question */}
      <div className="sphera-card p-6 border-l-4 border-l-sphera-green">
        <div className="font-medium text-white leading-relaxed text-lg">{formatText(currentQuestion.question)}</div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {(Array.isArray(currentQuestion.options) ? currentQuestion.options : []).map((option: string) => {
          const letter = option.charAt(0).toUpperCase();
          const correct = letter === currentQuestion.bonne_reponse;
          const chosen = letter === selectedOption;
          
          let btnClass = "w-full text-left flex items-start gap-4 border rounded-xl px-5 py-4 text-sm transition-all duration-200 ";
          
          if (selectedOption === null) {
            btnClass += "border-sphera-border hover:border-sphera-green/50 hover:bg-sphera-surface cursor-pointer text-sphera-text-muted hover:text-white";
          } else {
            if (correct) btnClass += "border-sphera-green bg-sphera-green/10 text-sphera-green";
            else if (chosen && !correct) btnClass += "border-red-500 bg-red-500/10 text-red-400";
            else btnClass += "border-sphera-border opacity-50 cursor-default text-sphera-text-muted";
          }

          return (
            <button
              key={letter}
              onClick={() => handleSelect(letter)}
              className={btnClass}
              disabled={selectedOption !== null}
            >
              <span className={`flex-shrink-0 h-7 w-7 rounded-full border flex items-center justify-center text-xs font-bold ${
                correct && selectedOption !== null ? 'border-sphera-green text-sphera-green' : 
                chosen && !correct ? 'border-red-500 text-red-500' : 'border-sphera-text-muted text-white bg-sphera-surface'
              }`}>
                {letter}
              </span>
              <span className="leading-relaxed pt-1 text-base">{formatText(option.slice(3))}</span>
              {selectedOption !== null && correct && <CheckCircle2 className="h-5 w-5 text-sphera-green flex-shrink-0 ml-auto mt-1" />}
              {selectedOption === letter && !correct && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 ml-auto mt-1" />}
            </button>
          );
        })}
      </div>

      {/* Timeout feedback */}
      {selectedOption === "__timeout__" && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-500">
          {t('resultViews.timeoutMsg', { answer: currentQuestion.bonne_reponse })}
        </div>
      )}

      {/* Explication */}
      {showExplanation && selectedOption !== "__timeout__" && (
        <div className={`rounded-xl p-5 text-sm leading-relaxed border ${
            selectedOption === currentQuestion.bonne_reponse
              ? "bg-sphera-green/10 border-sphera-green/30 text-sphera-green"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          <p className="font-bold mb-2 text-base flex items-center gap-2">
            {selectedOption === currentQuestion.bonne_reponse ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-sphera-green" />
                <span>{t('resultViews.correctAnswer')}</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                <span>{t('resultViews.incorrectAnswer')}</span>
              </>
            )}
          </p>
          <div className="opacity-90">{formatText(currentQuestion.explication)}</div>

          {onAskQuestion && (
            <div className="pt-3 mt-3 border-t border-sphera-border/40 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const qText = currentQuestion.question || ''
                  const myAns = selectedOption ? `${selectedOption} - ${currentQuestion.options?.find((o: string) => o.startsWith(selectedOption)) || ''}` : 'Aucune'
                  const rightAns = `${currentQuestion.bonne_reponse} - ${currentQuestion.options?.find((o: string) => o.startsWith(currentQuestion.bonne_reponse)) || ''}`
                  const expl = currentQuestion.explication || ''
                  const prompt = `Concernant la question du quiz :\n"${qText}"\n\nMa réponse était : "${myAns}"\nLa bonne réponse est : "${rightAns}"\nExplication : "${expl}"\n\nPeux-tu m'expliquer en détail pourquoi c'est cette réponse et me donner un moyen mnémotechnique ou un exemple pour bien comprendre ?`
                  onAskQuestion(prompt)
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-xs font-medium text-white hover:text-sphera-green transition-all shadow-xs"
              >
                <ChatCircle weight="duotone" className="w-4 h-4 text-sphera-green" />
                <span>Demander à Sphera</span>
              </button>
            </div>
          )}
        </div>
      )}

      {selectedOption !== null && (
        <button onClick={handleNext} className="sphera-primary-btn w-full justify-center py-4 mt-4 text-base">
          {currentIndex + 1 >= total ? (
            <span className="flex items-center gap-2"><Trophy className="h-5 w-5" /> {t('resultViews.quizSeeResults')}</span>
          ) : (
            <span className="flex items-center gap-2">{t('resultViews.quizNextQuestion')} <ChevronRight className="h-5 w-5" /></span>
          )}
        </button>
      )}
    </div>
  )
}

export function FlashcardsView({
  content,
  sessionId,
  artefactId,
  onAskQuestion,
  onPause,
}: {
  content: any
  sessionId?: string | number
  artefactId?: string | number
  onAskQuestion?: (prompt: string) => void
  onPause?: () => void
}) {
  const { t } = useTranslation('study')
  const fData = content?.flashcards || content || {}
  const cartes = Array.isArray(fData.cartes) ? fData.cartes : []
  const total = cartes.length

  const storageKey = useMemo(
    () => `sphera_fc_prog_${sessionId || 'local'}_${artefactId || 'main'}`,
    [sessionId, artefactId]
  )

  const [savedProgress, setSavedProgress] = useState<{
    currentIndex: number
    known: number[]
    review: number[]
  } | null>(() => {
    try {
      const raw = localStorage.getItem(`sphera_fc_prog_${sessionId || 'local'}_${artefactId || 'main'}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed.currentIndex === 'number' && parsed.currentIndex > 0 && Array.isArray(parsed.known)) {
          return parsed
        }
      }
    } catch {}
    return null
  })

  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [review, setReview] = useState<Set<number>>(new Set())
  const [finished, setFinished] = useState(false)

  // Save progress automatically
  useEffect(() => {
    if (currentIndex > 0 && !finished && (known.size > 0 || review.size > 0)) {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            currentIndex,
            known: Array.from(known),
            review: Array.from(review),
            timestamp: Date.now(),
          })
        )
      } catch {}
    }
  }, [currentIndex, known, review, finished, storageKey])

  // Clear when finished
  useEffect(() => {
    if (finished) {
      try {
        localStorage.removeItem(storageKey)
      } catch {}
    }
  }, [finished, storageKey])

  if (!total) return <p className="text-sphera-text-muted">{t('resultViews.emptyFlashcards')}</p>

  const currentCard = cartes[currentIndex]

  const handleResumeSaved = () => {
    if (!savedProgress) return
    setCurrentIndex(savedProgress.currentIndex)
    setKnown(new Set(savedProgress.known))
    setReview(new Set(savedProgress.review))
    setFlipped(false)
    setSavedProgress(null)
  }

  const handleDismissSaved = () => {
    try {
      localStorage.removeItem(storageKey)
    } catch {}
    setSavedProgress(null)
  }

  const handlePause = () => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          currentIndex,
          known: Array.from(known),
          review: Array.from(review),
          timestamp: Date.now(),
        })
      )
    } catch {}
    if (onPause) {
      onPause()
    }
  }

  const handleKnew = () => {
    setKnown(prev => new Set(prev).add(currentIndex));
    advance();
  }

  const handleReview = () => {
    setReview(prev => new Set(prev).add(currentIndex));
    advance();
  }

  const advance = () => {
    setFlipped(false);
    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  }

  const handleRestart = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setSavedProgress(null);
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setReview(new Set());
    setFinished(false);
  }

  const handleRestartReview = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setSavedProgress(null);
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setReview(new Set());
    setFinished(false);
  }

  if (finished) {
    const knownCount = known.size;
    const reviewCount = total - knownCount;
    const reviewCards = cartes.filter((_, i) => !known.has(i));

    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-8 animate-in fade-in">
        <div className="text-center p-8 bg-sphera-surface-2 rounded-2xl border border-sphera-border">
          <div className="w-16 h-16 rounded-2xl bg-sphera-green/15 text-sphera-green flex items-center justify-center mx-auto mb-4 border border-sphera-green/30">
            {knownCount === total ? <Trophy className="w-8 h-8" /> : <BookOpen className="w-8 h-8" />}
          </div>
          <p className="text-3xl font-bold text-white mb-2">
            {knownCount} <span className="text-sphera-text-muted font-normal text-xl">/ {total} {t('resultViews.memorized', { count: total })}</span>
          </p>
          <p className="text-sphera-text-muted">
            {reviewCount > 0 ? t('resultViews.cardsToReview', { count: reviewCount }) : t('resultViews.allMastered')}
          </p>
          <div className="h-2 w-full bg-sphera-bg rounded-full overflow-hidden mt-6">
            <div className="h-full bg-sphera-green transition-all" style={{ width: `${(knownCount / total) * 100}%` }} />
          </div>
        </div>

        {reviewCards.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <RefreshCcw className="h-5 w-5 text-yellow-500" /> {t('resultViews.flashcardsToReview')}
            </h3>
            {reviewCards.map((card: any, i: number) => (
              <div key={i} className="border border-red-500/30 bg-red-500/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-400 mb-1">{formatText(card.recto)}</p>
                  <div className="text-sm text-sphera-text-muted leading-relaxed">{formatText(card.verso)}</div>
                </div>
                {onAskQuestion && (
                  <button
                    type="button"
                    onClick={() => {
                      const prompt = `Concernant la carte de révision :\n- Notion / Recto : "${card.recto}"\n- Définition / Verso : "${card.verso}"\n\nPeux-tu m'expliquer ce point en détail et m'aider à le retenir ?`
                      onAskQuestion(prompt)
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-xs text-sphera-text-muted hover:text-sphera-green transition-colors shrink-0 self-end sm:self-center"
                    title="Demander de l'aide à Sphera sur cette carte"
                  >
                    <ChatCircle className="w-3.5 h-3.5 text-sphera-green" />
                    <span>Demander à Sphera</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button onClick={handleRestart} className="flex-1 py-3 px-4 rounded-xl bg-sphera-surface border border-sphera-border text-white font-medium flex justify-center items-center gap-2 hover:bg-sphera-surface-2 transition-colors">
            <RotateCcw className="h-4 w-4" /> {t('resultViews.restartAll')}
          </button>
          {reviewCards.length > 0 && (
            <button onClick={handleRestartReview} className="flex-1 py-3 px-4 rounded-xl bg-sphera-green text-black font-semibold flex justify-center items-center gap-2 hover:bg-green-400 transition-colors">
              <RefreshCcw className="h-4 w-4" /> {t('resultViews.reviewCardsBtn', { count: reviewCount })}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12 space-y-5">
      {/* Saved Progress Banner */}
      {savedProgress && (
        <div className="p-4 rounded-xl border border-sphera-green/40 bg-sphera-green/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sphera-green/20 text-sphera-green flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Session de révision détectée</p>
              <p className="text-[11px] text-sphera-text-muted">
                Carte {savedProgress.currentIndex + 1} sur {total} • {savedProgress.known.length} maîtrisée(s)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDismissSaved}
              className="px-3 py-1.5 rounded-lg border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-xs text-sphera-text-muted hover:text-white transition-colors"
            >
              Recommencer
            </button>
            <button
              type="button"
              onClick={handleResumeSaved}
              className="px-3 py-1.5 rounded-lg bg-sphera-green text-black font-semibold text-xs hover:bg-green-400 transition-colors shadow-xs"
            >
              Reprendre
            </button>
          </div>
        </div>
      )}

      {/* Progression & Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-sphera-text-muted font-medium">
          Carte <span className="text-white font-bold">{currentIndex + 1}</span> / {total}
        </span>
        <div className="flex items-center gap-2">
          {currentIndex > 0 && onPause && (
            <button
              type="button"
              onClick={handlePause}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-[11px] text-sphera-text-muted hover:text-white transition-colors"
              title="Sauvegarder et continuer plus tard"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Continuer plus tard</span>
            </button>
          )}
          {known.size > 0 && (
            <span className="bg-sphera-green/10 text-sphera-green border border-sphera-green/20 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> {t('resultViews.knownBadge', { count: known.size })}
            </span>
          )}
          {review.size > 0 && (
            <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              ↩ {t('resultViews.reviewBadge', { count: review.size })}
            </span>
          )}
        </div>
      </div>
      
      <div className="h-1.5 w-full bg-sphera-bg rounded-full overflow-hidden">
        <div className="h-full bg-sphera-green transition-all" style={{ width: `${((currentIndex) / total) * 100}%` }} />
      </div>

      {/* Carte flip 3D réelle */}
      <div className="perspective-1000 w-full min-h-[350px]">
        <div
          onClick={() => setFlipped(!flipped)}
          className={`relative w-full h-full min-h-[350px] cursor-pointer transition-transform duration-700 transform-style-3d ${
            flipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front (Question) */}
          <div className="absolute inset-0 backface-hidden rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-sphera-surface to-sphera-surface-2 border-2 border-sphera-border shadow-xl hover:border-sphera-border/80">
            <div className="absolute top-6">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-sphera-border text-sphera-text-muted">
                {t('resultViews.questionTerm')}
              </span>
            </div>
            
            <div className="text-xl md:text-2xl leading-relaxed mt-4 font-bold text-white w-full max-h-[200px] overflow-y-auto scrollbar-thin">
              {formatText(currentCard.recto)}
            </div>

            <p className="absolute bottom-6 text-xs text-sphera-text-muted font-medium flex items-center gap-2">
              {t('resultViews.clickToFlip')} <RotateCcw className="w-3 h-3" />
            </p>
          </div>

          {/* Back (Réponse) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-sphera-green/10 to-sphera-surface-2 border-2 border-sphera-green/50 shadow-[0_0_40px_rgba(34,197,94,0.15)]">
            <div className="absolute top-6">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-sphera-green/30 text-sphera-green">
                {t('resultViews.answerDef')}
              </span>
            </div>
            
            <div className="text-xl md:text-2xl leading-relaxed mt-4 font-normal text-white/90 w-full max-h-[200px] overflow-y-auto scrollbar-thin">
              {formatText(currentCard.verso)}
            </div>
          </div>
        </div>
      </div>

      {/* Ask Sphera button when flipped */}
      {flipped && onAskQuestion && (
        <div className="flex justify-center animate-in fade-in duration-200">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              const prompt = `Concernant la flashcard de révision :\n- Recto (Concept / Question) : "${currentCard.recto}"\n- Verso (Réponse / Définition) : "${currentCard.verso}"\n\nPeux-tu approfondir ce concept avec des explications claires et des exemples concrets d'application ?`
              onAskQuestion(prompt)
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-xs font-medium text-white hover:text-sphera-green transition-all shadow-xs"
          >
            <ChatCircle weight="duotone" className="w-4 h-4 text-sphera-green" />
            <span>Demander des explications à Sphera</span>
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 h-16">
        {flipped ? (
          <div className="flex gap-3 animate-in fade-in zoom-in duration-300">
            <button
              onClick={(e) => { e.stopPropagation(); handleReview(); }}
              className="flex-1 py-3.5 rounded-xl border-2 border-red-500/40 text-red-400 font-semibold hover:bg-red-500/10 hover:border-red-500 transition-colors flex justify-center items-center gap-2"
            >
              ↩ {t('resultViews.toReview')}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleKnew(); }}
              className="flex-1 py-3.5 rounded-xl bg-sphera-green text-black font-bold hover:bg-green-400 transition-colors flex justify-center items-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5" /> {t('resultViews.iKnewIt')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setFlipped(true)}
            className="w-full py-3.5 rounded-xl border border-sphera-border text-white bg-sphera-surface hover:bg-sphera-surface-2 font-medium transition-colors flex justify-center items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" /> {t('resultViews.flipCard')}
          </button>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// ANNALE VIEW (V2)
// ────────────────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  qcm: { label: "QCM", icon: <CheckCircle2 className="w-3 h-3" />, color: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25" },
  code: { label: "Code", icon: <Code2 className="w-3 h-3" />, color: "bg-violet-500/15 text-violet-400 ring-violet-500/25" },
  preuve: { label: "Preuve", icon: <Calculator className="w-3 h-3" />, color: "bg-blue-500/15 text-blue-400 ring-blue-500/25" },
  ouvert: { label: "Ouvert", icon: <AlignLeft className="w-3 h-3" />, color: "bg-[#ff9800]/15 text-[#ff9800] ring-[#ff9800]/25" },
} as const;

function TypeBadge({ type }: { type: string }) {
  const normType = (type || 'ouvert').toLowerCase().trim();
  const cfg = TYPE_CONFIG[normType as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.ouvert;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ring-1 ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function QcmAnswer({ reponse, explication }: { reponse: string; explication?: string }) {
  const letterMatch = reponse.match(/\b([A-D])\b/i);
  const letter = letterMatch ? letterMatch[1].toUpperCase() : null;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
        {letter && (
          <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-emerald-500 text-black font-extrabold text-base flex items-center justify-center shadow-md shadow-emerald-500/20">
            {letter}
          </span>
        )}
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
            Réponse Validée
          </p>
          <div className="text-sm font-medium text-white/95 leading-relaxed">
            {formatText(reponse)}
          </div>
        </div>
      </div>

      {explication && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-sphera-surface-2 border border-sphera-border">
          <Lightbulb className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 mb-1">
              Justification & Analyse
            </p>
            <div className="text-sm text-white/80 leading-relaxed">
              {formatText(explication)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CodeAnswer({ reponse, explication }: { reponse: string; explication?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(reponse).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden border border-violet-500/30 bg-[#0d0d12] shadow-lg">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#161622] border-b border-violet-500/20">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 mr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <Code2 className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-violet-300 font-mono">Solution de Code</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copier le code</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-xs sm:text-sm text-emerald-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-violet-500/30">
          <code>{reponse}</code>
        </pre>
      </div>

      {explication && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/25">
          <Code2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-violet-400 mb-1">
              Explication de l'algorithme
            </p>
            <div className="text-sm text-white/80 leading-relaxed">
              {formatText(explication)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProofAnswer({ reponse, explication }: { reponse: string; explication?: string }) {
  const steps = reponse.split(/\n+/).filter(line => line.trim().length > 0);
  const isMultiStep = steps.length > 1;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2 text-blue-400">
          <Calculator className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Démonstration Pas à Pas</span>
        </div>

        {isMultiStep ? (
          <div className="space-y-2.5">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-sphera-surface/50 border border-blue-500/15">
                <span className="flex-shrink-0 w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 text-xs font-bold font-mono flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 text-sm text-white/90 leading-relaxed font-mono">
                  {formatText(step)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-white/90 leading-relaxed font-mono border-l-2 border-blue-500/40 pl-4 py-1">
            {formatText(reponse)}
          </div>
        )}
      </div>

      {explication && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25">
          <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-1">
              Raisonnement & Principes
            </p>
            <div className="text-sm text-white/80 leading-relaxed">
              {formatText(explication)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OpenAnswer({ reponse, explication }: { reponse: string; explication?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3.5 p-4 rounded-xl bg-sphera-surface-2 border border-sphera-border">
        <Target className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
            Solution Détaillée
          </p>
          <div className="text-sm text-white/95 leading-relaxed font-medium">
            {formatText(reponse)}
          </div>
        </div>
      </div>

      {explication && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25">
          <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-1">
              Explication & Approfondissement
            </p>
            <div className="text-sm text-white/80 leading-relaxed">
              {formatText(explication)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdaptiveAnswer({ question }: { question: any }) {
  const normType = (question.type || 'ouvert').toLowerCase().trim();
  const reponse = question.reponse || question.reponse_attendue || question.reponse_courte || question.correction || question.answer || question.solution || '';
  const explication = question.explication || question.justification || question.raisonnement || '';

  return (
    <div className="space-y-3 mt-3">
      {normType === 'qcm' && <QcmAnswer reponse={reponse} explication={explication} />}
      {normType === 'code' && <CodeAnswer reponse={reponse} explication={explication} />}
      {normType === 'preuve' && <ProofAnswer reponse={reponse} explication={explication} />}
      {normType !== 'qcm' && normType !== 'code' && normType !== 'preuve' && (
        <OpenAnswer reponse={reponse} explication={explication} />
      )}

      {/* Étapes de résolution si structurées */}
      {Array.isArray(question.etapes_resolution) && question.etapes_resolution.length > 0 && (
        <div className="p-4 rounded-xl bg-sphera-surface-2 border border-sphera-border space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sphera-text-muted">
            Étapes de Résolution Détaillées
          </p>
          <div className="space-y-2">
            {question.etapes_resolution.map((etape: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-white/85">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sphera-surface border border-sphera-border text-xs font-bold flex items-center justify-center text-sphera-text-muted mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 leading-relaxed">{formatText(etape)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barème de notation si fourni */}
      {Array.isArray(question.bareme) && question.bareme.length > 0 && (
        <div className="p-4 rounded-xl bg-sphera-surface-2 border border-sphera-border space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sphera-text-muted">
            Barème Indicatif
          </p>
          <div className="divide-y divide-sphera-border">
            {question.bareme.map((b: any, idx: number) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                <span className="text-white/85">{b.critere || b.element || `Critère ${idx + 1}`}</span>
                <span className="font-semibold text-emerald-400 font-mono ml-4">
                  {b.points !== undefined ? `${b.points} pt${b.points > 1 ? 's' : ''}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Référence au cours */}
      {(question.source_cours || question.chapitre) && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <BookMarked className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-purple-400 uppercase tracking-wider mr-2">Référence cours :</span>
            <span className="text-white/80">{question.source_cours || question.chapitre}</span>
          </div>
        </div>
      )}

      {/* À retenir / Piège fréquent */}
      {(question.a_retenir || question.piege_frequent || question.pieges_frequents) && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#ff9800]/10 border border-[#ff9800]/25">
          <Lightbulb className="w-4 h-4 text-[#ff9800] flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-[#ff9800] uppercase tracking-wider mb-1">
              À Retenir / Piège Fréquent
            </p>
            <div className="text-white/85 leading-relaxed">
              {formatText(
                question.a_retenir ||
                question.piege_frequent ||
                (Array.isArray(question.pieges_frequents) ? question.pieges_frequents.join(' • ') : question.pieges_frequents)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AskSpheraButton({
  questionNum,
  enonce,
  onAskQuestion,
}: {
  questionNum: number | string;
  enonce: string;
  onAskQuestion?: (prompt: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as any)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  if (!onAskQuestion) return null;

  const enonceShort = enonce ? (enonce.length > 80 ? enonce.slice(0, 80) + '...' : enonce) : '';

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sphera-surface hover:bg-sphera-surface-2 border border-sphera-border text-sphera-green hover:border-sphera-green/50 transition-all cursor-pointer shadow-xs active:scale-95"
        title="Poser une question ciblée à Sphera sur cette correction"
      >
        <Sparkles weight="fill" className="w-3.5 h-3.5 text-sphera-green" />
        <span>Demander à Sphera</span>
        <ChevronDown className={`w-3 h-3 text-sphera-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 bottom-full mb-2 w-72 sm:w-80 p-2 rounded-xl border border-sphera-border bg-sphera-surface-2/95 backdrop-blur-md shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-1 origin-bottom-right"
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sphera-text-muted">
            Actions rapides Q{questionNum}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onAskQuestion(`Peux-tu m'expliquer pas à pas la correction de la question Q${questionNum} : "${enonceShort}" ? Je n'ai pas bien compris le raisonnement.`);
            }}
            className="flex items-start gap-2.5 w-full p-2 rounded-lg text-left hover:bg-sphera-surface transition-colors group cursor-pointer"
          >
            <ChatCircle weight="duotone" className="w-4 h-4 text-sphera-green shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-white font-medium group-hover:text-sphera-green transition-colors">Expliquer cette question</p>
              <p className="text-[11px] text-sphera-text-muted truncate">Détailler le raisonnement et les formules</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onAskQuestion(`Donne-moi un exercice d'entraînement similaire à la question Q${questionNum} ("${enonceShort}") avec son énoncé complet et sa correction détaillée.`);
            }}
            className="flex items-start gap-2.5 w-full p-2 rounded-lg text-left hover:bg-sphera-surface transition-colors group cursor-pointer"
          >
            <Target weight="duotone" className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-white font-medium group-hover:text-cyan-400 transition-colors">Exercice similaire</p>
              <p className="text-[11px] text-sphera-text-muted truncate">S'entraîner sur la même notion avec corrigé</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onAskQuestion(`Pour la question Q${questionNum}, je voudrais tester une autre méthode de résolution. Peux-tu analyser si d'autres démarches sont acceptées au barème ?`);
            }}
            className="flex items-start gap-2.5 w-full p-2 rounded-lg text-left hover:bg-sphera-surface transition-colors group cursor-pointer"
          >
            <Scales weight="duotone" className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-white font-medium group-hover:text-purple-400 transition-colors">Tester une autre méthode</p>
              <p className="text-[11px] text-sphera-text-muted truncate">Vérifier la validité et le barème indicatif</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onAskQuestion(`Quels sont les pièges classiques et astuces de rédaction pour la question Q${questionNum} ? Comment s'assurer d'obtenir le maximum de points ?`);
            }}
            className="flex items-start gap-2.5 w-full p-2 rounded-lg text-left hover:bg-sphera-surface transition-colors group cursor-pointer"
          >
            <Zap weight="duotone" className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-white font-medium group-hover:text-amber-400 transition-colors">Astuces & pièges d'examen</p>
              <p className="text-[11px] text-sphera-text-muted truncate">Ce que les examinateurs sanctionnent</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  mode,
  isOpen,
  onToggle,
  onAskQuestion,
}: {
  question: any;
  mode?: 'complete' | 'rapide';
  isOpen?: boolean;
  onToggle?: () => void;
  onAskQuestion?: (prompt: string) => void;
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : localOpen;
  const toggle = onToggle ?? (() => setLocalOpen(v => !v));

  const num = question.numero || 1;
  const enonce = question.enonce || question.question || '';
  const pts = question.points ? `${question.points} pt${question.points > 1 ? 's' : ''}` : null;
  const repDirecte = question.reponse || question.reponse_attendue || question.reponse_courte || question.correction || question.answer || question.solution || '';

  if (mode === 'rapide') {
    return (
      <div className="sphera-card p-4 hover:border-[#ff9800]/30 transition-all duration-200 mb-3">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 min-w-[2rem] h-7 rounded-lg bg-[#ff9800]/15 text-[#ff9800] text-xs font-bold flex items-center justify-center ring-1 ring-[#ff9800]/25 px-2">
            Q{num}
          </span>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm font-semibold text-white leading-relaxed">
                {formatText(enonce)}
              </div>
              <div className="flex items-center gap-2">
                {pts && (
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sphera-surface border border-sphera-border text-sphera-text-muted">
                    {pts}
                  </span>
                )}
                {question.type && <TypeBadge type={question.type} />}
              </div>
            </div>

            <div className="text-sm text-emerald-400 font-medium leading-relaxed bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              {formatText(repDirecte)}
            </div>

            <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
              {(question.explication || question.source_cours || question.a_retenir) ? (
                <button
                  type="button"
                  onClick={() => setLocalOpen(v => !v)}
                  className="text-xs text-[#ff9800] hover:text-[#ff9800]/80 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {localOpen ? 'Masquer les détails' : 'Afficher l\'explication et les détails'}
                  <ChevronDown className={`w-3 h-3 transition-transform ${localOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : <div />}
              <AskSpheraButton questionNum={num} enonce={enonce} onAskQuestion={onAskQuestion} />
            </div>

            {localOpen && (
              <div className="pt-2 animate-in fade-in">
                <AdaptiveAnswer question={question} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sphera-card overflow-hidden hover:border-[#ff9800]/30 transition-all duration-200 mb-3">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-sphera-surface-2 transition-colors cursor-pointer"
      >
        <span className="flex-shrink-0 min-w-[2rem] h-7 rounded-lg bg-[#ff9800]/15 text-[#ff9800] text-xs font-bold flex items-center justify-center ring-1 ring-[#ff9800]/25 px-2 mt-0.5">
          Q{num}
        </span>
        <div className="flex-1 text-sm font-semibold text-white leading-relaxed">
          {formatText(enonce)}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 mt-0.5">
          {pts && (
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sphera-surface border border-sphera-border text-sphera-text-muted hidden sm:inline-flex">
              {pts}
            </span>
          )}
          {question.type && <TypeBadge type={question.type} />}
          <div className="w-6 h-6 rounded-md bg-sphera-surface flex items-center justify-center text-sphera-text-muted">
            {open ? <ChevronDown className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 space-y-3 animate-in fade-in slide-in-from-top-1 border-t border-sphera-border/40">
          <AdaptiveAnswer question={question} />
          <div className="flex items-center justify-between pt-3 border-t border-sphera-border/30">
            <span className="text-[11px] text-sphera-text-muted">Besoin d'aide ou d'approfondir cette question ?</span>
            <AskSpheraButton questionNum={num} enonce={enonce} onAskQuestion={onAskQuestion} />
          </div>
        </div>
      )}
    </div>
  );
}

export function AnnaleView({
  annale,
  sourceName,
  onAskQuestion,
}: {
  annale: any;
  sourceName?: string;
  onAskQuestion?: (prompt: string) => void;
}) {
  const { t } = useTranslation('study')
  const rawAnnale = annale || {};
  let content = rawAnnale.content !== undefined ? rawAnnale.content : rawAnnale;
  if (typeof content === 'string') {
    try { content = JSON.parse(content); } catch {}
  }
  const mode: 'rapide' | 'complete' =
    rawAnnale?.type === 'annale_rapide'
      ? 'rapide'
      : rawAnnale?.type === 'annale_complete'
      ? 'complete'
      : (content?.mode === 'rapide' || rawAnnale?.mode === 'rapide' ? 'rapide' : 'complete');
  const isRawArray = Array.isArray(content);
  const rawSections: any[] = !isRawArray && (Array.isArray(content?.sections) ? content.sections : (Array.isArray(content?.parties) ? content.parties : []));
  const hasSections = Array.isArray(rawSections) && rawSections.length > 0;
  const hasLegacy = !isRawArray && Array.isArray(content?.corrections) && content.corrections.length > 0;
  const hasQuestions = !isRawArray && Array.isArray(content?.questions) && content.questions.length > 0;
  const conseils = content?.conseils_generaux || rawAnnale?.conseils_generaux || [];
  const { isDownloading, generateAnnale } = useDownloadPDF();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [areAllExpanded, setAreAllExpanded] = useState(false);

  // Flatten questions list to compute stats
  const allQuestions: any[] = useMemo(() => {
    if (isRawArray) return content;
    if (hasSections) {
      return rawSections.flatMap((s: any, sIdx: number) =>
        (s.questions || []).map((q: any, qIdx: number) => ({
          ...q,
          _secIdx: sIdx,
          _secName: s.nom || s.titre || `Section ${sIdx + 1}`,
          _key: `sec-${sIdx}-q-${qIdx}`,
          numero: q.numero || qIdx + 1,
        }))
      );
    }
    if (hasLegacy) return content.corrections.map((c: any, i: number) => ({ ...c, _key: `legacy-${i}`, numero: c.numero || i + 1 }));
    if (hasQuestions) return content.questions.map((q: any, i: number) => ({ ...q, _key: `q-${i}`, numero: q.numero || i + 1 }));
    return [];
  }, [content, isRawArray, hasSections, rawSections, hasLegacy, hasQuestions]);

  const totalQuestions = allQuestions.length;

  // Type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: totalQuestions, qcm: 0, code: 0, preuve: 0, ouvert: 0 };
    allQuestions.forEach(q => {
      const t = (q.type || 'ouvert').toLowerCase().trim();
      if (counts[t] !== undefined) counts[t]++;
      else counts.ouvert++;
    });
    return counts;
  }, [allQuestions, totalQuestions]);

  const toggleQuestion = (key: string) => {
    setExpandedMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleAll = () => {
    const nextState = !areAllExpanded;
    setAreAllExpanded(nextState);
    const newMap: Record<string, boolean> = {};
    allQuestions.forEach(q => {
      newMap[q._key || `q-${q.numero}`] = nextState;
    });
    setExpandedMap(newMap);
  };

  // Filter questions based on search query and selected type
  const filterQuestion = (q: any) => {
    const normType = (q.type || 'ouvert').toLowerCase().trim();
    if (selectedType !== 'all') {
      if (selectedType === 'ouvert' && normType !== 'qcm' && normType !== 'code' && normType !== 'preuve') {
        // match
      } else if (normType !== selectedType) {
        return false;
      }
    }

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const statement = (q.enonce || q.question || '').toLowerCase();
    const answer = (q.reponse || q.reponse_attendue || q.reponse_courte || q.correction || q.answer || '').toLowerCase();
    const expl = (q.explication || '').toLowerCase();
    const sec = (q._secName || '').toLowerCase();
    return statement.includes(query) || answer.includes(query) || expl.includes(query) || sec.includes(query);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleAll}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sphera-surface hover:bg-sphera-surface-2 text-white border border-sphera-border transition-colors cursor-pointer"
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-[#ff9800]" />
            <span>{areAllExpanded ? t('resultViews.collapseAll') : t('resultViews.expandAll')}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <DownloadPDFButton
            onDownload={() => generateAnnale(annale, sourceName || content?.titre)}
            isDownloading={isDownloading}
            label={t('resultViews.downloadCorrection')}
          />
        </div>
      </div>

      {/* Header Card */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-sphera-bg border border-sphera-border/60">
        <div className="flex items-center justify-between pb-3 border-b border-sphera-border/60">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-[#ff9800] font-semibold flex items-center gap-2">
                <span>{t('resultViews.examCorrection')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sphera-surface border border-sphera-border text-sphera-text-muted font-normal">
                  {mode === 'complete' ? t('resultViews.completeMode') : t('resultViews.rapidMode')}
                </span>
              </p>
              <p className="text-xs text-sphera-text-muted mt-1">
                {t('resultViews.questionsCorrected', { count: totalQuestions })}
              </p>
            </div>
          </div>
          <span className="text-xs text-sphera-text-muted/60 font-mono">sphera.campussphere.app</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
          {content?.titre || rawAnnale?.source_title || rawAnnale?.source_filename || t('resultViews.annaleTitle')}
        </h2>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-sphera-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('resultViews.searchQuestionPlaceholder')}
              className="w-full pl-10 pr-9 py-2 bg-sphera-surface rounded-xl border border-sphera-border text-xs sm:text-sm text-white placeholder:text-sphera-text-muted/60 focus:outline-none focus:border-[#ff9800]/50 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sphera-text-muted hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: t('resultViews.allQuestions'), count: typeCounts.all },
              { id: 'qcm', label: 'QCM', count: typeCounts.qcm },
              { id: 'code', label: 'Code', count: typeCounts.code },
              { id: 'preuve', label: 'Preuve', count: typeCounts.preuve },
              { id: 'ouvert', label: 'Ouvert', count: typeCounts.ouvert },
            ].map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedType(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedType === filter.id
                    ? 'bg-[#ff9800] text-black shadow-sm'
                    : 'bg-sphera-surface hover:bg-sphera-surface-2 text-sphera-text-muted hover:text-white border border-sphera-border'
                }`}
              >
                <span>{filter.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedType === filter.id ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'}`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sections Structurées */}
      {hasSections && (
        <div className="space-y-6">
          {rawSections.map((section: any, sIdx: number) => {
            const secQuestions = (section.questions || []).map((q: any, qIdx: number) => ({
              ...q,
              _secIdx: sIdx,
              _secName: section.nom || section.titre || `Section ${sIdx + 1}`,
              _key: `sec-${sIdx}-q-${qIdx}`,
              numero: q.numero || qIdx + 1,
            }));

            const filteredSecQuestions = secQuestions.filter(filterQuestion);
            if (filteredSecQuestions.length === 0 && (searchQuery || selectedType !== 'all')) {
              return null;
            }

            return (
              <div key={sIdx} className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-sphera-border/50">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#ff9800]/20 text-[#ff9800] text-xs font-bold flex items-center justify-center">
                    {sIdx + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {section.nom || section.titre || section.section || `Section ${sIdx + 1}`}
                    </h3>
                    <p className="text-xs text-sphera-text-muted">
                      {filteredSecQuestions.length} question{filteredSecQuestions.length > 1 ? 's' : ''} affichée{filteredSecQuestions.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredSecQuestions.map((q: any) => (
                    <QuestionCard
                      key={q._key}
                      question={q}
                      mode={mode}
                      isOpen={expandedMap[q._key] ?? areAllExpanded}
                      onToggle={() => toggleQuestion(q._key)}
                      onAskQuestion={onAskQuestion}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legacy Format / Raw Array */}
      {(!hasSections && (hasLegacy || isRawArray || hasQuestions)) && (
        <div className="space-y-3">
          {allQuestions.filter(filterQuestion).map((q: any) => (
            <QuestionCard
              key={q._key}
              question={q}
              mode={mode}
              isOpen={expandedMap[q._key] ?? areAllExpanded}
              onToggle={() => toggleQuestion(q._key)}
              onAskQuestion={onAskQuestion}
            />
          ))}
        </div>
      )}

      {/* Zero match state */}
      {totalQuestions > 0 && allQuestions.filter(filterQuestion).length === 0 && (
        <div className="p-8 text-center bg-sphera-surface-2 rounded-2xl border border-sphera-border">
          <Filter className="w-10 h-10 text-sphera-text-muted mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-white mb-1">Aucune question trouvée</h3>
          <p className="text-xs text-sphera-text-muted">
            Aucun résultat ne correspond aux filtres actuels ({selectedType !== 'all' ? `filtre: ${selectedType}` : ''} {searchQuery ? `"${searchQuery}"` : ''}).
          </p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setSelectedType('all'); }}
            className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sphera-surface text-white border border-sphera-border hover:bg-sphera-surface-2 transition-colors cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Fallback si aucun contenu reconnu */}
      {totalQuestions === 0 && (
        <div className="p-8 text-center bg-sphera-surface-2 rounded-2xl border border-sphera-border opacity-60">
          <HelpCircle className="w-12 h-12 text-sphera-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">Aucune correction trouvée</h3>
          <p className="text-sm text-sphera-text-muted max-w-md mx-auto">
            La correction n'a pas pu être structurée correctement, ou le format est non reconnu.
          </p>
        </div>
      )}

      {/* Conseils Stratégiques pour l'Épreuve */}
      {Array.isArray(conseils) && conseils.length > 0 && (
        <div className="sphera-card p-6 border-[#ff9800]/30 bg-[#ff9800]/5 mt-4">
          <h3 className="text-[#ff9800] font-bold flex items-center gap-2 mb-4 text-base">
            <Award className="w-5 h-5" /> Conseils Stratégiques pour l'Épreuve
          </h3>
          <ul className="space-y-3">
            {conseils.map((c: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/90">
                <span className="text-[#ff9800] font-bold">→</span>
                <div className="flex-1 leading-relaxed">{formatText(c)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface FlowData {
  nodes: Node[];
  edges: Edge[];
}

const MINDMAP_COULEURS: Record<string, { hex: string; bg: string; border: string; glow: string; text: string }> = {
  vert: { hex: '#10B981', bg: 'rgba(6, 78, 59, 0.45)', border: '#10b981', glow: 'rgba(16, 185, 129, 0.35)', text: '#34d399' },
  bleu: { hex: '#3B82F6', bg: 'rgba(30, 58, 138, 0.45)', border: '#3b82f6', glow: 'rgba(59, 130, 246, 0.35)', text: '#60a5fa' },
  orange: { hex: '#F59E0B', bg: 'rgba(120, 53, 15, 0.45)', border: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24' },
  violet: { hex: '#A855F7', bg: 'rgba(88, 28, 135, 0.45)', border: '#a855f7', glow: 'rgba(168, 85, 247, 0.35)', text: '#c084fc' },
  rose: { hex: '#EC4899', bg: 'rgba(131, 24, 67, 0.45)', border: '#ec4899', glow: 'rgba(236, 72, 153, 0.35)', text: '#f472b6' },
  cyan: { hex: '#06B6D4', bg: 'rgba(22, 78, 99, 0.45)', border: '#06b6d4', glow: 'rgba(6, 182, 212, 0.35)', text: '#22d3ee' },
};

function getBranchColor(couleurStr?: string, index: number = 0) {
  const c = String(couleurStr || '').toLowerCase();
  if (c.includes('vert') || c === 'green') return MINDMAP_COULEURS.vert;
  if (c.includes('bleu') || c === 'blue') return MINDMAP_COULEURS.bleu;
  if (c.includes('orange')) return MINDMAP_COULEURS.orange;
  if (c.includes('violet') || c === 'purple') return MINDMAP_COULEURS.violet;
  if (c.includes('rose') || c === 'pink') return MINDMAP_COULEURS.rose;
  if (c.includes('cyan')) return MINDMAP_COULEURS.cyan;
  const palette = [MINDMAP_COULEURS.vert, MINDMAP_COULEURS.bleu, MINDMAP_COULEURS.orange, MINDMAP_COULEURS.violet, MINDMAP_COULEURS.rose, MINDMAP_COULEURS.cyan];
  return palette[index % palette.length];
}

export function MindmapView({ content }: { content: any }) {
  const { t } = useTranslation('study')
  const mapData = content?.mindmap || content || {};
  const centralNode = mapData?.noeud_central || mapData?.titre || "Concept Central";
  const branches: any[] = Array.isArray(mapData?.branches) ? mapData.branches : [];

  const [viewMode, setViewMode] = useState<'canvas' | 'tree'>('canvas');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [collapsedBranches, setCollapsedBranches] = useState<Record<number, boolean>>({});
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const toggleBranch = (idx: number) => {
    setCollapsedBranches(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const expandAll = () => {
    setCollapsedBranches({});
    setTimeout(() => {
      reactFlowInstance.current?.fitView({ padding: 0.2, duration: 300 });
    }, 50);
  };

  const collapseAll = () => {
    const all: Record<number, boolean> = {};
    branches.forEach((_, i) => { all[i] = true; });
    setCollapsedBranches(all);
    setTimeout(() => {
      reactFlowInstance.current?.fitView({ padding: 0.2, duration: 300 });
    }, 50);
  };

  const handleRecenter = () => {
    reactFlowInstance.current?.fitView({ padding: 0.2, duration: 400 });
  };

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    if (node.id.startsWith('branch-')) {
      const idx = parseInt(node.id.replace('branch-', ''), 10);
      if (!isNaN(idx)) {
        toggleBranch(idx);
      }
    } else if (node.id === 'central') {
      const anyCollapsed = branches.some((_, i) => collapsedBranches[i]);
      if (anyCollapsed) {
        expandAll();
      } else {
        collapseAll();
      }
    }
  };

  // Build the Horizontal Tree (Left-to-Right) structure for ReactFlow
  const { nodes, edges } = useMemo<FlowData>(() => {
    const nodesList: Node[] = [];
    const edgesList: Edge[] = [];

    const branchCount = branches.length;
    if (branchCount === 0) {
      nodesList.push({
        id: 'central',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="p-3 text-center select-none font-bold text-sm text-white">
              {centralNode}
            </div>
          ),
        },
        position: { x: 50, y: 150 },
        style: {
          background: 'rgba(24, 27, 36, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          color: '#fff',
          minWidth: 180,
          maxWidth: 240,
        },
      });
      return { nodes: nodesList, edges: edgesList };
    }

    const SUB_ITEM_HEIGHT = 56;
    const BRANCH_GAP = 20;

    const branchHeights = branches.map((b, i) => {
      const isCollapsed = Boolean(collapsedBranches[i]);
      const subCount = Array.isArray(b.sous_branches) ? b.sous_branches.length : 0;
      if (isCollapsed || subCount === 0) return 56;
      return Math.max(56, subCount * SUB_ITEM_HEIGHT);
    });

    const totalTreeHeight = branchHeights.reduce((acc, h) => acc + h + BRANCH_GAP, 0) - BRANCH_GAP;
    const startY = 40;
    const centralY = startY + totalTreeHeight / 2 - 30;

    // Central core node on the left
    nodesList.push({
      id: 'central',
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        label: (
          <div className="flex flex-col items-start p-3 select-none cursor-pointer">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5">
              Sujet central
            </span>
            <span className="font-bold text-sm text-white leading-snug">
              {centralNode}
            </span>
            <span className="text-[10px] text-sphera-text-muted mt-1 font-mono">
              {branches.length} branches principales
            </span>
          </div>
        ),
      },
      position: { x: 40, y: Math.max(40, centralY) },
      style: {
        background: 'rgba(22, 25, 34, 0.98)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
        color: '#fff',
        minWidth: 190,
        maxWidth: 250,
        cursor: 'pointer',
        zIndex: 10,
      },
    });

    // Level 1 branches and Level 2 sub-branches horizontally to the right
    let currentY = startY;

    branches.forEach((b: any, i: number) => {
      const branchId = `branch-${i}`;
      const color = getBranchColor(b.couleur, i);
      const subBranches: any[] = Array.isArray(b.sous_branches) ? b.sous_branches : [];
      const subCount = subBranches.length;
      const isCollapsed = Boolean(collapsedBranches[i]);
      const currentBranchHeight = branchHeights[i];

      const branchY = currentY + currentBranchHeight / 2 - 25;

      nodesList.push({
        id: branchId,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: (
            <div className="flex items-center justify-between gap-3 p-2.5 text-left select-none cursor-pointer">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="font-semibold text-xs sm:text-sm text-white leading-tight truncate">
                  {b.label}
                </span>
              </div>
              {subCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBranch(i);
                  }}
                  className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold transition-all border flex items-center gap-0.5 ${
                    isCollapsed
                      ? 'bg-sphera-surface-2 text-sphera-text-muted border-sphera-border hover:text-white'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                  title={isCollapsed ? "Déplier les sous-branches" : "Replier les sous-branches"}
                >
                  <span>{isCollapsed ? `+ ${subCount}` : `- ${subCount}`}</span>
                </button>
              )}
            </div>
          ),
        },
        position: { x: 380, y: branchY },
        style: {
          background: 'rgba(24, 27, 37, 0.96)',
          border: `1px solid ${isCollapsed ? 'rgba(255, 255, 255, 0.1)' : `${color.hex}55`}`,
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          color: '#fff',
          minWidth: 180,
          maxWidth: 250,
          cursor: 'pointer',
          zIndex: 5,
        },
      });

      edgesList.push({
        id: `e-central-${branchId}`,
        source: 'central',
        target: branchId,
        type: 'smoothstep',
        style: { stroke: `${color.hex}88`, strokeWidth: 1.5 },
      });

      // Sub-branches placed horizontally to the right of branch
      if (!isCollapsed && subCount > 0) {
        subBranches.forEach((sb: any, j: number) => {
          const subId = `${branchId}-sub-${j}`;
          const subLabel = typeof sb === 'string' ? sb : (sb.label || sb.nom || sb.texte || JSON.stringify(sb));
          const subY = currentY + j * SUB_ITEM_HEIGHT + 2;

          nodesList.push({
            id: subId,
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            data: {
              label: (
                <div className="flex items-start gap-1.5 p-2 text-xs text-white/90 leading-snug select-none">
                  <span className="text-sphera-text-muted text-[10px] mt-0.5">•</span>
                  <span>{subLabel}</span>
                </div>
              ),
            },
            position: { x: 700, y: subY },
            style: {
              background: 'rgba(18, 20, 28, 0.94)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
              color: '#e2e8f0',
              minWidth: 170,
              maxWidth: 230,
              fontSize: '11px',
              zIndex: 2,
            },
          });

          edgesList.push({
            id: `e-${branchId}-${subId}`,
            source: branchId,
            target: subId,
            type: 'smoothstep',
            style: { stroke: `${color.hex}55`, strokeWidth: 1.2 },
          });
        });
      }

      currentY += currentBranchHeight + BRANCH_GAP;
    });

    return { nodes: nodesList, edges: edgesList };
  }, [centralNode, branches, collapsedBranches]);

  const renderSubBranches = (subList: any[], level = 1) => {
    if (!Array.isArray(subList) || subList.length === 0) return null;
    return (
      <ul className={`space-y-2 ${level > 1 ? 'ml-4 pl-3 border-l border-sphera-border/60' : 'mt-2'}`}>
        {subList.map((item, idx) => {
          const label = typeof item === 'string' ? item : (item.label || item.nom || item.texte || JSON.stringify(item));
          const hasChildren = Array.isArray(item?.sous_branches) && item.sous_branches.length > 0;
          return (
            <li key={idx} className="text-sm">
              <div className="flex items-start gap-2 text-white/90">
                <span className="text-sphera-text-muted mt-1 text-xs">•</span>
                <span className="leading-snug">{formatText(label)}</span>
              </div>
              {hasChildren && renderSubBranches(item.sous_branches, level + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  const totalSubBranches = branches.reduce((acc, b) => acc + (Array.isArray(b.sous_branches) ? b.sous_branches.length : 0), 0);

  return (
    <div className={`flex flex-col gap-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#070b14] p-4 sm:p-6 overflow-hidden' : ''}`}>
      {/* Mindmap Sleek Header & Structured Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sphera-border/60">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <GitFork className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Carte Mentale</span>
          </div>
          {mapData?.titre && (
            <h2 className="text-base sm:text-lg font-semibold text-white truncate">
              {mapData.titre}
            </h2>
          )}
        </div>

        {/* Cohesive, structured button toolbar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* 1. Mode Switcher (Canvas / Arbre) */}
          <div className="inline-flex p-0.5 rounded-xl bg-sphera-surface-2 border border-sphera-border shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'canvas'
                  ? 'bg-sphera-surface text-emerald-300 shadow-sm border border-emerald-500/20'
                  : 'text-sphera-text-muted hover:text-white'
              }`}
            >
              <GitFork className="w-3.5 h-3.5 text-emerald-400" />
              <span>Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'tree'
                  ? 'bg-sphera-surface text-emerald-300 shadow-sm border border-emerald-500/20'
                  : 'text-sphera-text-muted hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5 text-emerald-400" />
              <span>Arbre</span>
            </button>
          </div>

          {/* 2. Hierarchy Action Pills: Déplier / Replier */}
          <div className="inline-flex p-0.5 rounded-xl bg-sphera-surface-2 border border-sphera-border shadow-xs">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
              title="Déplier toutes les branches"
            >
              Déplier tout
            </button>
            <div className="w-px h-3.5 bg-sphera-border/60 self-center mx-0.5" />
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
              title="Replier toutes les branches"
            >
              Replier tout
            </button>
          </div>

          {/* 3. Canvas utilities (Recenter & Fullscreen) */}
          {viewMode === 'canvas' && (
            <div className="inline-flex p-0.5 rounded-xl bg-sphera-surface-2 border border-sphera-border shadow-xs">
              <button
                type="button"
                onClick={handleRecenter}
                className="p-1.5 rounded-lg text-sphera-text-muted hover:text-emerald-400 hover:bg-sphera-surface transition-colors"
                title="Recentrer la carte mentale"
              >
                <LocateFixed className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen((prev) => !prev)}
                className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
                title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {branches.length === 0 ? (
        <div className="p-12 text-center bg-sphera-surface-2 rounded-2xl border border-sphera-border opacity-60">
          <GitFork className="w-12 h-12 text-sphera-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">Carte mentale en cours de génération</h3>
          <p className="text-sm text-sphera-text-muted max-w-md mx-auto">
            Les branches de la carte mentale n'ont pas pu être extraites pour ce document.
          </p>
        </div>
      ) : viewMode === 'canvas' ? (
        /* Real Interactive Radial ReactFlow Mind Map Canvas with Collapsible Nodes */
        <div className={`relative w-full rounded-2xl border border-sphera-border bg-[#070b14] overflow-hidden shadow-2xl ${isFullscreen ? 'flex-1 h-full' : 'h-[650px]'}`}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            fitView
            onInit={(instance) => {
              reactFlowInstance.current = instance;
            }}
            panOnDrag={true}
            zoomOnPinch={true}
            zoomOnScroll={true}
            zoomOnDoubleClick={true}
            minZoom={0.2}
            maxZoom={2.5}
            preventScrolling={true}
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls showInteractive={false} className="bg-sphera-surface-2 border border-sphera-border rounded-xl text-white shadow-2xl" />
          </ReactFlow>

          <div className="absolute bottom-4 left-4 z-10 pointer-events-none text-[11px] text-white/50 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Cliquer sur un nœud pour le plier/déplier · Glisser pour explorer · Molette pour zoomer</span>
          </div>
        </div>
      ) : (
        /* Hierarchical Outline / Tree View */
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-sphera-surface-2 border border-sphera-border text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-0.5 block">Sujet central</span>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {centralNode}
            </h3>
          </div>

          {branches.map((b: any, i: number) => {
            const color = getBranchColor(b.couleur, i);
            const isExpanded = !collapsedBranches[i];
            const subCount = Array.isArray(b.sous_branches) ? b.sous_branches.length : 0;

            return (
              <div
                key={i}
                className="rounded-2xl border border-sphera-border bg-sphera-surface-2/60 transition-all duration-200 overflow-hidden hover:border-sphera-border/90"
              >
                <button
                  type="button"
                  onClick={() => toggleBranch(i)}
                  className="w-full p-4 sm:p-4.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="font-semibold text-white text-sm sm:text-base truncate">
                      {b.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs text-sphera-text-muted">
                      {subCount} sous-point{subCount > 1 ? 's' : ''}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-sphera-text-muted" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-sphera-text-muted" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-sphera-border/40">
                    {subCount > 0 ? (
                      renderSubBranches(b.sous_branches)
                    ) : (
                      <p className="text-xs text-sphera-text-muted italic">Aucun sous-concept détaillé</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function cleanSpokenText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^(?:(?:étudiant|etudiant|student|speaker|locuteur)\s*[ab12]\s*[:\-–—]\s*)/i, '')
    .replace(/^[AB12]\s*[:\-–—]\s*/i, '')
    .trim();
}

function normalizeSpeaker(rawSpeaker: unknown, index: number = 0): 'A' | 'B' {
  if (typeof rawSpeaker === 'number') {
    return rawSpeaker === 2 ? 'B' : 'A';
  }
  const s = String(rawSpeaker || '').trim().toLowerCase();
  if (!s) return index % 2 === 0 ? 'A' : 'B';
  if (s === 'b' || s === '2') return 'B';
  if (s === 'a' || s === '1') return 'A';
  if (
    /\b[b2]\b/i.test(s) ||
    s.includes('étudiant b') ||
    s.includes('etudiant b') ||
    s.includes('student b') ||
    s.includes('speaker b') ||
    s.includes('curieux') ||
    s.includes('interrog') ||
    s.endsWith('b') ||
    s.endsWith('2')
  ) {
    return 'B';
  }
  if (
    /\b[a1]\b/i.test(s) ||
    s.includes('étudiant a') ||
    s.includes('etudiant a') ||
    s.includes('student a') ||
    s.includes('speaker a') ||
    s.includes('explicateur') ||
    s.includes('tuteur') ||
    s.endsWith('a') ||
    s.endsWith('1')
  ) {
    return 'A';
  }
  return index % 2 === 0 ? 'A' : 'B';
}

function LiveVoiceVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const [frequencies, setFrequencies] = useState<number[]>(() =>
    new Array(24).fill(6)
  );
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setFrequencies(new Array(24).fill(6));
      return;
    }

    const update = () => {
      const data = getPodcastVoiceData(24);
      setFrequencies(data);
      animFrameRef.current = requestAnimationFrame(update);
    };

    animFrameRef.current = requestAnimationFrame(update);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-14 py-2 px-4 rounded-xl bg-sphera-surface/50 border border-sphera-border/60 overflow-hidden">
      {frequencies.map((val, i) => (
        <div
          key={i}
          className={`w-1 sm:w-1.5 rounded-full transition-all duration-75 ${
            isPlaying && val > 8
              ? 'bg-gradient-to-t from-purple-600 via-purple-500 to-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.35)]'
              : 'bg-sphera-text-muted/20'
          }`}
          style={{
            height: `${Math.max(8, val)}%`,
            minHeight: '4px',
            maxHeight: '100%',
          }}
        />
      ))}
    </div>
  );
}

export function AudioSummaryView({
  content,
  sessionId,
}: {
  content: any;
  sessionId?: string | number;
}) {
  const { t } = useTranslation('study');
  const audioData = content?.audio || content || {};
  const dialogue: Array<{ speaker: string; text: string }> = Array.isArray(audioData?.dialogue) ? audioData.dialogue : [];
  const audioUrl: string | undefined = audioData?.audioUrl;

  const podcast = usePodcastPlayer();
  const currentTitle = audioData?.titre || "Podcast de révision";

  const isCurrentAudio = podcast.isActive && (podcast.audioUrl === audioUrl || podcast.title === currentTitle);
  const isPlaying = isCurrentAudio && podcast.isPlaying;
  const currentTime = isCurrentAudio ? podcast.currentTime : 0;
  const duration = isCurrentAudio ? podcast.duration : (audioUrl ? 0 : dialogue.length);
  const playbackSpeed = isCurrentAudio ? podcast.playbackSpeed : 1;

  const normalizedDialogue = useMemo(() => {
    const raw = dialogue.map((turn, idx) => ({
      ...turn,
      speaker: normalizeSpeaker(turn.speaker, idx),
    }));
    const hasA = raw.some((t) => t.speaker === 'A');
    const hasB = raw.some((t) => t.speaker === 'B');
    if (!hasA || !hasB) {
      return raw.map((t, idx) => ({
        ...t,
        speaker: (idx % 2 === 0 ? 'A' : 'B') as 'A' | 'B',
      }));
    }
    return raw;
  }, [dialogue]);

  const toggleAudioPlay = () => {
    if (isCurrentAudio) {
      podcastStore.togglePlay();
    } else {
      podcastStore.loadAndPlay(currentTitle, audioUrl, normalizedDialogue, audioData?.lang, sessionId);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    podcastStore.setSpeed(nextSpeed);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    podcastStore.seek(time);
  };

  const handleJumpToTurn = (index: number) => {
    if (!isCurrentAudio) {
      podcastStore.loadAndPlay(currentTitle, audioUrl, normalizedDialogue, audioData?.lang, sessionId);
    }
    podcastStore.seekToTurn(index);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sleek Podcast Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-sphera-border/60">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <AudioLines className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              {t('resultViews.podcastTitle')}
            </span>
          </div>
          {audioData?.titre && (
            <h2 className="text-base sm:text-lg font-semibold text-white truncate">
              {audioData.titre}
            </h2>
          )}
        </div>

        {audioUrl && (
          <a
            href={audioUrl}
            download="podcast-revision.mp3"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sphera-surface-2 border border-sphera-border text-xs font-medium text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors shrink-0"
            title={t('resultViews.downloadMp3')}
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>MP3</span>
          </a>
        )}
      </div>

      {/* Modern Studio Audio Player Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-sphera-surface-2 border border-sphera-border relative overflow-hidden shadow-sm space-y-5">
        {/* Dynamic Voice Visualizer connected to voice harmonics & word boundaries */}
        <LiveVoiceVisualizer isPlaying={isPlaying} />

        {/* Audio Scrubber & Progress */}
        <div className="space-y-1.5">
          {audioUrl ? (
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-purple-400 cursor-pointer h-1.5 bg-sphera-surface rounded-lg appearance-none"
            />
          ) : (
            <div className="h-1.5 w-full bg-sphera-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{
                  width: `${
                    dialogue.length > 0
                      ? Math.min(100, ((currentTime + 1) / dialogue.length) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          )}
          <div className="flex justify-between text-[11px] font-mono text-sphera-text-muted">
            <span>
              {audioUrl
                ? formatTime(currentTime)
                : (dialogue.length > 0
                    ? `Réplique ${Math.min(currentTime + 1, dialogue.length)}`
                    : '0:00')}
            </span>
            <span>
              {audioUrl ? formatTime(duration) : `${dialogue.length} répliques`}
            </span>
          </div>
        </div>

        {/* Audio Controls (Left Mute, Center Play/Pause & Skip, Right Speed) */}
        <div className="flex items-center justify-between pt-1">
          {/* Left: Sound Mute / Unmute Button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => podcastStore.toggleMute()}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                podcast.isMuted
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-sphera-surface border-sphera-border text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2'
              }`}
              title={podcast.isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {podcast.isMuted ? <SpeakerSimpleSlash className="w-4 h-4" /> : <SpeakerSimpleHigh className="w-4 h-4" />}
            </button>
          </div>

          {/* Center: Transport Controls (Reculer 15s, Play/Pause, Avancer 15s) */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              type="button"
              onClick={() => podcastStore.skip(-15)}
              className="p-2.5 rounded-xl text-sphera-text-muted hover:text-white hover:bg-sphera-surface border border-sphera-border/60 transition-colors cursor-pointer"
              title="Reculer de 15s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleAudioPlay}
              className="w-12 h-12 rounded-full bg-purple-500 hover:bg-purple-400 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-500/25 active:scale-95 transition-all shrink-0 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Lecture'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 ml-0.5 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={() => podcastStore.skip(15)}
              className="p-2.5 rounded-xl text-sphera-text-muted hover:text-white hover:bg-sphera-surface border border-sphera-border/60 transition-colors cursor-pointer"
              title="Avancer de 15s"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Playback Speed Button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleSpeedChange}
              className="px-3 py-1.5 rounded-xl bg-sphera-surface border border-sphera-border text-xs font-mono font-medium text-sphera-text-muted hover:text-white hover:border-purple-500/30 transition-colors shrink-0 cursor-pointer"
              title="Vitesse de lecture"
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>
      </div>

      {/* Dialogue Script */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-white text-base">
            {t('resultViews.scriptTitle', { count: dialogue.length })}
          </h3>
          <span className="text-xs text-sphera-text-muted">
            {t('resultViews.discussionTime', {
              minutes: Math.max(1, Math.round(dialogue.length * 0.4)),
            })}
          </span>
        </div>

        {normalizedDialogue.length === 0 ? (
          <div className="p-8 text-center bg-sphera-surface-2 rounded-2xl border border-sphera-border opacity-60">
            <AudioLines className="w-12 h-12 text-sphera-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">
              {t('resultViews.noAudioDialogue')}
            </h3>
            <p className="text-sm text-sphera-text-muted max-w-md mx-auto">
              {t('resultViews.noAudioDialogueDesc')}
            </p>
          </div>
        ) : (
          normalizedDialogue.map((turn, idx) => {
            const isSpeakerA = turn.speaker === 'A';
            const isCurrentTurn = isCurrentAudio && (
              audioUrl
                ? (duration > 0 ? Math.min(normalizedDialogue.length - 1, Math.floor((currentTime / duration) * normalizedDialogue.length)) === idx : idx === 0)
                : currentTime === idx
            );
            return (
              <div
                key={idx}
                onClick={() => handleJumpToTurn(idx)}
                className={`flex gap-3 sm:gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  isCurrentTurn && isPlaying
                    ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30'
                    : isSpeakerA
                      ? 'bg-sphera-surface/80 border-sphera-border hover:border-purple-500/30'
                      : 'bg-sphera-surface-2/80 border-sphera-border hover:border-purple-500/30 ml-3 sm:ml-6'
                }`}
                title="Cliquer pour écouter à partir de cette réplique"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSpeakerA
                      ? 'bg-purple-500/50 text-purple-400 border border-purple-500/40'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                  }`}
                >
                  {isSpeakerA ? 'A' : 'B'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">
                      {isSpeakerA ? t('resultViews.speakerA') : t('resultViews.speakerB')}
                    </span>
                    <span className="text-[10px] text-sphera-text-muted font-mono">
                      #{idx + 1}
                    </span>
                  </div>
                  <div className="text-sm text-white/90 leading-relaxed">
                    {formatText(cleanSpokenText(turn.text))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

