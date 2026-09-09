/**
 * Object storage.
 *
 * Two drivers behind one interface. The S3 driver also covers Supabase Storage,
 * which exposes an S3-compatible endpoint.
 *
 * Production MUST use S3: Render's plan has no persistent disk, so anything written
 * to the container filesystem is destroyed on redeploy. That was already true of the
 * Django deployment — every uploaded avatar, banner and resource has been silently
 * disappearing. `assertProductionConfig()` refuses to boot with USE_S3=false so the
 * new backend cannot inherit it.
 *
 * The local driver exists only so development works without cloud credentials.
 */

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

export interface StoredObject {
  /** Storage key — the stable identifier. Persist this, not the URL. */
  key: string;
  /** Publicly resolvable URL for the object. */
  url: string;
  size: number;
  contentType: string;
}

export interface PutObjectInput {
  buffer: Buffer;
  originalName: string;
  contentType: string;
  /** Logical grouping, e.g. "resources", "avatars", "spheres/banners". */
  prefix: string;
}

interface StorageDriver {
  put(input: PutObjectInput): Promise<StoredObject>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  urlFor(key: string): string;
}

/** Collision-free key that keeps the original extension for content sniffing. */
function buildKey(prefix: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().slice(0, 12);
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}/${stamp}/${randomUUID()}${ext}`;
}

// ── Local driver (development only) ─────────────────────────────────────────

const LOCAL_ROOT = path.resolve(process.cwd(), "uploads");

/** Guard against `..` traversal escaping the uploads root. */
function localPathFor(key: string): string {
  const resolved = path.resolve(LOCAL_ROOT, key);
  if (!resolved.startsWith(LOCAL_ROOT + path.sep)) {
    throw new Error(`Refusing to resolve storage key outside the uploads root: ${key}`);
  }
  return resolved;
}

const localDriver: StorageDriver = {
  async put(input) {
    const key = buildKey(input.prefix, input.originalName);
    const target = localPathFor(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.buffer);
    return { key, url: localDriver.urlFor(key), size: input.buffer.byteLength, contentType: input.contentType };
  },
  async get(key) {
    return readFile(localPathFor(key));
  },
  async delete(key) {
    await unlink(localPathFor(key)).catch(() => undefined);
  },
  urlFor(key) {
    return `/media/${key}`;
  },
};

// ── S3 driver ───────────────────────────────────────────────────────────────

function createS3Driver(): StorageDriver {
  // Imported lazily so development without credentials never loads the SDK.
  const clientPromise = import("@aws-sdk/client-s3").then((sdk) => ({
    sdk,
    client: new sdk.S3Client({
      region: env.storage.region,
      credentials: {
        accessKeyId: env.storage.accessKeyId,
        secretAccessKey: env.storage.secretAccessKey,
      },
      ...(env.storage.endpoint ? { endpoint: env.storage.endpoint, forcePathStyle: true } : {}),
    }),
  }));

  return {
    async put(input) {
      const { sdk, client } = await clientPromise;
      const key = buildKey(input.prefix, input.originalName);
      await client.send(
        new sdk.PutObjectCommand({
          Bucket: env.storage.bucket,
          Key: key,
          Body: input.buffer,
          ContentType: input.contentType,
          // Checksum lets the store reject a corrupted upload rather than persisting it.
          ContentMD5: createHash("md5").update(input.buffer).digest("base64"),
        }),
      );
      return { key, url: this.urlFor(key), size: input.buffer.byteLength, contentType: input.contentType };
    },
    async get(key) {
      const { sdk, client } = await clientPromise;
      const result = await client.send(new sdk.GetObjectCommand({ Bucket: env.storage.bucket, Key: key }));
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) throw new Error(`Object has no body: ${key}`);
      return Buffer.from(bytes);
    },
    async delete(key) {
      const { sdk, client } = await clientPromise;
      await client.send(new sdk.DeleteObjectCommand({ Bucket: env.storage.bucket, Key: key }));
    },
    urlFor(key) {
      if (env.storage.publicUrl) return `${env.storage.publicUrl.replace(/\/$/, "")}/${key}`;
      return `https://${env.storage.bucket}.s3.${env.storage.region}.amazonaws.com/${key}`;
    },
  };
}

export const storage: StorageDriver = env.storage.useS3 ? createS3Driver() : localDriver;

export const LOCAL_UPLOAD_ROOT = LOCAL_ROOT;

/**
 * Recover the storage key from a persisted URL.
 *
 * Rows store both key and URL; older or externally-produced rows may only have a
 * URL, so deletion falls back to deriving the key from it.
 */
export function keyFromUrl(url: string): string | null {
  const local = url.match(/^\/media\/(.+)$/);
  if (local) return local[1];

  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\/+/, "") || null;
  } catch {
    return null;
  }
}
