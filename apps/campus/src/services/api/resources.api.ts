/* eslint-disable @typescript-eslint/no-explicit-any */
import { normalizeResourceType } from "@/constants/resourceTypes";
import {
  API_BASE_URL,
  ApiRequestError,
  apiFetch,
  getAccessToken,
  getRefreshToken,
  normalizeResource,
  normalizeResources,
  parseBackendError,
  performRefreshRaw,
  setTokens,
  unwrapItem,
  unwrapList,
} from "./client";

function extractFilenameFromDisposition(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;

  const utf8Match = disposition.match(/filename\*\s*=\s*UTF-8''([^;\r\n]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
    } catch {
      // Fall through to standard filename parameter
    }
  }

  const quotedMatch = disposition.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch?.[1]) return quotedMatch[1].trim();

  const plainMatch = disposition.match(/filename\s*=\s*([^;\r\n]+)/i);
  if (plainMatch?.[1]) return plainMatch[1].trim();

  return fallback;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Keep object URL alive long enough for Safari/iOS/Firefox and large files
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
}

export async function downloadUrlAsFile(url: string, filename: string): Promise<void> {
  if (typeof window === "undefined" || !url) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const resolvedName = extractFilenameFromDisposition(
      response.headers.get("content-disposition"),
      filename,
    );
    triggerBlobDownload(blob, resolvedName);
  } catch {
    // Fallback if cross-origin storage blocks fetch
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

async function fetchWithAuthRefresh(
  url: string,
  options: { method?: string; token?: string } = {},
): Promise<Response> {
  const { method = "GET", token } = options;
  const effectiveToken = token || getAccessToken();

  const doFetch = (bearer?: string) =>
    fetch(url, {
      method,
      headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
      credentials: "include",
    });

  let response = await doFetch(effectiveToken);

  if (response.status === 401 && !token) {
    const refresh = getRefreshToken();
    if (refresh) {
      const nextToken = await performRefreshRaw(refresh).catch((): null => null);
      if (nextToken && nextToken !== "TEMPORARY_ERROR") {
        setTokens(nextToken, refresh);
        response = await doFetch(nextToken);
      }
    }
  }

  return response;
}

// ============================================================================
// RESOURCE FOLDERS
// ============================================================================

import type { ResourceFolder } from "@/types";
export type { ResourceFolder };

export async function listFolders(token?: string): Promise<ResourceFolder[]> {
  const authToken = token || getAccessToken();
  if (!authToken) return [];
  try {
    const response = await apiFetch<any>("api/resources/folders/", {
      token: authToken,
    });
    return unwrapList<ResourceFolder>(response);
  } catch {
    return [];
  }
}

export async function createFolder(
  data: { name: string; description?: string; visibility?: string },
  token?: string
): Promise<ResourceFolder> {
  const response = await apiFetch<any>("api/resources/folders/", {
    method: "POST",
    body: data,
    token: token || getAccessToken(),
  });
  return unwrapItem<ResourceFolder>(response) as ResourceFolder;
}

export async function getFolderDetail(id: number | string, token?: string): Promise<ResourceFolder> {
  const response = await apiFetch<any>(`api/resources/folders/${id}/`, {
    token: token || getAccessToken(),
  });
  return unwrapItem<ResourceFolder>(response) as ResourceFolder;
}

export async function updateFolder(
  id: number | string,
  data: { name?: string; description?: string; visibility?: string },
  token?: string
): Promise<ResourceFolder> {
  const response = await apiFetch<any>(`api/resources/folders/${id}/`, {
    method: "PUT",
    body: data,
    token: token || getAccessToken(),
  });
  return unwrapItem<ResourceFolder>(response) as ResourceFolder;
}

export async function deleteFolder(id: number | string, token?: string) {
  return apiFetch<any>(`api/resources/folders/${id}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function downloadFolderZip(id: number | string, name: string, token?: string) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}/api/resources/folders/${id}/download/`;
  const response = await fetchWithAuthRefresh(url, { method: "GET", token });
  if (!response.ok) {
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("application/json")) {
      const errJson = await response.json().catch((): null => null);
      throw new Error(
        errJson?.detail || errJson?.error || errJson?.message || `Erreur lors du téléchargement: ${response.status}`
      );
    }
    throw new Error(`Erreur lors du téléchargement: ${response.status}`);
  }
  const blob = await response.blob();
  const filename = extractFilenameFromDisposition(
    response.headers.get("content-disposition"),
    `${name}.zip`
  );
  triggerBlobDownload(blob, filename);
}

export async function addResourceToFolder(
  folderId: number | string,
  resourceId: number | string,
  token?: string
): Promise<{ success: boolean; message?: string }> {
  const response = await apiFetch<any>(`api/resources/folders/${folderId}/items/`, {
    method: "POST",
    body: { resource_id: Number(resourceId) },
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function removeResourceFromFolder(
  folderId: number | string,
  resourceId: number | string,
  token?: string
): Promise<{ success: boolean; message?: string }> {
  const response = await apiFetch<any>(`api/resources/folders/${folderId}/items/${resourceId}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function getUserResourceFolders(
  resourceId: number | string,
  token?: string
): Promise<number[]> {
  try {
    const response = await apiFetch<any>(`api/resources/user/resource-folders/${resourceId}/`, {
      token: token || getAccessToken(),
    });
    return unwrapList<number>(response);
  } catch {
    return [];
  }
}

// ============================================================================
// RESOURCES CRUD
// ============================================================================

export async function listResources(params?: Record<string, string | number>, token?: string) {
  const query = params && Object.keys(params).length > 0
    ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`
    : "";
  const response = await apiFetch<any>(`api/resources/${query}`, { token: token || getAccessToken() });
  return normalizeResources(unwrapList(response));
}

export async function getResource(id: number | string, token?: string) {
  const response = await apiFetch<any>(`api/resources/${id}/`, { token: token || getAccessToken() });
  return normalizeResource(unwrapItem(response));
}

export function createResource(
  data: FormData,
  token?: string,
  onProgress?: (progress: number) => void,
  onXhrCreated?: (xhr: XMLHttpRequest) => void
): Promise<any> {
  const rawType = data.get("type");
  if (typeof rawType === "string" && rawType) {
    data.set("type", normalizeResourceType(rawType));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (onXhrCreated) {
      onXhrCreated(xhr);
    }
    const url = `${API_BASE_URL.replace(/\/$/, "")}/api/resources/`;
    const effectiveToken = token || getAccessToken();

    xhr.open("POST", url);
    if (effectiveToken) {
      xhr.setRequestHeader("Authorization", `Bearer ${effectiveToken}`);
    }

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(normalizeResource(unwrapItem(response)));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        try {
          const errJson = JSON.parse(xhr.responseText);
          const errMsg = parseBackendError(errJson, xhr.status);
          reject(new ApiRequestError(errMsg || `Request failed: ${xhr.status}`, xhr.status));
        } catch {
          reject(new ApiRequestError(xhr.responseText || `Request failed: ${xhr.status}`, xhr.status));
        }
      }
    };

    xhr.onerror = () => reject(new ApiRequestError("Network error", 0));
    xhr.send(data);
  });
}

export async function updateResource(
  id: number | string,
  data: Partial<{
    title: string;
    description: string;
    category: string;
    tags: string[];
    folder_id: number | null;
  }>,
  token?: string
) {
  const response = await apiFetch<any>(`api/resources/${id}/`, {
    method: "PATCH",
    body: data,
    token: token || getAccessToken(),
  });
  return normalizeResource(unwrapItem(response));
}

export async function deleteResource(id: number | string, token?: string) {
  return apiFetch<any>(`api/resources/${id}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

function notifyResourceDownloaded(id: number | string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("resource-downloaded", { detail: { resourceId: String(id) } })
  );
}

export async function downloadResource(
  id: number | string,
  token?: string,
  options: { triggerDownload?: boolean } = { triggerDownload: true }
) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}/api/resources/${id}/download/`;
  const response = await fetchWithAuthRefresh(url, { method: "POST", token });
  const contentType = (response.headers.get("content-type") || "").toLowerCase();

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const errJson = await response.json().catch((): null => null);
      throw new Error(errJson?.detail || errJson?.error || errJson?.message || `Request failed: ${response.status}`);
    }

    const text = await response.text().catch((): string => "");
    throw new Error(text || `Request failed: ${response.status}`);
  }

  // Handle JSON fallback when backend cannot proxy an external storage URL directly
  if (contentType.includes("application/json")) {
    const json = await response.json().catch((): null => null);
    const payload = unwrapItem<any>(json) ?? json;
    const fallbackUrl = payload?.download_url ?? payload?.downloadUrl ?? payload?.file_url ?? payload?.fileUrl;
    const fallbackName = payload?.filename || `resource-${id}`;
    if (fallbackUrl) {
      if (options.triggerDownload !== false && typeof window !== "undefined") {
        await downloadUrlAsFile(fallbackUrl, fallbackName);
      }
      notifyResourceDownloaded(id);
      return { blob: new Blob(), filename: fallbackName };
    }
  }

  const blob = await response.blob();
  const filename = extractFilenameFromDisposition(
    response.headers.get("content-disposition"),
    `resource-${id}`
  );

  if (options.triggerDownload !== false && typeof window !== "undefined") {
    triggerBlobDownload(blob, filename);
  }

  notifyResourceDownloaded(id);
  return { blob, filename };
}

export async function getResourcePreviewUrl(id: number | string, token?: string) {
  const response = await apiFetch<any>(`api/resources/${id}/preview/`, {
    token: token || getAccessToken(),
  });
  const payload = unwrapItem<any>(response);

  return (payload?.preview_url ?? payload?.previewUrl ?? null) as string | null;
}

export async function saveResource(id: number | string, token?: string) {
  return apiFetch<any>(`api/resources/${id}/save/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function getSavedResources(token?: string) {
  const authToken = token || getAccessToken();
  if (!authToken) return [];
  try {
    const response = await apiFetch<any>("api/resources/saved/", { token: authToken });
    return normalizeResources(unwrapList(response));
  } catch {
    return [];
  }
}

export async function getUserResources(userId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/resources/user/${userId}/`, { token: token || getAccessToken() });
  return normalizeResources(unwrapList(response));
}

export async function reportResource(
  id: number | string,
  payload: { reason?: string; details?: string } = {},
  token?: string
) {
  return apiFetch<any>(`api/resources/${id}/report/`, {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
}

export async function trackResourceShare(
  id: number | string,
  payload: { channel?: string } = { channel: "copy_link" },
  token?: string
) {
  return apiFetch<any>(`api/resources/${id}/share/`, {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
}

export async function impactRateResource(
  id: number | string,
  value: number | null,
  previous?: number | null,
  token?: string
) {
  const response = await apiFetch<any>(`api/resources/${id}/impact-rate/`, {
    method: "POST",
    body: { value, previous },
    token: token || getAccessToken(),
  });
  return unwrapItem<{ impactScore: number; userImpactRating: number | null }>(response);
}

