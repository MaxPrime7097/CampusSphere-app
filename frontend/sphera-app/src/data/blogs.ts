export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: React.ReactNode | string;
  category: string;
  date: string;
  readTime: string;
  imageUrl: string;
  isFeatured?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    id: 10,
    title: "Sphera Live : Le quiz multijoueur en temps réel est arrivé",
    excerpt: "Créez un quiz sur n'importe quel sujet, partagez un code, et affrontez vos amis en direct. Cours, culture gé, ciné, foot, manga... Sphera Live transforme chaque sujet en compétition multijoueur.",
    category: "Nouveautés",
    date: "10 Septembre 2026",
    readTime: "7 min",
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800&h=500",
    isFeatured: true,
    content: `
      <h2>Pas juste pour les cours. Pour tout.</h2>
      <p>Depuis le lancement de Sphera, une demande revenait sans cesse : <strong>"Quand est-ce qu'on pourra se challenger entre amis ?"</strong>. Aujourd'hui, c'est chose faite. Sphera Live transforme n'importe quel quiz en une expérience multijoueur en temps réel, directement dans votre navigateur.</p>
      <p>Et non, ce n'est pas réservé aux cours. Vous pouvez créer un quiz sur <strong>absolument tout</strong> : le dernier anime de la saison, les capitales du monde, les stats de Mbappé, la filmographie de Christopher Nolan, l'histoire de la Formule 1... Si c'est questionnable, c'est jouable sur Sphera Live.</p>

      <h2>Comment ça marche ?</h2>
      <p>Le concept est simple et redoutablement addictif :</p>
      <ol>
        <li><strong>L'hôte crée une session</strong> : Générez un quiz à partir d'un document, créez vos propres questions manuellement sur le sujet de votre choix, ou importez-les.</li>
        <li><strong>Un code à 6 caractères est généré</strong> : Partagez-le à vos potes. Ils rejoignent instantanément depuis leur téléphone ou leur PC avec leur compte connecté.</li>
        <li><strong>Le quiz démarre en direct</strong> : Chaque question s'affiche simultanément sur tous les écrans. Un timer défile. Les réponses sont instantanées.</li>
        <li><strong>Classement en temps réel</strong> : Après chaque question, un leaderboard s'affiche. Les points dépendent de la rapidité ET de la justesse. Top 3 en podium à la fin.</li>
      </ol>

      <h2>3 façons de créer votre quiz</h2>
      <p>Sphera Live s'adapte à ce que vous voulez faire :</p>
      <ul>
        <li><strong>Générer avec Sphera</strong> : Collez un lien CampusSphere ou uploadez directement un PDF/DOCX. L'IA de Sphera génère automatiquement les questions et les réponses. Parfait pour les révisions.</li>
        <li><strong>Créer manuellement</strong> : Vous contrôlez chaque question, chaque option, chaque bonne réponse et chaque durée. Idéal pour créer un quiz culture pop, sport, ou n'importe quel délire entre amis.</li>
        <li><strong>Importer un JSON</strong> : Vous avez déjà des questions au format structuré ? Importez-les et prévisualisez avant de lancer.</li>
      </ul>

      <h2>L'expérience en vrai</h2>
      <p>Imaginez : vous êtes en soirée, en amphi, en BU, ou même chacun chez soi. L'hôte lance le quiz. Les participants sortent leur téléphone, tapent le code, et c'est parti. Le <strong>countdown 3-2-1</strong> s'affiche sur tous les écrans. Les sons de fin de timer montent la pression. Le classement tombe. Les réactions fusent.</p>
      <p>Que ce soit un quiz de révision avant les partiels ou un blind test improvisé un samedi soir, l'énergie est la même : <strong>compétition amicale, adrénaline, et le plaisir de se mesurer les uns aux autres</strong>.</p>

      <h2>Quelques idées pour vos premières sessions</h2>
      <ul>
        <li><strong>Soirée culture gé</strong> : Qui connaît le plus de drapeaux ? De capitales ? De dates historiques ?</li>
        <li><strong>Quiz ciné/séries</strong> : Répliques cultes, acteurs, réalisateurs... testez vos connaissances entre cinéphiles.</li>
        <li><strong>Révisions de groupe</strong> : Uploadez le cours de Biologie Cellulaire et laissez Sphera générer les questions. Le meilleur score révise le mieux.</li>
        <li><strong>Quiz sport</strong> : Palmarès, records, transferts... prouvez que vous êtes le vrai expert.</li>
        <li><strong>Défis entre promos</strong> : La L2 contre la L3 sur un même cours. Qui maîtrise le mieux ?</li>
      </ul>

      <h2>Fonctionnalités clés</h2>
      <ul>
        <li><strong>Salle d'attente animée</strong> : Les participants voient leur nom apparaître en temps réel pendant que l'hôte attend que tout le monde soit connecté.</li>
        <li><strong>Timer visuel dynamique</strong> : La barre passe du vert à l'orange puis au rouge dans les dernières secondes.</li>
        <li><strong>Podium final avec confettis</strong> : Parce que gagner un quiz mérite d'être célébré.</li>
        <li><strong>Mode muet pour l'hôte</strong> : Coupez les sons si vous projetez en cours ou si c'est 2h du mat.</li>
        <li><strong>Relancement rapide</strong> : Rejouez la même session avec de nouveaux participants en un clic.</li>
        <li><strong>Connexion SSO instantanée</strong> : Votre compte CampusSphere vous connecte en 1 clic. Zéro friction, on rejoint en 5 secondes.</li>
      </ul>

      <h2>Comment y accéder ?</h2>
      <p>Sphera Live est disponible dès maintenant dans la barre latérale de Sphera. Cliquez sur <strong>"Sphera Live"</strong>, créez votre première session, et partagez le code. C'est aussi simple que ça.</p>
      <p>Bonne chance, et que le meilleur gagne.</p>
    `
  },
  {
    id: 1,
    title: "Sphera V2 : Tout ce qui a changé (et pourquoi c'est mieux)",
    excerpt: "Générations IA plus complètes, fichiers qui ne disparaissent plus, connexion instantanée depuis CampusSphere, et un backend qui ne plante plus. Le point sur la V2.",
    category: "Mises à jour",
    date: "26 Août 2026",
    readTime: "5 min",
    imageUrl: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Ce que vous nous avez dit sur la V1</h2>
      <p>On ne va pas tourner autour du pot. La V1 avait des problèmes. Vous nous les avez signalés, et on les a tous notés :</p>
      <ul>
        <li>"Mon quiz ne génère que 5 questions au lieu de 20."</li>
        <li>"J'ai uploadé mon PDF hier, aujourd'hui il a disparu."</li>
        <li>"C'est galère de se connecter, je dois retaper mon mot de passe à chaque fois."</li>
        <li>"Des fois ça plante et ça me dit erreur 503."</li>
      </ul>
      <p>La V2 corrige <strong>chacun de ces points</strong>. Voici comment.</p>

      <h2>L'IA génère enfin 20 questions (pour de vrai)</h2>
      <p><strong>Avant :</strong> vous uplodiez un cours de 30 pages et l'IA vous sortait 5 questions bâclées et 8 flashcards. Frustrant.</p>
      <p><strong>Maintenant :</strong> le système de prompt a été entièrement réécrit. L'IA est <strong>contrainte</strong> de produire exactement 20 questions de Quiz et 20 Flashcards, avec des instructions explicites qui l'empêchent de couper court. Les fiches de révision sont aussi plus denses : plus de sections, plus d'exemples, plus de définitions clés.</p>
      <p>Concrètement, si vous uploadez un chapitre de 15 pages sur la Photosynthèse, vous obtenez :</p>
      <ul>
        <li>20 questions de quiz couvrant les mécanismes, les molécules, les phases, les exceptions</li>
        <li>20 flashcards recto/verso avec définitions, formules et schémas clés</li>
        <li>1 fiche de révision structurée avec introduction, concepts principaux, formules, pièges courants</li>
      </ul>

      <h2>Vos fichiers ne disparaissent plus</h2>
      <p><strong>Avant :</strong> vos PDFs étaient stockés sur le serveur d'hébergement. À chaque mise à jour ou redémarrage, tout était effacé. Vous uplodiez un document le lundi, il avait disparu le mercredi.</p>
      <p><strong>Maintenant :</strong> tous les fichiers sont stockés sur <strong>Amazon S3</strong>, un service de stockage cloud professionnel. Chaque fichier reçoit un identifiant unique et est rangé par date. Vos documents sont permanents, accessibles instantanément, et ne dépendent plus du cycle de vie du serveur.</p>
      <p>En clair : uploadez une fois, retrouvez-le pour toujours.</p>

      <h2>Connexion depuis CampusSphere en 2 secondes</h2>
      <p><strong>Avant :</strong> il fallait créer un compte séparé sur Sphera, ou retaper ses identifiants à chaque visite. Certains abandonnaient avant même de commencer.</p>
      <p><strong>Maintenant :</strong> un bouton "Se connecter avec CampusSphere". Clic. Une popup s'ouvre. Si vous êtes déjà connecté sur CampusSphere, elle se referme immédiatement en vous authentifiant. Pas de formulaire, pas de mot de passe, pas de friction. Vous êtes sur Sphera en 2 secondes.</p>

      <h2>Plus d'erreur 503</h2>
      <p><strong>Avant :</strong> si le fournisseur d'IA (OpenAI, Claude...) avait un souci, Sphera plantait. Vous voyiez une page d'erreur et il n'y avait rien à faire à part attendre.</p>
      <p><strong>Maintenant :</strong> le backend utilise un système de <strong>fallback automatique</strong>. Si le premier modèle d'IA ne répond pas, Sphera essaie automatiquement le suivant (Claude → Gemini → Groq). Pour vous, c'est invisible : la génération prend peut-être 2 secondes de plus, mais elle aboutit.</p>

      <h2>Et aussi...</h2>
      <ul>
        <li><strong>Temps de génération réduit</strong> : le nouveau backend Node.js/TypeScript est plus rapide que l'ancien. Les quiz se génèrent en moyenne 40% plus vite.</li>
        <li><strong>Meilleure gestion des gros fichiers</strong> : les PDFs jusqu'à 50MB sont maintenant acceptés (contre 10MB avant).</li>
        <li><strong>Interface plus fluide</strong> : transitions, chargements, animations — tout est plus réactif.</li>
      </ul>
      <p>La V2, c'est Sphera qui tient ses promesses. Uploadez un cours, et laissez l'IA faire le reste — cette fois, pour de vrai.</p>
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
    title: "Guide de survie : Sauver un semestre en 15 jours",
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
    title: "CampusSphere × Sphera : Comment les deux apps fonctionnent ensemble",
    excerpt: "Connexion en un clic, ressources partagées, quiz Live entre amis d'une même sphère... Voici concrètement ce que le duo CampusSphere + Sphera change dans ton quotidien.",
    category: "Mises à jour",
    date: "20 Juin 2026",
    readTime: "5 min",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800&h=500",
    content: `
      <h2>Deux apps, mais un seul compte</h2>
      <p>Premier point concret : tu n'as <strong>qu'un seul compte</strong>. Ton inscription sur CampusSphere te donne automatiquement accès à Sphera. La connexion se fait en un clic via notre système SSO : tu appuies sur "Se connecter avec CampusSphere", une popup s'ouvre, et si tu es déjà connecté sur CampusSphere, elle se referme toute seule en t'authentifiant. Littéralement 2 secondes.</p>

      <h2>Tes ressources CampusSphere dans Sphera</h2>
      <p>C'est là que la synergie devient concrète. Sur CampusSphere, tu partages et tu récupères des <strong>ressources</strong> dans tes sphères : cours PDF, poly de TD, slides de présentation, fiches de TP... Ces documents ne sont pas juste des fichiers stockés. Ils deviennent <strong>la matière première de Sphera</strong>.</p>
      <p>Concrètement, dans Sphera, quand tu veux générer un quiz, des flashcards ou une fiche de révision, tu peux :</p>
      <ul>
        <li><strong>Coller directement le lien</strong> d'une ressource CampusSphere. Sphera récupère le document, extrait le texte, et génère tes outils de révision automatiquement.</li>
        <li><strong>Uploader un fichier</strong> que tu as téléchargé depuis CampusSphere (ou n'importe où ailleurs).</li>
      </ul>
      <p>Le workflow typique : ton prof poste un nouveau chapitre dans la sphère de ta promo → tu ouvres le lien dans Sphera → en 30 secondes, tu as 20 questions de quiz, 20 flashcards et une fiche de synthèse prêtes à l'emploi.</p>

      <h2>Sphera Live : le multijoueur entre potes de ta sphère</h2>
      <p>La dernière pièce du puzzle. Avec <strong>Sphera Live</strong>, tu peux créer un quiz multijoueur à partir d'une ressource partagée dans ta sphère CampusSphere, et inviter tes camarades de promo à le jouer en temps réel.</p>
      <p>Scénario concret :</p>
      <ol>
        <li>Quelqu'un poste le poly de Macro-éco dans la sphère "L2 Économie".</li>
        <li>Tu ouvres Sphera Live, tu colles le lien du poly, tu génères un quiz.</li>
        <li>Tu balances le code à 6 caractères dans le chat de la sphère.</li>
        <li>10 personnes rejoignent depuis leur téléphone. Le quiz démarre.</li>
        <li>Classement final : tu sais exactement qui maîtrise quoi, et surtout, tout le monde a révisé sans s'en rendre compte.</li>
      </ol>

      <h2>Ce qui est sur CampusSphere, ce qui est sur Sphera</h2>
      <p>Pour que ce soit clair :</p>
      <ul>
        <li><strong>CampusSphere</strong> = ta vie étudiante. Feed social, sphères (groupes), messagerie, événements, partage de ressources, réseau. C'est là que tu interagis avec ta communauté.</li>
        <li><strong>Sphera</strong> = ton espace perso de travail. Quiz IA, flashcards, fiches de révision, annales, Sphera Live. C'est là que tu transformes les ressources en compétences.</li>
      </ul>
      <p>Séparation volontaire : quand tu ouvres Sphera, pas de notif sociale, pas de feed, pas de distraction. Juste toi et tes outils. Mais les deux communiquent en coulisse grâce au SSO et au système de ressources partagées.</p>

      <h2>Ce qui arrive bientôt</h2>
      <p>On travaille sur plusieurs ponts supplémentaires entre les deux apps :</p>
      <ul>
        <li><strong>Partage de scores Sphera Live</strong> directement dans le feed de ta sphère.</li>
        <li><strong>Suggestions automatiques</strong> : quand une nouvelle ressource est postée dans ta sphère, Sphera te propose de générer une session dessus.</li>
        <li><strong>Classements de sphère</strong> : qui a le meilleur score cumulé sur les quiz de la promo ?</li>
      </ul>
      <p>L'objectif est simple : que le passage de la vie sociale étudiante au travail personnel soit aussi fluide qu'un swipe.</p>
    `
  }
];
