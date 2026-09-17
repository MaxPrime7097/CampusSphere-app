/**
 * Sphera internals — the parts that cannot be reached through HTTP without a live
 * AI provider.
 *
 * Three of the migration's most consequential fixes live behind a provider call:
 * the annale prompt that raised on every invocation, the JSON recovery that keeps a
 * truncated generation usable, and the corrections count that always reported zero.
 * Without an API key the contract suite can only observe a 503, so these assert the
 * same behaviour directly.
 *
 * Unlike the contract specs, this file imports application code on purpose.
 */

import { describe, it, expect } from "vitest";
import { annalePrompt, qaPrompt, suggestionsPrompt, toolPrompt } from "../../src/services/ai/prompts.js";
import { cleanJson, parseJsonWithFallback, UnparseableModelOutputError } from "../../src/services/ai/json.js";
import { correctionsCount } from "../../src/serializers/sphera.js";
import {
  escapeXml,
  buildSSML,
  cleanSpokenText,
  detectLanguage,
  normalizeSpeaker,
  sanitizeDialogueTurns,
} from "../../src/services/ttsProvider.js";

describe("prompt construction", () => {
  const SOURCE = "Chapitre 1. La thermodynamique étudie les échanges d'énergie.";

  it("builds every annale variant without throwing", () => {
    // [CHANGE] This is the Django defect. The four annale prompts embedded a JSON
    // example written with single braces and were passed through Python's
    // str.format(), which read `{\n  "titre": ...}` as a replacement field and
    // raised KeyError on EVERY call — so every annale generation returned 503, for
    // every user, in both modes, for the life of the deployment.
    for (const mode of ["complete", "rapide"] as const) {
      expect(() => annalePrompt(SOURCE, mode)).not.toThrow();
      expect(() => annalePrompt(SOURCE, mode, "Un cours de référence assez long pour dépasser le seuil.")).not.toThrow();
    }
  });

  it("embeds the JSON example literally rather than interpolating it", () => {
    const prompt = annalePrompt(SOURCE, "complete");
    expect(prompt).toContain('"titre": "Exam Title"');
    expect(prompt).toContain('"type": "qcm|ouvert|code|preuve"');
    // No placeholder may survive into the text sent to the model.
    expect(prompt).not.toContain("{text}");
    expect(prompt).not.toContain("${");
  });

  it("includes the source text in every prompt kind", () => {
    expect(toolPrompt("fiche", SOURCE)).toContain(SOURCE);
    expect(toolPrompt("quiz", SOURCE)).toContain(SOURCE);
    expect(toolPrompt("flashcards", SOURCE)).toContain(SOURCE);
    expect(toolPrompt("mindmap", SOURCE)).toContain(SOURCE);
    expect(toolPrompt("audio", SOURCE)).toContain(SOURCE);
    expect(annalePrompt(SOURCE, "complete")).toContain(SOURCE);
    expect(suggestionsPrompt(SOURCE)).toContain(SOURCE);
    expect(qaPrompt(SOURCE, "Qu'est-ce que l'enthalpie ?")).toContain("Qu'est-ce que l'enthalpie ?");
  });

  it("selects the cross-referenced variant only when the course is substantial", () => {
    // A course whose extraction failed must not turn every `source_cours` into a
    // fabricated citation, so short course text falls back to the plain prompt.
    const withShortCourse = annalePrompt(SOURCE, "complete", "trop court");
    expect(withShortCourse).not.toContain("source_cours");

    const withRealCourse = annalePrompt(SOURCE, "complete", "x".repeat(60));
    expect(withRealCourse).toContain("source_cours");
  });

  it("rejects an unknown tool type", () => {
    expect(() => toolPrompt("annale" as never, SOURCE)).toThrow();
  });
});

describe("model output parsing", () => {
  it("parses plain JSON", () => {
    expect(cleanJson('{"titre":"T"}')).toEqual({ titre: "T" });
  });

  it("strips a markdown fence", () => {
    expect(cleanJson('```json\n{"titre":"T"}\n```')).toEqual({ titre: "T" });
    expect(cleanJson('```\n{"titre":"T"}\n```')).toEqual({ titre: "T" });
  });

  it("discards prose on either side of the object", () => {
    const raw = 'Voici ta fiche :\n{"titre":"T","points_cles":["a"]}\nBonne révision !';
    expect(parseJsonWithFallback(raw)).toEqual({ titre: "T", points_cles: ["a"] });
  });

  it("repairs a generation truncated at the token ceiling", () => {
    // A quiz cut off mid-array is still worth 2 questions to the student.
    const truncated = '{"titre":"Quiz","questions":[{"question":"Q1"},{"question":"Q2"},{"question":"Q3';
    const parsed = parseJsonWithFallback(truncated) as { titre: string; questions: unknown[] };
    expect(parsed.titre).toBe("Quiz");
    expect(parsed.questions).toHaveLength(2);
  });

  it("throws a typed error when nothing is recoverable", () => {
    expect(() => parseJsonWithFallback("the model refused to answer")).toThrow(UnparseableModelOutputError);
  });
});

