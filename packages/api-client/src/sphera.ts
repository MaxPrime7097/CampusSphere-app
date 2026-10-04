/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiFetch } from "./client";
import type {
  StudySession,
  StudySessionListItem,
  AnnaleSession,
  AnnaleSessionListItem,
  ToolType,
  AnnaleMode,
  GenerationQuota,
  QAMessage,
  ApiResponse,
} from "@cs/types";

// ===========================================================================
// StudySessions : Génération
// ===========================================================================

export async function generateStudyTools(
  resourceIdOrParams: string | number | { resource_id?: string | number; sphere_file_id?: string | number; tool_types: ToolType[] },
  maybeToolTypes?: ToolType[]
): Promise<ApiResponse<StudySession>> {
  const isObj = typeof resourceIdOrParams === "object";
  const resourceId = isObj ? resourceIdOrParams.resource_id : resourceIdOrParams;
  const sphereFileId = isObj ? resourceIdOrParams.sphere_file_id : undefined;
  const toolTypes = isObj ? resourceIdOrParams.tool_types : (maybeToolTypes || []);

  const body: Record<string, any> = {
    tool_types: JSON.stringify(toolTypes),
  };
  if (sphereFileId !== undefined) {
    body.sphere_file_id = sphereFileId;
  } else if (resourceId !== undefined) {
    body.resource_id = resourceId;
  }

  return apiFetch<ApiResponse<StudySession>>("api/sphera/generate/from-resource/", {
    method: "POST",
    body: body as any,
  });
}

export async function generateStudyToolsFromUpload(params: {
  file: File;
  tool_types: ToolType[];
}): Promise<ApiResponse<StudySession>> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("tool_types", JSON.stringify(params.tool_types));
  return apiFetch<ApiResponse<StudySession>>("api/sphera/generate/from-upload/", {
    method: "POST",
    body: formData,
  });
}

export async function generateFromUpload(
  file: File,
  toolTypes: ToolType[]
): Promise<ApiResponse<StudySession>> {
  return generateStudyToolsFromUpload({ file, tool_types: toolTypes });
}

export async function generateMindmap(params: {
  file?: File;
  resource_id?: string | number;
  sphere_file_id?: string | number;
}): Promise<ApiResponse<StudySession>> {
  if (params.file) {
    const formData = new FormData();
    formData.append("file", params.file);
    return apiFetch<ApiResponse<StudySession>>("api/sphera/generate/mindmap/", { method: "POST", body: formData });
  }
  return apiFetch<ApiResponse<StudySession>>("api/sphera/generate/mindmap/", {
    method: "POST",
    body: {
      resource_id: params.resource_id,
      sphere_file_id: params.sphere_file_id,
    } as any,
  });
}

export async function generateAudioSummary(params: {
  file?: File;
  resource_id?: string | number;
  sphere_file_id?: string | number;
}): Promise<ApiResponse<StudySession>> {
  if (params.file) {
    const formData = new FormData();
    formData.append("file", params.file);
    return apiFetch<ApiResponse<StudySession>>("api/sphera/generate/audio/", { method: "POST", body: formData });
  }
  return apiFetch<ApiResponse<StudySession>>("api/sphera/generate/audio/", {
    method: "POST",
    body: {
      resource_id: params.resource_id,
      sphere_file_id: params.sphere_file_id,
    } as any,
  });
}

// ===========================================================================
// StudySessions : CRUD
// ===========================================================================

export async function getStudySessions(toolType?: ToolType): Promise<ApiResponse<StudySessionListItem[]>> {
  const query = toolType ? `?tool_type=${toolType}` : "";
  return apiFetch<ApiResponse<StudySessionListItem[]>>(`api/sphera/sessions/${query}`);
}

export async function getStudySession(id: string | number): Promise<ApiResponse<StudySession>> {
  return apiFetch<ApiResponse<StudySession>>(`api/sphera/sessions/${id}/`);
}

