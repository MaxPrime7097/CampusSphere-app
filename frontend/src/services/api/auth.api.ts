/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/lib/supabase";
import {
  apiFetch,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  normalizeUser,
  performRefreshRaw,
  setTokens,
  withSupabaseRateLimitError,
} from "./client";

// ============================================================================
// SUPABASE AUTH
// ============================================================================

export async function supabaseSignUp(
  email: string,
  password: string,
  metadata: { first_name: string; last_name: string; username: string }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/register?verified=true`,
    },
  });
  if (error) withSupabaseRateLimitError(error);
  return data;
}

export async function supabaseSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function supabaseSignInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw new Error(error.message);
}

export async function supabaseSignInWithFacebook() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw new Error(error.message);
}

export async function supabaseResetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) withSupabaseRateLimitError(error);
}

export async function supabaseResendSignupEmail(email: string) {
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) withSupabaseRateLimitError(error);
}

export async function supabaseSignOut() {
  await supabase.auth.signOut();
}

export async function exchangeSupabaseToken(supabaseAccessToken: string) {
  const response = await apiFetch<{
    success: boolean;
    data: {
      tokens: { accessToken: string; refreshToken: string };
      user: any;
      needs_profile_completion?: boolean;
      is_new_user?: boolean;
    };
  }>("api/auth/supabase/exchange/", {
    method: "POST",
    body: { access_token: supabaseAccessToken },
  });
  const tokens = response?.data?.tokens;
  if (tokens?.accessToken) {
    setTokens(tokens.accessToken, tokens.refreshToken);
  }
  return response;
}

export async function completeSupabaseProfile(data: {
  username?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  university?: string;
  faculty?: string;
  study_year?: string;
  student_id?: string;
  campus?: string;
  town?: string;
  language?: string[];
  bio?: string;
  skills?: string[];
  interests?: string[];
  previous_education?: any[];
  experiences?: any[];
  portfolio_links?: any[];
}) {
  const response = await apiFetch<any>("api/auth/supabase/complete-profile/", {
    method: "POST",
    body: data,
  });
  return normalizeUser(response?.data ?? response);
}

export async function verifyStudentStatus(matricule: string, cardImage: File) {
  const formData = new FormData();
  formData.append("student_id", matricule);
  formData.append("card_image", cardImage);

  const response = await apiFetch<any>("api/users/me/verify/", {
    method: "POST",
    body: formData,
  });
  return response;
}

// ============================================================================
// APPLICATION AUTH & ACCOUNT LIFECYCLE
// ============================================================================

export async function register(payload: {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  university?: string;
  faculty?: string;
  study_year?: string;
  student_id?: string;
  campus?: string;
  town?: string;
  language?: string[];
  bio?: string;
  skills?: string[];
  interests?: string[];
  previous_education?: Array<{ degree: string; school: string; year: string }>;
  experiences?: Array<{ title: string; company: string; duration: string; description: string }>;
  portfolio_links?: Array<{ name: string; url: string }>;
}) {
  return apiFetch<{
    success: boolean;
    data: { user: any; tokens: { accessToken: string; refreshToken: string } };
    message: string;
  }>("api/users/auth/register/", { method: "POST", body: payload });
}

export async function checkUserAvailability(payload: { email?: string; username?: string }) {
  return apiFetch<{
    success: boolean;
    data: {
      email: { value: string; available: boolean };
      username: { value: string; available: boolean };
    };
    field_messages: Record<string, string>;
  }>("api/users/check-availability/", {
    method: "POST",
    body: payload,
  });
}

export async function login(payload: { email: string; password: string }) {
  const response = await apiFetch<{
    success: boolean;
    data: { user: any; tokens: { accessToken: string; refreshToken: string } };
    message: string;
  }>("api/users/auth/login/", { method: "POST", body: payload });

  const dataAny = (response as any)?.data ?? (response as any);
  const access = dataAny?.tokens?.accessToken || dataAny?.tokens?.access || dataAny?.access || null;
  const refresh = dataAny?.tokens?.refreshToken || dataAny?.tokens?.refresh || null;
  setTokens(access, refresh);

  return response;
}

export async function refreshToken(refresh: string) {
  return performRefreshRaw(refresh);
}

export async function changeUserPassword(payload: { current_password: string; new_password: string }, token?: string) {
  return apiFetch<any>("api/users/auth/change-password/", {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
}

export async function changeUserEmail(payload: { current_email: string; new_email: string }, token?: string) {
  const response = await apiFetch<any>("api/users/auth/change-email/", {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
  return normalizeUser(response?.data ?? response);
}

export async function logoutUser(token?: string) {
  const refresh = getRefreshToken();
  try {
    await apiFetch<any>("api/users/auth/logout/", {
      method: "POST",
      body: refresh ? { refresh } : {},
      token: token || getAccessToken(),
    });
  } finally {
    clearTokens();
  }
}

export async function deleteUserAccount(confirmationText: string, token?: string) {
  try {
    await apiFetch<any>("api/users/auth/delete-account/", {
      method: "DELETE",
      body: { confirmation_text: confirmationText },
      token: token || getAccessToken(),
    });
  } finally {
    clearTokens();
  }
}
