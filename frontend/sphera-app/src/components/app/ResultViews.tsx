import React, { useState, useEffect, useCallback, useRef } from 'react'
import { FileText, BrainCircuit, List, CheckCircle2, HelpCircle, CircleSmall, Lightbulb, ChevronDown, ChevronRight, Timer, Trophy, XCircle, RotateCcw, RefreshCcw, Code2, Calculator, AlignLeft, Target, BookOpen, BookMarked, Award, Layers, Zap, GitFork, AudioLines, Play, Pause, Volume2, Download } from 'lucide-react'
import DownloadPDFButton from '../shared/DownloadPDFButton'
import { useDownloadPDF } from '../../hooks/useDownloadPDF'

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
          label="Télécharger la fiche"
        />
      </div>

      {/* Captured zone */}
      <div className="flex flex-col gap-6 p-4 rounded-2xl bg-sphera-bg">
        {/* PDF Header */}
        <div className="flex items-center justify-between pb-4 border-b border-sphera-border">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-sphera-green font-semibold">Fiche de révision</p>
              <p className="text-xs text-sphera-text-muted">Généré le {new Date().toLocaleDateString('fr-FR')}</p>
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
              <FileText className="w-4 h-4" /> Résumé
            </h3>
            <div className="text-sphera-text-muted leading-relaxed">{formatText(f.resume)}</div>
          </div>
        )}
        {Array.isArray(f?.points_cles) && f.points_cles.length > 0 && (
          <div className="sphera-card p-6">
            <h3 className="text-sphera-green text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Points clés
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
              <List className="w-4 h-4" /> Définitions
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
              <Calculator className="w-4 h-4" /> Formules &amp; Concepts Abstraits
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
              <Lightbulb className="w-4 h-4" /> À retenir
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

export function QuizView({ content }: { content: any }) {
  const qData = content?.quiz || content || {}
  const questions = Array.isArray(qData.questions) ? qData.questions : []
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [timerActive, setTimerActive] = useState(true)
  const [answers, setAnswers] = useState<Array<{ selected: string | null; correct: boolean }>>([])
  const [showExplanation, setShowExplanation] = useState(false)

  if (!questions.length) return <p className="text-sphera-text-muted">Aucun quiz disponible.</p>

  const total = questions.length
  const currentQuestion = questions[currentIndex]

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
    
    let emoji = "💪";
    let message = "Continue tes efforts !";
    if (pct === 100) { emoji = "👑"; message = "Parfait ! Un sans-faute absolu !"; }
    else if (pct >= 80) { emoji = "🏆"; message = "Excellent travail !"; }
    else if (pct >= 60) { emoji = "👍"; message = "Bon score, mais tu peux faire mieux !"; }

    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-8">
        <div className="text-center p-8 bg-sphera-surface-2 rounded-2xl border border-sphera-border">
          <div className="text-6xl mb-4">{emoji}</div>
          <p className="text-xl text-white font-bold mb-2">{message}</p>
          <p className="text-3xl font-bold text-white mb-2">
            {score} <span className="text-sphera-text-muted font-normal text-xl">/ {total}</span>
          </p>
          <p className="text-sphera-text-muted">{pct}% de réussite</p>
          <div className="h-2 w-full bg-sphera-bg rounded-full overflow-hidden mt-6">
            <div className="h-full bg-sphera-green transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-white mb-4">Récapitulatif</h3>
          {answers.map((ans, i) => (
            <div key={i} className={`flex flex-col sm:flex-row gap-3 rounded-xl p-4 border text-sm ${ans.correct ? "border-sphera-green/30 bg-sphera-green/5" : "border-red-500/30 bg-red-500/5"}`}>
              <div className="flex items-center gap-3 w-full">
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
            </div>
          ))}
        </div>

        <button onClick={handleRestart} className="sphera-primary-btn w-full justify-center py-3 mt-4">
          <RotateCcw className="h-4 w-4 mr-2" /> Recommencer le quiz
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-sphera-text-muted font-medium">
          Question <span className="text-white font-bold">{currentIndex + 1}</span> / {total}
        </span>
        <div className="bg-sphera-surface px-3 py-1.5 rounded-full border border-sphera-border flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-white font-semibold">{score} point{score > 1 ? "s" : ""}</span>
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
          ⏰ <strong>Temps écoulé !</strong> La bonne réponse était l'option <strong>{currentQuestion.bonne_reponse}</strong>.
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
          <p className="font-bold mb-2 text-base">
            {selectedOption === currentQuestion.bonne_reponse ? "✅ Correct !" : "❌ Incorrect"}
          </p>
          <div className="opacity-90">{formatText(currentQuestion.explication)}</div>
        </div>
      )}

      {selectedOption !== null && (
        <button onClick={handleNext} className="sphera-primary-btn w-full justify-center py-4 mt-4 text-base">
          {currentIndex + 1 >= total ? (
            <span className="flex items-center gap-2"><Trophy className="h-5 w-5" /> Voir mon score</span>
          ) : (
            <span className="flex items-center gap-2">Question suivante <ChevronRight className="h-5 w-5" /></span>
          )}
        </button>
      )}
    </div>
  )
}

