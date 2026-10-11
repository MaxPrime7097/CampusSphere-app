const CACHE_NAME = "chat-media-cache-v1";

// In-memory mapping from remote URL to local object URL (for zero-latency access)
const memoryUrlMap = new Map<string, string>();

/**
 * Returns true if `url` is cross-origin relative to the current page.
 * Cross-origin media (e.g. S3 presigned URLs) cannot be fetched without CORS
 * headers on the server side, so we skip the fetch-and-cache step and let the
 * browser handle the URL natively (which does NOT require CORS for <img>/<audio>/<video>).
 */
function isCrossOrigin(url: string): boolean {
  if (!url || url.startsWith("blob:") || url.startsWith("data:")) return false;
  try {
    const u = new URL(url, window.location.href);
    return u.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Checks whether a given media URL is already cached locally
 * (either in memory as a blob or in the CacheStorage API).
 */
export async function isMediaCached(src: string): Promise<boolean> {
  if (!src) return false;
  if (src.startsWith("blob:") || src.startsWith("data:")) return true;
  if (memoryUrlMap.has(src)) return true;
  if (typeof window === "undefined" || !("caches" in window)) return false;

  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(src);
    return Boolean(match);
  } catch {
    return false;
  }
}

/**
 * Stores a locally created or uploaded file/blob directly into CacheStorage
 * under the remote URL key, preventing any network reload after sending.
 */
export async function storeMediaInCache(
  url: string,
  fileOrBlob: Blob,
  existingBlobUrl?: string
): Promise<string> {
  if (!url) return existingBlobUrl || "";
  const blobUrl = existingBlobUrl || URL.createObjectURL(fileOrBlob);
  memoryUrlMap.set(url, blobUrl);

  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(fileOrBlob, {
        headers: {
          "Content-Type": fileOrBlob.type || "application/octet-stream",
          "Content-Length": String(fileOrBlob.size),
        },
      });
      await cache.put(url, response);
    } catch (e) {
      console.warn("Failed to store media in persistent cache:", e);
    }
  }

  return blobUrl;
}

/**
 * Downloads a remote media file, saves it into persistent CacheStorage,
 * and returns the local blob URL.
 */
export async function downloadAndCacheMedia(src: string): Promise<string> {
  if (!src) return "";
  if (src.startsWith("blob:") || src.startsWith("data:")) return src;
  if (memoryUrlMap.has(src)) return memoryUrlMap.get(src)!;

  // Cross-origin URLs (e.g. S3) cannot be fetched without CORS headers —
  // return the URL as-is and let <audio>/<video> handle it natively.
  if (isCrossOrigin(src)) return src;

  if (typeof window === "undefined" || !("caches" in window)) {
    return src;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(src);
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      const blobUrl = URL.createObjectURL(blob);
      memoryUrlMap.set(src, blobUrl);
      return blobUrl;
    }

    const response = await fetch(src);
    if (response.ok) {
      void cache.put(src, response.clone()).catch(() => {});
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      memoryUrlMap.set(src, blobUrl);
      return blobUrl;
    }
  } catch {
    // silently fall back — no console.warn for cross-origin CORS noise
  }

  return src;
}

/**
 * WhatsApp-style persistent media cache lookup.
 * Returns local blob URL if cached; otherwise returns the original URL.
 * For cross-origin URLs (S3), returns the URL directly — the browser's
 * native <img>/<audio>/<video> handles them without CORS.
 */
export async function getCachedMediaUrl(src: string, autoFetch = true): Promise<string> {
  if (!src || src.startsWith("blob:") || src.startsWith("data:")) return src;
  if (memoryUrlMap.has(src)) return memoryUrlMap.get(src)!;

  // Cross-origin URL: return as-is, browser native tags handle it without CORS
  if (isCrossOrigin(src)) return src;

  if (typeof window === "undefined" || !("caches" in window)) return src;

  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(src);
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      const blobUrl = URL.createObjectURL(blob);
      memoryUrlMap.set(src, blobUrl);
      return blobUrl;
    }

    if (autoFetch) {
      return await downloadAndCacheMedia(src);
    }
  } catch {
    // Fallback to original URL
  }

  return src;
}

/**
 * Direct file download without SPA routing interception.
 * For cross-origin URLs (S3 presigned), opens in a new tab — fetch would fail CORS.
 */
export async function triggerDirectDownload(url: string, filename?: string) {
  // S3 / cross-origin: can't fetch without CORS; open directly
  if (isCrossOrigin(url)) {
    window.open(url, "_blank");
    return;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || "media";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch {
    window.open(url, "_blank");
  }
}
