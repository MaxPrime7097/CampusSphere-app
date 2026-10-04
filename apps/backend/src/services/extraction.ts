/**
 * Document text extraction — API_CONTRACT §3.9.
 *
 * PDF, DOCX, TXT and Images (PNG, JPG, WEBP), capped at 40 000 characters (matching MAX_SOURCE_CHARS).
 *
 * PDFs take the fast, pure-JavaScript path first using `pdf-parse` (0 external binary dependencies).
 * If that yields under 150 characters (meaning a scanned PDF), it falls through to OCR:
 * `pdftotext` / `pdftoppm` + `tesseract -l fra+eng` with graceful error handling.
 *
 * Images (PNG, JPG, JPEG, WEBP) go directly through `tesseract -l fra+eng`.
 *
 * DOCX is a zip: `word/document.xml` holds the text, one `<w:p>` per paragraph.
 */

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import { promisify } from "node:util";
import AdmZip from "adm-zip";
import { PDFParse } from "pdf-parse";

const run = promisify(execFile);

export const MAX_CHARS = 500_000;

/** Below this many characters of embedded text, a PDF is treated as a scan. */
const OCR_THRESHOLD = 150;

/** OCR is slow; a pathological document must not pin a worker indefinitely. */
const OCR_TIMEOUT_MS = 180_000;
const TOOL_TIMEOUT_MS = 60_000;

/** Only these reach the extractor; enforced at the route layer too. */
export const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
] as const;

export const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const;

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

async function pdfJsText(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result?.text || "";
    } finally {
      if (typeof parser.destroy === "function") {
        await parser.destroy().catch(() => undefined);
      }
    }
  } catch (error) {
    console.warn("[extraction] pdf-parse parser threw error:", error);
    return "";
  }
}

async function pdfEmbeddedText(path: string): Promise<string> {
  const { stdout } = await run("pdftotext", ["-layout", "-enc", "UTF-8", path, "-"], {
    timeout: TOOL_TIMEOUT_MS,
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

async function pdfOcr(path: string, dir: string): Promise<string> {
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
    if (text.length > MAX_CHARS) break;
  }
  return text;
}

async function extractPdf(buffer: Buffer, path: string, dir: string): Promise<string> {
  // 1. First line of defense: Pure JavaScript extraction via pdf-parse
  const jsText = await pdfJsText(buffer);
  if (jsText.trim().length > OCR_THRESHOLD) {
    console.log(`[extraction] digital PDF parsed via pdf-parse: ${jsText.length} characters`);
    return clamp(jsText);
  }

  // 2. Second line: pdftotext (Poppler)
  let embedded = "";
  try {
    embedded = await pdfEmbeddedText(path);
  } catch (error) {
    console.warn("[extraction] pdftotext failed, checking OCR:", error);
  }

  if (embedded.trim().length > OCR_THRESHOLD) {
    console.log(`[extraction] digital PDF parsed via pdftotext: ${embedded.length} characters`);
    return clamp(embedded);
  }

  // 3. Fallback to OCR for scanned documents
  console.log("[extraction] insufficient embedded text, switching to Tesseract OCR");
  let ocr: string;
  try {
    ocr = await pdfOcr(path, dir);
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.includes("ENOENT") || msg.includes("not found")) {
      throw new ExtractionError(
        "Ce PDF semble être un document scanné nécessitant un OCR, mais les outils système (Tesseract / Poppler) ne sont pas installés sur le serveur. Veuillez fournir un PDF numérique ou copier-coller le texte.",
      );
    }
    throw new ExtractionError(
      `Impossible de lire le PDF scanné via OCR : ${msg}`,
    );
  }

  if (!ocr.trim()) {
    console.warn("[extraction] OCR returned nothing");
    return "";
  }
  console.log(`[extraction] OCR produced ${ocr.length} characters`);
  return clamp(`[OCR] ${ocr}`);
}

// ── Images ──────────────────────────────────────────────────────────────────

async function extractImage(path: string): Promise<string> {
  try {
    const { stdout } = await run(
      "tesseract",
      [path, "stdout", "-l", "fra+eng", "--psm", "6", "--oem", "3"],
      { timeout: OCR_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024 },
    );
    const text = stdout.trim();
    if (!text) {
      console.warn("[extraction] Image OCR returned nothing");
      return "";
    }
    console.log(`[extraction] Image OCR produced ${text.length} characters`);
    return clamp(`[OCR] ${text}`);
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.includes("ENOENT") || msg.includes("not found")) {
      throw new ExtractionError(
        "L'extraction de texte sur image nécessite le moteur Tesseract OCR sur le serveur. Veuillez convertir votre image en PDF numérique ou TXT.",
      );
    }
    throw new ExtractionError(`Impossible d'extraire le texte de l'image via OCR : ${msg}`);
  }
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

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = extname(filename).toLowerCase();

  if (ext === ".docx") return extractDocx(buffer);

  if (ext === ".txt" || ext === "") {
    return clamp(buffer.toString("utf8"));
  }

  if (ext === ".pdf") {
    return withTempDir(async (dir) => {
      const path = join(dir, `source${ext}`);
      await writeFile(path, buffer);
      return extractPdf(buffer, path, dir);
    });
  }

  if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
    return withTempDir(async (dir) => {
      const path = join(dir, `image${ext}`);
      await writeFile(path, buffer);
      return extractImage(path);
    });
  }

  // Unknown extension: read as text
  return clamp(buffer.toString("utf8"));
}

export async function extractTextFromPath(path: string): Promise<string> {
  return extractText(await readFile(path), path);
}

export async function extractionToolsAvailable(): Promise<{ pdftotext: boolean; tesseract: boolean; pdfParse: boolean }> {
  const probe = async (binary: string): Promise<boolean> => {
    try {
      await run(binary, ["-v"], { timeout: 5_000 });
      return true;
    } catch {
      return false;
    }
  };
  const [pdftotext, tesseract] = await Promise.all([probe("pdftotext"), probe("tesseract")]);
  return { pdftotext, tesseract, pdfParse: true };
}
