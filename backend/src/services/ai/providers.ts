/**
 * AI provider routing & fallback chain — based on AI_ROUTING_FINAL.md.
 *
 * Task-based routing:
 * - Fiche / Quiz / Flashcards  → DeepSeek V3.2 (Bedrock) → Claude Haiku 4.5 (Bedrock) → Gemini → Groq
 * - Annales / Q&A              → Claude Haiku 4.5 (Bedrock) → DeepSeek V3.2 (Bedrock) → Gemini → Groq
 * - Suggestions                → Groq (gpt-oss-120b) → DeepSeek (Bedrock) → Claude (Bedrock) → Gemini
 */

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";

/** Providers get their own timeout: a hung upstream must not hold a request open. */
const REQUEST_TIMEOUT_MS = 120_000;

// Bedrock Claude Haiku pricing: $1.00 / 1M input, $5.00 / 1M output
export const CLAUDE_INPUT_PRICE = 1.0 / 1_000_000;
export const CLAUDE_OUTPUT_PRICE = 5.0 / 1_000_000;

// Bedrock DeepSeek V3.2 pricing: $0.62 / 1M input, $1.85 / 1M output
export const DEEPSEEK_INPUT_PRICE = 0.62 / 1_000_000;
export const DEEPSEEK_OUTPUT_PRICE = 1.85 / 1_000_000;

export interface CallMeta {
  toolType?: string;
  userId?: number;
}

export interface ProviderAttempt {
  name: string;
  error: string;
}

const _bedrockClients = new Map<string, BedrockRuntimeClient>();

function getBedrockClient(region: string): BedrockRuntimeClient {
  let client = _bedrockClients.get(region);
  if (!client) {
    const { accessKeyId, secretAccessKey } = env.ai.bedrock;
    if (!accessKeyId || !secretAccessKey) {
      throw new Error("AWS_ACCESS_KEY_ID ou AWS_SECRET_ACCESS_KEY non configurés pour Bedrock");
    }
    client = new BedrockRuntimeClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    _bedrockClients.set(region, client);
  }
  return client;
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

/** Record token consumption and estimated cost across all providers into AIUsageLog. */
async function recordUsageLog(
  provider: string,
  model: string,
  meta: CallMeta | undefined,
  inputTokens: number,
  outputTokens: number,
  costUsd: number,
): Promise<void> {
  try {
    await prisma.aIUsageLog.create({
      data: {
        userId: meta?.userId ?? null,
        provider,
        model,
        toolType: meta?.toolType ?? "other",
        inputTokensEstimate: inputTokens,
        outputTokensEstimate: outputTokens,
        estimatedCostUSD: costUsd,
      },
    });
  } catch (logError) {
    console.warn(`[sphera-ai] Failed to save AIUsageLog for ${provider}:`, logError);
  }
}

/** Call Claude Haiku 4.5 via AWS Bedrock (Anthropic payload format). */
async function callBedrockClaude(prompt: string, maxTokens: number, meta?: CallMeta): Promise<string> {
  const region = env.ai.bedrock.region;
  const client = getBedrockClient(region);
  const modelId = env.ai.bedrock.claudeModelId;

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
    stop_reason?: string;
  };

  if (responseBody.stop_reason === "max_tokens") {
    console.warn(
      `[sphera-ai] Claude response truncated (stop_reason=max_tokens, budget=${maxTokens}, tool=${meta?.toolType ?? "unknown"})`,
    );
  }

  const text = responseBody.content?.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Réponse Bedrock Claude vide");

  const inputTokens = responseBody.usage?.input_tokens ?? 0;
  const outputTokens = responseBody.usage?.output_tokens ?? 0;
  const cost = inputTokens * CLAUDE_INPUT_PRICE + outputTokens * CLAUDE_OUTPUT_PRICE;

  await recordUsageLog("bedrock-claude", modelId, meta, inputTokens, outputTokens, cost);
  return text;
}

