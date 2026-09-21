/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiFetch } from "./client";

// ============================================================================
// STUDY TOOLS (Assistant IA de révision)
// ============================================================================
// [BE-MIGRATION FE-06] The 8 functions below call the legacy `api/study/` alias. The Node backend
// keeps the alias, so this is non-breaking, but `api/sphera/` is canonical — src/sphera/services/
// spheraService.ts already uses it. Migrate when convenient. — documentation/FRONTEND_CHANGES.md

// [BE-MIGRATION FE-02] Node backend accepts `resource_id` OR `sphere_file_id` (exactly one).
// Add an optional sphereFileId arg and send it instead of resource_id when the source is a
// sphere file. — documentation/FRONTEND_CHANGES.md
export type ApiStudyToolType = "fiche" | "quiz" | "flashcards" | "mindmap" | "audio";

export async function generateStudyTools(
  resourceId: string | number,
  toolTypes: ApiStudyToolType[]
) {
  const response = await apiFetch<any>("api/study/generate/from-resource/", {
    method: "POST",
    body: { resource_id: resourceId, tool_types: toolTypes },
  });
  return response;
}

export async function generateFromUpload(
  file: File,
  toolTypes: ApiStudyToolType[]
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tool_types", JSON.stringify(toolTypes));
  const response = await apiFetch<any>("api/study/generate/from-upload/", {
    method: "POST",
    body: formData,
  });
  return response;
}

export async function getStudySessions(toolType?: ApiStudyToolType) {
  const query = toolType ? `?tool_type=${toolType}` : "";
  const response = await apiFetch<any>(`api/study/sessions/${query}`);
  return response;
}

export async function getStudySession(id: string | number) {
  const response = await apiFetch<any>(`api/study/sessions/${id}/`);
  return response;
}

export async function deleteStudySession(id: string | number) {
  return apiFetch<any>(`api/study/sessions/${id}/`, { method: "DELETE" });
}

export async function shareStudySession(sessionId: string | number, sphereId: string | number) {
  const response = await apiFetch<any>(`api/study/sessions/${sessionId}/share/`, {
    method: "POST",
    body: { sphere_id: typeof sphereId === 'string' ? parseInt(sphereId, 10) : sphereId },
  });
  return response;
}

export async function unshareStudySession(sessionId: string | number) {
  const response = await apiFetch<any>(`api/study/sessions/${sessionId}/share/`, {
    method: "DELETE",
  });
  return response;
}

export async function getSphereStudySessions(sphereId: string | number) {
  const response = await apiFetch<any>(`api/study/sphere/${sphereId}/`);
  return response;
}
