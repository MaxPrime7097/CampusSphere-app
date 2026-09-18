// =========================================================================
// Sphera — Types TypeScript (V1 + V2)
// =========================================================================

// ---------------------------------------------------------------------------
// StudySession — V1
// ---------------------------------------------------------------------------

export type ToolType = "fiche" | "quiz" | "flashcards" | "mindmap" | "audio";

export interface FicheContent {
  titre: string;
  resume: string;
  points_cles: string[];
  definitions: { terme: string; definition: string }[];
  formules: string[];
  a_retenir: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  bonne_reponse: string;
  explication: string;
}

export interface QuizContent {
  titre: string;
  questions: QuizQuestion[];
}

export interface Carte {
  recto: string;
  verso: string;
}

export interface FlashcardsContent {
  titre: string;
  cartes: Carte[];
}

export interface MindMapBranch {
  label: string;
  couleur: "vert" | "bleu" | "orange" | "violet" | "rose" | string;
  sous_branches: { label: string }[];
}

export interface MindMapContent {
  titre: string;
  noeud_central: string;
  branches: MindMapBranch[];
}

export interface DialogueTurn {
  speaker: "A" | "B" | string;
  text: string;
}

export interface AudioContent {
  titre: string;
  dialogue: DialogueTurn[];
  audioUrl?: string;
  audioKey?: string;
}

export interface StudySessionContent {
  fiche?: FicheContent;
  quiz?: QuizContent;
  flashcards?: FlashcardsContent;
  mindmap?: MindMapContent;
  audio?: AudioContent;
}

// ---------------------------------------------------------------------------
// Q&A — V2
// ---------------------------------------------------------------------------

export interface QAMessage {
  question: string;
  answer: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// StudySession complet
// ---------------------------------------------------------------------------

export interface StudySession {
  id: number;
  owner: number;
  owner_username: string;
  resource: number | null;
  resource_title: string;
  source_filename: string;
  tool_types: ToolType[];
  content: StudySessionContent;
  qa_history: QAMessage[];
  has_qa: boolean;           // true si extracted_text est disponible
  is_shared: boolean;
  shared_in_sphere: number | null;
  sphere_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySessionListItem {
  id: number;
  resource: number | null;
  resource_title: string;
  source_filename: string;
  tool_types: ToolType[];
  content_preview: string;
  has_qa: boolean;
  is_shared: boolean;
  shared_in_sphere: number | null;
  sphere_name: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// AnnaleSession — V2
// ---------------------------------------------------------------------------

export type AnnaleMode = "complete" | "rapide";

export type QuestionType = "qcm" | "ouvert" | "code" | "preuve";

// ——— Ancien format (rétrocompatibilité) ———
export interface AnnaleCorrection {
  question: string;
  reponse: string;
  explication?: string;
  chapitre?: string;
  a_retenir?: string;
  source_cours?: string;
}

// ——— Nouveau format Smart (sections + questions typées) ———
export interface AnnaleQuestion {
  numero: string;
  enonce: string;
  reponse: string;
  explication?: string;
  source_cours?: string;
  type: QuestionType;
}

export interface AnnaleSection {
  nom: string;
  questions: AnnaleQuestion[];
}

export interface AnnaleContent {
  titre: string;
  /** Nouveau format structuré (prompt smart) */
  sections?: AnnaleSection[];
  /** Ancien format plat (rétrocompatibilité sessions existantes) */
  corrections?: AnnaleCorrection[];
  conseils_generaux?: string[];
}

export interface AnnaleSession {
  id: number;
  owner: number;
  owner_username: string;
  mode: AnnaleMode;
  source_filename: string;
  resource: number | null;
  source_title: string;
  cours_resource: number | null;
  cours_title: string | null;
  content: AnnaleContent;
  is_shared: boolean;
  shared_in_sphere: number | null;
  sphere_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnaleSessionListItem {
  id: number;
  mode: AnnaleMode;
  source_filename: string;
  resource: number | null;
  source_title: string;
  corrections_count: number;
  is_shared: boolean;
  shared_in_sphere: number | null;
  sphere_name: string | null;
  created_at: string;
}
