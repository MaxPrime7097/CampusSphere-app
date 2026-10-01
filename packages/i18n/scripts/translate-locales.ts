import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

// Common translation glossary for CampusSphere & Sphera domain
const GLOSSARY: Record<string, string> = {
  // Navigation & General
  'Accueil': 'Home',
  'Tableau de bord': 'Dashboard',
  'Paramètres': 'Settings',
  'Profil': 'Profile',
  'Aide & FAQ': 'Help & FAQ',
  'Conditions d\'utilisation': 'Terms of Service',
  'Politique de confidentialité': 'Privacy Policy',
  'Mentions légales': 'Legal Notice',
  'Conditions générales de vente': 'Terms of Sale',
  'Se déconnecter': 'Log out',
  'Se connecter': 'Log in',
  'S\'inscrire': 'Sign up',
  'Connexion': 'Sign in',
  'Inscription': 'Sign up',
  'Retour': 'Back',
  'Continuer': 'Continue',
  'Enregistrer': 'Save',
  'Annuler': 'Cancel',
  'Supprimer': 'Delete',
  'Modifier': 'Edit',
  'Fermer': 'Close',
  'Suivant': 'Next',
  'Précédent': 'Previous',
  'Valider': 'Validate',
  'Confirmer': 'Confirm',
  'Télécharger': 'Download',
  'Exporter': 'Export',
  'Partager': 'Share',
  'Copier': 'Copy',
  'Copié !': 'Copied!',
  'Rechercher': 'Search',
  'Filtrer': 'Filter',
  'Chargement...': 'Loading...',
  'Aucun résultat': 'No results found',
  'Succès': 'Success',
  'Erreur': 'Error',

  // Sphera Core Concepts
  'Sphera': 'Sphera',
  'Sphera Live': 'Sphera Live',
  'Fiche de révision': 'Study Sheet',
  'Fiches de révision': 'Study Sheets',
  'Fiches': 'Sheets',
  'Flashcards': 'Flashcards',
  'Quiz': 'Quiz',
  'Mindmap': 'Mind Map',
  'Carte mentale': 'Mind Map',
  'Session d\'étude': 'Study Session',
  'Sessions d\'étude': 'Study Sessions',
  'Créer une session': 'Create a Session',
  'Nouvelle session': 'New Session',
  'Générer avec l\'IA': 'Generate with AI',
  'Génération IA': 'AI Generation',
  'Document source': 'Source Document',
  'Importer un document': 'Import a Document',
  'Importer un cours': 'Import Course Material',
  'Déposer un fichier PDF': 'Drop a PDF file here',
  'Glissez-déposez votre document': 'Drag & drop your document here',
  'Titre de la session': 'Session Title',
  'Niveau de difficulté': 'Difficulty Level',
  'Facile': 'Easy',
  'Moyen': 'Medium',
  'Difficile': 'Hard',
  'Expert': 'Expert',
  'Résultats': 'Results',
  'Statistiques': 'Statistics',
  'Score': 'Score',
  'Précision': 'Accuracy',
  'Temps passé': 'Time Spent',
  'Questions': 'Questions',
  'Bonne réponse': 'Correct Answer',
  'Mauvaise réponse': 'Incorrect Answer',
  'Explication': 'Explanation',
  'Série d\'activité': 'Activity Streak',
  'Jours consécutifs': 'Consecutive Days',
  'Mode examen': 'Exam Mode',
  'Annales': 'Past Exam Papers',
  'Annales & Examens': 'Past Exams & Papers',
  'Rejoindre une session': 'Join a Session',
  'Code PIN': 'PIN Code',
  'Entrez le code': 'Enter PIN code',
  'Rejoindre': 'Join',
  'Lancer la session': 'Launch Session',
  'En attente des participants': 'Waiting for participants',
  'Participants': 'Participants',
  'Classement': 'Leaderboard',
  'Podium': 'Podium',
  'Terminer le quiz': 'End Quiz',
  'Prochaine question': 'Next Question',
  'Tarifs': 'Pricing',
  'Gratuit': 'Free',
  'Étudiant': 'Student',
  'Illimité': 'Unlimited',
  'Passer à Sphera Pro': 'Upgrade to Sphera Pro',
};

