import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createPost, searchUsers } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Image, MapPin, Users, X, Lock, Globe, Video, FileText, Smile, AtSign, Calendar, Clock, Hash, Loader2, CheckCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { findInvalidMentions, getActiveMentionQuery, renderMentionText } from "@/lib/mentions";
import { cn } from "@/lib/utils";

interface PostDraftData {
  content: string;
  location: string;
  tags: string[];
  category: string;
  visibility: string;
  allowComments: boolean;
  files: File[];
  scheduledDate: string;
  scheduledTime: string;
  targetAudience: string;
  university: string;
  faculty: string;
  studyYear: string;
  subject: string;
  type: string;
  audience: string;
  timestamp: string;
}

interface CreatePostModalProps {
  children: React.ReactNode;
  onPostCreated?: (postData: unknown) => void;
}

const POST_VISIBILITY_API_MAP: Record<string, "public" | "sphere" | "friends"> = {
  public: "public",
  university: "sphere",
  private: "friends",
};

const mapPostVisibilityForApi = (uiVisibility: string): "public" | "sphere" | "friends" | null => {
  return POST_VISIBILITY_API_MAP[uiVisibility] ?? null;
};

const EMOJI_COMBOS = [
  { name: "Retard", emojis: "🏃‍♂️💨⏰", label: "Le retardataire" },
  { name: "Nuit", emojis: "🌙🔋😵‍💫", label: "Nuit blanche" },
  { name: "Coloc", emojis: "🏠🍕🎮", label: "La coloc" },
  { name: "Budget", emojis: "🍝💸📉", label: "Fin de mois" },
  { name: "Stage", emojis: "💼🤝✨", label: "Stage trouvé" },
  { name: "Révision", emojis: "📚☕🧠", label: "Révision" },
  { name: "Sport", emojis: "🏀💪🔥", label: "Séance sport" },
  { name: "Weekend", emojis: "🥳🍻🎉", label: "Weekend !" },
  { name: "Hermite", emojis: "📚🕯️😶‍🌫️", label: "L'Ermite BU" },
  { name: "Caféine", emojis: "☕🧟‍♂️🆘", label: "Besoin Café" },
];

const QUICK_PILLS = [
  { name: "Études", emojis: "📖✍️" },
  { name: "Alerte", emojis: "🚨👀" },
  { name: "Chill", emojis: "🎮🍕" },
  { name: "Fête", emojis: "🥳🍻" },
];

const QUICK_EMOJIS = ['😀', '😂', '🥰', '😎', '🤔', '👍', '🎉', '🔥', '💯', '✨', '🚀', '❤️', '👏', '🙌', '💪', '🎯'];