/** Call DeepSeek V3.2 via AWS Bedrock (OpenAI-compatible payload format). */
async function callBedrockDeepSeek(prompt: string, maxTokens: number, meta?: CallMeta): Promise<string> {
  const region = env.ai.bedrock.deepseekRegion;
  const client = getBedrockClient(region);
  const modelId = env.ai.bedrock.deepseekModelId;

  const payload = {
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature: 0,
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as {
    choices?: Array<{
      message?: { content?: string };
      text?: string;
      finish_reason?: string;
    }>;
    content?: Array<{ type: string; text?: string }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      input_tokens?: number;
      output_tokens?: number;
    };
  };

  // Defensive extraction supporting both OpenAI and Anthropic-style responses on Bedrock
  const text =
    responseBody.choices?.[0]?.message?.content ??
    responseBody.choices?.[0]?.text ??
    responseBody.content?.find((b) => b.type === "text")?.text;

  if (!text) throw new Error("Réponse Bedrock DeepSeek vide");

  const inputTokens =
    responseBody.usage?.prompt_tokens ??
    responseBody.usage?.input_tokens ??
    Math.ceil(prompt.length / 4);
  const outputTokens =
    responseBody.usage?.completion_tokens ??
    responseBody.usage?.output_tokens ??
    Math.ceil(text.length / 4);
  const cost = inputTokens * DEEPSEEK_INPUT_PRICE + outputTokens * DEEPSEEK_OUTPUT_PRICE;

  await recordUsageLog("bedrock-deepseek", modelId, meta, inputTokens, outputTokens, cost);
  return text;
}

async function callGemini(prompt: string, maxTokens: number, meta?: CallMeta): Promise<string> {
  const apiKey = env.ai.geminiApiKey;
  if (!apiKey) throw new Error("GEMINI_API_KEY non configurée");

  const modelId = "gemini-2.5-flash";
  const data = (await postJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0 },
      }),
    },
  )) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw new Error("Réponse Gemini vide");

  const inputTokens = data.usageMetadata?.promptTokenCount ?? Math.ceil(prompt.length / 4);
  const outputTokens = data.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4);
  const cost = inputTokens * (0.075 / 1_000_000) + outputTokens * (0.30 / 1_000_000);

  await recordUsageLog("gemini", modelId, meta, inputTokens, outputTokens, cost);
  return text;
}

async function callGroq(prompt: string, maxTokens: number, meta?: CallMeta): Promise<string> {
  const apiKey = env.ai.groqApiKey;
  if (!apiKey) throw new Error("GROQ_API_KEY non configurée");

  const modelId = "openai/gpt-oss-120b";
  const data = (await postJson("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    }),
  })) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Réponse Groq vide");

  const inputTokens = data.usage?.prompt_tokens ?? Math.ceil(prompt.length / 4);
  const outputTokens = data.usage?.completion_tokens ?? Math.ceil(text.length / 4);

  await recordUsageLog("groq", modelId, meta, inputTokens, outputTokens, 0);
  return text;
}

interface Provider {
  name: string;
  call: (prompt: string, maxTokens: number, meta?: CallMeta) => Promise<string>;
}

export interface BedrockStats {
  spent: number;
  budget: number;
  percentUsed: number;
  isThresholdExceeded: boolean;
}

/** In-memory cache for Bedrock usage stats (60s TTL) to prevent repeated DB aggregation queries. */
let _cachedBedrockStats: { stats: BedrockStats; expiresAt: number } | null = null;
const STATS_CACHE_TTL_MS = 60_000;

/** Check if Bedrock budget limit has been reached across all Bedrock models, with 60s in-memory caching. */
export async function getBedrockUsageStats(forceRefresh = false): Promise<BedrockStats> {
  const now = Date.now();
  if (!forceRefresh && _cachedBedrockStats && now < _cachedBedrockStats.expiresAt) {
    return _cachedBedrockStats.stats;
  }

  const budget = env.ai.bedrock.budgetUsd;
  const thresholdPercent = env.ai.bedrock.safetyThresholdPercent;

  try {
    const result = await prisma.aIUsageLog.aggregate({
      where: {
        provider: {
          in: ["bedrock", "bedrock-claude", "bedrock-deepseek"],
        },
      },
      _sum: { estimatedCostUSD: true },
    });

    const spent = result._sum.estimatedCostUSD ?? 0;
    const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
    const isThresholdExceeded = percentUsed >= thresholdPercent;

    const stats: BedrockStats = { spent, budget, percentUsed, isThresholdExceeded };
    _cachedBedrockStats = { stats, expiresAt: now + STATS_CACHE_TTL_MS };
    return stats;
  } catch (err) {
    console.warn("[sphera-ai] getBedrockUsageStats query failed, assuming nominal budget:", err);
    return { spent: 0, budget, percentUsed: 0, isThresholdExceeded: false };
  }
}