export async function deleteStudySession(id: string | number): Promise<void> {
  return apiFetch<void>(`api/sphera/sessions/${id}/`, { method: "DELETE" });
}

export async function addToolToSession(
  sessionId: string | number,
  toolType: ToolType
): Promise<ApiResponse<StudySession>> {
  return apiFetch<ApiResponse<StudySession>>(`api/sphera/sessions/${sessionId}/add-tool/`, {
    method: "PATCH",
    body: { tool_type: toolType } as any,
  });
}

export async function shareStudySession(
  sessionId: string | number,
  sphereId: string | number
): Promise<ApiResponse<StudySession>> {
  return apiFetch<ApiResponse<StudySession>>(`api/sphera/sessions/${sessionId}/share/`, {
    method: "POST",
    body: { sphere_id: sphereId } as any,
  });
}

export async function unshareStudySession(sessionId: string | number): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`api/sphera/sessions/${sessionId}/share/`, { method: "DELETE" });
}

export async function getSphereStudySessions(
  sphereId: string | number
): Promise<ApiResponse<StudySessionListItem[]>> {
  return apiFetch<ApiResponse<StudySessionListItem[]>>(`api/sphera/sphere/${sphereId}/`);
}

// ===========================================================================
// Q&A sur le cours
// ===========================================================================

export async function askStudyQuestion(
  sessionId: string | number,
  question: string
): Promise<ApiResponse<QAMessage>> {
  return apiFetch<ApiResponse<QAMessage>>(`api/sphera/sessions/${sessionId}/ask/`, {
    method: "POST",
    body: { question } as any,
  });
}

// ===========================================================================
// Annales : Génération & CRUD
// ===========================================================================

export async function generateAnnale(params: {
  file?: File;
  resource_id?: string | number;
  mode: AnnaleMode;
  cours_resource_id?: string | number;
}): Promise<ApiResponse<AnnaleSession>> {
  const formData = new FormData();
  formData.append("mode", params.mode);
  if (params.file) formData.append("file", params.file);
  if (params.resource_id) formData.append("resource_id", String(params.resource_id));
  if (params.cours_resource_id) formData.append("cours_resource_id", String(params.cours_resource_id));
  return apiFetch<ApiResponse<AnnaleSession>>("api/sphera/generate/annale/", { method: "POST", body: formData });
}

export async function getAnnaleSessions(): Promise<ApiResponse<AnnaleSessionListItem[]>> {
  return apiFetch<ApiResponse<AnnaleSessionListItem[]>>("api/sphera/annales/");
}

export async function getAnnaleSession(id: string | number): Promise<ApiResponse<AnnaleSession>> {
  return apiFetch<ApiResponse<AnnaleSession>>(`api/sphera/annales/${id}/`);
}

export async function deleteAnnaleSession(id: number | string): Promise<void> {
  return apiFetch<void>(`api/sphera/annales/${id}/`, { method: "DELETE" });
}

export async function shareAnnaleSession(
  id: string | number,
  sphereId: string | number
): Promise<ApiResponse<AnnaleSession>> {
  return apiFetch<ApiResponse<AnnaleSession>>(`api/sphera/annales/${id}/share/`, {
    method: "POST",
    body: { sphere_id: sphereId } as any,
  });
}

export async function unshareAnnaleSession(id: string | number): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`api/sphera/annales/${id}/share/`, { method: "DELETE" });
}

export async function getSphereAnnaleSessions(
  sphereId: string | number
): Promise<ApiResponse<AnnaleSessionListItem[]>> {
  return apiFetch<ApiResponse<AnnaleSessionListItem[]>>(`api/sphera/sphere/${sphereId}/annales/`);
}

// ===========================================================================
// Quota hebdomadaire
// ===========================================================================

export async function getGenerationQuota(): Promise<ApiResponse<GenerationQuota>> {
  return apiFetch<ApiResponse<GenerationQuota>>("api/sphera/quota/");
}
