import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, MapPin, Clock, Send, Sparkles, Heart, CheckCircle, ChevronDown, Loader2 } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { submitContactMessage } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export function Contact(): JSX.Element {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    newsletter: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs obligatoires." });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitContactMessage(formData);
      toast({
        title: "Message envoyé !",
        description: "Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.",
      });
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        newsletter: false
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        variant: "destructive",
        title: "Erreur d'envoi",
        description: "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer plus tard.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      {/* Navigation: brand + links + CTA */}
      <Header />

      {/* Hero Section */}
      <section className="relative py-10 md:py-4 px-0 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 campus-gradient opacity-20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 campus-gradient opacity-20 blur-3xl rounded-full"></div>
        </div>

        <div className="container mx-auto max-w-9xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-8 campus-animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
                <span className="text-sm font-medium font-poppins">Nous sommes là pour vous aider</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight font-automata text-spacing-1">
                <span className="campus-gradient bg-clip-text text-transparent">
                  Contactez-
                </span>
                <span className="text-foreground">nous</span>
              </h1>

              <p className="font-nunito font-semibold text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Nous sommes là pour vous aider ! N'hésitez pas à nous contacter pour toute question ou suggestion.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={() => navigate('/register')}
                  className="font-poppins campus-gradient text-white hover:opacity-90 text-lg px-8 py-8 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Rejoindre la communauté
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/cs-inc/faq')}
                  className="font-poppins border border-border text-foreground hover:bg-accent text-lg px-8 py-8 rounded-lg transition-all duration-300"
                >
                  Questions fréquentes
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block campus-animate-slide-up">
              <div className="absolute inset-0 campus-gradient opacity-30 blur-3xl"></div>
              <div className="relative campus-glass rounded-3xl p-8 campus-glow">
                <img
                  src="/Illustrations/Contact us-amico.svg"
                  alt="Contact CampusSphere"
                  loading="lazy"
                  className="w-full h-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 px-0 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto max-w-9xl">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6 campus-animate-fade-in">
              <h2 className="font-raleway text-3xl font-bold mb-6">Envoyez-nous <span className="campus-gradient bg-clip-text text-transparent">un message</span></h2>
              <p className="font-nunito font-semibold text-lg text-muted-foreground leading-relaxed">
                Vous avez des questions, suggestions ou souhaitez collaborer avec nous ?
                Remplissez le formulaire ci-contre et nous vous répondrons dans les plus brefs délais.
              </p>

              <div className="campus-card p-6">
                <h5 className="font-poppins font-semibold mb-4 text-foreground">Conseils pour un message efficace :</h5>
                <ul className="font-nunito font-semibold space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Précisez clairement le sujet de votre demande</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Incluez tous les détails nécessaires</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Vérifiez votre adresse email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Nous répondons généralement sous 24h</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-0 campus-animate-slide-up animation-delay-2s lg:campus-card">
              <form onSubmit={handleSubmit} className="font-poppins space-y-6 p-0 md:p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-semibold">Nom complet *</Label>
                    <Input
                      id="name"
                      placeholder="Votre nom complet"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="border-2 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-semibold">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre.email@exemple.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="border-2 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-foreground font-semibold">Sujet *</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger className="border-2 focus:border-primary">
                      <SelectValue placeholder="Sélectionnez un sujet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Question générale">Question générale</SelectItem>
                      <SelectItem value="Problème technique">Problème technique</SelectItem>
                      <SelectItem value="Suggestion d'amélioration">Suggestion d'amélioration</SelectItem>
                      <SelectItem value="Signalement de bug">Signalement de bug</SelectItem>
                      <SelectItem value="Demande de fonctionnalité">Demande de fonctionnalité</SelectItem>
                      <SelectItem value="Partenariat">Partenariat</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-foreground font-semibold">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Décrivez votre demande en détail..."
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    className="border-2 focus:border-primary resize-none"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newsletter"
                    checked={formData.newsletter}
                    onCheckedChange={(checked) => setFormData({ ...formData, newsletter: checked as boolean })}
                  />
                  <Label htmlFor="newsletter" className="text-sm text-muted-foreground">
                    Je souhaite recevoir les actualités de CampusSphere
                  </Label>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full campus-gradient text-white hover:opacity-90 text-lg py-8 transition-all duration-300 hover:scale-105 gap-2"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
        {/* Social Media Section */}
        <div className="container mx-auto max-w-9xl mt-5">
          <div className="text-center mb-10">
            <h2 className="font-raleway text-3xl md:text-4xl font-bold mb-4 campus-animate-fade-in">
              Suivez<span className="campus-gradient bg-clip-text text-transparent">-nous</span>
            </h2>
            <p className="font-nunito font-semibold text-xl text-muted-foreground">
              Restez connecté avec CampusSphere et découvrez nos dernières actualités
            </p>
          </div>

          <div className="flex justify-center gap-5 mb-0">
            <a href="https://web.facebook.com/campussphereofficial" target='blank' className="w-16 h-16 campus-gradient rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-300 hover:shadow-lg group">
              <FaFacebook className="w-8 h-8 group-hover:animate-pulse" />
            </a>
            <a href="https://www.linkedin.com/company/campussphere" target='blank' className="w-16 h-16 campus-gradient rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-300 hover:shadow-lg group">
              <FaLinkedin className="w-8 h-8 group-hover:animate-pulse" />
            </a>
            <a href="https://www.instagram.com/campussphere" target='blank' className="w-16 h-16 campus-gradient rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-300 hover:shadow-lg group">
              <FaInstagram className="w-8 h-8 group-hover:animate-pulse" />
            </a>
            <a href="https://www.tiktok.com/@campussphere.app" target='blank' className="w-16 h-16 campus-gradient rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-300 hover:shadow-lg group">
              <FaTiktok className="w-8 h-8 group-hover:animate-pulse" />
            </a>
          </div>
        </div>
      </section>


      {/* FAQ Link Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="campus-card p-8 campus-animate-fade-in">
            <h2 className="font-raleway text-3xl font-bold mb-4">Questions <span className="campus-gradient bg-clip-text text-transparent">fréquentes ?</span></h2>
            <p className="font-nunito font-semibold text-lg text-muted-foreground mb-8">
              Consultez notre FAQ pour trouver rapidement des réponses aux questions les plus courantes.
            </p>
            <Button
              onClick={() => navigate('/cs-inc/faq')}
              className="font-poppins campus-gradient text-white hover:opacity-90 text-lg px-8 py-8 transition-all duration-300 hover:scale-105 gap-2"
            >
              Voir la FAQ
            </Button>
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </div>
  );
}
