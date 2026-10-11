import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  Buildings,
  CheckCircle,
  PaperPlaneTilt as Send,
  Sparkle as Sparkles,
  Users,
  CalendarCheck,
  ShieldCheck,
  Spinner as Loader2,
  ArrowRight,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { submitPartnerApplication } from "@/services/api";

export function BecomePartner(): JSX.Element {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "",
    organizationType: "entreprise",
    contactEmail: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organizationName.trim() || !formData.contactEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Champs requis",
        description: "Veuillez renseigner au moins le nom de l'organisation et l'email de contact.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPartnerApplication(formData);
      setIsSuccess(true);
      toast({
        title: "Candidature transmise !",
        description: "Notre équipe a bien reçu votre demande et vous recontactera sous 48h.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de l'envoi de votre candidature.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex flex-col justify-between">
      <Helmet>
        <title>Devenir Impact Partner | CampusSphere</title>
        <meta
          name="description"
          content="Rejoignez les Impact Partners de CampusSphere : publiez vos opportunités, organisez vos événements et engagez la communauté étudiante."
        />
      </Helmet>

      <Header />

      <main className="container max-w-5xl mx-auto px-4 py-12 md:py-20 flex-1">
        {/* En-tête Hero */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="h-4 w-4" />
            Programme Impact Partners
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground font-automata mb-4">
            Donnez de la visibilité à votre organisation auprès des étudiants
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Entreprises, clubs universitaires, associations et institutions : devenez partenaire officiel de CampusSphere pour toucher directement les Spherians.
          </p>
        </div>

        {/* Section Avantages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 text-primary rounded-xl mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base mb-2">Audience ciblée & Abonnés</h3>
            <p className="text-sm text-muted-foreground">
              Les étudiants peuvent suivre votre page officielle. Vos annonces et offres apparaissent directement dans leur flux d'actualité.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col items-center text-center">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl mb-4">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base mb-2">Événements & Hackathons</h3>
            <p className="text-sm text-muted-foreground">
              Organisez des talks, journées portes ouvertes, sessions de recrutement ou ateliers techniques visibles par l'ensemble du campus.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col items-center text-center">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base mb-2">Badge Officiel & Sphères</h3>
            <p className="text-sm text-muted-foreground">
              Bénéficiez du badge certifié Impact Partner et animez des Sphères officielles pour fédérer durablement vos membres.
            </p>
          </div>
        </div>

        {/* Formulaire ou Message de succès */}
        <div className="max-w-xl mx-auto">
          {isSuccess ? (
            <Card className="border-border/60 shadow-lg text-center p-8 bg-card/80 backdrop-blur-sm animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold font-automata mb-2">Candidature envoyée !</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Merci pour votre intérêt ! L'équipe CampusSphere examine votre demande et vous recontactera sous 48h à l'adresse <strong>{formData.contactEmail}</strong> pour activer vos accès.
              </p>
              <div className="flex justify-center gap-3">
                <Button asChild variant="outline">
                  <Link to="/">Retour à l'accueil</Link>
                </Button>
                <Button
                  onClick={() => {
                    setIsSuccess(false);
                    setFormData({
                      organizationName: "",
                      organizationType: "entreprise",
                      contactEmail: "",
                      description: "",
                    });
                  }}
                >
                  Envoyer une autre candidature
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="border-border/60 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold font-automata flex items-center gap-2">
                    <Buildings className="h-5 w-5 text-primary" />
                    Formulaire de candidature
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Validation manuelle par l'équipe CampusSphere avant activation.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="orgName">Nom de l'organisation *</Label>
                    <Input
                      id="orgName"
                      placeholder="Ex : Tech Solutions, Club Informatique, Association IA..."
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="orgType">Type d'organisation *</Label>
                    <Select
                      value={formData.organizationType}
                      onValueChange={(val) => setFormData({ ...formData, organizationType: val })}
                    >
                      <SelectTrigger id="orgType">
                        <SelectValue placeholder="Sélectionnez le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entreprise">Entreprise</SelectItem>
                        <SelectItem value="club">Club universitaire / étudiant</SelectItem>
                        <SelectItem value="association">Association</SelectItem>
                        <SelectItem value="institution">Institution / École</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contactEmail">Email de contact officiel *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="contact@organisation.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="desc">Présentation & Objectifs</Label>
                    <Textarea
                      id="desc"
                      rows={4}
                      placeholder="Présentez brièvement vos activités et les opportunités que vous souhaitez proposer aux Spherians (stages, événements, hackathons...)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full mt-2" size="lg">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Transmission en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer ma candidature
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
export default BecomePartner;
