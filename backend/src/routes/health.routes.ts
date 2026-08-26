/**
 * Health and service info.
 *
 * @status INFRA  /api/health/  — no JS caller, but render.yaml uses it as
 *                healthCheckPath. Must never be removed or throttled.
 * @status DEPRECATED /api/info/ — no consumer; retained per migration policy.
 */

import { Router } from "express";
import { databaseReachable } from "../lib/prisma.js";

export const healthRouter: Router = Router();

healthRouter.get("/health/", async (_req, res) => {
  // Reports database reachability but still answers 200 while the process is up,
  // so a transient database blip does not cause Render to cycle the instance.
  const database = (await databaseReachable()) ? "ok" : "unavailable";
  res.status(200).json({
    status: "healthy",
    database,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

healthRouter.get("/info/", (_req, res) => {
  res.status(200).json({
    name: "CampusSphere API",
    version: "1.0.0",
    description: "API for the CampusSphere platform",
    endpoints: {
      auth: "/api/auth/",
      users: "/api/users/",
      spheres: "/api/spheres/",
      posts: "/api/posts/",
      resources: "/api/resources/",
      tasks: "/api/tasks/",
      conversations: "/api/conversations/",
      notifications: "/api/notifications/",
      sphera: "/api/sphera/",
      upload: "/api/upload/",
      search: "/api/search/",
    },
    timestamp: new Date().toISOString(),
  });
});
