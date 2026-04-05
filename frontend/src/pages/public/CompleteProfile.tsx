import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { completeSupabaseProfile } from "@/services/api";
import { AddEducationModal } from "@/components/modals/AddEducationModal";
import { AddExperienceModal } from "@/components/modals/AddExperienceModal";
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";
import { StudyLevelCombobox } from "@/components/forms/StudyLevelCombobox";
import { RegistrationErrorAlert, RegistrationPrimaryButton, RegistrationTunnelLayout } from "@/components/public/registration/RegistrationTunnelUI";

type Step = 1 | 2 | 3;

export function CompleteProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    username: "", phoneNumber: "", dateOfBirth: "", town: "", language: "",
    university: "", faculty: "", studyYear: "", studentId: "", campus: "",
    previousEducation: [] as Array<{degree: string; school: string; year: string}>,
    experiences: [] as Array<{title: string; company: string; duration: string; description: string}>,
    skills: [] as string[], interests: [] as string[],
    portfolioLinks: [] as Array<{name: string; url: string}>,
  });

  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newLink, setNewLink] = useState({ name: "", url: "" });

  const step1Schema = z.object({
    username: z.string().min(3, "Au moins 3 caractères"),
    phoneNumber: z.string().min(8, "Au moins 8 chiffres"),
    dateOfBirth: z.string().min(1, "Requis"),
  });

  const step2Schema = z.object({
    university: z.string().min(1, "Requis"),
    faculty: z.string().min(1, "Requis"),
    studyYear: z.string().min(1, "Requis"),
    studentId: z.string().min(1, "Requis"),
  });

  const handleInput = (field: string, value: string) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
  };

  const validateAndNext = (schema: z.ZodObject<any>, nextStep: Step) => {
    const v = schema.safeParse(formData);
    if (!v.success) {
      const fe: Record<string, string> = {};
      v.error.errors.forEach(e => { if (e.path[0]) fe[e.path[0] as string] = e.message; });
      setErrors(fe);
      return;
    }
    setErrors({});
    setStep(nextStep);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await completeSupabaseProfile({
        username: formData.username,
        phone_number: formData.phoneNumber,
        date_of_birth: formData.dateOfBirth,
        town: formData.town,
        language: formData.language || "fr",
        university: formData.university,
        faculty: formData.faculty,
        study_year: formData.studyYear,
        student_id: formData.studentId,
        campus: formData.campus,
        skills: formData.skills,
        interests: formData.interests,
        previous_education: formData.previousEducation,
        experiences: formData.experiences,
        portfolio_links: formData.portfolioLinks,
      });
      toast({ title: "Profil complété ! 🎉", description: "Bienvenue sur CampusSphere", duration: 4000 });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <RegistrationTunnelLayout
      subtitle={`Complétez votre profil — Étape ${step} sur 3`}
      progress={progress}
      progressLabels={["Infos de base", "Académique", "Compétences"]}
      onBrandClick={() => navigate("/")}
    >
      <RegistrationErrorAlert show={Object.keys(errors).length > 0} />

          {/* ── ÉTAPE 1 : Infos de base ── */}
          {step === 1 && (
            <div className="space-y-4">
              <CardTitle>Informations de base</CardTitle>
              <div>
                <Label>Nom d'utilisateur *</Label>
                <Input className="mt-1" value={formData.username} onChange={e => handleInput("username", e.target.value)} placeholder="ex: john_doe" />
                {errors.username && <p className="text-xs text-destructive mt-1">{errors.username}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de naissance *</Label>
                  <Input className="mt-1" type="date" value={formData.dateOfBirth} onChange={e => handleInput("dateOfBirth", e.target.value)} />
                  {errors.dateOfBirth && <p className="text-xs text-destructive mt-1">{errors.dateOfBirth}</p>}
                </div>
                <div>
                  <Label>Téléphone *</Label>
                  <Input className="mt-1" value={formData.phoneNumber} onChange={e => handleInput("phoneNumber", e.target.value)} placeholder="+237..." />
                  {errors.phoneNumber && <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ville</Label>
                  <Input className="mt-1" value={formData.town} onChange={e => handleInput("town", e.target.value)} />
                </div>
                <div>
                  <Label>Langue</Label>
                  <Input className="mt-1" value={formData.language} onChange={e => handleInput("language", e.target.value)} placeholder="fr" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <RegistrationPrimaryButton onClick={() => validateAndNext(step1Schema, 2)}>
                  Suivant <ChevronRight className="ml-2 h-4 w-4" />
                </RegistrationPrimaryButton>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Académique ── */}
          {step === 2 && (
            <div className="space-y-4">
              <CardTitle>Informations académiques</CardTitle>
              <div>
                <Label>Université *</Label>
                <UniversityCombobox value={formData.university} onValueChange={v => handleInput("university", v)} className="mt-1" />
                {errors.university && <p className="text-xs text-red-500 mt-1">{errors.university}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Filière *</Label>
                  <FacultyCombobox value={formData.faculty} onValueChange={v => handleInput("faculty", v)} className="mt-1" />
                  {errors.faculty && <p className="text-xs text-red-500 mt-1">{errors.faculty}</p>}
                </div>
                <div>
                  <Label>Niveau *</Label>
                  <StudyLevelCombobox value={formData.studyYear} onValueChange={v => handleInput("studyYear", v)} className="mt-1" />
                  {errors.studyYear && <p className="text-xs text-red-500 mt-1">{errors.studyYear}</p>}
                </div>
              </div>
              <div>
                <Label>Matricule *</Label>
                <Input className="mt-1" value={formData.studentId} onChange={e => handleInput("studentId", e.target.value)} />
                {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
              </div>
              <div>
                <Label>Campus</Label>
                <Input className="mt-1" value={formData.campus} onChange={e => handleInput("campus", e.target.value)} placeholder="Si plusieurs campus" />
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="mr-2 h-4 w-4" />Précédent</Button>
                <RegistrationPrimaryButton onClick={() => validateAndNext(step2Schema, 3)}>
                  Suivant <ChevronRight className="ml-2 h-4 w-4" />
                </RegistrationPrimaryButton>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : Compétences ── */}
          {step === 3 && (
            <div className="space-y-5">
              <CardTitle>Expérience & Compétences</CardTitle>

              {/* Formations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Formations précédentes</Label>
                  <AddEducationModal existingEducations={formData.previousEducation} onEducationAdded={edu => setFormData(p => ({ ...p, previousEducation: [...p.previousEducation, edu] }))}>
                    <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
                  </AddEducationModal>
                </div>
                {formData.previousEducation.map((edu, i) => (
                  <div key={i} className="flex justify-between items-center border-l-2 border-primary/50 pl-3 py-1 mb-1 bg-muted/50 rounded-r">
                    <div><p className="text-sm font-medium">{edu.degree}</p><p className="text-xs text-muted-foreground">{edu.school} · {edu.year}</p></div>
                    <Button variant="ghost" size="sm" onClick={() => setFormData(p => ({ ...p, previousEducation: p.previousEducation.filter((_, j) => j !== i) }))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              {/* Expériences */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Expériences</Label>
                  <AddExperienceModal existingExperiences={formData.experiences} onExperienceAdded={exp => setFormData(p => ({ ...p, experiences: [...p.experiences, exp] }))}>
                    <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
                  </AddExperienceModal>
                </div>
                {formData.experiences.map((exp, i) => (
                  <div key={i} className="flex justify-between items-center border-l-2 border-primary/50 pl-3 py-1 mb-1 bg-muted/50 rounded-r">
                    <div><p className="text-sm font-medium">{exp.title}</p><p className="text-xs text-muted-foreground">{exp.company} · {exp.duration}</p></div>
                    <Button variant="ghost" size="sm" onClick={() => setFormData(p => ({ ...p, experiences: p.experiences.filter((_, j) => j !== i) }))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              {/* Compétences */}
              <div>
                <Label>Compétences</Label>
                <div className="flex gap-2 mt-1">
                  <Input placeholder="Ajouter..." value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (newSkill.trim()) { setFormData(p => ({ ...p, skills: [...p.skills, newSkill.trim()] })); setNewSkill(""); } } }} />
                  <Button type="button" variant="outline" onClick={() => { if (newSkill.trim()) { setFormData(p => ({ ...p, skills: [...p.skills, newSkill.trim()] })); setNewSkill(""); } }}>+</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map((s, i) => <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setFormData(p => ({ ...p, skills: p.skills.filter((_, j) => j !== i) }))}>{s} ×</Badge>)}
                </div>
              </div>

              {/* Intérêts */}
              <div>
                <Label>Centres d'intérêt</Label>
                <div className="flex gap-2 mt-1">
                  <Input placeholder="Ajouter..." value={newInterest} onChange={e => setNewInterest(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (newInterest.trim()) { setFormData(p => ({ ...p, interests: [...p.interests, newInterest.trim()] })); setNewInterest(""); } } }} />
                  <Button type="button" variant="outline" onClick={() => { if (newInterest.trim()) { setFormData(p => ({ ...p, interests: [...p.interests, newInterest.trim()] })); setNewInterest(""); } }}>+</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.interests.map((s, i) => <Badge key={i} variant="outline" className="cursor-pointer" onClick={() => setFormData(p => ({ ...p, interests: p.interests.filter((_, j) => j !== i) }))}>{s} ×</Badge>)}
                </div>
              </div>

              {/* Portfolio */}
              <div>
                <Label>Portfolio / Liens</Label>
                <div className="flex gap-2 mt-1">
                  <Input placeholder="Nom" value={newLink.name} onChange={e => setNewLink(p => ({ ...p, name: e.target.value }))} className="w-1/3" />
                  <Input placeholder="URL" value={newLink.url} onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))} />
                  <Button type="button" variant="outline" onClick={() => { if (newLink.name && newLink.url) { setFormData(p => ({ ...p, portfolioLinks: [...p.portfolioLinks, newLink] })); setNewLink({ name: "", url: "" }); } }}>+</Button>
                </div>
                {formData.portfolioLinks.map((l, i) => (
                  <div key={i} className="flex justify-between items-center p-2 border rounded mt-1 bg-muted/50">
                    <div><p className="text-sm font-medium">{l.name}</p><p className="text-xs text-muted-foreground">{l.url}</p></div>
                    <Button variant="ghost" size="sm" onClick={() => setFormData(p => ({ ...p, portfolioLinks: p.portfolioLinks.filter((_, j) => j !== i) }))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="mr-2 h-4 w-4" />Précédent</Button>
                <RegistrationPrimaryButton onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Finalisation...</> : <><Check className="mr-2 h-4 w-4" />Terminer</>}
                </RegistrationPrimaryButton>
              </div>
            </div>
          )}
    </RegistrationTunnelLayout>
  );
}