describe("corrections_count", () => {
  const content = {
    titre: "Examen",
    sections: [
      { nom: "Section A", questions: [{ numero: "1" }, { numero: "2" }, { numero: "3" }] },
      { nom: "Section B", questions: [{ numero: "1" }, { numero: "2" }] },
    ],
  };

  it("counts every question across every section", () => {
    // [CHANGE] Django read a top-level `content["corrections"]` key that the annale
    // prompts have never produced — they emit `sections[].questions[]` — so this
    // always returned 0 on every annale list row.
    expect(correctionsCount(content)).toBe(5);
    expect(correctionsCount({ corrections: [1, 2, 3] })).toBe(0);
  });

  it("returns 0 for malformed or empty content rather than throwing", () => {
    expect(correctionsCount({})).toBe(0);
    expect(correctionsCount(null)).toBe(0);
    expect(correctionsCount({ sections: "not an array" })).toBe(0);
    expect(correctionsCount({ sections: [{ nom: "A" }] })).toBe(0);
  });
});

describe("tts provider & ssml", () => {
  it("escapes XML special characters safely", () => {
    expect(escapeXml("Tom & Jerry <friends> 'yes' \"no\"")).toBe(
      "Tom &amp; Jerry &lt;friends&gt; &apos;yes&apos; &quot;no&quot;"
    );
  });

  it("builds SSML with multi-speaker voices and chat style", () => {
    const dialogue = [
      { speaker: "A", text: "Bienvenue dans ce cours & révision." },
      { speaker: "B", text: "Peux-tu m'expliquer le premier point ?" },
    ];
    const ssmlFr = buildSSML(dialogue, "fr");
    expect(ssmlFr).toContain('xml:lang="fr-FR"');
    expect(ssmlFr).toContain("fr-FR-HenriNeural");
    expect(ssmlFr).toContain("fr-FR-DeniseNeural");
    expect(ssmlFr).toContain("Bienvenue dans ce cours &amp; révision.");
    expect(ssmlFr).toContain('<mstts:express-as style="chat">');

    const ssmlEn = buildSSML(dialogue, "en");
    expect(ssmlEn).toContain('xml:lang="en-US"');
    expect(ssmlEn).toContain("en-US-GuyNeural");
    expect(ssmlEn).toContain("en-US-JennyNeural");
  });

  it("strips speaker labels like Étudiant 1: from dialogue text", () => {
    expect(cleanSpokenText("Étudiant 1 : Bonjour à tous !")).toBe("Bonjour à tous !");
    expect(cleanSpokenText("etudiant 2: Exactement, continuons.")).toBe("Exactement, continuons.");
    expect(cleanSpokenText("Student 1 - Hello everyone")).toBe("Hello everyone");
    expect(cleanSpokenText("Speaker A: Let's discuss this.")).toBe("Let's discuss this.");
    expect(cleanSpokenText("Locuteur B — C'est vrai.")).toBe("C'est vrai.");
    expect(cleanSpokenText("A : Première question.")).toBe("Première question.");
    expect(cleanSpokenText("B: Deuxième réponse.")).toBe("Deuxième réponse.");
    expect(cleanSpokenText("Texte normal sans préfixe.")).toBe("Texte normal sans préfixe.");
  });

  it("detects French vs English text accurately", () => {
    const frText = "Dans ce cours nous allons étudier le principe de conservation de l'énergie et la thermodynamique.";
    const enText = "In this course we will study the conservation of energy and thermodynamics with examples.";
    expect(detectLanguage(frText)).toBe("fr");
    expect(detectLanguage(enText)).toBe("en");
  });

  it("sanitizes dialogue turns and normalizes speaker keys", () => {
    const rawDialogue = [
      { speaker: "1", text: "Étudiant 1 : Premier point." },
      { speaker: "2", text: "Étudiant 2 : Deuxième point." },
      { speaker: "B", text: "B : Troisième point." },
    ];
    const cleaned = sanitizeDialogueTurns(rawDialogue);
    expect(cleaned).toEqual([
      { speaker: "A", text: "Premier point." },
      { speaker: "B", text: "Deuxième point." },
      { speaker: "B", text: "Troisième point." },
    ]);
  });

  it("normalizes diverse speaker representations accurately", () => {
    expect(normalizeSpeaker("Étudiant A", 0)).toBe("A");
    expect(normalizeSpeaker("Étudiant B", 1)).toBe("B");
    expect(normalizeSpeaker("Student 1", 0)).toBe("A");
    expect(normalizeSpeaker("Student 2", 1)).toBe("B");
    expect(normalizeSpeaker("locuteur b", 1)).toBe("B");
    expect(normalizeSpeaker("speaker a", 0)).toBe("A");
    expect(normalizeSpeaker("explicateur", 0)).toBe("A");
    expect(normalizeSpeaker("curieux", 1)).toBe("B");
    expect(normalizeSpeaker(1, 0)).toBe("A");
    expect(normalizeSpeaker(2, 1)).toBe("B");
    expect(normalizeSpeaker("", 0)).toBe("A");
    expect(normalizeSpeaker("", 1)).toBe("B");
  });

  it("safeguards against single-speaker output by enforcing alternation", () => {
    // When a model erroneously marks all turns as 'A', strict alternation is enforced
    const monologue = [
      { speaker: "A", text: "Premier point." },
      { speaker: "A", text: "Deuxième point." },
      { speaker: "A", text: "Troisième point." },
      { speaker: "A", text: "Quatrième point." },
    ];
    const cleaned = sanitizeDialogueTurns(monologue);
    expect(cleaned).toEqual([
      { speaker: "A", text: "Premier point." },
      { speaker: "B", text: "Deuxième point." },
      { speaker: "A", text: "Troisième point." },
      { speaker: "B", text: "Quatrième point." },
    ]);
  });
});
