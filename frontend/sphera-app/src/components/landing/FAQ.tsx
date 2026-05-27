import React from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "Qu'est-ce que Sphera ?",
    answer: "Sphera est un assistant d'apprentissage intelligent basé sur l'intelligence artificielle. Il analyse tes cours et documents pour générer automatiquement des fiches de révision structurées, des quiz interactifs et des flashcards, le tout conçu pour maximiser ta rétention d'information."
  },
  {
    question: "Comment fonctionne la génération de fiches ?",
    answer: "Il suffit de téléverser ton document (PDF, DOCX) ou de coller ton texte. Sphera va l'analyser, extraire les concepts clés, formater les définitions et te proposer une fiche de révision claire et prête à être étudiée, ainsi qu'un quiz sur mesure pour te tester."
  },
  {
    question: "Est-ce que je peux partager mes fiches de révision ?",
    answer: "Oui, absolument ! Sphera te permet de créer des espaces collaboratifs avec tes camarades de classe. Tu peux également générer un lien public pour partager une session de révision spécifique avec n'importe qui."
  },
  {
    question: "Combien coûte l'utilisation de Sphera ?",
    answer: "Sphera propose une version gratuite qui te permet d'explorer les fonctionnalités de base. Pour ceux qui veulent aller plus loin (génération illimitée, intégration avancée d'annales, modèles d'IA plus puissants), nous proposons un plan Premium très accessible. Plus d'informations sur notre page Tarifs."
  },
  {
    question: "Mes documents sont-ils en sécurité ?",
    answer: "La sécurité de tes données est notre priorité. Tes documents sont chiffrés et ne sont utilisés que pour générer ton matériel de révision. Ils ne sont jamais revendus ni utilisés pour entraîner des modèles publics sans ton consentement."
  },
  {
    question: "Sphera fonctionne-t-il pour toutes les filières ?",
    answer: "Oui ! L'IA de Sphera s'adapte au contexte de tes documents, que tu étudies le droit, la médecine, l'ingénierie, ou les lettres. Sphera détecte automatiquement la structure de ton cours pour s'y adapter."
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
            Tout ce que tu as besoin de savoir sur Sphera.
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
