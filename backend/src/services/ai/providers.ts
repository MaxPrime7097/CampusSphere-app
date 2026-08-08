/**
 * AI provider chain — API_CONTRACT §3.9.
 *
 * Claude Haiku → Gemini Flash → Groq Llama. First success wins; if all three fail
 * the caller gets a 503. Same models and same order as Django.
 *
 * Called over plain HTTP rather than through three vendor SDKs: the request shapes
 * are small and stable, and three SDKs would be three dependency trees, three
 * release cadences and three sets of transitive CVEs for what amounts to a POST.
 *
 * **[CHANGE] The dead `gemini-pro` link is gone.** Django's chain listed four
 * providers, the second and third both Gemini — but `_call_gemini` ignored its
 * `model_name` parameter and hardcoded `gemini-2.5-flash`, so the "gemini-pro"
 * entry re-issued the identical request that had just failed. It could only ever
 * add latency to the failure path.
 */

import { env } from "../../config/env.js";

/** Providers get their own timeout: a hung upstream must not hold a request open. */
const REQUEST_TIMEOUT_MS = 120_000;

export interface ProviderAttempt {
  name: string;
  error: string;
}

async function postJson(url: string, init: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body.slice(0, 300)}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function callClaude(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = env.ai.anthropicApiKey;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY non configurée");

  const data = (await postJson("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  })) as { content?: Array<{ type: string; text?: string }> };

  const text = data.content?.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Réponse Claude vide");
  return text;
}

async function callGemini(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = env.ai.geminiApiKey;
  if (!apiKey) throw new Error("GEMINI_API_KEY non configurée");

  const data = (await postJson(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    },
  )) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw new Error("Réponse Gemini vide");
  return text;
}

async function callGroq(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = env.ai.groqApiKey;
  if (!apiKey) throw new Error("GROQ_API_KEY non configurée");

  const data = (await postJson("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  })) as { choices?: Array<{ message?: { content?: string } }> };

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Réponse Groq vide");
  return text;
}

interface Provider {
  name: string;
  call: (prompt: string, maxTokens: number) => Promise<string>;
}

const CHAIN: Provider[] = [
  { name: "claude", call: callClaude },
  { name: "gemini-2.5-flash", call: callGemini },
  { name: "groq", call: callGroq },
];

/** Annale JSON is far larger than a fiche, so it gets a bigger budget. */
export const TOKENS_DEFAULT = 3000;
export const TOKENS_ANNALE = 8000;

export class AllProvidersFailedError extends Error {
  readonly attempts: ProviderAttempt[];
  constructor(attempts: ProviderAttempt[]) {
    const detail = attempts.map((a) => `${a.name}: ${a.error}`).join(" | ");
    super(`Tous les providers IA ont échoué. ${detail}`);
    this.name = "AllProvidersFailedError";
    this.attempts = attempts;
  }
}

/** Try each provider in order; return the first raw completion that succeeds. */
export async function callWithFallback(prompt: string, maxTokens = TOKENS_DEFAULT): Promise<string> {
  const attempts: ProviderAttempt[] = [];

  for (const provider of CHAIN) {
    try {
      console.log(`[sphera-ai] trying ${provider.name}`);
      const result = await provider.call(prompt, maxTokens);
      console.log(`[sphera-ai] ${provider.name} succeeded`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[sphera-ai] ${provider.name} failed: ${message}`);
      attempts.push({ name: provider.name, error: message });
    }
  }

  throw new AllProvidersFailedError(attempts);
}

/** True when at least one provider has a key. Used by /api/health/ diagnostics. */
export const anyProviderConfigured = (): boolean =>
  Boolean(env.ai.anthropicApiKey || env.ai.geminiApiKey || env.ai.groqApiKey);
