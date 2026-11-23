import fs from "node:fs";
import puppeteer, { type Browser } from "puppeteer-core";
import { escapeHtml, generateAnnalePdfHtml, generateFichePdfHtml } from "./templates.js";

/** Idle timeout before closing the headless Chromium process to keep memory footprint low. */
const BROWSER_IDLE_MS = 2 * 60 * 1000;

let sharedBrowser: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;
let idleTimer: NodeJS.Timeout | null = null;

function resolveExecutablePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // Common system paths on Linux Docker images, macOS, and Windows
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        ]
      : process.platform === "darwin"
        ? [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
          ]
        : [
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
          ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function scheduleIdleClose(): void {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    if (sharedBrowser) {
      const toClose = sharedBrowser;
      sharedBrowser = null;
      try {
        await toClose.close();
      } catch {
        // ignore close errors
      }
    }
  }, BROWSER_IDLE_MS);
  idleTimer.unref?.();
}

async function getBrowser(): Promise<Browser> {
  if (sharedBrowser && sharedBrowser.connected) {
    scheduleIdleClose();
    return sharedBrowser;
  }

  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  const executablePath = resolveExecutablePath();
  if (!executablePath) {
    throw new Error(
      "Aucun navigateur Chromium/Chrome détecté (définissez PUPPETEER_EXECUTABLE_PATH ou installez chromium).",
    );
  }
  browserLaunchPromise = puppeteer
    .launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--font-render-hinting=none",
      ],
    })
    .then((browser) => {
      sharedBrowser = browser;
      browser.on("disconnected", () => {
        if (sharedBrowser === browser) sharedBrowser = null;
      });
      scheduleIdleClose();
      return browser;
    })
    .finally(() => {
      browserLaunchPromise = null;
    });

  return browserLaunchPromise;
}

export async function renderPdfFromHtml(html: string, docTitle: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    // Load HTML; wait for stylesheets/fonts up to 6s, falling back cleanly if offline
    try {
      await page.setContent(html, { waitUntil: "load", timeout: 6000 });
    } catch {
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 5000 });
    }

    await page.evaluate(() => document.fonts?.ready).catch(() => {});

    const safeHeaderTitle = escapeHtml(docTitle.slice(0, 75));

    const headerTemplate = `
      <div style="width:100%; font-family:Inter,system-ui,sans-serif; font-size:7.5pt; color:#94a3b8; padding:0 15mm; display:flex; justify-content:space-between; align-items:center;">
        <span style="max-width:70%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${safeHeaderTitle}</span>
        <span style="font-weight:700; color:#10b981;">Sphera by CampusSphere</span>
      </div>
    `;

    const footerTemplate = `
      <div style="width:100%; font-family:Inter,system-ui,sans-serif; font-size:7.5pt; color:#94a3b8; padding:0 15mm; display:flex; justify-content:space-between; align-items:center;">
        <span>sphera.campussphere.app</span>
        <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `;

    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: {
        top: "17mm",
        bottom: "17mm",
        left: "14mm",
        right: "14mm",
      },
      preferCSSPageSize: false,
    });

    scheduleIdleClose();
    return Buffer.from(pdfBytes);
  } finally {
    await page.close().catch(() => {});
  }
}

export async function generateSpheraPdf(
  type: "fiche" | "annale",
  data: unknown,
  sourceName?: string,
): Promise<{ buffer: Buffer; filename: string }> {
  const { html, title } =
    type === "fiche"
      ? generateFichePdfHtml(data, sourceName)
      : generateAnnalePdfHtml(data, sourceName);

  const buffer = await renderPdfFromHtml(html, title);

  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 45);

  const prefix = type === "fiche" ? "Sphera_Fiche" : "Sphera_Annale";
  const filename = `${prefix}_${slug || "document"}.pdf`;

  return { buffer, filename };
}
