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

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";

/** Providers get their own timeout: a hung upstream must not hold a request open. */
const REQUEST_TIMEOUT_MS = 120_000;

export const BEDROCK_INPUT_PRICE = 1.0 / 1_000_000; // $1.00 / 1M tokens
export const BEDROCK_OUTPUT_PRICE = 5.0 / 1_000_000; // $5.00 / 1M tokens

export interface CallMeta {
  toolType?: string;
  userId?: number;
}

export interface ProviderAttempt {
  name: string;
  error: string;
}

let _bedrockClient: BedrockRuntimeClient | null = null;

function getBedrockClient(): BedrockRuntimeClient {
  if (!_bedrockClient) {
    const { accessKeyId, secretAccessKey, region } = env.ai.bedrock;
    if (!accessKeyId || !secretAccessKey) {
      throw new Error("AWS_ACCESS_KEY_ID ou AWS_SECRET_ACCESS_KEY non configurés pour Bedrock");
    }
    _bedrockClient = new BedrockRuntimeClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _bedrockClient;
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

async function callBedrock(prompt: string, maxTokens: number, meta?: CallMeta): Promise<string> {
  const client = getBedrockClient();
  const modelId = env.ai.bedrock.modelId;

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
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
  };

  const text = responseBody.content?.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Réponse Bedrock vide");

  const inputTokens = responseBody.usage?.input_tokens ?? 0;
  const outputTokens = responseBody.usage?.output_tokens ?? 0;
  const cost = inputTokens * BEDROCK_INPUT_PRICE + outputTokens * BEDROCK_OUTPUT_PRICE;

  try {
    await prisma.aIUsageLog.create({
      data: {
        userId: meta?.userId ?? null,
        provider: "bedrock",
        model: modelId,
        toolType: meta?.toolType ?? "other",
        inputTokensEstimate: inputTokens,
        outputTokensEstimate: outputTokens,
        estimatedCostUSD: cost,
      },
    });
  } catch (logError) {
    console.warn("[sphera-ai] Failed to save AIUsageLog:", logError);
  }

  return text;
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
      model: "openai/gpt-oss-120b",
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
  call: (prompt: string, maxTokens: number, meta?: CallMeta) => Promise<string>;
}

/** Check if Bedrock budget limit has been reached. */
export async function getBedrockUsageStats(): Promise<{
  spent: number;
  budget: number;
  percentUsed: number;
  isThresholdExceeded: boolean;
}> {
  const budget = env.ai.bedrock.budgetUsd;
  const thresholdPercent = env.ai.bedrock.safetyThresholdPercent;

  try {
    const result = await prisma.aIUsageLog.aggregate({
      where: { provider: "bedrock" },
      _sum: { estimatedCostUSD: true },
    });

    const spent = result._sum.estimatedCostUSD ?? 0;
    const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
    const isThresholdExceeded = percentUsed >= thresholdPercent;

    return { spent, budget, percentUsed, isThresholdExceeded };
  } catch (err) {
    console.warn("[sphera-ai] getBedrockUsageStats query failed, assuming nominal budget:", err);
    return { spent: 0, budget, percentUsed: 0, isThresholdExceeded: false };
  }
}


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
export async function callWithFallback(
  prompt: string,
  maxTokens = TOKENS_DEFAULT,
  meta?: CallMeta,
): Promise<string> {
  const attempts: ProviderAttempt[] = [];

  // Determine provider chain dynamically based on credentials and safety threshold
  const providers: Provider[] = [];

  const hasBedrockConfig = Boolean(env.ai.bedrock.accessKeyId && env.ai.bedrock.secretAccessKey);
  if (hasBedrockConfig) {
    try {
      const stats = await getBedrockUsageStats();
      if (stats.isThresholdExceeded) {
        console.warn(
          `[sphera-ai] Seuil de sécurité Bedrock atteint (${stats.percentUsed.toFixed(1)}% / ${stats.spent.toFixed(2)}$). Bascule sur providers alternatifs.`,
        );
      } else {
        providers.push({ name: "bedrock", call: (p, t, m) => callBedrock(p, t, m) });
      }
    } catch (err) {
      console.warn("[sphera-ai] Impossible de vérifier les stats Bedrock, essai Bedrock quand même:", err);
      providers.push({ name: "bedrock", call: (p, t, m) => callBedrock(p, t, m) });
    }
  } else if (env.ai.anthropicApiKey) {
    // Fallback to direct Anthropic if Bedrock credentials are not provided
    providers.push({ name: "claude-direct", call: (p, t) => callClaude(p, t) });
  }

  // Backup providers
  providers.push({ name: "gemini-2.5-flash", call: (p, t) => callGemini(p, t) });
  providers.push({ name: "groq", call: (p, t) => callGroq(p, t) });

  for (const provider of providers) {
    try {
      console.log(`[sphera-ai] trying ${provider.name}`);
      const result = await provider.call(prompt, maxTokens, meta);
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

/** True when at least one provider has credentials configured. */
export const anyProviderConfigured = (): boolean =>
  Boolean(
    (env.ai.bedrock.accessKeyId && env.ai.bedrock.secretAccessKey) ||
      env.ai.anthropicApiKey ||
      env.ai.geminiApiKey ||
      env.ai.groqApiKey,
  );

