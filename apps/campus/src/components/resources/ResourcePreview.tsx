import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface ResourcePreviewProps {
  title: string;
  isDownloading: boolean;
  isPreviewLoading: boolean;
  previewError: string | null;
  isPreviewable: boolean;
  previewSrc: string | null;
  isPdf: boolean;
  onDownload: () => void;
}

export function ResourcePreview({
  title,
  isDownloading,
  isPreviewLoading,
  previewError,
  isPreviewable,
  previewSrc,
  isPdf,
  onDownload,
}: ResourcePreviewProps) {
  return (
    <div className="py-4 border-b border-border/40 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-lg">Aperçu du document</h3>
            <p className="text-sm text-muted-foreground">
              Consultez directement le document ci-dessous ou téléchargez-le sur votre appareil.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              disabled={isDownloading}
              className="gap-2"
              aria-label="Télécharger la ressource"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden md:inline">Télécharger</span>
            </Button>
          </div>
        </div>

        {isPreviewLoading ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed h-[420px]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : previewError ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-destructive">
            {previewError}
          </div>
        ) : !isPreviewable ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Ce format n’est pas prévisualisable directement dans le navigateur. Utilisez le bouton Télécharger pour l'ouvrir.
          </div>
        ) : previewSrc ? (
          <div className="rounded-lg border overflow-hidden bg-background">
            {isPdf ? (
              <iframe
                title={`Aperçu de ${title}`}
                src={previewSrc}
                className="w-full h-[70vh] min-h-[420px]"
              />
            ) : (
              <img
                src={previewSrc}
                alt={`Aperçu de ${title}`}
                className="w-full max-h-[70vh] object-contain bg-muted/20"
              />
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Chargement de l’aperçu du document...
          </div>
        )}
    </div>
  );
}
