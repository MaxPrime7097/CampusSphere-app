/**
 * Sphera V3 — Interchangeable TTS Provider service.
 *
 * Supports Amazon Polly and Azure Speech with seamless switching via TTS_PROVIDER env var.
 * Polly is used while Azure account is temporarily suspended.
 * Azure Speech code is strictly preserved and ready to be re-activated.
 */

import { PollyClient, SynthesizeSpeechCommand, type VoiceId, type Engine } from "@aws-sdk/client-polly";
import sdk from "microsoft-cognitiveservices-speech-sdk";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

export interface DialogueTurn {
  speaker: "A" | "B" | string;
  text: string;
}

export interface AudioToolContent {
  titre: string;
  dialogue: DialogueTurn[];
  audioUrl?: string;
  audioKey?: string;
  ttsProvider?: string;
}

// ─── XML / SSML Escaping ───────────────────────────────────────────────────

export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Amazon Polly Provider ──────────────────────────────────────────────────

const POLLY_VOICES: Record<string, { A: VoiceId; B: VoiceId }> = {
  fr: { A: "Mathieu", B: "Lea" },
  en: { A: "Matthew", B: "Joanna" },
};

let _pollyClient: PollyClient | null = null;

function getPollyClient(): PollyClient | null {
  if (_pollyClient) return _pollyClient;

  const accessKeyId =
    env.ai.bedrock.accessKeyId ||
    env.storage.accessKeyId ||
    process.env.AWS_ACCESS_KEY_ID ||
    "";
  const secretAccessKey =
    env.ai.bedrock.secretAccessKey ||
    env.storage.secretAccessKey ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    "";

  if (!accessKeyId || !secretAccessKey) {
    console.warn("[sphera-polly] AWS credentials missing for Polly synthesis.");
    return null;
  }

  const region = env.ai.tts.pollyRegion || "eu-west-1";
  _pollyClient = new PollyClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _pollyClient;
}

async function synthesizePollySegment(
  client: PollyClient,
  text: string,
  voiceId: VoiceId,
): Promise<Buffer> {
  const safeText = escapeXml(text);
  const ssml = `<speak>${safeText}<break time="400ms"/></speak>`;

  // Try neural engine first for high quality, fallback to standard if unavailable
  let engine: Engine = "neural";
  try {
    const command = new SynthesizeSpeechCommand({
      Text: ssml,
      TextType: "ssml",
      OutputFormat: "mp3",
      VoiceId: voiceId,
      Engine: engine,
    });
    const response = await client.send(command);
    if (!response.AudioStream) throw new Error("Polly did not return an AudioStream");

    const chunks: Buffer[] = [];
    for await (const chunk of response.AudioStream as any) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  } catch (err: any) {
    // If neural is unsupported for this voice/region, retry with standard
    if (err?.name === "UnsupportedFeatureException" || err?.message?.includes("neural")) {
      console.warn(`[sphera-polly] Neural engine unavailable for ${voiceId}, falling back to standard engine.`);
      const fallbackCommand = new SynthesizeSpeechCommand({
        Text: ssml,
        TextType: "ssml",
        OutputFormat: "mp3",
        VoiceId: voiceId,
        Engine: "standard",
      });
      const response = await client.send(fallbackCommand);
      if (!response.AudioStream) throw new Error("Polly fallback did not return an AudioStream");

      const chunks: Buffer[] = [];
      for await (const chunk of response.AudioStream as any) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }
    throw err;
  }
}

/**
 * Synthesizes a 2-voice dialogue using Amazon Polly.
 * Synthesizes each speaker turn separately and concatenates the MP3 frames.
 */
export async function synthesizeWithPolly(
  dialogue: DialogueTurn[],
  lang: string = "fr",
): Promise<Buffer | null> {
  const client = getPollyClient();
  if (!client) return null;

  const normalizedLang = lang.toLowerCase().startsWith("en") ? "en" : "fr";
  const voices = POLLY_VOICES[normalizedLang] || POLLY_VOICES.fr;

  try {
    const segmentBuffers: Buffer[] = [];
    for (const turn of dialogue) {
      const speakerKey = turn.speaker?.toUpperCase() === "B" ? "B" : "A";
      const voiceId = voices[speakerKey] || voices.A;
      const turnBuffer = await synthesizePollySegment(client, turn.text || "", voiceId);
      segmentBuffers.push(turnBuffer);
    }

    return Buffer.concat(segmentBuffers);
  } catch (error) {
    console.error("[sphera-polly] Failed to synthesize dialogue with Amazon Polly:", error);
    return null;
  }
}

