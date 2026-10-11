import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { notFound, badRequest } from "../lib/errors.js";
import { requireAuth, currentUser } from "../middleware/auth.js";
import { userSelect, serializeUser } from "../serializers/user.js";
import { loadUserCounts } from "../lib/userCounts.js";

export const partnersRouter: Router = Router();

// ── Follow an Impact Partner ────────────────────────────────────────────────

partnersRouter.post("/:partnerId/follow", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const partnerId = Number(req.params.partnerId);

  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    throw notFound("Impact Partner introuvable.");
  }

  if (me.id === partnerId) {
    throw badRequest("Vous ne pouvez pas vous suivre vous-même.");
  }

  const partner = await prisma.user.findFirst({
    where: { id: partnerId, role: "IMPACT_PARTNER" },
    select: { id: true },
  });

  if (!partner) {
    throw notFound("Impact Partner introuvable ou compte non partenaire.");
  }

  // Upsert or create Follow relation
  await prisma.follow.upsert({
    where: {
      followerId_partnerId: {
        followerId: me.id,
        partnerId: partner.id,
      },
    },
    create: {
      followerId: me.id,
      partnerId: partner.id,
    },
    update: {},
  });

  const followersCount = await prisma.follow.count({
    where: { partnerId: partner.id },
  });

  res.json({
    success: true,
    message: "Vous suivez désormais cette page Impact Partner.",
    data: {
      isFollowing: true,
      followersCount,
    },
  });
});

// ── Unfollow an Impact Partner ──────────────────────────────────────────────

partnersRouter.delete("/:partnerId/follow", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const partnerId = Number(req.params.partnerId);

  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    throw notFound("Impact Partner introuvable.");
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: me.id,
      partnerId,
    },
  });

  const followersCount = await prisma.follow.count({
    where: { partnerId },
  });

  res.json({
    success: true,
    message: "Vous ne suivez plus cette page.",
    data: {
      isFollowing: false,
      followersCount,
    },
  });
});

// ── Followers Count ─────────────────────────────────────────────────────────

partnersRouter.get("/:partnerId/followers-count", async (req, res) => {
  const partnerId = Number(req.params.partnerId);
  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    throw notFound("Impact Partner introuvable.");
  }

  const count = await prisma.follow.count({
    where: { partnerId },
  });

  res.json({
    success: true,
    data: { count },
  });
});

// ── Check if Viewer is Following Partner ────────────────────────────────────

partnersRouter.get("/:partnerId/is-following", async (req, res) => {
  const partnerId = Number(req.params.partnerId);
  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    throw notFound("Impact Partner introuvable.");
  }

  const viewerId = req.user?.id ?? null;
  if (!viewerId) {
    return res.json({ success: true, data: { isFollowing: false } });
  }

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_partnerId: {
        followerId: viewerId,
        partnerId,
      },
    },
  });

  res.json({
    success: true,
    data: { isFollowing: Boolean(follow) },
  });
});

// ── List Impact Partners Directory ──────────────────────────────────────────

partnersRouter.get("/", async (req, res) => {
  const partners = await prisma.user.findMany({
    where: {
      role: "IMPACT_PARTNER",
      isActive: true,
    },
    select: userSelect,
    orderBy: { dateJoined: "desc" },
  });

  const viewerId = req.user?.id ?? null;
  const serialized = await Promise.all(
    partners.map(async (p) => {
      const counts = await loadUserCounts(p.id);
      const isFollowing = viewerId
        ? Boolean(
            await prisma.follow.findUnique({
              where: {
                followerId_partnerId: {
                  followerId: viewerId,
                  partnerId: p.id,
                },
              },
            }),
          )
        : false;
      return serializeUser(p, { viewerId, counts, isFollowing });
    }),
  );

  res.json({
    success: true,
    data: serialized,
  });
});
