/**
 * AI provider routing & fallback chain — based on documentation/features/AI_ROUTING_FINAL.md.
 *
 * Task-based routing:
 * - Fiche / Quiz / Flashcards  → DeepSeek V3.2 (Bedrock) → Claude Haiku 4.5 (Bedrock) → Gemini → Groq
 * - Annales / Q&A              → Claude Haiku 4.5 (Bedrock) → DeepSeek V3.2 (Bedrock) → Gemini → Groq
 * - Suggestions                → Groq (gpt-oss-120b) → DeepSeek (Bedrock) → Claude (Bedrock) → Gemini
 */

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@smithy/core/checksum";
import { HttpRequest } from "@smithy/core/transport";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";

/** Providers get their own timeout: a hung upstream must not hold a request open. */
const REQUEST_TIMEOUT_MS = 120_000;

// Bedrock Mantle pricing (configured in env.ts)
export const MANTLE_CLAUDE_INPUT_PRICE = env.ai.bedrockMantle.claudeInputPrice;
export const MANTLE_CLAUDE_OUTPUT_PRICE = env.ai.bedrockMantle.claudeOutputPrice;

export const MANTLE_DEEPSEEK_INPUT_PRICE = env.ai.bedrockMantle.deepseekInputPrice;
export const MANTLE_DEEPSEEK_OUTPUT_PRICE = env.ai.bedrockMantle.deepseekOutputPrice;

export const MANTLE_MINIMAX_INPUT_PRICE = env.ai.bedrockMantle.minimaxInputPrice;
export const MANTLE_MINIMAX_OUTPUT_PRICE = env.ai.bedrockMantle.minimaxOutputPrice;

// Legacy pricing constants kept for backwards compatibility
export const CLAUDE_INPUT_PRICE = MANTLE_CLAUDE_INPUT_PRICE;
export const CLAUDE_OUTPUT_PRICE = MANTLE_CLAUDE_OUTPUT_PRICE;
export const DEEPSEEK_INPUT_PRICE = MANTLE_DEEPSEEK_INPUT_PRICE;
export const DEEPSEEK_OUTPUT_PRICE = MANTLE_DEEPSEEK_OUTPUT_PRICE;

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

/** Record token consumption and estimated cost across all providers into AIUsageLog (non-blocking). */
function recordUsageLog(
  provider: string,
  model: string,
  meta: CallMeta | undefined,
  inputTokens: number,
  outputTokens: number,
  costUsd: number,
): void {
  prisma.aIUsageLog
    .create({
      data: {
        userId: meta?.userId ?? null,
        provider,
        model,
        toolType: meta?.toolType ?? "other",
        inputTokensEstimate: inputTokens,
        outputTokensEstimate: outputTokens,
        estimatedCostUSD: costUsd,
      },
    })
    .catch((logError: any) => {
      console.warn(`[sphera-ai] Failed to save AIUsageLog for ${provider}:`, logError?.message || logError);
    });
}

/**
 * Resolves a Claude model ID for AWS Bedrock.
 *
 * Modern Anthropic models (Claude 3.5 Haiku, Claude 3.5 Sonnet, etc.) cannot be
 * invoked on-demand using their raw foundation model ID; AWS Bedrock requires an
 * Inference Profile ID (e.g. `us.anthropic.claude-3-5-haiku-20241022-v1:0` or
 * `eu.anthropic.claude-3-5-haiku-20241022-v1:0`).
 */
