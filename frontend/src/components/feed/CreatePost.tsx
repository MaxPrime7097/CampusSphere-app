import { Suspense, lazy, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const { user: currentUser } = useAuth();

  const cardClasses = cn(
    "transition-all duration-300",
    isMobile 
      ? "rounded-none border-x-0 border-t-0 shadow-none bg-card" 
      : "campus-card hover:campus-glow"
  );

  const { toast } = useToast();
  const isVerified = currentUser?.isVerified ?? false;

  const content = (
    <>
      <Card className={cardClasses} onClick={() => {
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
      }}>
      <CardContent className="p-4">
        <div className="flex gap-3 items-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser?.avatar || "/placeholder-avatar.jpg"} />
            <AvatarFallback className="bg-input text-muted-foreground font-semibold">
              {currentUser?.name?.slice(0, 1).toUpperCase() || '...'}
            </AvatarFallback>
          </Avatar>
          
          <div 
            className="flex-1 px-4 py-3 bg-muted/50 rounded-full text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
          >
            Quoi de neuf sur le campus ?
          </div>
        </div>
      </CardContent>
      </Card>
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
