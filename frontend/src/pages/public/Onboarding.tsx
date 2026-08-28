import { Suspense, lazy, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { ChevronRight, Check, Loader2, Plus, X, Camera, Info, ExternalLink, UserCircle, Globe, Briefcase, GraduationCap, Zap, Heart, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, REGISTRATION_MAX_LENGTHS } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  completeSupabaseProfile,
  verifyStudentStatus,
} from "@/services/api";
import { completeSupabaseProfilePayloadSchema, mapCompleteProfileErrors } from "@/schemas/completeProfilePayload";
import { cn } from "@/lib/utils";
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";
import { StudyLevelCombobox } from "@/components/forms/StudyLevelCombobox";
import { SkillsCombobox } from "@/components/forms/SkillsCombobox";
import { InterestsCombobox } from "@/components/forms/InterestsCombobox";
import { LanguageCombobox } from "@/components/forms/LanguageCombobox";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useAuth } from "@/contexts/AuthContext";

const AddEducationModal = lazy(() => import("@/components/modals/AddEducationModal").then((module) => ({ default: module.AddEducationModal })));
const AddExperienceModal = lazy(() => import("@/components/modals/AddExperienceModal").then((module) => ({ default: module.AddExperienceModal })));

type Step = 1 | 2;

export function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isAddEducationOpen, setIsAddEducationOpen] = useState(false);
  const [isAddExperienceOpen, setIsAddExperienceOpen] = useState(false);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const [cardImage, setCardImage] = useState<File | null>(null);
  const [cardPreview, setCardPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    university: "", faculty: "", studyYear: "", studentId: "", campus: "", town: "", bio: "",
    previousEducation: [] as Array<{degree: string; school: string; year: string}>,
    experiences: [] as Array<{title: string; company: string; duration: string; description: string}>,
    skills: [] as string[], interests: [] as string[], languages: [] as string[],
    portfolioLinks: [] as Array<{name: string; url: string}>,
  });

  const [newLanguageInput, setNewLanguageInput] = useState("");
  const [newSkillInput, setNewSkillInput] = useState("");
  const [newInterestInput, setNewInterestInput] = useState("");
  const [newLink, setNewLink] = useState({ name: "", url: "" });

  const step1Schema = z.object({
    university: z.string().min(1, "Requis"),
    faculty: z.string().min(1, "Requis"),
    studyYear: z.string().min(1, "Requis"),
    studentId: z.string().optional(),
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Fichier trop lourd", description: "L'image ne doit pas dépasser 10 Mo.", variant: "destructive" });
        return;
      }
      setCardImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setCardPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = async () => {
    if (isLoading) return;
    
    // Default values since they are not collected in onboarding but schema might expect optional fields
    const payload = {
      university: formData.university,
      faculty: formData.faculty,
      study_year: formData.studyYear,
      student_id: formData.studentId,
      campus: formData.campus,
      town: formData.town,
      language: formData.languages.length > 0 ? formData.languages : ["Français"],
      bio: formData.bio,
      skills: formData.skills,
      interests: formData.interests,
      previous_education: formData.previousEducation,
      experiences: formData.experiences,
      portfolio_links: formData.portfolioLinks,
    };

    const validation = completeSupabaseProfilePayloadSchema.safeParse(payload);
    if (!validation.success) {
      setErrors(mapCompleteProfileErrors(validation.error));
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      await completeSupabaseProfile(payload);
      
      if (cardImage) {
        try {
          await verifyStudentStatus(formData.studentId || "Inconnu", cardImage);
        } catch (verifyErr) {
          console.error("Erreur certification auto:", verifyErr);
        }
      }

      await refreshUser(); // Update user context so is_profile_complete becomes true
      toast({ title: "Profil configuré ! 🎉", description: "Bienvenue sur CampusSphere! Connect. Share. Grow. 🚀", duration: 4000 });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = step === 1 ? 50 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex flex-col items-center justify-center p-4 sm:p-8">
      <Helmet>
        <title>Configuration - CampusSphere</title>
      </Helmet>
      
      <div className="w-full max-w-2xl bg-card rounded-xl border shadow-sm p-6 sm:p-10">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold font-automata text-primary">CampusSphere</span>
          <h1 className="text-xl font-semibold mt-4">
            {step === 1 ? "Où étudiez-vous ?" : "Votre profil professionnel"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {step === 1 ? "Ces informations sont nécessaires pour vous connecter à votre campus." : "Mettez en avant vos talents pour attirer les opportunités (Optionnel)."}
          </p>
        </div>

        <div className="mb-8">
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-6">
          {/* ── ÉTAPE 1 : Infos académiques ── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div>
                <Label>Université/Institut *</Label>
                <UniversityCombobox value={formData.university} onValueChange={v => handleInputChange("university", v)} className="mt-2" />
                {errors.university && <p className="text-xs text-red-500 mt-1">{errors.university}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Filière *</Label>
                  <FacultyCombobox value={formData.faculty} onValueChange={v => handleInputChange("faculty", v)} className="mt-2" />
                  {errors.faculty && <p className="text-xs text-red-500 mt-1">{errors.faculty}</p>}
                </div>
                <div>
                  <Label>Niveau *</Label>
                  <StudyLevelCombobox value={formData.studyYear} onValueChange={v => handleInputChange("studyYear", v)} className="mt-2" />
                  {errors.studyYear && <p className="text-xs text-red-500 mt-1">{errors.studyYear}</p>}
                </div>
              </div>
              <div>
                <Label>Matricule <span className="text-muted-foreground">(optionnel)</span></Label>
                <Input maxLength={REGISTRATION_MAX_LENGTHS?.studentId || 50} value={formData.studentId} onChange={e => handleInputChange("studentId", e.target.value)} placeholder="Ex: 21T2045" />
                {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
              </div>

              <div>
                <Label>Preuve de statut étudiant <span className="text-muted-foreground">(carte, reçu, certificat... - optionnel)</span></Label>
                <div 
                  onClick={() => cardInputRef.current?.click()}
                  className={cn(
                    "mt-2 relative h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-muted/30 hover:bg-muted/50",
                    cardPreview ? "border-primary/50" : "border-muted-foreground/30"
                  )}
                >
                  {cardPreview ? (
                    <div className="relative w-full h-full">
                      <img src={cardPreview} alt="Aperçu preuve" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium">Changer la photo</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-2 bg-primary/10 rounded-full mb-2">
                        <Camera className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-xs font-medium">Uploader une preuve pour certification</p>
                      <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG (Max 10Mo)</p>
                    </>
                  )}
                </div>
                <input type="file" ref={cardInputRef} className="hidden" accept="image/*" onChange={handleCardChange} />
                <div className="flex items-center gap-2 mt-2 p-2 bg-blue-500/5 text-blue-600 rounded-lg text-[10px]">
                  <Info className="h-3 w-3 flex-shrink-0" />
                  La certification est requise pour publier des posts ou rejoindre des sphères.
                </div>
              </div>
              <div>
                <Label>Campus <span className="text-muted-foreground">(optionnel)</span></Label>
                <Input maxLength={REGISTRATION_MAX_LENGTHS?.campus || 100} value={formData.campus} onChange={e => handleInputChange("campus", e.target.value)} placeholder="Si plusieurs campus" />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => {
                  const v = step1Schema.safeParse(formData);
                  if (!v.success) {
                    const fe: Record<string, string> = {};
                    v.error.errors.forEach(e => { if (e.path[0]) fe[e.path[0] as string] = e.message; });
                    setErrors(fe); return;
                  }
                  setErrors({}); setStep(2);
                }} className="campus-gradient text-white hover:opacity-90 w-full sm:w-auto">
                  Suivant <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Compétences & expériences ── */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* BIO */}
                <div className="md:col-span-8 bg-card border shadow-sm rounded-xl p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <UserCircle className="h-5 w-5" />
                    <h3 className="font-semibold text-foreground">À propos de vous</h3>
                  </div>
                  <Textarea value={formData.bio} onChange={e => handleInputChange("bio", e.target.value)} placeholder="Étudiant passionné par l'innovation, je recherche..." className="min-h-[120px] bg-muted/30 focus-visible:ring-1 resize-none border-dashed" />
                  <p className="text-xs text-muted-foreground mt-2">Présentez-vous brièvement. Cela aidera les autres étudiants et les recruteurs à mieux vous connaître.</p>
                </div>

                {/* LANGUES */}
                <div className="md:col-span-4 bg-card border shadow-sm rounded-xl p-5 hover:border-primary/50 transition-colors flex flex-col">
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <Globe className="h-5 w-5" />
                    <h3 className="font-semibold text-foreground">Langues</h3>
                  </div>
                  <div className="flex-1">
                    <LanguageCombobox
                      value={newLanguageInput}
                      onValueChange={setNewLanguageInput}
                      onSearchValueChange={setNewLanguageInput}
                      onLanguageAdd={(lang) => {
                        if (!formData.languages.includes(lang)) {
                          setFormData(p => ({ ...p, languages: [...p.languages, lang] }));
                          setNewLanguageInput("");
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.languages.map(l => (
                        <Badge key={l} variant="secondary" className="pl-3 pr-1 py-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20">
                          {l}
                          <button onClick={() => setFormData(p => ({ ...p, languages: p.languages.filter(x => x !== l) }))} className="ml-1 hover:bg-black/10 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* EXPÉRIENCES */}
                <div className="md:col-span-6 bg-card border shadow-sm rounded-xl p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Briefcase className="h-5 w-5" />
                      <h3 className="font-semibold text-foreground">Expériences pro</h3>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 rounded-full px-3 text-primary hover:bg-primary/10" onClick={() => setIsAddExperienceOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />Ajouter
                    </Button>
                    {isAddExperienceOpen && (
                      <Suspense fallback={<ModalLoadingFallback />}>
                        <AddExperienceModal
                          open={isAddExperienceOpen}
                          onOpenChange={setIsAddExperienceOpen}
                          existingExperiences={formData.experiences}
                          onExperienceAdded={exp => setFormData(p => ({ ...p, experiences: [...p.experiences, exp] }))}
                        />
                      </Suspense>
                    )}
                  </div>
                  {formData.experiences.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-muted/20 border border-dashed rounded-lg text-sm">
                      <Briefcase className="h-8 w-8 mb-2 opacity-20" />
                      <p>Aucune expérience ajoutée</p>
                    </div>
                  ) : formData.experiences.map((exp, i) => (
                    <div key={i} className="border-l-2 border-primary/50 pl-4 py-3 bg-muted/30 rounded-r-md mb-3 flex justify-between gap-3 group">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap">{exp.title}</p>
                        <p className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">{exp.company} • {exp.duration}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setFormData(p => ({ ...p, experiences: p.experiences.filter((_, j) => j !== i) }))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* FORMATIONS */}
                <div className="md:col-span-6 bg-card border shadow-sm rounded-xl p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-primary">
                      <GraduationCap className="h-5 w-5" />
                      <h3 className="font-semibold text-foreground">Parcours académique</h3>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 rounded-full px-3 text-primary hover:bg-primary/10" onClick={() => setIsAddEducationOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />Ajouter
                    </Button>
                    {isAddEducationOpen && (
                      <Suspense fallback={<ModalLoadingFallback />}>
                        <AddEducationModal
                          open={isAddEducationOpen}
                          onOpenChange={setIsAddEducationOpen}
                          existingEducations={formData.previousEducation}
                          onEducationAdded={edu => setFormData(p => ({ ...p, previousEducation: [...p.previousEducation, edu] }))}
                        />
                      </Suspense>
                    )}
                  </div>
                  {formData.previousEducation.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-muted/20 border border-dashed rounded-lg text-sm">
                      <GraduationCap className="h-8 w-8 mb-2 opacity-20" />
                      <p>Aucune formation ajoutée</p>
                    </div>
                  ) : formData.previousEducation.map((edu, i) => (
                    <div key={i} className="border-l-2 border-primary/50 pl-4 py-3 bg-muted/30 rounded-r-md mb-3 flex justify-between gap-3 group">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap">{edu.degree}</p>
                        <p className="text-xs text-muted-foreground break-words">{edu.school} • {edu.year}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setFormData(p => ({ ...p, previousEducation: p.previousEducation.filter((_, j) => j !== i) }))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* COMPÉTENCES */}
                <div className="md:col-span-4 bg-card border shadow-sm rounded-xl p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <Zap className="h-5 w-5" />
                    <h3 className="font-semibold text-foreground">Compétences</h3>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <SkillsCombobox
                        value={newSkillInput}
                        onValueChange={setNewSkillInput}
                        onSearchValueChange={setNewSkillInput}
                        onSkillAdd={(skill) => {
                          if (!formData.skills.includes(skill)) {
                            setFormData(p => ({ ...p, skills: [...p.skills, skill] }));
                            setNewSkillInput("");
                          }
                        }}
                      />
                    </div>
                    <Button variant="outline" size="icon" className="shrink-0" onClick={() => {
                      if (newSkillInput.trim() && !formData.skills.includes(newSkillInput.trim())) {
                        setFormData(p => ({ ...p, skills: [...p.skills, newSkillInput.trim()] }));
                        setNewSkillInput("");
                      }
                    }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.skills.map(s => (
                      <Badge key={s} variant="secondary" className="cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors" onClick={() => setFormData(p => ({ ...p, skills: p.skills.filter(x => x !== s) }))}>
                        {s} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* INTÉRÊTS */}
                <div className="md:col-span-4 bg-card border shadow-sm rounded-xl p-5 hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <Heart className="h-5 w-5" />
                    <h3 className="font-semibold text-foreground">Centres d'intérêt</h3>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <InterestsCombobox
                        value={newInterestInput}
                        onValueChange={setNewInterestInput}
                        onSearchValueChange={setNewInterestInput}
                        onInterestAdd={(interest) => {
                          if (!formData.interests.includes(interest)) {
                            setFormData(p => ({ ...p, interests: [...p.interests, interest] }));
                            setNewInterestInput("");
                          }
                        }}
                      />
                    </div>
                    <Button variant="outline" size="icon" className="shrink-0" onClick={() => {
                      if (newInterestInput.trim() && !formData.interests.includes(newInterestInput.trim())) {
                        setFormData(p => ({ ...p, interests: [...p.interests, newInterestInput.trim()] }));
                        setNewInterestInput("");
                      }
                    }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.interests.map(s => (
                      <Badge key={s} variant="outline" className="cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors" onClick={() => setFormData(p => ({ ...p, interests: p.interests.filter(x => x !== s) }))}>
                        {s} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* PORTFOLIO / LIENS */}
                <div className="md:col-span-4 bg-card border shadow-sm rounded-xl p-5 hover:border-primary/50 transition-colors flex flex-col">
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <LinkIcon className="h-5 w-5" />
                    <h3 className="font-semibold text-foreground">Liens & Portfolio</h3>
                  </div>
                  <div className="flex gap-2 min-w-0 w-full">
                    <Input maxLength={REGISTRATION_MAX_LENGTHS?.portfolioName || 50} placeholder="Nom" value={newLink.name} onChange={e => setNewLink(p => ({ ...p, name: e.target.value }))} className="w-1/3 min-w-0" />
                    <Input maxLength={REGISTRATION_MAX_LENGTHS?.portfolioUrl || 200} placeholder="https://..." value={newLink.url} onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))} className="w-full min-w-0" />
                    <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => { 
                      if (newLink.name.trim() && newLink.url.trim()) { 
                        setFormData(p => ({ ...p, portfolioLinks: [...p.portfolioLinks, { name: newLink.name.trim(), url: newLink.url.trim() }] })); 
                        setNewLink({ name: "", url: "" }); 
                      } 
                    }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 mt-3 overflow-y-auto flex-1">
                    {formData.portfolioLinks.map((l, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 p-2 border rounded-lg bg-muted/30 group">
                        <div className="min-w-0 flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-foreground overflow-hidden text-ellipsis whitespace-nowrap">{l.name}</span>
                            <span className="text-[10px] text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={l.url}>{l.url}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0" onClick={() => setFormData(p => ({ ...p, portfolioLinks: p.portfolioLinks.filter((_, j) => j !== i) }))}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 mt-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="order-2 sm:order-1 w-full sm:w-auto text-muted-foreground hover:text-foreground">
                  Retour
                </Button>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
                  <Button variant="outline" onClick={handleFinalSubmit} disabled={isLoading} className="w-full sm:w-auto">
                    Passer cette étape
                  </Button>
                  <Button onClick={handleFinalSubmit} disabled={isLoading} className="campus-gradient text-white hover:opacity-90 w-full sm:w-auto px-8">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Terminer mon profil
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
