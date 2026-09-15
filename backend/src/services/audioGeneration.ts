/**
 * Sphera V3 — Audio summary generation (2-voice dialogue, podcast style).
 *
 * Combines LLM dialogue script generation with Azure Speech neural text-to-speech (TTS)
 * using SSML for natural multi-speaker conversations.
 */

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
}

const VOICES: Record<string, { A: string; B: string }> = {
  fr: { A: "fr-FR-HenriNeural", B: "fr-FR-DeniseNeural" },
  en: { A: "en-US-GuyNeural", B: "en-US-JennyNeural" },
};

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Builds SSML markup for a 2-voice conversational exchange.
 */
export function buildSSML(dialogue: DialogueTurn[], lang: string = "fr"): string {
  const normalizedLang = lang.toLowerCase().startsWith("en") ? "en" : "fr";
  const voices = VOICES[normalizedLang] || VOICES.fr;
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
 * Synthesizes dialogue script into an MP3 audio buffer using Azure Speech SDK.
 * Returns null if Azure Speech credentials are not configured or if synthesis fails.
 */
export async function synthesizeDialogue(
  dialogue: DialogueTurn[],
  lang: string = "fr",
): Promise<Buffer | null> {
  const { key, region } = env.ai.azureSpeech;

  if (!key) {
    console.warn("[sphera-audio] AZURE_SPEECH_KEY is not set. Skipping audio synthesis (dialogue transcript only).");
    return null;
  }

  const tmpFilename = `sphera_audio_${randomUUID()}.mp3`;
  const tmpFilePath = path.join(os.tmpdir(), tmpFilename);

  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    // Request MP3 128kbps output for optimal web quality & size balance
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
    console.error("[sphera-audio] Failed to synthesize dialogue with Azure Speech:", error);
    return null;
  } finally {
    if (fs.existsSync(tmpFilePath)) {
      fsp.unlink(tmpFilePath).catch(() => undefined);
    }
  }
}
