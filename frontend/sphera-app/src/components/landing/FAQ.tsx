import React from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "Qu'est-ce que Sphera ?",
    answer: "Sphera est une assistante d'apprentissage intelligente basée sur l'intelligence artificielle. Elle analyse tes cours et documents pour générer automatiquement des fiches de révision structurées, des quiz interactifs et des flashcards, le tout conçu pour maximiser ta rétention d'information."
  },
  {
    question: "Qu'est-ce que Sphera Live et comment ça marche ?",
    answer: "Sphera Live est notre mode multijoueur en direct. Un hôte crée ou génère un quiz (à partir d'un PDF, d'un lien CampusSphere ou manuellement), puis lance une salle d'attente. Les participants entrent le code à 6 lettres sur leur téléphone ou ordinateur pour répondre en direct. Les questions défilent avec un timer synchronisé, un classement instantané et un podium final avec confettis."
  },
  {
    question: "Faut-il un compte pour utiliser Sphera et Sphera Live ?",
    answer: "Oui, un compte est nécessaire pour accéder à Sphera. Si tu es déjà inscrit sur CampusSphere, ton compte est directement synchronisé grâce au SSO en 1 clic (aucune réinscription requise). L'hôte comme les participants se connectent avec leur compte pour créer les sessions, rejoindre les parties en direct et retrouver leur historique."
  },
  {
    question: "Comment fonctionne la génération de fiches et quiz ?",
    answer: "Il suffit de téléverser ton document (PDF, DOCX, TXT) ou de coller un lien CampusSphere. Sphera l'analyse, extrait les concepts clés, formate les définitions et te propose une fiche de révision claire, un quiz ciblé et des flashcards recto/verso prêtes à être étudiées."
  },
  {
    question: "Est-ce que je peux partager mes fiches de révision ?",
    answer: "Oui, absolument ! Sphera te permet de créer des espaces de révision avec tous les outils nécessaires. Tu peux également générer un lien public pour partager une session de révision spécifique avec tes camarades de promotion."
  },
  {
    question: "Combien coûte l'utilisation de Sphera ?",
    answer: "Sphera propose un accès gratuit complet pour démarrer et tester tous les outils, y compris Sphera Live. Des formules premium avancées seront proposées pour les étudiants souhaitant des quotas illimités et des fonctionnalités analytiques poussées."
  },
  {
    question: "Mes documents sont-ils en sécurité ?",
    answer: "La sécurité et la confidentialité de tes données sont notre priorité absolue. Tes documents sont chiffrés et ne sont utilisés que pour générer ton matériel pédagogique personnel. Ils ne sont jamais revendus ni partagés avec des tiers."
  },
  {
    question: "Sphera fonctionne-t-il pour toutes les filières ?",
    answer: "Oui ! L'IA de Sphera s'adapte à tous les domaines d'études : droit, médecine, ingénierie, sciences économiques, lettres ou prépas. Elle comprend le vocabulaire technique propre à chaque discipline."
  }
];

export function FAQ() {
  return (
    <section className="py-24 bg-sphera-bg relative overflow-hidden" id="faq">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sphera-green/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            Questions fréquentes
          </h2>
          <p className="text-xl text-sphera-text-muted">
            Tout ce que tu as besoin de savoir sur Sphera et Sphera Live.
          </p>
        </div>

        <Accordion.Root type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <Accordion.Item
              key={index}
              value={`item-${index}`}
              className="bg-sphera-surface border border-sphera-border rounded-xl overflow-hidden transition-all duration-300 hover:border-sphera-green/50 data-[state=open]:border-sphera-green/50 data-[state=open]:shadow-[0_0_20px_rgba(34,197,94,0.1)]"
            >
              <Accordion.Header className="flex">
                <Accordion.Trigger className="flex flex-1 items-center justify-between py-5 px-6 text-left group">
                  <span className="font-semibold text-white group-hover:text-sphera-green transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className="w-5 h-5 text-sphera-text-muted transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:rotate-180 group-data-[state=open]:text-sphera-green"
                    aria-hidden
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden text-sphera-text-muted text-sm md:text-base data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
                <div className="px-6 pb-5 leading-relaxed opacity-90">
                  {faq.answer}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
