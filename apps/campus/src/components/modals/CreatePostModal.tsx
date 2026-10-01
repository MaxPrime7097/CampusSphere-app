import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createPost, searchUsers, uploadFile } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Image, Users, X, Lock, Globe, Video, FileText, AtSign, Calendar, Hash, Loader2, CheckCircle, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { findInvalidMentions, getActiveMentionQuery, renderMentionText } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import { compressImageFiles } from "@/lib/imageCompression";
import { useQuery } from "@tanstack/react-query";

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
  children?: React.ReactNode;
  onPostCreated?: (postData: unknown) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const POST_VISIBILITY_API_MAP: Record<string, "public" | "sphere" | "friends"> = {
  public: "public",
  university: "sphere",
  private: "friends",
};

const mapPostVisibilityForApi = (uiVisibility: string): "public" | "sphere" | "friends" | null => {
  return POST_VISIBILITY_API_MAP[uiVisibility] ?? null;
};

export function CreatePostModal({ children, onPostCreated, open: controlledOpen, onOpenChange: setControlledOpen }: CreatePostModalProps) {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [allowComments, setAllowComments] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
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
  const [internalOpen, setInternalOpen] = useState(false);
  const normalizedMentionQuery = useMemo(() => mentionQuery.trim().toLowerCase(), [mentionQuery]);
  const mentionUsersQuery = useQuery({
    queryKey: ["user-search", "create-post", normalizedMentionQuery],
    queryFn: () => searchUsers(mentionQuery),
    enabled: showMentions && normalizedMentionQuery.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Charger les utilisateurs disponibles pour les mentions
  useEffect(() => {
    if (!showMentions || !normalizedMentionQuery) {
      setAvailableUsers([]);
      return;
    }

    if (mentionUsersQuery.data) {
      const mapped = mentionUsersQuery.data.map((u: any) => ({
        id: String(u.id),
        name: u.name || u.first_name + ' ' + u.last_name,
        username: u.username,
        avatar: u.avatar || '/placeholder-avatar.jpg'
      }));
      setAvailableUsers(mapped);
      return;
    }

    if (mentionUsersQuery.error) {
      setAvailableUsers([]);
    }
  }, [mentionUsersQuery.data, mentionUsersQuery.error, normalizedMentionQuery, showMentions]);

  

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Compress images before checking total size, so large images don't get falsely blocked if compression makes them fit
      const compressedNewFiles = await compressImageFiles(files);
      
      const totalSize = [...uploadedFiles, ...compressedNewFiles].reduce((acc, file) => acc + file.size, 0);
      
      if (totalSize > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "Fichier trop volumineux",
          description: "La taille totale des fichiers ne peut pas dépasser 50MB",
          variant: "destructive"
        });
        return;
      }
      
      setUploadedFiles([...uploadedFiles, ...compressedNewFiles]);
      toast({
        title: "Fichier ajouté",
        description: `${compressedNewFiles.length} fichier(s) ajouté(s)`
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const insertMention = (username: string) => {
    setContent(content + `@${username} `);
    setShowMentions(false);
  };

  const saveDraft = () => {
    const draft = {
      content,
      tags,
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
      setTags(parsedDraft.tags || []);
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
      // Upload files first if any
      const uploadedDescriptors = [];
      if (uploadedFiles.length > 0) {
        const uploads = await Promise.all(uploadedFiles.map(f => uploadFile(f, "post")));
        for (const u of uploads) {
          if (u.data) {
            uploadedDescriptors.push(u.data);
          } else {
            uploadedDescriptors.push(u);
          }
        }
      }

      // Create post via API
      const postPayload: Record<string, any> = {
        content,
        visibility: apiVisibility,
        allow_comments: allowComments
      };

      if (tags.length > 0) {
        postPayload.tags = tags;
      }

      if (uploadedDescriptors.length > 0) {
        postPayload.files = uploadedDescriptors;
      }

      postPayload.category = "general";
      
      const result = await createPost(postPayload as any);
      const createdPost = result?.data ?? result;
      
      const postData: PostDraftData = { 
        content, 
        location: "", 
        tags, 
        category: "general", 
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
      setOpen(false);
      
      // Réinitialiser le formulaire
      resetForm();

      const createdPostId = (createdPost as any)?.id;
      if (createdPostId) {
        navigate(`/posts/${createdPostId}`);
      }
      
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
    setTags([]);
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
    setOpen(false);
    setIsDraft(false);
    setShowAdvanced(false);
    
    // Effacer le brouillon
    localStorage.removeItem('postDraft');
  };

  const [showAdvanced, setShowAdvanced] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none">
        <DialogHeader className="px-6 pt-2 pb-2 sm:p-6 sm:pb-2">
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
            
            <div className="flex justify-end pt-1">
              <span className={cn("text-[10px] font-medium", content.length > 450 ? "text-red-500" : "text-muted-foreground/40")}>
                {content.length}/500
              </span>
            </div>
          </div>

          {/* Uploaded Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1">
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
          <div className="flex items-center justify-between py-2 border-y border-border/40">
            <div className="flex items-center gap-1">
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 w-9 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                title="Ajouter une photo ou vidéo"
              >
                <Image className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowMentions(!showMentions)}
                className={cn(
                  "h-9 w-9 p-0 rounded-full transition-colors",
                  showMentions ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
                )}
                title="Mentionner un étudiant"
              >
                <AtSign className="h-5 w-5" />
              </Button>
            </div>
            
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                "text-xs font-semibold tracking-tight h-8 px-3 rounded-full gap-1.5 transition-all",
                showAdvanced ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Options</span>
            </Button>
          </div>

          {/* Options Section (simplifiée) */}
          {showAdvanced && (
            <div className="space-y-3.5 p-3.5 rounded-xl border border-border/50 bg-muted/20 campus-animate-slide-up">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Visibilité du post</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="h-9 bg-background border shadow-sm text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (Tout le campus)</SelectItem>
                    <SelectItem value="university">Université uniquement</SelectItem>
                    <SelectItem value="private">Amis uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tags</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ajouter un tag (#cours, #stage...)" 
                    value={newTag} 
                    onChange={(e) => setNewTag(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="h-9 bg-background border shadow-sm text-xs"
                  />
                  <Button onClick={addTag} size="sm" variant="secondary" className="h-9 px-3 shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-background text-[10px] gap-1 px-2 h-6">
                        #{tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <Label className="text-xs font-medium">Autoriser les commentaires</Label>
                  <p className="text-[11px] text-muted-foreground">Permettre aux autres de répondre</p>
                </div>
                <Switch checked={allowComments} onCheckedChange={setAllowComments} className="scale-75 origin-right" />
              </div>
            </div>
          )}

          {showMentions && (
            <div className="border border-border/40 bg-popover text-popover-foreground rounded-xl shadow-md max-h-48 overflow-y-auto campus-animate-slide-up">
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
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting} className="text-muted-foreground hover:text-foreground">
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!content.trim() || content.length > 500 || isSubmitting}
              className="bg-secondary text-secondary-foreground hover:bg-muted border border-border/60 px-8"
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