export function resolveBedrockClaudeModelId(rawId: string, region: string): string {
  let modelId = (rawId || "").trim();

  // If unset, default to Haiku 4.5 inference profile
  if (!modelId) {
    const prefix = region.startsWith("eu-") ? "eu." : region.startsWith("ap-") ? "apac." : "us.";
    return `${prefix}anthropic.claude-haiku-4-5-20251001-v1:0`;
  }

  // Already an inference profile or full ARN
  if (
    modelId.startsWith("arn:aws:bedrock:") ||
    modelId.startsWith("us.") ||
    modelId.startsWith("eu.") ||
    modelId.startsWith("apac.") ||
    modelId.startsWith("cr.")
  ) {
    return modelId;
  }

  // Bedrock on-demand throughput requires an inference profile ID (e.g. us. or eu.)
  if (modelId.startsWith("anthropic.claude-")) {
    const prefix = region.startsWith("eu-") ? "eu." : region.startsWith("ap-") ? "apac." : "us.";
    return `${prefix}${modelId}`;
  }

  return modelId;
}

/**
 * Signs an HTTP request targeting the Amazon Bedrock Mantle endpoint using official
 * AWS/Smithy SDK primitives (`@smithy/signature-v4`, `@smithy/core/checksum`, `@smithy/core/transport`).
 */
export async function signMantleRequest(
  url: string,
  bodyString: string,
): Promise<{ headers: Record<string, string> }> {
  const mantleConfig = env.ai.bedrockMantle;
  const { accessKeyId, secretAccessKey } = env.ai.bedrock;

  if (mantleConfig.apiKey) {
    return {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${mantleConfig.apiKey}`,
      },
    };
  }

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS_ACCESS_KEY_ID ou AWS_SECRET_ACCESS_KEY non configurés pour Bedrock Mantle");
  }

  const parsedUrl = new URL(url);
  const signer = new SignatureV4({
    credentials: { accessKeyId, secretAccessKey },
    region: mantleConfig.region,
    service: "bedrock-mantle",
    sha256: Sha256,
  });

  const request = new HttpRequest({
    method: "POST",
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port ? Number(parsedUrl.port) : undefined,
    path: parsedUrl.pathname,
    headers: {
      "content-type": "application/json",
      host: parsedUrl.hostname,
    },
    body: bodyString,
  });

  const signed = await signer.sign(request);
  return { headers: signed.headers as Record<string, string> };
}

interface MantleChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string; role?: string };
    text?: string;
    finish_reason?: string;
  }>;
  content?: Array<{ type: string; text?: string }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
  };
}

/**
 * Generic caller for Amazon Bedrock Mantle OpenAI-compatible endpoints with official AWS SigV4 signing.
 */
export async function callMantleModel(
  providerName: string,
  modelId: string,
  prompt: string,
  maxTokens: number,
  inputPrice: number,
  outputPrice: number,
  meta?: CallMeta,
): Promise<string> {
  const endpoint = env.ai.bedrockMantle.endpoint.replace(/\/+$/, "");
  const url = `${endpoint}/chat/completions`;

  const payload = {
    model: modelId,
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature: 0,
  };
  const bodyString = JSON.stringify(payload);

  const signed = await signMantleRequest(url, bodyString);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: signed.headers,
      body: bodyString,
      signal: controller.signal,
    });
  } catch (fetchError: any) {
    if (fetchError?.name === "AbortError") {
      throw new Error(`Timeout Mantle (${REQUEST_TIMEOUT_MS}ms dépassé pour ${modelId})`);
    }
    throw new Error(`Erreur réseau Mantle (${modelId}): ${fetchError?.message || String(fetchError)}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const errorText = await response.text();
    let detailMsg = errorText.slice(0, 300);
    try {
      const parsed = JSON.parse(errorText);
      detailMsg = parsed?.error?.message || parsed?.message || detailMsg;
    } catch {
      // plain text error
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `IAM SigV4 / Accès refusé pour Bedrock Mantle (${modelId}): HTTP ${response.status} - ${detailMsg}. ` +
          "Vérifier la permission 'bedrock-mantle:CreateInference' sur vos identifiants IAM AWS.",
      );
    }
    if (response.status === 404) {
      throw new Error(`Modèle introuvable sur Bedrock Mantle (${modelId}): HTTP 404 - ${detailMsg}`);
    }
    if (response.status === 429) {
      throw new Error(`Rate limit / Throttling Bedrock Mantle (${modelId}): HTTP 429 - ${detailMsg}`);
    }
    throw new Error(`HTTP ${response.status} Bedrock Mantle (${modelId}): ${detailMsg}`);
  }

  const responseBody = (await response.json()) as MantleChatCompletionResponse;

  const choice = responseBody.choices?.[0];
  const text =
    choice?.message?.content ??
    choice?.text ??
    responseBody.content?.find((b) => b.type === "text")?.text;

  if (!text || !text.trim()) {
    if (choice?.finish_reason === "length") {
      throw new Error(
        `Réponse tronquée par le plafond de tokens (max_tokens=${maxTokens}) avant finalisation du contenu pour ${modelId}`,
      );
    }
    throw new Error(`Réponse vide reçue de Bedrock Mantle (${modelId})`);
  }

  const inputTokens =
    responseBody.usage?.prompt_tokens ??
    responseBody.usage?.input_tokens ??
    Math.ceil(prompt.length / 4);
  const outputTokens =
    responseBody.usage?.completion_tokens ??
    responseBody.usage?.output_tokens ??
    Math.ceil(text.length / 4);
  const cost = inputTokens * inputPrice + outputTokens * outputPrice;

  recordUsageLog(providerName, modelId, meta, inputTokens, outputTokens, cost);
  return text;
}

