/* eslint-disable @typescript-eslint/no-explicit-any */
import { normalizeResourceType } from "@/constants/resourceTypes";
import {
  API_BASE_URL,
  ApiRequestError,
  apiFetch,
  getAccessToken,
  normalizeResource,
  normalizeResources,
  parseBackendError,
  unwrapItem,
  unwrapList,
} from "./client";

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
  const effectiveToken = token || getAccessToken();
  const url = `${API_BASE_URL.replace(/\/$/, "")}/api/resources/folders/${id}/download/`;
  const response = await fetch(url, {
    headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {},
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Erreur lors du téléchargement: ${response.status}`);
  }
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${name}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
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
  onProgress?: (progress: number) => void
): Promise<any> {
  const rawType = data.get("type");
  if (typeof rawType === "string" && rawType) {
    data.set("type", normalizeResourceType(rawType));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
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

export async function downloadResource(id: number | string, token?: string) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}/api/resources/${id}/download/`;
  const effectiveToken = token || getAccessToken();

  const response = await fetch(url, {
    method: "POST",
    headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {},
    credentials: "include",
  });

  if (!response.ok) {
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("application/json")) {
      const errJson = await response.json().catch((): null => null);
      throw new Error(errJson?.detail || errJson?.error || errJson?.message || `Request failed: ${response.status}`);
    }

    const text = await response.text().catch((): string => "");
    throw new Error(text || `Request failed: ${response.status}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  const filename = filenameMatch?.[1] || `resource-${id}`;

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
