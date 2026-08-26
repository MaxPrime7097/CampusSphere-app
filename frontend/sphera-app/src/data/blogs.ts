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
    title: "Sphera V2 : Ce qu'il faut savoir sur la nouvelle version",
    excerpt: "Nouveau moteur IA, stockage cloud AWS, SSO instantané avec CampusSphere, quiz à 20 questions forcés. Tour d'horizon complet de la mise à jour.",
    category: "Mises à jour",
    date: "26 Août 2026",
    readTime: "5 min",
    imageUrl: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Pourquoi une V2 ?</h2>
      <p>La V1 de Sphera posait les bases. La V2 les consolide. Après des mois de retours utilisateurs, nous avons identifié 4 points critiques à améliorer : la qualité des générations IA, la fiabilité du stockage, la fluidité de l'authentification, et la vitesse globale. Voici ce qu'on a changé.</p>

      <h2>Moteur IA reconfiguré : 20 questions, pas moins</h2>
      <p>Le feedback le plus fréquent était : "Mon quiz ne génère que 5 questions". On a revu en profondeur le système de prompt qui dialogue avec l'IA. Désormais, les instructions sont <strong>strictement imposées</strong> : le modèle est contraint de générer exactement 20 questions de Quiz et exactement 20 Flashcards, avec une sanction explicite s'il tente de couper court. Les fiches de révision ont aussi été enrichies avec plus de sections détaillées et d'exemples.</p>

      <h2>Stockage AWS S3 : vos fichiers enfin en sécurité</h2>
      <p>Un problème silencieux existait depuis la V1 : l'infrastructure d'hébergement ne conservait pas les fichiers entre les mises à jour. Vos PDFs uploadés disparaissaient sans prévenir. La V2 déploie un stockage <strong>Amazon S3 dédié</strong> avec partitionnement par date et UUID unique par fichier. Vos documents sont désormais permanents, sécurisés, et instantanément accessibles.</p>

      <h2>SSO avec CampusSphere : connexion en 1 clic</h2>
      <p>L'authentification entre les deux apps était un point de friction majeur. La V2 introduit un système SSO de type <strong>"Google-style"</strong> : si vous êtes connecté sur CampusSphere, cliquer sur "Se connecter avec CampusSphere" dans Sphera ouvre une popup intelligente qui vous authentifie automatiquement. Si vous étiez déjà connecté, la popup se ferme toute seule en quelques millisecondes.</p>

      <h2>Architecture backend Node.js</h2>
      <p>Sous le capot, le backend a été migré vers une architecture Node.js/TypeScript/Prisma plus moderne, avec un système de fallback IA intelligent : si le premier modèle d'IA échoue, le système essaie automatiquement les suivants (Claude, Gemini, Groq). Vous ne devriez plus jamais voir d'erreur 503 liée à une panne de fournisseur IA.</p>
    `
  },
  {
    id: 2,
    title: "Relire ses cours ne sert à rien : La science derrière l'Active Recall",
    excerpt: "Tu passes des heures à surligner tes notes sans rien retenir le jour J ? La science cognitive a une réponse claire  et elle va changer ta façon de réviser.",
    category: "Méthodes d'apprentissage",
    date: "24 Août 2026",
    readTime: "6 min",
    imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>L'illusion du surligneur</h2>
      <p>Chaque semestre, des millions d'étudiants répètent le même rituel : sortir les surligneurs, relire le cours trois fois, et se coucher avec la certitude d'avoir bien bossé. Le problème ? Ça ne fonctionne presque pas.</p>
      <p>Ce phénomène porte un nom en sciences cognitives : <strong>l'illusion de la compétence</strong>. Quand tu relis un texte, ton cerveau reconnaît les mots comme "familiers". Il les confond avec de la maîtrise réelle. Mais la reconnaissance  la récupération. En examen, ton cerveau doit produire l'information de zéro, sans le texte sous les yeux  et là, c'est le trou noir.</p>

      <h2>La Courbe de l'oubli d'Ebbinghaus</h2>
      <p>En 1885, le psychologue Hermann Ebbinghaus a découvert quelque chose de brutal : sans effort de mémorisation actif, tu oublies <strong>environ 70% de ce que tu viens d'apprendre en moins de 24 heures</strong>. Ton cerveau est, par nature, une machine à effacer l'information qu'il juge "inutilisée".</p>
      <p>La seule façon de contrer cette courbe ? Forcer le cerveau à aller récupérer l'information régulièrement. C'est ça, l'Active Recall.</p>

      <h2>Comment fonctionne l'Active Recall ?</h2>
      <p>Le principe est simple : au lieu de lire "La photosynthèse est le processus par lequel les plantes convertissent la lumière en énergie", tu fermes ton cours et tu te poses la question : <em>"Comment les plantes produisent-elles leur énergie ?"</em></p>
      <p>L'effort mental que tu fais pour retrouver la réponse  même si tu échoues  crée de nouvelles connexions synaptiques. Plus l'effort est grand, plus la mémoire est solide. Les neuroscientifiques appellent ça le <strong>"desirable difficulty"</strong> (la difficulté désirable).</p>

      <h2>Comment Sphera le met en pratique pour toi</h2>
      <p>Créer ses propres questions de révision prend un temps fou. C'est souvent l'excuse numéro 1 pour ne pas utiliser l'Active Recall. Sphera résout ce problème :</p>
      <ul>
        <li> Tu uploades ton PDF ou texte de cours</li>
        <li> Sphera génère <strong>20 questions de Quiz</strong> et <strong>20 Flashcards recto/verso</strong> en quelques secondes</li>
        <li> Tu te testes, tu te trompes, tu corriges, tu retiens</li>
      </ul>
      <p>La prochaine fois que tu es tenté d'ouvrir ton surligneur, ouvre plutôt un Quiz Sphera. La différence sur tes notes sera spectaculaire.</p>
    `
  },
  {
    id: 2,
    title: "La méthode Pomodoro + Flashcards : Le duo qui bat tous les records",
    excerpt: "Combine la gestion du temps la plus efficace au monde avec l'Active Recall généré par l'IA. Résultat : plus de mémorisation en deux fois moins de temps.",
    category: "Méthodes d'apprentissage",
    date: "20 Août 2026",
    readTime: "8 min",
    imageUrl: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Qu'est-ce que la méthode Pomodoro ?</h2>
      <p>Inventée par Francesco Cirillo dans les années 80 avec une minuterie en forme de tomate (<em>pomodoro</em> en italien), cette méthode est d'une simplicité redoutable : <strong>25 minutes de travail intense, 5 minutes de pause</strong>. Après 4 blocs (un "cycle"), une longue pause de 20 à 30 minutes.</p>
      <p>Ce n'est pas juste une astuce de productivité. C'est fondé sur la biologie. Le cerveau humain maintient une concentration de qualité pendant environ 20 à 25 minutes. Au-delà, les rendements cognitifs chutent. La pause force un "reset" neuronal.</p>

      <h2>Pourquoi ça change tout pour les révisions</h2>
      <p>Le problème classique du Pomodoro pour les révisions : on ne sait pas quoi faire pendant le bloc. Si tu lis passivement, tu gaspilles 25 minutes parfaites. La solution ? Utiliser chaque Pomodoro pour une activité de <strong>rappel actif</strong>.</p>

      <h2>Le protocole Sphera × Pomodoro</h2>
      <ul>
        <li><strong> Pomodoro 1  Découverte :</strong> Lis une section de ton cours (une seule). À la fin, ouvre Sphera, génère 5 Flashcards sur cette section uniquement. Ne les regarde que recto.</li>
        <li><strong> Pomodoro 2  Rappel actif :</strong> Cache le verso. Essaie de répondre. Tourne la carte. Note tes erreurs.</li>
        <li><strong> Pomodoro 3  Renforcement :</strong> Génère un mini-Quiz de 10 questions sur tout ce que tu as vu. Vise 8/10 avant de passer à la suite.</li>
        <li><strong> Pomodoro 4  Synthèse :</strong> Génère une Fiche de révision Sphera sur l'ensemble du chapitre. Compare avec tes notes. Comble les lacunes.</li>
      </ul>

      <h2>Le secret du long terme : la répétition espacée</h2>
      <p>Le Pomodoro gère le court terme. Pour le long terme, il faut la <strong>répétition espacée</strong> : revoir les flashcards le lendemain, puis dans 3 jours, puis dans une semaine. Chaque révision au bon moment renforce exponentiellement la trace mémorielle. Combine les deux, et tu as une méthode quasi-imbattable.</p>
    `
  },
  {
    id: 3,
    title: "Guide de survie : Récupérer un semestre en 15 jours",
    excerpt: "Les partiels dans deux semaines, un semestre entier à rattraper. Voici le plan d'action honnête, sans bullshit, qui peut encore te sauver.",
    category: "Guide de survie",
    date: "14 Août 2026",
    readTime: "9 min",
    imageUrl: "https://images.unsplash.com/photo-1551801841-ecad875a5142?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>La vérité difficile d'abord</h2>
      <p>On ne va pas se mentir : dans 15 jours, tu ne vas pas compenser 4 mois de retard. Mais tu peux <strong>passer la barre</strong>. Et passer la barre, c'est exactement ce dont tu as besoin. Voici la méthode réaliste.</p>

      <h2>Jour 1-2 : L'audit impitoyable</h2>
      <p>Avant de ouvrir un seul polycopié, fais l'inventaire :</p>
      <ul>
        <li>Quelle est la pondération de chaque matière ? Les UE à fort coefficient d'abord.</li>
        <li>Quel est le format de l'exam (QCM, dissertation, problème) ? Chaque format a une stratégie différente.</li>
        <li>Y a-t-il des annales disponibles ? Ce sont tes meilleures alliées.</li>
        <li>Quel est le seuil de passage ? 10/20 ? 12/20 ?</li>
      </ul>
      <p>Une fois cet audit fait, classe tes matières en 3 catégories : <strong>Priorité haute / Moyenne / Si le temps le permet</strong>. Sois brutal dans tes choix.</p>

      <h2>Jour 3-10 : Le sprint Sphera</h2>
      <p>Tu n'as pas le luxe de ficher à la main. Pour chaque chapitre prioritaire :</p>
      <ol>
        <li>Upload le cours sur <strong>Sphera</strong>  génère la <strong>Fiche de révision</strong> (2 minutes).</li>
        <li>Lis la fiche (pas le cours entier). 15 à 20 minutes max par chapitre.</li>
        <li>Lance le <strong>Quiz 20 questions</strong> immédiatement. Tes erreurs te montrent exactement où re-lire.</li>
        <li>Relecture ciblée uniquement des passages liés à tes erreurs.</li>
      </ol>
      <p>Objectif : couvrir l'essentiel de chaque matière prioritaire en 1 journée.</p>

      <h2>Jour 11-13 : Les annales, tes meilleures amies</h2>
      <p>Les professeurs ont des patterns. Ils posent souvent les mêmes types de questions, reformulées différemment. Fais les annales des 3 dernières années. Pour chaque réponse manquée, remonte dans tes fiches Sphera. C'est chirurgical, c'est efficace.</p>

      <h2>Jour 14-15 : Le taper-off et la récupération</h2>
      <p>Stop aux nouvelles informations la veille de l'exam. Révise uniquement ce que tu sais déjà pour booster ta confiance. Dors 8 heures. Le cerveau consolide les apprentissages pendant le sommeil  une nuit blanche la veille est contre-productive.</p>
    `
  },
  {
    id: 4,
    title: "Stress d'examen : La science pour le transformer en carburant",
    excerpt: "Le stress n'est pas ton ennemi. C'est une ressource neurologique que les meilleurs étudiants apprennent à exploiter. Voici comment.",
    category: "Bien-être étudiant",
    date: "5 Août 2026",
    readTime: "7 min",
    imageUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Le cortisol : poison ou carburant ?</h2>
      <p>La plupart des articles te disent "gérer ton stress", comme si c'était quelque chose à supprimer. C'est une erreur. En 2013, une étude de Stanford menée par Alia Crum a montré que les personnes qui <strong>percevaient le stress comme une ressource</strong> avaient de meilleures performances cognitives que celles qui le fuyaient.</p>
      <p>Le stress libère du cortisol et de l'adrénaline. À dose modérée, ces hormones <strong>améliorent la concentration, la mémoire à court terme et la vitesse de traitement</strong>. Le problème, c'est quand ça bascule dans la panique  là, les effets s'inversent.</p>

      <h2>La zone optimale de performance (Loi de Yerkes-Dodson)</h2>
      <p>Les psychologues Yerkes et Dodson ont modélisé la relation entre stress et performance sous forme d'une courbe en U inversé. Pas assez de stress = on s'en fout, on ne se concentre pas. Trop de stress = panique, blocage. La zone optimale se trouve <strong>au milieu</strong> : assez de pression pour être "dans le jeu", pas assez pour être paralysé.</p>

      <h2>5 techniques concrètes pour rester dans la zone</h2>
      <ul>
        <li><strong> La cohérence cardiaque (5-5-5) :</strong> Inspirez 5 secondes, expirez 5 secondes, pendant 5 minutes. Prouvée cliniquement pour réduire le cortisol.</li>
        <li><strong> Exercice physique 30 min avant de réviser :</strong> La course ou la marche rapide libère du BDNF, un facteur neurotrophique qui améliore la plasticité synaptique (= tu apprends plus vite).</li>
        <li><strong> La liste "vide-tête" :</strong> Écris sur papier tout ce qui t'inquiète avant de commencer. Le simple fait de l'externaliser libère de la bande passante mentale.</li>
        <li><strong> Se tester pour apprivoiser l'inconnu :</strong> L'anxiété d'examen vient en grande partie de la peur de l'inconnu. Utilise les <strong>Quiz Sphera</strong> quotidiennement pour habituer ton cerveau à être interrogé. Le jour J ne sera qu'une session de plus.</li>
        <li><strong> Le sommeil, non négociable :</strong> Une nuit de 7-8 heures la veille vaut 3 heures de révision supplémentaires. C'est prouvé : le sommeil consolide les apprentissages en mémoire à long terme.</li>
      </ul>
    `
  },
  {
    id: 5,
    title: "Annales vs Cours bruts : Le match décisif pour tes notes",
    excerpt: "70% de ton temps de révision devrait être consacré aux annales. Pas aux cours. Voici pourquoi  et comment exploiter chaque sujet des années précédentes.",
    category: "Stratégie",
    date: "28 Juillet 2026",
    readTime: "6 min",
    imageUrl: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Le mythe du "il faut connaître son cours sur le bout des doigts"</h2>
      <p>Pendant des années, les étudiants les plus consciencieux ont cru que la clé des bonnes notes était une connaissance encyclopédique du cours. La réalité des examens est bien différente : les profs notent ta capacité à <strong>mobiliser</strong> les connaissances dans un contexte donné, pas à les régurgiter.</p>
      <p>Un étudiant qui a fait 10 annales avec 60% du cours connaîtra toujours mieux les <em>attentes réelles</em> de l'examen qu'un étudiant qui a tout appris par cœur sans jamais s'être exercé.</p>

      <h2>Ce que les annales révèlent vraiment</h2>
      <ul>
        <li><strong>Les patterns du prof :</strong> Chaque enseignant a ses marottes. Des concepts qu'il adore interroger, des formulations qu'il répète, des pièges qu'il tend systématiquement. Les annales les exposent tous.</li>
        <li><strong>Le niveau de détail attendu :</strong> Une réponse en 3 lignes ou en 3 pages ? Les annales corrigées te le disent avec précision.</li>
        <li><strong>Le format exact :</strong> Les QCM ne s'apprennent pas comme les dissertations. S'entraîner au bon format est une compétence à part entière.</li>
        <li><strong>Tes vrais trous :</strong> Tu penses connaître les dérivées ? Lance une annale de maths. En 10 minutes, tu sauras exactement ce que tu ne maîtrises pas encore.</li>
      </ul>

      <h2>La stratégie 70/30 avec Sphera</h2>
      <p>Notre recommandation, validée par les étudiants qui obtiennent les meilleurs résultats sur la plateforme :</p>
      <ol>
        <li><strong>30% du temps :</strong> Ingestion du cours via Sphera. Génère une <strong>Fiche de révision</strong> pour chaque chapitre. Lis-la. Pas plus.</li>
        <li><strong>70% du temps :</strong> Annales, annales, annales. Pour chaque réponse fausse ou imprécise, remonte dans ta fiche Sphera pour trouver l'information manquante. C'est du ciblage laser.</li>
      </ol>
      <p>Résultat : tu couvres 80% des thèmes potentiels de l'exam avec 50% moins de temps de révision qu'un étudiant qui relit passivement.</p>
    `
  },
  {
    id: 6,
    title: "5 hacks contre la procrastination que les neurosciences valident",
    excerpt: "La procrastination n'est pas un problème de motivation. C'est un problème de régulation émotionnelle. Voici les seules méthodes qui fonctionnent vraiment.",
    category: "Productivité",
    date: "20 Juillet 2026",
    readTime: "7 min",
    imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>La vérité sur la procrastination</h2>
      <p>On te dit depuis l'enfance que procrastiner c'est être fainéant. Les recherches en psychologie cognitive disent le contraire. La procrastination est un mécanisme de <strong>régulation émotionnelle</strong> : ton cerveau anticipe la douleur ou la frustration associée à une tâche, et choisit de la fuir vers une récompense immédiate (réseaux, YouTube, etc.).</p>
      <p>Conclusion : la solution n'est pas "plus de motivation". C'est <strong>réduire l'aversion</strong> que ton cerveau associe à la tâche.</p>

      <h2>Hack 1 : La règle des 2 minutes</h2>
      <p>Si la tâche prend moins de 2 minutes, fais-la immédiatement. Pour les tâches longues : engage-toi uniquement pour les 2 premières minutes. Ton cerveau résiste à commencer, pas à continuer. 90% du temps, les 2 minutes deviennent 40 minutes.</p>

      <h2>Hack 2 : Réduire la friction avec des outils prêts-à-l'emploi</h2>
      <p>Ton cerveau procrastine quand la tâche semble complexe à démarrer. Solution : retire tous les obstacles. Sphera ouverte sur ton téléphone, cours déjà uploadé la veille, Quiz prêt à démarrer. Plus ton environnement est prêt, moins ton cerveau a d'excuses.</p>

      <h2>Hack 3 : La "boucle dopaminergique"</h2>
      <p>Le cerveau fonctionne à la récompense. Chaque bonne réponse à un Quiz Sphera déclenche une micro-libération de dopamine. Concrètement : termine <strong>toujours</strong> une session de révision par un quiz sur quelque chose que tu maîtrises déjà. Tu finis sur une victoire, ton cerveau associe la révision à une sensation positive, et tu auras moins de mal à recommencer demain.</p>

      <h2>Hack 4 : Le "body doubling"</h2>
      <p>Travailler en présence d'autres personnes (même sans interagir) augmente significativement la productivité. Bibliothèque, café, ou session virtuelle avec des amis via les <strong>Sphères CampusSphere</strong> : le simple fait de te savoir "observé" réduit les comportements de fuite.</p>

      <h2>Hack 5 : L'implémentation d'intention</h2>
      <p>"Je vais réviser ce soir" ne marche pas. "Je vais faire le Quiz Sphera sur le chapitre 3 de Thermodynamique de 19h à 19h30 à mon bureau" marche. Les études montrent qu'une intention avec lieu, heure et action précise multiplie par 2 à 3 la probabilité de réalisation.</p>
    `
  },
  {
    id: 7,
    title: "Groupes de travail : Comment en faire une vraie arme, pas une pause café",
    excerpt: "Réviser à plusieurs peut doubler vos performances  ou les diviser par deux. Tout dépend d'une chose : la structure. Voici comment organiser un groupe efficace.",
    category: "Vie Étudiante",
    date: "10 Juillet 2026",
    readTime: "5 min",
    imageUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>La magie de l'apprentissage par l'enseignement</h2>
      <p>La pyramide de l'apprentissage d'Edgar Dale est claire : on retient environ 5% de ce qu'on lit, mais <strong>90% de ce qu'on enseigne à quelqu'un d'autre</strong>. Expliquer un concept à un camarade t'oblige à le reformuler, à trouver des métaphores, à identifier tes propres zones d'ombre.</p>
      <p>Un bon groupe de travail n'est pas un endroit où tout le monde révise côte à côte en silence. C'est un endroit où on s'enseigne mutuellement.</p>

      <h2>Les règles d'or du groupe productif</h2>
      <ul>
        <li><strong>3 personnes maximum :</strong> Au-delà, les discussions s'étirent, les digressions multiplient, la productivité chute.</li>
        <li><strong>Chacun prépare avant :</strong> Le groupe sert à approfondir, pas à découvrir. Chaque membre génère une Fiche Sphera sur sa partie avant de venir. On compare, on discute les différences.</li>
        <li><strong>Un objectif précis par session :</strong> "Corriger ensemble les annales 2023 et 2024 de Macro-économie." Pas "réviser l'éco".</li>
        <li><strong>Un timer actif :</strong> Un Pomodoro de 25 minutes par exercice. Une personne est responsable du chrono. Fin du temps = on passe.</li>
      </ul>

      <h2>La dimension numérique : CampusSphere + Sphera</h2>
      <p>Ton groupe n'est pas toujours disponible au même endroit. Utilisez les <strong>Sphères privées</strong> sur CampusSphere pour partager vos PDFs, fiches et annales. Et challengez-vous mutuellement sur les résultats des Quiz Sphera : qui obtient le meilleur score sur le chapitre 4 de Comptabilité ? La compétition amicale est un moteur d'apprentissage redoutable.</p>
    `
  },
  {
    id: 8,
    title: "IA et révisions : Le tuteur privé que tu ne pouvais pas te payer",
    excerpt: "L'intelligence artificielle ne va pas faire tes devoirs à ta place. Elle va te rendre 10x plus efficace dans ta propre façon d'apprendre. Voici comment.",
    category: "IA & Éducation",
    date: "1 Juillet 2026",
    readTime: "6 min",
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Le problème du copier-coller ChatGPT</h2>
      <p>Depuis 2023, beaucoup d'étudiants utilisent les LLMs pour générer leurs dissertations en 30 secondes. L'illusion est parfaite  jusqu'à l'examen sur table. Sans accès à l'IA, sans avoir jamais vraiment réfléchi au sujet, le vide est total.</p>
      <p>Ce n'est pas l'IA le problème. C'est l'<em>usage</em> de l'IA. Il faut passer du mode "fais-le à ma place" au mode "aide-moi à apprendre".</p>

      <h2>L'IA comme "Socratic Tutor"</h2>
      <p>La méthode Socratique consiste à apprendre par le questionnement, pas par la transmission passive. L'IA est le tuteur Socratique parfait : disponible à 3h du matin, infiniment patient, capable d'adapter ses explications à ton niveau.</p>
      <p>Concrètement, Sphera utilise l'IA non pas pour te donner les réponses, mais pour <strong>te poser les questions</strong> qui vont forcer ton cerveau à construire le savoir lui-même.</p>

      <h2>3 usages concrets qui font la différence</h2>
      <ul>
        <li><strong>La Fiche intelligente :</strong> Sphera analyse ton cours et restructure l'information selon les concepts clés, les définitions et les formules  exactement ce qu'un bon prof de lycée ferait pour toi.</li>
        <li><strong>Le Quiz sur mesure :</strong> Contrairement à Quizlet ou Anki, les questions générées par Sphera sont basées sur <em>ton propre cours</em>. Pas des questions génériques, mais des questions qui correspondent exactement à ce que ton prof t'a enseigné.</li>
        <li><strong>L'analyse d'annales :</strong> Soumets une annale sans correction. Rédige ta réponse. Soumets à Sphera pour comparaison. C'est le cycle feedback le plus puissant qui existe pour progresser.</li>
      </ul>

      <h2>La règle d'or</h2>
      <p>L'IA amplifie ce que tu y mets. Si tu lui demandes de penser à ta place, elle le fera  et tu n'apprendras rien. Si tu l'utilises pour te challenger, te tester et combler tes lacunes, elle devient le meilleur professeur particulier que tu aies jamais eu.</p>
    `
  },
  {
    id: 9,
    title: "CampusSphere × Sphera : Deux apps, un seul cerveau étudiant",
    excerpt: "Pourquoi avons-nous créé deux plateformes distinctes  et comment leur connexion seamless peut te faire gagner des heures par semaine.",
    category: "Mises à jour",
    date: "20 Juin 2026",
    readTime: "4 min",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Le problème de l'environnement unique</h2>
      <p>Imagine que ta chambre soit à la fois ta chambre à coucher, ta salle de sport et ton bureau de travail. Ton cerveau aurait du mal à switcher entre les modes "repos", "effort physique" et "concentration intellectuelle".</p>
      <p>C'est exactement ce qu'il se passe quand tu essaies de réviser sur la même plateforme où tu reçois des notifications sociales, des messages et des posts de ton feed. Le contexte mental contamine tout.</p>

      <h2>Deux espaces, deux modes mentaux</h2>
      <ul>
        <li><strong>CampusSphere :</strong> Ton espace social étudiant. Connexions, posts, groupes, événements associatifs, ressources partagées. C'est ta vie de campus numérique.</li>
        <li><strong>Sphera :</strong> Ton laboratoire d'apprentissage. Interface épurée, dark mode, zéro distraction, IA dédiée à tes révisions. C'est ton bureau privé.</li>
      </ul>
      <p>En séparant les deux, on conditionne ton cerveau : ouvrir Sphera = mode Deep Work. Comme un athlète qui enfile ses chaussures d'entraînement pour "signaler" à son corps qu'il est l'heure de performer.</p>

      <h2>Le SSO : la magie de la connexion instantanée</h2>
      <p>Séparation ne veut pas dire friction. Notre système <strong>SSO (Single Sign-On)</strong> connecte les deux apps de façon transparente. Tu es sur CampusSphere, tu veux basculer en mode révision ? Un clic sur "Se connecter avec CampusSphere" dans Sphera, et tu es instantanément authentifié. Aucun mot de passe, aucune coupure de flux. Juste toi et tes cours, en quelques secondes.</p>
    `
  }
];