/** Call DeepSeek V3.2 via Amazon Bedrock Mantle. */
export async function callMantleDeepSeek(prompt: string, maxTokens: number, meta?: CallMeta): Promise<string> {
  const modelId = env.ai.bedrockMantle.deepseekModelId;
  const { deepseekInputPrice, deepseekOutputPrice } = env.ai.bedrockMantle;
  return callMantleModel(
    "bedrock-mantle-deepseek",
    modelId,
    prompt,
    maxTokens,
    deepseekInputPrice,
    deepseekOutputPrice,
    meta,
  );
}

/** Call MiniMax M2.5 via Amazon Bedrock Mantle. */
export async function callMantleMiniMax(prompt: string, maxTokens: number, meta?: CallMeta): Promise<string> {
  const modelId = env.ai.bedrockMantle.minimaxModelId;
  const { minimaxInputPrice, minimaxOutputPrice } = env.ai.bedrockMantle;
  return callMantleModel(
    "bedrock-mantle-minimax",
    modelId,
    prompt,
    maxTokens,
    minimaxInputPrice,
    minimaxOutputPrice,
    meta,
  );
}

/**
 * Call Claude Haiku via Amazon Bedrock Mantle using the Anthropic Messages API surface
 * (`/anthropic/v1/messages`).
 */
