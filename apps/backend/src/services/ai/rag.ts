/**
 * Adaptive Hybrid RAG & Conversational Context for Sphera Q&A.
 *
 * Provides:
 * 1. Adaptive document chunking & BM25 / TF-IDF retrieval for large documents.
 * 2. Conversational sliding window history formatting.
 * 3. Smart query expansion with recent dialogue turns for anaphora resolution.
 */

export interface QaEntry {
  question: string;
  answer: string;
  created_at?: string;
}

export interface DocumentChunk {
  id: number;
  text: string;
  heading?: string;
}

/** Threshold in characters: below this, send the entire document (no chunking needed). */
export const RAG_DOC_THRESHOLD_CHARS = 25_000;

/** Target chunk size in characters (~300-400 words) */
export const CHUNK_SIZE = 1_800;
/** Overlap between consecutive chunks to avoid breaking concepts across boundaries */
export const CHUNK_OVERLAP = 300;

// Common stopwords (FR + EN) to avoid scoring on noise words
const STOPWORDS = new Set([
  "le", "la", "les", "un", "une", "des", "du", "de", "d", "l", "ce", "cet", "cette", "ces",
  "mon", "ton", "son", "notre", "votre", "leur", "mes", "tes", "ses", "nos", "vos", "leurs",
  "qui", "que", "quoi", "dont", "ou", "où", "quand", "comment", "pourquoi", "est", "sont",
  "a", "ont", "dans", "en", "sur", "sous", "par", "pour", "avec", "sans", "comme", "mais",
  "et", "donc", "or", "ni", "car", "plus", "moins", "tres", "très", "aussi", "bien", "peux",
  "peut", "faire", "dire", "avoir", "etre", "être", "cours", "session", "document", "question",
  "reponse", "réponse", "explique", "expliquer", "donne", "donner",
  "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "with", "by", "from", "is",
  "are", "was", "were", "it", "this", "that", "these", "those", "what", "how", "why", "can",
  "could", "would", "should", "explain", "give", "tell", "course", "document", "answer", "about",
  "please", "help", "summary", "detail", "definition",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));
}

/**
 * Splits a document into overlapping chunks while preserving paragraph integrity
 * and detecting section headers.
 */
export function chunkDocument(text: string): DocumentChunk[] {
  if (!text || text.length <= RAG_DOC_THRESHOLD_CHARS) {
    return [{ id: 0, text }];
  }

  const chunks: DocumentChunk[] = [];
  const paragraphs = text.split(/\n\s*\n+/);
  let currentChunk = "";
  let currentHeading = "";
  let chunkId = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Detect heading (Markdown # or short uppercase or Chapitre/Chapter/Section/Partie/Part/Module/Unit/Lecture)
    const isHeading =
      /^#{1,4}\s+|^(chapitre|chapter|section|partie|part|cours|course|thème|theme|topic|unit|lecture|module)\s+\d+/i.test(trimmed) ||
      (trimmed.length < 80 && /^[A-Z0-9\s:._-]{5,}$/.test(trimmed));

    if (isHeading) {
      currentHeading = trimmed.slice(0, 100);
    }

    if (currentChunk.length + trimmed.length > CHUNK_SIZE && currentChunk.length > 500) {
      chunks.push({
        id: chunkId++,
        text: currentChunk.trim(),
        heading: currentHeading || undefined,
      });
      // Keep overlap from end of current chunk
      const overlapText = currentChunk.slice(-CHUNK_OVERLAP);
      currentChunk = overlapText + "\n\n" + trimmed;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmed;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: chunkId++,
      text: currentChunk.trim(),
      heading: currentHeading || undefined,
    });
  }

  return chunks;
}

/**
 * Dynamically retrieves the most relevant passages of a document based on
 * the current question and the recent conversational context.
 */
