import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { badRequest, notFound } from "../lib/errors.js";
import { requireAuth, requireAdmin, currentUser } from "../middleware/auth.js";
import { hashPassword } from "../lib/password.js";
import { sendPartnerWelcomeEmail } from "../services/email.js";
import { serializeUser, userSelect } from "../serializers/user.js";
import { PartnerOrgType, PartnerApplicationStatus } from "@prisma/client";

import { env } from "../config/env.js";

export const partnerApplicationsRouter: Router = Router();

async function syncSupabaseAuthUser(
  email: string,
  password: string,
  name: string,
  existingSupabaseUid?: string | null
): Promise<string | null> {
  const url = env.supabase.url;
  const key = env.supabase.serviceRoleKey;
  if (!url || !key) return null;

  try {
    // 1. If we already have the Supabase UID, update the password directly
    if (existingSupabaseUid) {
      const updateRes = await fetch(`${url.replace(/\/$/, "")}/auth/v1/admin/users/${existingSupabaseUid}`, {
        method: "PUT",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          email_confirm: true,
          user_metadata: { name, role: "impact_partner" },
        }),
      });
      if (updateRes.ok) {
        return existingSupabaseUid;
      }
    }

    // 2. Try creating the user in Supabase Auth
    const createRes = await fetch(`${url.replace(/\/$/, "")}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: "impact_partner" },
      }),
    });

    if (createRes.ok) {
      const data = (await createRes.json()) as any;
      return data?.id ?? null;
    }

    // 3. If email already exists in Supabase Auth, find user and update password
    const errData = (await createRes.json().catch(() => null)) as any;
    if (createRes.status === 422 || errData?.error_code === "email_exists") {
      const listRes = await fetch(`${url.replace(/\/$/, "")}/auth/v1/admin/users?per_page=500`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
      if (listRes.ok) {
        const listData = (await listRes.json()) as any;
        const found = (listData?.users || []).find(
          (u: any) => String(u.email || "").toLowerCase() === email.toLowerCase()
        );
        if (found?.id) {
          await fetch(`${url.replace(/\/$/, "")}/auth/v1/admin/users/${found.id}`, {
            method: "PUT",
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              password,
              email_confirm: true,
              user_metadata: { name, role: "impact_partner" },
            }),
          });
          return found.id;
        }
      }
    }
  } catch (err) {
    console.warn("[partner-approval] Failed to sync user to Supabase Auth:", err);
  }
  return null;
}

const orgTypeSchema = z.enum(["entreprise", "club", "association", "institution"]);

const createApplicationSchema = z.object({
  organizationName: z.string().trim().min(2, "Le nom de l'organisation doit comporter au moins 2 caractères.").max(100),
  organizationType: orgTypeSchema,
  contactEmail: z.string().trim().email("Adresse email de contact invalide."),
  description: z.string().trim().max(2000).default(""),
});

function toPrismaOrgType(type: z.infer<typeof orgTypeSchema>): PartnerOrgType {
  switch (type) {
    case "entreprise":
      return PartnerOrgType.ENTREPRISE;
    case "club":
      return PartnerOrgType.CLUB;
    case "association":
      return PartnerOrgType.ASSOCIATION;
    case "institution":
      return PartnerOrgType.INSTITUTION;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

// ── Public submission ─────────────────────────────────────────────────────────

partnerApplicationsRouter.post("/", async (req, res) => {
  const input = createApplicationSchema.parse(req.body);

  const application = await prisma.partnerApplication.create({
    data: {
      organizationName: input.organizationName,
      organizationType: toPrismaOrgType(input.organizationType),
      contactEmail: input.contactEmail.toLowerCase(),
      description: input.description,
      status: PartnerApplicationStatus.PENDING,
    },
  });

  res.status(201).json({
    success: true,
    message: "Candidature reçue. Notre équipe vous recontacte sous 48h.",
    data: application,
  });
});

// ── Admin routes ─────────────────────────────────────────────────────────────

partnerApplicationsRouter.get("/pending", requireAuth, requireAdmin, async (_req, res) => {
  const pending = await prisma.partnerApplication.findMany({
    where: { status: PartnerApplicationStatus.PENDING },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: pending });
});

partnerApplicationsRouter.get("/", requireAuth, requireAdmin, async (req, res) => {
  const statusParam = req.query.status ? String(req.query.status).toUpperCase() : undefined;
  const statusFilter = statusParam && Object.values(PartnerApplicationStatus).includes(statusParam as any)
    ? (statusParam as PartnerApplicationStatus)
    : undefined;

  const applications = await prisma.partnerApplication.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: {
      reviewedBy: {
        select: { id: true, username: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: applications });
});

partnerApplicationsRouter.patch("/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw notFound("Candidature introuvable.");

  const application = await prisma.partnerApplication.findUnique({ where: { id } });
  if (!application) throw notFound("Candidature introuvable.");
  if (application.status === PartnerApplicationStatus.APPROVED) {
    throw badRequest("Cette candidature a déjà été approuvée.");
  }

  const admin = currentUser(req);

  // Generate unique username based on organization name
  const baseUsername = slugify(application.organizationName) || "partner";
  let username = baseUsername;
  let counter = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${baseUsername}-${counter++}`;
  }

  // Generate temporary password
  const tempPassword = `Partner-${crypto.randomBytes(4).toString("hex")}!`;
  const passwordHash = await hashPassword(tempPassword);

  // Synchronize user to Supabase Auth so standard login works immediately
  const existingUserRecord = await prisma.user.findUnique({
    where: { email: application.contactEmail },
    select: { id: true, supabaseUid: true },
  });

  const supabaseUid = await syncSupabaseAuthUser(
    application.contactEmail,
    tempPassword,
    application.organizationName,
    existingUserRecord?.supabaseUid
  );

  // Check if an account with this email already exists
  let user = await prisma.user.findUnique({
    where: { email: application.contactEmail },
    select: userSelect,
  });

  if (user) {
    // Elevate role to IMPACT_PARTNER
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "IMPACT_PARTNER",
        isVerified: true,
        passwordHash,
        ...(supabaseUid ? { supabaseUid } : {}),
      },
    });

    // Create or update partner profile
    await prisma.partnerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        organizationName: application.organizationName,
        organizationType: application.organizationType,
        isVerified: true,
        verifiedAt: new Date(),
        verifiedById: admin.id,
      },
      update: {
        organizationName: application.organizationName,
        organizationType: application.organizationType,
        isVerified: true,
        verifiedAt: new Date(),
        verifiedById: admin.id,
      },
    });
  } else {
    // Create new User account
    const createdUser = await prisma.user.create({
      data: {
        email: application.contactEmail,
        username,
        firstName: application.organizationName,
        lastName: "",
        passwordHash,
        role: "IMPACT_PARTNER",
        isVerified: true,
        bio: application.description.slice(0, 500),
        ...(supabaseUid ? { supabaseUid } : {}),
        partnerProfile: {
          create: {
            organizationName: application.organizationName,
            organizationType: application.organizationType,
            isVerified: true,
            verifiedAt: new Date(),
            verifiedById: admin.id,
          },
        },
      },
      select: userSelect,
    });
    user = createdUser;
  }

  // Update application status
  const updatedApp = await prisma.partnerApplication.update({
    where: { id },
    data: {
      status: PartnerApplicationStatus.APPROVED,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  // Send welcome email with credentials
  void sendPartnerWelcomeEmail(
    application.contactEmail,
    application.organizationName,
    tempPassword,
  );

  res.json({
    success: true,
    message: "Candidature approuvée et compte Impact Partner créé avec succès.",
    data: {
      application: updatedApp,
      user: serializeUser(user, { viewerId: admin.id }),
      email: application.contactEmail,
      username: user.username,
      tempPassword,
    },
  });
});

partnerApplicationsRouter.patch("/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw notFound("Candidature introuvable.");

  const admin = currentUser(req);
  const updatedApp = await prisma.partnerApplication.update({
    where: { id },
    data: {
      status: PartnerApplicationStatus.REJECTED,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  res.json({
    success: true,
    message: "Candidature rejetée.",
    data: updatedApp,
  });
});
