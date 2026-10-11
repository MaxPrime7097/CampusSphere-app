import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { ArrowClockwise as RefreshCw, Upload } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";

const UploadResourceModal = lazy(() =>
  import("@/components/modals/UploadResourceModal").then((module) => ({
    default: module.UploadResourceModal,
  }))
);

interface ResourcesPageHeaderProps {
  isRefreshing: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  isVerified: boolean;
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  onResourceUploaded: () => void;
  onVerificationPrompt: () => void;
}

export function ResourcesPageHeader({
  isRefreshing,
  isFetching,
  onRefresh,
  isVerified,
  isUploadOpen,
  setIsUploadOpen,
  onResourceUploaded,
  onVerificationPrompt,
}: ResourcesPageHeaderProps) {
  const { t } = useTranslation("resources");

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 campus-animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("page.title")}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {t("page.subtitle")}
        </p>
      </div>

      <div className="flex w-full sm:w-auto gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing || isFetching}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", (isRefreshing || isFetching) && "animate-spin")} />
          <span className="hidden sm:inline">{t("page.refresh")}</span>
        </Button>

        {isVerified ? (
          <>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 flex-1 sm:flex-none font-semibold"
              onClick={() => setIsUploadOpen(true)}
            >
              <Upload className="h-4 w-4" />
              <span>{t("page.upload")}</span>
            </Button>
            {isUploadOpen && (
              <Suspense fallback={<ModalLoadingFallback />}>
                <UploadResourceModal
                  open={isUploadOpen}
                  onOpenChange={setIsUploadOpen}
                  onResourceUploaded={onResourceUploaded}
                />
              </Suspense>
            )}
          </>
        ) : (
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 flex-1 sm:flex-none font-semibold"
            onClick={onVerificationPrompt}
          >
            <Upload className="h-4 w-4" />
            <span>{t("page.upload")}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