export function CreatePostModal({ children, onPostCreated }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [category, setCategory] = useState("general");
  const [visibility, setVisibility] = useState("public");
  const [allowComments, setAllowComments] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; username: string; avatar: string }[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [targetAudience, setTargetAudience] = useState("all");
  const [university, setUniversity] = useState("");
  const [faculty, setFaculty] = useState("");
  const [studyYear, setStudyYear] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [audience, setAudience] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Charger les utilisateurs disponibles pour les mentions
  useEffect(() => {
    if (!showMentions) return;
    let isMounted = true;

    const handle = window.setTimeout(async () => {
      try {
        const users = await searchUsers(mentionQuery);
        if (isMounted && users) {
          const mapped = users.map((u: any) => ({
            id: String(u.id),
            name: u.name || u.first_name + ' ' + u.last_name,
            username: u.username,
            avatar: u.avatar || '/placeholder-avatar.jpg'
          }));
          setAvailableUsers(mapped);
        }
      } catch {
        if (isMounted) {
          setAvailableUsers([]);
        }
      }
    }, 180);

    return () => {
      isMounted = false;
      window.clearTimeout(handle);
    };
  }, [mentionQuery, showMentions]);

  

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    } else if (tags.length >= 5) {
      toast({
        title: "Limite de tags atteinte",
        description: "Vous ne pouvez pas ajouter plus de 5 tags",
        variant: "destructive"
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const totalSize = [...uploadedFiles, ...newFiles].reduce((acc, file) => acc + file.size, 0);
      
      if (totalSize > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "Fichier trop volumineux",
          description: "La taille totale des fichiers ne peut pas dépasser 50MB",
          variant: "destructive"
        });
        return;
      }
      
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      toast({
        title: "Fichier ajouté",
        description: `${newFiles.length} fichier(s) ajouté(s)`
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    setContent(content + emoji);
    setShowEmojiPicker(false);
  };

  const insertMention = (username: string) => {
    setContent(content + `@${username} `);
    setShowMentions(false);
  };

  const saveDraft = () => {
    const draft = {
      content,
      location,
      tags,
      category,
      visibility,
      allowComments,
      files: uploadedFiles
    };
    localStorage.setItem('postDraft', JSON.stringify(draft));
    setIsDraft(true);
    toast({
      title: "Brouillon sauvegardé",
      description: "Votre post a été sauvegardé comme brouillon",
      duration: 2000,
    });
  };

  const loadDraft = () => {
    const draft = localStorage.getItem('postDraft');
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      setContent(parsedDraft.content || "");
      setLocation(parsedDraft.location || "");
      setTags(parsedDraft.tags || []);
      setCategory(parsedDraft.category || "general");
      setVisibility(parsedDraft.visibility || "public");
      setAllowComments(parsedDraft.allowComments !== false);
      setUploadedFiles(parsedDraft.files || []);
      setIsDraft(false);
      toast({
        title: "Brouillon chargé",
        description: "Votre brouillon a été restauré",
        duration: 2000,
      });
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Contenu requis",
        description: "Veuillez saisir du contenu pour votre post",
        variant: "destructive"
      });
      return;
    }

    const invalidMentions = findInvalidMentions(content);
    if (invalidMentions.length > 0) {
      toast({
        title: "Mentions invalides",
        description: `Format invalide: ${invalidMentions.map((mention) => `@${mention}`).join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    const apiVisibility = mapPostVisibilityForApi(visibility);
    if (!apiVisibility) {
      toast({
        title: "Visibilité invalide",
        description: "Impossible de publier ce post: option de visibilité non supportée.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create post via API
      const postPayload = new FormData();
      postPayload.append('content', content);
      postPayload.append('visibility', apiVisibility);

      if (tags.length > 0) {
        postPayload.append('tags', JSON.stringify(tags));
      }

      uploadedFiles.forEach((file) => {
        postPayload.append('files[]', file);
      });

      if (category) postPayload.append('category', category);
      if (subject) postPayload.append('subject', subject);
      if (type) postPayload.append('type', type);
      if (audience) postPayload.append('audience', audience);
      if (location) postPayload.append('location', location);
      postPayload.append('allow_comments', String(allowComments));
      
      const result = await createPost(postPayload);
      const createdPost = result?.data ?? result;
      
      const postData: PostDraftData = { 
        content, 
        location, 
        tags, 
        category, 
        visibility, 
        allowComments,
        files: uploadedFiles,
        scheduledDate: isScheduled ? scheduledDate : null,
        scheduledTime: isScheduled ? scheduledTime : null,
        targetAudience,
        university: targetAudience === "university" ? university : null,
        faculty: targetAudience === "faculty" ? faculty : null,
        studyYear: targetAudience === "year" ? studyYear : null,
        subject,
        type,
        audience,
        timestamp: new Date().toISOString()
      };
      
      // Appeler le callback si fourni
      if (onPostCreated) {
        onPostCreated(createdPost || postData);
      }
      
      toast({
        title: "Post publié !",
        description: "Votre post a été partagé avec succès.",
        duration: 3000,
      });
      
      // Fermer le modal
      setIsOpen(false);
      
      // Réinitialiser le formulaire
      resetForm();
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la publication",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
      setContent("");
      setLocation("");
      setTags([]);
      setCategory("general");
      setVisibility("public");
      setAllowComments(true);
      setUploadedFiles([]);
    setScheduledDate("");
    setScheduledTime("");
    setIsScheduled(false);
    setTargetAudience("all");
    setUniversity("");
    setFaculty("");
    setStudyYear("");
    setSubject("");
    setType("");
    setAudience("");
      setIsOpen(false);
    setIsDraft(false);
    
    // Effacer le brouillon
    localStorage.removeItem('postDraft');
  };

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-white"/>
              Nouveau Post
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6 space-y-4">
          {/* Contenu principal */}
          <div className="space-y-2">
            <Textarea
              id="content"
              placeholder="Quoi de neuf sur le campus ?"
              value={content}
              onChange={(e) => {
                const value = e.target.value;
                setContent(value);
                const activeQuery = getActiveMentionQuery(value, e.target.selectionStart ?? value.length);
                if (activeQuery !== null) {
                  setMentionQuery(activeQuery);
                  setShowMentions(true);
                } else {
                  setShowMentions(false);
                  setMentionQuery("");
                }
              }}
              className="min-h-[150px] border bg-background focus-visible:ring-1 p-4 resize-none placeholder:text-muted-foreground/50 shadow-sm mt-2 rounded-xl"
            />
            
            {/* Quick Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_PILLS.map((pill) => (
                <Button 
                  key={pill.name} 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setContent(prev => prev + pill.emojis)}
                  className="h-7 px-2.5 text-[10px] font-bold rounded-full bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all border-none"
                >
                  <Plus className="h-3 w-3 mr-1 opacity-50" />
                  {pill.name} <span className="ml-1 text-xs">{pill.emojis}</span>
                </Button>
              ))}
            </div>
            
            {showPreview && content && (
              <div className="p-4 rounded-xl border bg-accent/5 overflow-hidden campus-animate-fade-in">
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {renderMentionText(content)}
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <span className={cn("text-[10px] font-medium", content.length > 450 ? "text-red-500" : "text-muted-foreground/40")}>
                {content.length}/500
              </span>
            </div>
          </div>

          {/* Uploaded Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative group rounded-xl overflow-hidden border aspect-video bg-muted">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                      <FileText className="h-6 w-6 text-primary mb-1" />
                      <span className="text-[10px] truncate w-full px-1">{file.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between py-2 border-y border-border/50">
            <div className="flex items-center gap-1">
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="h-9 w-9 p-0 rounded-full hover:bg-primary/10 hover:text-primary">
                <Image className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="h-9 w-9 p-0 rounded-full hover:bg-yellow-100/50 hover:text-yellow-600">
                <Smile className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowMentions(!showMentions)} className="h-9 w-9 p-0 rounded-full hover:bg-blue-100/50 hover:text-blue-600">
                <AtSign className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} className={cn("h-9 w-9 p-0 rounded-full", showPreview ? "text-primary bg-primary/10" : "")}>
                <Eye className="h-5 w-5" />
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn("text-xs font-bold tracking-tight h-8 px-3 rounded-full", showAdvanced ? "bg-accent text-accent-foreground" : "text-muted-foreground")}
            >
              Options
            </Button>
          </div>

          {/* Advanced Options Section */}
          {showAdvanced && (
            <div className="space-y-4 p-4 rounded-xl border bg-muted/30 campus-animate-slide-up">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Catégorie</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-9 bg-background border shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Général</SelectItem>
                      <SelectItem value="academic">Académique</SelectItem>
                      <SelectItem value="event">Événement</SelectItem>
                      <SelectItem value="marketplace">Marketplace</SelectItem>
                      <SelectItem value="help">Demande d'aide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Visibilité</Label>
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger className="h-9 bg-background border shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="university">Université</SelectItem>
                      <SelectItem value="private">Amis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Localisation</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input 
                    placeholder="Campus, ville..." 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    className="h-9 pl-9 bg-background border shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ajouter un tag" 
                    value={newTag} 
                    onChange={(e) => setNewTag(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="h-9 bg-background border shadow-sm"
                  />
                  <Button onClick={addTag} size="sm" variant="secondary" className="h-9 px-3">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-background text-[10px] gap-1 px-2 h-6">
                        #{tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label>Commentaires</Label>
                <Switch checked={allowComments} onCheckedChange={setAllowComments} className="scale-75 origin-right" />
              </div>
            </div>
          )}

          {/* Emoji/Mentions Popups */}
          {showEmojiPicker && (
            <Card className="p-4 border-primary/10 shadow-xl campus-animate-slide-up w-full max-w-[320px]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Combos Campus</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {EMOJI_COMBOS.map((combo) => (
                      <Button 
                        key={combo.name} 
                        variant="outline" 
                        size="sm" 
                        className="h-auto py-2 px-3 flex flex-col items-center gap-1 hover:bg-primary/5 hover:border-primary/30 transition-all border-dashed"
                        onClick={() => insertEmoji(combo.emojis)}
                      >
                        <span className="text-lg">{combo.emojis}</span>
                        <span className="text-[9px] font-medium text-muted-foreground">{combo.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Emojis rapides</Label>
                  <div className="grid grid-cols-8 gap-1">
                    {QUICK_EMOJIS.map((emoji) => (
                      <Button key={emoji} variant="ghost" className="text-xl p-0 h-9 w-9 hover:bg-accent" onClick={() => insertEmoji(emoji)}>
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {showMentions && (
            <Card className="border-primary/10 shadow-xl max-h-48 overflow-y-auto campus-animate-slide-up">
              <div className="p-1">
                {availableUsers.map((user) => (
                  <Button key={user.id} variant="ghost" className="w-full justify-start gap-3 h-11 px-3" onClick={() => insertMention(user.username)}>
                    <Avatar className="h-7 w-7 border">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name?.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-sm font-semibold truncate w-full">{user.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate w-full">@{user.username}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </Card>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting} className="text-muted-foreground hover:text-foreground">
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!content.trim() || content.length > 500 || isSubmitting}
              className="campus-gradient text-white hover:opacity-90 px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publication...
                </>
              ) : (
                "Publier"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