// ─── Azure Speech Provider (Preserved) ──────────────────────────────────────

const AZURE_VOICES: Record<string, { A: string; B: string }> = {
  fr: { A: "fr-FR-HenriNeural", B: "fr-FR-DeniseNeural" },
  en: { A: "en-US-GuyNeural", B: "en-US-JennyNeural" },
};

export function buildSSML(dialogue: DialogueTurn[], lang: string = "fr"): string {
  const normalizedLang = lang.toLowerCase().startsWith("en") ? "en" : "fr";
  const voices = AZURE_VOICES[normalizedLang] || AZURE_VOICES.fr;
  const xmlLang = normalizedLang === "en" ? "en-US" : "fr-FR";

  const turns = dialogue
    .map((turn) => {
      const speakerKey = turn.speaker?.toUpperCase() === "B" ? "B" : "A";
      const voiceName = voices[speakerKey] || voices.A;
      const safeText = escapeXml(turn.text || "");
      return `<voice name="${voiceName}"><mstts:express-as style="chat">${safeText}</mstts:express-as></voice><break time="400ms"/>`;
    })
    .join("\n");

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="${xmlLang}">
${turns}
</speak>`;
}

/**
 * Synthesizes dialogue script into an MP3 buffer using Azure Speech SDK.
 */
export async function synthesizeWithAzure(
  dialogue: DialogueTurn[],
  lang: string = "fr",
): Promise<Buffer | null> {
  const { key, region } = env.ai.azureSpeech;

  if (!key) {
    console.warn("[sphera-azure] AZURE_SPEECH_KEY is not set. Skipping Azure Speech synthesis.");
    return null;
  }

  const tmpFilename = `sphera_azure_${randomUUID()}.mp3`;
  const tmpFilePath = path.join(os.tmpdir(), tmpFilename);

  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3;

    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(tmpFilePath);
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
    const ssml = buildSSML(dialogue, lang);

    await new Promise<void>((resolve, reject) => {
      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          synthesizer.close();
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            resolve();
          } else {
            const errorDetails = result.errorDetails || "Unknown Azure Speech error";
            reject(new Error(`Azure Speech synthesis failed: ${errorDetails}`));
          }
        },
        (error) => {
          synthesizer.close();
          reject(new Error(String(error)));
        },
      );
    });

    const buffer = await fsp.readFile(tmpFilePath);
    return buffer;
  } catch (error) {
    console.error("[sphera-azure] Failed to synthesize dialogue with Azure Speech:", error);
    return null;
  } finally {
    if (fs.existsSync(tmpFilePath)) {
      fsp.unlink(tmpFilePath).catch(() => undefined);
    }
  }
}

// ─── Unified TTS Provider Dispatcher ────────────────────────────────────────

/**
 * Synthesizes speech dialogue using the configured TTS provider (Polly or Azure).
 * Defaults to Amazon Polly while Azure account is being resolved.
 */
export async function synthesizeSpeech(
  dialogue: DialogueTurn[],
  lang: string = "fr",
): Promise<{ buffer: Buffer | null; provider: "polly" | "azure" }> {
  const preferredProvider = env.ai.tts.provider || "polly";

  if (preferredProvider === "azure") {
    const azureResult = await synthesizeWithAzure(dialogue, lang);
    if (azureResult) return { buffer: azureResult, provider: "azure" };

    // Fallback to Polly if Azure fails
    console.warn("[sphera-tts] Azure Speech failed or unconfigured, falling back to Amazon Polly.");
    const pollyResult = await synthesizeWithPolly(dialogue, lang);
    return { buffer: pollyResult, provider: "polly" };
  } else {
    const pollyResult = await synthesizeWithPolly(dialogue, lang);
    if (pollyResult) return { buffer: pollyResult, provider: "polly" };

    // Fallback to Azure if Polly fails
    console.warn("[sphera-tts] Amazon Polly failed or unconfigured, attempting Azure Speech.");
    const azureResult = await synthesizeWithAzure(dialogue, lang);
    return { buffer: azureResult, provider: "azure" };
  }
}
