/**
 * Router assembly.
 *
 * Domain routers are mounted here as they land. The full surface is 143 routes —
 * see documentation/API_INVENTORY.md for the authoritative list and each route's
 * status, and documentation/API_CONTRACT.md for its request/response shape.
 *
 * Every handler carries a `@status` annotation matching the inventory, so an
 * UNUSED or DEPRECATED route is obvious at the point of implementation rather
 * than only in the docs.
 */

import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { authRouter } from "./auth.routes.js";
import { usersRouter } from "./users.routes.js";
import { spheresRouter } from "./spheres.routes.js";
import { postsRouter } from "./posts.routes.js";
import { resourcesRouter } from "./resources.routes.js";
import { tasksRouter } from "./tasks.routes.js";
import { messagingRouter } from "./messaging.routes.js";
import { notificationsRouter } from "./notifications.routes.js";
import { spheraRouter } from "./sphera.routes.js";
import { uploadsRouter } from "./uploads.routes.js";
import { searchRouter } from "./search.routes.js";
import { adminRouter } from "./admin.routes.js";

export const apiRouter: Router = Router();

apiRouter.use("/", healthRouter);
apiRouter.use("/auth", authRouter);

// Before usersRouter: /api/users/<id>/avatar/ and /cover/ live in the uploads app,
// which is also where /api/upload/ and /api/uploads/ are. Mounting at the API root
// keeps those three prefixes together rather than splitting one small domain
// across three routers.
apiRouter.use("/", uploadsRouter);
apiRouter.use("/", searchRouter);
apiRouter.use("/admin", adminRouter);

apiRouter.use("/users", usersRouter);
apiRouter.use("/spheres", spheresRouter);
apiRouter.use("/posts", postsRouter);
apiRouter.use("/resources", resourcesRouter);
apiRouter.use("/tasks", tasksRouter);
apiRouter.use("/conversations", messagingRouter);
apiRouter.use("/notifications", notificationsRouter);

// One router, two prefixes. `/api/study/` is the legacy path api.ts still calls
// (FE-06); aliasing rather than duplicating means there is no second copy to drift.
apiRouter.use("/sphera", spheraRouter);
apiRouter.use("/study", spheraRouter);

// Mounted as each domain is implemented:

//   /api/upload/          uploads.routes.ts       (§3.10)
//   /api/search/          search.routes.ts        (§3.11)
//   /api/admin/           admin.routes.ts         (§3.11)
