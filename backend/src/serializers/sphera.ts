/**
 * Sphera session serialisation — API_CONTRACT §2 `<StudySession>` / `<AnnaleSession>`.
 *
 * `extracted_text` is never serialised: it is up to 12 000 characters of source
 * document, and every list response would carry a copy per row. It is still
 * *persisted* — `has_qa` reports whether it is there, and both Q&A endpoints read
 * it server-side.
 */

import type { AnnaleSession, Resource, SphereFile, StudySession } from "@prisma/client";

type ResourceRef = Pick<Resource, "id" | "title" | "fileUrl"> | null;
type SphereRef = { id: number; name: string } | null;
type SphereFileRef = Pick<SphereFile, "id" | "title" | "fileUrl"> | null;

export type SerializableStudySession = StudySession & {
  owner: { username: string };
  resource: ResourceRef;
  sphereFile: SphereFileRef;
  sharedSphere: SphereRef;
};

export type SerializableAnnaleSession = AnnaleSession & {
  owner: { username: string };
  resource: ResourceRef;
  coursResource: ResourceRef;
  sharedSphere: SphereRef;
};

export const studySessionInclude = {
  owner: { select: { username: true } },
  resource: { select: { id: true, title: true, fileUrl: true } },
  sphereFile: { select: { id: true, title: true, fileUrl: true } },
  sharedSphere: { select: { id: true, name: true } },
};

export const annaleSessionInclude = {
  owner: { select: { username: true } },
  resource: { select: { id: true, title: true, fileUrl: true } },
  coursResource: { select: { id: true, title: true, fileUrl: true } },
  sharedSphere: { select: { id: true, name: true } },
};

/**
 * Title of the first generated tool, for list rows.
 *
 * Iterates `tool_types` rather than `Object.keys(content)` so the preview is
 * deterministic — JSON key order is stable in practice but is not a guarantee, and
 * a session's first *requested* tool is the meaningful one.
 */
function contentPreview(content: unknown, toolTypes: string[]): string {
  if (typeof content !== "object" || content === null) return "";
  const record = content as Record<string, unknown>;

  const keys = [...toolTypes.map((t) => t.toLowerCase()), ...Object.keys(record)];
  for (const key of keys) {
    const tool = record[key];
    if (typeof tool === "object" && tool !== null && "titre" in tool) {
      const titre = (tool as { titre?: unknown }).titre;
      if (typeof titre === "string") return titre;
    }
  }
  return "";
}

const lowerTools = (session: StudySession): string[] => session.toolTypes.map((t) => t.toLowerCase());

/** Full study session, including generated content and Q&A history. */
export function serializeStudySession(session: SerializableStudySession): Record<string, unknown> {
  return {
    id: session.id,
    owner: session.ownerId,
    owner_username: session.owner.username,
    resource: session.resourceId,
    resource_title: session.resource?.title ?? session.sourceFilename ?? "",
    resource_file_url: session.resource?.fileUrl ?? session.sphereFile?.fileUrl ?? null,
    // Distinct from `resource`: the two id spaces are independent. Conflating them
    // is exactly the bug this field exists to fix (FE-02).
    sphere_file: session.sphereFileId,
    source_filename: session.sourceFilename,
    tool_types: lowerTools(session),
    content: session.content ?? {},
    qa_history: session.qaHistory ?? [],
    has_qa: Boolean(session.extractedText),
    extracted_text: session.extractedText ?? "",
    is_shared: session.isShared,
    shared_in_sphere: session.sharedSphereId,
    sphere_name: session.sharedSphere?.name ?? null,
    created_at: session.createdAt.toISOString(),
    updated_at: session.updatedAt.toISOString(),
  };
}

/** List row: drops `content` and `qa_history`, adds `content_preview`. */
export function serializeStudySessionListItem(session: SerializableStudySession): Record<string, unknown> {
  return {
    id: session.id,
    resource: session.resourceId,
    resource_title: session.resource?.title ?? session.sphereFile?.title ?? session.sourceFilename ?? "Document personnel",
    sphere_file: session.sphereFileId,
    source_filename: session.sourceFilename,
    tool_types: lowerTools(session),
    content_preview: contentPreview(session.content, lowerTools(session)),
    has_qa: Boolean(session.extractedText),
    is_shared: session.isShared,
    shared_in_sphere: session.sharedSphereId,
    sphere_name: session.sharedSphere?.name ?? null,
    created_at: session.createdAt.toISOString(),
  };
}

export function serializeAnnaleSession(session: SerializableAnnaleSession): Record<string, unknown> {
  return {
    id: session.id,
    owner: session.ownerId,
    owner_username: session.owner.username,
    mode: session.mode.toLowerCase(),
    source_filename: session.sourceFilename,
    resource: session.resourceId,
    source_title: session.resource?.title ?? session.sourceFilename ?? "Annale",
    resource_file_url: session.resource?.fileUrl ?? null,
    cours_resource: session.coursResourceId,
    cours_title: session.coursResource?.title ?? null,
    content: session.content ?? {},
    qa_history: session.qaHistory ?? [],
    has_qa: Boolean(session.extractedText),
    extracted_text: session.extractedText ?? "",
    tool_types: ["annale"],
    is_shared: session.isShared,
    shared_in_sphere: session.sharedSphereId,
    sphere_name: session.sharedSphere?.name ?? null,
    created_at: session.createdAt.toISOString(),
    updated_at: session.updatedAt.toISOString(),
  };
}

/**
 * Number of corrected questions.
 *
 * **[CHANGE]** Django read `content["corrections"]`, a key the generator has never
 * produced — the annale prompts emit `sections[].questions[]`. Every list row
 * therefore reported 0. Counted properly here.
 */
export function correctionsCount(content: unknown): number {
  if (typeof content !== "object" || content === null) return 0;
  const sections = (content as { sections?: unknown }).sections;
  if (!Array.isArray(sections)) return 0;

  return sections.reduce<number>((total, section) => {
    const questions = (section as { questions?: unknown } | null)?.questions;
    return total + (Array.isArray(questions) ? questions.length : 0);
  }, 0);
}

export function serializeAnnaleSessionListItem(session: SerializableAnnaleSession): Record<string, unknown> {
  return {
    id: session.id,
    mode: session.mode.toLowerCase(),
    source_filename: session.sourceFilename,
    resource: session.resourceId,
    source_title: session.resource?.title ?? session.sourceFilename ?? "Annale",
    corrections_count: correctionsCount(session.content),
    is_shared: session.isShared,
    shared_in_sphere: session.sharedSphereId,
    sphere_name: session.sharedSphere?.name ?? null,
    created_at: session.createdAt.toISOString(),
  };
}
