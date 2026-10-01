import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TraceMap, originalPositionFor } from "@jridgewell/trace-mapping";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distAssetsDir = path.resolve(__dirname, "../dist/assets");

const requestedBundle = process.argv[2] ?? "index-DBTmCftW.js";
const symbolList = (process.argv[3] ?? "wd,Q6,H6")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function resolveBundleFile(bundleName) {
  const exact = path.resolve(distAssetsDir, bundleName);
  if (fs.existsSync(exact)) return exact;

  const candidates = fs
    .readdirSync(distAssetsDir)
    .filter((file) => file.startsWith("index-") && file.endsWith(".js"));

  if (candidates.length === 0) {
    throw new Error(`No index bundle found in ${distAssetsDir}`);
  }

  return path.resolve(distAssetsDir, candidates[0]);
}

function offsetToLineColumn(source, offset) {
  let line = 1;
  let column = 0;

  for (let i = 0; i < offset; i += 1) {
    if (source[i] === "\n") {
      line += 1;
      column = 0;
    } else {
      column += 1;
    }
  }

  return { line, column };
}

function findFramePosition(bundleContents, symbol) {
  const patterns = [
    `function ${symbol}(`,
    `${symbol}=(`,
    `${symbol}=function`,
    `const ${symbol}=`,
    `let ${symbol}=`,
    `var ${symbol}=`,
  ];

  for (const pattern of patterns) {
    const index = bundleContents.indexOf(pattern);
    if (index >= 0) {
      return offsetToLineColumn(bundleContents, index + pattern.indexOf(symbol));
    }
  }

  const fallback = bundleContents.indexOf(symbol);
  if (fallback >= 0) {
    return offsetToLineColumn(bundleContents, fallback);
  }

  return null;
}

const bundlePath = resolveBundleFile(requestedBundle);
const mapPath = `${bundlePath}.map`;

if (!fs.existsSync(mapPath)) {
  throw new Error(`Source map not found for ${path.basename(bundlePath)}. Expected ${path.basename(mapPath)}.`);
}

const bundleContents = fs.readFileSync(bundlePath, "utf-8");
const traceMap = new TraceMap(fs.readFileSync(mapPath, "utf-8"));

console.log(`Bundle: ${path.basename(bundlePath)}`);
for (const symbol of symbolList) {
  const generatedPos = findFramePosition(bundleContents, symbol);
  if (!generatedPos) {
    console.log(`- ${symbol}: not found in bundle`);
    continue;
  }

  const mapped = originalPositionFor(traceMap, {
    line: generatedPos.line,
    column: generatedPos.column,
  });

  console.log(
    `- ${symbol}: ${mapped.source ?? "unmapped"}:${mapped.line ?? "?"}:${mapped.column ?? "?"} (generated ${generatedPos.line}:${generatedPos.column})`
  );
}
