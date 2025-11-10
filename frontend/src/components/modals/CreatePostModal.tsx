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
import { Plus, Image, MapPin, Users, X, Lock, Globe, Video, FileText, Smile, AtSign, Calendar, Clock, Hash, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PostData {
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
  onPostCreated?: (postData: PostData) => void;
}

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
    let isMounted = true;
    (async () => {
      try {
        // Load users when needed (can be optimized to load on @ mention)
        const users = await searchUsers("");
        if (isMounted && users) {
          const mapped = users.map((u: any) => ({
            id: String(u.id),
            name: u.name || u.first_name + ' ' + u.last_name,
            username: u.username,
            avatar: u.avatar || '/placeholder-avatar.jpg'
          }));
          setAvailableUsers(mapped);
        }
      } catch (e) {
        // Error loading users
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  

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

    setIsSubmitting(true);
    
    try {
      // Create post via API
      const postPayload: any = {
        content,
        visibility: visibility === 'public' ? 'public' : visibility,
        tags: tags.length > 0 ? tags : undefined,
      };
      
      const result = await createPost(postPayload);
      
      const postData: PostData = { 
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
        onPostCreated(postData);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Créer un nouveau post
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5">
          {/* Contenu principal */}
          <div>
            <Label htmlFor="content" className="text-base">Contenu du post</Label>
            <Textarea
              id="content"
              placeholder="Que voulez-vous partager avec la communauté ?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] mt-2 text-base"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                {content.length}/500 caractères
              </span>
            </div>
          </div>

          <Separator />

          {/* Catégorie et Visibilité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Général</SelectItem>
                  <SelectItem value="academic">Académique</SelectItem>
                  <SelectItem value="event">Événement</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="help">Demande d'aide</SelectItem>
                  <SelectItem value="announcement">Annonce</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="visibility">Visibilité</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="university">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Université uniquement
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Amis uniquement
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Localisation et Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Localisation (optionnel)</Label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Campus, ville..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="tag">Tags</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="tag"
                  placeholder="Ajouter un tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button onClick={addTag} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <Label>Tags ajoutés</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Médias et Options */}
          <div>
            <Label className="mb-3 block">Ajouter des médias</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Sélectionner des fichiers à télécharger"
            />
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="h-4 w-4" />
                Photos/Vidéos
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-4 w-4" />
                Document
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-4 w-4" />
                Emoji
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setShowMentions(!showMentions)}
              >
                <AtSign className="h-4 w-4" />
                Mentionner
              </Button>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <Card className="mt-2 p-3">
                <div className="grid grid-cols-8 gap-2">
                  {['😀', '😂', '🥰', '😎', '🤔', '👍', '🎉', '🔥', '💯', '✨', '🚀', '❤️', '👏', '🙌', '💪', '🎯'].map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      className="text-2xl p-2 h-auto"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            {/* Mentions */}
            {showMentions && (
              <Card className="mt-2 p-3">
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={() => insertMention(user.username)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name?.slice(0, 1).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      @{user.username}
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <Label>Fichiers joints ({uploadedFiles.length})</Label>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options supplémentaires */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Autoriser les commentaires</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Permettre aux autres d'interagir avec votre post
                </p>
              </div>
              <Switch 
                checked={allowComments} 
                onCheckedChange={setAllowComments}
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!content.trim() || content.length > 500}
              className="campus-gradient text-white hover:opacity-90"
            >
              Publier le post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}