export async function callMantleClaude(prompt: string, maxTokens: number, meta?: CallMeta): Promise<string> {
  const modelId = env.ai.bedrockMantle.claudeModelId;
  const { claudeInputPrice, claudeOutputPrice } = env.ai.bedrockMantle;
  const endpointBase = env.ai.bedrockMantle.endpoint.replace(/\/v1\/?$/, "");
  const url = `${endpointBase}/anthropic/v1/messages`;

  const payload = {
    model: modelId,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  };
  const bodyString = JSON.stringify(payload);

  const signed = await signMantleRequest(url, bodyString);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: signed.headers,
      body: bodyString,
      signal: controller.signal,
    });
  } catch (fetchError: any) {
    if (fetchError?.name === "AbortError") {
      throw new Error(`Timeout Mantle Claude (${REQUEST_TIMEOUT_MS}ms dépassé pour ${modelId})`);
    }
    throw new Error(`Erreur réseau Mantle Claude (${modelId}): ${fetchError?.message || String(fetchError)}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const errorText = await response.text();
    let detailMsg = errorText.slice(0, 300);
    try {
      const parsed = JSON.parse(errorText);
      detailMsg = parsed?.error?.message || parsed?.message || detailMsg;
    } catch {
      // plain text error
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `IAM SigV4 / Accès refusé pour Claude sur Bedrock Mantle (${modelId}): HTTP ${response.status} - ${detailMsg}. ` +
          "Le modèle requiert une autorisation ou activation dans la console AWS Bedrock.",
      );
    }
    if (response.status === 404) {
      throw new Error(`Modèle Claude introuvable sur Bedrock Mantle (${modelId}): HTTP 404 - ${detailMsg}`);
    }
    if (response.status === 429) {
      throw new Error(`Rate limit / Throttling Claude sur Bedrock Mantle (${modelId}): HTTP 429 - ${detailMsg}`);
    }
    throw new Error(`HTTP ${response.status} Bedrock Mantle Claude (${modelId}): ${detailMsg}`);
  }

  const responseBody = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const text = responseBody.content?.find((b) => b.type === "text")?.text;
  if (!text || !text.trim()) {
    throw new Error(`Réponse vide reçue de Bedrock Mantle Claude (${modelId})`);
  }

  const inputTokens = responseBody.usage?.input_tokens ?? Math.ceil(prompt.length / 4);
  const outputTokens = responseBody.usage?.output_tokens ?? Math.ceil(text.length / 4);
  const cost = inputTokens * claudeInputPrice + outputTokens * claudeOutputPrice;

  recordUsageLog("bedrock-mantle-claude", modelId, meta, inputTokens, outputTokens, cost);
  return text;
}

/** Call Claude via AWS Bedrock (Anthropic payload format). */
async function callBedrockClaude(prompt: string, maxTokens: number, meta?: CallMeta): Promise<string> {
  const region = env.ai.bedrock.region;
  const client = getBedrockClient(region);
  const rawModelId = env.ai.bedrock.claudeModelId;
  let modelId = resolveBedrockClaudeModelId(rawModelId, region);

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

  let response;
  try {
    response = await client.send(command);
  } catch (err: any) {
    const errName = err?.name || "";
    const isAccessOrNotFound =
      errName === "ResourceNotFoundException" ||
      errName === "AccessDeniedException" ||
      err?.message?.includes("not authorized to perform: bedrock:InvokeModel") ||
      err?.message?.includes("Model not found");

    if (isAccessOrNotFound && !modelId.includes("claude-3-haiku")) {
      const fallbackModelId = region.startsWith("eu-")
        ? "eu.anthropic.claude-3-haiku-20240307-v1:0"
        : "us.anthropic.claude-3-haiku-20240307-v1:0";
      console.warn(`[sphera-ai] Claude ${modelId} inaccessible (${err?.message}). Trying fallback ${fallbackModelId}...`);
      const fallbackCmd = new InvokeModelCommand({
        modelId: fallbackModelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload),
      });
      response = await client.send(fallbackCmd);
      modelId = fallbackModelId;
    } else {
      throw err;
    }
  }
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

  recordUsageLog("bedrock-claude", modelId, meta, inputTokens, outputTokens, cost);
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

  recordUsageLog("bedrock-deepseek", modelId, meta, inputTokens, outputTokens, cost);
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

  recordUsageLog("gemini", modelId, meta, inputTokens, outputTokens, cost);
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

  recordUsageLog("groq", modelId, meta, inputTokens, outputTokens, 0);
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

export const BEDROCK_PROVIDERS_FOR_BUDGET = [
  "bedrock",
  "bedrock-claude",
  "bedrock-deepseek",
  "bedrock-mantle-deepseek",
  "bedrock-mantle-minimax",
  "bedrock-mantle-claude",
] as const;

/** Check if Bedrock/Mantle budget limit has been reached across all Bedrock models, with 60s in-memory caching. */
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
          in: [...BEDROCK_PROVIDERS_FOR_BUDGET],
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
 * Builds the provider chain tailored to the specific tool task with Amazon Bedrock Mantle:
 * - fiche / quiz / flashcards / mindmap / audio :
 *     DeepSeek (Mantle) / MiniMax (Mantle) → the other Mantle model → Claude (Mantle) → Gemini → Groq
 * - annale / qa :
 *     Claude (Mantle) → DeepSeek (Mantle) → MiniMax (Mantle) → Gemini → Groq
 * - suggestions :
 *     Groq → DeepSeek (Mantle) / MiniMax (Mantle) → Claude (Mantle) → Gemini
 */
export function buildProviderChain(toolType: string | undefined, isBudgetExceeded: boolean): Provider[] {
  const chain: Provider[] = [];

  const mantleDeepSeek: Provider = {
    name: "bedrock-mantle-deepseek",
    call: (p, t, m) => callMantleDeepSeek(p, t, m),
  };
  const mantleMiniMax: Provider = {
    name: "bedrock-mantle-minimax",
    call: (p, t, m) => callMantleMiniMax(p, t, m),
  };
  const mantleClaude: Provider = {
    name: "bedrock-mantle-claude",
    call: (p, t, m) => callMantleClaude(p, t, m),
  };
  const gemini: Provider = {
    name: "gemini-2.5-flash",
    call: (p, t, m) => callGemini(p, t, m),
  };
  const groq: Provider = {
    name: "groq",
    call: (p, t, m) => callGroq(p, t, m),
  };

  const hasMantleConfig = Boolean(
    (env.ai.bedrock.accessKeyId && env.ai.bedrock.secretAccessKey) || env.ai.bedrockMantle.apiKey,
  );
  const allowMantle = hasMantleConfig && !isBudgetExceeded;

  // Ordering structured models: DeepSeek vs MiniMax based on config
  const isMiniMaxPrimary = env.ai.bedrockMantle.primaryStructured === "minimax";
  const primaryStructured = isMiniMaxPrimary ? mantleMiniMax : mantleDeepSeek;
  const secondaryStructured = isMiniMaxPrimary ? mantleDeepSeek : mantleMiniMax;

  if (toolType === "suggestions") {
    // Suggestions are short questions: Groq first (fast and free)
    if (env.ai.groqApiKey) chain.push(groq);
    if (allowMantle) chain.push(primaryStructured, secondaryStructured, mantleClaude);
    if (env.ai.geminiApiKey) chain.push(gemini);
  } else if (toolType === "annale" || toolType === "qa") {
    // Complex reasoning and pedagogical conversational voice: Claude first
    if (allowMantle) chain.push(mantleClaude, primaryStructured, secondaryStructured);
    if (env.ai.geminiApiKey) chain.push(gemini);
    if (env.ai.groqApiKey) chain.push(groq);
  } else {
    // fiche, quiz, flashcards, mindmap, audio and default:
    // primary structured (DeepSeek or MiniMax) -> secondary -> Claude -> Gemini -> Groq
    if (allowMantle) chain.push(primaryStructured, secondaryStructured, mantleClaude);
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
  const hasMantleConfig = Boolean(
    (env.ai.bedrock.accessKeyId && env.ai.bedrock.secretAccessKey) || env.ai.bedrockMantle.apiKey,
  );
  if (hasMantleConfig) {
    try {
      const stats = await getBedrockUsageStats();
      if (stats.isThresholdExceeded) {
        console.warn(
          `[sphera-ai] Seuil de sécurité Bedrock/Mantle atteint (${stats.percentUsed.toFixed(1)}% / ${stats.spent.toFixed(2)}$). Bascule sur providers alternatifs.`,
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
      env.ai.bedrockMantle.apiKey ||
      env.ai.geminiApiKey ||
      env.ai.groqApiKey,
  );

// Retain legacy Runtime references for fallback / transition
export { callBedrockClaude, callBedrockDeepSeek };
export { callBedrockClaude as callBedrockClaudeRuntime, callBedrockDeepSeek as callBedrockDeepSeekRuntime };
