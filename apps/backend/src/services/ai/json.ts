/**
 * Parsing model output into JSON.
 *
 * Models wrap JSON in markdown fences, prepend commentary, and — when they hit the
 * token ceiling — stop mid-object. All three are recovered here, in the same three
 * escalating strategies Django used, because a truncated quiz is still worth 19
 * questions to the student.
 */

/** Strip a markdown fence, if present, and parse. */
export function cleanJson(raw: string): unknown {
  let text = raw.trim();
  if (text.startsWith("```")) {
    const lines = text.split("\n");
    if (lines[0].startsWith("```")) lines.shift();
    if (lines.length > 0 && lines[lines.length - 1].trim() === "```") lines.pop();
    text = lines.join("\n").trim();
  }
  return JSON.parse(text);
}

/**
 * Close a JSON document truncated mid-write.
 *
 * Walks backwards for the last position that could end a value, then appends the
 * brackets needed to balance it. Every candidate is validated by an actual parse,
 * so a "repair" that does not produce valid JSON is never returned.
 */
function repairTruncatedJson(raw: string): string {
  for (let end = raw.length; end > 0; end--) {
    const candidate = raw.slice(0, end).trimEnd();
    if (candidate.length === 0) continue;

    const last = candidate[candidate.length - 1];
    if (last !== "}" && last !== "]" && last !== '"') continue;

    const openObjects = count(candidate, "{") - count(candidate, "}");
    const openArrays = count(candidate, "[") - count(candidate, "]");
    if (openObjects < 0 || openArrays < 0) continue;

    const repaired = candidate + "]".repeat(openArrays) + "}".repeat(openObjects);
    try {
      JSON.parse(repaired);
      return repaired;
    } catch {
      // Keep walking back.
    }
  }
  return raw;
}

const count = (haystack: string, needle: string): number => haystack.split(needle).length - 1;

export class UnparseableModelOutputError extends Error {
  constructor(raw: string) {
    super(`Réponse IA illisible (JSON irrécupérable). Début: ${raw.slice(0, 200)}`);
    this.name = "UnparseableModelOutputError";
  }
}

/** Parse model output as JSON, escalating through recovery strategies. */
export function parseJsonWithFallback(raw: string): Record<string, unknown> {
  // 1. Straight parse, fence removed.
  try {
    return cleanJson(raw) as Record<string, unknown>;
  } catch {
    // fall through
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}") + 1;

  // 2. Slice out the outermost object, discarding prose either side.
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end)) as Record<string, unknown>;
    } catch {
      // fall through
    }
  }

  // 3. Balance a truncated document.
  if (start !== -1) {
    try {
      return JSON.parse(repairTruncatedJson(raw.slice(start))) as Record<string, unknown>;
    } catch {
      // fall through
    }
  }

  throw new UnparseableModelOutputError(raw);
}
