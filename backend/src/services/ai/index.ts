/**
 * Sphera generation — the layer between the routes and the model providers.
 *
 * Each function validates its input, builds a prompt, runs the fallback chain and
 * parses the result. Failures surface as typed API errors so routes never have to
 * guess whether a rejection is the student's problem (400) or ours (503).
 */

import { badRequest, serviceUnavailable } from "../../lib/errors.js";
import { parseJsonWithFallback, UnparseableModelOutputError } from "./json.js";
import { annalePrompt, qaPrompt, suggestionsPrompt, toolPrompt, type AnnaleMode, type ToolType } from "./prompts.js";
import { AllProvidersFailedError, callWithFallback, TOKENS_ANNALE, TOKENS_DEFAULT } from "./providers.js";

/** Below this, a document has no usable content — usually a failed scan. */
export const MIN_SOURCE_CHARS = 50;

export const VALID_TOOL_TYPES: readonly ToolType[] = ["fiche", "quiz", "flashcards"];

export const isToolType = (value: string): value is ToolType =>
  (VALID_TOOL_TYPES as readonly string[]).includes(value);

/**
 * Map a generation failure onto the right status.
 *
 * Provider exhaustion and unparseable output are both 503: the student did nothing
 * wrong and retrying may work. Anything else propagates unchanged.
 */
function asApiError(error: unknown): Error {
  if (error instanceof AllProvidersFailedError) {
    return serviceUnavailable("La génération IA a échoué. Réessaie dans quelques instants.", error.message);
  }
  if (error instanceof UnparseableModelOutputError) {
    return serviceUnavailable("La réponse de l'IA était illisible. Réessaie.", error.message);
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
}

/** Generate one V1 tool (fiche, quiz or flashcards). */
export async function generateTool(text: string, toolType: ToolType): Promise<Record<string, unknown>> {
  assertUsableSource(text);
  try {
    return parseJsonWithFallback(await callWithFallback(toolPrompt(toolType, text), TOKENS_DEFAULT));
  } catch (error) {
    throw asApiError(error);
  }
}

/** Answer a question grounded only in the supplied source text. Returns prose. */
export async function generateQaAnswer(sourceText: string, question: string): Promise<string> {
  assertUsableSource(sourceText, "Le texte du cours");
  try {
    return (await callWithFallback(qaPrompt(sourceText, question), TOKENS_DEFAULT)).trim();
  } catch (error) {
    throw asApiError(error);
  }
}

/** Correct an exam paper, optionally cross-referenced against a course. */
export async function generateAnnale(
  annaleText: string,
  mode: AnnaleMode,
  coursText?: string | null,
): Promise<Record<string, unknown>> {
  assertUsableSource(annaleText, "Le texte de l'annale");
  try {
    return parseJsonWithFallback(await callWithFallback(annalePrompt(annaleText, mode, coursText), TOKENS_ANNALE));
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
export async function generateSuggestions(text: string): Promise<string[]> {
  if (!text || text.trim().length < MIN_SOURCE_CHARS) return [];
  try {
    const data = parseJsonWithFallback(await callWithFallback(suggestionsPrompt(text.slice(0, 8000)), TOKENS_DEFAULT));
    const suggestions = data.suggestions;
    if (!Array.isArray(suggestions)) return [];
    return suggestions.filter((s): s is string => typeof s === "string").slice(0, 4);
  } catch (error) {
    console.warn("[sphera] suggestion generation failed:", error);
    return [];
  }
}

export type { AnnaleMode, ToolType };
