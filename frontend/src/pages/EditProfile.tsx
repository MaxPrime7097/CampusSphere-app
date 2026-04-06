import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, updateUserProfile, uploadAvatar } from "@/services/api";
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";
import { StudyLevelCombobox } from "@/components/forms/StudyLevelCombobox";
import { SkillsCombobox } from "@/components/forms/SkillsCombobox";
import { InterestsCombobox } from "@/components/forms/InterestsCombobox";

type ProfileFormData = {
  first_name: string;
  last_name: string;
  username: string;
  bio: string;
  town: string;
  university: string;
  faculty: string;
  study_year: string;
};

const EMPTY_FORM: ProfileFormData = {
  first_name: "",
  last_name: "",
  username: "",
  bio: "",
  town: "",
  university: "",
  faculty: "",
  study_year: "",
};

export function EditProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(EMPTY_FORM);

  const [currentUserId, setCurrentUserId] = useState<number | string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrateFromCurrentUser = async () => {
      setIsLoadingUser(true);
      try {
        const user = await getCurrentUser();
        if (!isMounted || !user) return;

        setCurrentUserId(user.id ?? null);
        setCurrentAvatar(user.avatar ?? null);
        setFormData({
          first_name: user.firstName || "",
          last_name: user.lastName || "",
          username: user.username || "",
          bio: user.bio || "",
          town: user.town || "",
          university: user.university || "",
          faculty: user.faculty || "",
          study_year: user.studyYear || "",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error?.message || "Impossible de charger votre profil",
          duration: 3000,
        });
      } finally {
        if (isMounted) setIsLoadingUser(false);
      }
    };

    hydrateFromCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.first_name.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Le prénom est obligatoire", duration: 3000 });
      return false;
    }

    if (!formData.last_name.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Le nom est obligatoire", duration: 3000 });
      return false;
    }

    if (!formData.username.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Le nom d'utilisateur est obligatoire", duration: 3000 });
      return false;
    }

    if (formData.username.trim().length < 3) {
      toast({ variant: "destructive", title: "Erreur", description: "Le nom d'utilisateur doit contenir au moins 3 caractères", duration: 3000 });
      return false;
    }

    if (formData.bio.length > 500) {
      toast({ variant: "destructive", title: "Erreur", description: "La bio ne doit pas dépasser 500 caractères", duration: 3000 });
      return false;
    }

    return true;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fichier trop grand",
        description: "L'avatar ne doit pas dépasser 2MB",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setAvatarPreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveSelectedAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await updateUserProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        university: formData.university.trim(),
        faculty: formData.faculty.trim(),
        study_year: formData.study_year.trim(),
        town: formData.town.trim(),
      });

      if (avatarFile && currentUserId) {
        await uploadAvatar(currentUserId, avatarFile);
      }

      toast({
        title: "Profil mis à jour",
        description: "Vos modifications ont été enregistrées avec succès.",
        duration: 2000,
      });
      navigate("/profile");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Impossible de mettre à jour votre profil",
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const avatarSrc = avatarPreview || currentAvatar || "/placeholder-avatar.jpg";
  const initials = `${formData.first_name?.[0] || ""}${formData.last_name?.[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold campus-gradient bg-clip-text text-transparent">Modifier le profil</h1>
          <Button variant="outline" onClick={() => navigate("/profile")} disabled={isSaving}>
            Annuler
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Photo de profil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className="campus-gradient text-white text-2xl">{initials}</AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} disabled={isSaving}>
                    <Camera className="h-4 w-4 mr-2" />
                    {avatarPreview ? "Changer la photo" : "Choisir une photo"}
                  </Button>
                  {avatarPreview && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveSelectedAvatar} disabled={isSaving}>
                      <X className="h-4 w-4 mr-2" />
                      Retirer la sélection
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">Formats acceptés : JPG, PNG, GIF (max 2MB)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input id="first_name" value={formData.first_name} onChange={(e) => handleChange("first_name", e.target.value)} disabled={isLoadingUser || isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input id="last_name" value={formData.last_name} onChange={(e) => handleChange("last_name", e.target.value)} disabled={isLoadingUser || isSaving} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input id="username" value={formData.username} onChange={(e) => handleChange("username", e.target.value)} disabled={isLoadingUser || isSaving} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  className="min-h-[100px]"
                  maxLength={500}
                  disabled={isLoadingUser || isSaving}
                />
                <p className="text-xs text-muted-foreground text-right">{formData.bio.length}/500</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="town">Ville</Label>
                <Input id="town" value={formData.town} onChange={(e) => handleChange("town", e.target.value)} disabled={isLoadingUser || isSaving} />
              </div>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Informations académiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="university">Université</Label>
                <Input id="university" value={formData.university} onChange={(e) => handleChange("university", e.target.value)} disabled={isLoadingUser || isSaving} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="faculty">Faculté / Domaine d'études</Label>
                  <Input id="faculty" value={formData.faculty} onChange={(e) => handleChange("faculty", e.target.value)} disabled={isLoadingUser || isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="study_year">Année d'études</Label>
                  <Input id="study_year" value={formData.study_year} onChange={(e) => handleChange("study_year", e.target.value)} disabled={isLoadingUser || isSaving} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/profile")} disabled={isSaving}>
              Annuler
            </Button>
            <Button type="submit" className="campus-gradient text-white hover:opacity-90" disabled={isLoadingUser || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
