import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useAuth } from "@/contexts/AuthContext";

const CreateHubModal = lazy(() =>
  import("@/components/modals/CreateHubModal").then((module) => ({ default: module.CreateHubModal }))
);

interface CreatePostProps {
  onPostCreated?: (postData: unknown) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { t } = useTranslation("feed");
  const [isHubOpen, setIsHubOpen] = useState(false);
  const { user: currentUser } = useAuth();

  return (
    <>
      <div
        className="p-3.5 sm:p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-muted/30 transition-all cursor-pointer shadow-xs mb-3"
        onClick={() => setIsHubOpen(true)}
      >
        <div className="flex gap-3.5 items-center">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={currentUser?.avatar || "/placeholder-avatar.jpg"} />
            <AvatarFallback className="bg-input text-muted-foreground font-semibold">
              {currentUser?.name?.slice(0, 1).toUpperCase() || "..."}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 px-4 py-2.5 bg-muted/40 hover:bg-muted/70 rounded-full text-muted-foreground text-sm transition-colors border border-border/40 flex items-center justify-between">
            <span>{t("sharePrompt")}</span>
            <span className="hidden sm:inline-block text-xs font-semibold text-primary">{t("create")}</span>
          </div>
        </div>
      </div>

      {isHubOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <CreateHubModal
            open={isHubOpen}
            onOpenChange={setIsHubOpen}
            onPostCreated={onPostCreated}
          />
        </Suspense>
      )}
    </>
  );
}
