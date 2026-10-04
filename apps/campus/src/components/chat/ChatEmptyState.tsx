import { ChatCircle as MessageSquare, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ChatEmptyStateProps {
  onNewMessage: () => void;
}

export function ChatEmptyState({ onNewMessage }: ChatEmptyStateProps) {
  return (
    <div className="hidden md:flex flex-1 items-center justify-center text-center p-8">
      <div className="space-y-4">
        <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">Vos messages</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Sélectionnez une conversation ou démarrez-en une nouvelle.
          </p>
        </div>
        <Button
          className="bg-secondary hover:bg-muted text-secondary-foreground border border-border/60 text-sm"
          onClick={onNewMessage}
        >
          <Plus className="h-4 w-4 mr-2" /> Nouveau message
        </Button>
      </div>
    </div>
  );
}
