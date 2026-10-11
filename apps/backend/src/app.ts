/**
 * Express application assembly.
 *
 * Kept separate from server.ts so tests and tooling can construct the app without
 * binding a port.
 */

import express, { type Express } from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { attachUser } from "./middleware/auth.js";
import { appendSlash, noStore } from "./middleware/trailingSlash.js";
import { anonymousRateLimit } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { LOCAL_UPLOAD_ROOT } from "./services/storage.js";

export function createApp(): Express {
  const app = express();

  // Render terminates TLS upstream; without this, req.protocol and any
  // rate-limiting keyed on IP see the proxy rather than the client.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.set("etag", "weak");

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin and non-browser callers send no Origin header.
        if (!origin) return callback(null, true);
        if (env.corsAllowedOrigins.includes(origin)) return callback(null, true);
        // Mode Réseau Local / Hotspot : autoriser localhost et les adresses IP privées (192.168.x, 10.x, etc.)
        if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(?::\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        callback(null, false);
      },
      credentials: true,
      exposedHeaders: ["Content-Disposition", "ETag"],
    }),
  );

  // 250MB matches the upload cap for resources and files.
  app.use(express.json({ limit: "250mb" }));
  app.use(express.urlencoded({ extended: true, limit: "250mb" }));

  // Development only. In production USE_S3 is mandatory (the server refuses to boot
  // otherwise), so uploads are served by the object store, not by this process.
  if (!env.storage.useS3) {
    app.use("/media", express.static(LOCAL_UPLOAD_ROOT, { index: false, dotfiles: "deny" }));
  }

  app.use(appendSlash);
  app.use(noStore);
  app.use(attachUser);

  // After attachUser: the anonymous limit exempts authenticated callers, matching
  // DRF's AnonRateThrottle, so it has to know whether a token was presented.
  app.use("/api", anonymousRateLimit, apiRouter);

  // WebSocket endpoints fallback: if a reverse proxy (like Cloudflare) or client
  // forwards a WebSocket request as plain HTTP without upgrading, inform the client
  // that a WebSocket handshake is required rather than a generic 404.
  app.all(/^\/ws(?:\/.*)?$/, (_req, res) => {
    res.status(426).set({
      Upgrade: "WebSocket",
      Connection: "Upgrade",
    }).json({
      success: false,
      error: "Upgrade Required",
      code: "upgrade_required",
      detail: "This endpoint requires a WebSocket connection (wss://).",
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
