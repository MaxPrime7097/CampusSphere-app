/**
 * Token lifecycle — mounted at /api/auth/.
 *
 * @status ACTIVE  POST /api/auth/refresh/  (web + sphera-app)
 *
 * Supabase exchange and profile completion land alongside these; see
 * API_CONTRACT §3.1.
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { issueAccessToken, verifyToken } from "../lib/jwt.js";
import { unauthenticated } from "../lib/errors.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { supabaseCompleteProfile, supabaseDebug, supabaseExchange } from "./supabaseAuth.js";

export const authRouter: Router = Router();

const refreshSchema = z.object({ refresh: z.string().min(1) });

authRouter.post("/refresh/", async (req, res) => {
  const { refresh } = refreshSchema.parse(req.body);
  const claims = verifyToken(refresh, "refresh");

  // Django configured BLACKLIST_AFTER_ROTATION but never installed the
  // token_blacklist app, so revocation silently did nothing. Checked properly here.
  const revoked = await prisma.revokedToken.findUnique({ where: { jti: claims.jti } });
  if (revoked) throw unauthenticated("Token has been revoked.");

  const user = await prisma.user.findUnique({
    where: { id: claims.user_id },
    select: { id: true, isActive: true },
  });
  if (!user || !user.isActive) throw unauthenticated("Account is no longer active.");

  // Response shape is bare `{access}` rather than the standard envelope: the
  // client's performRefreshRaw reads `json.access` directly on both frontends.
  res.status(200).json({ access: issueAccessToken(user.id) });
});

// ── Supabase-backed auth ────────────────────────────────────────────────────
// The main web app's only login path: it authenticates against Supabase, then
// exchanges that token here for ours.

/** @status ACTIVE — web */
authRouter.post("/supabase/exchange/", supabaseExchange);

/** @status ACTIVE — web */
authRouter.post("/supabase/complete-profile/", requireAuth, supabaseCompleteProfile);

/** @status DEPRECATED — diagnostic; admin-gated, unlike the Django original */
authRouter.get("/supabase/debug/", requireAuth, requireAdmin, supabaseDebug);
