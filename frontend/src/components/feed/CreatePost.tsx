import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreatePostModal } from "@/components/modals/CreatePostModal";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCurrentUser } from "@/services/api";

interface CreatePostProps {
  onPostCreated?: (postData: unknown) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const isMobile = useIsMobile();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getCurrentUser();
        if (isMounted) setCurrentUser(data);
      } catch (e) {
        // User not logged in
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const cardClasses = cn(
    "transition-all duration-300",
    isMobile 
      ? "rounded-none border-x-0 border-t-0 shadow-none bg-card" 
      : "campus-card hover:campus-glow"
  );

  return (
    <CreatePostModal onPostCreated={onPostCreated}>
      <Card className={cardClasses}>
        <CardContent className="p-4">
          <div className="flex gap-3 items-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser?.avatar || "/placeholder-avatar.jpg"} />
              <AvatarFallback className="bg-input text-muted-foreground font-semibold">
                {currentUser?.name?.slice(0, 1).toUpperCase() || 'U'}
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
    </CreatePostModal>
  );
}