function autoTranslateText(text: string): string {
  // Check exact glossary match
  const trimmed = text.trim();
  if (GLOSSARY[trimmed]) {
    return text.replace(trimmed, GLOSSARY[trimmed]);
  }

  // Preserve interpolation variables {{var}}
  const vars: string[] = [];
  const placeholderText = text.replace(/\{\{([^}]+)\}\}/g, (_, v) => {
    vars.push(v);
    return `__VAR_${vars.length - 1}__`;
  });

  let translated = placeholderText;

  // Glossary phrase replacement
  for (const [frPhrase, enPhrase] of Object.entries(GLOSSARY)) {
    const regex = new RegExp(`\\b${frPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    translated = translated.replace(regex, enPhrase);
  }

  // Restore variables
  vars.forEach((v, idx) => {
    translated = translated.replace(`__VAR_${idx}__`, `{{${v}}}`);
  });

  return translated;
}

export function syncNamespace(frPath: string, enPath: string): { added: number; total: number } {
  const frData = JSON.parse(fs.readFileSync(frPath, 'utf8'));
  let enData: Record<string, unknown> = {};

  if (fs.existsSync(enPath)) {
    try {
      enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    } catch {
      enData = {};
    }
  }

  let addedCount = 0;
  let totalCount = 0;

  function traverse(
    frNode: Record<string, unknown>,
    enNode: Record<string, unknown>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // Sort keys alphabetically for clean diffs
    const keys = Object.keys(frNode).sort();

    for (const key of keys) {
      totalCount++;
      const frVal = frNode[key];
      const enVal = enNode[key];

      if (frVal && typeof frVal === 'object' && !Array.isArray(frVal)) {
        result[key] = traverse(
          frVal as Record<string, unknown>,
          (enVal && typeof enVal === 'object' && !Array.isArray(enVal)
            ? enVal
            : {}) as Record<string, unknown>
        );
      } else if (typeof frVal === 'string') {
        if (typeof enVal === 'string' && enVal.trim() !== '') {
          result[key] = enVal;
        } else {
          result[key] = autoTranslateText(frVal);
          addedCount++;
        }
      } else {
        result[key] = frVal;
      }
    }

    return result;
  }

  const synchronized = traverse(frData, enData);
  fs.mkdirSync(path.dirname(enPath), { recursive: true });
  fs.writeFileSync(enPath, JSON.stringify(synchronized, null, 2) + '\n', 'utf8');

  return { added: addedCount, total: totalCount };
}

export function syncAllLocales(targetDir?: string) {
  const dirs = targetDir
    ? [path.resolve(rootDir, targetDir)]
    : [
        path.resolve(rootDir, 'packages/i18n/src/locales'),
        path.resolve(rootDir, 'apps/sphera/src/locales'),
      ];

  console.log('🌐 Synchronizing and translating locales (fr -> en)...\n');

  for (const dir of dirs) {
    const frDir = path.join(dir, 'fr');
    const enDir = path.join(dir, 'en');

    if (!fs.existsSync(frDir)) continue;

    const files = fs.readdirSync(frDir).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      const frPath = path.join(frDir, file);
      const enPath = path.join(enDir, file);

      const { added, total } = syncNamespace(frPath, enPath);
      const relPath = path.relative(rootDir, enPath);

      if (added > 0) {
        console.log(`✨ [${relPath}] Translated & synced ${added}/${total} keys`);
      } else {
        console.log(`✅ [${relPath}] Up-to-date (${total} keys)`);
      }
    }
  }

  console.log('\n🎉 Synchronization complete!\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const customTarget = process.argv[2];
  syncAllLocales(customTarget);
}
