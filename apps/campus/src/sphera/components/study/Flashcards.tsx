import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowCounterClockwise as RotateCcw, CheckCircle as CheckCircle2, ArrowCounterClockwise as RefreshCcw } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Carte {
  recto: string;
  verso: string;
}

interface FlashcardsData {
  titre: string;
  cartes: Carte[];
}

interface FlashcardsProps {
  data: FlashcardsData;
}

export const Flashcards: React.FC<FlashcardsProps> = ({ data }) => {
  const cartes = data.cartes || [];
  const total = cartes.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [review, setReview] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);

  const currentCard = cartes[currentIndex];

  const handleFlip = () => setFlipped((f) => !f);

  const handleKnew = () => {
    setKnown((prev) => new Set(prev).add(currentIndex));
    advance();
  };

  const handleReview = () => {
    setReview((prev) => new Set(prev).add(currentIndex));
    advance();
  };

  const advance = () => {
    setFlipped(false);
    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setReview(new Set());
    setFinished(false);
  };

  const handleRestartReview = () => {
    // Recommencer uniquement les cartes "à revoir"
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setReview(new Set());
    setFinished(false);
  };

  // ---- ÉCRAN RÉSULTAT FINAL ----
  if (finished) {
    const knownCount = known.size;
    const reviewCount = total - knownCount;
    const reviewCards = cartes.filter((_, i) => !known.has(i));

    return (
      <div className="space-y-5">
        <div className="text-center py-3">
          <div className="text-4xl mb-2">{knownCount === total ? "🎉" : "📚"}</div>
          <p className="text-xl font-bold text-foreground">
            {knownCount} / {total} mémorisées
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            {reviewCount > 0 ? `${reviewCount} carte${reviewCount > 1 ? "s" : ""} à revoir` : "Toutes les cartes sont maîtrisées !"}
          </p>
          <Progress value={(knownCount / total) * 100} className="mt-3 h-2" />
        </div>

        {reviewCards.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-[#ff9800]" />
              Cartes à revoir
            </h3>
            {reviewCards.map((card, i) => (
              <div key={i} className="border border-red-500/20 bg-red-500/5 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                  {card.recto}
                </p>
                <p className="text-xs text-muted-foreground">{card.verso}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRestart} className="flex-1 gap-2">
            <RotateCcw className="h-4 w-4" /> Tout recommencer
          </Button>
          {reviewCards.length > 0 && (
            <Button onClick={handleRestartReview} className="flex-1 gap-2 campus-gradient text-white">
              <RefreshCcw className="h-4 w-4" /> Revoir {reviewCount} carte{reviewCount > 1 ? "s" : ""}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  // ---- CARTE EN COURS ----
  return (
    <div className="space-y-4">
      {/* Progression */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Carte <span className="text-foreground font-medium">{currentIndex + 1}</span> / {total}
        </span>
        <div className="flex gap-2">
          {known.size > 0 && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" /> {known.size} sues
            </Badge>
          )}
          {review.size > 0 && (
            <Badge variant="secondary" className="bg-[#ff9800]/10 text-[#ff9800] dark:text-[#ff9800]/80 border-[#ff9800]/20 text-xs">
              ↩ {review.size} à revoir
            </Badge>
          )}
        </div>
      </div>
      <Progress value={((currentIndex) / total) * 100} className="h-1.5" />

      {/* Carte flip 3D */}
      <div
        className="relative h-52 cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
      >
        <div
          className={cn(
            "relative w-full h-full transition-transform duration-500",
            "[transform-style:preserve-3d]",
            flipped ? "[transform:rotateY(180deg)]" : ""
          )}
        >
          {/* Recto */}
          <div
            className={cn(
              "absolute inset-0 rounded-2xl border-2 border-[#ff9800]/30 bg-gradient-to-br from-orange-500/5 to-orange-600/10",
              "flex flex-col items-center justify-center p-6 text-center",
              "[backface-visibility:hidden]"
            )}
          >
            <Badge variant="outline" className="mb-3 text-[10px] border-[#ff9800]/30 text-[#ff9800] dark:text-[#ff9800]/80">
              QUESTION / TERME
            </Badge>
            <p className="font-semibold text-foreground text-base leading-snug">
              {currentCard.recto}
            </p>
            <p className="text-[11px] text-muted-foreground mt-4">
              Cliquez pour retourner →
            </p>
          </div>

          {/* Verso */}
          <div
            className={cn(
              "absolute inset-0 rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-600/10",
              "flex flex-col items-center justify-center p-6 text-center",
              "[backface-visibility:hidden] [transform:rotateY(180deg)]"
            )}
          >
            <Badge variant="outline" className="mb-3 text-[10px] border-blue-500/30 text-blue-600 dark:text-blue-400">
              RÉPONSE / DÉFINITION
            </Badge>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {currentCard.verso}
            </p>
          </div>
        </div>
      </div>

      {/* Boutons d'action — visibles uniquement après retournement */}
      {flipped ? (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={(e) => { e.stopPropagation(); handleReview(); }}
            className="flex-1 gap-2 border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500"
          >
            ↩ À revoir
          </Button>
          <Button
            onClick={(e) => { e.stopPropagation(); handleKnew(); }}
            className="flex-1 gap-2 campus-gradient text-white"
          >
            <CheckCircle2 className="h-4 w-4" /> Je savais !
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={handleFlip}
          className="w-full gap-2"
        >
          <RotateCcw className="h-4 w-4" /> Retourner la carte
        </Button>
      )}
    </div>
  );
};
