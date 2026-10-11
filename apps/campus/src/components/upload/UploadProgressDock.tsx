import { useUploadQueue } from "@/contexts/UploadQueueContext";
import { formatFileSize, cn } from "@/lib/utils";
import { RESOURCE_TYPE_DISPLAY } from "@/constants/resourceTypes";
import {
  UploadSimple,
  CaretDown,
  CaretUp,
  CheckCircle,
  WarningCircle,
  ArrowClockwise,
  X,
  FileText,
  BookOpen,
  GraduationCap,
  FolderSimple as FolderGit2,
  BookBookmark,
  Notepad,
  Question as QuestionMark,
  Spinner as Loader2,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

function getItemIcon(type: string, className = "h-4 w-4") {
  switch (type) {
    case "course_notes": return <BookOpen className={className} />;
    case "td_tp":        return <Notepad className={className} />;
    case "exams":        return <GraduationCap className={className} />;
    case "project":      return <FolderGit2 className={className} />;
    case "book":         return <BookBookmark className={className} />;
    default:             return <FileText className={className} />;
  }
}

export function UploadProgressDock() {
  const {
    items,
    isDockOpen,
    setIsDockOpen,
    toggleDock,
    cancelItem,
    retryItem,
    clearCompleted,
    isProcessing,
    activeCount,
    completedCount,
    errorCount,
    overallProgress,
  } = useUploadQueue();

  if (items.length === 0) return null;

  const totalCount = items.length;

  return (
    <aside
      aria-label="File d'attente des téléversements"
      className="fixed z-50 bottom-20 md:bottom-6 right-4 md:right-6 pointer-events-auto max-w-[calc(100vw-2rem)] select-none"
    >
      {/* ─── Mode Déplié (Panneau Détaillé) ─── */}
      {isDockOpen ? (
        <div className="w-[340px] sm:w-[380px] rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden campus-animate-fade-in flex flex-col max-h-[460px]">
          {/* Header */}
          <div className="p-3.5 bg-muted/40 border-b border-border/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs",
                isProcessing ? "bg-primary animate-pulse" : errorCount > 0 ? "bg-destructive" : "bg-emerald-500"
              )}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : errorCount > 0 ? (
                  <WarningCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" weight="fill" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-foreground truncate">
                  {isProcessing
                    ? `Téléversement (${completedCount}/${totalCount})`
                    : errorCount > 0
                    ? `${errorCount} erreur(s) de transfert`
                    : "Tous les fichiers sont publiés !"}
                </h4>
                <p className="text-[10px] text-muted-foreground truncate">
                  {isProcessing ? `${overallProgress}% global` : `${completedCount} fichier(s) terminé(s)`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {!isProcessing && completedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompleted}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Effacer
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDock}
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                title="Réduire"
              >
                <CaretDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Barre de progression globale en haut */}
          {isProcessing && (
            <Progress value={overallProgress} className="h-1 rounded-none bg-muted/50" />
          )}

          {/* Liste des fichiers */}
          <div className="p-2 space-y-1.5 overflow-y-auto flex-1 divide-y divide-border/20">
            {items.map((item) => {
              const formattedSize = formatFileSize(item.file.size);
              const typeLabel = RESOURCE_TYPE_DISPLAY[item.type] || "AUTRE";

              return (
                <div key={item.id} className="pt-1.5 first:pt-0">
                  <div className="p-2 rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-foreground/80 mt-0.5 border border-border/40">
                        {getItemIcon(item.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="text-xs font-medium text-foreground truncate" title={item.title}>
                            {item.title}
                          </p>
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 h-4 shrink-0 font-medium tracking-wide uppercase"
                          >
                            {typeLabel}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                          <span>{formattedSize}</span>
                          <span>·</span>
                          {item.status === "uploading" && (
                            <span className="text-primary font-medium">{item.progress}%</span>
                          )}
                          {item.status === "queued" && <span>En attente...</span>}
                          {item.status === "completed" && (
                            <span className="text-emerald-500 font-medium flex items-center gap-0.5">
                              <CheckCircle className="h-3 w-3" weight="fill" /> Publié
                            </span>
                          )}
                          {item.status === "error" && (
                            <span className="text-destructive font-medium flex items-center gap-0.5">
                              <WarningCircle className="h-3 w-3" /> Échec
                            </span>
                          )}
                        </div>

                        {/* Barre de progression individuelle */}
                        {item.status === "uploading" && (
                          <div className="mt-1.5">
                            <Progress value={item.progress} className="h-1 bg-muted" />
                          </div>
                        )}
                        {item.status === "error" && item.error && (
                          <p className="text-[10px] text-destructive mt-1 line-clamp-1">
                            {item.error}
                          </p>
                        )}
                      </div>

                      {/* Actions par item */}
                      <div className="flex items-center gap-0.5 shrink-0 self-center">
                        {item.status === "error" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => retryItem(item.id)}
                            className="h-6 w-6 text-primary hover:bg-primary/10 rounded-md"
                            title="Réessayer"
                          >
                            <ArrowClockwise className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => cancelItem(item.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-md"
                          title="Supprimer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ─── Mode Réduit (Pilule Flottante Compacte) ─── */
        <button
          type="button"
          onClick={toggleDock}
          className={cn(
            "group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full border shadow-lg backdrop-blur-xl transition-all cursor-pointer",
            isProcessing
              ? "bg-background/95 border-primary/40 hover:border-primary text-foreground shadow-primary/10"
              : errorCount > 0
              ? "bg-background/95 border-destructive/40 hover:border-destructive text-foreground"
              : "bg-background/95 border-emerald-500/40 hover:border-emerald-500 text-foreground"
          )}
        >
          <div className={cn(
            "h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold",
            isProcessing ? "bg-primary animate-pulse" : errorCount > 0 ? "bg-destructive" : "bg-emerald-500"
          )}>
            {isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : errorCount > 0 ? (
              <WarningCircle className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" weight="fill" />
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            {isProcessing ? (
              <>
                <span>Téléversement ({completedCount}/{totalCount})</span>
                <span className="text-[11px] font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.2 rounded-full">
                  {overallProgress}%
                </span>
              </>
            ) : errorCount > 0 ? (
              <span className="text-destructive font-medium">{errorCount} erreur(s)</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Terminé ({completedCount}/{totalCount})</span>
            )}
          </div>

          <CaretUp className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors ml-0.5" />
        </button>
      )}
    </aside>
  );
}
