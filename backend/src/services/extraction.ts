/**
 * Document text extraction — API_CONTRACT §3.9.
 *
 * PDF, DOCX and TXT, capped at 12 000 characters (what the prompts are sized for).
 *
 * PDFs take the cheap path first: `pdftotext` reads the embedded text layer. If
 * that yields under 150 characters the document is a scan, and it falls through to
 * OCR — rasterise with `pdftoppm`, read with `tesseract -l fra+eng`. Same threshold,
 * same language pair, same `--psm 6 --oem 3` configuration Django used.
 *
 * Both binaries come from `poppler-utils` and `tesseract-ocr`, already installed in
 * the image; PyMuPDF and pytesseract were only ever bindings to the same tools.
 *
 * DOCX is a zip: `word/document.xml` holds the text, one `<w:p>` per paragraph.
 * That is precisely what python-docx's `paragraph.text` returned.
 */

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import { promisify } from "node:util";
import AdmZip from "adm-zip";

const run = promisify(execFile);

export const MAX_CHARS = 12_000;

/** Below this many characters of embedded text, a PDF is treated as a scan. */
const OCR_THRESHOLD = 150;

/** OCR is slow; a pathological document must not pin a worker indefinitely. */
const OCR_TIMEOUT_MS = 180_000;
const TOOL_TIMEOUT_MS = 60_000;

/** Only these reach the extractor; enforced at the route layer too. */
export const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

/** Cap and trim. Applied at every return so no path can exceed the budget. */
const clamp = (text: string): string => text.slice(0, MAX_CHARS).trim();

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), "sphera-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

// ── PDF ─────────────────────────────────────────────────────────────────────

async function pdfEmbeddedText(path: string): Promise<string> {
  // `-` writes to stdout. `-layout` preserves column structure, which matters for
  // exam papers where a mangled reading order changes the question.
  const { stdout } = await run("pdftotext", ["-layout", "-enc", "UTF-8", path, "-"], {
    timeout: TOOL_TIMEOUT_MS,
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

async function pdfOcr(path: string, dir: string): Promise<string> {
  // 300 dpi is what pdf2image used; below roughly 200 tesseract accuracy collapses.
  const prefix = join(dir, "page");
  await run("pdftoppm", ["-r", "300", "-png", path, prefix], {
    timeout: OCR_TIMEOUT_MS,
    maxBuffer: 8 * 1024 * 1024,
  });

  const pages = (await readdir(dir)).filter((f) => f.startsWith("page") && f.endsWith(".png")).sort();

  let text = "";
  for (const [index, page] of pages.entries()) {
    const { stdout } = await run(
      "tesseract",
      [join(dir, page), "stdout", "-l", "fra+eng", "--psm", "6", "--oem", "3"],
      { timeout: OCR_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024 },
    );
    text += `\n--- Page ${index + 1} ---\n${stdout}`;
    // Stop early: the prompt only consumes MAX_CHARS, and OCR is the expensive path.
    if (text.length > MAX_CHARS) break;
  }
  return text;
}

async function extractPdf(path: string, dir: string): Promise<string> {
  let embedded = "";
  try {
    embedded = await pdfEmbeddedText(path);
  } catch (error) {
    console.warn("[extraction] pdftotext failed, falling back to OCR:", error);
  }

  if (embedded.trim().length > OCR_THRESHOLD) {
    console.log(`[extraction] digital PDF: ${embedded.length} characters`);
    return clamp(embedded);
  }

  console.log("[extraction] insufficient embedded text, switching to Tesseract OCR");
  let ocr: string;
  try {
    ocr = await pdfOcr(path, dir);
  } catch (error) {
    throw new ExtractionError(
      `Impossible de lire le PDF (numérique + OCR) : ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!ocr.trim()) {
    console.warn("[extraction] OCR returned nothing");
    return "";
  }
  console.log(`[extraction] OCR produced ${ocr.length} characters`);
  // The "[OCR]" prefix is Django's marker that a document went through OCR; the
  // clients key off it to warn that accuracy may be degraded.
  return clamp(`[OCR] ${ocr}`);
}

// ── DOCX ────────────────────────────────────────────────────────────────────

function extractDocx(buffer: Buffer): string {
  let documentXml: string;
  try {
    const entry = new AdmZip(buffer).getEntry("word/document.xml");
    if (!entry) throw new Error("word/document.xml absent");
    documentXml = entry.getData().toString("utf8");
  } catch (error) {
    throw new ExtractionError(
      `Impossible de lire le DOCX : ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return clamp(
    documentXml
      // Paragraph and line breaks become newlines before tags are stripped, so
      // words either side of a break do not run together.
      .replace(/<w:p\b[^>]*\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<w:br\b[^>]*\/?>/g, "\n")
      .replace(/<w:tab\b[^>]*\/?>/g, "\t")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/\n{3,}/g, "\n\n"),
  );
}

// ── Entry point ─────────────────────────────────────────────────────────────

/**
 * Extract text from a document buffer.
 *
 * Takes a buffer rather than a path because uploads arrive in memory and stored
 * files come from object storage — neither is a local file to begin with. The
 * temporary file exists only for the duration of the external tools that need one.
 *
 * Returns "" when the document genuinely holds no text; throws ExtractionError
 * when it could not be read at all. Callers distinguish the two: the first is a
 * 400 telling the student to try a different document, the second is a failure.
 */
export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = extname(filename).toLowerCase();

  if (ext === ".docx") return extractDocx(buffer);

  if (ext === ".txt" || ext === "") {
    // `errors="ignore"` in Django; Node's utf8 decoder substitutes U+FFFD for
    // invalid sequences, which is the same tolerance.
    return clamp(buffer.toString("utf8"));
  }

  if (ext === ".pdf") {
    return withTempDir(async (dir) => {
      const path = join(dir, `source${ext}`);
      await writeFile(path, buffer);
      return extractPdf(path, dir);
    });
  }

  // Unknown extension: read as text, as Django's final branch did.
  return clamp(buffer.toString("utf8"));
}

/**
 * Extract from a file already on disk. Used by the local-storage driver, which
 * hands back a path rather than a buffer.
 */
export async function extractTextFromPath(path: string): Promise<string> {
  return extractText(await readFile(path), path);
}

/** True when the OCR toolchain is present. Reported by /api/health/. */
export async function extractionToolsAvailable(): Promise<{ pdftotext: boolean; tesseract: boolean }> {
  const probe = async (binary: string): Promise<boolean> => {
    try {
      await run(binary, ["-v"], { timeout: 5_000 });
      return true;
    } catch {
      return false;
    }
  };
  const [pdftotext, tesseract] = await Promise.all([probe("pdftotext"), probe("tesseract")]);
  return { pdftotext, tesseract };
}
