import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatEmptyStateProps {
  onNewMessage: () => void;
}

export function ChatEmptyState({ onNewMessage }: ChatEmptyStateProps) {
  return (
    <div className="hidden md:flex flex-1 items-center justify-center text-center p-8">
      <div className="space-y-4">
        <div className="w-20 h-20 campus-gradient rounded-full flex items-center justify-center mx-auto shadow-lg">
          <MessageSquare className="h-10 w-10 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold mb-1">Vos messages</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Sélectionnez une conversation ou démarrez-en une nouvelle.
          </p>
        </div>
        <Button
          className="campus-gradient text-white hover:opacity-90"
          onClick={onNewMessage}
        >
          <Plus className="h-4 w-4 mr-2" /> Nouveau message
        </Button>
      </div>
    </div>
  );
}
