/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiFetch, getAccessToken, unwrapList, unwrapItem, normalizeUsers } from "./client";
import type { PartnerApplication, UserProfile } from "@/types";

export interface CreatePartnerApplicationInput {
  organizationName: string;
  organizationType: string;
  contactEmail: string;
  description?: string;
}

export async function submitPartnerApplication(data: CreatePartnerApplicationInput): Promise<any> {
  return apiFetch("api/partner-applications/", {
    method: "POST",
    body: data,
  });
}

export async function getPendingPartnerApplications(token?: string): Promise<PartnerApplication[]> {
  const res = await apiFetch<any>("api/partner-applications/pending/", {
    token: token || getAccessToken(),
  });
  return unwrapList(res);
}

export async function getPartnerApplications(status?: string, token?: string): Promise<PartnerApplication[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await apiFetch<any>(`api/partner-applications/${query}`, {
    token: token || getAccessToken(),
  });
  return unwrapList(res);
}

export async function approvePartnerApplication(id: number | string, token?: string): Promise<any> {
  return apiFetch(`api/partner-applications/${id}/approve/`, {
    method: "PATCH",
    token: token || getAccessToken(),
  });
}

export async function rejectPartnerApplication(id: number | string, token?: string): Promise<any> {
  return apiFetch(`api/partner-applications/${id}/reject/`, {
    method: "PATCH",
    token: token || getAccessToken(),
  });
}

export async function followPartner(
  partnerId: number | string,
  token?: string,
): Promise<{ isFollowing: boolean; followersCount: number }> {
  const res = await apiFetch<any>(`api/partners/${partnerId}/follow/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
  return unwrapItem(res) || { isFollowing: true, followersCount: 0 };
}

export async function unfollowPartner(
  partnerId: number | string,
  token?: string,
): Promise<{ isFollowing: boolean; followersCount: number }> {
  const res = await apiFetch<any>(`api/partners/${partnerId}/follow/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
  return unwrapItem(res) || { isFollowing: false, followersCount: 0 };
}

export async function getPartnerFollowersCount(partnerId: number | string): Promise<number> {
  const res = await apiFetch<any>(`api/partners/${partnerId}/followers-count/`);
  const data = unwrapItem(res);
  return data?.count ?? 0;
}

export async function checkIsFollowingPartner(partnerId: number | string, token?: string): Promise<boolean> {
  const res = await apiFetch<any>(`api/partners/${partnerId}/is-following/`, {
    token: token || getAccessToken(),
  });
  const data = unwrapItem(res);
  return Boolean(data?.isFollowing);
}

export async function getImpactPartners(): Promise<UserProfile[]> {
  const res = await apiFetch<any>("api/partners/");
  return normalizeUsers(unwrapList(res));
}
