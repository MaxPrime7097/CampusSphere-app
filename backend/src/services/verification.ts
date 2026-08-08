/**
 * Student-card verification — API_CONTRACT §3.2.
 *
 * A vision model reads the uploaded card and reports whether it looks like a
 * student ID belonging to this user. Gemini Flash first, Groq Llama Vision as
 * fallback, matching Django's `verification_service.py`.
 *
 * Deliberately advisory, never blocking. The route saves the student id and card
 * image first and calls this afterwards: if the model is slow, unavailable or
 * simply wrong, the student's submission is still recorded and can be reviewed by
 * an admin through the verification queue. An identity check that silently discards
 * a submission because an API call failed is worse than no check.
 *
 * A negative result is not a rejection — it means "not auto-approved".
 */

import { env } from "../config/env.js";
import { parseJsonWithFallback } from "./ai/json.js";

export interface VerificationResult {
  verified: boolean;
  provider: string | null;
  data: Record<string, unknown> | null;
}

const UNVERIFIED: VerificationResult = { verified: false, provider: null, data: null };

/** Confidence floor for automatic approval, unchanged from Django. */
const CONFIDENCE_THRESHOLD = 0.7;

const REQUEST_TIMEOUT_MS = 45_000;

function prompt(fullName: string, university: string): string {
  return `
Analyze this image and determine if it is a valid student identity card.
Compare the information on the card with:
- Name: ${fullName}
- University: ${university}

Return a JSON object with:
- "is_student_card": boolean
- "name_matches": boolean (high confidence match with ${fullName})
- "university_matches": boolean (match with ${university})
- "confidence_score": number (0-1)
- "extracted_name": string
- "extracted_university": string

Only return the JSON.
`;
}

/** Auto-approval requires a card, a name match, and confidence above the floor. */
function passes(result: Record<string, unknown>): boolean {
  return (
    result.is_student_card === true &&
    result.name_matches === true &&
    typeof result.confidence_score === "number" &&
    result.confidence_score > CONFIDENCE_THRESHOLD
  );
}

async function post(url: string, init: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function analyseWithGemini(
  image: Buffer,
  mimeType: string,
  fullName: string,
  university: string,
): Promise<Record<string, unknown>> {
  const data = (await post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env.ai.geminiApiKey ?? "" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt(fullName, university) },
              { inline_data: { mime_type: mimeType, data: image.toString("base64") } },
            ],
          },
        ],
      }),
    },
  )) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  if (!text) throw new Error("Réponse Gemini vide");
  return parseJsonWithFallback(text);
}

async function analyseWithGroq(
  image: Buffer,
  mimeType: string,
  fullName: string,
  university: string,
): Promise<Record<string, unknown>> {
  const data = (await post("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.ai.groqApiKey ?? ""}` },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt(fullName, university) },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${image.toString("base64")}` } },
          ],
        },
      ],
    }),
  })) as { choices?: Array<{ message?: { content?: string } }> };

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Réponse Groq vide");
  return parseJsonWithFallback(text);
}

/**
 * Analyse a student card.
 *
 * Never throws: every failure resolves to `{verified: false}`, so the caller has
 * exactly one code path.
 */
export async function analyseStudentCard(
  image: Buffer,
  mimeType: string,
  fullName: string,
  university: string,
): Promise<VerificationResult> {
  if (env.ai.geminiApiKey) {
    try {
      const result = await analyseWithGemini(image, mimeType, fullName, university);
      if (passes(result)) return { verified: true, provider: "gemini", data: result };
      return { verified: false, provider: "gemini", data: result };
    } catch (error) {
      console.warn("[verification] Gemini analysis failed, trying Groq:", error);
    }
  }

  if (env.ai.groqApiKey) {
    try {
      const result = await analyseWithGroq(image, mimeType, fullName, university);
      if (passes(result)) return { verified: true, provider: "groq", data: result };
      return { verified: false, provider: "groq", data: result };
    } catch (error) {
      console.warn("[verification] Groq analysis failed:", error);
    }
  }

  return UNVERIFIED;
}
