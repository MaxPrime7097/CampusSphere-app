import { Suspense, lazy, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { openVerificationModal } from "@/lib/events";
import { Button } from "@/components/ui/button";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useAuth } from "@/contexts/AuthContext";

const CreatePostModal = lazy(() => import("@/components/modals/CreatePostModal").then((module) => ({ default: module.CreatePostModal })));

interface CreatePostProps {
  onPostCreated?: (postData: unknown) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const { user: currentUser } = useAuth();

  const { toast } = useToast();
  const isVerified = currentUser?.isVerified ?? false;

  const content = (
    <>
      <div
        className="p-3.5 sm:p-4 rounded-2xl border border-border/40 bg-card/50 hover:bg-muted/30 transition-all cursor-pointer shadow-xs mb-3"
        onClick={() => {
          if (isVerified) {
            setIsCreatePostOpen(true);
            return;
          }
          toast({
            title: "Compte non certifié",
            description: "Certifiez votre compte pour publier sur le campus.",
            variant: "destructive",
            action: (
              <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>Vérifier</Button>
            )
          });
        }}
      >
        <div className="flex gap-3.5 items-center">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={currentUser?.avatar || "/placeholder-avatar.jpg"} />
            <AvatarFallback className="bg-input text-muted-foreground font-semibold">
              {currentUser?.name?.slice(0, 1).toUpperCase() || '...'}
            </AvatarFallback>
          </Avatar>
          
          <div 
            className="flex-1 px-4 py-2.5 bg-muted/40 hover:bg-muted/70 rounded-full text-muted-foreground text-sm transition-colors border border-border/40 flex items-center justify-between"
          >
            <span>Quoi de neuf sur le campus ?</span>
            <span className="hidden sm:inline-block text-xs font-semibold text-primary">Publier</span>
          </div>
        </div>
      </div>
      {isVerified && isCreatePostOpen && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <CreatePostModal
            open={isCreatePostOpen}
            onOpenChange={setIsCreatePostOpen}
            onPostCreated={onPostCreated}
          />
        </Suspense>
      )}
    </>
  );

  return content;
}
