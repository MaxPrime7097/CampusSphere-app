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
