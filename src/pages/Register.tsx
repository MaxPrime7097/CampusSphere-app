import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Upload, Check, Loader2, AlertCircle, Eye, EyeOff, X, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { AddEducationModal } from "@/components/modals/AddEducationModal";
import { AddExperienceModal } from "@/components/modals/AddExperienceModal";
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";
import { StudyLevelCombobox } from "@/components/forms/StudyLevelCombobox";
import { CityCombobox } from "@/components/forms/CityCombobox";

export function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
    avatar: null as File | null,
    bio: "",
    town: "",
    language: "",
    
    // Step 2: Academic Info
    university: "",
    faculty: "",
    studyYear: "",
    studentId: "",
    campus: "",
    
    // Step 3: Experience & Skills
    previousEducation: [] as Array<{degree: string, school: string, year: string}>,
    experiences: [] as Array<{title: string, company: string, duration: string, description: string}>,
    skills: [] as string[],
    interests: [] as string[],
    cv: null as File | null,
    portfolioLinks: [] as Array<{name: string, url: string}>
  });

  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");

  // Fonctions pour gérer les formations et expériences
  const handleAddEducation = (education: {degree: string, school: string, year: string}) => {
    setFormData(prev => ({
      ...prev,
      previousEducation: [...prev.previousEducation, education]
    }));
  };

  const handleRemoveEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      previousEducation: prev.previousEducation.filter((_, i) => i !== index)
    }));
  };

  const handleAddExperience = (experience: {title: string, company: string, duration: string, description: string}) => {
    setFormData(prev => ({
      ...prev,
      experiences: [...prev.experiences, experience]
    }));
  };

  const handleRemoveExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };
  const [newLink, setNewLink] = useState({ name: "", url: "" });

  // Schémas de validation
  const step1Schema = z.object({
    firstName: z.string().min(1, "Le prénom est requis").min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(1, "Le nom est requis").min(2, "Le nom doit contenir au moins 2 caractères"),
    username: z.string().min(1, "Le nom d'utilisateur est requis").min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
    email: z.string().min(1, "L'email est requis").email("Format d'email invalide"),
    phoneNumber: z.string().min(1, "Le numéro de téléphone est requis").min(8, "Le numéro de téléphone doit contenir au moins 8 chiffres"),
    dateOfBirth: z.string().min(1, "La date de naissance est requise"),
    password: z.string().min(1, "Le mot de passe est requis").min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z.string().min(1, "La confirmation du mot de passe est requise")
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"]
  });

  const step2Schema = z.object({
    university: z.string().min(1, "L'université est requise"),
    faculty: z.string().min(1, "La filière est requise"),
    studyYear: z.string().min(1, "Le niveau d'études est requis"),
    studentId: z.string().min(1, "Le matricule étudiant est requis")
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const addLink = () => {
    if (newLink.name.trim() && newLink.url.trim()) {
      // Validation simple d'URL
      try {
        new URL(newLink.url);
        setFormData(prev => ({
          ...prev,
          portfolioLinks: [...prev.portfolioLinks, { name: newLink.name.trim(), url: newLink.url.trim() }]
        }));
        setNewLink({ name: "", url: "" });
        toast({
          title: "Lien ajouté !",
          description: `${newLink.name} a été ajouté à votre portfolio`,
          duration: 2000,
        });
      } catch {
        toast({
          variant: "destructive",
          title: "URL invalide",
          description: "Veuillez entrer une URL valide (ex: https://example.com)",
          duration: 3000,
        });
      }
    }
  };

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    
    if (file) {
      // Validation de la taille du fichier
      const maxSize = field === 'avatar' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB pour avatar, 10MB pour CV
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "Fichier trop volumineux",
          description: `Le fichier doit faire moins de ${field === 'avatar' ? '5MB' : '10MB'}`,
          duration: 4000,
        });
        return;
      }
      
      // Validation du type de fichier
      const allowedTypes = field === 'avatar' 
        ? ['image/jpeg', 'image/png', 'image/jpg'] 
        : ['application/pdf'];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Type de fichier non supporté",
          description: field === 'avatar' 
            ? "Seuls les fichiers JPG, JPEG et PNG sont acceptés" 
            : "Seuls les fichiers PDF sont acceptés",
          duration: 4000,
        });
        return;
      }
      
      toast({
        title: "Fichier sélectionné",
        description: `${file.name} a été sélectionné`,
        duration: 2000,
      });
    }
  };

  const handleAvatarUpload = () => {
    avatarInputRef.current?.click();
  };

  const handleCVUpload = () => {
    cvInputRef.current?.click();
  };

  const validateStep = (step: number) => {
    setErrors({});
    
    if (step === 1) {
      const validation = step1Schema.safeParse({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return false;
      }
    } else if (step === 2) {
      const validation = step2Schema.safeParse({
        university: formData.university,
        faculty: formData.faculty,
        studyYear: formData.studyYear,
        studentId: formData.studentId
      });
      
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return false;
      }
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Simuler l'inscription
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Inscription réussie !",
        description: "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
        duration: 4000,
      });
      
    navigate('/login');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur d'inscription",
        description: "Une erreur est survenue. Veuillez réessayer.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (currentStep / totalSteps) * 100;

  const languages = ["Français", "English"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/CS.svg" alt="CampusSphere" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
            Rejoindre CampusSphere
          </h1>
          <p className="text-muted-foreground mt-2">
            Étape {currentStep} sur {totalSteps}
          </p>
          <div className=" hidden mt-6">
            <img src="/Illustrations/Sign up-amico.svg" alt="Sign up" className="mx-auto w-56" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Informations personnelles</span>
            <span>Informations académiques</span>
            <span>Expérience & Compétences</span>
          </div>
        </div>

        <Card className="campus-card">
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Informations personnelles"}
              {currentStep === 2 && "Informations académiques"}
              {currentStep === 3 && "Expérience & Compétences"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Veuillez corriger les erreurs ci-dessous avant de continuer
                </AlertDescription>
              </Alert>
            )}
            
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={errors.firstName ? 'border-destructive' : ''}
                      required
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={errors.lastName ? 'border-destructive' : ''}
                      required
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Nom d'utilisateur *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={errors.username ? 'border-destructive' : ''}
                      required
                    />
                    {errors.username && (
                      <p className="text-sm text-destructive mt-1">{errors.username}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email universitaire *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre.email@universite.fr"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                      required
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date de naissance *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className={errors.dateOfBirth ? 'border-destructive' : ''}
                      required
                    />
                    {errors.dateOfBirth && (
                      <p className="text-sm text-destructive mt-1">{errors.dateOfBirth}</p>
                    )}
                  </div>
                   <div>
                    <Label htmlFor="phoneNumber">Numéro de Téléphone *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className={errors.phoneNumber ? 'border-destructive' : ''}
                      required
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-destructive mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>
                </div>  

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Mot de passe *</Label>
                    <div className="relative">
                    <Input
                      id="password"
                        type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                        className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                      required
                    />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive mt-1">{errors.password}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                    <div className="relative">
                    <Input
                      id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                      required
                    />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="avatar">Photo de profil</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {formData.avatar ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <Upload className="h-8 w-8 text-green-500" />
                          <span className="text-sm font-medium text-green-600">
                            {formData.avatar.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleFileChange('avatar', null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(formData.avatar.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <>
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-2">
                          <Button 
                            variant="outline" 
                            type="button"
                            onClick={handleAvatarUpload}
                          >
                        Choisir une photo
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG jusqu'à 5MB
                    </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    aria-label="Sélectionner une photo de profil"
                    title="Sélectionner une photo de profil"
                    onChange={(e) => handleFileChange('avatar', e.target.files?.[0] || null)}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio courte</Label>
                  <Textarea
                    id="bio"
                    placeholder="Décrivez-vous en quelques mots..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    maxLength={150}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.bio.length}/150 caractères
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="town">Ville</Label>
                    <CityCombobox
                      value={formData.town}
                      onValueChange={(value) => handleInputChange('town', value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">Langue principale</Label>
                    <Select onValueChange={(value) => handleInputChange('language', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre langue" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(language => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Academic Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="university">Université/Institut *</Label>
                  <UniversityCombobox
                    value={formData.university}
                    onValueChange={(value) => handleInputChange('university', value)}
                    className="mt-2"
                  />
                  {errors.university && (
                    <p className="text-sm text-red-500 mt-1">{errors.university}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="faculty">Filière *</Label>
                    <FacultyCombobox
                      value={formData.faculty}
                      onValueChange={(value) => handleInputChange('faculty', value)}
                      className="mt-2"
                    />
                    {errors.faculty && (
                      <p className="text-sm text-red-500 mt-1">{errors.faculty}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="studyYear">Niveau d'études *</Label>
                    <StudyLevelCombobox
                      value={formData.studyYear}
                      onValueChange={(value) => handleInputChange('studyYear', value)}
                      className="mt-2"
                    />
                    {errors.studyYear && (
                      <p className="text-sm text-red-500 mt-1">{errors.studyYear}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="studentId">Matricule étudiant *</Label>
                  <Input
                    id="studentId"
                    placeholder="Votre matricule d'étudiant"
                    value={formData.studentId}
                    onChange={(e) => handleInputChange('studentId', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="campus">Campus</Label>
                  <Input
                    id="campus"
                    placeholder="Si votre université a plusieurs campus"
                    value={formData.campus}
                    onChange={(e) => handleInputChange('campus', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Experience & Skills */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Formations */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Formations précédentes</Label>
                    <AddEducationModal 
                      existingEducations={formData.previousEducation}
                      onEducationAdded={handleAddEducation}
                    >
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </AddEducationModal>
                  </div>
                  
                  {formData.previousEducation.length > 0 ? (
                    <div className="space-y-2">
                      {formData.previousEducation.map((edu, index) => (
                        <div key={index} className="border-l-2 border-primary/50 pl-4 py-2 bg-muted/50 rounded-r-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{edu.degree}</p>
                              <p className="text-sm text-muted-foreground">{edu.school}</p>
                              <p className="text-xs text-muted-foreground">{edu.year}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveEducation(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p>Aucune formation ajoutée</p>
                      <p className="text-sm">Cliquez sur "Ajouter" pour commencer</p>
                    </div>
                  )}
                </div>

                {/* Expériences */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Expériences (stages, emplois)</Label>
                    <AddExperienceModal 
                      existingExperiences={formData.experiences}
                      onExperienceAdded={handleAddExperience}
                    >
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </AddExperienceModal>
                  </div>
                  
                  {formData.experiences.length > 0 ? (
                    <div className="space-y-2">
                      {formData.experiences.map((exp, index) => (
                        <div key={index} className="border-l-2 border-primary/50 pl-4 py-2 bg-muted/50 rounded-r-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{exp.title}</p>
                              <p className="text-sm text-muted-foreground">{exp.company}</p>
                              <p className="text-xs text-muted-foreground mb-2">{exp.duration}</p>
                              <p className="text-sm">{exp.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExperience(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p>Aucune expérience ajoutée</p>
                      <p className="text-sm">Cliquez sur "Ajouter" pour commencer</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Compétences</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Ajouter une compétence"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" onClick={addSkill} variant="outline">
                      Ajouter
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="cursor-pointer">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-xs"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Domaines d'intérêt</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Ajouter un centre d'intérêt"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                    />
                    <Button type="button" onClick={addInterest} variant="outline">
                      Ajouter
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map(interest => (
                      <Badge key={interest} variant="outline" className="cursor-pointer">
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
                          className="ml-2 text-xs"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="cv">CV (optionnel)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {formData.cv ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <Upload className="h-8 w-8 text-green-500" />
                          <span className="text-sm font-medium text-green-600">
                            {formData.cv.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleFileChange('cv', null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(formData.cv.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <>
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="mt-2">
                          <Button 
                            variant="outline" 
                            type="button"
                            onClick={handleCVUpload}
                          >
                        Télécharger CV
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      PDF jusqu'à 10MB
                    </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={cvInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    aria-label="Sélectionner un CV"
                    title="Sélectionner un CV"
                    onChange={(e) => handleFileChange('cv', e.target.files?.[0] || null)}
                  />
                </div>

                <div>
                  <Label>Liens portfolio/réseaux</Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nom (ex: LinkedIn, GitHub)"
                        value={newLink.name}
                        onChange={(e) => setNewLink(prev => ({ ...prev, name: e.target.value }))}
                        className="flex-1"
                      />
                      <Input
                        placeholder="URL (ex: https://github.com/username)"
                        value={newLink.url}
                        onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                        className="flex-2"
                      />
                      <Button type="button" onClick={addLink} variant="outline">
                        Ajouter
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.portfolioLinks.map((link, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <div>
                              <p className="font-medium text-sm">{link.name}</p>
                              <p className="text-xs text-muted-foreground">{link.url}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(link.url, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLink(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {formData.portfolioLinks.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Aucun lien ajouté. Ajoutez vos profils LinkedIn, GitHub, etc.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isLoading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Précédent
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  className="campus-gradient text-white hover:opacity-90"
                  disabled={isLoading}
                >
                  Suivant
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="campus-gradient text-white hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inscription en cours...
                    </>
                  ) : (
                    <>
                  <Check className="mr-2 h-4 w-4" />
                  Terminer l'inscription
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="text-center mt-8 text-sm text-muted-foreground">
              <p>
                En vous connectant, vous acceptez nos{" "}
                <Button variant="link" className="px-0 h-auto text-primary" onClick={() => navigate('/cs-inc/policies/terms')}
                >
                  Conditions d'utilisation
                </Button> et notre{" "}
                <Button variant="link" className="px-0 h-auto text-primary" onClick={() => navigate('/cs-inc/policies/privacy')}
                >
                  Politique de confidentialité
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <span className="text-muted-foreground text-sm">
            Déjà un compte ?{" "}
          </span>
          <Button 
            variant="link" 
            className="px-0 text-primary"
            onClick={() => navigate('/login')}
          >
            Se connecter
          </Button>
        </div>
      </div>
    </div>
  );
}