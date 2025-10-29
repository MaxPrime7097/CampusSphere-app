import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mockDB } from "@/services/mockDatabaseService";
import { mockDatabase } from "@/data/mockDatabase";
import { useTranslation } from "react-i18next";
import { Search, Send, Phone, Video, MoreVertical, MessageSquare, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { CreateGroupConversationModal } from "@/components/modals/CreateGroupConversationModal";

export function Messages() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [newConversationName, setNewConversationName] = useState("");
  const [newConversationType, setNewConversationType] = useState("direct");
  const { toast } = useToast();

  // Charger l'utilisateur actuel
  useEffect(() => {
    mockDB.loadCurrentUser();
  }, []);

  const currentUser = mockDB.getCurrentUser();
  
  // Obtenir les conversations de l'utilisateur depuis le mock database
  const userConversations = mockDB.getConversationsByUser(currentUser?.id || "");

  const messageSchema = z.object({
    content: z.string()
      .trim()
      .min(1, { message: t('messages.validation.tooShort') })
      .max(1000, { message: t('messages.validation.tooLong') })
  });

  const conversations = userConversations;

  // Initialiser les données
  useEffect(() => {
    setMessages([]); // Les messages seront chargés dynamiquement selon la conversation
  }, [conversationId]);

  const filteredConversations = conversations.filter(conv => 
    (conv.participants.length > 0 && mockDB.getUser(conv.participants[0])?.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    false // Pas de lastMessage dans l'interface Conversation
  );

  const handleSendMessage = async () => {
    const validation = messageSchema.safeParse({ content: newMessage });
    
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: t('messages.validation.invalid', { defaultValue: "Message invalide" }),
        description: validation.error.errors[0].message,
      });
      return;
    }

    setIsSending(true);
    
    // Simuler l'envoi du message
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newMsg = {
      id: `${messages.length + 1}`,
      sender: "You",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCurrentUser: true,
      avatar: "/placeholder-avatar.jpg"
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage("");
    setIsSending(false);
    
    toast({
      title: "Message envoyé !",
      description: "Votre message a été envoyé avec succès",
      duration: 2000,
    });
  };

  const handleCreateConversation = () => {
    if (!newConversationName.trim()) {
      toast({
        variant: "destructive",
        title: "Nom requis",
        description: "Veuillez saisir un nom pour la conversation",
      });
      return;
    }

    const newConv = {
      id: `${conversations.length + 1}`,
      name: newConversationName,
      type: newConversationType,
      avatar: newConversationType === "group" ? "/placeholder-group.jpg" : "/placeholder-avatar.jpg",
      lastMessage: "Conversation créée",
      timestamp: "Maintenant",
      unread: 0,
      isOnline: false
    };

    // Conversation ajoutée au mock database
    setNewConversationName("");
    setNewConversationType("direct");
    setShowNewConversationModal(false);
    
    toast({
      title: "Conversation créée !",
      description: `"${newConversationName}" a été créée avec succès`,
      duration: 3000,
    });
  };

  const handleMarkAsRead = (conversationId: string) => {
    // Marquer comme lu dans le mock database
  };

  const selectedConv = conversations.find(c => c.id === conversationId);

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)] bg-gradient-to-br from-background to-accent/20">
      <div className="flex h-full max-w-[100vw]">
        {/* Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r bg-card/50 flex-shrink-0 ${conversationId ? 'hidden md:flex' : 'flex'} flex-col`}>
          <div className="p-3 md:p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-3xl font-bold text-muted-foreground">
                Messages
              </h2>
              <CreateGroupConversationModal
                onGroupCreated={(groupData) => {
                  const newConversation = {
                    id: groupData.id,
                    name: groupData.name,
                    type: "group" as const,
                    avatar: groupData.avatar,
                    lastMessage: "Groupe créé",
                    timestamp: "Maintenant",
                    unread: 0,
                    isOnline: false
                  };
                  // Conversation de groupe ajoutée au mock database
                  toast({
                    title: "Conversation créée !",
                    description: `Le groupe "${groupData.name}" a été créé`,
                    duration: 2000,
                  });
                }}
              >
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <Users className="h-4 w-4" />
                </Button>
              </CreateGroupConversationModal>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('messages.searchPlaceholder')}
                className="pl-10 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                {searchQuery ? "Aucune conversation trouvée" : t('messages.noConversations')}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 md:p-4 border-b cursor-pointer transition-colors hover:bg-accent/50 ${
                    conversationId === conversation.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => {
                    navigate(`/messages/${conversation.id}`);
                    handleMarkAsRead(conversation.id);
                  }}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10 md:h-12 md:w-12">
                        <AvatarImage src="/placeholder-avatar.jpg" />
                        <AvatarFallback className="bg-input text-muted-foreground font-semibold text-xs md:text-sm">
                          {conversation.type === 'group' ? 'G' : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 border-2 border-background rounded-full"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate text-sm md:text-base">
                          {conversation.type === 'group' ? 'Groupe' : mockDB.getUser(conversation.participants[0])?.name || 'Utilisateur'}
                        </h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          Maintenant
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {conversation.type === 'group' ? 'Conversation de groupe' : 'Message privé'}
                      </p>
                    </div>
                    
                    <Badge variant="destructive" className="text-xs flex-shrink-0 ml-2">
                      0
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {conversationId ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b bg-card/50 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden h-8 w-8 p-0 flex-shrink-0"
                    onClick={() => navigate('/messages')}
                  >
                    ←
                  </Button>
                  
                  <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"  
                      onClick={() => navigate(`/profile/${selectedConv?.participants[0] || 'unknown'}`)}>
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="bg-input text-muted-foreground font-semibold text-xs md:text-sm">
                      {selectedConv?.type === 'group' ? 'G' : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm md:text-base truncate">
                      {selectedConv?.type === 'group' ? 'Groupe' : mockDB.getUser(selectedConv?.participants[0] || '')?.name || 'Utilisateur'}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedConv?.type === 'group' ? '4 members' : 'Online'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 md:h-9 md:w-9" 
                    aria-label="Voice call"
                    onClick={() => toast({ title: "Appel vocal", description: "Fonctionnalité à venir", duration: 2000 })}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 md:h-9 md:w-9" 
                    aria-label="Video call"
                    onClick={() => toast({ title: "Appel vidéo", description: "Fonctionnalité à venir", duration: 2000 })}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 md:h-9 md:w-9" 
                    aria-label="More options"
                    onClick={() => toast({ title: "Options", description: "Fonctionnalité à venir" })}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.isCurrentUser ? 'flex-row-reverse' : ''}`}
                 >
                   {!message.isCurrentUser && (
                     <Avatar 
                       className="h-8 w-8 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                       onClick={() => navigate(`/profile/${message.sender}`)}
                     >
                       <AvatarImage src={message.avatar} />
                       <AvatarFallback className="bg-input text-muted-foreground font-semibold text-xs md:text-sm">
                         {message.sender?.slice(0, 1).toUpperCase() || 'U'}
                       </AvatarFallback>
                     </Avatar>
                   )}
                  
                   <div className={`max-w-[70%] sm:max-w-xs lg:max-w-md ${message.isCurrentUser ? 'text-right' : ''}`}>
                     {!message.isCurrentUser && (
                       <p 
                         className="text-xs text-muted-foreground mb-1 cursor-pointer hover:underline"
                         onClick={() => navigate(`/profile/${message.sender}`)}
                       >
                         {message.sender}
                       </p>
                     )}
                    
                    <Card className={`${
                      message.isCurrentUser 
                        ? 'campus-gradient text-white' 
                        : 'bg-card border'
                    }`}>
                      <CardContent className="p-3">
                        <p className="text-sm">{message.content}</p>
                      </CardContent>
                    </Card>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="fixed bottom-0 left-0 right-0 p-3 md:p-4 border-t bg-card/50 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  placeholder={t('messages.typeMessage')}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  className="flex-1 text-sm md:text-base"
                  maxLength={1000}
                />
                <Button 
                  onClick={handleSendMessage}
                  className="campus-gradient text-white hover:opacity-90 h-9 w-9 md:h-10 md:w-10 p-0 flex-shrink-0"
                  disabled={!newMessage.trim() || isSending}
                  aria-label="Send message"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-center p-4">
            <div>
              <div className="w-16 h-16 campus-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('messages.selectTitle', { defaultValue: "Sélectionner une conversation" })}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t('messages.selectConversation')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
