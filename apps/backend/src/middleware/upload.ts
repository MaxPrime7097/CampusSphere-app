/**
 * Multipart handling.
 *
 * Files are buffered in memory and handed to the storage driver, never written to
 * the container filesystem — Render's plan has no persistent disk.
 *
 * Size caps and MIME allowlists are per upload type, ported from the Django
 * validators so an upload accepted before is still accepted now.
 */

import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { badRequest, payloadTooLarge } from "../lib/errors.js";

export const MAX_SIZES = {
  avatar: 5 * 1024 * 1024,
  cover: 10 * 1024 * 1024,
  post: 50 * 1024 * 1024,
  resource: 100 * 1024 * 1024,
  sphereFile: 100 * 1024 * 1024,
  banner: 10 * 1024 * 1024,
  conversationAvatar: 5 * 1024 * 1024,
  other: 10 * 1024 * 1024,
} as const;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/** Ported verbatim from legacy/django-backend/resources/constants.py. */
export const RESOURCE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "text/x-python",
  "application/javascript",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
  "application/vnd.rar",
  "application/x-7z-compressed",
  "application/octet-stream",
  "application/acad",
  "application/dxf",
  "model/step",
  "model/iges",
  "model/stl",
];

const POST_MIME_TYPES = [
  ...IMAGE_TYPES,
  "video/mp4",
  "video/webm",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export type UploadKind = keyof typeof MAX_SIZES;

const ALLOWED: Record<UploadKind, string[] | null> = {
  avatar: IMAGE_TYPES,
  cover: IMAGE_TYPES,
  banner: IMAGE_TYPES,
  conversationAvatar: IMAGE_TYPES,
  post: POST_MIME_TYPES,
  resource: RESOURCE_MIME_TYPES,
  sphereFile: null,
  other: null,
};

/**
 * Single-file upload middleware for a given kind.
 *
 * Multer's own errors are translated into the standard envelope — otherwise a
 * too-large upload surfaces as an unhandled 500 rather than a 413.
 */
export function singleUpload(field: string, kind: UploadKind) {
  const handler = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZES[kind], files: 1 },
    fileFilter(_req, file, cb) {
      const allowed = ALLOWED[kind];
      if (allowed && !allowed.includes(file.mimetype)) {
        cb(badRequest(`File type '${file.mimetype}' is not allowed for ${kind} uploads.`));
        return;
      }
      cb(null, true);
    },
  }).single(field);

  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, (error: unknown) => {
      if (!error) return next();
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          next(payloadTooLarge(`File exceeds the ${Math.round(MAX_SIZES[kind] / 1024 / 1024)}MB limit for ${kind} uploads.`));
          return;
        }
        next(badRequest(`Upload rejected: ${error.message}`));
        return;
      }
      next(error);
    });
  };
}

/** Multipart bodies arrive as strings; JSON fields need parsing back. */
export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    // A bare comma-separated list is what the client sends for tags.
    return value.split(",").map((s) => s.trim()).filter(Boolean) as unknown as T;
  }
}
