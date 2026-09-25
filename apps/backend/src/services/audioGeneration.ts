/**
 * Sphera V3 — Audio summary generation (2-voice dialogue, podcast style).
 *
 * Re-exports the interchangeable TTS Provider (Polly / Azure) and maintains
 * backwards compatibility for existing imports.
 */

export * from "./ttsProvider.js";
import { synthesizeSpeech, type DialogueTurn } from "./ttsProvider.js";

/**
 * Backwards compatibility alias for synthesizeSpeech returning Buffer directly.
 */
export async function synthesizeDialogue(
  dialogue: DialogueTurn[],
  lang: string = "fr",
): Promise<Buffer | null> {
  const result = await synthesizeSpeech(dialogue, lang);
  return result.buffer;
}
