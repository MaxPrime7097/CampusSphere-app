/**
 * Sphera generation — the layer between the routes and the model providers.
 *
 * Each function validates its input, builds a prompt, runs the fallback chain and
 * parses the result. Failures surface as typed API errors so routes never have to
 * guess whether a rejection is the student's problem (400) or ours (503).
 */

import { badRequest, serviceUnavailable } from "../../lib/errors.js";
import { parseJsonWithFallback, UnparseableModelOutputError } from "./json.js";
import { annalePrompt, qaPrompt, suggestionsPrompt, toolPrompt, quizFromSelectionPrompt, flashcardFromSelectionPrompt, type AnnaleMode, type ToolType } from "./prompts.js";
import { AllProvidersFailedError, callWithFallback, TOKENS_ANNALE, TOKENS_DEFAULT, TOKENS_FLASHCARDS, TOKENS_QUIZ } from "./providers.js";
import { buildContextPrefix, getUserAcademicContext } from "./userContext.js";

/** Below this, a document has no usable content — usually a failed scan. */
export const MIN_SOURCE_CHARS = 50;

/** Above this, we reject to prevent budget explosion and context window overflow. */
export const MAX_SOURCE_CHARS = 40_000;

export const VALID_TOOL_TYPES: readonly ToolType[] = ["fiche", "quiz", "flashcards"];

export const isToolType = (value: string): value is ToolType =>
  (VALID_TOOL_TYPES as readonly string[]).includes(value);

/** Token budget per tool type. Quiz and flashcards get more room for 20 items. */
const TOOL_TOKENS: Record<ToolType, number> = {
  fiche: TOKENS_DEFAULT,
  quiz: TOKENS_QUIZ,
  flashcards: TOKENS_FLASHCARDS,
};

/**
 * Map a generation failure onto the right status.
 *
 * Provider exhaustion and unparseable output are both 503: the student did nothing
 * wrong and retrying may work. Anything else propagates unchanged.
 *
 * Internal error details are logged server-side but never exposed to the client.
 */
function asApiError(error: unknown): Error {
  if (error instanceof AllProvidersFailedError) {
    console.error("[sphera-ai] All providers failed:", error.message);
    return serviceUnavailable("La génération IA a échoué. Réessaie dans quelques instants.");
  }
  if (error instanceof UnparseableModelOutputError) {
    console.error("[sphera-ai] Unparseable model output:", error.message);
    return serviceUnavailable("La réponse de l'IA était illisible. Réessaie.");
  }
  return error instanceof Error ? error : new Error(String(error));
}

function assertUsableSource(text: string, what = "Le texte extrait"): void {
  if (!text || text.length < MIN_SOURCE_CHARS) {
    throw badRequest(
      `${what} est trop court. Ce document ne contient pas de texte extractible. ` +
        "Essaie avec un document numérique contenant du vrai texte.",
    );
  }
  if (text.length > MAX_SOURCE_CHARS) {
    throw badRequest(
      `${what} est trop long (${Math.round(text.length / 1000)}k caractères). ` +
        `La limite est de ${Math.round(MAX_SOURCE_CHARS / 1000)}k caractères. ` +
        "Essaie avec un extrait plus court ou un chapitre spécifique.",
    );
  }
}

async function resolveContextPrefix(userId?: number): Promise<string> {
  if (!userId) return "";
  try {
    const context = await getUserAcademicContext(userId);
    return buildContextPrefix(context);
  } catch (err) {
    console.warn("[sphera-ai] Failed to load academic context:", err);
    return "";
  }
}

function validateToolOutput(toolType: ToolType, data: Record<string, unknown>): Record<string, unknown> {
  if (toolType === "quiz") {
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new UnparseableModelOutputError("Le modèle n'a pas retourné de questions de quiz valides.");
    }
  } else if (toolType === "flashcards") {
    if (!Array.isArray(data.cartes) || data.cartes.length === 0) {
      throw new UnparseableModelOutputError("Le modèle n'a pas retourné de cartes mémoires valides.");
    }
  } else if (toolType === "fiche") {
    if (typeof data.resume !== "string" && !Array.isArray(data.points_cles)) {
      throw new UnparseableModelOutputError("Le modèle n'a pas retourné de résumé ou points clés valides.");
    }
  }
  return data;
}