export function FlashcardsView({ content }: { content: any }) {
  const fData = content?.flashcards || content || {}
  const cartes = Array.isArray(fData.cartes) ? fData.cartes : []
  const total = cartes.length

  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [review, setReview] = useState<Set<number>>(new Set())
  const [finished, setFinished] = useState(false)

  if (!total) return <p className="text-sphera-text-muted">Aucune flashcard générée.</p>

  const currentCard = cartes[currentIndex]

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
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setReview(new Set());
    setFinished(false);
  }

  const handleRestartReview = () => {
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
      <div className="space-y-6 max-w-2xl mx-auto pb-8">
        <div className="text-center p-8 bg-sphera-surface-2 rounded-2xl border border-sphera-border">
          <div className="text-6xl mb-4">{knownCount === total ? "🎉" : "📚"}</div>
          <p className="text-3xl font-bold text-white mb-2">
            {knownCount} <span className="text-sphera-text-muted font-normal text-xl">/ {total} mémorisées</span>
          </p>
          <p className="text-sphera-text-muted">
            {reviewCount > 0 ? `${reviewCount} carte${reviewCount > 1 ? "s" : ""} à revoir` : "Toutes les cartes sont maîtrisées !"}
          </p>
          <div className="h-2 w-full bg-sphera-bg rounded-full overflow-hidden mt-6">
            <div className="h-full bg-sphera-green transition-all" style={{ width: `${(knownCount / total) * 100}%` }} />
          </div>
        </div>

        {reviewCards.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <RefreshCcw className="h-5 w-5 text-yellow-500" /> Cartes à revoir
            </h3>
            {reviewCards.map((card: any, i: number) => (
              <div key={i} className="border border-red-500/30 bg-red-500/5 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-400 mb-2">{formatText(card.recto)}</p>
                <div className="text-sm text-sphera-text-muted leading-relaxed">{formatText(card.verso)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button onClick={handleRestart} className="flex-1 py-3 px-4 rounded-xl bg-sphera-surface border border-sphera-border text-white font-medium flex justify-center items-center gap-2 hover:bg-sphera-surface-2 transition-colors">
            <RotateCcw className="h-4 w-4" /> Tout recommencer
          </button>
          {reviewCards.length > 0 && (
            <button onClick={handleRestartReview} className="flex-1 py-3 px-4 rounded-xl bg-sphera-green text-black font-semibold flex justify-center items-center gap-2 hover:bg-green-400 transition-colors">
              <RefreshCcw className="h-4 w-4" /> Revoir {reviewCount} carte{reviewCount > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12 space-y-5">
      {/* Progression */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-sphera-text-muted font-medium">
          Carte <span className="text-white font-bold">{currentIndex + 1}</span> / {total}
        </span>
        <div className="flex gap-2">
          {known.size > 0 && (
            <span className="bg-sphera-green/10 text-sphera-green border border-sphera-green/20 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> {known.size} sues
            </span>
          )}
          {review.size > 0 && (
            <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              ↩ {review.size} à revoir
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
                Question / Terme
              </span>
            </div>
            
            <div className="text-xl md:text-2xl leading-relaxed mt-4 font-bold text-white w-full max-h-[200px] overflow-y-auto scrollbar-thin">
              {formatText(currentCard.recto)}
            </div>

            <p className="absolute bottom-6 text-xs text-sphera-text-muted font-medium flex items-center gap-2">
              Cliquez pour retourner <RotateCcw className="w-3 h-3" />
            </p>
          </div>

          {/* Back (Réponse) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-sphera-green/10 to-sphera-surface-2 border-2 border-sphera-green/50 shadow-[0_0_40px_rgba(34,197,94,0.15)]">
            <div className="absolute top-6">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-sphera-green/30 text-sphera-green">
                Réponse / Définition
              </span>
            </div>
            
            <div className="text-xl md:text-2xl leading-relaxed mt-4 font-normal text-white/90 w-full max-h-[200px] overflow-y-auto scrollbar-thin">
              {formatText(currentCard.verso)}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 h-16">
        {flipped ? (
          <div className="flex gap-3 animate-in fade-in zoom-in duration-300">
            <button
              onClick={(e) => { e.stopPropagation(); handleReview(); }}
              className="flex-1 py-3.5 rounded-xl border-2 border-red-500/40 text-red-400 font-semibold hover:bg-red-500/10 hover:border-red-500 transition-colors flex justify-center items-center gap-2"
            >
              ↩ À revoir
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleKnew(); }}
              className="flex-1 py-3.5 rounded-xl bg-sphera-green text-black font-bold hover:bg-green-400 transition-colors flex justify-center items-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5" /> Je savais !
            </button>
          </div>
        ) : (
          <button
            onClick={() => setFlipped(true)}
            className="w-full py-3.5 rounded-xl border border-sphera-border text-white bg-sphera-surface hover:bg-sphera-surface-2 font-medium transition-colors flex justify-center items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Retourner la carte
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
  const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.ouvert;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function AdaptiveAnswer({ type, reponse, explication }: { type: string; reponse: string; explication?: string }) {
  return (
    <div className="space-y-3 mt-2">
      <div className={`flex ${type === 'code' ? 'flex-col overflow-hidden' : 'gap-3 p-4'} rounded-xl bg-sphera-surface-2 border border-sphera-border`}>
        {type === 'code' ? (
          <>
            <div className="bg-sphera-surface px-4 py-2 border-b border-sphera-border flex items-center gap-2">
              <Code2 className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">Code</span>
            </div>
            <pre className="p-4 text-sm text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap bg-[#111111]">
              {reponse}
            </pre>
          </>
        ) : type === 'preuve' ? (
          <>
            <Calculator className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Démonstration</p>
              <div className="text-sm text-white/90 leading-relaxed font-medium italic border-l-2 border-blue-500/30 pl-4 py-1">
                {formatText(reponse)}
              </div>
            </div>
          </>
        ) : (
          <>
            <Target className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Réponse</p>
              <div className="text-sm text-white/90 leading-relaxed font-medium">
                {formatText(reponse)}
              </div>
            </div>
          </>
        )}
      </div>
      {explication && (
        <div className="flex gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">Explication</p>
            <div className="text-sm text-white/80 leading-relaxed">
              {formatText(explication)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question, mode }: { question: any, mode?: 'complete' | 'rapide' }) {
  const [open, setOpen] = useState(false);

  if (mode === 'rapide') {
    return (
      <div className="sphera-card p-4 hover:border-[#ff9800]/30 transition-all duration-200 mb-3">
        <div className="flex gap-3">
          <span className="flex-shrink-0 min-w-[1.5rem] h-6 rounded-full bg-[#ff9800]/15 text-[#ff9800] text-xs font-bold flex items-center justify-center ring-1 ring-[#ff9800]/25 mt-0.5 px-1.5">
            {question.numero}
          </span>
          <div className="flex-1 space-y-2">
            <div className="text-sm font-medium text-white leading-relaxed">
              {formatText(question.enonce || question.question)}
            </div>
            <div className="text-sm text-white/80 leading-relaxed border-l-2 border-[#ff9800]/40 pl-3">
              {formatText(question.reponse)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sphera-card overflow-hidden hover:border-[#ff9800]/30 transition-all duration-200 mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-sphera-surface-2 transition-colors"
      >
        <span className="flex-shrink-0 min-w-[1.5rem] h-6 rounded-full bg-[#ff9800]/15 text-[#ff9800] text-xs font-bold flex items-center justify-center ring-1 ring-[#ff9800]/25 mt-0.5 px-1.5">
          {question.numero}
        </span>
        <div className="flex-1 text-sm font-medium text-white leading-relaxed">
          {formatText(question.enonce || question.question)}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 mt-0.5">
          {question.type && <TypeBadge type={question.type} />}
          {open ? <ChevronDown className="w-4 h-4 text-sphera-text-muted" /> : <ChevronRight className="w-4 h-4 text-sphera-text-muted" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 space-y-3 animate-in fade-in slide-in-from-top-1">
          <AdaptiveAnswer type={question.type || "ouvert"} reponse={question.reponse} explication={question.explication} />

          {(question.source_cours || question.chapitre) && (
            <div className="flex gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <BookMarked className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Référence cours</p>
                <p className="text-sm text-white/80">{question.source_cours || question.chapitre}</p>
              </div>
            </div>
          )}
          
          {question.a_retenir && (
            <div className="flex gap-3 p-4 rounded-xl bg-[#ff9800]/10 border border-[#ff9800]/20">
              <Lightbulb className="w-4 h-4 text-[#ff9800] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#ff9800] uppercase tracking-wider mb-1">À retenir</p>
                <div className="text-sm text-white/80">{formatText(question.a_retenir)}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AnnaleView({ annale, sourceName }: { annale: any; sourceName?: string }) {
  const rawAnnale = annale || {};
  const content = rawAnnale.content !== undefined ? rawAnnale.content : rawAnnale;
  const mode = rawAnnale.mode || 'complete';
  const isRawArray = Array.isArray(content);
  const hasSections = !isRawArray && Array.isArray(content?.sections) && content.sections.length > 0;
  const hasLegacy = !isRawArray && Array.isArray(content?.corrections) && content.corrections.length > 0;
  const conseils = content?.conseils_generaux || [];
  const { isDownloading, generateAnnale } = useDownloadPDF()

  const totalQuestions = isRawArray 
    ? content.length
    : hasSections
      ? content.sections!.reduce((acc: number, s: any) => acc + (s.questions?.length || 0), 0)
      : (content?.corrections?.length ?? 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Download button */}
      <div className="flex justify-end">
        <DownloadPDFButton
          onDownload={() => generateAnnale(annale, sourceName)}
          isDownloading={isDownloading}
          label="Télécharger la correction"
        />
      </div>

      {/* Sober Header like FicheView */}
      <div className="flex flex-col gap-4 p-4 rounded-2xl bg-sphera-bg">
        <div className="flex items-center justify-between pb-4 border-b border-sphera-border">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-orange-400 font-semibold flex items-center gap-2">
                <span>Correction d'annale</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sphera-surface border border-sphera-border text-sphera-text-muted font-normal">
                  {mode === 'complete' ? 'Mode complet' : 'Mode rapide'}
                </span>
              </p>
              <p className="text-xs text-sphera-text-muted mt-0.5">
                {totalQuestions} question{totalQuestions > 1 ? 's' : ''} corrigée{totalQuestions > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <span className="text-xs text-sphera-text-muted/60">sphera.campussphere.app</span>
        </div>

        <h2 className="text-xl font-bold text-white">{content?.titre || "Correction d'annale"}</h2>
      </div>

      {/* Sections Structurées */}
      {hasSections && (
        <div className="space-y-6">
          {content.sections.map((section: any, i: number) => (
            <div key={i}>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#ff9800]/20 text-[#ff9800] text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {section.nom}
              </h3>
              <div className="space-y-3 pl-11">
                {section.questions.map((q: any, j: number) => (
                  <QuestionCard key={j} question={{ ...q, numero: q.numero || j + 1 }} mode={mode} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legacy Format / Raw Array */}
      {(!hasSections && (hasLegacy || isRawArray)) && (
        <div className="space-y-3">
          {(isRawArray ? content : content.corrections).map((correction: any, i: number) => (
            <QuestionCard key={i} question={{ ...correction, numero: correction.numero || i + 1 }} mode={mode} />
          ))}
        </div>
      )}

      {/* Fallback si aucun contenu reconnu */}
      {!hasSections && !hasLegacy && !isRawArray && (
        <div className="p-8 text-center bg-sphera-surface-2 rounded-2xl border border-sphera-border opacity-60">
          <HelpCircle className="w-12 h-12 text-sphera-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">Aucune correction trouvée</h3>
          <p className="text-sm text-sphera-text-muted max-w-md mx-auto">
            L'IA n'a pas pu structurer la correction correctement, ou le format est non reconnu.
          </p>
        </div>
      )}

      {/* Conseils */}
      {conseils.length > 0 && (
        <div className="sphera-card p-6 border-[#ff9800]/30 bg-[#ff9800]/5 mt-8">
          <h3 className="text-[#ff9800] font-bold flex items-center gap-2 mb-4">
            <Award className="w-5 h-5" /> Conseils généraux
          </h3>
          <ul className="space-y-3">
            {conseils.map((c: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm text-white/90">
                <span className="text-[#ff9800] font-bold">→</span>
                {formatText(c)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function MindmapView({ content }: { content: any }) {
  const mapData = content?.mindmap || content || {};
  const centralNode = mapData?.noeud_central || mapData?.titre || "Concept Central";
  const branches: any[] = Array.isArray(mapData?.branches) ? mapData.branches : [];
  const [expandedBranches, setExpandedBranches] = useState<Record<number, boolean>>({});
  const [viewMode, setViewMode] = useState<'cards' | 'tree'>('tree');

  const toggleBranch = (idx: number) => {
    setExpandedBranches(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    branches.forEach((_, i) => { all[i] = true; });
    setExpandedBranches(all);
  };

  const collapseAll = () => {
    setExpandedBranches({});
  };

  const getColorStyles = (colorStr: string) => {
    const c = (colorStr || '').toLowerCase();
    if (c.includes('vert') || c === 'green') {
      return {
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        border: 'border-emerald-500/40',
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/5',
        dot: 'bg-emerald-400',
      };
    }
    if (c.includes('bleu') || c === 'blue') {
      return {
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        border: 'border-blue-500/40',
        text: 'text-blue-400',
        bg: 'bg-blue-500/5',
        dot: 'bg-blue-400',
      };
    }
    if (c.includes('orange')) {
      return {
        badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        border: 'border-orange-500/40',
        text: 'text-orange-400',
        bg: 'bg-orange-500/5',
        dot: 'bg-orange-400',
      };
    }
    if (c.includes('violet') || c === 'purple') {
      return {
        badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        border: 'border-purple-500/40',
        text: 'text-purple-400',
        bg: 'bg-purple-500/5',
        dot: 'bg-purple-400',
      };
    }
    if (c.includes('rose') || c === 'pink') {
      return {
        badge: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        border: 'border-pink-500/40',
        text: 'text-pink-400',
        bg: 'bg-pink-500/5',
        dot: 'bg-pink-400',
      };
    }
    return {
      badge: 'bg-sphera-green/20 text-sphera-green border-sphera-green/30',
      border: 'border-sphera-green/40',
      text: 'text-sphera-green',
      bg: 'bg-sphera-green/5',
      dot: 'bg-sphera-green',
    };
  };

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

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-sphera-bg border border-sphera-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sphera-border">
          <div>
            <div className="flex items-center gap-2">
              <GitFork className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Carte Mentale</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sphera-surface border border-sphera-border text-sphera-text-muted">
                {branches.length} thèmes
              </span>
            </div>
            {mapData?.titre && <h2 className="text-xl font-bold text-white mt-1">{mapData.titre}</h2>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-sphera-surface text-sphera-text-muted hover:text-white border border-sphera-border transition-colors"
            >
              Tout déplier
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-sphera-surface text-sphera-text-muted hover:text-white border border-sphera-border transition-colors"
            >
              Tout replier
            </button>
            <div className="h-4 w-px bg-sphera-border mx-1" />
            <button
              onClick={() => setViewMode(v => v === 'tree' ? 'cards' : 'tree')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sphera-surface-2 text-white border border-sphera-border hover:border-sphera-green/50 transition-colors"
            >
              {viewMode === 'tree' ? 'Vue Grille' : 'Vue Arbre'}
            </button>
          </div>
        </div>

        {/* Central Core Concept Banner */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-sphera-surface-2 to-teal-500/10 border border-emerald-500/30 text-center relative overflow-hidden">
          <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Noyau Conceptuel</span>
          <h3 className="text-lg md:text-xl font-extrabold text-white mt-0.5 tracking-tight">
            {centralNode}
          </h3>
        </div>
      </div>

      {/* Branches Display */}
      {branches.length === 0 ? (
        <div className="p-8 text-center bg-sphera-surface-2 rounded-2xl border border-sphera-border opacity-60">
          <GitFork className="w-12 h-12 text-sphera-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">Carte mentale en cours de structuration</h3>
          <p className="text-sm text-sphera-text-muted max-w-md mx-auto">
            Les branches de la carte mentale n'ont pas pu être extraites au format attendu.
          </p>
        </div>
      ) : viewMode === 'tree' ? (
        /* Tree / Hierarchical View */
        <div className="space-y-4">
          {branches.map((b: any, i: number) => {
            const styles = getColorStyles(b.couleur);
            const isExpanded = expandedBranches[i] ?? true;
            const subCount = Array.isArray(b.sous_branches) ? b.sous_branches.length : 0;

            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${styles.border} ${styles.bg}`}
              >
                <button
                  type="button"
                  onClick={() => toggleBranch(i)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${styles.dot}`} />
                    <span className="font-bold text-white text-base sm:text-lg truncate">
                      {b.label}
                    </span>
                    {b.couleur && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${styles.badge}`}>
                        {b.couleur}
                      </span>
                    )}
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
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((b: any, i: number) => {
            const styles = getColorStyles(b.couleur);
            return (
              <div key={i} className={`sphera-card p-5 border ${styles.border} ${styles.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${styles.badge}`}>
                    {b.couleur || 'Thème'}
                  </span>
                </div>
                <h4 className="font-bold text-white text-base mb-3 leading-snug">{b.label}</h4>
                {Array.isArray(b.sous_branches) && b.sous_branches.length > 0 ? (
                  renderSubBranches(b.sous_branches)
                ) : (
                  <p className="text-xs text-sphera-text-muted italic">Sous-branches intégrées</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AudioSummaryView({ content }: { content: any }) {
  const audioData = content?.audio || content || {};
  const dialogue: Array<{ speaker: string; text: string }> = Array.isArray(audioData?.dialogue) ? audioData.dialogue : [];
  const audioUrl: string | undefined = audioData?.audioUrl;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSpeakingWebSpeech, setIsSpeakingWebSpeech] = useState(false);

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleWebSpeech = () => {
    if (!window.speechSynthesis) return;
    if (isSpeakingWebSpeech) {
      window.speechSynthesis.cancel();
      setIsSpeakingWebSpeech(false);
      return;
    }

    const fullScript = dialogue.map(d => `${d.speaker === 'A' ? 'Étudiant 1 : ' : 'Étudiant 2 : '} ${d.text}`).join('\n\n');
    const utterance = new SpeechSynthesisUtterance(fullScript);
    utterance.lang = 'fr-FR';
    utterance.rate = playbackSpeed;
    utterance.onend = () => setIsSpeakingWebSpeech(false);
    utterance.onerror = () => setIsSpeakingWebSpeech(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeakingWebSpeech(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Audio Player Card */}
      <div className="p-6 rounded-2xl bg-sphera-surface-2 border border-sphera-border relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AudioLines className="w-5 h-5 text-teal-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Podcast & Résumé Audio</span>
          </div>
          {audioUrl && (
            <a
              href={audioUrl}
              download="podcast-revision.mp3"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
              title="Télécharger l'audio MP3"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>

        {audioData?.titre && (
          <h2 className="text-xl font-bold text-white mb-4">{audioData.titre}</h2>
        )}

        {/* Audio Element or Web Speech Fallback */}
        {audioUrl ? (
          <div className="space-y-3 bg-sphera-bg p-4 rounded-xl border border-sphera-border">
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
              onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
              onEnded={() => setIsPlaying(false)}
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleAudioPlay}
                className="w-10 h-10 rounded-full bg-sphera-green text-black flex items-center justify-center font-bold shadow-lg hover:brightness-110 transition-all shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full accent-sphera-green cursor-pointer h-1.5 bg-sphera-surface rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-sphera-text-muted font-mono mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSpeedChange}
                className="px-2 py-1 rounded bg-sphera-surface border border-sphera-border text-xs font-mono text-sphera-text-muted hover:text-white transition-colors"
              >
                {playbackSpeed}x
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl bg-sphera-bg border border-sphera-border">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-teal-400" />
              <div>
                <p className="text-sm font-semibold text-white">Lecture audio du dialogue</p>
                <p className="text-xs text-sphera-text-muted">Écouter la synthèse vocale des 2 étudiants</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleWebSpeech}
              className="sphera-primary-btn py-2 px-4 text-xs inline-flex items-center gap-2"
            >
              {isSpeakingWebSpeech ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isSpeakingWebSpeech ? 'Arrêter la lecture' : 'Lancer la voix'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Dialogue Script */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-white text-base">Script du dialogue ({dialogue.length} répliques)</h3>
          <span className="text-xs text-sphera-text-muted">~{Math.max(1, Math.round(dialogue.length * 0.4))} min de discussion</span>
        </div>

        {dialogue.length === 0 ? (
          <div className="p-8 text-center bg-sphera-surface-2 rounded-2xl border border-sphera-border opacity-60">
            <AudioLines className="w-12 h-12 text-sphera-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">Aucun dialogue audio</h3>
            <p className="text-sm text-sphera-text-muted max-w-md mx-auto">
              Le script de discussion n'a pas été généré pour ce cours.
            </p>
          </div>
        ) : (
          dialogue.map((turn, idx) => {
            const isSpeakerA = turn.speaker === 'A' || turn.speaker === '1';
            return (
              <div
                key={idx}
                className={`flex gap-3 sm:gap-4 p-4 rounded-2xl border transition-all ${
                  isSpeakerA
                    ? 'bg-sphera-surface border-sphera-green/30'
                    : 'bg-sphera-surface-2 border-purple-500/30 ml-4 sm:ml-8'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSpeakerA
                      ? 'bg-sphera-green/20 text-sphera-green border border-sphera-green/40'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                  }`}
                >
                  {isSpeakerA ? 'A' : 'B'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">
                      {isSpeakerA ? 'Étudiant A (Explicateur)' : 'Étudiant B (Curieux)'}
                    </span>
                    <span className="text-[10px] text-sphera-text-muted font-mono">#{idx + 1}</span>
                  </div>
                  <div className="text-sm text-white/90 leading-relaxed">
                    {formatText(turn.text)}
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

