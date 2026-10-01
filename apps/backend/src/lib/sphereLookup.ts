import { parseSlugId } from "./hashids.js";
/**
 * Reusable sphere ID resolver.
 *
 * Handles numeric IDs ("1"), slugged IDs from URLs ("1-b-eng-cse-2"),
 * and fallback name matching ("b-eng-cse-2").
 */

import { prisma } from "./prisma.js";
import { notFound } from "./errors.js";

export async function resolveSphereId(raw: unknown): Promise<number> {
  if (typeof raw === "number" && Number.isInteger(raw) && raw > 0) {
    return raw;
  }

  const str = String(raw ?? "").trim();
  if (!str) throw notFound("Sphere not found.");

  const parsed = parseSlugId(str);
  if (parsed && Number.isInteger(parsed) && parsed > 0) return parsed;

  // Fallback: search sphere by name
  const cleaned = str.replace(/-/g, " ");
  const sphere = await prisma.sphere.findFirst({
    where: {
      OR: [
        { name: { equals: cleaned, mode: "insensitive" } },
        { name: { contains: cleaned, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });

  if (sphere) return sphere.id;
  throw notFound("Sphere not found.");
}
