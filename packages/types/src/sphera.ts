// =========================================================================
// Sphera — Types TypeScript (V1 + V2 + Live)
// =========================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  cached?: boolean;
  error?: string;
  message?: string;
}

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
  noeud_central: string;
  branches: MindMapBranch[];
  titre?: string;
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

export interface QAMessage {
  question: string;
  answer: string;
  created_at: string;
}

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
  has_qa: boolean;
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

export type AnnaleMode = "complete" | "rapide";
export type QuestionType = "qcm" | "ouvert" | "code" | "preuve";

export interface AnnaleCorrection {
  question: string;
  reponse: string;
  explication?: string;
  chapitre?: string;
  a_retenir?: string;
  source_cours?: string;
}

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
  sections?: AnnaleSection[];
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

export interface GenerationQuota {
  used: number;
  remaining: number;
  limit: number;
  resets_at?: string;
  resetsOn?: string;
  is_unlimited?: boolean;
}

export interface SpheraPreferencesData {
  language: string;
  detail_level: 'concis' | 'standard' | 'approfondi';
  tone: 'decontracte' | 'formel';
  quiz_question_count: number | null;
  quiz_time_limit: number;
  flashcard_count: number | null;
  theme: 'system' | 'sombre' | 'clair';
  created_at: string;
  updated_at: string;
}

export interface SpheraProfileData {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string | null;
  university: string;
  faculty: string;
  study_year: string;
  edit_url: string;
}

export interface SpheraStatsData {
  total_sessions: number;
  current_streak: number;
  longest_streak: number;
  favorite_tool: string;
  tool_counts: Record<string, number>;
  activity_grid: Record<string, number>;
}
