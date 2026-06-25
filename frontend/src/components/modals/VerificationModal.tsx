import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Shield, Check, Loader2, AlertCircle, Info } from "lucide-react";
import { verifyStudentStatus, getCurrentUser } from "@/services/api";
import { cn } from "@/lib/utils";

interface VerificationModalProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function VerificationModal({ children, onSuccess, open: controlledOpen, onOpenChange: setControlledOpen }: VerificationModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  const [step, setStep] = useState(1);
  const [matricule, setMatricule] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifiedImmediately, setIsVerifiedImmediately] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      getCurrentUser().then(user => {
        if (user?.studentId) setMatricule(user.studentId);
      }).catch(() => {});
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop lourd",
          description: "L'image ne doit pas dépasser 10 Mo.",
          variant: "destructive",
        });
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!matricule.trim() || !image) {
      toast({
        title: "Champs manquants",
        description: "Veuillez renseigner votre matricule et fournir une photo de votre preuve (carte, reçu...).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await verifyStudentStatus(matricule, image);
      const isVerified = response?.verified === true;
      setIsVerifiedImmediately(isVerified);
      setStep(3);
      
      if (isVerified) {
        toast({
          title: "Félicitations ! 🎉",
          description: "L'IA a certifié ton statut instantanément. Tu es désormais un étudiant certifié !",
        });
      } else {
        toast({
          title: "Demande envoyée !",
          description: "Votre statut sera vérifié par nos administrateurs très prochainement.",
        });
      }
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur lors de l'envoi",
        description: error?.message || "Impossible d'envoyer votre demande pour le moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setMatricule("");
    setImage(null);
    setPreview(null);
    setIsSubmitting(false);
    setIsVerifiedImmediately(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) reset(); }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] overflow-hidden p-0 border-none bg-card shadow-2xl">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x" />
        
        <div className="p-6">
          <div className="relative">
            {step === 1 && (
              <div
                key="step1"
                className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
              >
                <DialogHeader>
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <DialogTitle className="text-2xl font-bold text-center">Certifiez votre statut</DialogTitle>
                  <DialogDescription className="text-center text-base">
                    Pour garantir un environnement sain et sécurisé, la publication est réservée aux étudiants certifiés.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-accent/50">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <p className="text-sm">Publiez des posts et des ressources</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-accent/50">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <p className="text-sm">Créez et gérez vos propres Sphères</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-accent/50">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <p className="text-sm">Obtenez le badge "Étudiant Certifié"</p>
                  </div>
                </div>

                <Button className="w-full campus-gradient h-12 text-lg" onClick={() => setStep(2)}>
                  Commencer la certification
                </Button>
              </div>
            )}

            {step === 2 && (
              <div
                key="step2"
                className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
              >
                <DialogHeader>
                  <DialogTitle>Vos informations</DialogTitle>
                  <DialogDescription>
                    Entrez votre matricule officiel et uploadez une preuve de votre statut étudiant (carte, reçu, certificat...).
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="matricule">N° de Matricule</Label>
                    <Input 
                      id="matricule" 
                      placeholder="Ex: 22A0456" 
                      value={matricule}
                      onChange={(e) => setMatricule(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preuve de statut étudiant <span className="text-muted-foreground">(Carte, reçu de paiement, certificat de scolarité...)</span></Label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "relative h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-muted/30 hover:bg-muted/50",
                        preview ? "border-primary/50" : "border-muted-foreground/30"
                      )}
                    >
                      {preview ? (
                        <div className="relative w-full h-full">
                          <img src={preview} alt="Aperçu preuve" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <p className="text-white text-sm font-medium">Changer la photo</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 bg-primary/10 rounded-full mb-3">
                            <Camera className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-sm font-medium">Prendre en photo ou uploader</p>
                          <p className="text-xs text-muted-foreground mt-1">Format JPG, PNG (Max 10Mo)</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="flex items-center gap-2 p-2 px-3 bg-blue-500/10 text-blue-600 rounded-lg text-xs">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    Vos données sont sécurisées et utilisées uniquement pour la vérification.
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setStep(1)} disabled={isSubmitting}>
                    Retour
                  </Button>
                  <Button 
                    className="flex-[2] campus-gradient" 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !matricule || !image}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      "Soumettre"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div
                key="step3"
                className="py-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300"
              >
                <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    {isVerifiedImmediately ? "Certification réussie !" : "Demande reçue !"}
                  </h3>
                  <p className="text-muted-foreground mt-2 px-4">
                    {isVerifiedImmediately 
                      ? "L'intelligence artificielle a validé ton document. Ton badge de certification est maintenant actif !" 
                      : "Notre équipe vérifie manuellement chaque document pour garantir l'authenticité de la communauté."}
                  </p>
                </div>
                {!isVerifiedImmediately && (
                  <div className="p-4 bg-muted/30 rounded-xl mx-4 text-sm flex items-start gap-3 text-left">
                    <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p>Le délai moyen de traitement est de <strong>24h à 48h</strong>. Vous recevrez une notification une fois validé.</p>
                  </div>
                )}
                {isVerifiedImmediately && (
                  <div className="p-4 bg-primary/10 rounded-xl mx-4 text-sm flex items-start gap-3 text-left border border-primary/20">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p>Tu peux désormais publier des ressources et accéder à toutes les fonctionnalités premium !</p>
                  </div>
                )}
                <Button className="w-full max-w-[200px]" onClick={() => setOpen(false)}>
                  Fermer
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
