import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Minimize2, Maximize2, MessagesSquare } from "lucide-react";

interface MiniChatProps {
  sphereId: string;
  sphereName: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  className?: string;
}

export function MiniChat({
  sphereId,
  sphereName,
  isExpanded,
  onToggleExpanded,
  className = "",
}: MiniChatProps) {
  const navigate = useNavigate();

  return (
    <Card className={`campus-card transition-all duration-300 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Chat de la sphère</CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>Canal temps réel non disponible</span>
                <Badge variant="secondary" className="text-xs">
                  {sphereName || sphereId}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div
          className={`flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 text-center ${
            isExpanded ? "min-h-80" : "min-h-48"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-4">
            <MessagesSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium mb-2">Le chat de sphère n’est pas encore branché au backend.</p>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Les anciens messages et réponses automatiques ont été retirés pour éviter d&apos;afficher une conversation fictive.
          </p>
          <Button
            onClick={() => navigate("/messages")}
            className="campus-gradient text-white hover:opacity-90"
          >
            Ouvrir la messagerie
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
