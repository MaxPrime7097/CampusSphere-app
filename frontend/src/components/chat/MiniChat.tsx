import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  MessageCircle, 
  Users, 
  Minimize2, 
  Maximize2,
  Paperclip,
  Smile,
  MoreVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    username: string;
  };
  timestamp: string;
  type: "text" | "file" | "image";
  file?: {
    name: string;
    size: string;
    type: string;
  };
}

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
  className = "" 
}: MiniChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(12);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load messages (TODO: Load from API when endpoint available)
  useEffect(() => {
    // Placeholder messages - will be replaced with API call when endpoint available
    const placeholderMessages: Message[] = [
      {
        id: "1",
        content: "Salut tout le monde ! Qui est prêt pour la réunion de demain ?",
        author: {
          name: "Alex Dubois",
          avatar: "/placeholder-avatar.jpg",
          username: "alex_dubois"
        },
        timestamp: "14:30",
        type: "text"
      },
      {
        id: "2",
        content: "Moi ! J'ai préparé les slides pour la présentation",
        author: {
          name: "Sophie Martin",
          avatar: "/placeholder-avatar.jpg",
          username: "sophie_m"
        },
        timestamp: "14:32",
        type: "text"
      },
      {
        id: "3",
        content: "Parfait ! J'ai aussi le dataset qu'on va utiliser",
        author: {
          name: "Lucas Petit",
          avatar: "/placeholder-avatar.jpg",
          username: "lucas_p"
        },
        timestamp: "14:35",
        type: "file",
        file: {
          name: "dataset_analysis.csv",
          size: "2.5 MB",
          type: "CSV"
        }
      }
    ];
    setMessages(placeholderMessages);
  }, [sphereId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      author: {
        name: "Vous",
        avatar: "/placeholder-avatar.jpg",
        username: "vous"
      },
      timestamp: new Date().toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      type: "text"
    };

    setMessages([...messages, message]);
    setNewMessage("");
    
    // Simuler une réponse
    setTimeout(() => {
      const responses = [
        "Intéressant !",
        "Je suis d'accord",
        "Bonne idée !",
        "On peut en discuter",
        "Parfait !"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        author: {
          name: "Membre",
          avatar: "/placeholder-avatar.jpg",
          username: "membre"
        },
        timestamp: new Date().toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        type: "text"
      };
      
      setMessages(prev => [...prev, responseMessage]);
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 10MB",
        variant: "destructive"
      });
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      content: `Fichier partagé: ${file.name}`,
      author: {
        name: "Vous",
        avatar: "/placeholder-avatar.jpg",
        username: "vous"
      },
      timestamp: new Date().toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      type: "file",
      file: {
        name: file.name,
        size: formatFileSize(file.size),
        type: getFileType(file.name)
      }
    };

    setMessages([...messages, message]);
    toast({
      title: "Fichier partagé !",
      description: `${file.name} a été partagé dans le chat`,
      duration: 2000,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileType = (filename: string) => {
    const extension = filename.split('.').pop()?.toUpperCase();
    return extension || 'FILE';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
                <span>{onlineUsers} en ligne</span>
                <Badge variant="secondary" className="text-xs">
                  {sphereName}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Messages */}
        <ScrollArea className={`${isExpanded ? 'h-80' : 'h-48'} mb-4`}>
          <div className="space-y-3 pr-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.author.avatar} />
                  <AvatarFallback className="text-xs">
                    {message.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{message.author.name}</span>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm">{message.content}</p>
                    {message.file && (
                      <div className="mt-2 p-2 bg-background rounded border">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{message.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {message.file.type} • {message.file.size}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Tapez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="sm"
            className="campus-gradient text-white hover:opacity-90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* File input hidden */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="*/*"
          aria-label="Upload file"
        />
      </CardContent>
    </Card>
  );
}