export function extractRelevantPassages(
  sourceText: string,
  question: string,
  recentHistory?: QaEntry[],
): { text: string; isFiltered: boolean } {
  // If small document, preserve 100% of original text
  if (sourceText.length <= RAG_DOC_THRESHOLD_CHARS) {
    return { text: sourceText, isFiltered: false };
  }

  const chunks = chunkDocument(sourceText);
  if (chunks.length <= 1) {
    return { text: sourceText, isFiltered: false };
  }

  // Query expansion: combine current question + last user question keywords for anaphora resolution
  let contextQuery = question;
  if (recentHistory && recentHistory.length > 0) {
    const lastUserQuestions = recentHistory
      .slice(-2)
      .map(h => h.question)
      .join(" ");
    contextQuery = `${question} ${question} ${lastUserQuestions}`;
  }

  const queryTerms = tokenize(contextQuery);
  if (queryTerms.length === 0) {
    const selected = chunks.slice(0, 4);
    return {
      text: selected.map(c => c.text).join("\n\n---\n\n"),
      isFiltered: true,
    };
  }

  // Score each chunk
  const scoredChunks = chunks.map(chunk => {
    const chunkTokens = tokenize(chunk.text);
    const chunkTokenSet = new Set(chunkTokens);
    const chunkHeadingTokens = chunk.heading ? tokenize(chunk.heading) : [];
    const headingTokenSet = new Set(chunkHeadingTokens);

    let score = 0;
    const matchedTerms: string[] = [];

    for (const term of queryTerms) {
      if (chunkTokenSet.has(term)) {
        const count = chunkTokens.filter(t => t === term).length;
        score += 1 + Math.log(count);
        matchedTerms.push(term);
      }
      if (headingTokenSet.has(term)) {
        score += 3; // Section title match bonus
      }
    }

    // Exact phrase / question snippet bonus
    const lowerChunk = chunk.text.toLowerCase();
    const lowerQuestion = question.toLowerCase().trim();
    if (lowerQuestion.length > 8 && lowerChunk.includes(lowerQuestion)) {
      score += 10;
    }

    // Bonus for term diversity
    const uniqueMatches = new Set(matchedTerms).size;
    score += uniqueMatches * 1.5;

    return { chunk, score };
  });

  // Sort by score descending
  scoredChunks.sort((a, b) => b.score - a.score);

  // Take top chunks up to ~14 000 chars (approx 3 000 tokens)
  const MAX_OUTPUT_CHARS = 14_000;
  let accumulatedChars = 0;
  const topChunks: DocumentChunk[] = [];

  for (const item of scoredChunks) {
    if (item.score <= 0 && topChunks.length >= 2) break;
    if (accumulatedChars + item.chunk.text.length > MAX_OUTPUT_CHARS && topChunks.length >= 3) break;
    topChunks.push(item.chunk);
    accumulatedChars += item.chunk.text.length;
    if (topChunks.length >= 6) break;
  }

  // Re-sort selected chunks by original document position to keep narrative flow
  topChunks.sort((a, b) => a.id - b.id);

  const formattedPassages = topChunks
    .map((c, i) => {
      const headingPrefix = c.heading ? `[Section : ${c.heading}]\n` : `[Extrait ${i + 1}]\n`;
      return `${headingPrefix}${c.text}`;
    })
    .join("\n\n---\n\n");

  return { text: formattedPassages, isFiltered: true };
}

/**
 * Formats the sliding window conversation history for prompt injection.
 * Truncates very long AI responses to keep prompt lean.
 */
export function formatConversationHistory(history?: QaEntry[], maxTurns = 6): string {
  if (!history || !Array.isArray(history) || history.length === 0) return "";

  // Take the last maxTurns entries (e.g. 3 questions + 3 answers)
  const recent = history.slice(-maxTurns);
  if (recent.length === 0) return "";

  const lines = recent
    .filter(item => item && item.question && item.answer && item.answer !== "...")
    .map(item => {
      const q = item.question.trim();
      let a = item.answer.trim();
      // Compact long answers to ~1200 characters to conserve input tokens
      if (a.length > 1200) {
        a = a.slice(0, 1150) + "… [suite / continued]";
      }
      return `User: ${q}\nSphera: ${a}`;
    });

  return lines.join("\n\n");
}
