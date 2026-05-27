export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: React.ReactNode | string;
  category: string;
  date: string;
  readTime: string;
  imageUrl: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Comment l'Intelligence Artificielle révolutionne les révisions à l'université",
    excerpt: "Découvrez comment les nouveaux modèles de langage peuvent diviser votre temps de révision par deux tout en améliorant votre mémorisation à long terme.",
    category: "IA & Éducation",
    date: "25 Mai 2026",
    readTime: "5 min",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Une nouvelle ère pour l'éducation</h2>
      <p>L'intelligence artificielle n'est plus un simple concept de science-fiction. Elle est désormais dans la poche de chaque étudiant. Mais comment l'utiliser efficacement sans tomber dans la triche ou la paresse intellectuelle ?</p>
      
      <h3>1. La synthèse automatisée</h3>
      <p>Le plus grand avantage de l'IA aujourd'hui, c'est sa capacité à ingérer des centaines de pages de PDF (cours magistraux, articles scientifiques) et d'en extraire les concepts vitaux en quelques secondes. Des outils comme Sphera ne se contentent pas de résumer, ils restructurent la donnée pour la rendre <i>digeste</i>.</p>
      
      <h3>2. Le test actif (Active Recall)</h3>
      <p>La science cognitive est claire : relire un cours ne sert presque à rien. Pour mémoriser, il faut se tester. L'IA permet de générer instantanément des quiz complexes, des flashcards et des QCM basés spécifiquement sur le cours du professeur. Fini le temps perdu à créer ses propres fiches !</p>
      
      <h2>Le piège de "l'hallucination"</h2>
      <p>Il est crucial de garder un œil critique. L'IA peut parfois inventer des faits (les fameuses hallucinations). C'est pourquoi utiliser une IA bridée et restreinte au contexte de <strong>votre document</strong> (comme le fait Sphera) est la seule méthode fiable pour les révisions académiques.</p>
    `
  },
  {
    id: 2,
    title: "La méthode Pomodoro couplée aux Flashcards : Le duo gagnant",
    excerpt: "Une analyse détaillée de la répétition espacée et de la gestion du temps pour les étudiants en médecine et en droit.",
    category: "Méthodologie",
    date: "12 Mai 2026",
    readTime: "8 min",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Qu'est-ce que la méthode Pomodoro ?</h2>
      <p>Développée dans les années 80 par Francesco Cirillo, cette méthode consiste à travailler par blocs de 25 minutes (les "pomodoros"), séparés par de courtes pauses de 5 minutes. Après 4 pomodoros, on prend une pause longue de 15 à 30 minutes.</p>
      
      <h3>Pourquoi ça marche ?</h3>
      <p>Le cerveau humain a une capacité de concentration optimale limitée dans le temps. En imposant des pauses, on prévient la fatigue cognitive. De plus, le chronomètre crée un sentiment d'urgence positif qui réduit la procrastination.</p>
      
      <h2>L'intégration des Flashcards</h2>
      <p>Pendant un Pomodoro de 25 minutes, la meilleure activité possible n'est pas de lire, mais de s'auto-évaluer. C'est là que les Flashcards (cartes mémoire) entrent en jeu, utilisant le principe de <strong>répétition espacée</strong>.</p>
      <ul>
        <li><strong>Pomodoro 1 :</strong> Apprentissage des nouvelles flashcards générées par l'IA de Sphera.</li>
        <li><strong>Pomodoro 2 :</strong> Révision des flashcards de la veille.</li>
        <li><strong>Pomodoro 3 & 4 :</strong> Création de liens logiques et QCM globaux.</li>
      </ul>
      <p>En combinant cette gestion du temps et cette méthode d'apprentissage actif, les résultats aux examens connaissent souvent une amélioration fulgurante.</p>
    `
  },
  {
    id: 3,
    title: "Gérer son stress avant les partiels : 5 conseils pratiques",
    excerpt: "Le stress des examens est normal, mais il peut être contrôlé. Voici les techniques recommandées par les experts pour rester serein le jour J.",
    category: "Bien-être étudiant",
    date: "2 Mai 2026",
    readTime: "4 min",
    imageUrl: "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Comprendre le stress</h2>
      <p>Le stress n'est pas votre ennemi. C'est une réaction physiologique conçue pour vous préparer à l'action. Cependant, lorsqu'il devient chronique ou paralysant, il faut agir.</p>
      
      <h3>1. La planification anti-panique</h3>
      <p>Le stress naît souvent de l'incertitude. Faites un planning de révision réaliste 3 semaines avant les partiels. Savoir exactement ce que vous devez faire chaque jour réduit drastiquement l'anxiété.</p>
      
      <h3>2. La règle des 8 heures</h3>
      <p>Sacrifier son sommeil pour réviser est la pire stratégie possible. Le sommeil paradoxal est le moment où le cerveau consolide les apprentissages de la journée. Dormez 8 heures, c'est non négociable.</p>
      
      <h3>3. Exercice de respiration (Cohérence cardiaque)</h3>
      <p>Inspirez sur 5 secondes, expirez sur 5 secondes, pendant 5 minutes. Faites cela avant d'entrer dans la salle d'examen. Cela fait baisser mécaniquement le rythme cardiaque et le taux de cortisol.</p>
      
      <h3>4. Testez-vous en conditions réelles</h3>
      <p>Le cerveau a peur de l'inconnu. Utilisez les "Annales" sur Sphera avec un minuteur pour simuler l'examen. Plus vous vous testerez dans ces conditions, moins le jour J vous paraîtra effrayant.</p>
      
      <h3>5. Évitez la panique de dernière minute</h3>
      <p>Fuyez les étudiants qui posent des questions stressantes devant la salle d'examen. Écoutez de la musique, concentrez-vous sur vous-même.</p>
    `
  },
  {
    id: 4,
    title: "Annales corrigées vs Cours bruts : Que privilégier ?",
    excerpt: "Faut-il passer plus de temps à apprendre son cours ou à faire des annales ? La réponse pourrait vous surprendre.",
    category: "Stratégie",
    date: "18 Avril 2026",
    readTime: "6 min",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Le dilemme de l'étudiant</h2>
      <p>Nous avons tous été confrontés à ce choix à l'approche des partiels : dois-je relire mon cours de 200 pages pour la troisième fois, ou dois-je attaquer les sujets des 5 dernières années ?</p>
      
      <h3>L'illusion de compétence</h3>
      <p>Relire un cours donne l'impression de maîtriser le sujet. C'est ce qu'on appelle "l'illusion de fluidité". Le texte est familier, donc on pense le connaître. Mais face à une copie blanche, c'est souvent le trou noir.</p>
      
      <h2>La suprématie des Annales</h2>
      <p>Faire des annales est la méthode la plus efficace pour trois raisons :</p>
      <ol>
        <li><strong>Familiarisation avec l'examinateur :</strong> Les professeurs ont souvent des marottes, des questions qui reviennent sous différentes formes.</li>
        <li><strong>Entraînement au format :</strong> Une dissertation ne demande pas les mêmes compétences qu'un QCM. Les annales vous entraînent au format spécifique de l'épreuve.</li>
        <li><strong>Identification des failles :</strong> Vous découvrirez immédiatement ce que vous ne savez pas, vous permettant de cibler vos révisions de cours de manière chirurgicale.</li>
      </ol>
      
      <p><em>Notre conseil :</em> Dédiez 30% de votre temps à la compréhension du cours, et 70% à la pratique sur des annales. Utilisez l'outil d'Annales de Sphera pour générer des corrections détaillées si vous ne les avez pas !</p>
    `
  },
  {
    id: 5,
    title: "CampusSphere Sphera V2 : Quoi de neuf ?",
    excerpt: "Nous avons entièrement repensé notre moteur d'analyse. Découvrez les nouvelles fonctionnalités de génération de quiz et de fiches de révision.",
    category: "Mises à jour",
    date: "5 Avril 2026",
    readTime: "3 min",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Une mise à jour massive</h2>
      <p>La V2 de Sphera n'est pas qu'une simple mise à jour visuelle. C'est une refonte complète de notre moteur d'Intelligence Artificielle pour vous offrir des résultats encore plus précis et rapides.</p>
      
      <h3>Génération de Quiz dynamique</h3>
      <p>Notre nouvel algorithme ne se contente plus de poser des questions de cours basiques. Il est désormais capable de générer des problèmes de réflexion et des mises en situation, imitant les questions pièges des partiels.</p>
      
      <h3>Mode Rapide vs Mode Complet</h3>
      <p>Vous êtes pressé ? Le nouveau <strong>Mode Rapide</strong> génère l'essentiel d'un document en moins de 5 secondes. Pour une analyse en profondeur, le <strong>Mode Complet</strong> décortique chaque paragraphe pour ne rien laisser au hasard.</p>
      
      <h3>Espaces collaboratifs améliorés</h3>
      <p>Il est désormais possible de générer des liens de partage publics pour vos sessions de révision. Fini les transferts de PDF lourds, envoyez simplement un lien à vos amis pour qu'ils accèdent à vos fiches, flashcards et quiz !</p>
    `
  },
  {
    id: 6,
    title: "L'importance des groupes de travail (et comment les rendre efficaces)",
    excerpt: "Réviser à plusieurs peut être très bénéfique, à condition de suivre certaines règles pour éviter que la session ne se transforme en pause café.",
    category: "Vie Étudiante",
    date: "22 Mars 2026",
    readTime: "5 min",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Le pouvoir de l'intelligence collective</h2>
      <p>Travailler seul permet de se concentrer, mais travailler en groupe permet de confronter ses idées, de combler ses lacunes et de rester motivé. L'enseignement mutuel (expliquer un concept à quelqu'un d'autre) est d'ailleurs l'une des méthodes d'apprentissage les plus puissantes (La pyramide de l'apprentissage d'Edgar Dale).</p>
      
      <h3>Les règles d'or d'un bon groupe de travail</h3>
      <ul>
        <li><strong>Limitez la taille du groupe :</strong> 3 à 4 personnes maximum. Au-delà, la productivité chute et les digressions augmentent.</li>
        <li><strong>Préparez la session :</strong> Un groupe de travail ne sert pas à découvrir le cours, mais à l'approfondir. Chacun doit avoir lu le cours avant de venir.</li>
        <li><strong>Fixez un objectif clair :</strong> "Aujourd'hui, on fait les annales de 2023 et 2024 en Droit Civil."</li>
        <li><strong>Désignez un maître du temps :</strong> Une personne chargée de faire respecter les Pomodoros et de siffler la fin des pauses.</li>
      </ul>
      
      <p>Utilisez les <strong>Sphères privées</strong> sur CampusSphere pour centraliser vos documents et vos fiches de révision de groupe en un seul endroit !</p>
    `
  }
];
