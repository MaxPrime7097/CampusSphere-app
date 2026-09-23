import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { updateUserProfile, uploadAvatar, uploadCoverPhoto } from "@/services/api";
import { 
  MapPin, Camera, Calendar, Link, User, BookOpen, 
  Briefcase, GraduationCap, Loader2, Check, Upload, 
  X, Zap, Smile, Shield, Plus, Languages, ArrowLeft 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";
import { StudyLevelCombobox } from "@/components/forms/StudyLevelCombobox";
import { SkillsCombobox } from "@/components/forms/SkillsCombobox";
import { InterestsCombobox } from "@/components/forms/InterestsCombobox";
import { CityCombobox } from "@/components/forms/CityCombobox";
import { LanguageCombobox } from "@/components/forms/LanguageCombobox";
import { formatSlugToLabel } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { compressImageFile } from "@/lib/imageCompression";

export function EditProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // States for form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [town, setTown] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [university, setUniversity] = useState("");
  const [faculty, setFaculty] = useState("");
  const [studyYear, setStudyYear] = useState("");
  const [studentId, setStudentId] = useState("");
  
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [previousEducation, setPreviousEducation] = useState<any[]>([]);
  const [portfolioLinks, setPortfolioLinks] = useState<any[]>([]);

  // Input states for "Plus" layout
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newLanguageInput, setNewLanguageInput] = useState("");

  const [studentCardFile, setStudentCardFile] = useState<File | null>(null);
  const studentCardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger votre profil.",
      });
      navigate("/profile");
      return;
    }

    setIsLoading(false);
    // Initialize form
    setFirstName(currentUser.firstName || currentUser.first_name || "");
    setLastName(currentUser.lastName || currentUser.last_name || "");
    setUsername(currentUser.username || "");
    setBio(currentUser.bio || "");
    setEmail(currentUser.email || "");
    setPhone(currentUser.phoneNumber || currentUser.phone_number || "");
    setTown(currentUser.town || "");
    setDateOfBirth(currentUser.dateOfBirth || currentUser.date_of_birth || "");

    const rawLang: any = currentUser.language;
    const langs = rawLang
      ? (typeof rawLang === "string" ? rawLang.split(",").map((l: string) => l.trim()).filter(Boolean) : Array.isArray(rawLang) ? rawLang : [])
      : [];
    setLanguages(langs);

    setUniversity(currentUser.university || "");
    setFaculty(currentUser.faculty || "");
    setStudyYear(currentUser.studyYear || currentUser.study_year || "");
    setStudentId(currentUser.studentId || currentUser.student_id || "");

    setSkills(currentUser.skills || []);
    setInterests(currentUser.interests || []);
    setExperiences(currentUser.experiences || []);
    setPreviousEducation(currentUser.previousEducation || []);
    setPortfolioLinks(currentUser.portfolioLinks || []);
    setIsLoading(false);
  }, [currentUser, isAuthLoading, navigate, toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData: any = {
        first_name: firstName,
        last_name: lastName,
        username: username,
        bio: bio,
        town: town,
        language: languages.join(", "),
        university: university,
        faculty: faculty,
        study_year: studyYear,
        skills: skills,
        interests: interests,
        experiences: experiences.filter(exp => exp.title || exp.company),
        previous_education: previousEducation.filter(edu => edu.degree || edu.school),
        portfolio_links: portfolioLinks.filter(link => link.name || link.url),
      };

      await updateUserProfile(updateData);

      // Handle student card upload if exists
      if (studentCardFile) {
        // Here you would call a specific upload endpoint for verification documents
        // For now, we simulate success or use a generic upload if available
      }

      toast({
        title: "Succès",
        description: "Votre profil a été mis à jour avec succès.",
      });
      navigate(`/profile/${username}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10 px-4 md:px-0">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier le profil</h1>
          <p className="text-muted-foreground">Gérez vos informations personnelles et académiques.</p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* SECTION 1: IDENTITÉ */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Identité
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nom</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Prénom</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date de naissance</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-7" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Biographie</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[120px] resize-none" placeholder="Partagez votre parcours..." />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: CONTACT & LOCALISATION */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Contact & Localisation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">+237</span>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-l-none" />
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-muted/10 space-y-3">
              <Label className="font-medium">Localisation actuelle (Style LinkedIn)</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <CityCombobox value={town} onValueChange={setTown} />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  {town || "Non renseigné"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: ACADÉMIQUE */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-primary" />
              Cursus Académique
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Université</Label>
                <UniversityCombobox value={university} onValueChange={setUniversity} />
              </div>
              <div className="space-y-2">
                <Label>Filière</Label>
                <FacultyCombobox value={faculty} onValueChange={setFaculty} />
              </div>
              <div className="space-y-2">
                <Label>Niveau d'étude</Label>
                <StudyLevelCombobox value={studyYear} onValueChange={setStudyYear} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">Matricule / ID</Label>
                <Input id="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
              </div>
            </div>
            
            <div className="p-6 rounded-2xl border-2 border-dashed bg-primary/5 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Certification Étudiante</h4>
              </div>
              <p className="text-sm text-muted-foreground">L'importation d'une carte d'étudiant valide vous permet d'obtenir le badge certifié.</p>
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => studentCardInputRef.current?.click()} className="bg-background">
                  <Upload className="mr-2 h-4 w-4" />
                  Choisir un fichier
                </Button>
                {studentCardFile && <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">{studentCardFile.name}</span>}
                <input type="file" className="hidden" ref={studentCardInputRef} accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const compressed = await compressImageFile(f); setStudentCardFile(compressed); } else { setStudentCardFile(null); } }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: COMPÉTENCES & LANGUES */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-primary" />
              Compétences & Langues
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Skills */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Compétences techniques</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SkillsCombobox 
                      value={newSkill} 
                      onValueChange={setNewSkill}
                      onSearchValueChange={setNewSkill}
                      onSkillAdd={(s) => { if(!skills.includes(s)) { setSkills([...skills, s]); setNewSkill(""); } }}
                    />
                  </div>
                  <Button variant="outline" size="icon" className="shrink-0 h-10 w-10" onClick={() => { if(newSkill.trim() && !skills.includes(newSkill.trim())) { setSkills([...skills, newSkill.trim()]); setNewSkill(""); } }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted/20 min-h-[50px]">
                  {skills.map((s, i) => (
                    <Badge key={i} variant="secondary" className="pl-3 pr-1 py-1.5 gap-1">
                      {formatSlugToLabel(s)}
                      <button onClick={() => setSkills(skills.filter(x => x !== s))} className="hover:bg-muted-foreground/20 rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Langues</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <LanguageCombobox 
                      value={newLanguageInput} 
                      onValueChange={setNewLanguageInput}
                      onSearchValueChange={setNewLanguageInput}
                      onLanguageAdd={(l) => { if(!languages.includes(l)) { setLanguages([...languages, l]); setNewLanguageInput(""); } }}
                    />
                  </div>
                  <Button variant="outline" size="icon" className="shrink-0 h-10 w-10" onClick={() => { if(newLanguageInput.trim() && !languages.includes(newLanguageInput.trim())) { setLanguages([...languages, newLanguageInput.trim()]); setNewLanguageInput(""); } }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted/20 min-h-[50px]">
                  {languages.map((l, i) => (
                    <Badge key={i} variant="outline" className="pl-3 pr-1 py-1.5 gap-1 border-primary/30 bg-primary/5">
                      {formatSlugToLabel(l)}
                      <button onClick={() => setLanguages(languages.filter(x => x !== l))} className="hover:bg-primary/20 rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Centres d'intérêt</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <InterestsCombobox 
                    value={newInterest} 
                    onValueChange={setNewInterest}
                    onSearchValueChange={setNewInterest}
                    onInterestAdd={(i) => { if(!interests.includes(i)) { setInterests([...interests, i]); setNewInterest(""); } }}
                  />
                </div>
                <Button variant="outline" size="icon" className="shrink-0 h-10 w-10" onClick={() => { if(newInterest.trim() && !interests.includes(newInterest.trim())) { setInterests([...interests, newInterest.trim()]); setNewInterest(""); } }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted/20">
                {interests.map((it, i) => (
                  <Badge key={i} variant="outline" className="pl-3 pr-1 py-1.5 gap-1 bg-background">
                    {formatSlugToLabel(it)}
                    <button onClick={() => setInterests(interests.filter(x => x !== it))} className="hover:bg-muted-foreground/20 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 5: EXPÉRIENCES */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-primary" />
              Expériences Professionnelles
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setExperiences([{ title: "", company: "", duration: "", description: "" }, ...experiences])}>
              <Plus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {experiences.map((exp, i) => (
              <div key={i} className="relative p-6 rounded-2xl border bg-muted/5 group">
                <Button variant="ghost" size="icon" className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => setExperiences(experiences.filter((_, j) => j !== i))}>
                  <X className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Poste</Label>
                    <Input value={exp.title} onChange={(e) => { const n = [...experiences]; n[i].title = e.target.value; setExperiences(n); }} placeholder="Ex: Développeur React" />
                  </div>
                  <div className="space-y-2">
                    <Label>Entreprise</Label>
                    <Input value={exp.company} onChange={(e) => { const n = [...experiences]; n[i].company = e.target.value; setExperiences(n); }} placeholder="Ex: Google" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Durée</Label>
                    <Input value={exp.duration} onChange={(e) => { const n = [...experiences]; n[i].duration = e.target.value; setExperiences(n); }} placeholder="Ex: Juin 2023 - Présent" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Description</Label>
                    <Textarea value={exp.description} onChange={(e) => { const n = [...experiences]; n[i].description = e.target.value; setExperiences(n); }} rows={3} placeholder="Détaillez vos missions..." />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ACTIONS FINALES */}
        <div className="flex items-center justify-between p-6 bg-background border rounded-2xl shadow-lg sticky bottom-6 z-10">
          <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
            Annuler les modifications
          </Button>
          <Button size="lg" className="campus-gradient text-white px-10 shadow-lg shadow-primary/20" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                Enregistrer le profil
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

