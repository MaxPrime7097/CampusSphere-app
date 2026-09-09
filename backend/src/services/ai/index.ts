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
import { buildContextPrefix, getUserAcademicContext } from "./userContext.js";

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

/** Generate one V1 tool (fiche, quiz or flashcards). */
export async function generateTool(
  text: string,
  toolType: ToolType,
  userId?: number,
): Promise<Record<string, unknown>> {
  assertUsableSource(text);
  const prefix = await resolveContextPrefix(userId);
  const prompt = prefix + toolPrompt(toolType, text);
  try {
    return parseJsonWithFallback(
      await callWithFallback(prompt, TOKENS_DEFAULT, { toolType, userId }),
    );
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
    return parseJsonWithFallback(
      await callWithFallback(prompt, TOKENS_ANNALE, { toolType: "annale", userId }),
    );
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

export type { AnnaleMode, ToolType };