/** Token budgets per tool type. Quiz and flashcards need more room for 20-30 items. */
export const TOKENS_DEFAULT = 3000;
export const TOKENS_QUIZ = 6000;
export const TOKENS_FLASHCARDS = 4096;
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

/**
 * Builds the provider chain tailored to the specific tool task:
 * - fiche / quiz / flashcards : DeepSeek (Bedrock) → Claude (Bedrock) → Gemini → Groq
 * - annale / qa              : Claude (Bedrock) → DeepSeek (Bedrock) → Gemini → Groq
 * - suggestions              : Groq → DeepSeek (Bedrock) → Claude (Bedrock) → Gemini
 */
function buildProviderChain(toolType: string | undefined, isBudgetExceeded: boolean): Provider[] {
  const chain: Provider[] = [];

  const bedrockDeepSeek: Provider = {
    name: "bedrock-deepseek",
    call: (p, t, m) => callBedrockDeepSeek(p, t, m),
  };
  const bedrockClaude: Provider = {
    name: "bedrock-claude",
    call: (p, t, m) => callBedrockClaude(p, t, m),
  };
  const gemini: Provider = {
    name: "gemini-2.5-flash",
    call: (p, t, m) => callGemini(p, t, m),
  };
  const groq: Provider = {
    name: "groq",
    call: (p, t, m) => callGroq(p, t, m),
  };

  const hasBedrockConfig = Boolean(env.ai.bedrock.accessKeyId && env.ai.bedrock.secretAccessKey);
  const allowBedrock = hasBedrockConfig && !isBudgetExceeded;

  if (toolType === "suggestions") {
    // Suggestions are short questions: Groq first (fast and free)
    if (env.ai.groqApiKey) chain.push(groq);
    if (allowBedrock) chain.push(bedrockDeepSeek, bedrockClaude);
    if (env.ai.geminiApiKey) chain.push(gemini);
  } else if (toolType === "annale" || toolType === "qa") {
    // Complex reasoning and pedagogical conversational voice: Claude first
    if (allowBedrock) chain.push(bedrockClaude, bedrockDeepSeek);
    if (env.ai.geminiApiKey) chain.push(gemini);
    if (env.ai.groqApiKey) chain.push(groq);
  } else {
    // fiche, quiz, flashcards and default: DeepSeek first (cheaper, validated for structured items)
    if (allowBedrock) chain.push(bedrockDeepSeek, bedrockClaude);
    if (env.ai.geminiApiKey) chain.push(gemini);
    if (env.ai.groqApiKey) chain.push(groq);
  }

  return chain;
}

/** Try each provider in order; return the first raw completion that succeeds. */
export async function callWithFallback(
  prompt: string,
  maxTokens = TOKENS_DEFAULT,
  meta?: CallMeta,
): Promise<string> {
  const attempts: ProviderAttempt[] = [];

  let isBudgetExceeded = false;
  const hasBedrockConfig = Boolean(env.ai.bedrock.accessKeyId && env.ai.bedrock.secretAccessKey);
  if (hasBedrockConfig) {
    try {
      const stats = await getBedrockUsageStats();
      if (stats.isThresholdExceeded) {
        console.warn(
          `[sphera-ai] Seuil de sécurité Bedrock atteint (${stats.percentUsed.toFixed(1)}% / ${stats.spent.toFixed(2)}$). Bascule sur providers alternatifs.`,
        );
        isBudgetExceeded = true;
      }
    } catch (err) {
      console.warn("[sphera-ai] Impossible de vérifier les stats Bedrock, tentative normale:", err);
    }
  }

  const providers = buildProviderChain(meta?.toolType, isBudgetExceeded);

  for (const provider of providers) {
    try {
      console.log(`[sphera-ai] trying ${provider.name} for ${meta?.toolType ?? "unknown"}`);
      const result = await provider.call(prompt, maxTokens, meta);
      console.log(`[sphera-ai] ${provider.name} succeeded for ${meta?.toolType ?? "unknown"}`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[sphera-ai] ${provider.name} failed: ${message}`);
      attempts.push({ name: provider.name, error: message });
    }
  }

  throw new AllProvidersFailedError(attempts);
}

/** True when at least one provider has credentials configured. */
export const anyProviderConfigured = (): boolean =>
  Boolean(
    (env.ai.bedrock.accessKeyId && env.ai.bedrock.secretAccessKey) ||
      env.ai.geminiApiKey ||
      env.ai.groqApiKey,
  );
