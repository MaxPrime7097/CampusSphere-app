import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { MagnifyingGlass as Search, Question as HelpCircle } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

interface FAQItem {
  q: string;
  a: React.ReactNode;
  aText: string;
}

interface FAQCategory {
  title: string;
  questions: FAQItem[];
}

export function FAQ(): JSX.Element {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories: FAQCategory[] = [
    {
      title: "1. Compte & Inscription",
      questions: [
        {
          q: "Comment créer un compte sur CampusSphere ?",
          aText: "Cliquez sur 'S'inscrire' en haut de la page et suivez le processus d'inscription en 3 étapes simples : vos informations personnelles, vos informations académiques (université, filière, niveau), et vos centres d'intérêt ou compétences.",
          a: (
            <span>
              Cliquez sur <Link to="/register" className="text-primary hover:underline font-bold">S'inscrire</Link> en haut de la page et suivez le processus d'inscription en 3 étapes simples : vos informations personnelles, vos informations académiques (université, filière, niveau), et vos centres d'intérêt ou compétences.
            </span>
          )
        },
        {
          q: "Quel est l'âge minimum requis pour s'inscrire ?",
          aText: "L'accès à CampusSphere et Sphera est strictement réservé aux utilisateurs âgés d'au moins 16 ans. Pour les étudiants mineurs âgés de 16 à 18 ans, l'inscription requiert le consentement préalable de l'autorité parentale ou du tuteur légal, conformément à nos Conditions Générales d'Utilisation.",
          a: (
            <span>
              L'accès à CampusSphere et Sphera est strictement réservé aux utilisateurs âgés d'au moins <strong>16 ans</strong>. Pour les étudiants mineurs âgés de 16 à 18 ans, l'inscription requiert le consentement préalable de l'autorité parentale ou du tuteur légal, conformément à nos <Link to="/cs-inc/policies/terms" className="text-primary hover:underline font-bold">Conditions Générales d'Utilisation</Link>.
            </span>
          )
        },
        {
          q: "Puis-je modifier mes informations après l'inscription ?",
          aText: "Oui, vous pouvez modifier vos informations personnelles, académiques, photo de profil et bio à tout moment en accédant à votre profil et en cliquant sur 'Modifier le profil'.",
          a: "Oui, vous pouvez modifier vos informations personnelles, académiques, photo de profil et bio à tout moment en accédant à votre profil et en cliquant sur 'Modifier le profil'."
        },
        {
          q: "Comment vérifier mon compte étudiant ?",
          aText: "La vérification s'effectue soit automatiquement avec votre adresse email institutionnelle/universitaire valide, soit en soumettant un justificatif de scolarité (carte d'étudiant ou certificat d'inscription) vérifié manuellement par notre équipe.",
          a: "La vérification s'effectue soit automatiquement avec votre adresse email institutionnelle/universitaire valide, soit en soumettant un justificatif de scolarité (carte d'étudiant ou certificat d'inscription) vérifié manuellement par notre équipe."
        }
      ]
    },
    {
      title: "2. Sphères & Communautés",
      questions: [
        {
          q: "Qu'est-ce qu'une Sphère sur CampusSphere ?",
          aText: "Une Sphère est un espace communautaire thématique dédié à vos études. Elle peut regrouper une promotion, un cours spécifique, une filière académique ou un club étudiant, permettant d'échanger des messages, partager des ressources et poser des questions.",
          a: "Une Sphère est un espace communautaire thématique dédié à vos études. Elle peut regrouper une promotion, un cours spécifique, une filière académique ou un club étudiant, permettant d'échanger des messages, partager des ressources et poser des questions."
        },
        {
          q: "Comment rejoindre une Sphère existante ?",
          aText: "Accédez à l'onglet 'Sphères', utilisez le moteur de recherche pour trouver la sphère de votre établissement ou de votre matière, puis cliquez sur 'Rejoindre'. Les sphères publiques sont accessibles instantanément, tandis que les sphères privées nécessitent l'approbation d'un modérateur.",
          a: "Accédez à l'onglet 'Sphères', utilisez le moteur de recherche pour trouver la sphère de votre établissement ou de votre matière, puis cliquez sur 'Rejoindre'. Les sphères publiques sont accessibles instantanément, tandis que les sphères privées nécessitent l'approbation d'un modérateur."
        },
        {
          q: "Puis-je créer ma propre Sphère d'études ?",
          aText: "Oui, tous les étudiants inscrits et vérifiés peuvent créer des Sphères. Vous pouvez définir la visibilité (publique ou privée), la description, ainsi que les règles internes de la communauté.",
          a: "Oui, tous les étudiants inscrits et vérifiés peuvent créer des Sphères. Vous pouvez définir la visibilité (publique ou privée), la description, ainsi que les règles internes de la communauté."
        },
        {
          q: "Comment fonctionne la modération au sein d'une Sphère ?",
          aText: "Le créateur de la sphère et les modérateurs qu'il nomme peuvent gérer les membres, approuver ou supprimer des publications, et veiller au respect de nos Règles de la Communauté.",
          a: (
            <span>
              Le créateur de la sphère et les modérateurs qu'il nomme peuvent gérer les membres, approuver ou supprimer des publications, et veiller au respect de nos <Link to="/cs-inc/policies/community-guidelines" className="text-primary hover:underline font-bold">Règles de la Communauté</Link>.
            </span>
          )
        }
      ]
    },
    {
      title: "3. Sphera & Intelligence Artificielle",
      questions: [
        {
          q: "Qu'est-ce que Sphera et comment m'aide-t-elle à réviser ?",
          aText: "Sphera est l'assistante d'apprentissage intelligente propulsée par l'IA au sein de l'écosystème CampusSphere. Elle analyse vos cours et documents académiques (PDF, cours magistraux) pour générer automatiquement des fiches de synthèse structurées, des quiz interactifs, des flashcards et des exercices d'entraînement aux examens.",
          a: (
            <span>
              Sphera est l'assistante d'apprentissage intelligente intégrée à l'écosystème CampusSphere. Elle analyse vos supports de cours pour générer automatiquement des <strong>fiches de synthèse structurées</strong>, des <strong>quiz interactifs</strong>, des <strong>flashcards de mémorisation</strong> et des entraînements d'annales personnalisés.
            </span>
          )
        },
        {
          q: "Dois-je créer un compte distinct pour utiliser Sphera ?",
          aText: "Non ! CampusSphere et Sphera partagent une authentification unifiée (Single Sign-On). Votre compte étudiant CampusSphere vous connecte automatiquement à Sphera sans aucune réinscription requise.",
          a: "Non ! CampusSphere et Sphera partagent une authentification unifiée (Single Sign-On). Votre compte étudiant CampusSphere vous connecte automatiquement à Sphera sans aucune réinscription requise."
        },
        {
          q: "Mes cours et documents sont-ils utilisés pour entraîner des modèles d'IA publics ?",
          aText: "Non. Vos documents et requêtes sont traités via des environnements d'IA sécurisés et isolés (AWS Bedrock et Google Cloud). Ils ne sont jamais utilisés pour entraîner des modèles d'apprentissage publics et restent strictement votre propriété intellectuelle.",
          a: "Non. Vos documents et requêtes sont traités via des environnements d'IA sécurisés et isolés (notamment AWS Bedrock et Google Cloud). Ils ne sont jamais utilisés pour entraîner des modèles d'apprentissage publics et restent strictement confidentiels."
        },
        {
          q: "Sphera fonctionne-t-elle pour toutes les filières universitaires ?",
          aText: "Oui, les algorithmes de Sphera s'adaptent automatiquement au domaine d'études, qu'il s'agisse de sciences, médecine, droit, économie, ingénierie ou lettres.",
          a: "Oui, les algorithmes de Sphera s'adaptent automatiquement au domaine d'études, qu'il s'agisse de sciences, médecine, droit, économie, ingénierie ou lettres."
        }
      ]
    },
    {
      title: "4. Ressources & Bibliothèque Académique",
      questions: [
        {
          q: "Quelle est la différence entre Bibliothèque et Ressources partagées ?",
          aText: "La Bibliothèque regroupe les annales officielles, manuels de référence et supports certifiés mis à disposition de la communauté. L'espace Ressources contient les fiches, résumés et notes de cours partagés librement par les étudiants pour s'entraider.",
          a: "La Bibliothèque regroupe les annales officielles, manuels de référence et supports certifiés mis à disposition de la communauté. L'espace Ressources contient les fiches, résumés et notes de cours partagés librement par les étudiants pour s'entraider."
        },
        {
          q: "Quels formats de fichiers puis-je uploader et où sont-ils stockés ?",
          aText: "Vous pouvez importer des documents aux formats standards (PDF, DOCX, TXT, images). Tous les fichiers sont stockés de manière sécurisée et chiffrée sur Amazon Web Services (AWS S3) avec des protocoles stricts de contrôle d'accès.",
          a: "Vous pouvez importer des documents aux formats standards (PDF, DOCX, TXT, images). Tous les fichiers sont stockés de manière sécurisée et chiffrée sur Amazon Web Services (AWS S3) avec des protocoles stricts de contrôle d'accès."
        },
        {
          q: "Que faire si un document partagé enfreint des droits d'auteur ?",
          aText: "Nous respectons rigoureusement la propriété intellectuelle. Si un contenu viole vos droits d'auteur ou ceux de votre professeur, vous pouvez le signaler directement via le bouton de signalement ou contacter notre équipe légale à policies@campussphere.app pour un retrait immédiat.",
          a: (
            <span>
              Nous respectons rigoureusement la propriété intellectuelle. Si un contenu viole vos droits d'auteur ou ceux d'un enseignant, vous pouvez le signaler via le menu du contenu ou contacter notre équipe légale à <a href="mailto:policies@campussphere.app" className="text-primary hover:underline font-bold">policies@campussphere.app</a> pour un retrait immédiat, conformément à notre <Link to="/cs-inc/policies/copyright" className="text-primary hover:underline font-bold">Politique de Copyright</Link>.
            </span>
          )
        }
      ]
    },
    {
      title: "5. Abonnements, Crédits & Paiements",
      questions: [
        {
          q: "CampusSphere est-il gratuit ?",
          aText: "L'accès à CampusSphere est entièrement gratuit pour les fonctionnalités essentielles : profil, sphères d'études, messagerie et partage de documents. Pour les fonctionnalités d'IA avancées de Sphera (générations volumineuses, modèles haute performance), des pass ou crédits IA sont proposés.",
          a: "L'accès à CampusSphere est entièrement gratuit pour les fonctionnalités essentielles : profil, sphères d'études, messagerie et partage de documents. Pour les fonctionnalités d'IA avancées de Sphera (générations volumineuses, modèles haute performance), des pass ou crédits IA sont proposés."
        },
        {
          q: "Quels sont les moyens de paiement acceptés ?",
          aText: "Pour garantir un accès universel et instantané aux étudiants, les paiements sont traités principalement par Mobile Money (MTN Mobile Money, Orange Money) via la passerelle de paiement certifiée Campay.",
          a: (
            <span>
              Pour garantir un accès universel et instantané aux étudiants, les règlements sont traités directement par <strong>Mobile Money (MTN MoMo, Orange Money)</strong> via la passerelle sécurisée et certifiée <strong>Campay API</strong>. Consultez nos <Link to="/cs-inc/policies/terms-of-sale" className="text-primary hover:underline font-bold">Conditions Générales de Vente (CGV)</Link> pour plus de détails.
            </span>
          )
        },
        {
          q: "Puis-je être remboursé pour un achat de crédits ou d'abonnement ?",
          aText: "Conformément à nos CGV et à la législation sur les contenus numériques, l'exécution du service commence immédiatement dès la validation du paiement. Les crédits ou tokens IA déjà consommés ou les pass entamés ne peuvent faire l'objet d'un remboursement.",
          a: (
            <span>
              Conformément à nos <Link to="/cs-inc/policies/terms-of-sale" className="text-primary hover:underline font-bold">CGV</Link> et à la législation sur les services numériques, l'exécution du service débute immédiatement après le paiement Mobile Money. Les crédits IA ou jetons déjà consommés ne sont pas remboursables. En cas de dysfonctionnement technique avéré lors de la transaction Campay, contactez notre assistance à <a href="mailto:support@campussphere.app" className="text-primary hover:underline font-bold">support@campussphere.app</a>.
            </span>
          )
        }
      ]
    },
    {
      title: "6. Confidentialité, Sécurité & Données",
      questions: [
        {
          q: "Comment mes données personnelles et mes cours sont-ils protégés ?",
          aText: "Nous appliquons les standards de cybersécurité les plus stricts : chiffrement des communications en transit via HTTPS (TLS 1.3) et chiffrement des données au repos (AES-256) sur nos serveurs hébergés sur Render/Microsoft Azure et nos volumes de stockage AWS S3.",
          a: "Nous appliquons les standards de cybersécurité modernes : chiffrement des communications en transit via HTTPS (TLS 1.3) et chiffrement des données au repos (AES-256) sur nos infrastructures cloud (Render et Microsoft Azure) et nos volumes de stockage AWS S3."
        },
        {
          q: "Mes données personnelles sont-elles vendues ou partagées ?",
          aText: "Non. Vos données ne sont jamais vendues, louées ni cédées à des régies publicitaires. Elles ne sont transmises qu'à nos sous-traitants techniques indispensables au fonctionnement de la plateforme (hébergement cloud, stockage de fichiers AWS S3, modèles d'IA sécurisés, passerelle de paiement Campay).",
          a: (
            <span>
              Non. Vos données ne sont <strong>jamais vendues, louées ni cédées à des annonceurs</strong>. Elles ne sont traitées que par nos prestataires d'infrastructure essentiels dans le cadre strict de nos <Link to="/cs-inc/policies/privacy" className="text-primary hover:underline font-bold">Politiques de Confidentialité</Link>.
            </span>
          )
        },
        {
          q: "Comment supprimer définitivement mon compte et toutes mes données ?",
          aText: "Vous pouvez exercer votre droit à l'effacement à tout moment depuis les paramètres de votre compte étudiant, ou en suivant les instructions de notre page officielle de suppression de données. L'ensemble de vos données personnelles, cours privés et historiques sont alors définitivement purgés de nos systèmes.",
          a: (
            <span>
              Vous pouvez exercer votre droit à l'effacement à tout moment depuis les paramètres de votre compte étudiant, ou en suivant les instructions de notre page officielle de <Link to="/cs-inc/policies/data-deletion" className="text-primary hover:underline font-bold">Suppression des données</Link>. L'ensemble de vos données personnelles, documents privés et historiques sont alors définitivement purgés de nos serveurs.
            </span>
          )
        }
      ]
    },
    {
      title: "7. Assistance, Fonctionnalités & Contacts",
      questions: [
        {
          q: "Où en sont la Marketplace et les fonctionnalités à venir ?",
          aText: "La Marketplace d'échange de matériel académique, l'application mobile native pour smartphones et le pôle talents/mentorat sont actuellement en phase finale de développement. Ils seront déployés progressivement sur la plateforme.",
          a: "La Marketplace d'échange de matériel académique, l'application mobile native pour smartphones et le pôle talents/mentorat sont actuellement en phase finale de développement dans notre feuille de route et seront déployés progressivement."
        },
        {
          q: "Comment contacter l'équipe selon mon besoin ?",
          aText: "Pour toute assistance technique, signalement de bug ou réclamation sur un paiement Mobile Money : support@campussphere.app. Pour les questions légales, RGPD, suppression de données ou signalement de copyright : policies@campussphere.app. Pour les partenariats universitaires, relations presse et investisseurs : contact@campussphere.app.",
          a: (
            <div className="space-y-2">
              <p>Nous mettons à votre disposition trois canaux de contact dédiés :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Assistance & Paiements</strong> : <a href="mailto:support@campussphere.app" className="text-primary hover:underline">support@campussphere.app</a></li>
                <li><strong>Juridique, RGPD & Copyright</strong> : <a href="mailto:policies@campussphere.app" className="text-primary hover:underline">policies@campussphere.app</a></li>
                <li><strong>Partenariats & Investisseurs</strong> : <a href="mailto:contact@campussphere.app" className="text-primary hover:underline">contact@campussphere.app</a></li>
              </ul>
            </div>
          )
        }
      ]
    }
  ];

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
           q.aText.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0 || !searchTerm);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqCategories.flatMap((category) =>
      category.questions.map((item) => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.aText
        }
      }))
    )
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Helmet>
        <title>Foire Aux Questions (FAQ) | CampusSphere</title>
        <meta name="description" content="Toutes les réponses à vos questions sur CampusSphere et Sphera IA : création de compte, sphères d'études, révisions IA, paiements Mobile Money Campay et sécurité des données." />
        <link rel="canonical" href="https://campussphere.app/cs-inc/faq" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Foire Aux Questions (FAQ) - CampusSphere" />
        <meta property="og:description" content="Découvrez les réponses aux questions les plus fréquentes sur CampusSphere, Sphera IA et son fonctionnement." />
        <meta property="og:url" content="https://campussphere.app/cs-inc/faq" />
        <meta property="og:image" content="https://campussphere.app/CS.svg" />
        <meta property="og:site_name" content="CampusSphere" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Foire Aux Questions (FAQ) - CampusSphere" />
        <meta name="twitter:description" content="Découvrez les réponses aux questions les plus fréquentes sur CampusSphere, Sphera IA et son fonctionnement." />
        <meta name="twitter:image" content="https://campussphere.app/CS.svg" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      
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
                Trouvez rapidement des réponses à toutes vos questions sur CampusSphere et Sphera.
                Notre FAQ couvre l'ensemble de notre écosystème académique et sécurisé.
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
              <div className="absolute inset-0 campus-gradient opacity-15 blur-3xl"></div>
              <div className="relative campus-glass rounded-3xl p-8 shadow-sm">
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
      <section className="py-12 md:py-20 px-0 bg-card/30">
        <div className="container mx-auto max-w-9xl px-4 sm:px-6 lg:px-8">
          {/* Search */}
          <div id="search-faq" className="mb-12 campus-animate-fade-in">
            <div className="p-0">
              <div className="font-nunito font-semibold relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une question, Sphera, paiement, révision..."
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
              <div 
                key={index} 
                className="p-0 campus-animate-slide-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
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

          {/* Contact CTA Section */}
          <div className="mt-20 text-center">
            <div className="cs-card p-6 sm:p-10 md:p-12 rounded-3xl border border-border/60 campus-animate-fade-in">
              <h2 className="font-raleway text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Vous ne trouvez pas <span className="campus-gradient bg-clip-text text-transparent">votre réponse ?</span>
              </h2>
              <p className="font-nunito font-semibold text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Notre équipe est à votre disposition pour vous assister et répondre à toutes vos questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate('/cs-inc/contact')}
                  className="font-poppins campus-gradient text-white hover:opacity-90 text-base sm:text-lg px-8 py-6 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Contactez-nous 
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.location.href = "mailto:support@campussphere.app"}
                  className="font-poppins border border-border text-foreground hover:bg-accent text-base sm:text-lg px-8 py-6 rounded-lg transition-all duration-300"
                >
                  support@campussphere.app
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