function validateAnnaleOutput(data: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    throw new UnparseableModelOutputError("Le modèle n'a pas retourné de sections valides pour l'annale.");
  }
  return data;
}

/** Generate one V1 tool (fiche, quiz or flashcards). */
export async function generateTool(
  text: string,
  toolType: ToolType,
  userId?: number,
): Promise<Record<string, unknown>> {
  assertUsableSource(text);
  const prefix = await resolveContextPrefix(userId);
  const prompt = prefix + toolPrompt(toolType, text);
  const maxTokens = TOOL_TOKENS[toolType] ?? TOKENS_DEFAULT;
  try {
    const raw = await callWithFallback(prompt, maxTokens, { toolType, userId });
    return validateToolOutput(toolType, parseJsonWithFallback(raw));
  } catch (error) {
    throw asApiError(error);
  }
}

/** Answer a question grounded only in the supplied source text. Returns prose. */
export async function generateQaAnswer(
  sourceText: string,
  question: string,
  userId?: number,
): Promise<string> {
  assertUsableSource(sourceText, "Le texte du cours");
  const prefix = await resolveContextPrefix(userId);
  const prompt = prefix + qaPrompt(sourceText, question);
  try {
    return (
      await callWithFallback(prompt, TOKENS_DEFAULT, { toolType: "qa", userId })
    ).trim();
  } catch (error) {
    throw asApiError(error);
  }
}

/** Correct an exam paper, optionally cross-referenced against a course. */
export async function generateAnnale(
  annaleText: string,
  mode: AnnaleMode,
  coursText?: string | null,
  userId?: number,
): Promise<Record<string, unknown>> {
  assertUsableSource(annaleText, "Le texte de l'annale");
  const prefix = await resolveContextPrefix(userId);
  const prompt = prefix + annalePrompt(annaleText, mode, coursText);
  try {
    const raw = await callWithFallback(prompt, TOKENS_ANNALE, { toolType: "annale", userId });
    return validateAnnaleOutput(parseJsonWithFallback(raw));
  } catch (error) {
    throw asApiError(error);
  }
}

/**
 * Four exam-prep questions about a course.
 *
 * Returns [] rather than throwing on any failure: suggestions are a convenience,
 * and a provider outage should not turn a working session page into an error page.
 */
export async function generateSuggestions(text: string, userId?: number): Promise<string[]> {
  if (!text || text.trim().length < MIN_SOURCE_CHARS) return [];
  const prefix = await resolveContextPrefix(userId);
  const prompt = prefix + suggestionsPrompt(text.slice(0, 8000));
  try {
    const data = parseJsonWithFallback(
      await callWithFallback(prompt, TOKENS_DEFAULT, { toolType: "suggestions", userId }),
    );
    const suggestions = data.suggestions;
    if (!Array.isArray(suggestions)) return [];
    return suggestions.filter((s): s is string => typeof s === "string").slice(0, 4);
  } catch (error) {
    console.warn("[sphera] suggestion generation failed:", error);
    return [];
  }
}

/**
 * Generate 1 targeted item (quiz or flashcard) based strictly on a user selection.
 */
export async function generateFromSelection(
  selectedText: string,
  toolType: "quiz" | "flashcards",
  userId?: number,
): Promise<Record<string, unknown>> {
  assertUsableSource(selectedText, "Le passage sélectionné");
  const prefix = await resolveContextPrefix(userId);
  const prompt = prefix + (toolType === "quiz" ? quizFromSelectionPrompt(selectedText) : flashcardFromSelectionPrompt(selectedText));
  const maxTokens = 2000;
  try {
    const raw = await callWithFallback(prompt, maxTokens, { toolType, userId });
    return validateToolOutput(toolType, parseJsonWithFallback(raw));
  } catch (error) {
    throw asApiError(error);
  }
}

export type { AnnaleMode, ToolType };
