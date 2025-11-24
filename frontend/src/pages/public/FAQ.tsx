import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, HelpCircle, Sparkles, Heart, Facebook, Twitter, Linkedin, Instagram, Youtube, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function FAQ(): JSX.Element {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories = [
    {
      title: "Compte & Inscription",
      questions: [
        {
          q: "Comment créer un compte sur CampusSphere ?",
          a: "Cliquez sur 'S'inscrire' en haut de la page et suivez le processus d'inscription en 3 étapes : informations personnelles, informations académiques, et formations/compétences."
        },
        {
          q: "Puis-je modifier mes informations après l'inscription ?",
          a: "Oui, vous pouvez modifier vos informations à tout moment en accédant à votre profil et en cliquant sur 'Modifier le profil'."
        },
        {
          q: "Comment vérifier mon compte étudiant ?",
          a: "La vérification se fait automatiquement via votre email universitaire. Vous pouvez également uploader une preuve d'inscription dans les paramètres."
        }
      ]
    },
    {
      title: "Groupes & Communautés",
      questions: [
        {
          q: "Comment rejoindre un groupe ?",
          a: "Allez dans la section 'Groupes', recherchez le groupe qui vous intéresse et cliquez sur 'Rejoindre'. Certains groupes nécessitent l'approbation d'un administrateur."
        },
        {
          q: "Puis-je créer mon propre groupe ?",
          a: "Oui, tous les utilisateurs vérifiés peuvent créer des groupes. Cliquez sur 'Créer un groupe' dans la section Groupes."
        },
        {
          q: "Comment devenir modérateur d'un groupe ?",
          a: "Les administrateurs de groupe peuvent promouvoir des membres actifs au rang de modérateur."
        }
      ]
    },
    {
      title: "Ressources & Bibliothèque",
      questions: [
        {
          q: "Quelle est la différence entre Bibliothèque et Ressources ?",
          a: "La Bibliothèque contient des ressources officielles ajoutées par les administrateurs (cours, livres). Les Ressources sont des fichiers partagés par les étudiants (notes, résumés, exercices)."
        },
        {
          q: "Comment partager une ressource ?",
          a: "Allez dans 'Ressources', cliquez sur 'Partager une ressource' et uploadez votre fichier avec les informations nécessaires."
        },
        {
          q: "Mes ressources partagées sont-elles vérifiées ?",
          a: "Oui, toutes les ressources passent par une modération avant d'être publiées pour garantir la qualité du contenu."
        }
      ]
    },
    {
      title: "Événements",
      questions: [
        {
          q: "Comment créer un événement ?",
          a: "Dans la section Événements, cliquez sur 'Créer un événement', remplissez les informations et publiez-le."
        },
        {
          q: "Puis-je inviter des personnes spécifiques à mon événement ?",
          a: "Oui, lors de la création de l'événement, vous pouvez choisir de le rendre public ou d'inviter des personnes spécifiques."
        }
      ]
    },
    {
      title: "Marketplace",
      questions: [
        {
          q: "Comment vendre un article ?",
          a: "Allez dans Marketplace, cliquez sur 'Vendre un article', ajoutez photos et description, puis publiez votre annonce."
        },
        {
          q: "Y a-t-il des frais pour vendre sur Marketplace ?",
          a: "Non, CampusSphere ne prélève aucun frais sur les transactions entre étudiants."
        }
      ]
    },
    {
      title: "Confidentialité & Sécurité",
      questions: [
        {
          q: "Qui peut voir mes informations ?",
          a: "Vous contrôlez la visibilité de vos informations dans les paramètres de confidentialité. Par défaut, seuls vos camarades d'université peuvent voir votre profil complet."
        },
        {
          q: "Comment signaler un contenu inapproprié ?",
          a: "Cliquez sur les trois points à côté du contenu et sélectionnez 'Signaler'. Notre équipe examinera rapidement le signalement."
        },
        {
          q: "Mes données sont-elles sécurisées ?",
          a: "Oui, nous utilisons un chiffrement de bout en bout et respectons strictement le RGPD. Vos données ne sont jamais partagées avec des tiers."
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
           q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0 || !searchTerm);

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
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="font-poppins text-sm font-medium">Vos questions, nos réponses</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight font-automata text-spacing-1">
                <span className="campus-gradient bg-clip-text text-transparent">
                  Questions
                </span>
                <br />
                <span className="text-foreground">Fréquentes</span>
              </h1>

              <p className="font-nunito font-semibold text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Trouvez rapidement des réponses à toutes vos questions sur CampusSphere.
                Notre FAQ couvre tous les aspects de la plateforme.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={() => document.getElementById('search-faq')?.scrollIntoView({ behavior: 'smooth' })}
                  className="font-poppins campus-gradient text-white hover:opacity-90 text-lg px-8 py-8 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Rechercher une réponse                
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/cs-inc/contact')}
                  className="font-poppins border border-border text-foreground hover:bg-accent text-lg px-8 py-8 rounded-lg transition-all duration-300"
                >
                  Nous contacter
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block campus-animate-slide-up">
              <div className="absolute inset-0 campus-gradient opacity-30 blur-3xl"></div>
              <div className="relative campus-glass rounded-3xl p-8 campus-glow">
                <img
                  src="/Illustrations/FAQs-amico.svg"
                  alt="Questions Fréquentes CampusSphere"
                  loading="lazy"
                  className="w-full h-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Content Section */}
      <section className="py-20 px-0 bg-card/30">
        <div className="container mx-auto max-w-9xl">
          {/* Search */}
          <div id="search-faq" className="mb-12 campus-animate-fade-in">
            <div className="p-0">
              <div className="font-nunito font-semibold relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une question..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 text-base py-6 text-lg border-2 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {filteredCategories.map((category, index) => (
              <div key={index} className="p-0 campus-animate-slide-up animation-delay-${index * 0.1}s">
                <div className="p-0">
                  <h2 className="font-raleway text-2xl font-bold mb-6 campus-gradient bg-clip-text text-transparent">
                    {category.title} 
                  </h2>
                  <Accordion type="single" collapsible className="w-full space-y-4">
                    {category.questions.map((item, qIndex) => (
                      <AccordionItem key={qIndex} value={`item-${index}-${qIndex}`} className="border-2 border-border/50 rounded-lg px-4">
                        <AccordionTrigger className="font-poppins text-left hover:no-underline py-4 hover:bg-accent/50 rounded-lg px-4 -mx-4 transition-colors">
                          <span className="font-semibold text-lg">{item.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="font-nunito font-semibold text-muted-foreground pb-6 px-4 -mx-4 leading-relaxed">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="campus-animate-fade-in">
              <div className="p-0 text-center">
                <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-6 text-lg">
                  Aucune question trouvée pour "{searchTerm}"
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setSearchTerm("")}
                  className="px-8 py-3"
                >
                  Réinitialiser la recherche
                </Button>
              </div>
            </div>
          )}

          {/* Contact CTA */}
        </div>
        <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="campus-card p-8 campus-animate-fade-in">
            <h2 className="font-raleway text-3xl font-bold mb-4">Vous ne trouvez pas <span className="campus-gradient bg-clip-text text-transparent">votre réponse ?</span></h2>
            <p className="font-nunito font-semibold text-lg text-muted-foreground mb-8">
              Notre équipe est là pour vous aider et répondre à toutes vos questions            
            </p>
            <Button
              onClick={() => navigate('/cs-inc/contact')}
              className="font-poppins campus-gradient text-white hover:opacity-90 text-lg px-8 py-8 transition-all duration-300 hover:scale-105 gap-2"
            >
             Contactez-nous 
            </Button>
          </div>
        </div>
      </section>
      </section>

      {/* Footer */}
     <Footer />
    </div>
  );
}
